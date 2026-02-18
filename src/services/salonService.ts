import {
  collection,
  doc,
  writeBatch,
  updateDoc,
  deleteDoc,

  getDocs,
  query,
  where,
  limit,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { clamp } from "../utils/helpers";
import type {
  AppUser,
  ServiceItem,
  ExtraItem,
  PaymentMethod,
  Service,
  
  
  CatalogService,
  CreateServicePayload,
  InventoryItem,
} from "../types";
import { 
  calculateTotalReplenishmentCost, 
  deductInventoryByRecipe, 
  restoreInventoryByRecipe, 
  batchDeductInventoryByRecipe,
  batchRestoreInventoryByRecipe,
} from "./inventoryService";

export interface NewServiceState {
  date: string;
  client: string;
  services: ServiceItem[];
  extras: ExtraItem[];
  paymentMethod: PaymentMethod;
}
// ====== Commission Helpers ======

export const getCommissionPctForService = (
  s: Service,
  users: AppUser[]
): number => {
  if (typeof s.commissionPct === "number")
    return clamp(s.commissionPct, 0, 100);
  const u = users.find((user) => user.id === s.userId);
  return clamp(u?.commissionPct ?? 0, 0, 100);
};

export const calcCommissionAmount = (
  s: Service,
  users: AppUser[]
): number => {
  const pct = getCommissionPctForService(s, users);
  const cost = Number(s.cost) || 0;
  return (cost * pct) / 100;
};

// ====== Helper Functions (Imported from inventoryService) ======
// deductConsumables and calculateTotalReplenishmentCost are now imported


// ====== Main Service Functions ======

// ====== Main Service Functions ======

export const addService = async (
  currentUser: AppUser,
  newService: NewServiceState,
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[],
  totalCost: number,
): Promise<void> => {
  if (!newService.client || newService.services.length === 0) {
    throw new Error("Completa cliente y al menos un servicio");
  }

  if (totalCost <= 0) {
    throw new Error("Costo inválido");
  }

  if (!currentUser.tenantId) {
    throw new Error("Error de sesión: No se identificó la organización (tenantId).");
  }

  const commissionPct = clamp(Number(currentUser.commissionPct || 0), 0, 100);
  // Calcular el costo total de reposición sumando todos los servicios
  const totalReposicion = calculateTotalReplenishmentCost(
    newService.services,
    catalogServices,
    inventoryItems
  );

  // 1. INICIAR EL LOTE (El Camión) 🚚
  const batch = writeBatch(db);

  // ====== AUTOMATIZACIÓN DE CLIENTES (Dentro del Batch) ======
  try {
    const clientName = newService.client.trim();
    if (clientName) {
      const clientsRef = collection(db, "clients");
      // Importante: Leer antes de escribir en batch
      const q = query(clientsRef, where("name", "==", clientName), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Crear nuevo cliente
        const newClientRef = doc(clientsRef); // Generar ID automático
        batch.set(newClientRef, {
          name: clientName,
          firstVisit: newService.date,
          lastVisit: newService.date,
          totalSpent: parseFloat(totalCost.toFixed(2)),
          totalServices: 1,
          active: true, // Asumimos activo por defecto
          phone: "",
          tenantId: currentUser.tenantId,
        });
      } else {
        // Actualizar cliente existente
        const clientDoc = querySnapshot.docs[0];
        batch.update(clientDoc.ref, {
          lastVisit: newService.date,
          totalSpent: increment(parseFloat(totalCost.toFixed(2))),
          totalServices: increment(1),
        });
      }
    }
  } catch (error) {
    console.error("Error preparing client update for batch:", error);
    throw error; 
  }
  // ========================================

  const serviceData: CreateServicePayload = {
    userId: currentUser.id,
    userName: currentUser.name,
    date: newService.date,
    client: newService.client.trim(),
    service:
      newService.services.map((s) => s.serviceName).join(", ") ||
      "Servicios personalizados",
    cost: parseFloat(totalCost.toFixed(2)),
    commissionPct,
    paymentMethod: newService.paymentMethod,
    reposicion: parseFloat(totalReposicion.toFixed(2)),
    deleted: false,
    timestamp: serverTimestamp(),
    tenantId: currentUser.tenantId,
  };

  // Solo agregar servicios si hay
  if (newService.services.length > 0) {
    serviceData.services = newService.services;
  }

  // Solo agregar extras si hay
  if (newService.extras.length > 0) {
    serviceData.extras = newService.extras;
  }

  // 2. PREPARAR DOCUMENTO DE SERVICIO
  const newServiceRef = doc(collection(db, "services"));
  batch.set(newServiceRef, serviceData);

  // 3. PROCESAR DESCUENTOS DE INVENTARIO (Todo en memoria) 🧠
  // Iteramos sobre los servicios vendidos
  newService.services.forEach((serviceItem) => {
    
    // A. Químicos (Sin await)
    batchDeductInventoryByRecipe(
      batch, // Pasamos el batch
      serviceItem.serviceId,
      serviceItem.serviceName,
      inventoryItems,
      catalogServices
    );
  });

  try {
    await batch.commit();
  } catch (error) {
    console.error("Error al procesar el lote:", error);
    throw error;
  }
};

export const updateService = async (
  id: string,
  updated: Partial<Service>,
  inventoryContext?: {
      restore: boolean;
      oldService: Service;
      inventoryItems: InventoryItem[];
      catalogServices: CatalogService[];
  }
): Promise<void> => {
  // CASO A: Actualización simple (sin cambios de inventario)
  if (!inventoryContext || !inventoryContext.restore) {
     await updateDoc(doc(db, "services", id), updated);
     return;
  }

  // CASO B: Actualización con cambios de servicios (Inventario)
  // 1. Restaurar stock de servicios antiguos
  if (inventoryContext.oldService && inventoryContext.oldService.services) {
      for (const oldItem of inventoryContext.oldService.services) {
          await restoreInventoryByRecipe(
              oldItem.serviceId,
              oldItem.serviceName,
              inventoryContext.inventoryItems,
              inventoryContext.catalogServices
          );
      }
  }

  // 2. Aplicar nuevos descuentos (si hay nuevos servicios)
  if (updated.services) {
      for (const newItem of updated.services) {
          await deductInventoryByRecipe(
              newItem.serviceId,
              newItem.serviceName,
              inventoryContext.inventoryItems,
              inventoryContext.catalogServices
          );
      }
  }

  // 3. Actualizar documento
  await updateDoc(doc(db, "services", id), updated);
};

export const updateServiceCost = async (
  serviceId: string,
  newCost: number,
): Promise<void> => {
  if (!Number.isFinite(newCost) || newCost <= 0) {
    throw new Error("Costo inválido");
  }

  await updateDoc(doc(db, "services", serviceId), {
    cost: newCost,
  });
};

export const softDeleteService = async (
  id: string,
  userId?: string,
  inventoryContext?: {
    service: Service;
    inventoryItems: InventoryItem[];
    catalogServices: CatalogService[];
  }
): Promise<void> => {
  // Si hay contexto de inventario, restaurar antes de marcar como eliminado
  if (inventoryContext?.service?.services) {
    const batch = writeBatch(db);
    
    // Restaurar inventario de cada servicio
    for (const serviceItem of inventoryContext.service.services) {
      batchRestoreInventoryByRecipe(
        batch,
        serviceItem.serviceId,
        serviceItem.serviceName,
        inventoryContext.inventoryItems,
        inventoryContext.catalogServices
      );
    }
    
    // Marcar como eliminado en el mismo batch
    batch.update(doc(db, "services", id), {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
    });
    
    // Ejecutar batch atómicamente
    await batch.commit();
  } else {
    // Si no hay inventario, solo marcar como eliminado  
    await updateDoc(doc(db, "services", id), {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
    });
  }
};

export const softDeleteServiceAdmin = async (
  id: string,
  userId?: string,
  inventoryContext?: {
    service: Service;
    inventoryItems: InventoryItem[];
    catalogServices: CatalogService[];
  }
): Promise<void> => {
  // Si hay contexto de inventario, restaurar antes de marcar como eliminado
  if (inventoryContext?.service?.services) {
    const batch = writeBatch(db);
    
    // Restaurar inventario de cada servicio
    for (const serviceItem of inventoryContext.service.services) {
      batchRestoreInventoryByRecipe(
        batch,
        serviceItem.serviceId,
        serviceItem.serviceName,
        inventoryContext.inventoryItems,
        inventoryContext.catalogServices
      );
    }
    
    // Marcar como eliminado en el mismo batch
    batch.update(doc(db, "services", id), {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
    });
    
    // Ejecutar batch atómicamente
    await batch.commit();
  } else {
    // Si no hay inventario, solo marcar como eliminado  
    await updateDoc(doc(db, "services", id), {
      deleted: true,
      deletedAt: serverTimestamp(),
      deletedBy: userId,
    });
  }
};

export const permanentlyDeleteService = async (
  serviceId: string,
  inventoryContext?: {
    service: Service;
    inventoryItems: InventoryItem[];
    catalogServices: CatalogService[];
  }
): Promise<void> => {
  // Si hay contexto de inventario, restaurar antes de borrar permanentemente
  if (inventoryContext?.service?.services) {
    const batch = writeBatch(db);
    
    // Restaurar inventario de cada servicio
    for (const serviceItem of inventoryContext.service.services) {
      batchRestoreInventoryByRecipe(
        batch,
        serviceItem.serviceId,
        serviceItem.serviceName,
        inventoryContext.inventoryItems,
        inventoryContext.catalogServices
      );
    }
    
    // Borrar documento en el mismo batch
    batch.delete(doc(db, "services", serviceId));
    
    // Ejecutar batch atómicamente
    await batch.commit();
  } else {
    // Si no hay inventario, solo borrar documento
    await deleteDoc(doc(db, "services", serviceId));
  }
};

export const restoreDeletedService = async (serviceId: string): Promise<void> => {
  await updateDoc(doc(db, "services", serviceId), {
    deleted: false,
    deletedAt: null,
    deletedBy: null,
  });
};

export const deleteClient = async (clientId: string): Promise<void> => {
  await deleteDoc(doc(db, "clients", clientId));
};
