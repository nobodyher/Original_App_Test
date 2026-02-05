import React, { useState, useMemo } from "react";
import {
  Package,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  DollarSign,
  Sparkles,
} from "lucide-react";
import type { Consumable, Toast } from "../../../../types";

interface ConsumablesManagerProps {
  consumables: Consumable[];
  onRefresh?: () => void;
  onAdd: (data: any) => Promise<void>;
  onUpdate: (id: string, data: Partial<Consumable>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showNotification: (message: string, type?: Toast["type"]) => void;
}

const TableSkeleton = () => (
  <div className="animate-in fade-in duration-300 w-full">
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {[1, 2, 3, 4].map((i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-skeleton"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row}>
              {[1, 2, 3, 4].map((col) => (
                <td key={col} className="px-6 py-4">
                  <div className="h-4 w-full bg-gray-100 rounded animate-skeleton"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const EmptyState = ({
  icon: Icon,
  title,
  message,
}: {
  icon: any;
  title: string;
  message: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
    <Icon size={64} className="text-gray-200 mb-4" strokeWidth={1.5} />
    <h3 className="text-lg font-bold text-gray-400 mb-2">{title}</h3>
    <p className="text-sm text-gray-400 max-w-xs mx-auto">{message}</p>
  </div>
);

const ConsumablesManager: React.FC<ConsumablesManagerProps> = ({
  consumables,
  onRefresh,
  onAdd,
  onUpdate,
  onDelete,
  showNotification,
}) => {
  const [newConsumable, setNewConsumable] = useState({
    name: "",
    unit: "",
    purchasePrice: "",
    packageSize: "",
    stockQty: "",
    minStockAlert: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTableLoading, setIsTableLoading] = useState(false);

  // Consumables Editing State (Slide-over)
  const [editingConsumableItem, setEditingConsumableItem] = useState<Consumable | null>(null);
  const [addingConsumableItem, setAddingConsumableItem] = useState(false);
  const [editConsumableForm, setEditConsumableForm] = useState<Partial<Consumable>>({});

  // Pagination States
  const ITEMS_PER_PAGE = 7;
  const [consumablesPage, setConsumablesPage] = useState(1);

  // Reset pagination when consumables length changes
  React.useEffect(() => {
    setConsumablesPage(1);
    setIsTableLoading(true);
    const timer = setTimeout(() => setIsTableLoading(false), 600);
    return () => clearTimeout(timer);
  }, [consumables.length]);

  // Derived State
  const paginatedConsumables = useMemo(() => {
    return consumables.slice((consumablesPage - 1) * ITEMS_PER_PAGE, consumablesPage * ITEMS_PER_PAGE);
  }, [consumables, consumablesPage]);

  const lowStockConsumables = consumables.filter(
    (c) => c.active && c.stockQty <= c.minStockAlert
  );

  // Wrappers
  const handleAddConsumable = async () => {
    setIsSubmitting(true);
    try {
      await onAdd({
        name: newConsumable.name,
        unit: newConsumable.unit,
        purchasePrice: parseFloat(newConsumable.purchasePrice) || 0,
        packageSize: parseFloat(newConsumable.packageSize) || 0,
        stockQty: parseFloat(newConsumable.stockQty) || 0,
        minStockAlert: parseFloat(newConsumable.minStockAlert) || 0,
      });

      setNewConsumable({
        name: "",
        unit: "",
        purchasePrice: "",
        packageSize: "",
        stockQty: "",
        minStockAlert: "",
      });
      showNotification("Consumible agregado");
      onRefresh?.();
      setAddingConsumableItem(false);
    } catch (error: any) {
      console.error("Error agregando consumible:", error);
      showNotification(error.message || "Error al agregar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateConsumable = async (id: string, updated: Partial<Consumable>) => {
    try {
      await onUpdate(id, updated);
      setEditingConsumableItem(null);
      showNotification("Consumible actualizado");
      onRefresh?.();
    } catch (error) {
      console.error("Error actualizando consumible:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteConsumable = async (id: string) => {
    if (!window.confirm("¿Eliminar este consumible?")) return;
    try {
      await onDelete(id);
      showNotification("Consumible eliminado");
      onRefresh?.();
    } catch (error) {
      console.error("Error eliminando consumible:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  return (
    <div className="space-y-6">
      {lowStockConsumables.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-orange-600" size={32} />
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                ⚠️ Alertas de Stock Bajo
              </h3>
              <p className="text-sm text-gray-600">
                {lowStockConsumables.length} consumible(s) necesitan reposición
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockConsumables.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-lg p-4 border-2 border-orange-200"
              >
                <p className="font-bold text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-600">
                  Stock actual: <span className="font-bold">{c.stockQty}</span>{" "}
                  {c.unit} (mínimo: {c.minStockAlert})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Package className="text-blue-600" />
            Inventario de Consumibles
          </h3>
          <button
            onClick={async () => {
              setIsSubmitting(true);
              try {
                // Dynamic import with corrected path
                const { migrateConsumables } = await import('../../../../services/consumablesMigration');
                const result = await migrateConsumables();
                
                console.log('📦 Migración de Consumibles:');
                console.log(result.message);
                result.details.forEach((d: any) => console.log(d));
                
                showNotification(result.message, result.success ? 'success' : 'error');
                
                // Reload page to see updated consumables
                if (result.success) {
                  onRefresh?.();
                  setTimeout(() => window.location.reload(), 1500);
                }
              } catch (error: any) {
                console.error('Error en migración:', error);
                showNotification(`Error: ${error.message}`, 'error');
              } finally {
                setIsSubmitting(false);
              }
            }}
            disabled={isSubmitting}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Sparkles size={18} />
            {isSubmitting ? 'Migrando...' : 'Migrar Datos'}
          </button>
        </div>

        {/* Botón para agregar nuevo consumible */}
        <div className="mb-6">
          <button
            onClick={() => setAddingConsumableItem(true)}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-out font-bold flex items-center justify-center gap-3 group"
          >
            <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            Agregar Nuevo Consumible
          </button>
        </div>

        {isTableLoading ? (
           <TableSkeleton />
        ) : (
        <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Stock
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Costo Base
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Costo/Servicio
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Rendimiento
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedConsumables.length === 0 ? (
                 <tr>
                    <td colSpan={6}>
                      <EmptyState 
                        icon={Package} 
                        title="Sin consumibles" 
                        message="Agrega algodón, acetona, limas y otros materiales aquí." 
                      />
                    </td>
                 </tr>
              ) : (
                paginatedConsumables.map((c) => {
                const isLowStock = c.stockQty <= c.minStockAlert;
                
                return (
                  <tr
                    key={c.id}
                    className={`group transition-colors duration-200 even:bg-slate-50/30 hover:bg-gray-100/80 ${
                       !c.active ? "opacity-60 bg-gray-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3">
                       <p className="font-bold text-gray-800">{c.name}</p>
                       <p className="text-xs text-gray-500">{c.unit}</p>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                         <span className={`font-bold ${isLowStock ? 'text-orange-600' : 'text-gray-700'}`}>
                           {c.stockQty}
                         </span>
                         {isLowStock && (
                            <AlertTriangle size={14} className="text-orange-500 animate-pulse" />
                         )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                      ${(c.purchasePrice || 0).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                       {c.unitCost ? (
                          <span className="font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-md text-xs">
                             ${c.unitCost.toFixed(3)}
                          </span>
                       ) : (
                          <span className="text-xs text-gray-400 italic">--</span>
                       )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                       {c.yieldPerUnit ? (
                          <span>~{c.yieldPerUnit} servs.</span>
                       ) : (
                          <span className="italic opacity-50">N/A</span>
                       )}
                    </td>
                    <td className="px-4 py-3">
                       <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                               setEditingConsumableItem(c);
                               setEditConsumableForm({ ...c });
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-90"
                            title="Editar"
                          >
                             <Edit2 size={16} />
                          </button>
                          <button
                             onClick={() => handleDeleteConsumable(c.id)}
                             className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
                             title="Eliminar"
                          >
                             <Trash2 size={16} />
                          </button>
                       </div>
                    </td>
                  </tr>
                );
              })
              )}
            </tbody>
          </table>
          </div>
        </div>
        )}

        {/* Pagination */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 mt-2">
          <div className="text-sm text-gray-500 font-medium">
             Mostrando {Math.min((consumablesPage - 1) * ITEMS_PER_PAGE + 1, consumables.length)} - {Math.min(consumablesPage * ITEMS_PER_PAGE, consumables.length)} de {consumables.length} consumibles
          </div>
          <div className="flex gap-2">
             <button
               onClick={() => setConsumablesPage((p) => Math.max(1, p - 1))}
               disabled={consumablesPage === 1}
               className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
             >
               <ChevronLeft size={18} />
             </button>
             <span className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-sm shadow-blue-200">
               {consumablesPage}
             </span>
             <button
               onClick={() => setConsumablesPage((p) => (p * ITEMS_PER_PAGE < consumables.length ? p + 1 : p))}
               disabled={consumablesPage * ITEMS_PER_PAGE >= consumables.length}
               className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
             >
               <ChevronRight size={18} />
             </button>
          </div>
        </div>
      </div>

      {/* Slide-over para Edición de Consumibles */}
      {editingConsumableItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingConsumableItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Editar Consumible</h3>
                <p className="text-sm text-gray-500">Gestión de insumos y costos</p>
              </div>
              <button 
                onClick={() => setEditingConsumableItem(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Package size={18} className="text-blue-600" />
                   Información del Consumible
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Consumible</label>
                  <input
                    type="text"
                    value={editConsumableForm.name || ""}
                    onChange={(e) => setEditConsumableForm((prev: Partial<Consumable>) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-600">Unidad de Medida</label>
                   <input
                     type="text"
                     placeholder="ej. Caja, Paquete, Unidad"
                     value={editConsumableForm.unit || ""}
                     onChange={(e) => setEditConsumableForm((prev: Partial<Consumable>) => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                   />
                </div>
              </div>

              {/* Costos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <DollarSign size={18} className="text-green-600" />
                   Costo Unitario
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Costo por {editConsumableForm.unit || "unidad"}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editConsumableForm.unitCost || 0}
                      onChange={(e) => setEditConsumableForm((prev: Partial<Consumable>) => ({ ...prev, unitCost: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                      className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-semibold"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                     Este valor se usa para calcular el costo de materiales de los servicios.
                  </p>
                </div>
              </div>

              {/* Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-orange-500" />
                   Inventario y Alertas
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Stock Actual</label>
                       <input
                         type="number"
                         value={editConsumableForm.stockQty || 0}
                         onChange={(e) => setEditConsumableForm((prev: Partial<Consumable>) => ({ ...prev, stockQty: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                         className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all bg-white font-bold text-gray-800"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-600">Alerta (Mínimo)</label>
                       <input
                         type="number"
                         value={editConsumableForm.minStockAlert || 0}
                         onChange={(e) => setEditConsumableForm((prev: Partial<Consumable>) => ({ ...prev, minStockAlert: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                         className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all bg-white"
                       />
                    </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditingConsumableItem(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingConsumableItem && editConsumableForm) {
                    handleUpdateConsumable(editingConsumableItem.id, editConsumableForm);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Actualizar Consumible
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Slide-over para AGREGAR Consumibles */}
      {addingConsumableItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setAddingConsumableItem(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Agregar Consumible</h3>
                <p className="text-sm text-gray-500">Nuevo insumo para el inventario</p>
              </div>
              <button 
                onClick={() => setAddingConsumableItem(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Package size={18} className="text-blue-600" />
                   Información del Consumible
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Consumible</label>
                  <input
                    type="text"
                    placeholder="ej. Algodón, Guantes, Toallas"
                    value={newConsumable.name}
                    onChange={(e) => setNewConsumable(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-600">Unidad de Medida</label>
                   <input
                     type="text"
                     placeholder="ej. gramo, unidad, par, metro"
                     value={newConsumable.unit}
                     onChange={(e) => setNewConsumable(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                   />
                </div>
              </div>

              {/* Costos y Paquete */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <DollarSign size={18} className="text-green-600" />
                   Información de Compra
                </h4>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Precio de Compra</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newConsumable.purchasePrice}
                          onChange={(e) => setNewConsumable(prev => ({ ...prev, purchasePrice: e.target.value }))}
                          className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-semibold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Tamaño del Paquete</label>
                      <input
                        type="number"
                        step="1"
                        placeholder="100"
                        value={newConsumable.packageSize}
                        onChange={(e) => setNewConsumable(prev => ({ ...prev, packageSize: e.target.value }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                    </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Ejemplo:</span> Si compras un paquete de 100 guantes por $13.00, el costo por unidad será $0.13
                  </p>
                </div>
              </div>

              {/* Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-orange-500" />
                   Inventario Inicial
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Stock Inicial</label>
                       <input
                         type="number"
                         placeholder="100"
                         value={newConsumable.stockQty}
                         onChange={(e) => setNewConsumable(prev => ({ ...prev, stockQty: e.target.value }))}
                         className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all bg-white font-bold text-gray-800"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-600">Alerta (Mínimo)</label>
                       <input
                         type="number"
                         placeholder="10"
                         value={newConsumable.minStockAlert}
                         onChange={(e) => setNewConsumable(prev => ({ ...prev, minStockAlert: e.target.value }))}
                         className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all bg-white"
                       />
                    </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Nota:</span> Recibirás una alerta cuando el stock llegue al nivel mínimo configurado
                  </p>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setAddingConsumableItem(false);
                  setNewConsumable({
                    name: "",
                    unit: "",
                    purchasePrice: "",
                    packageSize: "",
                    stockQty: "",
                    minStockAlert: "",
                  });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddConsumable}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner ${
                  isSubmitting ? "opacity-60 cursor-wait animate-pulse pointer-events-none" : ""
                }`}
              >
                {isSubmitting ? "Guardando..." : "Agregar Consumible"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumablesManager;
