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
} from "firebase/firestore";
import type { DocumentData } from "firebase/firestore";
import { db } from "../firebase";
import type {
  Service,
  Expense,
  CatalogService,
  Consumable,
  ServiceRecipe,
  CatalogExtra,
  ChemicalProduct,
  MaterialRecipe,
  Client,
} from "../types";
import { EXTRAS_CATALOG } from "../constants/catalog";
import { COLLECTIONS } from "../constants/app";

export const useSalonData = (initialized: boolean) => {
  const [services, setServices] = useState<Service[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [catalogServices, setCatalogServices] = useState<CatalogService[]>([]);
  const [consumables, setConsumables] = useState<Consumable[]>([]);
  const [serviceRecipes, setServiceRecipes] = useState<ServiceRecipe[]>([]);
  const [catalogExtras, setCatalogExtras] = useState<CatalogExtra[]>([]);
  const [chemicalProducts, setChemicalProducts] = useState<ChemicalProduct[]>(
    [],
  );
  const [materialRecipes, setMaterialRecipes] = useState<MaterialRecipe[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);

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
    if (!initialized) return;

    const q = query(
      collection(db, COLLECTIONS.SERVICES),
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
  }, [initialized]);

  // Cargar historial bajo demanda
  const loadHistory = async () => {
    if (loadingHistory || historyFullyLoaded) return;

    // Define pivot
    const pivot = lastVisible;
    if (!pivot) return;

    setLoadingHistory(true);
    try {
      // Query para obtener el siguiente lote de historial
      const q = query(
        collection(db, COLLECTIONS.SERVICES),
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
    if (!initialized) return;

    const q = query(
      collection(db, COLLECTIONS.EXPENSES),
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
  }, [initialized]);

  // Cargar catálogo de servicios
  useEffect(() => {
    if (!initialized) return;
    const q = query(
      collection(db, COLLECTIONS.CATALOG_SERVICES),
      orderBy("name", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as CatalogService,
      );
      setCatalogServices(data);
    });
    return () => unsub();
  }, [initialized]);

  // Cargar inventario unificado (Consumibles + Químicos)
  useEffect(() => {
    if (!initialized) return;
    
    const q = query(
      collection(db, COLLECTIONS.INVENTORY),
      orderBy("name", "asc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() })
      );
      setInventoryItems(data);

      // Compatibilidad con la UI existente:
      // Filtramos y asignamos a los estados antiguos
      const legacyConsumables = data.filter(item => 
        (item as any).type === "consumable" || (item as any).unit === "unidad"
      ) as Consumable[];
      
      const legacyChemicals = data.filter(item => 
        (item as any).type === "material" || ((item as any).unit !== "unidad" && (item as any).type !== "consumable")
      ) as ChemicalProduct[];

      setConsumables(legacyConsumables);
      setChemicalProducts(legacyChemicals);
    });
    
    return () => unsub();
  }, [initialized]);

  // Cargar recetas
  useEffect(() => {
    if (!initialized) return;
    const unsub = onSnapshot(
      collection(db, COLLECTIONS.SERVICE_RECIPES),
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as ServiceRecipe,
        );
        setServiceRecipes(data);
      },
    );
    return () => unsub();
  }, [initialized]);

  // Cargar extras
  useEffect(() => {
    if (!initialized) return;
    const q = query(
      collection(db, COLLECTIONS.CATALOG_EXTRAS),
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
  }, [initialized]);

  // Legacy Chemical Products Effect Removed - Handled by Inventory Effect

  // Cargar recetas de materiales
  useEffect(() => {
    if (!initialized) return;
    const q = query(collection(db, COLLECTIONS.MATERIAL_RECIPES));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as MaterialRecipe,
      );
      setMaterialRecipes(data);
    });
    return () => unsub();
  }, [initialized]);

  // Cargar clientes
  useEffect(() => {
    if (!initialized) return;
    const q = query(
      collection(db, COLLECTIONS.CLIENTS),
      orderBy("name", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Client);
      setClients(data);
    });
    return () => unsub();
  }, [initialized]);

  return {
    services,
    setServices,
    expenses,
    setExpenses,
    catalogServices,
    setCatalogServices,
    consumables,
    setConsumables,
    serviceRecipes,
    setServiceRecipes,
    catalogExtras,
    setCatalogExtras,
    chemicalProducts,
    setChemicalProducts,
    materialRecipes,
    setMaterialRecipes,
    clients,
    setClients,
    // History props
    historyServices,
    loadHistory,
    loadingHistory,
    historyFullyLoaded,
    inventoryItems, // Nuevo estado expuesto
  };
};
