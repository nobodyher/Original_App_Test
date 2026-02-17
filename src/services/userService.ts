import {
  collection,
  doc,
  runTransaction,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { AppUser } from "../types";
import { hashPin } from "../utils/security";

export const initializeDefaultUsers = async (): Promise<void> => {
  await runTransaction(db, async (tx) => {
    const metaRef = doc(db, "meta", "app");
    const metaSnap = await tx.get(metaRef);

    if (metaSnap.exists() && metaSnap.data()?.seeded) return;

    const defaultUsers = [
      {
        name: "Principal",
        pin: "2773",
        role: "owner",
        color: "from-purple-500 to-indigo-600",
        icon: "crown",
        commissionPct: 0,
        active: true,
        tenantId: "base_oficial",
        createdAt: serverTimestamp(),
      },
      {
        name: "Emily",
        pin: "6578",
        role: "staff",
        color: "from-pink-500 to-rose-600",
        icon: "user",
        commissionPct: 35,
        active: true,
        tenantId: "base_oficial",
        createdAt: serverTimestamp(),
      },
      {
        name: "Damaris",
        pin: "2831",
        role: "staff",
        color: "from-blue-500 to-cyan-600",
        icon: "user",
        commissionPct: 35,
        active: true,
        tenantId: "base_oficial",
        createdAt: serverTimestamp(),
      },
    ];

    defaultUsers.forEach((u) => {
      const newRef = doc(collection(db, "users"));
      tx.set(newRef, u);
    });

    tx.set(
      metaRef,
      { seeded: true, seededAt: serverTimestamp() },
      { merge: true },
    );
  });
};

export const createNewUser = async (userData: Partial<AppUser>) => {
  const { name, pin, commissionPct, color, phoneNumber, email, birthDate, tenantId } =
    userData;

  if (!name || !pin || commissionPct === undefined) {
    throw new Error("Completa todos los campos obligatorios");
  }

  if (!tenantId) {
    throw new Error("El ID de la organización (tenantId) es obligatorio");
  }

  const commPct =
    typeof commissionPct === "string"
      ? parseFloat(commissionPct)
      : commissionPct;

  if (!Number.isFinite(commPct) || commPct < 0 || commPct > 100) {
    throw new Error("Porcentaje de comisión inválido (0-100)");
  }

  if (pin.length < 4) {
    throw new Error("PIN debe tener al menos 4 dígitos");
  }

  const hashedPin = await hashPin(pin.trim());

  await addDoc(collection(db, "users"), {
    name: name.trim(),
    pin: hashedPin,
    role: "staff",
    color: color || "from-gray-500 to-gray-600",
    icon: "user",
    commissionPct: commPct,
    phoneNumber: phoneNumber || "",
    email: email || "",
    birthDate: birthDate || "",
    active: true,
    createdAt: serverTimestamp(),
    tenantId: tenantId, 
  });
};

export const updateUserCommission = async (
  userId: string,
  newCommission: number,
) => {
  if (
    !Number.isFinite(newCommission) ||
    newCommission < 0 ||
    newCommission > 100
  ) {
    throw new Error("Porcentaje inválido (0-100)");
  }

  await updateDoc(doc(db, "users", userId), {
    commissionPct: newCommission,
  });
};

export const deactivateUser = async (userId: string) => {
  await updateDoc(doc(db, "users", userId), {
    active: false,
  });
};

export const deleteUserPermanently = async (userId: string) => {
  await deleteDoc(doc(db, "users", userId));
};

export const updateUser = async (userId: string, updates: Partial<AppUser>) => {
  try {
    // 1. Clonar para evitar mutar el objeto original y permitir manipulación
    const dataToUpdate: any = { ...updates };

    // 2. Limpieza estricta de undefined para evitar errores en Firestore
    Object.keys(dataToUpdate).forEach((key) => {
      if (dataToUpdate[key] === undefined) {
        delete dataToUpdate[key];
      }
    });

    // Si no hay datos válidos para actualizar, retornar temprano
    if (Object.keys(dataToUpdate).length === 0) {
      return;
    }

    // 3. Validar Porcentaje de Comisión (si se está actualizando)
    if (dataToUpdate.commissionPct !== undefined) {
      const comm = Number(dataToUpdate.commissionPct);
      if (!Number.isFinite(comm) || comm < 0 || comm > 100) {
        throw new Error("El porcentaje de comisión debe estar entre 0 y 100.");
      }
      dataToUpdate.commissionPct = comm; // Asegurar tipo numérico
    }

    // 4. Validar PIN (si se está actualizando)
    if (dataToUpdate.pin !== undefined) {
      const pinStr = String(dataToUpdate.pin).trim();
      if (pinStr.length < 4) {
        throw new Error("El PIN debe tener al menos 4 dígitos.");
      }
      dataToUpdate.pin = await hashPin(pinStr);
    }

    // 5. Validar Nombre (si se está actualizando)
    if (dataToUpdate.name !== undefined) {
      const nameStr = String(dataToUpdate.name).trim();
      if (!nameStr) {
        throw new Error("El nombre no puede estar vacío.");
      }
      dataToUpdate.name = nameStr;
    }

    // 6. Ejecutar actualización en Firestore
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, dataToUpdate);
  } catch (error) {
    // Loguear el error para depuración (puedes conectarlo a un servicio de logs externo si lo tienes)
    console.error(`Error blindado en updateUser (User ID: ${userId}):`, error);
    throw error; // Re-lanzar para que la UI pueda mostrar el mensaje
  }
};
