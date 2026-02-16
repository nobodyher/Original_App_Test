import React, { useState, useMemo } from "react";
import {
  Plus,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  ChevronLeft,
  ChevronRight,
  DollarSign,
} from "lucide-react";
import ConfirmationModal from "../../../../components/ui/ConfirmationModal";
import type { CatalogExtra, Toast, AppUser } from "../../../../types";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ExtrasManagerProps {
  // Data
  catalogExtras: CatalogExtra[];
  currentUser: AppUser | null;

  // Actions
  addExtra: (name: string, price: number) => Promise<void>;
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
  currentUser,
  addExtra,
  updateExtra,
  deleteExtra,
  showNotification,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Add Extra State
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Extra State (Slide-over)
  const [editingExtraItem, setEditingExtraItem] = useState<CatalogExtra | null>(
    null,
  );
  const [editExtraForm, setEditExtraForm] = useState<Partial<CatalogExtra>>({});

  // Pagination
  const ITEMS_PER_PAGE = 7;
  const [extrasPage, setExtrasPage] = useState(1);

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

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleAddExtra = async () => {
    setIsSubmitting(true);
    try {
      await addExtra(newExtraName, parseFloat(newExtraPrice) || 0);
      setNewExtraName("");
      setNewExtraPrice("");
      showNotification("Extra agregado");
    } catch (error) {
      console.error("Error agregando extra:", error);
      const message =
        error instanceof Error ? error.message : "Error al agregar";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExtra = async (
    id: string,
    updates: Partial<CatalogExtra>,
  ) => {
    try {
      await updateExtra(id, updates);
      setEditingExtraItem(null);
      showNotification("Extra actualizado");
    } catch (error) {
      console.error("Error actualizando extra:", error);
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

  const handleSaveEdit = () => {
    if (!editingExtraItem) return;

    handleUpdateExtra(editingExtraItem.id, {
      name: editExtraForm.name || editingExtraItem.name,
      price: editExtraForm.price ?? editingExtraItem.price,
      active: editExtraForm.active ?? editingExtraItem.active,
    });
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header & Add Form */}
      <div className="bg-surface rounded-xl border border-border p-6">
        <h3 className="text-xl font-bold text-text-main mb-4 flex items-center gap-2">
          <Plus className="text-primary-600" />
          Agregar Extra
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Name Input */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-text-muted mb-2">
              Nombre del Extra
            </label>
            <input
              type="text"
              placeholder="ej. Diseño de Uñas"
              value={newExtraName}
              onChange={(e) => setNewExtraName(e.target.value)}
              className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
            />
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-sm font-medium text-text-muted mb-2">
              Precio
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
                value={newExtraPrice}
                onChange={(e) => setNewExtraPrice(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
              />
            </div>
          </div>
        </div>

        {/* Add Button */}
        <button
          onClick={handleAddExtra}
          disabled={isSubmitting || !newExtraName || !newExtraPrice}
          className="mt-4 px-6 py-2.5 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Plus size={18} />
          {isSubmitting ? "Agregando..." : "Agregar Extra"}
        </button>
      </div>

      {/* Extras Table */}
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
                  Precio
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border">
              {paginatedExtras.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    <EmptyState
                      icon={Plus}
                      title="No hay extras"
                      message="Agrega el primer extra usando el formulario de arriba."
                    />
                  </td>
                </tr>
              ) : (
                paginatedExtras.map((extra) => (
                  <tr
                    key={extra.id}
                    className={`group transition-colors duration-200 hover:bg-surface-highlight ${
                      !extra.active ? "opacity-60 bg-surface-highlight" : ""
                    }`}
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <p className="font-semibold text-text-main">
                        {extra.name}
                      </p>
                    </td>

                    {/* Price */}
                    <td className="px-6 py-4">
                      <p className="font-bold text-primary-600">
                        ${(extra.price || 0).toFixed(2)}
                      </p>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {extra.active ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-500/10 text-emerald-600 text-xs font-bold rounded-full">
                          <CheckCircle size={14} />
                          Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-500/10 text-gray-600 text-xs font-bold rounded-full">
                          <XCircle size={14} />
                          Inactivo
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            setEditingExtraItem(extra);
                            setEditExtraForm({
                              name: extra.name,
                              price: extra.price,
                              active: extra.active,
                            });
                          }}
                          className="p-2 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all duration-200 hover:scale-110 active:scale-90"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>

                        {/* Delete Button (Owner only) */}
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-surface-highlight">
            <p className="text-sm text-text-muted">
              Página {extrasPage} de {totalPages}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setExtrasPage((p) => Math.max(1, p - 1))}
                disabled={extrasPage === 1}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() => setExtrasPage((p) => Math.min(totalPages, p + 1))}
                disabled={extrasPage === totalPages}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Extra Slide-over */}
      {editingExtraItem && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingExtraItem(null)}
          />

          {/* Slide-over Panel */}
          <div className="absolute inset-y-0 right-0 max-w-md w-full bg-surface shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border bg-surface-highlight flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Editar Extra
                </h3>
                <p className="text-sm text-text-muted">
                  {editingExtraItem.name}
                </p>
              </div>
              <button
                onClick={() => setEditingExtraItem(null)}
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
                  value={editExtraForm.name || ""}
                  onChange={(e) =>
                    setEditExtraForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-text-muted mb-2">
                  Precio
                </label>
                <div className="relative">
                  <DollarSign
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={editExtraForm.price ?? ""}
                    onChange={(e) =>
                      setEditExtraForm((prev) => ({
                        ...prev,
                        price: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full pl-10 pr-4 py-2 bg-surface-highlight text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-lg border border-border">
                <span className="text-sm font-medium text-text-main">
                  Servicio Activo
                </span>
                <button
                  onClick={() =>
                    setEditExtraForm((prev) => ({
                      ...prev,
                      active: !prev.active,
                    }))
                  }
                  className={`relative w-14 h-7 rounded-full transition-colors duration-200 ease-in-out ${
                    editExtraForm.active
                      ? "bg-emerald-500"
                      : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-1 top-1 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                      editExtraForm.active ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setEditingExtraItem(null)}
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
