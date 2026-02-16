import React, { useState, useMemo } from "react";
import {
  Package,
  Search,
  Edit2,
  Trash2,
  Plus,
  X,
  Save,
  DollarSign,
  AlertTriangle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";

const ITEMS_PER_PAGE = 10;

// ============================================================================
// INTERFACES
// ============================================================================

export interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  minStock: number;
  unit: string;
  content: number; // Unified quantity/packageSize
  purchasePrice: number;
  active: boolean;
  // Fallbacks for safety during transition
  stockQty?: number;
  minStockAlert?: number;
  quantity?: number;
  packageSize?: number;
  unitCost?: number;
  needsReview?: boolean;
  currentContent?: number;
}

interface InventoryManagerProps {
  inventoryItems: InventoryItem[];
  onAdd: (product: Omit<InventoryItem, "id">) => Promise<void>;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  onEdit: (item: InventoryItem) => void; // Kept for compatibility but we might use internal state
  onDelete: (id: string) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventoryItems,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  // ==========================================================================
  // STATE
  // ==========================================================================
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert Modal State
  const [alertConfig, setAlertConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    variant: "info" | "danger";
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "danger",
  });

  const closeAlert = () => setAlertConfig((prev) => ({ ...prev, isOpen: false }));

  // Form State
  const initialFormState = {
    name: "",
    purchasePrice: "" as string | number,
    content: "" as string | number,
    unit: "unid",
    stock: "" as string | number,
    minStock: "" as string | number,
  };

  const [formData, setFormData] = useState(initialFormState);

  // ==========================================================================
  // HELPER FUNCTIONS
  // ==========================================================================
  
  // Normalize fields access
  const getStock = (item: InventoryItem) => item.stock ?? item.stockQty ?? 0;
  const getMinStock = (item: InventoryItem) => item.minStock ?? item.minStockAlert ?? 0;
  const getContent = (item: InventoryItem) => item.content ?? item.quantity ?? item.packageSize ?? 0;

  // ==========================================================================
  // COMPUTED
  // ==========================================================================
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventoryItems, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  // Reset to page 1 when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Cost Per Unit Calculation
  const calculatedUnitCost = useMemo(() => {
    const price = parseFloat(String(formData.purchasePrice ?? 0)) || 0;
    const content = parseFloat(String(formData.content ?? 0)) || 0;
    if (content > 0) {
      return (price / content).toFixed(4);
    }
    return "0.0000";
  }, [formData.purchasePrice, formData.content]);

  // ==========================================================================
  // HANDLERS
  // ==========================================================================

  const handleOpenModal = (item?: InventoryItem) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        name: item.name ?? "",
        purchasePrice: item.purchasePrice ?? "",
        content: getContent(item) ?? "",
        unit: item.unit ?? "unid",
        stock: getStock(item) ?? "",
        minStock: getMinStock(item) ?? "",
      });
    } else {
      setEditingItem(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialFormState);
  };

  /* ----------------------------------------------------------------------------------
   * HANDLE SAVE (VALIDATION INCLUDED)
   * ---------------------------------------------------------------------------------- */
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // 1. INPUT VALIDATION
      const name = formData.name.trim();
      const purchasePrice = parseFloat(String(formData.purchasePrice ?? 0)) || 0;
      const content = parseFloat(String(formData.content ?? 0)) || 0;
      const stock = parseFloat(String(formData.stock ?? 0)) || 0;
      const minStock = parseFloat(String(formData.minStock ?? 0)) || 0;

      //  - Required Fields
      if (!name) {
        throw new Error("El nombre del producto es obligatorio");
      }

      //  - Duplicate Name Check (Case-insensitive)
      const duplicate = inventoryItems.find(
        (item) =>
          item.name.trim().toLowerCase() === name.toLowerCase() &&
          item.id !== editingItem?.id // Ignore self if editing
      );

      if (duplicate) {
        throw new Error("Ya existe un producto con este nombre");
      }

      //  - Negative Values Check
      if (purchasePrice < 0) throw new Error("El precio de compra no puede ser negativo");
      if (content < 0) throw new Error("El contenido no puede ser negativo");
      if (stock < 0) throw new Error("El stock no puede ser negativo");
      if (minStock < 0) throw new Error("El stock mínimo no puede ser negativo");


      // 2. PREPARE PAYLOAD
      const payload = {
        name,
        purchasePrice,
        content,
        // Initialization logic: If currentContent is missing or 0, and we have stock, assume full first unit
        currentContent: editingItem?.currentContent && editingItem.currentContent > 0
          ? editingItem.currentContent 
          : content,
        unit: formData.unit ?? "unid",
        stock,
        minStock,
        unitCost: content > 0 ? purchasePrice / content : 0, // Avoid division by zero
        // Legacy/Compatibility fields
        quantity: content,
        packageSize: content,
        stockQty: stock,
        minStockAlert: minStock,
        active: true,
      };

      // 3. EXECUTE ACTION
      if (editingItem) {
        await onUpdate(editingItem.id, payload);
      } else {
        await onAdd(payload);
      }
      handleCloseModal();
      handleCloseModal();
    } catch (error) {
      console.error("Error saving inventory item:", error);
      const message = error instanceof Error ? error.message : "Error al guardar";
      
      // Use Custom Alert Modal instead of window.alert
      setAlertConfig({
        isOpen: true,
        title: "Atención",
        message: message,
        variant: "info", // Using 'info' style as requested
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
          <Package className="text-indigo-600" />
          Inventario Unificado
        </h3>
        
        <div className="flex flex-1 md:flex-none gap-3">
          {/* Search Bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => handleOpenModal()}
            className="whitespace-nowrap bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-indigo-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">En Uso</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Costo</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    <Package className="mx-auto mb-3 opacity-20" size={48} />
                    <p>No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const stock = getStock(item);
                  const minStock = getMinStock(item);
                  const content = getContent(item);
                  
                  // Progress Bar Calculation
                  // percentage and barColor removed as they were replaced by new logic

                  // Cost Calculation
                  const price = item.purchasePrice || 0;
                  const unitCost = item.unitCost || (content > 0 ? price / content : 0);

                   // Display Logic: If currentContent is 0/undefined but we have stock, show as full (first unit open)
                  const displayContent = (item.currentContent !== undefined && item.currentContent > 0)
                    ? Number(item.currentContent)
                    : (stock > 0 ? content : 0);

                  const displayPercentage = content > 0 ? (displayContent / content) * 100 : 0;

                  return (
                    <tr key={item.id} className="group hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      {/* Product Name & Detail */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400 mt-1 relative">
                            <Package size={20} />
                            {item.needsReview && (
                              <div className="absolute -top-1 -right-1 text-red-500 bg-white rounded-full p-0.5 shadow-sm" title="Datos incompletos/Revisar">
                                <AlertCircle size={12} fill="currentColor" className="text-red-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                              {item.name}
                              {item.needsReview && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                  Revisar
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {content} {item.unit}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* En Uso (Current Content) */}
                      <td className="px-6 py-4 align-top">
                         <div className="w-full max-w-xs">
                          <div className="flex justify-between text-xs mb-1.5 font-medium text-gray-700 dark:text-gray-300">
                             <span>
                               {displayContent.toFixed(1).replace(/\.0$/, '')} 
                               <span className="text-gray-500 font-normal"> / {content} {item.unit}</span>
                             </span>
                             <span className="text-xs text-indigo-600 dark:text-indigo-400 font-bold">
                                {Math.round(displayPercentage)}%
                             </span>
                          </div>
                          <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                              style={{ width: `${Math.min(displayPercentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">En uso (abierto)</p>
                        </div>
                      </td>

                      {/* Stock (Closed Units) */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col">
                            <span className={`text-lg font-bold ${stock <= minStock ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'}`}>
                              {stock} <span className="text-xs font-normal text-gray-500">unid.</span>
                            </span>
                            {minStock > 0 && (
                                <span className="text-xs text-gray-400">
                                   Mín: {minStock}
                                </span>
                            )}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 align-top">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-gray-100">
                            ${price.toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5 font-medium">
                            <span className={item.needsReview ? "text-red-500 font-bold" : "text-emerald-600"}>
                              ${unitCost.toFixed(4)}
                            </span>
                            <span className="text-gray-400 ml-1">/ {item.unit}</span>
                          </p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 align-top text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleOpenModal(item)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => onDelete(item.id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 size={18} />
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

        {/* Pagination Footer */}
        {filteredItems.length > 0 && (
          <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex flex-1 items-center justify-between">
              <div>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Mostrando página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                  <span className="mx-2 text-gray-400">|</span>
                  Total: <span className="font-medium">{filteredItems.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 dark:ring-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Siguiente</span>
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal / Slide-over */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
            onClick={handleCloseModal}
          />

          {/* Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white dark:bg-gray-900 shadow-2xl border-l border-gray-200 dark:border-gray-800 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {editingItem ? "Editar Producto" : "Nuevo Producto"}
                </h3>
                <p className="text-sm text-gray-500">
                  {editingItem ? "Modificar detalles del inventario" : "Agregar nuevo ítem al inventario"}
                </p>
              </div>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 text-gray-500 transition-all hover:rotate-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Nombre del Producto
                </label>
                <input
                  type="text"
                  placeholder="Ej: Shampoo Reparador"
                  value={formData.name ?? ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                />
              </div>

              {/* Pricing Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <DollarSign size={16} className="text-green-600" />
                  Precios y Contenido
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Precio Compra
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={formData.purchasePrice ?? ""}
                        onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                        className="w-full pl-7 pr-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Contenido Neto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Ej: 1000"
                      value={formData.content ?? ""}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                    Unidad de Medida
                  </label>
                  <select
                    value={formData.unit ?? "unid"}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                  >
                    <option value="unid">Unidad (unid)</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="kg">Kilogramos (kg)</option>
                    <option value="L">Litros (L)</option>
                    <option value="oz">Onzas (oz)</option>
                    <option value="caja">Caja</option>
                    <option value="par">Par</option>
                    <option value="set">Set</option>
                  </select>
                </div>

                {/* Calculator Feedback */}
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800 rounded-lg flex justify-between items-center">
                  <span className="text-xs text-indigo-700 dark:text-indigo-300 font-medium">
                    Costo calculado por {formData.unit}:
                  </span>
                  <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
                    ${calculatedUnitCost}
                  </span>
                </div>
              </div>

              {/* Inventory Section */}
              <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <AlertTriangle size={16} className="text-orange-600" />
                  Control de Inventario
                </h4>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={formData.stock ?? ""}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-500 uppercase mb-1">
                      Stock Mínimo
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="0"
                      value={formData.minStock ?? ""}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex gap-3">
              <button
                onClick={handleCloseModal}
                className="flex-1 px-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 font-semibold transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                disabled={isSubmitting || !formData.name}
                className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isSubmitting ? "Guardando..." : "Guardar Producto"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        onConfirm={closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancel={false}
        confirmText="OK"
        variant={alertConfig.variant}
      />
    </div>
  );
};
