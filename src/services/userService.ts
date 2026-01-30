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

export const createNewUser = async (userData: {
  name: string;
  pin: string;
  commissionPct: string | number;
  color: string;
}) => {
  const { name, pin, commissionPct, color } = userData;

  if (!name || !pin || commissionPct === "") {
    throw new Error("Completa todos los campos");
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

  await addDoc(collection(db, "users"), {
    name: name.trim(),
    pin: pin.trim(),
    role: "staff",
    color: color,
    icon: "user",
    commissionPct: commPct,
    active: true,
    createdAt: serverTimestamp(),
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

export const updateUser = async (
  userId: string,
  updates: Partial<{
    name: string;
    pin: string;
    commissionPct: number;
    color: string;
    active: boolean;
  }>
) => {
  const dataToUpdate: any = { ...updates };

  // Validation
  if (updates.commissionPct !== undefined) {
    if (
      !Number.isFinite(updates.commissionPct) ||
      updates.commissionPct < 0 ||
      updates.commissionPct > 100
    ) {
      throw new Error("Porcentaje inválido (0-100)");
    }
  }

  if (updates.pin !== undefined && updates.pin.length < 4) {
    throw new Error("PIN debe tener al menos 4 dígitos");
  }

  await updateDoc(doc(db, "users", userId), dataToUpdate);
};
