import {
  collection,
  doc,
  addDoc,
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
  MaterialRecipe,
  ServiceRecipe,
  Consumable,
  ChemicalProduct,
  CatalogService,
  CreateServicePayload,
} from "../types";
import { deductConsumables, calculateTotalReplenishmentCost, deductInventoryByRecipe, restoreInventoryByRecipe, restoreConsumables } from "./inventoryService";

export interface NewServiceState {
  date: string;
  client: string;
  services: ServiceItem[];
  extras: ExtraItem[];
  paymentMethod: PaymentMethod;
  category?: "manicura" | "pedicura";
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

export const addService = async (
  currentUser: AppUser,
  newService: NewServiceState,
  materialRecipes: MaterialRecipe[],
  serviceRecipes: ServiceRecipe[],
  consumables: Consumable[],
  chemicalProducts: ChemicalProduct[],
  catalogServices: CatalogService[],
  totalCost: number,
): Promise<void> => {
  if (!newService.client || newService.services.length === 0) {
    throw new Error("Completa cliente y al menos un servicio");
  }

  if (totalCost <= 0) {
    throw new Error("Costo inválido");
  }

  const commissionPct = clamp(Number(currentUser.commissionPct || 0), 0, 100);

  // Calcular el costo total de reposición sumando todos los servicios
  const totalReposicion = calculateTotalReplenishmentCost(
    newService.services,
    materialRecipes,
    catalogServices,
    chemicalProducts
  );

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
  };

  // Solo agregar servicios si hay
  if (newService.services.length > 0) {
    serviceData.services = newService.services;
  }

  // Solo agregar extras si hay
  if (newService.extras.length > 0) {
    serviceData.extras = newService.extras;
  }

  // Solo agregar categoría si hay
  if (newService.category) {
    serviceData.category = newService.category;
  }

  // ====== AUTOMATIZACIÓN DE CLIENTES ======
  try {
    const clientName = newService.client.trim();
    if (clientName) {
      const clientsRef = collection(db, "clients");
      const q = query(clientsRef, where("name", "==", clientName), limit(1));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        // Crear nuevo cliente
        await addDoc(clientsRef, {
          name: clientName,
          firstVisit: newService.date, // Usamos la fecha del servicio
          lastVisit: newService.date,
          totalSpent: parseFloat(totalCost.toFixed(2)),
          totalServices: 1,
          active: true,
          phone: "", // Opcional, se puede llenar después
        });
      } else {
        // Actualizar cliente existente
        const clientDoc = querySnapshot.docs[0];
        await updateDoc(clientDoc.ref, {
          lastVisit: newService.date,
          totalSpent: increment(parseFloat(totalCost.toFixed(2))),
          totalServices: increment(1),
        });
      }
    }
  } catch (error) {
    console.error("Error en automatización de clientes (no crítico):", error);
    // No lanzamos error para no interrumpir el guardado del servicio
  }
  // ========================================

  await addDoc(collection(db, "services"), serviceData);

  // ====== DESCUENTO DE INVENTARIO BASADO EN RECETAS ======
  // Tarea 3: No cerrar ventana hasta que termine la operación
  for (const serviceItem of newService.services) {
    // Descontar materiales químicos
    await deductInventoryByRecipe(
      serviceItem.serviceId,
      serviceItem.serviceName,
      materialRecipes,
      chemicalProducts,
      catalogServices // Pasar catalogServices
    );
    
    // Descontar consumibles con prioridad (manualConsumables → serviceRecipes)
    await deductConsumables(
      serviceItem.serviceId,
      serviceItem.serviceName,
      serviceRecipes,
      consumables,
      catalogServices
    );
  }
  // ========================================
};

export const updateService = async (
  id: string,
  updated: Partial<Service>,
  inventoryContext?: {
      restore: boolean;
      oldService: Service;
      materialRecipes: MaterialRecipe[];
      serviceRecipes: ServiceRecipe[];
      consumables: Consumable[];
      chemicalProducts: ChemicalProduct[];
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
      console.log("🔄 Restaurando inventario de servicios antiguos:", inventoryContext.oldService.services);
      for (const oldItem of inventoryContext.oldService.services) {
          await restoreInventoryByRecipe(
              oldItem.serviceId,
              oldItem.serviceName,
              inventoryContext.materialRecipes,
              inventoryContext.chemicalProducts,
              inventoryContext.catalogServices
          );
          await restoreConsumables(
              oldItem.serviceId,
              oldItem.serviceName,
              inventoryContext.serviceRecipes,
              inventoryContext.consumables,
              inventoryContext.catalogServices
          );
      }
  }

  // 2. Aplicar nuevos descuentos (si hay nuevos servicios)
  if (updated.services) {
      console.log("📉 Descontando inventario de nuevos servicios:", updated.services);
      for (const newItem of updated.services) {
          await deductInventoryByRecipe(
              newItem.serviceId,
              newItem.serviceName,
              inventoryContext.materialRecipes,
              inventoryContext.chemicalProducts,
              inventoryContext.catalogServices
          );
          await deductConsumables(
              newItem.serviceId,
              newItem.serviceName,
              inventoryContext.serviceRecipes,
              inventoryContext.consumables,
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
): Promise<void> => {
  await updateDoc(doc(db, "services", id), {
    deleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: userId,
  });
};

export const softDeleteServiceAdmin = async (
  serviceId: string,
  userId?: string,
): Promise<void> => {
  await updateDoc(doc(db, "services", serviceId), {
    deleted: true,
    deletedAt: serverTimestamp(),
    deletedBy: userId,
  });
};

export const permanentlyDeleteService = async (
  serviceId: string,
): Promise<void> => {
  await deleteDoc(doc(db, "services", serviceId));
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
