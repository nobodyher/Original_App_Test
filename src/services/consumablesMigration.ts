// ====== MIGRATION: Update Consumables with Purchase Info ======
// This script updates existing consumables with purchasePrice and packageSize

import {
  collection,
  getDocs,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../firebase";

interface ConsumableData {
  name: string;
  purchasePrice: number;
  packageSize: number;
  unit: string;
  minStockAlert: number;
}

// Data based on user's provided information
const consumablesData: ConsumableData[] = [
  { name: "Guantes (par)", purchasePrice: 6.50, packageSize: 50, unit: "par", minStockAlert: 10 },
  { name: "Mascarilla", purchasePrice: 2.00, packageSize: 100, unit: "unidad", minStockAlert: 20 },
  { name: "Palillo naranja", purchasePrice: 1.00, packageSize: 100, unit: "unidad", minStockAlert: 20 },
  { name: "Bastoncillos", purchasePrice: 1.00, packageSize: 100, unit: "unidad", minStockAlert: 20 },
  { name: "Wipes", purchasePrice: 3.50, packageSize: 400, unit: "unidad", minStockAlert: 50 },
  { name: "Toalla desechable", purchasePrice: 1.25, packageSize: 50, unit: "unidad", minStockAlert: 10 },
  { name: "Gorro", purchasePrice: 3.00, packageSize: 100, unit: "unidad", minStockAlert: 20 },
  { name: "Campo quirúrgico", purchasePrice: 6.00, packageSize: 100, unit: "unidad", minStockAlert: 20 },
  { name: "Moldes esculpir", purchasePrice: 8.50, packageSize: 300, unit: "unidad", minStockAlert: 50 },
  { name: "Algodón", purchasePrice: 8.50, packageSize: 500, unit: "g", minStockAlert: 100 },
  { name: "Papel film", purchasePrice: 3.50, packageSize: 12500, unit: "cm", minStockAlert: 2000 },
];

export const migrateConsumables = async (): Promise<{
  success: boolean;
  message: string;
  details: string[];
}> => {
  const details: string[] = [];
  
  try {
    // Read all consumables from Firebase
    const consumablesRef = collection(db, "consumables");
    const consumablesSnap = await getDocs(consumablesRef);
    
    details.push(`📦 Consumibles encontrados: ${consumablesSnap.docs.length}`);
    
    let updated = 0;
    let skipped = 0;
    
    for (const consumableDoc of consumablesSnap.docs) {
      const consumable = consumableDoc.data();
      const consumableName = consumable.name;
      
      // Find matching data
      const dataMatch = consumablesData.find(d => 
        d.name.toLowerCase() === consumableName.toLowerCase() ||
        consumableName.toLowerCase().includes(d.name.toLowerCase())
      );
      
      if (dataMatch) {
        // Update with new fields
        const consumableRef = doc(db, "consumables", consumableDoc.id);
        await updateDoc(consumableRef, {
          purchasePrice: dataMatch.purchasePrice,
          packageSize: dataMatch.packageSize,
          unit: dataMatch.unit,
          minStockAlert: dataMatch.minStockAlert,
          // Initialize stockQty to packageSize if not set
          ...(consumable.stockQty === undefined && { stockQty: dataMatch.packageSize })
        });
        
        details.push(`✅ ${consumableName}: $${dataMatch.purchasePrice} / ${dataMatch.packageSize} ${dataMatch.unit}`);
        updated++;
      } else {
        details.push(`⚠️ ${consumableName}: No se encontró información de compra`);
        skipped++;
      }
    }
    
    details.push(`\n📊 Resumen:`);
    details.push(`   Actualizados: ${updated}`);
    details.push(`   Omitidos: ${skipped}`);
    
    return {
      success: true,
      message: `Migración completada: ${updated} actualizados, ${skipped} omitidos`,
      details
    };
    
  } catch (error) {
    return {
      success: false,
      message: `Error durante la migración: ${error}`,
      details
    };
  }
};
