import React, { useState, useMemo } from "react";
import {
  ShoppingCart,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import type {
  CatalogService,
  ChemicalProduct,
  Consumable,
  MaterialRecipe,
  ServiceRecipe,
} from "../../../../types";
import ServiceMaterialSelector from "./ServiceMaterialSelector";

interface ServicesManagerProps {
  services: CatalogService[];
  chemicals: ChemicalProduct[];
  consumables: Consumable[];
  materialRecipes: MaterialRecipe[];
  serviceRecipes: ServiceRecipe[];
  onAdd: (name: string, category: "manicura" | "pedicura", price: number) => Promise<void>;
  onUpdate: (id: string, data: Partial<CatalogService>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
}


  
  const EmptyState = ({ 
    icon: Icon, 
    title, 
    message 
  }: { 
    icon: React.ElementType, 
    title: string, 
    message: string 
  }) => (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
      <Icon size={64} className="text-gray-200 mb-4" strokeWidth={1.5} />
      <h3 className="text-lg font-bold text-gray-400 mb-2">{title}</h3>
      <p className="text-sm text-gray-400 max-w-xs mx-auto">{message}</p>
    </div>
  );

const ServicesManager: React.FC<ServicesManagerProps> = ({
  services,
  chemicals,
  consumables,
  materialRecipes,
  serviceRecipes,
  onAdd,
  onUpdate,
  onDelete,
  onRefresh,
}) => {
  // State
  const [newCatalogService, setNewCatalogService] = useState({
    name: "",
    category: "manicura" as "manicura" | "pedicura",
    basePrice: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCatalogService, setEditingCatalogService] = useState<string | null>(null);
  
  // Service Editing State (Slide-over)
  const [editingServiceItem, setEditingServiceItem] = useState<CatalogService | null>(null);
  const [editServiceForm, setEditServiceForm] = useState<Partial<CatalogService>>({});
  
  // Note: selectedMaterials is now managed via editServiceForm.manualMaterials 
  // but for the transition we might still need standard state or valid synchronization?
  // The user asked to replace the selector. The selector uses `editServiceForm.manualMaterials` in the prompt example.
  // So we might not need separate `selectedMaterials` state if we update `editServiceForm` directly.
  // However, `handleUpdateServiceWithMaterials` in original code used `selectedMaterials` and `selectedConsumables`.
  // I will adapt to use `editServiceForm.manualMaterials` and `manualConsumables` directly if possible, or sync them.
  // Original code had `selectedMaterials` state separate.
  // Prompt: selectedIds={editServiceForm.manualMaterials || []}
  // This implies `editServiceForm` holds the source of truth now.
  
  // Pagination
  const ITEMS_PER_PAGE = 7;
  const [servicesPage, setServicesPage] = useState(1);

  // Derived state
  const paginatedServices = useMemo(() => {
    return services.slice((servicesPage - 1) * ITEMS_PER_PAGE, servicesPage * ITEMS_PER_PAGE);
  }, [services, servicesPage]);

  // Handlers
  const handleAddService = async () => {
    setIsSubmitting(true);
    try {
      await onAdd(
        newCatalogService.name,
        newCatalogService.category,
        parseFloat(newCatalogService.basePrice)
      );
      setNewCatalogService({ name: "", category: "manicura", basePrice: "" });
      onRefresh?.();
    } catch (error) {
      console.error("Error adding service:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateService = async (id: string, updated: Partial<CatalogService>) => {
    try {
      await onUpdate(id, updated);
      onRefresh?.();
      setEditingCatalogService(null);
    } catch (error) {
      console.error("Error updating service:", error);
    }
  };

  const handleToggleService = async (id: string, active: boolean) => {
    try {
      await onUpdate(id, { active: !active });
      onRefresh?.();
    } catch (error) {
       console.error("Error toggling service:", error);
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!window.confirm("¿Eliminar este servicio del catálogo?")) return;
    try {
      await onDelete(id);
      onRefresh?.();
    } catch (error) {
       console.error("Error deleting service:", error);
    }
  };

  const handleSaveChanges = async () => {
     if (editingServiceItem && editServiceForm) {
        try {
           await onUpdate(editingServiceItem.id, {
             ...editServiceForm,
             // Ensure manual arrays are present
             manualMaterials: editServiceForm.manualMaterials || [],
             manualConsumables: editServiceForm.manualConsumables || [],
           });
           onRefresh?.();
           setEditingServiceItem(null);
        } catch (error) {
           console.error("Error saving changes:", error);
        }
     }
  };

  const handleToggleConsumable = (consumableId: string) => {
    setEditServiceForm(prev => {
       const currentConsumables = prev.manualConsumables || [];
       const exists = currentConsumables.some(c => c.consumableId === consumableId);
       let newConsumables;
       if (exists) {
          newConsumables = currentConsumables.filter(c => c.consumableId !== consumableId);
       } else {
          newConsumables = [...currentConsumables, { consumableId, qty: 1 }];
       }
       return { ...prev, manualConsumables: newConsumables };
    });
  };

  const handleConsumableQtyChange = (consumableId: string, qty: number) => {
    setEditServiceForm(prev => {
        const currentConsumables = prev.manualConsumables || [];
        const newConsumables = currentConsumables.map(c => 
            c.consumableId === consumableId ? { ...c, qty: Math.max(1, qty) } : c
        );
        return { ...prev, manualConsumables: newConsumables };
    });
  };

  // Legacy fallback logic wrapper
  const openEditModal = (cs: CatalogService) => {
      setEditingServiceItem(cs);
      const formState = { ...cs };
      
      // Init manualMaterials
      if (!formState.manualMaterials) {
         // Fallback logic
         const legacyRecipe = materialRecipes.find(
            r => r.serviceId === cs.id || r.serviceName.toLowerCase() === cs.name.toLowerCase()
         );
         
         const legacyMaterialIds: string[] = [];
         
         if (legacyRecipe) {
            for (const chemicalIdOrName of legacyRecipe.chemicalIds) {
                let matchedProduct = chemicals.find(p => p.id === chemicalIdOrName);
                if (!matchedProduct) {
                    const normalizedSearch = chemicalIdOrName.toLowerCase().replace(/_/g, ' ').trim();
                    matchedProduct = chemicals.find(p => {
                        const normalizedProductName = p.name.toLowerCase().replace(/_/g, ' ').trim();
                        return normalizedProductName === normalizedSearch || 
                                normalizedProductName.includes(normalizedSearch) ||
                                normalizedSearch.includes(normalizedProductName);
                    });
                }
                if (matchedProduct) {
                    legacyMaterialIds.push(matchedProduct.id);
                }
            }
         }
         formState.manualMaterials = legacyMaterialIds;
      }

      // Init manualConsumables
      if (!formState.manualConsumables) {
          // Fallback logic
           const serviceRecipe = serviceRecipes.find(
              (r) => r.id === cs.id || r.id === cs.name
           );
           
           if (serviceRecipe) {
              formState.manualConsumables = serviceRecipe.items;
           } else {
              formState.manualConsumables = [];
           }
      }

      setEditServiceForm(formState);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
            <ShoppingCart className="text-purple-600" />
            Catálogo de Servicios
        </h3>

        {/* Inline Add Form */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-purple-50 rounded-lg">
            <input
                type="text"
                placeholder="Nombre del servicio"
                value={newCatalogService.name}
                onChange={(e) => setNewCatalogService({ ...newCatalogService, name: e.target.value })}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <select
                value={newCatalogService.category}
                onChange={(e) => setNewCatalogService({ ...newCatalogService, category: e.target.value as "manicura" | "pedicura" })}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            >
                <option value="manicura">Manicura</option>
                <option value="pedicura">Pedicura</option>
            </select>
            <input
                type="number"
                step="0.01"
                placeholder="Precio base $"
                value={newCatalogService.basePrice}
                onChange={(e) => setNewCatalogService({ ...newCatalogService, basePrice: e.target.value })}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <button
                onClick={handleAddService}
                disabled={isSubmitting}
                className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out font-semibold ${
                  isSubmitting ? "opacity-60 cursor-wait animate-pulse pointer-events-none" : "cursor-pointer hover:-translate-y-0.5 active:scale-95 active:shadow-inner"
                }`}
            >
                Agregar
            </button>
        </div>

        {/* Table */}
          <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Precio Base
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState 
                        icon={ShoppingCart} 
                        title="No hay servicios" 
                        message="Usa el formulario de arriba para añadir el primer servicio al catálogo." 
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedServices.map((cs) => {
                  const isEditing = editingCatalogService === cs.id;

                  return (
                    <tr
                      key={cs.id}
                      className={`group transition-colors duration-200 even:bg-slate-50/30 hover:bg-gray-100/80 ${
                        !cs.active ? "opacity-60 bg-gray-50" : ""
                      }`}
                    >
                      <td className="w-4"></td>
                      {isEditing ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              defaultValue={cs.name}
                              id={`edit-service-name-${cs.id}`}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              defaultValue={cs.category}
                              id={`edit-service-category-${cs.id}`}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none appearance-none bg-white"
                            >
                              <option value="manicura">Manicura</option>
                              <option value="pedicura">Pedicura</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={cs.basePrice}
                              id={`edit-service-price-${cs.id}`}
                              className="w-32 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                cs.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                             }`}>
                                {cs.active ? "Activo" : "Inactivo"}
                             </span>
                          </td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <button
                              onClick={() => {
                                const name = (
                                  document.getElementById(
                                    `edit-service-name-${cs.id}`
                                  ) as HTMLInputElement
                                ).value;
                                const category = (
                                  document.getElementById(
                                    `edit-service-category-${cs.id}`
                                  ) as HTMLSelectElement
                                ).value as "manicura" | "pedicura";
                                const basePrice = parseFloat(
                                  (
                                    document.getElementById(
                                      `edit-service-price-${cs.id}`
                                    ) as HTMLInputElement
                                  ).value
                                );

                                handleUpdateService(cs.id, {
                                  name,
                                  category,
                                  basePrice,
                                });
                              }}
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"
                              title="Guardar"
                            >
                              <Save size={18} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => setEditingCatalogService(null)}
                              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
                              title="Cancelar"
                            >
                              <X size={18} strokeWidth={2.5} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {cs.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 capitalize tracking-wide">
                            {cs.category}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 font-mono">
                            ${cs.basePrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm ${
                                cs.active
                                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              }`}
                            >
                              {cs.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                              onClick={() => openEditModal(cs)}
                                className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:scale-110 active:scale-90"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleService(cs.id, cs.active)
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  cs.active
                                    ? "text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                } transition-all duration-200 hover:scale-110 active:scale-90`}
                                title={cs.active ? "Desactivar" : "Activar"}
                              >
                                {cs.active ? (
                                  <XCircle size={16} />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteService(cs.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 mt-2">
            <div className="text-sm text-gray-500 font-medium">
              Mostrando {Math.min((servicesPage - 1) * ITEMS_PER_PAGE + 1, services.length)} - {Math.min(servicesPage * ITEMS_PER_PAGE, services.length)} de {services.length} servicios
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                disabled={servicesPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold shadow-sm shadow-purple-200">
                {servicesPage}
              </span>
              <button
                onClick={() => setServicesPage((p) => (p * ITEMS_PER_PAGE < services.length ? p + 1 : p))}
                disabled={servicesPage * ITEMS_PER_PAGE >= services.length}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          
        {/* Slide-over para Edición de Servicio con Materiales */}
        {editingServiceItem && (
        <div className="fixed inset-0 z-60 flex justify-end">
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingServiceItem(null)}
          />

          <div className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Editar Servicio</h3>
                <p className="text-sm text-gray-500">Configuración y materiales</p>
              </div>
              <button 
                onClick={() => setEditingServiceItem(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <ShoppingCart size={18} className="text-purple-600" />
                   Información del Servicio
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Servicio</label>
                  <input
                    type="text"
                    value={editServiceForm.name || ""}
                    onChange={(e) => setEditServiceForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Categoría</label>
                      <select
                        value={editServiceForm.category || "manicura"}
                        onChange={(e) => setEditServiceForm(prev => ({ ...prev, category: e.target.value as "manicura" | "pedicura" }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      >
                         <option value="manicura">Manicura</option>
                         <option value="pedicura">Pedicura</option>
                      </select>
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Precio Base</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editServiceForm.basePrice ?? ""}
                          onChange={(e) => setEditServiceForm(prev => ({ ...prev, basePrice: parseFloat(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                        />
                      </div>
                   </div>
                </div>
              </div>

               {/* Vincular Materiales - REPLACED with ServiceMaterialSelector */}
               <ServiceMaterialSelector 
                 chemicals={chemicals} 
                 selectedIds={editServiceForm.manualMaterials || []}
                 onChange={(newIds) => setEditServiceForm(prev => ({ ...prev, manualMaterials: newIds }))} 
               />

              {/* Vincular Consumibles (Desechables) */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Package size={18} className="text-blue-600" />
                   Vincular Consumibles (Desechables)
                </h4>
                
                <p className="text-sm text-gray-500">
                  Selecciona los consumibles desechables que se utilizan en este servicio y especifica la cantidad
                </p>

                <div className="space-y-2 max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
                  {consumables.length === 0 ? (
                    <div className="p-6 text-center">
                      <Package size={48} className="mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-400">No hay consumibles disponibles</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {consumables
                        .filter(c => c.active)
                        .map((consumable) => {
                          const isSelected = (editServiceForm.manualConsumables || []).some(sc => sc.consumableId === consumable.id);
                          const selectedItem = (editServiceForm.manualConsumables || []).find(sc => sc.consumableId === consumable.id);
                          const isLowStock = consumable.stockQty <= consumable.minStockAlert;
                          
                          return (
                            <div
                              key={consumable.id}
                              className={`p-4 hover:bg-blue-50 transition-colors ${
                                isSelected ? 'bg-blue-50/50' : ''
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => handleToggleConsumable(consumable.id)}
                                  className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-2">
                                    <p className="font-semibold text-gray-800 truncate">{consumable.name}</p>
                                    {isLowStock && (
                                      <span className="shrink-0 px-2 py-0.5 bg-orange-100 text-orange-700 text-[10px] font-bold rounded-full">
                                        BAJO STOCK
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3">
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Unidad:</span> {consumable.unit}
                                    </p>
                                    <p className={`text-xs font-semibold ${isLowStock ? 'text-orange-600' : 'text-slate-700'}`}>
                                      Stock: {consumable.stockQty} {consumable.unit}
                                    </p>
                                  </div>
                                  
                                  {isSelected && (
                                    <div className="mt-3 flex items-center gap-2">
                                      <label className="text-xs font-medium text-gray-600">Cantidad:</label>
                                      <div className="relative">
                                        <input
                                          type="number"
                                          min="1"
                                          value={selectedItem?.qty || 1}
                                          onChange={(e) => handleConsumableQtyChange(consumable.id, parseInt(e.target.value) || 1)}
                                          className="w-20 px-3 py-1.5 text-sm bg-white text-gray-900 border border-blue-300 rounded-lg transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                                        />
                                        <span className="ml-2 text-xs text-gray-500">{consumable.unit}</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {(editServiceForm.manualConsumables || []).length > 0 && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle size={18} className="text-blue-600" />
                      <p className="text-sm font-semibold text-blue-800">
                        {(editServiceForm.manualConsumables || []).length} consumible{(editServiceForm.manualConsumables || []).length !== 1 ? 's' : ''} seleccionado{(editServiceForm.manualConsumables || []).length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {(editServiceForm.manualConsumables || []).map(sc => {
                        const consumable = consumables.find(c => c.id === sc.consumableId);
                        return consumable ? (
                          <span key={sc.consumableId} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded-md text-xs text-gray-700">
                            <span className="font-medium">{consumable.name}</span>
                            <span className="text-blue-600 font-bold">×{sc.qty}</span>
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditingServiceItem(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveChanges}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesManager;
