import React from "react";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";
import type { Consumable, ChemicalProduct } from "../../../types";

interface InventoryAlertsProps {
  consumables: Consumable[];
  chemicals: ChemicalProduct[];
  onViewInventory?: () => void;
  onNavigateToTab?: (tab: "consumables" | "materials") => void;
}

interface LowStockItem {
  id: string;
  name: string;
  currentStock: number;
  minStock: number;
  type: "consumable" | "chemical";
  tab: "consumables" | "materials";
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({
  consumables,
  chemicals,
  onViewInventory,
  onNavigateToTab,
}) => {
  // Filtrar consumibles con stock bajo
  const lowStockConsumables: LowStockItem[] = consumables
    .filter((c) => c.stockQty <= c.minStockAlert)
    .map((c) => ({
      id: c.id,
      name: c.name,
      currentStock: Math.floor(c.stockQty),
      minStock: c.minStockAlert,
      type: "consumable" as const,
      tab: "consumables" as const,
    }));

  // Filtrar químicos con stock bajo
  const lowStockChemicals: LowStockItem[] = chemicals
    .filter((ch) => ch.stock <= ch.minStock)
    .map((ch) => ({
      id: ch.id,
      name: ch.name,
      currentStock: Math.floor(ch.stock),
      minStock: ch.minStock,
      type: "chemical" as const,
      tab: "materials" as const,
    }));

  // Combinar ambas listas
  const allLowStockItems = [...lowStockConsumables, ...lowStockChemicals];

  // Si no hay productos con stock bajo, mostrar mensaje de éxito
  if (allLowStockItems.length === 0) {
    return (
      <div className="bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 border-l-4 border-emerald-500 dark:border-emerald-400 rounded-xl p-3 shadow-sm animate-fade-in">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg">
            <Package size={16} className="text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-emerald-900 dark:text-emerald-100 leading-none">
              ✅ Inventario Completo
            </h3>
            <p className="text-xs text-emerald-700 dark:text-emerald-300 font-medium mt-0.5 leading-tight">
              Todos los productos tienen stock suficiente
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar solo los primeros 10 productos
  const displayItems = allLowStockItems.slice(0, 10);
  const remainingCount = allLowStockItems.length - displayItems.length;

  return (
    <div className="bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/10 dark:to-amber-900/10 border-l-4 border-orange-500 dark:border-orange-400 rounded-xl p-3 shadow-sm animate-fade-in">
      {/* Header Compacto */}
      <div className="flex items-center gap-2 mb-2">
        <div className="p-1.5 bg-orange-500/10 dark:bg-orange-500/20 rounded-lg">
          <AlertTriangle size={16} className="text-orange-600 dark:text-orange-400" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-orange-900 dark:text-orange-100 leading-none">
            ⚠️ {allLowStockItems.length} producto{allLowStockItems.length !== 1 ? "s" : ""} por agotarse
          </h3>
          <p className="text-xs text-orange-700 dark:text-orange-300 font-medium mt-0.5 leading-tight">
            Stock por debajo del mínimo
          </p>
        </div>
      </div>

      {/* Grid Ultra Compacto */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 mb-2">
        {displayItems.map((item) => (
          <div
            key={item.id}
            onClick={() => onNavigateToTab?.(item.tab)}
            className="flex items-center justify-between bg-white/60 dark:bg-black/20 backdrop-blur-sm rounded border border-orange-200 dark:border-orange-800 px-2 py-1.5 hover:border-orange-400 dark:hover:border-orange-600 hover:bg-orange-100 dark:hover:bg-orange-900/40 transition-all duration-200 group cursor-pointer"
            title={`${item.name} - ${item.type === "consumable" ? "Consumible" : "Químico"} (Click para ver)`}
          >
            {/* Nombre (Izquierda) */}
            <span className="font-medium truncate mr-2 text-xs text-orange-800 dark:text-orange-200 leading-tight">
              {item.name}
            </span>
            
            {/* Stock (Derecha) */}
            <span className="font-mono font-bold text-xs text-red-600 dark:text-red-400 whitespace-nowrap leading-none">
              {item.currentStock}/{item.minStock}
            </span>
          </div>
        ))}
      </div>

      {/* Contador de restantes */}
      {remainingCount > 0 && (
        <div className="text-center mb-2">
          <p className="text-xs font-semibold text-orange-700 dark:text-orange-300 leading-tight">
            ... y {remainingCount} más
          </p>
        </div>
      )}

      {/* Botón Compacto */}
      {onViewInventory && (
        <button
          onClick={onViewInventory}
          className="w-full flex items-center justify-center gap-2 bg-white dark:bg-orange-950/50 border border-orange-200 dark:border-orange-700 text-orange-600 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/80 font-semibold py-2 px-3 rounded-lg transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 text-xs"
        >
          <Package size={14} />
          Ver Inventario
          <ArrowRight size={14} />
        </button>
      )}
    </div>
  );
};

export default InventoryAlerts;
