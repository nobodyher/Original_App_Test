import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import type { AppUser } from "../types";
import { normalizeUser } from "../utils/helpers";
import * as userService from "../services/userService";

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // Inicializar usuarios por defecto
  useEffect(() => {
    const initUsers = async () => {
      try {
        await userService.initializeDefaultUsers();
        setInitialized(true);
      } catch (error) {
        console.error("Error inicializando usuarios:", error);
        setInitialized(true);
      }
    };
    initUsers();
  }, []);

  // Escuchar cambios en usuarios
  useEffect(() => {
    if (!initialized) return;

    const q = query(collection(db, "users"), orderBy("name", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) =>
          normalizeUser({ id: d.id, ...d.data() })
        );

        // Sort users: "Principal" first, then others alphabetically
        const sortedData = data.sort((a, b) => {
          if (a.name === "Principal") return -1;
          if (b.name === "Principal") return 1;
          return a.name.localeCompare(b.name);
        });

        setUsers(sortedData);
        setLoading(false);
      },
      (error) => {
        console.error("Error cargando usuarios:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [initialized]);

  return { currentUser, setCurrentUser, users, loading, initialized };
};
