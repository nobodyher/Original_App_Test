import { useState, useEffect, useRef } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
  limit,
  startAfter,
  getDocs,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import type {
  Service,
  Expense,
  CatalogService,
  CatalogExtra,
  Client,
  AppUser,
  InventoryItem,
} from "../types";
import { EXTRAS_CATALOG } from "../constants/catalog";
import { COLLECTIONS } from "../constants/app";

export const useSalonData = (initialized: boolean, currentUser: AppUser | null) => {
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [catalogExtras, setCatalogExtras] = useState<CatalogExtra[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);

  // Pagination / History State
  const [historyServices, setHistoryServices] = useState<Service[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyFullyLoaded, setHistoryFullyLoaded] = useState(false);
  const [lastVisible, setLastVisible] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  // Ref to track if history has started loading, to avoid onSnapshot overwriting lastVisible
  const historyStartedRef = useRef(false);

  // Update ref when history changes
  useEffect(() => {
    historyStartedRef.current = historyServices.length > 0;
  }, [historyServices]);

  // Cargar servicios
  useEffect(() => {
    if (!initialized || !currentUser) return; // Wait for currentUser

    const currentTenantId = currentUser.tenantId || "";
    if (!currentTenantId) return; // Don't fetch if no tenant

    
    // We use a simple query first to avoid complex index requirements if possible, 
    // but user requested .where(). If index is missing, it will log an error.
    // Ideally: composite index on [tenantId, timestamp]
    const q = query(
      collection(db, COLLECTIONS.SERVICES),
      where("tenantId", "==", currentTenantId),
      orderBy("timestamp", "desc"),
      limit(50)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Service,
        );
        setServices(data);

        // Capture last visible only on initial load or if history hasn't started
        if (!historyStartedRef.current && snap.docs.length > 0) {
          setLastVisible(snap.docs[snap.docs.length - 1]);
        }
      },
      (error) => {
        console.error("Error cargando servicios:", error);
      },
    );

    return () => unsub();
  }, [initialized, currentUser]);

  // Cargar historial bajo demanda
  const loadHistory = async () => {
    if (loadingHistory || historyFullyLoaded || !currentUser) return;

    // Define pivot
    const pivot = lastVisible;
    if (!pivot) return;
    
    const currentTenantId = currentUser.tenantId || "";
    if (!currentTenantId) return;


    setLoadingHistory(true);
    try {
      // Query para obtener el siguiente lote de historial
      const q = query(
        collection(db, COLLECTIONS.SERVICES),
        where("tenantId", "==", currentTenantId),
        orderBy("timestamp", "desc"),
        startAfter(pivot),
        limit(50)
      );

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setHistoryFullyLoaded(true);
      } else {
        const newHistoryData = snapshot.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Service
        );
        
        setHistoryServices((prev) => [...prev, ...newHistoryData]);
        
        // Update pivot for next load
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        
        // If we got fewer than 50 docs, we might have reached the end
        if (snapshot.docs.length < 50) {
          setHistoryFullyLoaded(true);
        }
      }
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Cargar gastos
  useEffect(() => {
    if (!initialized || !currentUser) return;
    
    const currentTenantId = currentUser.tenantId || "";
    if (!currentTenantId) return;


    const q = query(
      collection(db, COLLECTIONS.EXPENSES),
      where("tenantId", "==", currentTenantId),
      orderBy("timestamp", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Expense,
        );
        setExpenses(data);
      },
      (error) => {
        console.error("Error cargando gastos:", error);
      },
    );

    return () => unsub();
  }, [initialized, currentUser]);

  // Cargar catálogo de servicios
  useEffect(() => {
    if (!initialized || !currentUser) return;
    const currentTenantId = currentUser.tenantId || "";
    if (!currentTenantId) return;


    const q = query(
      collection(db, COLLECTIONS.CATALOG_SERVICES),
      where("tenantId", "==", currentTenantId), // Strict filter
      orderBy("name", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as CatalogService,
      );
      setCatalogServices(data);
    });
    return () => unsub();
  }, [initialized, currentUser]);

  // Cargar inventario unificado (Consumibles + Químicos)
  useEffect(() => {
    if (!initialized || !currentUser) return;
    
    // STRICT MULTI-TENANT QUERY
    // This assumes migration has been run for legacy items or they won't show up.
    // User explicitly requested strict filtering to match rules.
    const currentTenantId = currentUser.tenantId || "";
    if (!currentTenantId) return;


    const q = query(
      collection(db, COLLECTIONS.INVENTORY),
      where("tenantId", "==", currentTenantId),
      orderBy("name", "asc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const filteredData = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as InventoryItem
      );

      // No need for client-side filtering anymore since we rely on Firestore query
      // but we keep the logic clean.
      setInventoryItems(filteredData);
    });
    
    return () => unsub();
  }, [initialized, currentUser]);


  // Cargar extras
  useEffect(() => {
    if (!initialized || !currentUser) return;
    const currentTenantId = currentUser.tenantId || "";
    if (!currentTenantId) return;

    const q = query(
      collection(db, COLLECTIONS.CATALOG_EXTRAS),
      where("tenantId", "==", currentTenantId),
      orderBy("name", "asc"),
    );
    const unsub = onSnapshot(q, async (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as CatalogExtra,
      );
      setCatalogExtras(data);

      // Sincronizar precios automáticamente desde EXTRAS_CATALOG
      for (const extra of data) {
        const catalogExtra = EXTRAS_CATALOG.find((e) => e.id === extra.id);
        const currentPrice = extra.price || extra.priceSuggested || 0;

        if (catalogExtra && (!currentPrice || currentPrice === 0)) {
          try {
            await updateDoc(doc(db, COLLECTIONS.CATALOG_EXTRAS, extra.id), {
              price: catalogExtra.priceSuggested,
              priceSuggested: catalogExtra.priceSuggested,
            });
            console.log(
              `✅ Sincronizado: ${extra.name} - $${catalogExtra.priceSuggested}`,
            );
          } catch (error) {
            console.error(`❌ Error sincronizando ${extra.name}:`, error);
          }
        }
      }
    });
    return () => unsub();
  }, [initialized, currentUser]);


  // Cargar clientes
  useEffect(() => {
    if (!initialized || !currentUser) return;
    
    const currentTenantId = currentUser.tenantId || "";
    if (!currentTenantId) return;

    
    const q = query(
      collection(db, COLLECTIONS.CLIENTS),
      where("tenantId", "==", currentTenantId), // Strict filter
      orderBy("name", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client);
      setClients(data);
    });
    return () => unsub();
  }, [initialized, currentUser]);

  return {
    services,
    expenses,
    catalogServices,
    catalogExtras,
    clients,
    // History props
    historyServices,
    loadHistory,
    loadingHistory,
    historyFullyLoaded,
    inventoryItems,
  };
};
