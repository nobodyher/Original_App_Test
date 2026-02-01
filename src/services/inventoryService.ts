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
  ServiceRecipe,
  ServiceItem,
} from "../types";

// Collection names
const SERVICES_COLLECTION = "services";
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
      console.log(`⚠️ Usando consumibles manuales (Prioridad Alta) para ${serviceName}`);
      console.log(`   - Consumibles manuales: ${itemsToDeduct.length}`);
    } else {
      // PRIORIDAD 2: serviceRecipes (recetas antiguas, fallback)
      console.log(`🔍 Usando receta de consumibles (Fallback) para ${serviceName}`);
      const recipe = serviceRecipes.find(r => r.serviceId === serviceId);
      itemsToDeduct = recipe?.items || [];
      
      if (itemsToDeduct.length === 0) {
        console.log(`⚠️ No se encontró receta de consumibles para ${serviceName}`);
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
        
        console.log(`✅ Descuento: ${consumable.name} (-${item.qty} ${consumable.unit}) → Stock: ${newQty}`);
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
  chemicalProducts: ChemicalProduct[] = []
): number => {
  let totalCost = 0;

  for (const service of services) {
    // Buscar servicio en catálogo
    const catalogService = catalogServices.find(
      (cs) => cs.id === service.serviceId || 
              cs.name?.toLowerCase() === service.serviceName.toLowerCase()
    );
    
    // PRIORIDAD 1: Si manualMaterials existe, calcular costo dinámicamente
    if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
      let serviceCost = 0;
      
      for (const materialId of catalogService.manualMaterials) {
        const product = chemicalProducts.find(p => p.id === materialId);
        if (product) {
          const yieldPerUnit = product.yieldPerUnit || product.yield || 1;
          const costPerUse = (product.purchasePrice || 0) / yieldPerUnit;
          serviceCost += costPerUse;
        }
      }
      
      totalCost += serviceCost;
      console.log(`💰 Costo calculado para ${service.serviceName}: $${serviceCost.toFixed(2)} (${catalogService.manualMaterials.length} materiales)`);
      
    } else {
      // PRIORIDAD 2: Fallback a receta antigua
      const recipe = materialRecipes.find(
        (r) => r.serviceName.toLowerCase() === service.serviceName.toLowerCase()
      );

      if (recipe) {
        totalCost += recipe.totalCost;
        console.log(`💰 Costo de receta para ${service.serviceName}: $${recipe.totalCost.toFixed(2)}`);
      } else {
        const serviceName = service.serviceName.toLowerCase();
        const defaultCost = serviceName.includes("pedicure") || serviceName.includes("pedicura") ? 0.5 : 0.33;
        totalCost += defaultCost;
        console.log(`💰 Costo por defecto para ${service.serviceName}: $${defaultCost.toFixed(2)}`);
      }
    }
  }

  return totalCost;
};

// ====== Recipe-Based Inventory Deduction ======

export const deductInventoryByRecipe = async (
  serviceId: string,
  serviceName: string,
  materialRecipes: MaterialRecipe[],
  chemicalProducts: ChemicalProduct[],
  catalogServices: CatalogService[] = [] // Nuevo parámetro para acceder a manualMaterials
): Promise<void> => {
  try {
    // Tarea 2: Sincronización en el Cobro (Staff)
    // Aplicar regla de prioridad:
    
    // Buscar servicio en catálogo
    const catalogService = catalogServices.find(
      (s) => s.id === serviceId || s.name.toLowerCase() === serviceName.toLowerCase()
    );
    
    let materialsToDeduct: string[] = [];
    
    // SI manualMaterials existe (incluso si está vacío), usar SOLO eso
    if (catalogService?.manualMaterials !== undefined && catalogService?.manualMaterials !== null) {
      // PRIORIDAD ALTA: Usar selección manual
      materialsToDeduct = catalogService.manualMaterials;
      console.log(`⚠️ Usando selección manual (Prioridad Alta) para ${serviceName}`);
      console.log(`   - Materiales manuales: ${materialsToDeduct.length}`);
    } else {
      // FALLBACK: Solo si NO existe manualMaterials, buscar en recetas antiguas
      console.log(`🔍 Usando recetas antiguas (Fallback) para ${serviceName}`);
      
      const recipe = materialRecipes.find(
        (r) => r.serviceId === serviceId || r.serviceName.toLowerCase() === serviceName.toLowerCase()
      );
      
      materialsToDeduct = recipe ? recipe.chemicalIds : [];
      console.log(`   - Recetas antiguas: ${materialsToDeduct.length}`);
    }
    
    if (materialsToDeduct.length === 0) {
      console.log(`⚠️ No se encontraron materiales para: ${serviceName}`);
      return;
    }

    // Tarea 3: Ejecución del Rendimiento para cada material
    for (const chemicalId of materialsToDeduct) {
      // Primero intentar buscar por ID en el array local
      let product = chemicalProducts.find((p) => p.id === chemicalId);
      let productRef = null;
      let productSnap = null;
      
      // Si no se encuentra por ID, buscar por nombre en Firestore (fallback)
      if (!product) {
        console.log(`🔍 Buscando producto por nombre: ${chemicalId}`);
        
        // Normalizar el nombre para búsqueda (quitar guiones bajos, espacios, minúsculas)
        const normalizedSearchName = chemicalId.toLowerCase().replace(/_/g, ' ').trim();
        
        // Buscar en todos los productos químicos
        const chemicalProductsRef = collection(db, "chemical_products");
        const allProductsSnap = await getDocs(chemicalProductsRef);
        
        // Buscar coincidencia por nombre (ignorando mayúsculas y espacios)
        for (const docSnap of allProductsSnap.docs) {
          const data = docSnap.data() as ChemicalProduct;
          const normalizedProductName = data.name.toLowerCase().replace(/_/g, ' ').trim();
          
          if (normalizedProductName === normalizedSearchName || 
              normalizedProductName.includes(normalizedSearchName) ||
              normalizedSearchName.includes(normalizedProductName)) {
            product = { ...data, id: docSnap.id };
            productRef = doc(db, "chemical_products", docSnap.id);
            productSnap = docSnap;
            console.log(`✅ Producto encontrado por nombre: ${data.name} (ID: ${docSnap.id})`);
            break;
          }
        }
      } else {
        // Si se encontró por ID, obtener referencia de Firestore
        productRef = doc(db, "chemical_products", chemicalId);
      }
      
      if (!product || !productRef) {
        console.log(`⚠️ Producto químico no encontrado: ${chemicalId}`);
        continue;
      }

      // Verificar que el documento existe en Firestore
      if (!productSnap) {
        productSnap = await getDoc(productRef);
      }

      if (!productSnap.exists()) {
        console.log(`⚠️ Producto no existe en Firestore: ${product.name}`);
        continue;
      }

      const currentData = productSnap.data() as ChemicalProduct;
      
      // Inicializar valores si no existen
      let currentYieldRemaining = currentData.currentYieldRemaining ?? currentData.yieldPerUnit ?? currentData.yield ?? 1;
      let stock = currentData.stock ?? 0;
      const yieldPerUnit = currentData.yieldPerUnit ?? currentData.yield ?? 1;

      // Aplicar fórmula: currentYieldRemaining = currentYieldRemaining - 1
      currentYieldRemaining = currentYieldRemaining - 1;

      // Regla de reposición: Si currentYieldRemaining <= 0
      if (currentYieldRemaining <= 0) {
        stock = Math.max(0, stock - 1); // Abrir nueva botella
        currentYieldRemaining = yieldPerUnit; // Resetear rendimiento
        console.log(`🔄 Nueva botella abierta: ${product.name} (Stock restante: ${stock})`);
      }

      // Actualizar Firestore
      await updateDoc(productRef, {
        currentYieldRemaining,
        stock,
      });

      console.log(`✅ Descuento aplicado: ${product.name} (${currentYieldRemaining}/${yieldPerUnit})`);
    }
  } catch (error) {
    console.error(`❌ Error al descontar inventario:`, error);
    // No lanzamos error para no interrumpir el flujo principal
  }
};

