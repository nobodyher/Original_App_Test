import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import type { Expense } from "../types";

export const addExpense = async (
  expenseData: Omit<Expense, "id" | "deleted">,
  tenantId: string
): Promise<void> => {
  const { date, description, category, amount, userId } = expenseData;

  if (!date || !description || !category || !amount) {
    throw new Error("Completa todos los campos");
  }

  if (!tenantId) {
    throw new Error("Error interno: No se identificó la organización (tenantId)");
  }

  const numAmount = Number(amount);
  if (!Number.isFinite(numAmount) || numAmount <= 0) {
    throw new Error("Monto inválido");
  }

  await addDoc(collection(db, "expenses"), {
    date,
    description: description.trim(),
    category,
    amount: numAmount,
    userId: userId || null,
    tenantId,
    timestamp: serverTimestamp(),
  });
};

export const deleteExpense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "expenses", id));
};
