import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
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
} from "../types";

export interface NewServiceState {
  date: string;
  client: string;
  services: ServiceItem[];
  extras: ExtraItem[];
  paymentMethod: PaymentMethod;
  category?: "manicura" | "pedicura";
}

// ====== Helper Functions (Exported but logically part of the service) ======

export const deductConsumables = async (serviceCategory: string): Promise<void> => {
  try {
    // Mapeo de consumibles a descontar por categoría
    const consumablesToDeduct: { [key: string]: number } = {};

    if (serviceCategory === "manicura") {
      // Manicura: costo total $0.33
      consumablesToDeduct["Guantes (par)"] = 1;
      consumablesToDeduct["Mascarilla"] = 1;
      consumablesToDeduct["Palillo naranja"] = 1;
      consumablesToDeduct["Bastoncillos"] = 1;
      consumablesToDeduct["Wipes"] = 1;
      consumablesToDeduct["Toalla desechable"] = 1;
      consumablesToDeduct["Gorro"] = 1;
      consumablesToDeduct["Campo quirúrgico"] = 1;
    } else if (serviceCategory === "pedicura") {
      // Pedicura: costo total ~$0.50
      consumablesToDeduct["Campo quirúrgico"] = 1;
      consumablesToDeduct["Algodón"] = 5;
      consumablesToDeduct["Guantes (par)"] = 1;
      consumablesToDeduct["Mascarilla"] = 1;
      consumablesToDeduct["Palillo naranja"] = 1;
      consumablesToDeduct["Wipes"] = 1;
      consumablesToDeduct["Gorro"] = 1;
      consumablesToDeduct["Bastoncillos"] = 1;
    }

    // Actualizar cada consumible
    for (const [consumableName, quantity] of Object.entries(consumablesToDeduct)) {
      const consumableRef = doc(db, "consumables", consumableName);
      const consumableSnap = await getDoc(consumableRef);

      if (consumableSnap.exists()) {
        const currentStock = consumableSnap.data().quantity || 0;
        await updateDoc(consumableRef, {
          quantity: Math.max(0, currentStock - quantity),
          lastDeducted: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.log("Error descargando consumibles (no critico):", error);
  }
};

export const calculateTotalReplenishmentCost = (
  services: ServiceItem[],
  materialRecipes: MaterialRecipe[],
): number => {
  let totalCost = 0;

  for (const service of services) {
    // Buscar la receta del servicio en materialRecipes
    const recipe = materialRecipes.find(
      (r) => r.serviceName.toLowerCase() === service.serviceName.toLowerCase(),
    );

    if (recipe) {
      // Si encontramos la receta, usar su costo total
      totalCost += recipe.totalCost;
    } else {
      // Si no hay receta, usar el costo de desechables por defecto según categoría
      const serviceName = service.serviceName.toLowerCase();
      if (
        serviceName.includes("pedicure") ||
        serviceName.includes("pedicura")
      ) {
        totalCost += 0.5; // Costo de desechables para pedicura
      } else {
        totalCost += 0.33; // Costo de desechables para manicura
      }
    }
  }

  return totalCost;
};

// ====== Main Service Functions ======

export const addService = async (
  currentUser: AppUser,
  newService: NewServiceState,
  materialRecipes: MaterialRecipe[],
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
  );

  const serviceData: any = {
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

  await addDoc(collection(db, "services"), serviceData);

  // Descontar consumibles si hay categoría
  if (newService.category) {
    await deductConsumables(newService.category);
  }
};

export const updateService = async (
  id: string,
  updated: Partial<Service>,
): Promise<void> => {
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
