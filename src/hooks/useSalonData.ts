import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  doc,
  updateDoc,
} from "firebase/firestore";
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

  // Cargar servicios
  useEffect(() => {
    if (!initialized) return;

    const q = query(
      collection(db, COLLECTIONS.SERVICES),
      orderBy("timestamp", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map(
          (d) => ({ id: d.id, ...d.data() }) as Service,
        );
        setServices(data);
      },
      (error) => {
        console.error("Error cargando servicios:", error);
      },
    );

    return () => unsub();
  }, [initialized]);

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

  // Cargar consumibles
  useEffect(() => {
    if (!initialized) return;
    const q = query(
      collection(db, COLLECTIONS.CONSUMABLES),
      orderBy("name", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as Consumable,
      );
      setConsumables(data);
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
        const currentPrice = (extra as any).price || extra.priceSuggested || 0;

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

  // Cargar productos químicos
  useEffect(() => {
    if (!initialized) return;
    const q = query(
      collection(db, COLLECTIONS.CHEMICAL_PRODUCTS),
      orderBy("name", "asc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as ChemicalProduct,
      );
      setChemicalProducts(data);
    });
    return () => unsub();
  }, [initialized]);

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
  };
};
