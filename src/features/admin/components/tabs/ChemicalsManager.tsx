import React, { useState, useMemo } from "react";
import {
  Beaker,
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
import type { ChemicalProduct, Toast, AppUser } from "../../../../types";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ChemicalsManagerProps {
  // Data
  chemicalProducts: ChemicalProduct[];
  currentUser: AppUser | null;

  // Actions
  addChemicalProduct: (product: Omit<ChemicalProduct, "id" | "active">) => Promise<void>;
  updateChemicalProduct: (
    id: string,
    updates: Partial<ChemicalProduct>,
    currentProduct?: ChemicalProduct,
  ) => Promise<void>;
  deleteChemicalProduct: (id: string) => Promise<void>;
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

export const ChemicalsManager: React.FC<ChemicalsManagerProps> = ({
  chemicalProducts,
  currentUser,
  addChemicalProduct,
  updateChemicalProduct,
  deleteChemicalProduct,
  showNotification,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Add Chemical Product State
  const [newChemicalProduct, setNewChemicalProduct] = useState({
    name: "",
    quantity: "",
    unit: "ml" as "ml" | "g" | "unid",
    purchasePrice: "",
    stock: "",
    minStock: "",
  });

  // Edit Chemical Product State (Slide-over)
  const [editingProduct, setEditingProduct] = useState<ChemicalProduct | null>(
    null,
  );
  const [editChemicalForm, setEditChemicalForm] = useState<
    Partial<ChemicalProduct>
  >({});

  // Adding state (for slide-over)
  const [addingChemicalProduct, setAddingChemicalProduct] = useState(false);

  // Restock state
  const [restockItem, setRestockItem] = useState<{ item: ChemicalProduct; qty: string } | null>(null);

  // Loading State
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination
  const ITEMS_PER_PAGE = 7;
  const [chemicalsPage, setChemicalsPage] = useState(1);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const paginatedChemicals = useMemo(() => {
    return chemicalProducts.slice(
      (chemicalsPage - 1) * ITEMS_PER_PAGE,
      chemicalsPage * ITEMS_PER_PAGE,
    );
  }, [chemicalProducts, chemicalsPage]);

  const totalPages = Math.ceil(chemicalProducts.length / ITEMS_PER_PAGE);

  const lowStockChemicals = chemicalProducts.filter(
    (c) => c.active && c.stock <= c.minStock,
  );

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleAddChemicalProduct = async () => {
    setIsSubmitting(true);
    try {
      // 1. VALIDAZIONE
      const name = newChemicalProduct.name.trim();
      const quantity = parseFloat(newChemicalProduct.quantity) || 0;
      const purchasePrice = parseFloat(newChemicalProduct.purchasePrice) || 0;
      const stock = parseFloat(newChemicalProduct.stock || "0") || 0;
      const minStock = parseFloat(newChemicalProduct.minStock || "0") || 0;

      //  - Nombre obligatorio
      if (!name) {
        showNotification("El nombre del producto es obligatorio", "error");
        return;
      }

      //  - Duplicados
      const duplicate = chemicalProducts.find(
        (p) => p.name.trim().toLowerCase() === name.toLowerCase()
      );
      if (duplicate) {
        showNotification("Ya existe un producto con este nombre", "error");
        return;
      }

      //  - Valores negativos
      if (quantity < 0) {
        showNotification("La cantidad no puede ser negativa", "error");
        return;
      }
      if (purchasePrice < 0) {
        showNotification("El precio no puede ser negativo", "error");
        return;
      }
      if (stock < 0) {
        showNotification("El stock no puede ser negativo", "error");
        return;
      }
      if (minStock < 0) {
        showNotification("El stock mínimo no puede ser negativo", "error");
        return;
      }

      // Costo por unidad (ml/g) = Precio / Cantidad
      const costPerUnit = quantity > 0 ? purchasePrice / quantity : 0;

      await addChemicalProduct({
        name,
        quantity: quantity,
        unit: newChemicalProduct.unit as "ml" | "g" | "unid",
        purchasePrice: purchasePrice,
        yield: quantity, // Yield is now just the total content
        costPerService: costPerUnit, // Now storing Cost Per Unit
        stock: stock,
        minStock: minStock,
        yieldPerUnit: 0, // Deprecated
        currentYieldRemaining: 0, // Deprecated
      });

      setNewChemicalProduct({
        name: "",
        quantity: "",
        unit: "ml",
        purchasePrice: "",
        stock: "",
        minStock: "",
      });
      setAddingChemicalProduct(false);
      showNotification("Producto guardado");
    } catch (error) {
      console.error("Error agregando producto:", error);
      const message =
        error instanceof Error ? error.message : "Error al agregar";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateChemicalProduct = async (
    id: string,
    updates: Partial<ChemicalProduct>,
  ) => {
    try {
      // 1. Validaciones para edición
      // Como 'updates' es Partial, solo validamos lo que viene
      
      // Check Nombre Duplicado (si se actualiza el nombre)
      if (updates.name) {
        const name = updates.name.trim();
        if (!name) {
             showNotification("El nombre no puede estar vacío", "error");
             return;
        }
        const duplicate = chemicalProducts.find(
            (p) => p.name.trim().toLowerCase() === name.toLowerCase() && p.id !== id
        );
        if (duplicate) {
            showNotification("Ya existe otro producto con este nombre", "error");
            return;
        }
        // Actualizamos el update con el nombre trimmeado
        updates.name = name; 
      }

      // Check Negativos
      if (updates.purchasePrice !== undefined && Number(updates.purchasePrice) < 0) {
        showNotification("El precio no puede ser negativo", "error");
        return;
      }
      if (updates.quantity !== undefined && Number(updates.quantity) < 0) {
        showNotification("La cantidad no puede ser negativa", "error");
        return;
      }
      if (updates.stock !== undefined && Number(updates.stock) < 0) {
        showNotification("El stock no puede ser negativo", "error");
        return;
      }
       if (updates.minStock !== undefined && Number(updates.minStock) < 0) {
        showNotification("El stock mínimo no puede ser negativo", "error");
        return;
      }


      const currentProduct = chemicalProducts.find((p) => p.id === id);
      if (currentProduct) {
        const newPrice =
          updates.purchasePrice !== undefined
            ? updates.purchasePrice
            : currentProduct.purchasePrice;
        const newQuantity =
          updates.quantity !== undefined
            ? updates.quantity
            : currentProduct.quantity;

        // Sync yield with quantity if quantity is updated
        if (updates.quantity !== undefined) {
          updates.yield = updates.quantity;
        }

        // Recalculate costPerUnit if price or quantity changes
        if (
          updates.purchasePrice !== undefined ||
          updates.quantity !== undefined
        ) {
          updates.costPerService = newQuantity > 0 ? newPrice / newQuantity : 0;
        }
      }

      await updateChemicalProduct(
        id,
        updates,
        chemicalProducts.find((p) => p.id === id),
      );
      setEditingProduct(null);
      showNotification("Producto actualizado");
    } catch (error) {
      console.error("Error actualizando producto:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteChemicalProduct = async (id: string) => {
    try {
      await deleteChemicalProduct(id);
      showNotification("Producto eliminado");
    } catch (error) {
      console.error("Error eliminando producto:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleSaveEdit = () => {
    if (!editingProduct) return;

    handleUpdateChemicalProduct(editingProduct.id, {
      ...editChemicalForm,
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
      const newStock = restockItem.item.stock + qtyToAdd;
      await updateChemicalProduct(restockItem.item.id, { stock: newStock });
      setRestockItem(null);
      showNotification(`Stock actualizado: +${qtyToAdd} unidades`);
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
      {lowStockChemicals.length > 0 && (
        <div className="bg-gradient-to-r from-orange-900/10 to-red-900/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-orange-600" size={32} />
            <div>
              <h3 className="text-lg font-bold text-orange-600">
                Bajo Stock - Productos Químicos
              </h3>
              <p className="text-sm text-text-muted">
                {lowStockChemicals.length} producto
                {lowStockChemicals.length > 1 ? "s" : ""} necesita
                {lowStockChemicals.length > 1 ? "n" : ""} reposición
              </p>
            </div>
          </div>
          <div className="space-y-2">
            {lowStockChemicals.map((c) => (
              <div
                key={c.id}
                className="flex justify-between items-center bg-surface rounded-lg p-3"
              >
                <div>
                  <p className="font-semibold text-text-main">{c.name}</p>
                  <p className="text-xs text-text-muted">
                    Stock: {c.stock} {c.unit} (Min: {c.minStock})
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingProduct(c);
                    setEditChemicalForm({ ...c });
                  }}
                  className="px-3 py-1 bg-orange-600 text-white text-sm rounded-lg hover:bg-orange-700 transition-colors"
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
          <Beaker className="text-primary-600" />
          Productos Químicos
        </h3>
        <button
          onClick={() => setAddingChemicalProduct(true)}
          className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold p-2 md:px-4 md:py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95 w-auto"
        >
          <Plus size={18} />
          <span className="hidden md:inline-block ml-1">Nuevo Producto</span>
        </button>
      </div>

      {/* Chemicals Table */}
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
                  Costo/Unidad
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border">
              {paginatedChemicals.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Beaker}
                      title="No hay productos químicos"
                      message="Agrega el primer producto usando el botón de arriba."
                    />
                  </td>
                </tr>
              ) : (
                paginatedChemicals.map((chemical) => {
                  const isLowStock = chemical.stock <= chemical.minStock;

                  return (
                    <tr
                      key={chemical.id}
                      className={`group transition-colors duration-200 hover:bg-surface-highlight ${
                        !chemical.active
                          ? "opacity-60 bg-surface-highlight"
                          : ""
                      }`}
                    >
                      {/* Name */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-main">
                        {chemical.name}
                      </p>
                    </td>

                    {/* Opened Container Status (En Uso) */}
                    <td className="px-6 py-4">
                      <div className="min-w-[140px]">
                        {chemical.quantity > 0 && (() => {
                          const decimalPart = chemical.stock % 1;
                          const isFullContainer = decimalPart === 0 && chemical.stock > 0;
                          const remainder = isFullContainer ? chemical.quantity : decimalPart * chemical.quantity;
                          const percentage = (remainder / chemical.quantity) * 100;
                          
                          return (
                            <>
                              <p className="text-xs font-medium text-text-main mb-1">
                                {Number(remainder.toFixed(1))} / {Number(chemical.quantity)} {(chemical.unit as string).toLowerCase() === 'l' ? 'ml' : chemical.unit}
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
                        ${(chemical.purchasePrice || 0).toFixed(2)}
                      </p>
                    </td>

                    {/* Reserve Stock (Closed Units) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div>
                          <p className={`text-sm font-bold ${isLowStock ? "text-red-600 font-extrabold" : "text-text-main"}`}>
                            {Math.floor(chemical.stock)}
                          </p>
                          <p className="text-xs text-text-muted">
                            Mín: {chemical.minStock}
                          </p>
                          {isLowStock && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/10 text-orange-600 text-[10px] font-bold rounded-full mt-1">
                              <AlertTriangle size={10} />
                              BAJO STOCK
                            </span>
                          )}
                        </div>
                        {/* Quick Restock Button */}
                        <button
                          onClick={() => setRestockItem({ item: chemical, qty: "" })}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-600/10 transition-all duration-200 hover:scale-110 active:scale-90"
                          title="Agregar Stock"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>

                      {/* Cost Per Unit */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-primary-600">
                          ${(chemical.costPerService || 0).toFixed(4)}/{(chemical.unit as string).toLowerCase() === 'l' ? 'ml' : chemical.unit}
                        </p>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {/* Edit Button */}
                          <button
                            onClick={() => {
                              setEditingProduct(chemical);
                              setEditChemicalForm({ ...chemical });
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
                                handleDeleteChemicalProduct(chemical.id)
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
              Página {chemicalsPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setChemicalsPage((p) => Math.max(1, p - 1))}
                disabled={chemicalsPage === 1}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setChemicalsPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={chemicalsPage === totalPages}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Chemical Product Slide-over */}
      {addingChemicalProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setAddingChemicalProduct(false)}
          />

          {/* Slide-over Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-surface shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-highlight flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Nuevo Producto Químico
                </h3>
                <p className="text-sm text-text-muted">
                  Agregar producto para servicios
                </p>
              </div>
              <button
                onClick={() => setAddingChemicalProduct(false)}
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
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  placeholder="ej. Esmalte Rojo"
                  value={newChemicalProduct.name}
                  onChange={(e) =>
                    setNewChemicalProduct((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Contenido Neto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="15"
                    value={newChemicalProduct.quantity}
                    onChange={(e) =>
                      setNewChemicalProduct((prev) => ({
                        ...prev,
                        quantity: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Unidad
                  </label>
                  <select
                    value={newChemicalProduct.unit}
                    onChange={(e) =>
                      setNewChemicalProduct((prev) => ({
                        ...prev,
                        unit: e.target.value as "ml" | "g" | "unid",
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  >
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                    <option value="unid">unid</option>
                  </select>
                </div>
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Precio de Compra
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
                    value={newChemicalProduct.purchasePrice}
                    onChange={(e) =>
                      setNewChemicalProduct((prev) => ({
                        ...prev,
                        purchasePrice: e.target.value,
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Cost Per Unit (Calculated) */}
              {newChemicalProduct.quantity && newChemicalProduct.purchasePrice && (
                <div className="p-4 bg-primary-600/10 border border-primary-600/20 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">
                    Costo por {newChemicalProduct.unit}
                  </p>
                  <p className="text-2xl font-bold text-primary-600">
                    $
                    {(
                      parseFloat(newChemicalProduct.purchasePrice) /
                      parseFloat(newChemicalProduct.quantity)
                    ).toFixed(4)}
                    /{newChemicalProduct.unit}
                  </p>
                </div>
              )}

              {/* Stock & Min Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0"
                    value={newChemicalProduct.stock}
                    onChange={(e) =>
                      setNewChemicalProduct((prev) => ({
                        ...prev,
                        stock: e.target.value,
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
                    step="0.01"
                    placeholder="0"
                    value={newChemicalProduct.minStock}
                    onChange={(e) =>
                      setNewChemicalProduct((prev) => ({
                        ...prev,
                        minStock: e.target.value,
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
                onClick={() => setAddingChemicalProduct(false)}
                className="flex-1 px-4 py-3 rounded-xl bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddChemicalProduct}
                disabled={
                  isSubmitting ||
                  !newChemicalProduct.name ||
                  !newChemicalProduct.quantity ||
                  !newChemicalProduct.purchasePrice
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

      {/* Edit Chemical Product Slide-over */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingProduct(null)}
          />

          {/* Slide-over Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-surface shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-highlight flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Editar Producto Químico
                </h3>
                <p className="text-sm text-text-muted">{editingProduct.name}</p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
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
                  value={editChemicalForm.name || ""}
                  onChange={(e) =>
                    setEditChemicalForm((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Quantity & Unit */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Contenido Neto
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editChemicalForm.quantity ?? ""}
                    onChange={(e) =>
                      setEditChemicalForm((prev) => ({
                        ...prev,
                        quantity: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Unidad
                  </label>
                  <select
                    value={editChemicalForm.unit || "ml"}
                    onChange={(e) =>
                      setEditChemicalForm((prev) => ({
                        ...prev,
                        unit: e.target.value as "ml" | "g" | "unid",
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  >
                    <option value="ml">ml</option>
                    <option value="g">g</option>
                    <option value="unid">unid</option>
                  </select>
                </div>
              </div>

              {/* Purchase Price */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Precio de Compra
                </label>
                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={editChemicalForm.purchasePrice ?? ""}
                    onChange={(e) =>
                      setEditChemicalForm((prev) => ({
                        ...prev,
                        purchasePrice: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Cost Per Unit (Calculated) */}
              {editChemicalForm.quantity && editChemicalForm.purchasePrice && (
                <div className="p-4 bg-primary-600/10 border border-primary-600/20 rounded-lg">
                  <p className="text-xs text-text-muted mb-1">
                    Costo por {editChemicalForm.unit || "ml"}
                  </p>
                  <p className="text-2xl font-bold text-primary-600">
                    $
                    {(
                      editChemicalForm.purchasePrice / editChemicalForm.quantity
                    ).toFixed(4)}
                    /{editChemicalForm.unit || "ml"}
                  </p>
                </div>
              )}

              {/* Stock & Min Stock */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-2">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editChemicalForm.stock ?? ""}
                    onChange={(e) =>
                      setEditChemicalForm((prev) => ({
                        ...prev,
                        stock: parseFloat(e.target.value),
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
                    step="0.01"
                    value={editChemicalForm.minStock ?? ""}
                    onChange={(e) =>
                      setEditChemicalForm((prev) => ({
                        ...prev,
                        minStock: parseFloat(e.target.value),
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
                    setEditChemicalForm((prev) => ({
                      ...prev,
                      active: !prev.active,
                    }))
                  }
                  className={`relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${
                    editChemicalForm.active ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                      editChemicalForm.active
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
                onClick={() => setEditingProduct(null)}
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
                  {Math.floor(restockItem.item.stock)} u.
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
                    {Math.floor(restockItem.item.stock + parseFloat(restockItem.qty))} u.
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
