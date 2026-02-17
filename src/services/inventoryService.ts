import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  runTransaction,
  serverTimestamp,
  WriteBatch,
} from "firebase/firestore";
import { db } from "../firebase";

import type {
  CatalogService,
  CatalogExtra,
  
  
  ServiceItem,
  MaterialInput,
  InventoryItem,
} from "../types";

// Collection names
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
            basePrice: 12,
          },
          { name: "Manicura con diseño", basePrice: 15 },
          {
            name: "Uñas acrílicas (base)",
            basePrice: 25,
          },
          { name: "Uñas poligel (base)", basePrice: 25 },
          { name: "Pedicure 1 tono", basePrice: 15 },
          { name: "Pedicure francesa", basePrice: 18 },
          { name: "Pedicura limpieza", basePrice: 10 },
          { name: "Manicura limpieza", basePrice: 7 },
          {
            name: "Rubber uñas cortas 1 tono",
            basePrice: 20,
          },
          {
            name: "Rubber uñas largas 1 tono",
            basePrice: 25,
          },
          { name: "Gel builder 1 tono", basePrice: 25 },
          {
            name: "Gel builder alargamiento",
            basePrice: 30,
          },
          {
            name: "Pedicure spa velo terapia 1 tono",
            basePrice: 30,
          },
          { name: "Jelly spa 1 tono", basePrice: 40 },
        ];

        defaultServices.forEach((s) => {
          const newRef = doc(collection(db, "catalog_services"));
          tx.set(newRef, { ...s, active: true, createdAt: serverTimestamp() });
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
  basePrice: number,
  tenantId: string
): Promise<string> => {
  if (!name.trim() || basePrice <= 0) {
    throw new Error("Datos inválidos");
  }
  
  if (!tenantId || !tenantId.trim()) {
    throw new Error("TenantId es requerido para crear un servicio");
  }
  
  const docRef = await addDoc(collection(db, "catalog_services"), {
    name: name.trim(),
    basePrice,
    active: true,
    tenantId,
    createdAt: serverTimestamp(),
  });

  return docRef.id;
};

export const updateCatalogService = async (
  id: string,
  updates: Partial<CatalogService>
): Promise<void> => {
  const docRef = doc(db, "catalog_services", id);
  await updateDoc(docRef, updates);
};

export const deleteCatalogService = async (id: string): Promise<void> => {
  const docRef = doc(db, "catalog_services", id);
  await deleteDoc(docRef);
};

// Extras Management

export const addExtra = async (name: string, price: number, tenantId: string): Promise<void> => {
  if (!name.trim() || price < 0) {
    throw new Error("Datos inválidos");
  }
  
  if (!tenantId || !tenantId.trim()) {
    throw new Error("TenantId es requerido para crear un extra");
  }

  await addDoc(collection(db, "catalog_extras"), {
    name: name.trim(),
    price,
    priceSuggested: price,
    active: true,
    createdAt: serverTimestamp(),
    tenantId
  });
};

export const updateExtra = async (
  id: string,
  updates: Partial<CatalogExtra>
): Promise<void> => {
  const docRef = doc(db, "catalog_extras", id);
  await updateDoc(docRef, updates);
};

export const deleteExtra = async (id: string): Promise<void> => {
  const docRef = doc(db, "catalog_extras", id);
  await deleteDoc(docRef);
};

// ====== Helpers for Service Logic (Shared) ======

// 1. DEDUCT CONSUMABLES (Unified)
export const deductConsumables = async (
  serviceId: string,
  serviceName: string,
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
): Promise<void> => {
  try {
    // catalogService removed - unused
    // No consumables logic needed - removed
  } catch (error) {
    console.error('❌ Error descargando consumibles:', error);
  }
};

export const calculateTotalReplenishmentCost = (
  services: ServiceItem[],
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
    // No consumables logic needed - removed

    totalCost += serviceCost;
  }
  return totalCost;
};

// ====== Recipe-Based Inventory Deduction ======

export const deductInventoryByRecipe = async (
  serviceId: string,
  serviceName: string,
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = [] 
): Promise<void> => {
  try {
    const catalogService = catalogServices.find(
      (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );
    
    let materialsToDeduct: MaterialInput[] = [];
    
    if (catalogService?.manualMaterials) {
      materialsToDeduct = catalogService.manualMaterials;
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
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
): Promise<void> => {
  try {
    const catalogService = catalogServices.find(
      (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );

    let materialsToRestore: MaterialInput[] = [];

    if (catalogService?.manualMaterials) {
      materialsToRestore = catalogService.manualMaterials;
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
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
): Promise<void> => {
  try {
     // catalogService removed - unused
    // No consumables logic needed - removed
  } catch (error) {
      console.error("❌ Error restaurando consumibles:", error);
  }
};


// ====== Consumables Helper Functions ======



export const batchDeductInventoryByRecipe = (
  batch: WriteBatch,
  serviceId: string,
  serviceName: string,
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catÃ¡logo
  const catalogService = catalogServices.find(
    (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
  );

  // 2. Determinar materiales a descontar
  let materialsToDeduct: MaterialInput[] = [];
  
  if (catalogService?.manualMaterials) {
    materialsToDeduct = catalogService.manualMaterials;
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
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catÃ¡logo
  // catalogService removed - unused
  
  // No consumables logic needed - removed
};

export const isConsumableLowStock = (item: InventoryItem): boolean => {
  return item.stock <= (item.minStock || 0);
};

// ====== Batch Restore Operations (For Service Deletion/Updates) ======

export const batchRestoreInventoryByRecipe = (
  batch: WriteBatch,
  serviceId: string,
  serviceName: string,
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catÃ¡logo
  const catalogService = catalogServices.find(
    (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
  );

  // 2. Determinar materiales a restaurar
  let materialsToRestore: MaterialInput[] = [];
  
  if (catalogService?.manualMaterials) {
    materialsToRestore = catalogService.manualMaterials;
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
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catÃ¡logo
  // catalogService removed - unused
  
};


// ====== Unified Inventory Management (New) ======



export const addInventoryItem = async (item: Omit<InventoryItem, 'id'>): Promise<void> => {
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
  updates: Partial<InventoryItem>
): Promise<void> => {
  await updateDoc(doc(db, INVENTORY_COLLECTION, id), updates);
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  await deleteDoc(doc(db, INVENTORY_COLLECTION, id));
};
