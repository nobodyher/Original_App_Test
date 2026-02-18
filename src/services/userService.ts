import {
  collection,
  doc,
  serverTimestamp,
  addDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase";
import type { AppUser } from "../types";
import { hashPin } from "../utils/security";
import { COLLECTIONS } from "../constants/app";

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

  await addDoc(collection(db, COLLECTIONS.USERS), {
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
    tenantId,
  });
};

export const deleteUserPermanently = async (userId: string) => {
  await deleteDoc(doc(db, COLLECTIONS.USERS, userId));
};

export const updateUser = async (userId: string, updates: Partial<AppUser>) => {
  try {
    const dataToUpdate: Record<string, unknown> = { ...updates };

    // Remove undefined values — Firestore rejects them
    Object.keys(dataToUpdate).forEach((key) => {
      if (dataToUpdate[key] === undefined) delete dataToUpdate[key];
    });

    if (Object.keys(dataToUpdate).length === 0) return;

    if (dataToUpdate.commissionPct !== undefined) {
      const comm = Number(dataToUpdate.commissionPct);
      if (!Number.isFinite(comm) || comm < 0 || comm > 100) {
        throw new Error("El porcentaje de comisión debe estar entre 0 y 100.");
      }
      dataToUpdate.commissionPct = comm;
    }

    if (dataToUpdate.pin !== undefined) {
      const pinStr = String(dataToUpdate.pin).trim();
      if (pinStr.length < 4) {
        throw new Error("El PIN debe tener al menos 4 dígitos.");
      }
      dataToUpdate.pin = await hashPin(pinStr);
    }

    if (dataToUpdate.name !== undefined) {
      const nameStr = String(dataToUpdate.name).trim();
      if (!nameStr) throw new Error("El nombre no puede estar vacío.");
      dataToUpdate.name = nameStr;
    }

    await updateDoc(doc(db, COLLECTIONS.USERS, userId), dataToUpdate);
  } catch (error) {
    console.error(`Error en updateUser (${userId}):`, error);
    throw error;
  }
};
