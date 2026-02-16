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
  WriteBatch,
  increment,
} from "firebase/firestore";
import { db } from "../firebase";

import type {
  CatalogService,
  Consumable,
  ChemicalProduct,
  MaterialRecipe,
  ServiceRecipe,
  ServiceItem,
  MaterialInput,
  InventoryItem,
} from "../types";

// Collection names

const CONSUMABLES_COLLECTION = "consumables";
const CHEMICAL_PRODUCTS_COLLECTION = "chemical_products";
export const INVENTORY_COLLECTION = "inventory";

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
          { name: "Manicura con diseÃ±o", category: "manicura", basePrice: 15 },
          {
            name: "UÃ±as acrÃ­licas (base)",
            category: "manicura",
            basePrice: 25,
          },
          { name: "UÃ±as poligel (base)", category: "manicura", basePrice: 25 },
          { name: "Pedicure 1 tono", category: "pedicura", basePrice: 15 },
          { name: "Pedicure francesa", category: "pedicura", basePrice: 18 },
          { name: "Pedicura limpieza", category: "pedicura", basePrice: 10 },
          { name: "Manicura limpieza", category: "manicura", basePrice: 7 },
          {
            name: "Rubber uÃ±as cortas 1 tono",
            category: "manicura",
            basePrice: 20,
          },
          {
            name: "Rubber uÃ±as largas 1 tono",
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
            name: "AlgodÃ³n",
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
            name: "Campo quirÃºrgico",
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
): Promise<string> => {
  if (!name.trim() || basePrice <= 0) {
    throw new Error("Datos invÃ¡lidos");
  }
  
  const docRef = await addDoc(collection(db, "catalog_services"), {
    name: name.trim(),
    category,
    basePrice,
    active: true,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
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
    throw new Error("Datos invÃ¡lidos");
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



export const addConsumable = async (
  consumable: Omit<Consumable, "id" | "active">
): Promise<void> => {
  // CORRECCIÃ“N: Validamos purchasePrice en lugar de unitCost (que ahora es opcional)
   if (
        !consumable.name ||
        !consumable.unit ||
        (consumable.purchasePrice || 0) < 0 || 
        consumable.stockQty < 0 ||
        consumable.minStockAlert < 0
      ) {
        throw new Error("Datos invÃ¡lidos");
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
       throw new Error("Datos invÃ¡lidos");
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


   // Recalculate costPerService if price or yield changes
   if (updates.purchasePrice !== undefined || updates.yield !== undefined) {
       if (!currentProduct) {
           // Need to fetch current if not provided
           const snap = await getDoc(doc(db, CHEMICAL_PRODUCTS_COLLECTION, id));
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

// 1. DEDUCT CONSUMABLES (Unified)
export const deductConsumables = async (
  serviceId: string,
  serviceName: string,
  serviceRecipes: ServiceRecipe[],
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
): Promise<void> => {
  try {
    const catalogService = catalogServices.find(
      s => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );
    
    let itemsToDeduct: { consumableId: string; qty: number }[] = [];
    
    if (catalogService?.manualConsumables !== undefined && catalogService?.manualConsumables !== null) {
      itemsToDeduct = catalogService.manualConsumables;
    } else {
      const recipe = serviceRecipes.find(r => r.serviceId === serviceId);
      itemsToDeduct = recipe?.items || [];
    }
    
    for (const item of itemsToDeduct) {
      let product = inventoryItems.find(p => p.id === item.consumableId || p.originalId === item.consumableId);
      if (!product) product = inventoryItems.find(p => p.id === item.consumableId);
      
      if (product) {
        let currentContent = product.currentContent ?? product.content ?? 0;
        let stock = product.stock;
        const contentPerUnit = product.content || 1;
        
        currentContent -= item.qty;

        while (currentContent < 0 && stock > 0) {
            stock--;
            currentContent += contentPerUnit;
        }

        const productRef = doc(db, INVENTORY_COLLECTION, product.id);
        await updateDoc(productRef, {
            stock: stock,
            currentContent: parseFloat(currentContent.toFixed(2)),
            lastDeducted: new Date().toISOString(),
        });
      }
    }
  } catch (error) {
    console.error('❌ Error descargando consumibles:', error);
  }
};

export const calculateTotalReplenishmentCost = (
  services: ServiceItem[],
  materialRecipes: MaterialRecipe[],
  catalogServices: CatalogService[] = [],
  inventoryItems: InventoryItem[] = []
): number => {
  let totalCost = 0;

  for (const service of services) {
    let serviceCost = 0;
    const catalogService = catalogServices.find(
      (cs) => cs.id === service.serviceId || 
              cs.name?.toLowerCase() === service.serviceName.toLowerCase()
    );

    // 1. MATERIALES
    let materialsToCalc: MaterialInput[] = [];
    if (catalogService?.manualMaterials) {
        materialsToCalc = catalogService.manualMaterials;
    } else {
         const recipe = materialRecipes.find(r => r.serviceName.toLowerCase() === service.serviceName.toLowerCase());
         materialsToCalc = recipe ? recipe.chemicalIds : [];
    }

    for (const item of materialsToCalc) {
        let materialId = "";
        let qty = 1;

        if (typeof item === 'string') {
            materialId = item;
        } else if (typeof item === 'object' && item !== null) {
             materialId = (item as any).id || (item as any).materialId;
             qty = (item as any).quantity || (item as any).qty || (item as any).amount || 1;
        }

        const product = inventoryItems.find(p => p.id === materialId || p.originalId === materialId);
        if (product) {
             const yieldTotal = product.content || 1;
             const unitCost = yieldTotal > 0 ? (product.purchasePrice || 0) / yieldTotal : 0;
             serviceCost += unitCost * qty;
        }
    }

    // 2. CONSUMIBLES
    if (catalogService?.manualConsumables) {
        for (const item of catalogService.manualConsumables) {
             const product = inventoryItems.find(p => p.id === item.consumableId || p.originalId === item.consumableId);
             if (product) {
                 const yieldTotal = product.content || 1;
                 const unitCost = yieldTotal > 0 ? (product.purchasePrice || 0) / yieldTotal : 0;
                 serviceCost += unitCost * item.qty;
             }
        }
    }

    totalCost += serviceCost;
  }
  return totalCost;
};

// ====== Recipe-Based Inventory Deduction ======

export const deductInventoryByRecipe = async (
  serviceId: string,
  serviceName: string,
  materialRecipes: MaterialRecipe[],
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = [] 
): Promise<void> => {
  try {
    const catalogService = catalogServices.find(
      (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );
    
    let materialsToDeduct: MaterialInput[] = [];
    
    if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
      materialsToDeduct = catalogService.manualMaterials;
    } else {
      const recipe = materialRecipes.find(
        (r) => r.serviceId === serviceId || r.serviceName.toLowerCase() === serviceName.toLowerCase()
      );
      materialsToDeduct = recipe ? recipe.chemicalIds : [];
    }
    
    if (materialsToDeduct.length === 0) return;

    for (const item of materialsToDeduct) {
      let materialId: string = "";
      let qtyUsed = 0;

      if (typeof item === 'string') {
        materialId = item;
        qtyUsed = 1;
      } else if (typeof item === 'object' && item !== null) {
        materialId = item.id || item.materialId || ""; 
        qtyUsed = item.quantity || item.qty || item.amount || 1;
      }

      if (!materialId) continue;
      
      let product = inventoryItems.find((p) => p.id === materialId || p.originalId === materialId);
      if (!product && materialId) {
             const normalizedSearchName = materialId.toLowerCase().replace(/_/g, ' ').trim();
             product = inventoryItems.find(p => {
                const normalizedProductName = p.name.toLowerCase().replace(/_/g, ' ').trim();
                return normalizedProductName === normalizedSearchName;
             });
      }
      
      if (!product) continue;

      let currentContent = product.currentContent ?? product.content ?? 0;
      let stock = product.stock;
      const contentPerUnit = product.content || 1;

      currentContent -= qtyUsed;

      while (currentContent < 0 && stock > 0) {
          stock--;
          currentContent += contentPerUnit;
      }

      const productRef = doc(db, INVENTORY_COLLECTION, product.id);
      await updateDoc(productRef, {
        currentContent: parseFloat(currentContent.toFixed(2)),
        stock
      });
    }
  } catch (error) {
    console.error(`❌ Error al descontar inventario:`, error);
  }
};

// ====== Inventory Restoration (For Service Updates/Deletions) ======

export const restoreInventoryByRecipe = async (
  serviceId: string,
  serviceName: string,
  materialRecipes: MaterialRecipe[],
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
): Promise<void> => {
  try {
    const catalogService = catalogServices.find(
      (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );

    let materialsToRestore: MaterialInput[] = [];

    if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
      materialsToRestore = catalogService.manualMaterials;
    } else {
      const recipe = materialRecipes.find(
        (r) => r.serviceId === serviceId || r.serviceName.toLowerCase() === serviceName.toLowerCase()
      );
      materialsToRestore = recipe ? recipe.chemicalIds : [];
    }

    if (materialsToRestore.length === 0) return;

    for (const item of materialsToRestore) {
      let materialId: string = "";
      let qtyUsed = 0;

      if (typeof item === 'string') {
        materialId = item;
        qtyUsed = 1;
      } else if (typeof item === 'object' && item !== null) {
        materialId = item.id || item.materialId || "";
        qtyUsed = item.quantity || item.qty || item.amount || 1;
      }

      if (!materialId) continue;

      let product = inventoryItems.find((p) => p.id === materialId || p.originalId === materialId);
      if (!product) {
            const normalizedSearchName = materialId.toLowerCase().replace(/_/g, ' ').trim();
             product = inventoryItems.find(p => {
                const normalizedProductName = p.name.toLowerCase().replace(/_/g, ' ').trim();
                return normalizedProductName === normalizedSearchName;
             });
      }
      
      if (!product) continue;
      
      let currentContent = product.currentContent ?? product.content ?? 0;
      let stock = product.stock;
      const contentPerUnit = product.content || 1;
      
      currentContent += qtyUsed;
      
      while (currentContent > contentPerUnit) {
          stock++;
          currentContent -= contentPerUnit;
      }
      
      const productRef = doc(db, INVENTORY_COLLECTION, product.id);
      await updateDoc(productRef, {
        currentContent: parseFloat(currentContent.toFixed(2)),
        stock
      });
    }

  } catch (error) {
    console.error("❌ Error restaurando inventario quimico:", error);
  }
};


export const restoreConsumables = async (
  serviceId: string,
  serviceName: string,
  serviceRecipes: ServiceRecipe[],
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
): Promise<void> => {
  try {
     const catalogService = catalogServices.find(
      s => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );
    
    let itemsToRestore: { consumableId: string; qty: number }[] = [];
    
    if (catalogService?.manualConsumables !== undefined && catalogService?.manualConsumables !== null) {
      itemsToRestore = catalogService.manualConsumables;
    } else {
      const recipe = serviceRecipes.find(r => r.serviceId === serviceId);
      itemsToRestore = recipe?.items || [];
    }
    
    for (const item of itemsToRestore) {
        let product = inventoryItems.find(c => c.id === item.consumableId || c.originalId === item.consumableId);
        if (!product) product = inventoryItems.find(c => c.id === item.consumableId);

        if (product) {
            let currentContent = product.currentContent ?? product.content ?? 0;
            let stock = product.stock;
            const contentPerUnit = product.content || 1;
            
            currentContent += item.qty;

            while (currentContent > contentPerUnit) {
                stock++;
                currentContent -= contentPerUnit;
            }

            const productRef = doc(db, INVENTORY_COLLECTION, product.id);
            await updateDoc(productRef, {
               currentContent: parseFloat(currentContent.toFixed(2)),
               stock
            });
        }
    }
  } catch (error) {
      console.error("❌ Error restaurando consumibles:", error);
  }
};


// ====== Consumables Helper Functions ======

/**
 * Calcula el costo por unidad de un consumible
 */
export const getConsumableCostPerUnit = (consumable: Consumable): number => {
  if (consumable.purchasePrice && consumable.packageSize) {
    return consumable.purchasePrice / consumable.packageSize;
  }
  // Fallback a unitCost legacy
  return consumable.unitCost || 0;
};

/**
 * Calcula el costo total de consumibles para un servicio
 */
export const calculateConsumableCost = (consumable: Consumable, qty: number): number => {
  const costPerUnit = getConsumableCostPerUnit(consumable);
  return costPerUnit * qty;
};

/**
 * Obtiene el rendimiento (servicios restantes) de un consumible
 */
export const getConsumableYield = (consumable: Consumable, qtyPerService: number = 1): number => {
  return Math.floor(consumable.stockQty / qtyPerService);
};

/**
 * Verifica si un consumible estÃ¡ en stock bajo
 */
// ====== Batch Operations (New) ======

export const batchDeductInventoryByRecipe = (
  batch: WriteBatch,
  serviceId: string,
  serviceName: string,
  materialRecipes: MaterialRecipe[],
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catÃ¡logo
  const catalogService = catalogServices.find(
    (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
  );

  // 2. Determinar materiales a descontar
  let materialsToDeduct: MaterialInput[] = [];
  
  // SI manualMaterials existe, usar eso
  if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
    materialsToDeduct = catalogService.manualMaterials;
  } else {
    // FALLBACK: Recetas antiguas
    const recipe = materialRecipes.find(
      (r) => r.serviceId === serviceId || r.serviceName.toLowerCase() === serviceName.toLowerCase()
    );
    materialsToDeduct = recipe ? recipe.chemicalIds : [];
  }

  if (materialsToDeduct.length === 0) return;

  materialsToDeduct.forEach((item) => {
      // 1. DETECCIÃ“N DE TIPO BLINDADA
      let materialId: string = "";
      let qtyUsed = 0;

      if (typeof item === 'string') {
        materialId = item;
        qtyUsed = 1; // Default: 1 unidad si no se especifica
      } else if (typeof item === 'object' && item !== null) {
        materialId = item.id || item.materialId || ""; 
        qtyUsed = item.quantity || item.qty || item.amount || 1;
      }

      if (!materialId) return;

      // 2. BUSCAR PRODUCTO (En el array de inventario unificado)
      // Check ID or originalId
      let product = inventoryItems.find((p) => p.id === materialId || p.originalId === materialId);
      
      if (!product) {
         // Fallback bÃºsqueda por nombre
         const normalizedSearchName = materialId.toLowerCase().replace(/_/g, ' ').trim();
         product = inventoryItems.find(p => {
            const normalizedProductName = p.name.toLowerCase().replace(/_/g, ' ').trim();
            return normalizedProductName === normalizedSearchName;
         });
      }

      if (!product) return;

      // 3. LOGICA DE DESCUENTO
      // Usar currentContent y stock
      let currentContent = product.currentContent ?? product.content ?? 0;
      let stock = product.stock;
      const contentPerUnit = product.content || 1;
      
      // Restar cantidad usada
      currentContent -= qtyUsed;

      // Rollover: Si currentContent es negativo, consumir stock
      // Ejemplo: currentContent = -5, content = 500. stock--. currentContent = 495.
      while (currentContent < 0 && stock > 0) {
          stock--;
          currentContent += contentPerUnit;
      }
      
      // Si aÃºn es negativo y no hay stock, se queda negativo para indicar dÃ©ficit real
      // (o podriamos dejarlo en 0, pero negativo es mÃ¡s informativo para reabastecer)
      
      // 4. ACTUALIZAR BATCH
      // Usar INVENTORY_COLLECTION (que debe estar definido en el archivo)
      // Hardcoding string "inventory" just in case constant is far away or duplicated
      const productRef = doc(db, "inventory", product.id);
      
      batch.update(productRef, {
          stock: stock,
          currentContent: parseFloat(currentContent.toFixed(2)),
          // updateAt?
      });
  });
};


export const batchDeductConsumables = (
  batch: WriteBatch,
  serviceId: string,
  serviceName: string,
  serviceRecipes: ServiceRecipe[],
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catÃ¡logo
  const catalogService = catalogServices.find(
    s => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
  );
  
  let itemsToDeduct: { consumableId: string; qty: number }[] = [];
  
  // PRIORIDAD 1: manualConsumables
  if (catalogService?.manualConsumables !== undefined && catalogService?.manualConsumables !== null) {
    itemsToDeduct = catalogService.manualConsumables;
  } else {
    // PRIORIDAD 2: serviceRecipes
    const recipe = serviceRecipes.find(r => r.serviceId === serviceId);
    itemsToDeduct = recipe?.items || [];
  }

  if (itemsToDeduct.length === 0) return;

  itemsToDeduct.forEach(item => {
      // Check ID or originalId
      // Note: Consumables in legacy might be mapped. 
      let product = inventoryItems.find(p => p.id === item.consumableId || p.originalId === item.consumableId);
      
      if (!product) {
          // Try name match if ID fails? Unlikely for consumables but safely
          // Consumables typically don't fail by ID if data is clean.
          // But strict generic search:
          product = inventoryItems.find(p => p.id === item.consumableId);
      }
    
      if (product) {
          // LOGICA DE DESCUENTO UNIFICADA
          let currentContent = product.currentContent ?? product.content ?? 0;
          let stock = product.stock;
          const contentPerUnit = product.content || 1; 
          
          const qtyUsed = item.qty;

          // Restar
          currentContent -= qtyUsed;

          // Rollover
          while (currentContent < 0 && stock > 0) {
              stock--;
              currentContent += contentPerUnit;
          }
          
          const productRef = doc(db, "inventory", product.id);
          
          batch.update(productRef, {
              stock: stock,
              currentContent: parseFloat(currentContent.toFixed(2)),
          });
      }
  });
};

export const isConsumableLowStock = (consumable: Consumable): boolean => {
  return consumable.stockQty <= consumable.minStockAlert;
};

// ====== Batch Restore Operations (For Service Deletion/Updates) ======

export const batchRestoreInventoryByRecipe = (
  batch: WriteBatch,
  serviceId: string,
  serviceName: string,
  materialRecipes: MaterialRecipe[],
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catÃ¡logo
  const catalogService = catalogServices.find(
    (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
  );

  // 2. Determinar materiales a restaurar
  let materialsToRestore: MaterialInput[] = [];
  
  if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
    materialsToRestore = catalogService.manualMaterials;
  } else {
    const recipe = materialRecipes.find(
      (r) => r.serviceId === serviceId || r.serviceName.toLowerCase() === serviceName.toLowerCase()
    );
    materialsToRestore = recipe ? recipe.chemicalIds : [];
  }

  if (materialsToRestore.length === 0) return;

  materialsToRestore.forEach((item) => {
      let materialId: string = "";
      let qtyUsed = 0;

      if (typeof item === 'string') {
        materialId = item;
        qtyUsed = 1;
      } else if (typeof item === 'object' && item !== null) {
        materialId = item.id || item.materialId || ""; 
        qtyUsed = item.quantity || item.qty || item.amount || 1;
      }

      if (!materialId) return;

      // 2. BUSCAR PRODUCTO
      let product = inventoryItems.find((p) => p.id === materialId || p.originalId === materialId);
      
      if (!product) {
         const normalizedSearchName = materialId.toLowerCase().replace(/_/g, ' ').trim();
         product = inventoryItems.find(p => {
            const normalizedProductName = p.name.toLowerCase().replace(/_/g, ' ').trim();
            return normalizedProductName === normalizedSearchName;
         });
      }

      if (!product) return;

      // 3. RESTAURACIÃ“N LÃ“GICA
      let currentContent = product.currentContent ?? product.content ?? 0;
      let stock = product.stock;
      const contentPerUnit = product.content || 1;

      // Restaurar cantidad
      currentContent += qtyUsed;

      // Rollover inverso: Si excede el contenido, aumentar stock
      while (currentContent > contentPerUnit) {
          stock++;
          currentContent -= contentPerUnit;
      }

      // 4. ACTUALIZAR BATCH
      const productRef = doc(db, "inventory", product.id);
      
      batch.update(productRef, {
          stock: stock,
          currentContent: parseFloat(currentContent.toFixed(2)),
      });
  });
};


export const batchRestoreConsumables = (
  batch: WriteBatch,
  serviceId: string,
  serviceName: string,
  serviceRecipes: ServiceRecipe[],
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catÃ¡logo
  const catalogService = catalogServices.find(
    s => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
  );
  
  let itemsToRestore: { consumableId: string; qty: number }[] = [];
  
  if (catalogService?.manualConsumables !== undefined && catalogService?.manualConsumables !== null) {
    itemsToRestore = catalogService.manualConsumables;
  } else {
    const recipe = serviceRecipes.find(r => r.serviceId === serviceId);
    itemsToRestore = recipe?.items || [];
  }

  itemsToRestore.forEach(item => {
      let product = inventoryItems.find(p => p.id === item.consumableId || p.originalId === item.consumableId);
      
      if (!product) {
          product = inventoryItems.find(p => p.id === item.consumableId);
      }
    
      if (product) {
          // RESTAURACIÃ“N LÃ“GICA
          let currentContent = product.currentContent ?? product.content ?? 0;
          let stock = product.stock;
          const contentPerUnit = product.content || 1;
          
          const qtyUsed = item.qty;

          // Restaurar
          currentContent += qtyUsed;

          // Rollover inverso
          while (currentContent > contentPerUnit) {
              stock++;
              currentContent -= contentPerUnit;
          }
          
          const productRef = doc(db, "inventory", product.id);
          
          batch.update(productRef, {
              stock: stock,
              currentContent: parseFloat(currentContent.toFixed(2)),
          });
      }
  });
};


// ====== Unified Inventory Management (New) ======



export const addInventoryItem = async (item: any): Promise<void> => {
  if (!item.name || item.purchasePrice < 0) {
    throw new Error("Datos inválidos");
  }

  await addDoc(collection(db, INVENTORY_COLLECTION), {
    ...item,
    active: true,
    createdAt: serverTimestamp(),
  });
};

export const updateInventoryItem = async (
  id: string,
  updates: any
): Promise<void> => {
  await updateDoc(doc(db, INVENTORY_COLLECTION, id), updates);
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, INVENTORY_COLLECTION, id));
};
