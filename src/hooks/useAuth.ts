import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
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

  // State for tenant handling
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

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

  // 1.5 Fetch Tenant ID (Securely)
  useEffect(() => {
    if (!enabled || !auth.currentUser) return;
    
    // We get the tenantId from the ACTUAL authenticated user document
    // This allows us to satisfy the rule: allow read: if isSameTenant();
    const fetchTenant = async () => {
        try {
             // We can read our OWN user document due to rules
             // match /users/{userId} { allow read: if request.auth.uid == userId; }
            const docRef = doc(db, "users", auth.currentUser!.uid);
            const snapshot = await getDoc(docRef);
            
            if (snapshot.exists()) {
                const userData = snapshot.data();
                setCurrentTenantId(userData.tenantId || "");
            } else {
                console.warn("User document not found");
                setCurrentTenantId("");
            }
        } catch (e) {
            console.error("Error fetching user tenant:", e);
            setCurrentTenantId(""); 
        }
    };
    
    fetchTenant();
  }, [enabled]); // Run when auth is enabled/ready

  // 2. Escuchar cambios (SOLO SI ESTÁ HABILITADO Y TENEMOS TENANT)
  useEffect(() => {
    if (!enabled || !initialized || !currentTenantId) return;

    // Use the fetched tenantId
    const q = query(
      collection(db, "users"), 
      where("tenantId", "==", currentTenantId), 
      orderBy("name", "asc")
    );
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
  }, [initialized, enabled, currentTenantId]);

  // 3. Restaurar sesión (LÓGICA CORREGIDA & MEJORADA)
  useEffect(() => {
    // Solo procedemos si YA recibimos datos de Firebase (dataLoaded)
    if (dataLoaded) {
      const savedUserId = sessionStorage.getItem("salon_user_id");

      if (savedUserId && users.length > 0) {
        const foundUser = users.find((u) => u.id === savedUserId);
        
        if (foundUser) {
          // ACTUALIZACIÓN EN TIEMPO REAL:
          // Solo actualizamos si el usuario NO está logueado o si los datos han cambiado
          // Para evitar loops infinitos, comparamos la versión stringificada
          const currentUserStr = JSON.stringify(currentUser);
          const foundUserStr = JSON.stringify(foundUser);
          
          if (currentUserStr !== foundUserStr) {
             setCurrentUser(foundUser);
          }
        } else {
             // Si el usuario guardado ya no existe en la lista (fue borrado), logout
            if (currentUser) {
                setCurrentUser(null);
                sessionStorage.removeItem("salon_user_id");
            }
        }
      }
      
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, dataLoaded]); // Removemos currentUser de dependencias para evitar el loop advertido, la lógica interna maneja la comparación

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
