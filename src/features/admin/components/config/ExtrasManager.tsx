import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { CatalogExtra, Toast } from "../../../../types";

interface ExtrasManagerProps {
  extras: CatalogExtra[];
  onRefresh?: () => void;
  onAdd: (name: string, price: number) => Promise<void>;
  onUpdate: (id: string, data: Partial<CatalogExtra>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showNotification: (message: string, type?: Toast["type"]) => void;
}

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

const ExtrasManager: React.FC<ExtrasManagerProps> = ({
  extras,
  onRefresh,
  onAdd,
  onUpdate,
  onDelete,
  showNotification,
}) => {
  // Extras Adding State
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extras Editing State (Slide-over)
  const [editingExtraItem, setEditingExtraItem] = useState<CatalogExtra | null>(
    null
  );
  const [editExtraForm, setEditExtraForm] = useState<Partial<CatalogExtra>>({});

  // Pagination States
  const ITEMS_PER_PAGE = 7;
  const [extrasPage, setExtrasPage] = useState(1);

  React.useEffect(() => {
    setExtrasPage(1);
  }, [extras.length]);

  const paginatedExtras = useMemo(() => {
    return extras.slice(
      (extrasPage - 1) * ITEMS_PER_PAGE,
      extrasPage * ITEMS_PER_PAGE
    );
  }, [extras, extrasPage]);

  // Handlers
  const handleAddExtra = async () => {
    setIsSubmitting(true);
    try {
      await onAdd(newExtraName, parseFloat(newExtraPrice));
      setNewExtraName("");
      setNewExtraPrice("");
      showNotification("Extra agregado");
      onRefresh?.();
    } catch (error: any) {
      console.error("Error agregando extra:", error);
      showNotification(error.message || "Error al agregar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExtra = async (
    id: string,
    updates: Partial<CatalogExtra>
  ) => {
    try {
      await onUpdate(id, updates);
      setEditingExtraItem(null);
      showNotification("Extra actualizado");
      onRefresh?.();
    } catch (error: any) {
      console.error("Error actualizando extra:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleToggleExtra = async (id: string, active: boolean) => {
    try {
      await onUpdate(id, { active: !active });
      showNotification(active ? "Extra desactivado" : "Extra activado");
      onRefresh?.();
    } catch (error: any) {
      console.error("Error actualizando extra:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (!window.confirm("¿Eliminar este extra?")) return;
    try {
      await onDelete(id);
      showNotification("Extra eliminado");
      onRefresh?.();
    } catch (error: any) {
      console.error("Error eliminando extra:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Sparkles className="text-orange-600" />
        Gestión de Extras y Adicionales
      </h3>

      {/* Agregar Nuevo Extra */}
      <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 mb-8">
        <h4 className="text-lg font-bold text-orange-900 mb-4 flex items-center gap-2">
          <Plus size={20} /> Agregar Nuevo Extra
        </h4>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full">
            <label className="text-sm font-semibold text-orange-800 mb-1 block">
              Nombre del Servicio
            </label>
            <input
              type="text"
              placeholder="Ej. Uña Rota"
              value={newExtraName}
              onChange={(e) => setNewExtraName(e.target.value)}
              className="w-full px-4 py-2 rounded-xl border border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all"
            />
          </div>
          <div className="w-full md:w-40">
            <label className="text-sm font-semibold text-orange-800 mb-1 block">
              Precio
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-orange-500 font-bold">
                $
              </span>
              <input
                type="number"
                placeholder="0.00"
                value={newExtraPrice}
                onChange={(e) => setNewExtraPrice(e.target.value)}
                className="w-full pl-8 pr-4 py-2 rounded-xl border border-orange-200 focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all font-bold text-orange-900"
              />
            </div>
          </div>
          <button
            onClick={handleAddExtra}
            disabled={!newExtraName || !newExtraPrice || isSubmitting}
            className={`bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out font-semibold h-[42px] flex items-center justify-center min-w-[120px] ${
              isSubmitting
                ? "opacity-60 cursor-wait animate-pulse pointer-events-none"
                : "cursor-pointer hover:-translate-y-0.5 active:scale-95 active:shadow-inner"
            }`}
          >
            {isSubmitting ? "Guardando..." : "Agregar"}
          </button>
        </div>
      </div>

      {/* Tabla de extras */}
      <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Nombre
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                Precio/Uña
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
            {paginatedExtras.length === 0 ? (
              <tr>
                <td colSpan={4}>
                  <EmptyState
                    icon={Sparkles}
                    title="Sin extras"
                    message="Agrega decoraciones y servicios adicionales aquí."
                  />
                </td>
              </tr>
            ) : (
              paginatedExtras.map((extra) => {
                const price = (extra as any).price || extra.priceSuggested || 0;
                return (
                  <tr
                    key={extra.id}
                    className={`group transition-colors duration-200 even:bg-slate-50/30 hover:bg-gray-100/80 ${
                      !extra.active ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {extra.name || "Sin nombre"}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-gray-900 font-mono">
                      ${price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        onClick={() =>
                          handleToggleExtra(extra.id, extra.active)
                        }
                        className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm cursor-pointer hover:scale-105 transition-transform ${
                          extra.active
                            ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                            : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                        }`}
                        title="Clic para alternar estado"
                      >
                        {extra.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <button
                          onClick={() => {
                            setEditingExtraItem(extra);
                            setEditExtraForm(extra);
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:scale-110 active:scale-90"
                          title="Editar"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteExtra(extra.id)}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
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

      {/* Extras Pagination */}
      <div className="flex justify-between items-center px-4 py-3 mt-4">
        <div className="text-sm text-gray-500 font-medium">
          Mostrando{" "}
          {Math.min(
            (extrasPage - 1) * ITEMS_PER_PAGE + 1,
            extras.length
          )}{" "}
          - {Math.min(extrasPage * ITEMS_PER_PAGE, extras.length)} de{" "}
          {extras.length} extras
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setExtrasPage((p) => Math.max(1, p - 1))}
            disabled={extrasPage === 1}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronLeft size={18} />
          </button>
          <span className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold shadow-sm shadow-orange-200">
            {extrasPage}
          </span>
          <button
            onClick={() =>
              setExtrasPage((p) =>
                p * ITEMS_PER_PAGE < extras.length ? p + 1 : p
              )
            }
            disabled={extrasPage * ITEMS_PER_PAGE >= extras.length}
            className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      {/* Slide-over para Edición de Extras */}
      {editingExtraItem && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingExtraItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">
                  Editar Extra
                </h3>
                <p className="text-sm text-gray-500">
                  Configuración de servicios adicionales
                </p>
              </div>
              <button
                onClick={() => setEditingExtraItem(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-orange-600" />
                  Detalles del Extra
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Nombre del Extra
                  </label>
                  <input
                    type="text"
                    value={editExtraForm.name || ""}
                    onChange={(e) =>
                      setEditExtraForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">
                    Precio Sugerido (por Uña/Unidad)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={
                        (editExtraForm as any).price ?? editExtraForm.priceSuggested
                      }
                      onChange={(e) =>
                        setEditExtraForm((prev) => ({
                          ...prev,
                          ['price']: parseFloat(e.target.value),
                          priceSuggested: parseFloat(e.target.value),
                        }))
                      }
                      className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold text-lg"
                    />
                  </div>
                </div>
              </div>

              {/* Estado Activo */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <span className="block font-semibold text-gray-700">
                    Disponibilidad
                  </span>
                  <span className="text-xs text-gray-500">
                    {editExtraForm.active
                      ? "Visible en el catálogo"
                      : "Oculto para nuevos servicios"}
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
                    editExtraForm.active ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editExtraForm.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditingExtraItem(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingExtraItem && editExtraForm) {
                    handleUpdateExtra(editingExtraItem.id, editExtraForm);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
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

export default ExtrasManager;
