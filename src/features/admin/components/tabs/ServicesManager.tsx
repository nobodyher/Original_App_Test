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
} from "lucide-react";
import type {
  CatalogService,
  MaterialRecipe,
  ServiceRecipe,
  Consumable,
  ChemicalProduct,
  Toast,
  AppUser,
} from "../../../../types";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ServicesManagerProps {
  // Data
  catalogServices: CatalogService[];
  materialRecipes: MaterialRecipe[];
  serviceRecipes: ServiceRecipe[];
  consumables: Consumable[];
  chemicalProducts: ChemicalProduct[];
  currentUser: AppUser | null;

  // Actions
  addCatalogService: (
    name: string,
    category: "manicura" | "pedicura",
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
  materialRecipes,
  serviceRecipes,
  consumables,
  chemicalProducts,
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
  const [selectedConsumables, setSelectedConsumables] = useState<
    { consumableId: string; qty: number }[]
  >([]);

  // Search States for Service Editor
  const [materialSearch, setMaterialSearch] = useState("");
  const [consumableSearch, setConsumableSearch] = useState("");

  // Service Form Tabs
  const [serviceFormTab, setServiceFormTab] = useState<
    "info" | "chemicals" | "consumables"
  >("info");

  // Inline Editing State
  const [editingCatalogService, setEditingCatalogService] = useState<
    string | null
  >(null);

  // Pagination
  const ITEMS_PER_PAGE = 7;
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

  // Dynamic Cost Calculation for Service Editing
  const totalEstimatedMaterialCost = useMemo(() => {
    // 1. Chemicals Cost
    const chemicalsCost = selectedMaterials.reduce((total, item) => {
      const chem = chemicalProducts.find((c) => c.id === item.materialId);
      if (!chem) return total;

      // Formula: (Price / PackageQty) * UsageQty
      const unitCost = (chem.purchasePrice || 0) / (chem.quantity || 1);
      return total + unitCost * item.qty;
    }, 0);

    // 2. Consumables Cost
    const consumablesCost = selectedConsumables.reduce((total, item) => {
      const cons = consumables.find((c) => c.id === item.consumableId);
      if (!cons) return total;

      const unitCost =
        cons.purchasePrice && cons.packageSize
          ? cons.purchasePrice / cons.packageSize
          : cons.unitCost || 0;

      return total + unitCost * item.qty;
    }, 0);

    return {
      chemicals: chemicalsCost,
      consumables: consumablesCost,
      total: chemicalsCost + consumablesCost,
    };
  }, [selectedMaterials, selectedConsumables, chemicalProducts, consumables]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleSaveUnifiedService = async () => {
    if (!editingServiceItem) return;

    try {
      if (editingServiceItem.id === "new") {
        // CREACIÓN
        const newId = await addCatalogService(
          editServiceForm.name || "",
          editServiceForm.category || "manicura",
          editServiceForm.basePrice ? Number(editServiceForm.basePrice) : 0,
        );

        // Guardar materiales inmediatamente
        if (selectedMaterials.length > 0 || selectedConsumables.length > 0) {
          await updateCatalogService(newId, {
            manualMaterials: selectedMaterials,
            manualConsumables: selectedConsumables,
          });
        }

        showNotification("Servicio creado exitosamente");
      } else {
        // EDICIÓN
        await updateCatalogService(editingServiceItem.id, {
          ...editServiceForm,
          manualMaterials: selectedMaterials,
          manualConsumables: selectedConsumables,
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

  const handleDeleteCatalogService = async (id: string) => {
    try {
      await deleteCatalogService(id);
      showNotification("Servicio eliminado");
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      showNotification("Error al eliminar", "error");
    }
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

  const handleToggleConsumable = (consumableId: string) => {
    setSelectedConsumables((prev) => {
      const exists = prev.some((c) => c.consumableId === consumableId);
      if (exists) {
        return prev.filter((c) => c.consumableId !== consumableId);
      } else {
        return [...prev, { consumableId, qty: 1 }];
      }
    });
  };

  const handleConsumableQtyChange = (consumableId: string, qty: number) => {
    setSelectedConsumables((prev) =>
      prev.map((c) =>
        c.consumableId === consumableId ? { ...c, qty: Math.max(1, qty) } : c,
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
              category: "general" as any,
              basePrice: 0,
              active: true,
              createdAt: new Date().toISOString(),
            } as unknown as CatalogService);
            setEditServiceForm({ category: "general" as any });
            setSelectedMaterials([]);
            setSelectedConsumables([]);
            setMaterialSearch("");
            setConsumableSearch("");
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
                    Categoría
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
                    const materialsCost = (cs.manualMaterials || []).reduce(
                      (sum, m) => {
                        const id = typeof m === "string" ? m : m.materialId;
                        const qty = typeof m === "string" ? 1 : m.qty;
                        const p = chemicalProducts.find((cp) => cp.id === id);
                        return sum + (p?.costPerService || 0) * qty;
                      },
                      0,
                    );

                    const consumablesCost = (cs.manualConsumables || []).reduce(
                      (sum, c) => {
                        const item = consumables.find(
                          (i) => i.id === c.consumableId,
                        );
                        if (!item) return sum;
                        const uCost =
                          item.purchasePrice && item.packageSize
                            ? item.purchasePrice / item.packageSize
                            : item.unitCost || 0;
                        return sum + uCost * c.qty;
                      },
                      0,
                    );

                    const totalMaterialCost = materialsCost + consumablesCost;

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
                            <td className="px-6 py-4 min-w-[150px]">
                              <span className="text-sm text-text-muted capitalize">
                                {cs.category}
                              </span>
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
                                    const category = cs.category || "general";
                                  const basePrice = parseFloat(
                                    (
                                      document.getElementById(
                                        `edit-service-price-${cs.id}`,
                                      ) as HTMLInputElement
                                    ).value,
                                  );

                                  handleUpdateCatalogService(cs.id, {
                                    name,
                                    category,
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
                                {(cs.manualMaterials?.length ?? 0) > 0 ||
                                (cs.manualConsumables?.length ?? 0) > 0 ? (
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
                            <td className="px-6 py-4 text-sm text-text-muted capitalize tracking-wide min-w-[120px]">
                              {cs.category}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold text-text-main font-mono min-w-[100px]">
                              ${cs.basePrice.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 min-w-[120px]">
                              {totalMaterialCost > 0 ? (
                                <div
                                  className="flex flex-col"
                                  title={`Químicos: $${materialsCost.toFixed(2)} | Desechables: $${consumablesCost.toFixed(2)}`}
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
                                    setConsumableSearch("");

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
                                      // FALLBACK: Solo si NO existe manualMaterials, buscar en recetas antiguas
                                      console.log(
                                        `🔍 Cargando desde recetas antiguas para ${cs.name}`,
                                      );

                                      const legacyRecipe = materialRecipes.find(
                                        (r) =>
                                          r.serviceId === cs.id ||
                                          r.serviceName.toLowerCase() ===
                                            cs.name.toLowerCase(),
                                      );

                                      const legacyMaterialIds: string[] = [];

                                      if (legacyRecipe) {
                                        for (const chemicalIdOrName of legacyRecipe.chemicalIds) {
                                          // Primero intentar encontrar por ID exacto
                                          let matchedProduct =
                                            chemicalProducts.find(
                                              (p) => p.id === chemicalIdOrName,
                                            );

                                          // Si no se encuentra por ID, buscar por nombre normalizado
                                          if (!matchedProduct) {
                                            const normalizedSearch =
                                              chemicalIdOrName
                                                .toLowerCase()
                                                .replace(/_/g, " ")
                                                .trim();
                                            matchedProduct =
                                              chemicalProducts.find((p) => {
                                                const normalizedProductName = p.name
                                                  .toLowerCase()
                                                  .replace(/_/g, " ")
                                                  .trim();
                                                return (
                                                  normalizedProductName ===
                                                    normalizedSearch ||
                                                  normalizedProductName.includes(
                                                    normalizedSearch,
                                                  ) ||
                                                  normalizedSearch.includes(
                                                    normalizedProductName,
                                                  )
                                                );
                                              });
                                          }

                                          // Si encontramos coincidencia, agregar el ID del producto
                                          if (matchedProduct) {
                                            legacyMaterialIds.push(
                                              matchedProduct.id,
                                            );
                                          }
                                        }
                                      }

                                      setSelectedMaterials(
                                        legacyMaterialIds.map((id) => ({
                                          materialId: id,
                                          qty: 1,
                                        })),
                                      );
                                    }

                                    // CONSUMIBLES - Aplicar misma lógica de prioridad
                                    if (
                                      cs.manualConsumables !== undefined &&
                                      cs.manualConsumables !== null
                                    ) {
                                      // PRIORIDAD ALTA: Usar selección manual
                                      console.log(
                                        `⚠️ Usando consumibles manuales (Prioridad Alta) para ${cs.name}`,
                                      );
                                      setSelectedConsumables(
                                        cs.manualConsumables,
                                      );
                                    } else {
                                      // FALLBACK: Buscar en serviceRecipes
                                      console.log(
                                        `🔍 Cargando consumibles desde recetas para ${cs.name}`,
                                      );
                                      console.log(
                                        `   Buscando por cs.id: "${cs.id}"`,
                                      );
                                      console.log(
                                        `   Buscando por cs.name: "${cs.name}"`,
                                      );
                                      console.log(
                                        `   IDs disponibles en serviceRecipes:`,
                                        serviceRecipes.map((r) => r.id),
                                      );

                                      // Buscar por el ID del documento (que es el nombre del servicio o ID del catálogo)
                                      const serviceRecipe = serviceRecipes.find(
                                        (r: ServiceRecipe) =>
                                          r.id === cs.id || r.id === cs.name,
                                      );

                                      if (serviceRecipe) {
                                        console.log(
                                          `✅ Receta encontrada por ID de documento: ${serviceRecipe.id}`,
                                        );
                                        console.log(
                                          `   Items a cargar: ${serviceRecipe.items.length} consumibles`,
                                        );
                                        setSelectedConsumables(
                                          serviceRecipe.items,
                                        );
                                      } else {
                                        console.log(
                                          `❌ No se encontró receta para "${cs.name}"`,
                                        );
                                        console.log(
                                          `   Ningún ID coincide con "${cs.id}" ni con "${cs.name}"`,
                                        );
                                        setSelectedConsumables([]);
                                      }
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
                onClick={() => setServiceFormTab("chemicals")}
                className={`px-3 py-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  serviceFormTab === "chemicals"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "text-text-muted hover:bg-surface-highlight"
                }`}
              >
                <Beaker size={16} />
                Químicos
                {selectedMaterials.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {selectedMaterials.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setServiceFormTab("consumables")}
                className={`px-3 py-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  serviceFormTab === "consumables"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "text-text-muted hover:bg-surface-highlight"
                }`}
              >
                Consumibles
                {selectedConsumables.length > 0 && (
                  <span className="px-1.5 py-0.5 bg-white/20 rounded-full text-xs font-bold">
                    {selectedConsumables.length}
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
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-text-muted">Químicos:</span>
                        <span className="float-right font-bold text-text-main">
                          ${totalEstimatedMaterialCost.chemicals.toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-text-muted">Consumibles:</span>
                        <span className="float-right font-bold text-text-main">
                          ${totalEstimatedMaterialCost.consumables.toFixed(2)}
                        </span>
                      </div>
                      <div className="col-span-2 pt-2 border-t border-border">
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

              {/* Tab: CHEMICALS */}
              {serviceFormTab === "chemicals" && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Buscar Químico
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={materialSearch}
                      onChange={(e) => setMaterialSearch(e.target.value)}
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>

                  {/* List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {chemicalProducts
                      .filter((p) =>
                        p.name
                          .toLowerCase()
                          .includes(materialSearch.toLowerCase()),
                      )
                      .map((product) => {
                        const isSelected = selectedMaterials.some(
                          (m) => m.materialId === product.id,
                        );
                        const selectedItem = selectedMaterials.find(
                          (m) => m.materialId === product.id,
                        );

                        return (
                          <div
                            key={product.id}
                            className={`p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-primary-600/10 border-primary-600/30"
                                : "bg-surface-highlight border-border hover:border-primary-600/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    handleToggleMaterial(product.id)
                                  }
                                  className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-text-main text-sm">
                                    {product.name}
                                  </p>
                                  <p className="text-xs text-text-muted">
                                    ${product.costPerService.toFixed(3)} por{" "}
                                    {product.unit}
                                  </p>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={selectedItem?.qty ?? 0}
                                    onChange={(e) =>
                                      handleMaterialQtyChange(
                                        product.id,
                                        parseFloat(e.target.value) || 0,
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-20 px-2 py-1 text-sm bg-surface border border-border rounded text-text-main focus:ring-2 focus:ring-primary-500 outline-none"
                                  />
                                  <span className="text-xs text-text-muted">
                                    {product.unit}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Selected Summary */}
                  {selectedMaterials.length > 0 && (
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <p className="text-sm font-bold text-emerald-600">
                        {selectedMaterials.length} químico(s) seleccionado(s)
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Costo total: $
                        {totalEstimatedMaterialCost.chemicals.toFixed(2)}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: CONSUMABLES */}
              {serviceFormTab === "consumables" && (
                <div className="space-y-4">
                  {/* Search */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Buscar Consumible
                    </label>
                    <input
                      type="text"
                      placeholder="Buscar por nombre..."
                      value={consumableSearch}
                      onChange={(e) => setConsumableSearch(e.target.value)}
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>

                  {/* List */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {consumables
                      .filter((c) =>
                        c.name
                          .toLowerCase()
                          .includes(consumableSearch.toLowerCase()),
                      )
                      .map((consumable) => {
                        const isSelected = selectedConsumables.some(
                          (c) => c.consumableId === consumable.id,
                        );
                        const selectedItem = selectedConsumables.find(
                          (c) => c.consumableId === consumable.id,
                        );

                        const unitCost =
                          consumable.purchasePrice && consumable.packageSize
                            ? consumable.purchasePrice / consumable.packageSize
                            : consumable.unitCost || 0;

                        return (
                          <div
                            key={consumable.id}
                            className={`p-3 rounded-lg border transition-all ${
                              isSelected
                                ? "bg-primary-600/10 border-primary-600/30"
                                : "bg-surface-highlight border-border hover:border-primary-600/20"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3 flex-1">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() =>
                                    handleToggleConsumable(consumable.id)
                                  }
                                  className="w-4 h-4 rounded border-border text-primary-600 focus:ring-primary-500"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-text-main text-sm">
                                    {consumable.name}
                                  </p>
                                  <p className="text-xs text-text-muted">
                                    ${unitCost.toFixed(3)} por{" "}
                                    {consumable.unit}
                                  </p>
                                </div>
                              </div>

                              {isSelected && (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="number"
                                    min="1"
                                    step="1"
                                    value={selectedItem?.qty ?? 1}
                                    onChange={(e) =>
                                      handleConsumableQtyChange(
                                        consumable.id,
                                        parseInt(e.target.value) || 1,
                                      )
                                    }
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-20 px-2 py-1 text-sm bg-surface border border-border rounded text-text-main focus:ring-2 focus:ring-primary-500 outline-none"
                                  />
                                  <span className="text-xs text-text-muted">
                                    uds.
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                  </div>

                  {/* Selected Summary */}
                  {selectedConsumables.length > 0 && (
                    <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                      <p className="text-sm font-bold text-emerald-600">
                        {selectedConsumables.length} consumible(s)
                        seleccionado(s)
                      </p>
                      <p className="text-xs text-text-muted mt-1">
                        Costo total: $
                        {totalEstimatedMaterialCost.consumables.toFixed(2)}
                      </p>
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
    </div>
  );
};
