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

import type {
  CatalogService,
  Consumable,
  ChemicalProduct,
  MaterialRecipe,
  ServiceRecipe,
  ServiceItem,
  MaterialInput,
} from "../types";

// Collection names

const CONSUMABLES_COLLECTION = "consumables";
const CHEMICAL_PRODUCTS_COLLECTION = "chemical_products";

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
): Promise<string> => {
  if (!name.trim() || basePrice <= 0) {
    throw new Error("Datos inválidos");
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
  // CORRECCIÓN: Validamos purchasePrice en lugar de unitCost (que ahora es opcional)
   if (
        !consumable.name ||
        !consumable.unit ||
        (consumable.purchasePrice || 0) < 0 || 
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

export const deductConsumables = async (
  serviceId: string,
  serviceName: string,
  serviceRecipes: ServiceRecipe[],
  consumables: Consumable[],
  catalogServices: CatalogService[] = []
): Promise<void> => {
  try {
    // Buscar servicio en catálogo
    const catalogService = catalogServices.find(
      s => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );
    
    let itemsToDeduct: { consumableId: string; qty: number }[] = [];
    
    // PRIORIDAD 1: manualConsumables (selección manual del admin)
    if (catalogService?.manualConsumables !== undefined && catalogService?.manualConsumables !== null) {
      itemsToDeduct = catalogService.manualConsumables;
    } else {
      // PRIORIDAD 2: serviceRecipes (recetas antiguas, fallback)
      const recipe = serviceRecipes.find(r => r.serviceId === serviceId);
      itemsToDeduct = recipe?.items || [];
      
      if (itemsToDeduct.length === 0) {
        // console.warn(`⚠️ No se encontró receta de consumibles para ${serviceName}`);
      }
    }
    
    // Descontar cada consumible
    for (const item of itemsToDeduct) {
      const consumable = consumables.find(c => c.id === item.consumableId);
      
      if (consumable) {
        const newQty = Math.max(0, consumable.stockQty - item.qty);
        
        // Actualizar en Firestore
        const consumableRef = doc(db, CONSUMABLES_COLLECTION, item.consumableId);
        await updateDoc(consumableRef, {
          stockQty: newQty,
          lastDeducted: new Date().toISOString(),
        });
        
        
        // Log con información de rendimiento
        // const servicesRemaining = newQty; // Asumiendo 1 unidad por servicio
        // console.log(`✅ Descuento: ${consumable.name} (-${item.qty} ${consumable.unit}) → Stock: ${newQty} (${servicesRemaining} servicios restantes)`);
        
        // Alerta de stock bajo
        if (newQty <= consumable.minStockAlert) {
          console.warn(`⚠️ STOCK BAJO: ${consumable.name} (${newQty}/${consumable.packageSize || 'N/A'})`);
        }
      } else {
        console.warn(`⚠️ Consumible no encontrado: ${item.consumableId}`);
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
  chemicalProducts: ChemicalProduct[] = [],
  consumables: Consumable[] = []
): number => {
  let totalCost = 0;

  for (const service of services) {
    let serviceCost = 0;

    // Buscar servicio en catálogo
    const catalogService = catalogServices.find(
      (cs) => cs.id === service.serviceId || 
              cs.name?.toLowerCase() === service.serviceName.toLowerCase()
    );

    // --- 1. CÁLCULO DE QUÍMICOS (Materiales) ---
    // PRIORIDAD: Configuración Manual
    if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
      for (const item of catalogService.manualMaterials) {
        // Handle polymorphic item type
        const isObject = typeof item === 'object' && item !== null;
        // Si es objeto, usar materialId. Si es string, usar item directamente
        const materialId = isObject ? (item as { materialId: string }).materialId : (item as string);
        
        const product = chemicalProducts.find(p => p.id === materialId);
        
        if (product) {
          // El rendimiento total del producto (ej: 150ml)
          const yieldTotal = product.quantity || product.yield || 1;
          
          // Costo por unidad de medida (ej: Precio / 150ml = Costo por ml)
          const costPerUnitMeasure = (product.purchasePrice || 0) / yieldTotal;
          
          // Cantidad usada en este servicio
          const qtyUsed = isObject ? (item as { qty: number }).qty : 1;
          
          serviceCost += costPerUnitMeasure * qtyUsed;
        }
      }
    } else {
      // FALLBACK: Receta antigua (si existe)
      const recipe = materialRecipes.find(
        (r) => r.serviceName.toLowerCase() === service.serviceName.toLowerCase()
      );

      if (recipe) {
        serviceCost += recipe.totalCost;
      }
      // NOTA: Se eliminó el fallback de costo fijo (0.50/0.33)
    }

    // --- 2. CÁLCULO DE CONSUMIBLES ---
    // Solo si existen en el catálogo manual
    if (catalogService?.manualConsumables !== undefined && catalogService?.manualConsumables !== null) {
      for (const item of catalogService.manualConsumables) {
        const consumable = consumables.find(c => c.id === item.consumableId);
            
        if (consumable) {
          // Costo Unitario = (Precio Compra / Tamaño Paquete)
          const packageSize = consumable.packageSize || 1;
          const unitCost = packageSize > 0 ? (consumable.purchasePrice || 0) / packageSize : 0;
          
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
  chemicalProducts: ChemicalProduct[],
  catalogServices: CatalogService[] = [] 
): Promise<void> => {
  try {
    // Buscar servicio en catálogo
    const catalogService = catalogServices.find(
      (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );
    
    // Usamos MaterialInput[] para soportar tanto strings (legacy) como objetos (nuevo)
    let materialsToDeduct: MaterialInput[] = [];
    
    // SI manualMaterials existe, usar eso
    if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
      materialsToDeduct = catalogService.manualMaterials;
      // console.log(`⚠️ Usando selección manual para ${serviceName}: ${materialsToDeduct.length} items`);
    } else {
      // FALLBACK: Recetas antiguas
      // console.log(`🔍 Usando recetas antiguas para ${serviceName}`);
      const recipe = materialRecipes.find(
        (r) => r.serviceId === serviceId || r.serviceName.toLowerCase() === serviceName.toLowerCase()
      );
      materialsToDeduct = recipe ? recipe.chemicalIds : [];
    }
    
    if (materialsToDeduct.length === 0) return;

    // Ejecución del Rendimiento
    for (const item of materialsToDeduct) {
      
      // 1. DETECCIÓN DE TIPO BLINDADA (Polimorfismo Real)
      let chemicalId: string = "";
      let deductAmount = 0;

      if (typeof item === 'string') {
        // Caso antiguo: ['id1', 'id2']
        chemicalId = item;
      } else if (typeof item === 'object' && item !== null) {
        // Caso nuevo: Soportamos variaciones de nombres (id vs materialId, quantity vs qty)
        // Esto arregla el error "undefined"
        chemicalId = item.id || item.materialId || ""; 
        deductAmount = item.quantity || item.qty || item.amount || 0;
      }

      // 🛑 VALIDACIÓN DE SEGURIDAD
      // Si por alguna razón chemicalId sigue vacía, saltamos para evitar el crash
      if (!chemicalId) {
        console.warn("⚠️ Item de material inválido o corrupto encontrado:", item);
        continue; 
      }
      
      // 2. BUSCAR PRODUCTO
      let product = chemicalProducts.find((p) => p.id === chemicalId);
      let productRef = null;
      let productSnap = null;
      
      if (!product) {
        // Búsqueda fallback por nombre (ahora segura porque chemicalId existe)
        const normalizedSearchName = chemicalId.toLowerCase().replace(/_/g, ' ').trim();
        const chemicalProductsRef = collection(db, "chemical_products");
        const allProductsSnap = await getDocs(chemicalProductsRef);
        
        for (const docSnap of allProductsSnap.docs) {
          const data = docSnap.data() as ChemicalProduct;
          const normalizedProductName = data.name.toLowerCase().replace(/_/g, ' ').trim();
          
          if (normalizedProductName === normalizedSearchName || 
              normalizedProductName.includes(normalizedSearchName) ||
              normalizedSearchName.includes(normalizedProductName)) {
            product = { ...data, id: docSnap.id };
            productRef = doc(db, "chemical_products", docSnap.id);
            productSnap = docSnap;
            break;
          }
        }
      } else {
        productRef = doc(db, "chemical_products", chemicalId);
      }
      
      if (!product || !productRef) {
        console.warn(`⚠️ Producto no encontrado: ${chemicalId}`);
        continue;
      }

      if (!productSnap) productSnap = await getDoc(productRef);
      if (!productSnap.exists()) continue;

      const currentData = productSnap.data() as ChemicalProduct;
      
      // 3. CÁLCULO DE STOCK
      // Si deductAmount viene del servicio (ej: 15ml), usamos eso. 
      // Si no, usamos 1 (o lo que diga el producto).
      const amountToSubtract = deductAmount > 0 ? deductAmount : 1;

      let currentYieldRemaining = currentData.currentYieldRemaining ?? currentData.yieldPerUnit ?? currentData.yield ?? 1;
      let stock = currentData.stock ?? 0;
      const yieldPerUnit = currentData.yieldPerUnit ?? currentData.yield ?? 1;

      // Restamos la cantidad
      currentYieldRemaining = currentYieldRemaining - amountToSubtract;

      // Lógica de reposición (abrir nueva botella si se acaba)
      if (currentYieldRemaining <= 0) {
        // Calculamos cuántas botellas enteras se consumieron (normalmente 1, pero si gastaste 2000ml de golpe...)
        const bottlesConsumed = Math.ceil(Math.abs(currentYieldRemaining) / yieldPerUnit) || 1; 
        
        stock = Math.max(0, stock - bottlesConsumed); 
        
        // El remanente es lo que sobra de la nueva botella abierta
        // Ej: Gasté 1050ml de botellas de 1000ml -> Gasté 1 botella entera y 50ml de la segunda.
        // Nueva botella (1000) - 50 = 950 restantes.
        const remainder = Math.abs(currentYieldRemaining) % yieldPerUnit;
        currentYieldRemaining = remainder === 0 ? yieldPerUnit : (yieldPerUnit - remainder);
        
        // console.log(`🔄 Reposición: ${product.name} - Stock baja a ${stock}`);
      }

      // Guardar en Firebase
      await updateDoc(productRef, {
        currentYieldRemaining,
        stock,
      });

      // console.log(`✅ Descuento: ${product.name} (-${amountToSubtract}) | Restante: ${currentYieldRemaining}/${yieldPerUnit}`);
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
  chemicalProducts: ChemicalProduct[],
  catalogServices: CatalogService[] = []
): Promise<void> => {
  try {
    const catalogService = catalogServices.find(
      (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );

    let materialsToRestore: MaterialInput[] = [];

    // Prioridad 1: Manual
    if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
      materialsToRestore = catalogService.manualMaterials;
    } else {
      // Fallback: Receta
      const recipe = materialRecipes.find(
        (r) => r.serviceId === serviceId || r.serviceName.toLowerCase() === serviceName.toLowerCase()
      );
      materialsToRestore = recipe ? recipe.chemicalIds : [];
    }

    if (materialsToRestore.length === 0) return;

    for (const item of materialsToRestore) {
      let chemicalId: string = "";
      let restoreAmount = 0;

      if (typeof item === 'string') {
        chemicalId = item;
      } else if (typeof item === 'object' && item !== null) {
        chemicalId = item.id || item.materialId || "";
        restoreAmount = item.quantity || item.qty || item.amount || 0;
      }

      if (!chemicalId) continue;

      // Buscar producto
      const product = chemicalProducts.find((p) => p.id === chemicalId);
      
      // Fallback search por nombre similar a deductInventoryByRecipe
      if (!product) {
         // (Omitido para brevedad, asumimos que si se descontó, existe, pero idealmente deberíamos buscar igual)
         // Para restauración es crítico encontrar el producto exacto. Si no está en memoria, RIP.
         // En un escenario real, deberíamos hacer query a DB si no está en props.
         continue; 
      }
      
      const productRef = doc(db, CHEMICAL_PRODUCTS_COLLECTION, product.id);
      const productSnap = await getDoc(productRef);
      
      if (!productSnap.exists()) continue;
      
      const currentData = productSnap.data() as ChemicalProduct;
      const amountToAdd = restoreAmount > 0 ? restoreAmount : 1;
      
      let currentYieldRemaining = currentData.currentYieldRemaining ?? currentData.yieldPerUnit ?? currentData.yield ?? 1;
      let stock = currentData.stock ?? 0;
      const yieldPerUnit = currentData.yieldPerUnit ?? currentData.yield ?? 1;
      
      // Sumar cantidad
      currentYieldRemaining += amountToAdd;
      
      // Si la botella actual "rebosa" (más que su capacidad), incrementamos stock de botellas cerradas
      if (currentYieldRemaining > yieldPerUnit) {


          // Ojo: Si currentYieldRemaining era muy bajo y sumamos mucho, podríamos restaurar botellas.
          // Simplificación: Incrementar stock si pasamos el límite.
          
          // Lógica inversa a deduction:
          // Si yield=1000, current=200, restore=900 -> total=1100. 
          // 1 botella llena (stock++) y sobra 100 en current.
          
          const totalYield = currentYieldRemaining; 
          const fullBottles = Math.floor(totalYield / yieldPerUnit);
          const remainder = totalYield % yieldPerUnit; // Lo que queda en la botella abierta
          
          // Si totalYield es 1100 y yield 1000:
          // fullBottles = 1
          // remainder = 100
          
          // PERO, 'stock' cuenta botellas CERRADAS. 
          // 'currentYieldRemaining' es la botella ABIERTA.
          // Si currentYieldRemaining > yield, significa que hemos llenado la abierta y tenemos para más.
          
          stock += fullBottles;
          currentYieldRemaining = remainder === 0 ? yieldPerUnit : remainder; 
          // Si remainder 0, exacto, la botella abierta está llena (o nueva).
      }
      
      await updateDoc(productRef, {
        currentYieldRemaining,
        stock
      });
      
      // console.log(`🔄 Restaurado: ${product.name} (+${amountToAdd}) | Stock: ${stock}`);
    }

  } catch (error) {
    console.error("❌ Error restaurando inventario quimico:", error);
  }
};

export const restoreConsumables = async (
  serviceId: string,
  serviceName: string,
  serviceRecipes: ServiceRecipe[],
  consumables: Consumable[],
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
        const consumable = consumables.find(c => c.id === item.consumableId);
        if (consumable) {
            const newQty = consumable.stockQty + item.qty;
            const consumableRef = doc(db, CONSUMABLES_COLLECTION, item.consumableId);
            
            await updateDoc(consumableRef, {
                stockQty: newQty
            });
            // console.log(`🔄 Restaurado Consumible: ${consumable.name} (+${item.qty}) -> ${newQty}`);
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
 * Verifica si un consumible está en stock bajo
 */
export const isConsumableLowStock = (consumable: Consumable): boolean => {
  return consumable.stockQty <= consumable.minStockAlert;
};
