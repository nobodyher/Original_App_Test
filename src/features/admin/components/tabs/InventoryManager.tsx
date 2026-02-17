import React, { useState, useMemo } from "react";
import type { InventoryItem, AppUser, Toast } from "../../../../types";
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
  RefreshCw,
} from "lucide-react";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import { openNewInventoryUnit } from "../../../../services/inventoryService";

const ITEMS_PER_PAGE = 10;



interface InventoryManagerProps {
  inventoryItems: InventoryItem[];
  currentUser: AppUser | null;
  onAdd: (product: Omit<InventoryItem, "id">) => Promise<void>;
  onUpdate: (id: string, updates: Partial<InventoryItem>) => Promise<void>;
  onEdit: (item: InventoryItem) => void;
  onDelete: (id: string) => void;
  showNotification: (message: string, type?: Toast["type"]) => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  inventoryItems,
  currentUser,
  onAdd,
  onUpdate,
  onDelete,
  showNotification,
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
    onConfirm?: () => void;
    showCancel?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    variant: "danger",
    showCancel: false,
  });

  // New State for "Reset Content" in Edit Mode
  const [resetContent, setResetContent] = useState(false);

  // Open Unit Modal State
  const [openUnitConfig, setOpenUnitConfig] = useState<{
      isOpen: boolean;
      item: InventoryItem | null;
  }>({
      isOpen: false,
      item: null
  });
  const [openUnitForm, setOpenUnitForm] = useState<{
      reason: string;
      notes: string;
  }>({
      reason: 'Ajuste manual',
      notes: ''
  });

  // Incident Modal State
  const [incidentModal, setIncidentModal] = useState<{
      isOpen: boolean;
      item: InventoryItem | null;
  }>({
      isOpen: false,
      item: null
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

  // Alert Logic
  const lowStockItems = useMemo(() => {
    return inventoryItems.filter(item => 
      item.active && 
      (getItemsStock(item) <= getItemsMinStock(item))
    );
  }, [inventoryItems]);

  // Helper wrappers for use inside memo/render
  function getItemsStock(item: InventoryItem) { return item.stock ?? item.stockQty ?? 0; }
  function getItemsMinStock(item: InventoryItem) { return item.minStock ?? item.minStockAlert ?? 0; }


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
    setResetContent(false); // Reset checkbox state on open
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData(initialFormState);
  };

  const handleOpenUnit = (item: InventoryItem) => {
    if (item.stock <= 0) {
        setAlertConfig({
            isOpen: true,
            title: "Stock Insuficiente",
            message: "No hay unidades selladas en stock para abrir.",
            variant: "danger",
            showCancel: false,
        });
        return;
    }

    setAlertConfig({
        isOpen: true,
        title: "Abrir Nueva Unidad",
        message: `Se descontará 1 unidad del stock de "${item.name}" y se reiniciará su contenido de uso al máximo. ¿Confirmar?`,
        variant: "info",
        showCancel: true,
        onConfirm: () => handleSimpleOpenUnit(item)
    });
  };

  const handleSimpleOpenUnit = async (item: InventoryItem) => {
      if (!currentUser) return;
      
      // Close alert immediately to show action is happening, or keep it open?
      // Better to close and show toast.
      setAlertConfig(prev => ({ ...prev, isOpen: false }));

      try {
           // Import dinamico o uso directo si ya esta importado. 
           // Asumimos que openNewInventoryUnit ya esta disponible o lo importamos.
           // Revisando imports... esta importado como openNewInventoryUnit.
           await openNewInventoryUnit(
              item,
              "Reposición (Uso normal)",
              "", 
              {
                  uid: currentUser.id,
                  displayName: currentUser.name,
                  tenantId: currentUser.tenantId || ""
              }
          );
          showNotification("Unidad abierta y contenido reseteado", "success");
      } catch (error) {
          console.error("Error opening unit:", error);
          showNotification("Error al abrir unidad", "error");
      }
  };

  const handleReportIncident = async (type: 'minor' | 'medium' | 'total' | 'damaged') => {
      if (!incidentModal.item || !currentUser) return;
      
      setIsSubmitting(true);
      try {
          await import('../../../../services/inventoryService').then(mod => 
            mod.reportInventoryIncident(
                incidentModal.item!, 
                type, 
                {
                    uid: currentUser.id,
                    displayName: currentUser.name,
                    tenantId: currentUser.tenantId || ""
                }
            )
          );
          showNotification("Incidente registrado y gasto calculado", "success");
          setIncidentModal({ isOpen: false, item: null });
      } catch (error) {
          console.error("Error reporting incident:", error);
          showNotification("Error al registrar incidente", "error");
      } finally {
          setIsSubmitting(false);
      }
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

      // Handle Content Reset Logic
      if (editingItem && !resetContent) {
           // If NOT resetting, preserve existing currentContent
           payload.currentContent = editingItem.currentContent && editingItem.currentContent > 0 
                ? editingItem.currentContent 
                : content; 
      }
      // If resetContent is TRUE (or new item), payload.currentContent is already set to 'content' from above initialization

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
      
      {/* Low Stock Alert Summary */}
      {lowStockItems.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-xl p-4 max-w-2xl mx-auto md:mx-0 shadow-sm animate-pulse-light">
          <div className="flex items-start gap-3">
             <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg shrink-0">
               <AlertTriangle className="text-red-600 dark:text-red-400" size={20} />
             </div>
             <div>
               <h4 className="text-sm font-bold text-red-900 dark:text-red-100 mb-2">
                 Atención: {lowStockItems.length} Producto{lowStockItems.length !== 1 && 's'} con stock bajo
               </h4>
               <div className="flex flex-wrap gap-2">
                 {lowStockItems.map(item => (
                   <div 
                      key={item.id}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded text-xs font-medium text-red-700 dark:text-red-300"
                   >
                     <span>{item.name}</span>
                     <span className="font-bold bg-red-100 dark:bg-red-800/50 px-1 rounded">
                       {getItemsStock(item)}
                     </span>
                   </div>
                 ))}
               </div>
             </div>
          </div>
        </div>
      )}

      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        <h3 className="text-2xl font-bold text-text-primary flex items-center gap-2">
          <Package className="text-primary-600" />
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
              className="w-full pl-10 pr-4 py-2 bg-background text-text-primary border border-border rounded-xl focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all"
            />
          </div>

          {/* Add Button */}
          <button
            onClick={() => handleOpenModal()}
            className="whitespace-nowrap bg-primary-600 hover:bg-primary-700 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95"
          >
            <Plus size={18} />
            <span className="hidden sm:inline">Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-highlight border-b border-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">En Uso</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/6">Stock</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Costo</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-text-muted">
                    <Package className="mx-auto mb-3 opacity-20" size={48} />
                    <p>No se encontraron productos</p>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item) => {
                  const stock = getStock(item);
                  const minStock = getMinStock(item);
                  const content = getContent(item);
                  const isLowStock = stock <= minStock;
                  
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
                    <tr 
                      key={item.id} 
                      className={`group transition-colors ${
                        isLowStock 
                          ? 'bg-red-50 hover:bg-red-100 dark:bg-red-900/10 dark:hover:bg-red-900/20' 
                          : 'hover:bg-surface-highlight'
                      }`}
                    >
                      {/* Product Name & Detail */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg mt-1 relative ${
                            isLowStock 
                             ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                             : 'bg-primary-50 text-primary-600 dark:bg-primary-900/20 dark:text-primary-400'
                          }`}>
                            <Package size={20} />
                            {(item.needsReview || isLowStock) && (
                              <div className="absolute -top-1 -right-1 text-red-500 bg-white rounded-full p-0.5 shadow-sm">
                                <AlertCircle size={12} fill="currentColor" className="text-red-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-text-main flex items-center gap-2">
                              {item.name}
                              {item.needsReview && (
                                <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                  Revisar
                                </span>
                              )}
                              {isLowStock && (
                                <span className="text-[10px] bg-red-100 text-red-600 border border-red-200 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                                  Bajo Stock
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
                             <span className={`text-xs font-bold ${isLowStock ? 'text-red-600' : 'text-primary-600 dark:text-primary-400'}`}>
                                {Math.round(displayPercentage)}%
                             </span>
                          </div>
                          <div className="h-2.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ease-out ${isLowStock ? 'bg-red-500' : 'bg-primary-500'}`}
                              style={{ width: `${Math.min(displayPercentage, 100)}%` }}
                            />
                          </div>
                          <p className="text-[10px] text-gray-400 mt-1">En uso (abierto)</p>
                        </div>
                      </td>

                      {/* Stock (Closed Units) */}
                      <td className="px-6 py-4 align-top">
                        <div className="flex flex-col">
                            <span className={`text-lg font-bold ${isLowStock ? 'text-red-600 dark:text-red-400' : 'text-text-main'}`}>
                              {stock} <span className="text-xs font-normal text-text-muted">unid.</span>
                            </span>
                            {minStock > 0 && (
                                <span className={`text-xs ${isLowStock ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>
                                   Mín: {minStock}
                                </span>
                            )}
                        </div>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 align-top">
                        <div>
                          <p className="font-bold text-text-main">
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
                            className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleOpenUnit(item)}
                            className="p-2 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors border border-transparent hover:border-orange-200"
                            title="Abrir Nueva Unidad"
                          >
                            <RefreshCw size={18} />
                          </button>

                          {/* Incident Button - Owner Only */}
                          {currentUser?.role === 'owner' && (
                              <button
                                  onClick={() => setIncidentModal({ isOpen: true, item })}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                  title="Registrar Incidente / Merma"
                              >
                                  <AlertTriangle size={18} />
                              </button>
                          )}
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
          <div className="flex items-center justify-between px-4 py-3 bg-surface border-t border-border sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-text-main bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="relative ml-3 inline-flex items-center px-4 py-2 text-sm font-medium rounded-md text-text-main bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </div>
            <div className="hidden sm:flex flex-1 items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">
                  Mostrando página <span className="font-medium">{currentPage}</span> de <span className="font-medium">{totalPages}</span>
                  <span className="mx-2 text-text-dim">|</span>
                  Total: <span className="font-medium">{filteredItems.length}</span> resultados
                </p>
              </div>
              <div>
                <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center rounded-l-md px-2 py-2 text-text-muted ring-1 ring-inset ring-border hover:bg-surface-highlight focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">Anterior</span>
                    <ChevronLeft className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center rounded-r-md px-2 py-2 text-text-muted ring-1 ring-inset ring-border hover:bg-surface-highlight focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed"
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

              {editingItem && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 dark:bg-indigo-900/10 rounded-lg border border-indigo-100 dark:border-indigo-800 mt-4">
                    <input
                      type="checkbox"
                      id="resetContentDetails"
                      checked={resetContent}
                      onChange={(e) => setResetContent(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                    />
                    <label htmlFor="resetContentDetails" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                       ¿Resetear contenido al máximo?
                       <span className="block text-xs text-gray-500 font-normal mt-0.5">
                         Marca esto si el producto está nuevo/lleno (útil para correcciones).
                       </span>
                    </label>
                  </div>
              )}

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




      {/* Incident Report Modal */}
      {incidentModal.isOpen && incidentModal.item && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           {/* Backdrop */}
           <div 
             className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
             onClick={() => setIncidentModal({ isOpen: false, item: null })}
           />
           
           <div className="relative w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl shadow-2xl transform transition-all animate-in zoom-in-95 duration-200 overflow-hidden">
              <div className="p-6">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
                          <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                              Registrar Incidente / Merma
                          </h3>
                          <p className="text-sm text-gray-500">
                              {incidentModal.item.name}
                          </p>
                      </div>
                  </div>

                  <div className="space-y-3">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                          Selecciona la gravedad del incidente. El gasto se calculará automáticamente basado en el contenido perdido.
                      </p>

                      <button
                          onClick={() => handleReportIncident('minor')}
                          disabled={isSubmitting}
                          className="w-full p-4 flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-200 dark:hover:border-orange-800 transition-all group"
                      >
                          <div className="text-left">
                              <span className="block font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-700 dark:group-hover:text-orange-400">
                                  Derrame Leve (25%)
                              </span>
                              <span className="text-xs text-gray-500">
                                  Se descuenta 25% del contenido actual
                              </span>
                          </div>
                          <AlertTriangle className="w-5 h-5 text-gray-300 group-hover:text-orange-500" />
                      </button>

                      <button
                          onClick={() => handleReportIncident('medium')}
                          disabled={isSubmitting}
                          className="w-full p-4 flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/10 hover:border-orange-200 dark:hover:border-orange-800 transition-all group"
                      >
                          <div className="text-left">
                              <span className="block font-semibold text-gray-900 dark:text-gray-100 group-hover:text-orange-700 dark:group-hover:text-orange-400">
                                  Derrame Medio (50%)
                              </span>
                              <span className="text-xs text-gray-500">
                                  Se descuenta 50% del contenido actual
                              </span>
                          </div>
                          <AlertTriangle className="w-5 h-5 text-gray-300 group-hover:text-orange-500" />
                      </button>

                      <button
                          onClick={() => handleReportIncident('total')}
                          disabled={isSubmitting}
                          className="w-full p-4 flex items-center justify-between bg-white dark:bg-gray-800 border border-red-100 dark:border-red-900/30 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/10 hover:border-red-200 dark:hover:border-red-800 transition-all group"
                      >
                          <div className="text-left">
                              <span className="block font-bold text-red-600 dark:text-red-400">
                                  Pérdida Total / Abrir Nueva
                              </span>
                              <span className="text-xs text-red-400 dark:text-red-500">
                                  Se pierde todo el contenido y se abre una unidad nueva
                              </span>
                          </div>
                          <AlertCircle className="w-5 h-5 text-red-300 group-hover:text-red-600" />
                      </button>

                      <button
                          onClick={() => handleReportIncident('damaged')}
                          disabled={isSubmitting}
                          className="w-full p-4 flex items-center justify-between bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all group"
                      >
                           <div className="text-left">
                              <span className="block font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                                  Producto dañado / Defectuoso
                              </span>
                              <span className="text-xs text-gray-500">
                                  Registrar como pérdida total por defecto de calidad
                              </span>
                          </div>
                          <AlertTriangle className="w-5 h-5 text-gray-400 group-hover:text-gray-600" />
                      </button>
                  </div>

                  <div className="mt-6 flex justify-end">
                      <button
                          onClick={() => setIncidentModal({ isOpen: false, item: null })}
                          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                      >
                          Cancelar
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={alertConfig.isOpen}
        onClose={closeAlert}
        onConfirm={alertConfig.onConfirm || closeAlert}
        title={alertConfig.title}
        message={alertConfig.message}
        showCancel={alertConfig.showCancel}
        confirmText="OK"
        variant={alertConfig.variant}
      />
    </div>
  );
};
