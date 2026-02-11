import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import type { AppUser } from "../types";
import { normalizeUser } from "../utils/helpers";
import * as userService from "../services/userService";

export const useAuth = (enabled: boolean) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  // NUEVO: Flag para saber si Firebase ya nos respondió al menos una vez
  const [dataLoaded, setDataLoaded] = useState(false);

  // 1. Inicializar usuarios (SOLO SI ESTÁ HABILITADO)
  useEffect(() => {
    if (!enabled) return;

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
    if (!enabled || !initialized) return;

    const q = query(collection(db, "users"), orderBy("name", "asc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) =>
          normalizeUser({ id: d.id, ...d.data() }),
        );

        const sortedData = data.sort((a, b) => {
          if (a.name === "Principal") return -1;
          if (b.name === "Principal") return 1;
          return a.name.localeCompare(b.name);
        });

        setUsers(sortedData);
        // ✅ CLAVE: Marcamos que ya recibimos datos reales
        setDataLoaded(true);
      },
      (error) => {
        console.error("Error cargando usuarios:", error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [initialized, enabled]);

  // 3. Restaurar sesión (LÓGICA CORREGIDA)
  useEffect(() => {
    // Solo procedemos si YA recibimos datos de Firebase (dataLoaded)
    if (dataLoaded) {
      if (users.length > 0) {
        const savedUserId = sessionStorage.getItem("salon_user_id");

        if (savedUserId && !currentUser) {
          const foundUser = users.find((u) => u.id === savedUserId);
          if (foundUser) {
            setCurrentUser(foundUser);
          }
        }
      }
      // Solo ahora quitamos el loading. ¡Adiós al flash!
      setLoading(false);
    }
  }, [users, dataLoaded]); // Dependemos de dataLoaded, no de initialized

  const login = (user: AppUser) => {
    sessionStorage.setItem("salon_user_id", user.id);
    setCurrentUser(user);
  };

  const logout = () => {
    sessionStorage.removeItem("salon_user_id");
    setCurrentUser(null);
  };

  return {
    currentUser,
    users,
    loading,
    initialized,
    login,
    logout,
  };
};
