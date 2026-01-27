import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import { EXTRAS_CATALOG, RECIPE_COSTS } from "../constants/catalog";
import type {
  CatalogService,
  Consumable,
  ChemicalProduct,
  MaterialRecipe,
  ServiceItem,
} from "../types";

// ====== Catalog Management ======

export const initializeCatalog = async (): Promise<boolean> => {
  try {
    const metaRef = doc(db, "meta", "catalog");
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists() && metaSnap.data()?.seeded) return false;

    await runTransaction(db, async (tx) => {
        // Servicios base
        const defaultServices = [
          {
            name: "Manicura en gel 1 solo color",
            category: "manicura",
            basePrice: 12,
          },
          { name: "Manicura con diseño", category: "manicura", basePrice: 15 },
          {
            name: "Uñas acrílicas (base)",
            category: "manicura",
            basePrice: 25,
          },
          { name: "Uñas poligel (base)", category: "manicura", basePrice: 25 },
          { name: "Pedicure 1 tono", category: "pedicura", basePrice: 15 },
          { name: "Pedicure francesa", category: "pedicura", basePrice: 18 },
          { name: "Pedicura limpieza", category: "pedicura", basePrice: 10 },
          { name: "Manicura limpieza", category: "manicura", basePrice: 7 },
          {
            name: "Rubber uñas cortas 1 tono",
            category: "manicura",
            basePrice: 20,
          },
          {
            name: "Rubber uñas largas 1 tono",
            category: "manicura",
            basePrice: 25,
          },
          { name: "Gel builder 1 tono", category: "manicura", basePrice: 25 },
          {
            name: "Gel builder alargamiento",
            category: "manicura",
            basePrice: 30,
          },
          {
            name: "Pedicure spa velo terapia 1 tono",
            category: "pedicura",
            basePrice: 30,
          },
          { name: "Jelly spa 1 tono", category: "pedicura", basePrice: 40 },
        ];

        defaultServices.forEach((s) => {
          const newRef = doc(collection(db, "catalog_services"));
          tx.set(newRef, { ...s, active: true, createdAt: serverTimestamp() });
        });

        // Consumibles actualizados
        const defaultConsumables = [
          {
            name: "Algodón",
            unit: "gramo",
            unitCost: 0.02,
            stockQty: 500,
            minStockAlert: 150,
          },
          {
            name: "Bastoncillos",
            unit: "unidad",
            unitCost: 0.01,
            stockQty: 100,
            minStockAlert: 10,
          },
          {
            name: "Campo quirúrgico",
            unit: "unidad",
            unitCost: 0.06,
            stockQty: 100,
            minStockAlert: 10,
          },
          {
            name: "Gorro",
            unit: "unidad",
            unitCost: 0.03,
            stockQty: 100,
            minStockAlert: 10,
          },
          {
            name: "Guantes (par)",
            unit: "par",
            unitCost: 0.13,
            stockQty: 50,
            minStockAlert: 10,
          },
          {
            name: "Mascarillas",
            unit: "unidad",
            unitCost: 0.02,
            stockQty: 100,
            minStockAlert: 10,
          },
          {
            name: "Moldes esculpir",
            unit: "unidad",
            unitCost: 0.02,
            stockQty: 300,
            minStockAlert: 50,
          },
          {
            name: "Palillo naranja",
            unit: "unidad",
            unitCost: 0.01,
            stockQty: 100,
            minStockAlert: 10,
          },
          {
            name: "Papel film",
            unit: "metro",
            unitCost: 0.0247,
            stockQty: 150,
            minStockAlert: 30,
          },
          {
            name: "Toalla desechable",
            unit: "metro",
            unitCost: 0.025,
            stockQty: 50,
            minStockAlert: 10,
          },
          {
            name: "Wipes",
            unit: "unidad",
            unitCost: 0.01,
            stockQty: 400,
            minStockAlert: 50,
          },
        ];

        defaultConsumables.forEach((c) => {
          const newRef = doc(collection(db, "consumables"));
          tx.set(newRef, { ...c, active: true, createdAt: serverTimestamp() });
        });
      
      tx.set(
        metaRef,
        { seeded: true, seededAt: serverTimestamp() },
        { merge: true },
      );
    });
    return true;
  } catch (error) {
    console.error("Error initializing catalog:", error);
    throw error;
  }
};

export const addCatalogService = async (
  name: string,
  category: "manicura" | "pedicura",
  basePrice: number
): Promise<void> => {
  if (!name.trim() || basePrice <= 0) {
    throw new Error("Datos inválidos");
  }
  
  await addDoc(collection(db, "catalog_services"), {
    name: name.trim(),
    category,
    basePrice,
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const updateCatalogService = async (
  id: string,
  updated: Partial<CatalogService>
): Promise<void> => {
  await updateDoc(doc(db, "catalog_services", id), updated);
};

export const deleteCatalogService = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "catalog_services", id));
};

// ====== Extras Management ======

export const addExtra = async (name: string, price: number): Promise<void> => {
  if (!name.trim() || price < 0) {
    throw new Error("Datos inválidos");
  }

  await addDoc(collection(db, "catalog_extras"), {
    name: name.trim(),
    price,
    priceSuggested: price,
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const updateExtra = async (
  id: string,
  updates: { name?: string; price?: number; active?: boolean; priceSuggested?: number }
): Promise<void> => {
  await updateDoc(doc(db, "catalog_extras", id), updates);
};

export const deleteExtra = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "catalog_extras", id));
};

// ====== Consumables Management ======

export const initializeMaterialsData = async (): Promise<void> => {
  try {
    const metaRef = doc(db, "meta", "materials");
    const metaSnap = await getDoc(metaRef);

    if (metaSnap.exists() && metaSnap.data()?.seeded) return;

    await runTransaction(db, async (tx) => {
      // Seeding initial materials if needed
      // Logic from provided code snippet suggests we just set meta
       tx.set(
        metaRef,
        { seeded: true, seededAt: serverTimestamp() },
        { merge: true },
      );
    });
  } catch (error) {
     console.error("Error initializing materials:", error);
     throw error;
  }
};

export const addConsumable = async (
  consumable: Omit<Consumable, "id" | "active">
): Promise<void> => {
   if (
        !consumable.name ||
        !consumable.unit ||
        consumable.unitCost < 0 ||
        consumable.stockQty < 0 ||
        consumable.minStockAlert < 0
      ) {
        throw new Error("Datos inválidos");
      }

  await addDoc(collection(db, "consumables"), {
    ...consumable,
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const updateConsumable = async (
  id: string,
  updated: Partial<Consumable>
): Promise<void> => {
  await updateDoc(doc(db, "consumables", id), updated);
};

export const deleteConsumable = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "consumables", id));
};

// ====== Chemical Products Management ======

export const addChemicalProduct = async (
  product: Omit<ChemicalProduct, "id" | "active">
): Promise<void> => {
   if (!product.name || product.purchasePrice < 0 || product.yield <= 0) {
       throw new Error("Datos inválidos");
   }

  await addDoc(collection(db, "chemical_products"), {
    ...product,
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const updateChemicalProduct = async (
  id: string,
  updates: Partial<ChemicalProduct>,
  currentProduct?: ChemicalProduct // Optional optimization to avoid extra read if caller has it
): Promise<void> => {
   let costPerService = updates.costPerService;

   // Recalculate costPerService if price or yield changes
   if (updates.purchasePrice !== undefined || updates.yield !== undefined) {
       if (!currentProduct) {
           // Need to fetch current if not provided
           const snap = await getDoc(doc(db, "chemical_products", id));
           if (snap.exists()) {
               currentProduct = { id: snap.id, ...snap.data() } as ChemicalProduct;
           }
       }

       if (currentProduct) {
           const newPrice = updates.purchasePrice ?? currentProduct.purchasePrice;
           const newYield = updates.yield ?? currentProduct.yield;
           if (newYield > 0) {
                updates.costPerService = newPrice / newYield;
           }
       }
   }

  await updateDoc(doc(db, "chemical_products", id), updates);
};

export const deleteChemicalProduct = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, "chemical_products", id));
};

// ====== Helpers for Service Logic (Shared) ======

export const deductConsumables = async (serviceCategory: string): Promise<void> => {
  try {
    const consumablesToDeduct: { [key: string]: number } = {};

    if (serviceCategory === "manicura") {
      consumablesToDeduct["Guantes (par)"] = 1;
      consumablesToDeduct["Mascarilla"] = 1;
      consumablesToDeduct["Palillo naranja"] = 1;
      consumablesToDeduct["Bastoncillos"] = 1;
      consumablesToDeduct["Wipes"] = 1;
      consumablesToDeduct["Toalla desechable"] = 1;
      consumablesToDeduct["Gorro"] = 1;
      consumablesToDeduct["Campo quirúrgico"] = 1;
    } else if (serviceCategory === "pedicura") {
      consumablesToDeduct["Campo quirúrgico"] = 1;
      consumablesToDeduct["Algodón"] = 5;
      consumablesToDeduct["Guantes (par)"] = 1;
      consumablesToDeduct["Mascarilla"] = 1;
      consumablesToDeduct["Palillo naranja"] = 1;
      consumablesToDeduct["Wipes"] = 1;
      consumablesToDeduct["Gorro"] = 1;
      consumablesToDeduct["Bastoncillos"] = 1;
    }

    for (const [consumableName, quantity] of Object.entries(consumablesToDeduct)) {
      // NOTE: Querying by ID/Name convention. Adjust if using generated IDs vs named IDs.
      // App.tsx logic used `doc(db, "consumables", consumableName)`, implying IDs are names or mapped.
      const consumableRef = doc(db, "consumables", consumableName);
      const consumableSnap = await getDoc(consumableRef);

      if (consumableSnap.exists()) {
        const currentStock = consumableSnap.data().quantity || 0;
        await updateDoc(consumableRef, {
          quantity: Math.max(0, currentStock - quantity),
          lastDeducted: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.log("Error descargando consumibles (no critico):", error);
  }
};

export const calculateTotalReplenishmentCost = (
  services: ServiceItem[],
  materialRecipes: MaterialRecipe[]
): number => {
  let totalCost = 0;

  for (const service of services) {
    const recipe = materialRecipes.find(
      (r) => r.serviceName.toLowerCase() === service.serviceName.toLowerCase()
    );

    if (recipe) {
      totalCost += recipe.totalCost;
    } else {
      const serviceName = service.serviceName.toLowerCase();
      if (serviceName.includes("pedicure") || serviceName.includes("pedicura")) {
        totalCost += 0.5;
      } else {
        totalCost += 0.33;
      }
    }
  }

  return totalCost;
};
