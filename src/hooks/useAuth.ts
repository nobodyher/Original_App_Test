import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, where, doc, getDoc } from "firebase/firestore";
import { db, auth } from "../firebase";
import type { AppUser } from "../types";
import { normalizeUser } from "../utils/helpers";

export const useAuth = (enabled: boolean) => {
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null);
  const [isSuspended, setIsSuspended] = useState(false);
  const [userDocMissing, setUserDocMissing] = useState(false);

  // 1. Fetch tenantId from the authenticated user's Firestore document
  useEffect(() => {
    if (!enabled || !auth.currentUser) return;

    const fetchTenant = async () => {
      try {
        const docRef = doc(db, "users", auth.currentUser!.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          setCurrentTenantId(snapshot.data().tenantId || "");
          setUserDocMissing(false);
        } else {
          console.warn("User document not found in Firestore");
          setCurrentTenantId("");
          setUserDocMissing(true);
          setLoading(false); // Important: stop loading so we can show DeletedAccountScreen
        }
      } catch (e) {
        console.error("Error fetching user tenant:", e);
        setCurrentTenantId("");
        // If error is permission denied, it might also mean deleted/invalid, 
        // but let's be careful. For now, we assume it exists to avoid blocking 
        // unless explicitly missing.
      }
    };

    fetchTenant();
  }, [enabled]);

  // 2. Listen for user changes filtered by tenant
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
        setDataLoaded(true);
      },
      (error) => {
        console.error("Error cargando usuarios:", error);
        setLoading(false);
      },
    );

    return () => unsub();
  }, [enabled, currentTenantId]);

  // 3. Real-time listener on the tenant document — detects suspension instantly
  useEffect(() => {
    if (!enabled || !currentTenantId) return;

    const tenantRef = doc(db, "tenants", currentTenantId);
    const unsub = onSnapshot(
      tenantRef,
      (snap) => {
        if (snap.exists()) {
          setIsSuspended(snap.data().status === "suspended");
        } else {
          // Tenant doc doesn't exist yet — treat as active
          setIsSuspended(false);
        }
      },
      (error) => {
        // If we can't read the tenant doc (e.g. rules deny it), treat as active
        console.warn("Could not read tenant status:", error);
        setIsSuspended(false);
      }
    );

    return () => unsub();
  }, [enabled, currentTenantId]);

  // 3. Restore session and enforce 12-hour expiry
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
    isSuspended,
    userDocMissing,
    login,
    logout,
  };
};
