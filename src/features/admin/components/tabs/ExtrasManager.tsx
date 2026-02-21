import React, { useState, useMemo, useEffect } from "react";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Beaker,
  AlertTriangle,
  Package,
} from "lucide-react";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import type { CatalogExtra, Toast, AppUser, InventoryItem } from "../../../../types";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ExtrasManagerProps {
  // Data
  catalogExtras: CatalogExtra[];
  inventoryItems?: InventoryItem[];
  currentUser: AppUser | null;

  // Actions
  addExtra: (name: string, price: number) => Promise<string>;
  updateExtra: (id: string, updates: Partial<CatalogExtra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;
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

export const ExtrasManager: React.FC<ExtrasManagerProps> = ({
  catalogExtras,
  inventoryItems = [],
  currentUser,
  addExtra,
  updateExtra,
  deleteExtra,
  showNotification,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Edit Extra State (Slide-over)
  const [editingExtraItem, setEditingExtraItem] = useState<CatalogExtra | null>(
    null,
  );
  const [editExtraForm, setEditExtraForm] = useState<Partial<CatalogExtra>>({});
  const [selectedMaterials, setSelectedMaterials] = useState<
    { materialId: string; qty: number }[]
  >([]);

  // Search States for Extra Editor
  const [materialSearch, setMaterialSearch] = useState("");
  const [isMaterialDropdownOpen, setIsMaterialDropdownOpen] = useState(false);
  const materialDropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        materialDropdownRef.current &&
        !materialDropdownRef.current.contains(event.target as Node)
      ) {
        setIsMaterialDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Extra Form Tabs
  const [extraFormTab, setExtraFormTab] = useState<
    "info" | "materials"
  >("info");

  // Pagination
  const ITEMS_PER_PAGE = 7;
  const [extrasPage, setExtrasPage] = useState(1);

  // Reset tab when opening an extra
  useEffect(() => {
    if (editingExtraItem) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setExtraFormTab("info");
    }
  }, [editingExtraItem]);

  // Pagination Link Reset Logic
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setExtrasPage(1);
  }, [catalogExtras.length]);

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const paginatedExtras = useMemo(() => {
    return catalogExtras.slice(
      (extrasPage - 1) * ITEMS_PER_PAGE,
      extrasPage * ITEMS_PER_PAGE,
    );
  }, [catalogExtras, extrasPage]);

  const totalPages = Math.ceil(catalogExtras.length / ITEMS_PER_PAGE);

  // Unified Material List for Search
  const allMaterials = useMemo(() => {
    if (inventoryItems && inventoryItems.length > 0) {
      return inventoryItems.map((item) => {
        const calculatedUnitCost =
          item.unitCost ||
          (item.purchasePrice && item.content
            ? item.purchasePrice / item.content
            : 0);

        return {
          id: item.id,
          name: item.name,
          type: "material" as const,
          unit: item.unit,
          cost: calculatedUnitCost,
          _originalType: item.type,
        };
      }).sort((a, b) => a.name.localeCompare(b.name));
    }
    return [];
  }, [inventoryItems]);

  // Unified Selected Items for Display
  const allSelectedItems = useMemo(() => {
    const findItemDetails = (id: string) => {
      const invItem = inventoryItems.find(
        (i) => i.id === id || i.originalId === id,
      );
      if (invItem) {
        const calculatedUnitCost =
          invItem.unitCost ||
          (invItem.purchasePrice && invItem.content
            ? invItem.purchasePrice / invItem.content
            : 0);
        return {
          name: invItem.name,
          unit: invItem.unit,
          cost: calculatedUnitCost,
        };
      }

      return {
        name: "Desconocido",
        unit: "uds",
        cost: 0,
      };
    };

    return selectedMaterials.map((s) => {
      const details = findItemDetails(s.materialId);
      return {
        id: s.materialId,
        qty: s.qty,
        name: details.name,
        type: "material" as const,
        unit: details.unit,
        cost: details.cost * s.qty,
        unitCost: details.cost,
      };
    });
  }, [selectedMaterials, inventoryItems]);

  const totalEstimatedMaterialCost = useMemo(() => {
    const total = allSelectedItems.reduce(
      (sum, item) => sum + (item.cost || 0),
      0,
    );
    return { total };
  }, [allSelectedItems]);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleSaveUnifiedExtra = async () => {
    if (!editingExtraItem) return;

    try {
      const name = (editExtraForm.name || "").trim();
      if (!name) {
        showNotification("El nombre del extra es obligatorio", "error");
        return;
      }

      const duplicate = catalogExtras.find(
        (s) =>
          s.name.trim().toLowerCase() === name.toLowerCase() &&
          s.id !== editingExtraItem.id &&
          s.id !== "new"
      );

      if (duplicate) {
        showNotification("Ya existe un extra con este nombre", "error");
        return;
      }

      const price = Number(editExtraForm.price) || 0;
      if (price < 0) {
        showNotification("El precio debe ser 0 o mayor", "error");
        return;
      }

      if (editingExtraItem.id === "new") {
        const newId = await addExtra(name, price);

        if (selectedMaterials.length > 0) {
          await updateExtra(newId, {
            manualMaterials: selectedMaterials,
          });
        }

        showNotification("Extra agregado exitosamente");
      } else {
        await updateExtra(editingExtraItem.id, {
          ...editExtraForm,
          name,
          price,
          manualMaterials: selectedMaterials,
        });
        showNotification("Extra actualizado exitosamente");
      }
      setEditingExtraItem(null);
    } catch (error) {
      console.error("Error guardando extra:", error);
      const message =
        error instanceof Error ? error.message : "Error al guardar";
      showNotification(message, "error");
    }
  };

  const handleToggleExtraStatus = async (id: string, active: boolean) => {
    try {
      await updateExtra(id, { active: !active });
      showNotification(active ? "Extra desactivado" : "Extra activado");
    } catch (error) {
      console.error("Error actualizando extra:", error);
      showNotification("Error al actualizar", "error");
    }
  };

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

  const handleDeleteExtra = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Extra",
      message:
        "¿Estás seguro de que deseas eliminar este servicio extra? Esta acción no se puede deshacer.",
      isLoading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          await deleteExtra(id);
          showNotification("Extra eliminado");
          closeConfirmation();
        } catch (error) {
          console.error("Error eliminando extra:", error);
          showNotification("Error al eliminar", "error");
          setConfirmConfig((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };

  const handleAddMaterial = (materialId: string) => {
    setSelectedMaterials((prev) => {
      const exists = prev.some((m) => m.materialId === materialId);
      if (exists) return prev; // Do nothing if already exists
      return [...prev, { materialId, qty: 0 }];
    });
  };

  const handleRemoveMaterial = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.filter((m) => m.materialId !== materialId)
    );
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
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header & Add Button */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
          <Plus className="text-primary-600" />
          Extras Adicionales
        </h3>
        <button
          onClick={() => {
            setEditingExtraItem({
              id: "new",
              name: "",
              price: 0,
              active: true,
              tenantId: "",
              createdAt: new Date().toISOString(),
            } as unknown as CatalogExtra);
            setEditExtraForm({ price: 0 });
            setSelectedMaterials([]);
            setMaterialSearch("");
          }}
          className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold p-2 md:px-4 md:py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95 w-auto"
        >
          <Plus size={18} />
          <span className="hidden md:inline-block ml-1">Nuevo Extra</span>
        </button>
      </div>

      {/* Extras Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-highlight">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Nombre
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Precio
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Costo Material
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {paginatedExtras.length === 0 ? (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Plus}
                      title="No hay extras"
                      message="Crea el primer extra usando el botón superior."
                    />
                  </td>
                </tr>
              ) : (
                paginatedExtras.map((extra) => {
                  const getRefCost = (id: string) => {
                    const invItem = inventoryItems.find(
                      (i) => i.id === id || i.originalId === id,
                    );
                    if (invItem) {
                      return (
                        invItem.unitCost ||
                        (invItem.purchasePrice && invItem.content
                          ? invItem.purchasePrice / invItem.content
                          : 0)
                      );
                    }
                    return 0;
                  };

                  const materialsCost = (extra.manualMaterials || []).reduce(
                    (sum, m) => sum + getRefCost(m.materialId) * m.qty,
                    0,
                  );

                  return (
                    <tr
                      key={extra.id}
                      className={`group transition-colors duration-200 hover:bg-surface-highlight ${
                        !extra.active ? "opacity-60 bg-surface-highlight" : ""
                      }`}
                    >
                      {/* Name */}
                      <td className="px-6 py-4 text-sm font-medium text-text-main min-w-[200px]">
                        <div className="flex items-center gap-2">
                          {extra.name}
                          {(extra.manualMaterials?.length ?? 0) > 0 ? (
                            <div
                              title="Configurado con Materiales"
                              className="text-emerald-500 bg-emerald-500/10 p-1 rounded-full"
                            >
                              <Beaker size={14} />
                            </div>
                          ) : (
                            <div
                              title="Sin receta de materiales"
                              className="text-orange-400 bg-orange-500/10 p-1 rounded-full"
                            >
                              <AlertTriangle size={14} />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Price */}
                      <td className="px-6 py-4">
                        <p className="font-bold text-primary-600">
                          ${(extra.price || 0).toFixed(2)}
                        </p>
                      </td>

                      {/* Cost */}
                      <td className="px-6 py-4 min-w-[120px]">
                        {materialsCost > 0 ? (
                          <div
                            className="flex flex-col"
                            title={`Costo Materiales: $${materialsCost.toFixed(2)}`}
                          >
                            <span className="text-sm font-bold text-text-muted">
                              ${materialsCost.toFixed(2)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm ${
                            extra.active
                              ? "bg-primary-600/10 text-primary-600 ring-1 ring-primary-600/20"
                              : "bg-primary-700/10 text-primary-700 ring-1 ring-primary-700/20"
                          }`}
                        >
                          {extra.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setEditingExtraItem(extra);
                              setEditExtraForm(extra);
                              setMaterialSearch("");

                              if (
                                extra.manualMaterials &&
                                extra.manualMaterials.length > 0
                              ) {
                                setSelectedMaterials(extra.manualMaterials);
                              } else {
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
                              handleToggleExtraStatus(extra.id, extra.active !== false)
                            }
                            className={`p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90`}
                            title={extra.active ? "Desactivar" : "Activar"}
                          >
                            {extra.active !== false ? (
                              <XCircle size={16} />
                            ) : (
                              <CheckCircle size={16} />
                            )}
                          </button>

                          {currentUser?.role === "owner" && (
                            <button
                              onClick={() => handleDeleteExtra(extra.id)}
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
          <div className="flex justify-between items-center px-4 py-3 border-t border-border mt-2 bg-surface-highlight">
            <p className="text-sm text-text-muted font-medium">
              Página {extrasPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setExtrasPage((p) => Math.max(1, p - 1))}
                disabled={extrasPage === 1}
                className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setExtrasPage((p) => Math.min(totalPages, p + 1))}
                disabled={extrasPage === totalPages}
                className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Extra Slide-over Panel */}
      {editingExtraItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingExtraItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  {editingExtraItem.id === "new"
                    ? "Nuevo Extra"
                    : "Editar Extra"}
                </h3>
                <p className="text-sm text-text-muted">
                  {editingExtraItem.id === "new"
                    ? "Crear servicio extra adicional"
                    : "Modificar extra existente"}
                </p>
              </div>
              <button
                onClick={() => setEditingExtraItem(null)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex w-full max-w-full overflow-x-auto no-scrollbar gap-2 px-2 pb-2 items-center justify-start md:justify-center bg-surface border-b border-border">
              <button
                onClick={() => setExtraFormTab("info")}
                className={`px-3 py-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all ${
                  extraFormTab === "info"
                    ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                    : "text-text-muted hover:bg-surface-highlight"
                }`}
              >
                Información
              </button>
              <button
                onClick={() => setExtraFormTab("materials")}
                className={`px-3 py-2 whitespace-nowrap rounded-lg font-medium text-sm transition-all flex items-center gap-2 ${
                  extraFormTab === "materials"
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
              {extraFormTab === "info" && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Nombre del Extra
                    </label>
                    <input
                      type="text"
                      placeholder="ej. Diseño de Uñas"
                      value={editExtraForm.name || ""}
                      onChange={(e) =>
                        setEditExtraForm((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Precio Adicional
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
                        value={editExtraForm.price ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditExtraForm((prev) => ({
                            ...prev,
                            price: val === "" ? 0 : parseFloat(val),
                          }));
                        }}
                        className="w-full pl-10 pr-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-semibold"
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
                        Estado del Extra
                      </span>
                      <span className="text-xs text-text-muted">
                        Visible al crear nueva venta
                      </span>
                    </div>
                    <button
                      onClick={() =>
                        setEditExtraForm((prev) => ({
                          ...prev,
                          active: !prev.active,
                        }))
                      }
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editExtraForm.active !== false
                          ? "bg-primary-600"
                          : "bg-primary-700/50"
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editExtraForm.active !== false
                            ? "translate-x-6"
                            : "translate-x-1"
                        }`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Tab: MATERIALS */}
              {extraFormTab === "materials" && (
                <div className="space-y-6">
                  {/* Search Interface */}
                  <div className="space-y-2 relative" ref={materialDropdownRef}>
                    <label className="text-sm font-medium text-text-muted">
                      Buscar Material
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Buscar material..."
                        value={materialSearch}
                        onFocus={() => setIsMaterialDropdownOpen(true)}
                        onChange={(e) => {
                          setMaterialSearch(e.target.value);
                          setIsMaterialDropdownOpen(true);
                        }}
                        className="w-full pl-10 pr-4 py-3 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none shadow-sm"
                      />
                      <div className="absolute left-3 top-3.5 text-gray-400">
                        <Plus size={18} />
                      </div>
                    </div>

                    {/* Dropdown Results */}
                    {isMaterialDropdownOpen && (
                      <div className="absolute z-10 w-full mt-1 bg-surface border border-border rounded-xl shadow-xl max-h-48 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        {allMaterials
                          .filter((m) =>
                            m.name
                              .toLowerCase()
                              .includes(materialSearch.toLowerCase()),
                          )
                          .map((material) => {
                            const isSelected = selectedMaterials.some(
                              (m) => m.materialId === material.id,
                            );

                            return (
                              <button
                                key={`${material.type}-${material.id}`}
                                onClick={() => {
                                  if (!isSelected) {
                                    handleAddMaterial(material.id);
                                    setMaterialSearch("");
                                    setIsMaterialDropdownOpen(false);
                                  }
                                }}
                                className={`flex items-center justify-between px-4 py-2 text-sm transition-colors group border-b border-border last:border-0 w-full ${
                                  isSelected
                                    ? "bg-surface-highlight cursor-default"
                                    : "hover:bg-surface-highlight cursor-pointer"
                                }`}
                              >
                                <div className="text-left">
                                  <p
                                    className={`font-medium transition-colors ${
                                      isSelected
                                        ? "text-text-muted"
                                        : "text-text-main group-hover:text-primary-600"
                                    }`}
                                  >
                                    {material.name}
                                  </p>
                                  <p className="text-xs text-text-muted text-left">
                                    ${material.cost.toFixed(3)} / {material.unit}
                                  </p>
                                </div>
                                {isSelected ? (
                                  <div className="flex items-center gap-1 text-xs text-emerald-500 font-bold bg-emerald-500/10 px-2 py-1 rounded-full">
                                    <CheckCircle size={12} />
                                    Ya seleccionado
                                  </div>
                                ) : (
                                  <Plus
                                    size={16}
                                    className="text-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                  />
                                )}
                              </button>
                            );
                          })}
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
                            <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400">
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
                                  className="w-16 px-2 py-1 text-sm bg-transparent text-center focus:outline-none font-medium text-text-main"
                                />
                                <span className="pr-2 text-xs text-text-muted border-l border-border pl-2 py-1 bg-surface-highlight rounded-r-lg">
                                  {item.unit}
                                </span>
                              </div>

                              <button
                                onClick={() => handleRemoveMaterial(item.id)}
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
                onClick={() => setEditingExtraItem(null)}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUnifiedExtra}
                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                {editingExtraItem.id === "new"
                  ? "Crear Extra"
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
