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
  ExtraItem,
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

export const addExtra = async (name: string, price: number, tenantId: string): Promise<string> => {
  if (!name.trim() || price < 0) {
    throw new Error("Datos inválidos");
  }
  
  if (!tenantId || !tenantId.trim()) {
    throw new Error("TenantId es requerido para crear un extra");
  }

  const docRef = await addDoc(collection(db, "catalog_extras"), {
    name: name.trim(),
    price,
    priceSuggested: price,
    active: true,
    createdAt: serverTimestamp(),
    tenantId
  });
  return docRef.id;
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
             materialId = item.id || item.materialId || "";
             qty = item.quantity || item.qty || item.amount || 1;
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

export const calculateExtraReplenishmentCost = (
  extras: ExtraItem[],
  catalogExtras: CatalogExtra[] = [],
  inventoryItems: InventoryItem[] = []
): number => {
  let totalCost = 0;

  for (const extra of extras) {
    let extraCost = 0;
    const catalogExtra = catalogExtras.find(
      (ce) => ce.id === extra.extraId || 
              ce.name?.toLowerCase() === extra.extraName.toLowerCase()
    );

    // 1. MATERIALES
    let materialsToCalc: MaterialInput[] = [];
    if (catalogExtra?.manualMaterials) {
        materialsToCalc = catalogExtra.manualMaterials;
    }

    // Multiplicar por amount (uñas/sesiones si aplica, extras usualmente no multiplican los materiales base por el "nailsCount" sino que es 1 paquete por set, pero si "nailsCount" es relevante, podrías multiplicar por qty = material.qty * nailsCount. Dejaremos que use el qty de la receta como uso total del extra)
    // Extra uses the recipe per extra application (so 1x recipe no matter nailsCount, or 1/10th per nail?). Let's stick to 1x recipe since extras are applied once to service.
    for (const item of materialsToCalc) {
        let materialId = "";
        let qty = 1;

        if (typeof item === 'string') {
            materialId = item;
        } else if (typeof item === 'object' && item !== null) {
             materialId = item.id || item.materialId || "";
             qty = item.quantity || item.qty || item.amount || 1;
        }

        const product = inventoryItems.find(p => p.id === materialId || p.originalId === materialId);
        if (product) {
             const yieldTotal = product.content || 1;
             const unitCost = yieldTotal > 0 ? (product.purchasePrice || 0) / yieldTotal : 0;
             // Here we just add the cost of the material formula
             extraCost += unitCost * qty;
        }
    }

    totalCost += extraCost;
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





// ====== Consumables Helper Functions ======



export const batchDeductInventoryByRecipe = (
  batch: WriteBatch,
  serviceId: string,
  serviceName: string,
  inventoryItems: InventoryItem[],
  catalogServices: CatalogService[] = []
) => {
  // 1. Buscar servicio en catálogo
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
         // Fallback búsqueda por nombre
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
      const productRef = doc(db, INVENTORY_COLLECTION, product.id);
      
      batch.update(productRef, {
          stock: stock,
          currentContent: parseFloat(currentContent.toFixed(2)),
          // updateAt?
      });
  });
};

export const batchDeductInventoryByExtraRecipe = (
  batch: WriteBatch,
  extraId: string,
  extraName: string,
  inventoryItems: InventoryItem[],
  catalogExtras: CatalogExtra[] = []
) => {
  const catalogExtra = catalogExtras.find(
    (e) => e.id === extraId || e.name.toLowerCase() === extraName.toLowerCase()
  );

  let materialsToDeduct: MaterialInput[] = [];
  
  if (catalogExtra?.manualMaterials) {
    materialsToDeduct = catalogExtra.manualMaterials;
  }

  if (materialsToDeduct.length === 0) return;

  materialsToDeduct.forEach((item) => {
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

      let product = inventoryItems.find((p) => p.id === materialId || p.originalId === materialId);
      
      if (!product) {
         const normalizedSearchName = materialId.toLowerCase().replace(/_/g, ' ').trim();
         product = inventoryItems.find(p => {
            const normalizedProductName = p.name.toLowerCase().replace(/_/g, ' ').trim();
            return normalizedProductName === normalizedSearchName;
         });
      }

      if (!product) return;

      let currentContent = product.currentContent ?? product.content ?? 0;
      let stock = product.stock;
      const contentPerUnit = product.content || 1;
      
      currentContent -= qtyUsed;

      while (currentContent < 0 && stock > 0) {
          stock--;
          currentContent += contentPerUnit;
      }
      
      const productRef = doc(db, INVENTORY_COLLECTION, product.id);
      
      batch.update(productRef, {
          stock: stock,
          currentContent: parseFloat(currentContent.toFixed(2)),
      });
  });
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
  // 1. Buscar servicio en catálogo
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
      const productRef = doc(db, INVENTORY_COLLECTION, product.id);
      
      batch.update(productRef, {
          stock: stock,
          currentContent: parseFloat(currentContent.toFixed(2)),
      });
  });
};

export const batchRestoreInventoryByExtraRecipe = (
  batch: WriteBatch,
  extraId: string,
  extraName: string,
  inventoryItems: InventoryItem[],
  catalogExtras: CatalogExtra[] = []
) => {
  const catalogExtra = catalogExtras.find(
    (e) => e.id === extraId || e.name.toLowerCase() === extraName.toLowerCase()
  );

  let materialsToRestore: MaterialInput[] = [];
  
  if (catalogExtra?.manualMaterials) {
    materialsToRestore = catalogExtra.manualMaterials;
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

      let product = inventoryItems.find((p) => p.id === materialId || p.originalId === materialId);
      
      if (!product) {
         const normalizedSearchName = materialId.toLowerCase().replace(/_/g, ' ').trim();
         product = inventoryItems.find(p => {
            const normalizedProductName = p.name.toLowerCase().replace(/_/g, ' ').trim();
            return normalizedProductName === normalizedSearchName;
         });
      }

      if (!product) return;

      let currentContent = product.currentContent ?? product.content ?? 0;
      let stock = product.stock;
      const contentPerUnit = product.content || 1;

      currentContent += qtyUsed;

      while (currentContent > contentPerUnit) {
          stock++;
          currentContent -= contentPerUnit;
      }

      const productRef = doc(db, INVENTORY_COLLECTION, product.id);
      
      batch.update(productRef, {
          stock: stock,
          currentContent: parseFloat(currentContent.toFixed(2)),
      });
  });
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

export const openNewInventoryUnit = async (
  item: InventoryItem,
  reason: string,
  notes: string = "",
  user: { uid: string; displayName: string; tenantId: string }
): Promise<void> => {
  if (item.stock <= 0) {
    throw new Error("No hay unidades selladas en stock para abrir.");
  }

  // 1. Update Stock
  const stock = item.stock - 1;
  const content = item.content || item.quantity || item.packageSize || 0;

  const updates = {
    stock,
    currentContent: content,
    lastOpened: serverTimestamp(),
  };

  const batch = runTransaction(db, async (transaction) => {
      const productRef = doc(db, INVENTORY_COLLECTION, item.id);
      
      // Update main doc
      transaction.update(productRef, updates);

      // 2. Add History Entry
      const historyRef = doc(collection(db, INVENTORY_COLLECTION, item.id, "history"));
      transaction.set(historyRef, {
          action: "open_unit",
          timestamp: serverTimestamp(),
          userId: user.uid,
          userDisplayName: user.displayName,
          reason,
          notes,
          previousStock: item.stock,
          newStock: stock
      });

      // 3. Create Expense if Loss/Damage
      if (reason === "Derrame/Accidente" || reason === "Producto dañado") {
          // Determine cost
          const cost = item.purchasePrice || 0;
          if (cost > 0) {
              const expenseRef = doc(collection(db, "expenses"));
              transaction.set(expenseRef, {
                  date: new Date().toISOString().split('T')[0],
                  category: "Inventario/Pérdida",
                  description: `Pérdida por ${reason} - ${item.name}`,
                  amount: cost,
                  userId: user.uid,
                  tenantId: user.tenantId,
                  timestamp: serverTimestamp(),
                  relatedInventoryId: item.id
              });
          }
      }
  });
  
  await batch;
};

export const reportInventoryIncident = async (
  item: InventoryItem,
  type: 'minor' | 'medium' | 'total' | 'damaged',
  user: { uid: string; displayName: string; tenantId: string }
): Promise<void> => {
  // 1. Calculate Loss
  const currentContent = item.currentContent ?? item.content ?? 0;
  const totalCapacity = item.content || 1;
  
  let lostQty = 0;
  let newContent = currentContent;
  let actionDescription = "";

  if (type === 'minor') {
      lostQty = currentContent * 0.25;
      newContent = currentContent - lostQty;
      actionDescription = "Derrame Leve (25%)";
  } else if (type === 'medium') {
      lostQty = currentContent * 0.50;
      newContent = currentContent - lostQty;
      actionDescription = "Derrame Medio (50%)";
  } else if (type === 'total') {
      lostQty = currentContent;
      newContent = 0; 
      actionDescription = "Pérdida Total / Abrir Nueva";
  } else if (type === 'damaged') {
      lostQty = currentContent;
      newContent = 0;
      actionDescription = "Producto dañado / Defectuoso";
  }

  // Calculate Value of Loss
  // Cost per unit of content = PurchasePrice / TotalCapacity
  const unitCost = item.purchasePrice / totalCapacity;
  const lossValue = lostQty * unitCost;

  const batch = runTransaction(db, async (transaction) => {
      const productRef = doc(db, INVENTORY_COLLECTION, item.id);
      
      if (type === 'total' || type === 'damaged') {
         // TOTAL/DAMAGED LOSS LOGIC:
         // 1. Register expense for remaining content
         // 2. Open new unit (decrement stock, reset content)
         
         if (item.stock <= 0) {
             throw new Error("No hay stock para reposición inmediata, pero se registrará la pérdida.");
         }

         const newStock = item.stock > 0 ? item.stock - 1 : 0;
         const resetContent = item.content || 0;

         transaction.update(productRef, {
             stock: newStock,
             currentContent: resetContent,
             lastOpened: serverTimestamp()
         });

         // History for Open Unit
         const historyRefOpen = doc(collection(db, INVENTORY_COLLECTION, item.id, "history"));
         transaction.set(historyRefOpen, {
             action: "open_unit_loss",
             timestamp: serverTimestamp(),
             userId: user.uid,
             userDisplayName: user.displayName,
             reason: type === 'damaged' ? "Reposición por Producto Dañado" : "Reposición por Pérdida Total",
             previousStock: item.stock,
             newStock: newStock
         });

      } else {
          // PARTIAL LOSS LOGIC
          transaction.update(productRef, {
              currentContent: parseFloat(newContent.toFixed(2))
          });
      }

      // 2. History Entry for LOSS
      const historyRefLoss = doc(collection(db, INVENTORY_COLLECTION, item.id, "history"));
      transaction.set(historyRefLoss, {
          action: "loss_incident",
          timestamp: serverTimestamp(),
          userId: user.uid,
          userDisplayName: user.displayName,
          type,
          lostQty,
          lossValue,
          description: actionDescription
      });

      // 3. Register Expense
      if (lossValue > 0) {
          const expenseRef = doc(collection(db, "expenses"));
          transaction.set(expenseRef, {
              date: new Date().toISOString().split('T')[0],
              category: "Inventario/Mermas",
              description: `Merma: ${item.name} (${actionDescription})`,
              amount: parseFloat(lossValue.toFixed(2)),
              userId: user.uid,
              tenantId: user.tenantId,
              timestamp: serverTimestamp(),
              relatedInventoryId: item.id
          });
      }
  });

  await batch;
};
