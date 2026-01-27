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
  expenseData: Omit<Expense, "id" | "deleted">
): Promise<void> => {
  const { date, description, category, amount, userId } = expenseData;

  if (!date || !description || !category || !amount) {
    throw new Error("Completa todos los campos");
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
    timestamp: serverTimestamp(),
  });
};

export const deleteExpense = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "expenses", id));
};
