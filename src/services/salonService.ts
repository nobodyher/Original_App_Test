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
import { deductConsumables, calculateTotalReplenishmentCost } from "./inventoryService";

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
