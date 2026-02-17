import React, { useState, useMemo } from "react"

;
import {
  ShoppingCart,
  Plus,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  AlertTriangle,
  Beaker,
  ChevronLeft,
  ChevronRight,
  Package,
} from "lucide-react";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import type {
  CatalogService,

  Toast,
  AppUser,
  InventoryItem,
} from "../../../../types";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ServicesManagerProps {
  // Data
  catalogServices: CatalogService[];
  inventoryItems?: InventoryItem[];
  currentUser: AppUser | null;

  // Actions
  addCatalogService: (
    name: string,
    price: number,
  ) => Promise<string>;
  updateCatalogService: (
    id: string,
    data: Partial<CatalogService>,
  ) => Promise<void>;
  deleteCatalogService: (id: string) => Promise<void>;
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

export const ServicesManager: React.FC<ServicesManagerProps> = ({
  catalogServices,
  inventoryItems = [],
  currentUser,
  addCatalogService,
  updateCatalogService,
  deleteCatalogService,
  showNotification,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Service Editing State (Slide-over)
  const [editingServiceItem, setEditingServiceItem] =
    useState<CatalogService | null>(null);
  const [editServiceForm, setEditServiceForm] = useState<
    Partial<CatalogService>
  >({});
  const [selectedMaterials, setSelectedMaterials] = useState<
    { materialId: string; qty: number }[]
  >([]);

  // Search States for Service Editor
  const [materialSearch, setMaterialSearch] = useState("");


  // Service Form Tabs
  const [serviceFormTab, setServiceFormTab] = useState<
    "info" | "materials"
  >("info");

  // Inline Editing State
  const [editingCatalogService, setEditingCatalogService] = useState<
    string | null
  >(null);

  // Pagination
  const ITEMS_PER_PAGE = 10;
  const [servicesPage, setServicesPage] = useState(1);

  // Reset tab when opening a service
  React.useEffect(() => {
    if (editingServiceItem) {
      setServiceFormTab("info");
    }
  }, [editingServiceItem]);

  // Pagination Link Reset Logic
  React.useEffect(() => {
    setServicesPage(1);
  }, [catalogServices.length]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  // Memoized Paginated Data
  const paginatedServices = useMemo(() => {
    return catalogServices.slice(
      (servicesPage - 1) * ITEMS_PER_PAGE,
      servicesPage * ITEMS_PER_PAGE,
    );
  }, [catalogServices, servicesPage]);

  // Unified Material List for Search
  // 1. Unified Inventory Source
  const allMaterials = useMemo(() => {
    // Return inventoryItems directly, mapping to the expected format if needed
    // The previous logic combined chemicalProducts and consumables. 
    // Now we rely on inventoryItems which should contain everything.
    
    if (inventoryItems && inventoryItems.length > 0) {
      return inventoryItems.map((item) => {
        // Calculate unit cost safely if missing
        const calculatedUnitCost = item.unitCost || (item.purchasePrice && item.content ? item.purchasePrice / item.content : 0);
        
        return {
        id: item.id,
        name: item.name,
        type: "material" as const, // All items are materials now
        unit: item.unit,
        cost: calculatedUnitCost,
        // Helper for filtering
        _originalType: item.type
      };
      }).sort((a, b) => a.name.localeCompare(b.name));
    }

    return [];
  }, [inventoryItems]);

  // Unified Selected Items for Display
  const allSelectedItems = useMemo(() => {
    // Helper to find item details in inventoryItems or legacy lists
    // Helper to find item details in inventoryItems or legacy lists
    const findItemDetails = (id: string) => {
        // Try inventory first (check both new ID and original legacy ID)
        const invItem = inventoryItems.find(i => i.id === id || i.originalId === id);
        if (invItem) {
            const calculatedUnitCost = invItem.unitCost || (invItem.purchasePrice && invItem.content ? invItem.purchasePrice / invItem.content : 0);
            return {
                name: invItem.name,
                unit: invItem.unit,
                cost: calculatedUnitCost
            };
        }

        return {
            name: "Desconocido",
            unit: "uds",
            cost: 0
        };
    };

    const selectedMats = selectedMaterials.map((s) => {
      const details = findItemDetails(s.materialId);
      return {
        id: s.materialId,
        qty: s.qty,
        name: details.name,
        type: "material" as const, // ✅ Changed from chemical
        unit: details.unit,
        cost: details.cost * s.qty,
        unitCost: details.cost
      };
    });

    return selectedMats;
  }, [selectedMaterials, inventoryItems]);

  const totalEstimatedMaterialCost = useMemo(() => {
    const total = allSelectedItems.reduce((sum, item) => sum + (item.cost || 0), 0);
    return { total }; // ✅ Simplified - only total matters
  }, [allSelectedItems]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleSaveUnifiedService = async () => {
    if (!editingServiceItem) return;

    try {
      // 1. Validaciones
      const name = (editServiceForm.name || "").trim();
      if (!name) {
        showNotification("El nombre del servicio es obligatorio", "error");
        return;
      }

      // Check duplicados
      const duplicate = catalogServices.find(
        (s) =>
          s.name.trim().toLowerCase() === name.toLowerCase() &&
          s.id !== editingServiceItem.id &&
          s.id !== "new"
      );

      if (duplicate) {
        showNotification("Ya existe un servicio con este nombre", "error");
        return;
      }

      // Check negativos
      const price = Number(editServiceForm.basePrice) || 0;
      if (price <= 0) {
        showNotification("El precio base debe ser mayor a 0", "error");
        return;
      }

      if (editingServiceItem.id === "new") {
        // CREACIÓN
        const newId = await addCatalogService(
          name,
          price,
        );

        // Guardar materiales inmediatamente
        if (selectedMaterials.length > 0) {
          await updateCatalogService(newId, {
            manualMaterials: selectedMaterials,
          });
        }

        showNotification("Servicio creado exitosamente");
      } else {
        // EDICIÓN
        await updateCatalogService(editingServiceItem.id, {
          ...editServiceForm,
          name, // Asegurar que se guarde el nombre trimmeado
          basePrice: price,
          manualMaterials: selectedMaterials,
        });
        showNotification("Servicio actualizado exitosamente");
      }
      setEditingServiceItem(null);
    } catch (error) {
      console.error("Error guardando servicio:", error);
      const message =
        error instanceof Error ? error.message : "Error al guardar";
      showNotification(message, "error");
    }
  };

  const handleUpdateCatalogService = async (
    id: string,
    updated: Partial<CatalogService>,
  ) => {
    try {
      await updateCatalogService(id, updated);
      setEditingCatalogService(null);
      showNotification("Servicio actualizado");
    } catch (error) {
      console.error("Error actualizando servicio:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleToggleCatalogService = async (id: string, active: boolean) => {
    try {
      await updateCatalogService(id, { active: !active });
      showNotification(active ? "Servicio desactivado" : "Servicio activado");
    } catch (error) {
      console.error("Error actualizando servicio:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
  });

  const closeConfirmation = () =>
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

  const handleDeleteCatalogService = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Servicio",
      message:
        "¿Estás seguro de que deseas eliminar este servicio del catálogo? Esta acción no se puede deshacer.",
      isLoading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          await deleteCatalogService(id);
          showNotification("Servicio eliminado");
          closeConfirmation();
        } catch (error) {
          console.error("Error eliminando servicio:", error);
          showNotification("Error al eliminar", "error");
          setConfirmConfig((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleToggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) => {
      const exists = prev.some((m) => m.materialId === materialId);
      if (exists) {
        return prev.filter((m) => m.materialId !== materialId);
      } else {
        return [...prev, { materialId, qty: 0 }]; // Default 0 to force user input
      }
    });
  };

  const handleMaterialQtyChange = (materialId: string, qty: number) => {
    setSelectedMaterials((prev) =>
      prev.map((m) =>
        m.materialId === materialId ? { ...m, qty: Math.max(0, qty) } : m,
      ),
    );
  };



  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
          <ShoppingCart className="text-primary-600" />
          Catálogo de Servicios
        </h3>
        <button
          onClick={() => {
            setEditingServiceItem({
              id: "new",
              name: "",
              basePrice: 0,
              active: true,
              tenantId: "",
              createdAt: new Date().toISOString(),
            } as unknown as CatalogService);
            setEditServiceForm({});
            setSelectedMaterials([]);
            setMaterialSearch("");
          }}
          className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold p-2 md:px-4 md:py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95 w-auto"
        >
          <Plus size={18} />
          <span className="hidden md:inline-block ml-1">Nuevo Servicio</span>
        </button>
      </div>

      {/* Services Table */}
      <>
        <div className="bg-surface rounded-xl shadow-none border border-border overflow-hidden">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <table className="w-full">
              <thead className="bg-surface-highlight border-b border-border">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider whitespace-nowrap">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                    Precio Base
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                    Costo Material
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider whitespace-nowrap">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
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

                      // Calcular costo total de materiales y consumibles
                    // Helper logic to find cost in inventory or legacy
                    // Helper logic to find cost in inventory or legacy
                    const getRefCost = (id: string) => {
                        const invItem = inventoryItems.find(i => i.id === id || i.originalId === id);
                        if (invItem) {
                           return invItem.unitCost || (invItem.purchasePrice && invItem.content ? invItem.purchasePrice / invItem.content : 0);
                        }
                        return 0;
                    };

                    const materialsCost = (cs.manualMaterials || []).reduce(
                      (sum, m) => {
                        const id = typeof m === "string" ? m : m.materialId;
                        const qty = typeof m === "string" ? 1 : m.qty;
                        return sum + getRefCost(id) * qty;
                      },
                      0,
                    );


                    const totalMaterialCost = materialsCost; // ✅ Only materials now

                    return (
                      <tr
                        key={cs.id}
                        className={`group transition-colors duration-200 hover:bg-surface-highlight ${
                          !cs.active ? "opacity-60 bg-surface-highlight" : ""
                        }`}
                      >
                        <td className="w-4"></td>
                        {isEditing ? (
                          <>
                            <td className="px-6 py-4 min-w-[200px]">
                              <input
                                type="text"
                                defaultValue={cs.name}
                                id={`edit-service-name-${cs.id}`}
                                className="w-full px-4 py-2 bg-surface-highlight border border-border rounded-xl text-sm font-medium text-text-main transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                              />
                            </td>

                            <td className="px-6 py-4 min-w-[120px]">
                              <input
                                type="number"
                                step="0.01"
                                defaultValue={cs.basePrice}
                                id={`edit-service-price-${cs.id}`}
                                className="w-32 px-4 py-2 bg-surface-highlight border border-border rounded-xl text-sm font-bold text-text-main transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                              />
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-gray-400">-</span>
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                  cs.active
                                    ? "bg-primary-600/10 text-primary-600"
                                    : "bg-primary-700/10 text-primary-700"
                                }`}
                              >
                                {cs.active ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-6 py-4 flex items-center gap-2">
                              <button
                                onClick={() => {
                                  const name = (
                                    document.getElementById(
                                      `edit-service-name-${cs.id}`,
                                    ) as HTMLInputElement
                                  ).value;
                                  const basePrice = parseFloat(
                                    (
                                      document.getElementById(
                                        `edit-service-price-${cs.id}`,
                                      ) as HTMLInputElement
                                    ).value,
                                  );

                                  handleUpdateCatalogService(cs.id, {
                                    name,
                                    basePrice,
                                  });
                                }}
                                className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors shadow-sm"
                                title="Guardar"
                              >
                                <Save size={18} strokeWidth={2.5} />
                              </button>
                              <button
                                onClick={() => setEditingCatalogService(null)}
                                className="p-2 rounded-xl bg-surface-highlight text-gray-400 hover:bg-surface-highlight/80 transition-colors"
                                title="Cancelar"
                              >
                                <X size={18} strokeWidth={2.5} />
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-6 py-4 text-sm font-medium text-text-main min-w-[200px]">
                              <div className="flex items-center gap-2">
                                {cs.name}
                                {(cs.manualMaterials?.length ?? 0) > 0 ? (
                                  <div
                                    title="Configurado"
                                    className="text-emerald-500 bg-emerald-500/10 p-1 rounded-full"
                                  >
                                    <Beaker size={14} />
                                  </div>
                                ) : (
                                  <div
                                    title="Sin receta"
                                    className="text-orange-400 bg-orange-500/10 p-1 rounded-full"
                                  >
                                    <AlertTriangle size={14} />
                                  </div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-text-main font-mono min-w-[100px]">
                              ${cs.basePrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 min-w-[120px]">
                              {totalMaterialCost > 0 ? (
                                <div
                                  className="flex flex-col"
                                  title={`Costo Materiales: $${totalMaterialCost.toFixed(2)}`}
                                >
                                  <span className="text-sm font-bold text-text-muted">
                                    ${totalMaterialCost.toFixed(2)}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-6 py-4 min-w-[100px]">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm ${
                                  cs.active
                                    ? "bg-primary-600/10 text-primary-600 ring-1 ring-primary-600/20"
                                    : "bg-primary-700/10 text-primary-700 ring-1 ring-primary-700/20"
                                }`}
                              >
                                {cs.active ? "Activo" : "Inactivo"}
                              </span>
                            </td>
                            <td className="px-6 py-4 min-w-[150px]">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setEditingServiceItem(cs);
                                    setEditServiceForm(cs);
                                    setMaterialSearch("");


                                    // Tarea 1: Prioridad de Guardado (Admin) - MATERIALES
                                    // SI manualMaterials existe (incluso si está vacío), NO buscar en recetas antiguas

                                    if (
                                      cs.manualMaterials &&
                                      cs.manualMaterials.length > 0
                                    ) {
                                      // PRIORIDAD ALTA: Usar selección manual
                                      console.log(
                                        `⚠️ Usando selección manual (Prioridad Alta) para ${cs.name}`,
                                      );

                                      // Handle legacy string[] vs new objects
                                      const firstItem = cs.manualMaterials[0];
                                      if (typeof firstItem === "string") {
                                        setSelectedMaterials(
                                          (
                                            cs.manualMaterials as unknown as string[]
                                          ).map((id) => ({
                                            materialId: id,
                                            qty: 1,
                                          })),
                                        );
                                      } else {
                                        setSelectedMaterials(
                                          cs.manualMaterials as {
                                            materialId: string;
                                            qty: number;
                                          }[],
                                        );
                                      }
                                    } else {
                                      // Si no hay manualMaterials, inicializar vacío (Legacy eliminado)
                                      setSelectedMaterials([]);
                                    }


                                  }}
                                  className="p-2 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                  title="Editar"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handleToggleCatalogService(cs.id, cs.active)
                                  }
                                  className={`p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90`}
                                  title={cs.active ? "Desactivar" : "Activar"}
                                >
                                  {cs.active ? (
                                    <XCircle size={16} />
                                  ) : (
                                    <CheckCircle size={16} />
                                  )}
                                </button>
                                {/* SOLO OWNER */}
                                {currentUser?.role === "owner" && (
                                  <button
                                    onClick={() =>
                                      handleDeleteCatalogService(cs.id)
                                    }
                                    className="p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
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
        </div>

        {/* Catalog Operations Pagination */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-border mt-2">
          <div className="text-sm text-text-muted font-medium">
            Mostrando{" "}
            {Math.min(
              (servicesPage - 1) * ITEMS_PER_PAGE + 1,
              catalogServices.length,
            )}{" "}
            -{" "}
            {Math.min(servicesPage * ITEMS_PER_PAGE, catalogServices.length)}{" "}
            de {catalogServices.length} servicios
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
              disabled={servicesPage === 1}
              className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeft size={18} />
            </button>
            <span className="px-4 py-2 rounded-lg bg-primary-600 text-white font-bold shadow-sm shadow-primary-600/20">
              {servicesPage}
            </span>
            <button
              onClick={() =>
                setServicesPage((p) =>
                  p * ITEMS_PER_PAGE < catalogServices.length ? p + 1 : p,
                )
              }
              disabled={servicesPage * ITEMS_PER_PAGE >= catalogServices.length}
              className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </>

      {/* Slide-over Panel for Editing/Creating Services */}
      {editingServiceItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingServiceItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  {editingServiceItem.id === "new"
                    ? "Nuevo Servicio"
                    : "Editar Servicio"}
                </h3>
                <p className="text-sm text-text-muted">
                  {editingServiceItem.id === "new"
                    ? "Crear servicio en el catálogo"
                    : "Modificar servicio existente"}
                </p>
              </div>
              <button
                onClick={() => setEditingServiceItem(null)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex w-full max-w-full overflow-x-auto no-scrollbar gap-2 px-2 pb-2 items-center justify-start md:justify-center bg-surface border-b border-border">
              <button
                onClick={() => setServiceFormTab("info")}
                className={`px-3 py-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all ${
                  serviceFormTab === "info"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "text-text-muted hover:bg-surface-highlight"
                }`}
              >
                Información
              </button>
              <button
                onClick={() => setServiceFormTab("materials")}
                className={`px-3 py-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  serviceFormTab === "materials"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "text-text-muted hover:bg-surface-highlight"
                }`}
              >
                <Beaker size={16} />
                Materiales
                {allSelectedItems.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {allSelectedItems.length}
                  </span>
                )}
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Tab: INFO */}
              {serviceFormTab === "info" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Nombre del Servicio
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Manicure Básico, Pedicure Spa"
                      value={editServiceForm.name || ""}
                      onChange={(e) =>
                        setEditServiceForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>



                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Precio Base
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editServiceForm.basePrice ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditServiceForm((prev) => ({
                            ...prev,
                            basePrice: val === "" ? 0 : parseFloat(val),
                          }));
                        }}
                        className="w-full pl-8 pr-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-semibold"
                      />
                    </div>
                  </div>

                  {/* Cost Summary */}
                  <div className="p-4 bg-primary-600/10 rounded-xl border border-primary-600/20 space-y-2">
                    <h4 className="font-bold text-text-main text-sm">
                      Resumen de Costos
                    </h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="pt-2">
                        <span className="text-text-muted">
                          Costo Total Materiales:
                        </span>
                        <span className="float-right font-bold text-primary-600 text-lg">
                          ${totalEstimatedMaterialCost.total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Status Toggle */}
                  <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl border border-border">
                    <div>
                      <span className="block font-semibold text-text-main">
                        Estado del Servicio
                      </span>
                      <span className="text-xs text-text-muted">
                        Visible en el catálogo de ventas
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setEditServiceForm((prev) => ({
                          ...prev,
                          active: !prev.active,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editServiceForm.active !== false
                          ? "bg-primary-600"
                          : "bg-primary-700/50"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editServiceForm.active !== false
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: MATERIALS (Unified) */}
              {serviceFormTab === "materials" && (
                <div className="space-y-6">
                  {/* Search Interface */}
                  <div className="space-y-2 relative">
                    <label className="text-sm font-medium text-text-muted">
                      Buscar Material
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar químico o consumible..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none shadow-sm"
                      />
                      <div className="absolute left-3 top-3.5 text-gray-400">
                        <Plus size={18} />
                      </div>
                    </div>

                    {/* Dropdown Results */}
                    {materialSearch.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-xl shadow-xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {allMaterials
                          .filter((m) =>
                            m.name
                              .toLowerCase()
                              .includes(materialSearch.toLowerCase()),
                          )
                          .slice(0, 5) // Limit to 5 results
                          .map((material) => (
                            <button
                              key={`${material.type}-${material.id}`}
                              onClick={() => {
                                handleToggleMaterial(material.id);
                                setMaterialSearch(""); // Clear search after selection
                              }}
                              className="flex items-center justify-between px-4 py-2 text-sm hover:bg-surface-highlight transition-colors group cursor-pointer border-b border-border last:border-0"
                            >
                              <div>
                                <p className="font-medium text-text-main group-hover:text-primary-600 transition-colors">
                                  {material.name}
                                </p>
                                <p className="text-xs text-text-muted">
                                  ${material.cost.toFixed(3)} /{" "}
                                  {material.unit}
                                </p>
                              </div>
                              <Plus
                                size={16}
                                className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              />
                            </button>
                          ))}
                        {allMaterials.filter((m) =>
                          m.name
                            .toLowerCase()
                            .includes(materialSearch.toLowerCase()),
                        ).length === 0 && (
                          <div className="px-4 py-3 text-sm text-text-muted text-center">
                            No se encontraron materiales
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Selected Items List */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-text-main flex items-center justify-between">
                      <span>Materiales Seleccionados</span>
                      <span className="text-xs font-normal text-text-muted bg-surface-highlight px-2 py-1 rounded-full">
                        {allSelectedItems.length} items
                      </span>
                    </h4>

                    {allSelectedItems.length === 0 ? (
                      <div className="text-center py-8 border-2 border-dashed border-border rounded-xl bg-surface-highlight/30">
                        <Beaker
                          size={32}
                          className="mx-auto text-text-muted/50 mb-2"
                        />
                        <p className="text-sm text-text-muted">
                          No hay materiales seleccionados
                        </p>
                        <p className="text-xs text-text-muted/70 mt-1">
                          Usa el buscador para agregar productos
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {allSelectedItems.map((item) => (
                          <div
                            key={`${item.type}-${item.id}`}
                            className="flex items-center gap-3 p-3 bg-surface border border-border rounded-xl shadow-sm hover:border-primary-500/30 transition-all group"
                          >
                            <div
                              className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                            >
                              <Package size={18} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-text-main text-sm truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-text-muted">
                                Costo: ${item.cost.toFixed(2)}
                              </p>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="flex items-center bg-surface-highlight rounded-lg border border-border">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.1"
                                  value={item.qty}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleMaterialQtyChange(item.id, val);
                                  }}
                                  className="w-16 px-2 py-1 text-sm bg-transparent text-center focus:outline-none font-medium"
                                />
                                <span className="pr-2 text-xs text-text-muted border-l border-border pl-2 py-1 bg-surface-highlight rounded-r-lg">
                                  {item.unit}
                                </span>
                              </div>

                              <button
                                onClick={() => handleToggleMaterial(item.id)}
                                className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Cost Summary Footer */}
                  {allSelectedItems.length > 0 && (
                    <div className="p-4 bg-surface-highlight rounded-xl border border-border flex justify-between items-center">
                      <span className="text-sm font-medium text-text-muted">
                        Costo Total Estimado
                      </span>
                      <span className="text-lg font-bold text-primary-600">
                        ${totalEstimatedMaterialCost.total.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setEditingServiceItem(null)}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUnifiedService}
                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                {editingServiceItem.id === "new"
                  ? "Crear Servicio"
                  : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isLoading={confirmConfig.isLoading}
      />
    </div>
  );
};
