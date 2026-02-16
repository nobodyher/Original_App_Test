import React, { useState, useMemo } from "react";
import {
  Package,
  Plus,
  X,
  Edit2,
  Trash2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Save,
} from "lucide-react";
import type { Consumable, Toast, AppUser } from "../../../../types";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ConsumablesManagerProps {
  // Data
  consumables: Consumable[];
  currentUser: AppUser | null;

  // Actions
  addConsumable: (data: Omit<Consumable, "id" | "active">) => Promise<void>;
  updateConsumable: (
    id: string,
    updates: Partial<Consumable>,
  ) => Promise<void>;
  deleteConsumable: (id: string) => Promise<void>;
  showNotification: (message: string, type?: Toast["type"]) => void;
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyState = ({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
    <Icon size={64} className="text-gray-700/50 mb-4" strokeWidth={1.5} />
    <h3 className="text-sm font-bold text-text-main mb-2">{title}</h3>
    <p className="text-sm text-text-muted max-w-xs mx-auto">{message}</p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const ConsumablesManager: React.FC<ConsumablesManagerProps> = ({
  consumables,
  currentUser,
  addConsumable,
  updateConsumable,
  deleteConsumable,
  showNotification,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Add Consumable State
  const [newConsumable, setNewConsumable] = useState({
    name: "",
    unit: "",
    purchasePrice: "",
    packageSize: "",
    stockQty: "",
    minStockAlert: "",
  });

  // Edit Consumable State (Slide-over)
  const [editingConsumableItem, setEditingConsumableItem] =
    useState<Consumable | null>(null);
  const [editConsumableForm, setEditConsumableForm] = useState<
    Partial<Consumable>
  >({});

  // Adding state (for slide-over)
  const [addingConsumableItem, setAddingConsumableItem] = useState(false);

  // Restock state
  const [restockItem, setRestockItem] = useState<{ item: Consumable; qty: string } | null>(null);

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const ITEMS_PER_PAGE = 7;
  const [consumablesPage, setConsumablesPage] = useState(1);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const paginatedConsumables = useMemo(() => {
    return consumables.slice(
      (consumablesPage - 1) * ITEMS_PER_PAGE,
      consumablesPage * ITEMS_PER_PAGE,
    );
  }, [consumables, consumablesPage]);

  const totalPages = Math.ceil(consumables.length / ITEMS_PER_PAGE);

  const lowStockConsumables = consumables.filter(
    (c) => c.active && c.stockQty <= c.minStockAlert,
  );

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleAddConsumable = async () => {
    setIsSubmitting(true);
    try {
      await addConsumable({
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
      setAddingConsumableItem(false);
      showNotification("Consumible agregado");
    } catch (error) {
      console.error("Error agregando consumible:", error);
      const message =
        error instanceof Error ? error.message : "Error al agregar";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateConsumable = async (
    id: string,
    updated: Partial<Consumable>,
  ) => {
    try {
      await updateConsumable(id, updated);
      setEditingConsumableItem(null);
      showNotification("Consumible actualizado");
    } catch (error) {
      console.error("Error actualizando consumible:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteConsumable = async (id: string) => {
    try {
      await deleteConsumable(id);
      showNotification("Consumible eliminado");
    } catch (error) {
      console.error("Error eliminando consumible:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleSaveEdit = () => {
    if (!editingConsumableItem) return;

    handleUpdateConsumable(editingConsumableItem.id, {
      ...editConsumableForm,
    });
  };

  const handleRestock = async () => {
    if (!restockItem) return;
    
    const qtyToAdd = parseFloat(restockItem.qty);
    if (isNaN(qtyToAdd) || qtyToAdd <= 0) {
      showNotification("Ingresa una cantidad válida", "error");
      return;
    }

    try {
      const newStock = restockItem.item.stockQty + qtyToAdd;
      await updateConsumable(restockItem.item.id, { stockQty: newStock });
      setRestockItem(null);
      showNotification(`Stock actualizado: +${qtyToAdd} ${restockItem.item.packageSize > 1 ? 'paquetes' : restockItem.item.unit}`);
    } catch (error) {
      console.error("Error actualizando stock:", error);
      showNotification("Error al actualizar stock", "error");
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Low Stock Alert */}
      {lowStockConsumables.length > 0 && (
        <div className="bg-linear-to-r from-orange-900/10 to-red-900/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-orange-600" size={32} />
            <div>
              <h3 className="text-lg font-bold text-orange-600">
                Bajo Stock - Consumibles
              </h3>
              <p className="text-sm text-text-muted">
                {lowStockConsumables.length} producto
                {lowStockConsumables.length > 1 ? "s" : ""} necesita
                {lowStockConsumables.length > 1 ? "n" : ""} reposición
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStockConsumables.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center bg-surface rounded-lg p-3 h-full"
              >
                <div>
                  <p className="font-semibold text-text-main">{c.name}</p>
                  <p className="text-xs text-text-muted">
                    Stock: {c.stockQty} {c.unit} (Min: {c.minStockAlert})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingConsumableItem(c);
                    setEditConsumableForm({ ...c });
                  }}
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors shrink-0 ml-2"
                >
                  Actualizar Stock
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header & Add Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
          <Package className="text-primary-600" />
          Consumibles
        </h3>
        <button
          onClick={() => setAddingConsumableItem(true)}
          className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold p-2 md:px-4 md:py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95 w-auto"
        >
          <Plus size={18} />
          <span className="hidden md:inline-block ml-1">Nuevo Consumible</span>
        </button>
      </div>

      {/* Consumables Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="bg-surface-highlight">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  En Uso
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Precio Compra
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Stock Reserva
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border">
              {paginatedConsumables.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Package}
                      title="No hay consumibles"
                      message="Agrega el primer consumible usando el botón de arriba."
                    />
                  </td>
                </tr>
              ) : (
                paginatedConsumables.map((consumable) => {
                  const isLowStock = consumable.stockQty <= consumable.minStockAlert;


                  return (
                    <tr
                      key={consumable.id}
                      className={`group transition-colors duration-200 hover:bg-surface-highlight ${
                        !consumable.active
                          ? "opacity-60 bg-surface-highlight"
                          : ""
                      }`}
                    >
                      {/* Name */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-main">
                        {consumable.name}
                      </p>
                    </td>

                    {/* Opened Container Status (En Uso) */}
                    <td className="px-6 py-4">
                      <div className="min-w-[140px]">
                        {consumable.packageSize > 0 && (() => {
                          const decimalPart = consumable.stockQty % 1;
                          const isFullContainer = decimalPart === 0 && consumable.stockQty > 0;
                          const remainder = isFullContainer ? consumable.packageSize : decimalPart * consumable.packageSize;
                          const percentage = (remainder / consumable.packageSize) * 100;
                          
                          return (
                            <>
                              <p className="text-xs font-medium text-text-main mb-1">
                                {Number(remainder.toFixed(1))} / {Number(consumable.packageSize)} {consumable.unit}
                              </p>
                              <div className="w-full bg-gray-200/50 dark:bg-gray-700/50 rounded-full h-2">
                                <div
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    isLowStock ? "bg-orange-600" : "bg-primary-600"
                                  }`}
                                  style={{
                                    width: `${Math.min(100, percentage)}%`,
                                  }}
                                />
                              </div>
                              {isLowStock && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-600 text-[10px] font-bold rounded-full mt-1">
                                  <AlertTriangle size={10} />
                                  BAJO
                                </span>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>

                    {/* Purchase Price */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-main">
                        ${consumable.purchasePrice.toFixed(2)}
                      </p>
                    </td>

                    {/* Reserve Stock (Closed Units) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className={`text-sm font-bold ${isLowStock ? "text-red-600 font-extrabold" : "text-text-main"}`}>
                            {Math.floor(consumable.stockQty)}
                          </p>
                          <p className="text-xs text-text-muted">
                            Mín: {consumable.minStockAlert}
                          </p>
                        </div>
                        {/* Quick Restock Button */}
                        <button
                          onClick={() => setRestockItem({ item: consumable, qty: "" })}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-600/10 transition-all duration-200 hover:scale-110 active:scale-90"
                          title="Agregar Stock"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditingConsumableItem(consumable);
                              setEditConsumableForm({ ...consumable });
                            }}
                            className="p-2 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all duration-200 hover:scale-110 active:scale-90"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete Button (Owner only) */}
                          {currentUser?.role === "owner" && (
                            <button
                              onClick={() =>
                                handleDeleteConsumable(consumable.id)
                              }
                              className="p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90"
                              title="Eliminar"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-surface-highlight">
            <p className="text-sm text-text-muted">
              Página {consumablesPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  setConsumablesPage((p) => Math.max(1, p - 1))
                }
                disabled={consumablesPage === 1}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setConsumablesPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={consumablesPage === totalPages}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Consumable Slide-over */}
      {addingConsumableItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setAddingConsumableItem(false)}
          />

          {/* Slide-over Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-surface shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-highlight flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Nuevo Consumible
                </h3>
                <p className="text-sm text-text-muted">
                  Agregar producto desechable
                </p>
              </div>
              <button
                onClick={() => setAddingConsumableItem(false)}
                className="p-2 rounded-full hover:bg-surface text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  placeholder="ej. Toallas Desechables"
                  value={newConsumable.name}
                  onChange={(e) =>
                    setNewConsumable((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Unidad
                </label>
                <input
                  type="text"
                  placeholder="ej. unid, par, paquete"
                  value={newConsumable.unit}
                  onChange={(e) =>
                    setNewConsumable((prev) => ({
                      ...prev,
                      unit: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Purchase Price & Package Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Precio Compra
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newConsumable.purchasePrice}
                      onChange={(e) =>
                        setNewConsumable((prev) => ({
                          ...prev,
                          purchasePrice: e.target.value,
                        }))
                      }
                      className="w-full pl-10 pr-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Tamaño Paquete
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="ej. 100"
                    value={newConsumable.packageSize}
                    onChange={(e) =>
                      setNewConsumable((prev) => ({
                        ...prev,
                        packageSize: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Stock & Min Alert */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={newConsumable.stockQty}
                    onChange={(e) =>
                      setNewConsumable((prev) => ({
                        ...prev,
                        stockQty: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    step="1"
                    placeholder="0"
                    value={newConsumable.minStockAlert}
                    onChange={(e) =>
                      setNewConsumable((prev) => ({
                        ...prev,
                        minStockAlert: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setAddingConsumableItem(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddConsumable}
                disabled={
                  isSubmitting ||
                  !newConsumable.name ||
                  !newConsumable.unit ||
                  !newConsumable.purchasePrice ||
                  !newConsumable.packageSize
                }
                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isSubmitting ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Consumable Slide-over */}
      {editingConsumableItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingConsumableItem(null)}
          />

          {/* Slide-over Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-surface shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-highlight flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Editar Consumible
                </h3>
                <p className="text-sm text-text-muted">
                  {editingConsumableItem.name}
                </p>
              </div>
              <button
                onClick={() => setEditingConsumableItem(null)}
                className="p-2 rounded-full hover:bg-surface text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Nombre
                </label>
                <input
                  type="text"
                  value={editConsumableForm.name || ""}
                  onChange={(e) =>
                    setEditConsumableForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Unit */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Unidad
                </label>
                <input
                  type="text"
                  value={editConsumableForm.unit || ""}
                  onChange={(e) =>
                    setEditConsumableForm((prev) => ({
                      ...prev,
                      unit: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Purchase Price & Package Size */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Precio Compra
                  </label>
                  <div className="relative">
                    <DollarSign
                      size={18}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={editConsumableForm.purchasePrice ?? ""}
                      onChange={(e) =>
                        setEditConsumableForm((prev) => ({
                          ...prev,
                          purchasePrice: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full pl-10 pr-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Tamaño Paquete
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editConsumableForm.packageSize ?? ""}
                    onChange={(e) =>
                      setEditConsumableForm((prev) => ({
                        ...prev,
                        packageSize: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Stock & Min Alert */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editConsumableForm.stockQty ?? ""}
                    onChange={(e) =>
                      setEditConsumableForm((prev) => ({
                        ...prev,
                        stockQty: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={editConsumableForm.minStockAlert ?? ""}
                    onChange={(e) =>
                      setEditConsumableForm((prev) => ({
                        ...prev,
                        minStockAlert: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-lg border border-border">
                <span className="text-sm font-medium text-text-main">
                  Producto Activo
                </span>
                <button
                  onClick={() =>
                    setEditConsumableForm((prev) => ({
                      ...prev,
                      active: !prev.active,
                    }))
                  }
                  className={`relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${
                    editConsumableForm.active ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                      editConsumableForm.active
                        ? "translate-x-7"
                        : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setEditingConsumableItem(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
              >
                <Save size={18} />
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setRestockItem(null)}
          />

          {/* Modal Panel */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-surface shadow-2xl border border-border rounded-2xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-highlight flex justify-between items-center rounded-t-2xl">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Reabastecer Stock
                </h3>
                <p className="text-sm text-text-muted">
                  {restockItem.item.name}
                </p>
              </div>
              <button
                onClick={() => setRestockItem(null)}
                className="p-2 rounded-full hover:bg-surface text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Current Stock Display */}
              <div className="p-4 bg-primary-600/10 border border-primary-600/20 rounded-lg">
                <p className="text-xs text-text-muted mb-1">Stock Actual</p>
                <p className="text-2xl font-bold text-primary-600">
                  {Math.floor(restockItem.item.stockQty)} {restockItem.item.packageSize > 1 ? 'paquetes' : restockItem.item.unit}
                </p>
              </div>

              {/* Quantity Input */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Cantidad a Agregar
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder="0"
                  value={restockItem.qty}
                  onChange={(e) => setRestockItem({ ...restockItem, qty: e.target.value })}
                  className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none"
                  autoFocus
                />
              </div>

              {/* Preview */}
              {restockItem.qty && parseFloat(restockItem.qty) > 0 && (
                <div className="p-4 bg-emerald-600/10 border border-emerald-600/20 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">Nuevo Stock</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {Math.floor(restockItem.item.stockQty + parseFloat(restockItem.qty))} {restockItem.item.packageSize > 1 ? 'paquetes' : restockItem.item.unit}
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3 rounded-b-2xl">
              <button
                onClick={() => setRestockItem(null)}
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleRestock}
                disabled={!restockItem.qty || parseFloat(restockItem.qty) <= 0}
                className="flex-1 px-4 py-3 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Plus size={18} />
                Agregar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
