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

// AHORA RECIBE UN ARGUMENTO: enabled
export const useAuth = (enabled: boolean) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  // 1. Inicializar usuarios (SOLO SI ESTÁ HABILITADO)
  useEffect(() => {
    if (!enabled) return; // 🛑 Esperar señal

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
  }, [enabled]);

  // 2. Escuchar cambios (SOLO SI ESTÁ HABILITADO)
  useEffect(() => {
    if (!enabled || !initialized) return; // 🛑 Esperar señal

    const q = query(collection(db, "users"), orderBy("name", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) =>
          normalizeUser({ id: d.id, ...d.data() })
        );

        const sortedData = data.sort((a, b) => {
          if (a.name === "Principal") return -1;
          if (b.name === "Principal") return 1;
          return a.name.localeCompare(b.name);
        });

        setUsers(sortedData);
      },
      (error) => {
        console.error("Error cargando usuarios:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [initialized, enabled]);

  // 3. Restaurar sesión
  useEffect(() => {
    if (users.length > 0) {
      const savedUserId = localStorage.getItem("salon_user_id");
      
      if (savedUserId && !currentUser) {
        const foundUser = users.find(u => u.id === savedUserId);
        if (foundUser) {
          setCurrentUser(foundUser);
        }
      }
      setLoading(false);
    } else if (initialized && enabled && users.length === 0) {
       // Si ya inicializó pero no hay usuarios, dejar de cargar para no bloquear
       setLoading(false);
    }
  }, [users, initialized, enabled]);

  const login = (user: AppUser) => {
    localStorage.setItem("salon_user_id", user.id);
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("salon_user_id");
    setCurrentUser(null);
  };

  return { 
    currentUser, 
    users, 
    loading, 
    initialized,
    login,
    logout
  };
};