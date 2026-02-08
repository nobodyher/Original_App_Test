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

  // 1. Inicializar usuarios por defecto (igual que antes)
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

  // 2. Escuchar cambios en usuarios (igual que antes)
  useEffect(() => {
    if (!initialized) return;

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
        // NOTA: No ponemos setLoading(false) aquí todavía para evitar parpadeos
        // Lo haremos después de intentar restaurar la sesión
      },
      (error) => {
        console.error("Error cargando usuarios:", error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [initialized]);

  // 3. NUEVO: Restaurar sesión al recargar
  useEffect(() => {
    // Solo ejecutamos si ya tenemos usuarios cargados
    if (users.length > 0) {
      const savedUserId = localStorage.getItem("salon_user_id");
      
      if (savedUserId && !currentUser) {
        // Buscamos si el usuario guardado sigue existiendo
        const foundUser = users.find(u => u.id === savedUserId);
        if (foundUser) {
          setCurrentUser(foundUser);
        }
      }
      
      // Una vez intentada la restauración, quitamos el loading
      setLoading(false);
    } else if (initialized && users.length === 0) {
       // Si inicializó pero no hay usuarios (caso raro), quitamos loading
       // Ojo: esto podría necesitar ajuste si tarda mucho Firebase
       // Por seguridad, un timeout o esperar al primer snapshot real
    }
  }, [users, initialized]);

  // 4. NUEVO: Funciones para Login/Logout con persistencia
  const login = (user: AppUser) => {
    localStorage.setItem("salon_user_id", user.id); // Guardar en disco
    setCurrentUser(user);
  };

  const logout = () => {
    localStorage.removeItem("salon_user_id"); // Borrar del disco
    setCurrentUser(null);
  };

  return { 
    currentUser, 
    users, 
    loading, 
    initialized,
    login,   // Usar esto en lugar de setCurrentUser
    logout   // Usar esto en lugar de setCurrentUser(null)
  };
};