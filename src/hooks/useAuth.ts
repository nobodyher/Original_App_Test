import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import type { AppUser } from "../types";
import { normalizeUser } from "../utils/helpers";

export const useAuth = (enabled: boolean) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  // NUEVO: Flag para saber si Firebase ya nos respondió al menos una vez
  const [dataLoaded, setDataLoaded] = useState(false);

  // State for tenant handling
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);

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
    if (!enabled || !currentTenantId) return;

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
  }, [enabled, currentTenantId]);

  // 3. Restaurar sesión con validación de expiración
  useEffect(() => {
    if (dataLoaded) {
      const savedUserId = sessionStorage.getItem("salon_user_id");
      const savedLoginTime = sessionStorage.getItem("salon_login_time");

      // Expire sessions older than 12 hours
      const SESSION_MAX_MS = 12 * 60 * 60 * 1000;
      const sessionExpired =
        !savedLoginTime ||
        Date.now() - parseInt(savedLoginTime, 10) > SESSION_MAX_MS;

      if (savedUserId && users.length > 0 && !sessionExpired) {
        const foundUser = users.find((u) => u.id === savedUserId);

        if (foundUser) {
          const currentUserStr = JSON.stringify(currentUser);
          const foundUserStr = JSON.stringify(foundUser);
          if (currentUserStr !== foundUserStr) {
            setCurrentUser(foundUser);
          }
        } else {
          // User was deleted — force logout
          if (currentUser) {
            setCurrentUser(null);
            sessionStorage.removeItem("salon_user_id");
            sessionStorage.removeItem("salon_login_time");
          }
        }
      } else if (savedUserId && sessionExpired) {
        // Session expired — clear storage silently
        sessionStorage.removeItem("salon_user_id");
        sessionStorage.removeItem("salon_login_time");
      }

      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [users, dataLoaded]);

  const login = (user: AppUser) => {
    sessionStorage.setItem("salon_user_id", user.id);
    sessionStorage.setItem("salon_login_time", Date.now().toString());
    setCurrentUser(user);
  };

  const logout = () => {
    sessionStorage.removeItem("salon_user_id");
    sessionStorage.removeItem("salon_login_time");
    setCurrentUser(null);
  };

  return {
    currentUser,
    users,
    loading,
    login,
    logout,
  };
};
