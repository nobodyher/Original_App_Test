import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Download,
  Check,
  LogOut,
  ChevronDown,
  Search,
} from "lucide-react";
import NotificationToast from "../../components/ui/NotificationToast";
import type {
  AppUser,
  Service,
  ServiceItem,
  ExtraItem,
  PaymentMethod,
  CatalogService,
  Consumable,
  CatalogExtra,
  MaterialRecipe,
  Toast,
  Filters,
} from "../../types";
import { exportToCSV } from "../../utils/helpers";
import { calcCommissionAmount } from "../../services/salonService";
import type { NewServiceState } from "../../services/salonService";

interface StaffScreenProps {
  currentUser: AppUser | null;
  services: Service[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  materialRecipes: MaterialRecipe[];
  consumables: Consumable[];
  notification: Toast | null;
  showNotification: (message: string, type?: Toast["type"]) => void;
  onLogout: () => void;
  addService: (
    user: AppUser,
    data: NewServiceState,
    recipes: MaterialRecipe[],
    total: number
  ) => Promise<void>;
  updateService: (id: string, data: Partial<Service>) => Promise<void>;
  softDeleteService: (id: string, userId?: string) => Promise<void>;
}

const StaffScreen: React.FC<StaffScreenProps> = ({
  currentUser,
  services,
  catalogServices,
  catalogExtras,
  materialRecipes,
  notification,
  showNotification,
  onLogout,
  addService,
  updateService,
  softDeleteService,
}) => {
  const [newService, setNewService] = useState<NewServiceState>({
    date: new Date().toISOString().split("T")[0],
    client: "",
    services: [],
    extras: [],
    paymentMethod: "cash",
    category: undefined,
  });

  const [showExtrasSelector, setShowExtrasSelector] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [filters, setFilters] = useState<Filters>({
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({});

  // Filter services for current staff user
  const today = new Date().toISOString().split("T")[0];
  const userServices = useMemo(() => {
    return services.filter((s) => {
      if (s.userId !== currentUser?.id || s.deleted) return false;
      return s.date === today;
    });
  }, [services, currentUser, today]);

  const filteredServices = useMemo(() => {
    return userServices.filter((s) => {
      const matchSearch =
        !filters.search ||
        s.client.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.service?.toLowerCase().includes(filters.search.toLowerCase()) ||
        s.services?.some((srv) =>
          srv.serviceName.toLowerCase().includes(filters.search.toLowerCase())
        ) ||
        false;
      const matchDateFrom = !filters.dateFrom || s.date >= filters.dateFrom;
      const matchDateTo = !filters.dateTo || s.date <= filters.dateTo;
      return matchSearch && matchDateFrom && matchDateTo;
    });
  }, [userServices, filters]);

  const activeServices = useMemo(() => catalogServices.filter((s) => s.active), [catalogServices]);

  const calculateTotalCost = (
    servicesList: ServiceItem[],
    extrasList: ExtraItem[]
  ): number => {
    const servicesTotal = servicesList.reduce(
      (sum, s) => sum + s.servicePrice,
      0
    );
    const extrasTotal = extrasList.reduce((sum, e) => sum + e.totalPrice, 0);
    return servicesTotal + extrasTotal;
  };

  const selectCatalogService = (cs: CatalogService) => {
    console.log("Seleccionando servicio:", cs);
    const newServiceItem: ServiceItem = {
      serviceId: cs.id,
      serviceName: cs.name,
      servicePrice: cs.basePrice,
    };
    setNewService((prev) => {
      const updated = {
        ...prev,
        services: [...prev.services, newServiceItem],
        category: (cs.category as "manicura" | "pedicura") || undefined,
      };
      console.log("Nuevo estado de servicio:", updated);
      return updated;
    });
  };

  const updateExtraNailsCount = (extraId: string, nailsCount: number) => {
    const extra = catalogExtras.find((e) => e.id === extraId);
    if (!extra) return;

    if (!Number.isFinite(nailsCount) || nailsCount < 0) {
      showNotification("Ingresa un número de uñas válido", "error");
      return;
    }

    setNewService((prev) => {
      const filtered = prev.extras.filter((e) => e.extraId !== extraId);
      if (nailsCount === 0) {
        return { ...prev, extras: filtered };
      }
      const pricePerNail = (extra as any).price || extra.priceSuggested || 0;
      const newExtraItem: ExtraItem = {
        extraId: extra.id,
        extraName: extra.name,
        pricePerNail,
        nailsCount,
        totalPrice: pricePerNail * nailsCount,
      };

      return { ...prev, extras: [...filtered, newExtraItem] };
    });
  };

  const removeServiceFromList = (index: number) => {
    setNewService((prev) => ({
      ...prev,
      services: prev.services.filter((_, i) => i !== index),
    }));
  };

  const removeExtraFromList = (index: number) => {
    setNewService((prev) => ({
      ...prev,
      extras: prev.extras.filter((_, i) => i !== index),
    }));
  };

  const totalCost = calculateTotalCost(newService.services, newService.extras);

  const handleAddService = async () => {
    if (!currentUser) return;
    try {
      await addService(currentUser, newService, materialRecipes, totalCost);
      setNewService({
        date: new Date().toISOString().split("T")[0],
        client: "",
        services: [],
        extras: [],
        paymentMethod: "cash",
        category: undefined,
      });
      showNotification("Servicio agregado exitosamente");
    } catch (error: any) {
      console.error("Error completo:", error);
      showNotification(`Error: ${error?.message || "Error desconocido"}`, "error");
    }
  };

  const handleEditClick = (service: Service) => {
    setEditingServiceId(service.id);
    setEditForm({ ...service });
  };

  const handleUpdateService = async (id: string) => {
    try {
      await updateService(id, editForm);
      setEditingServiceId(null);
      setEditForm({});
      showNotification("Servicio actualizado");
    } catch (error) {
      console.error("Error actualizando servicio:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleSoftDeleteService = async (id: string) => {
    if (!window.confirm("¿Eliminar este servicio? (Se guardará como historial)"))
      return;
    try {
      await softDeleteService(id, currentUser?.id);
      showNotification("Servicio eliminado (historial)");
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const totalToday = userServices.reduce((sum, s) => sum + s.cost, 0);

  const finalTotalCommission = userServices.reduce((sum, s) => {
    if (!currentUser) return sum;
    return sum + calcCommissionAmount(s, [currentUser]);
  }, 0);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NotificationToast notification={notification} />
      <div className={`bg-gradient-to-r ${currentUser.color} text-white p-6 shadow-lg`}>
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Hola, {currentUser.name}</h1>
            <p className="text-white/80">Registra tus servicios</p>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-lg hover:bg-white/30 transition shadow-md border border-white/30"
          >
            <LogOut size={20} />
            Salir
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        {/* Form Section */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Plus size={24} className="text-pink-500" />
            Agregar Nuevo Servicio
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
            <input
              type="date"
              value={newService.date}
              onChange={(e) => setNewService({ ...newService, date: e.target.value })}
              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none"
            />
            <input
              type="text"
              placeholder="Nombre del cliente"
              value={newService.client}
              onChange={(e) => setNewService({ ...newService, client: e.target.value })}
              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none"
            />
            <select
              value={selectedServiceId}
              onChange={(e) => {
                const selected = activeServices.find((cs) => cs.id === e.target.value);
                if (selected) {
                  selectCatalogService(selected);
                  setSelectedServiceId("");
                }
              }}
              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none"
            >
              <option value="">Servicio</option>
              {activeServices.map((cs) => (
                <option key={cs.id} value={cs.id}>
                  {cs.name} - ${cs.basePrice}
                </option>
              ))}
            </select>
            <select
              value={newService.paymentMethod}
              onChange={(e) => setNewService({ ...newService, paymentMethod: e.target.value as PaymentMethod })}
              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none"
            >
              <option value="cash">Efectivo</option>
              <option value="transfer">Transferencia</option>
            </select>
            <select
              value={newService.category || ""}
              onChange={(e) => setNewService({ ...newService, category: (e.target.value as "manicura" | "pedicura") || undefined })}
              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none"
            >
              <option value="">Categoría (opcional)</option>
              <option value="manicura">Manicura completa</option>
              <option value="pedicura">Pedicura completa</option>
            </select>
          </div>

          {/* Added Services List */}
          {newService.services.length > 0 && (
            <div className="mb-4 p-4 bg-green-50 rounded-lg border-2 border-green-200">
              <p className="font-bold text-green-800 mb-3">Servicios seleccionados:</p>
              <div className="space-y-2">
                {newService.services.map((s, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-green-200">
                    <div>
                      <p className="font-semibold text-gray-800">{s.serviceName}</p>
                      <p className="text-sm text-green-700">${s.servicePrice.toFixed(2)}</p>
                    </div>
                    <button onClick={() => removeServiceFromList(idx)} className="text-red-600 hover:text-red-800 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Extras Selector */}
          <div className="bg-blue-50 rounded-lg border-2 border-blue-200 p-4 mb-4">
            <button
              onClick={() => setShowExtrasSelector(!showExtrasSelector)}
              className="w-full flex justify-between items-center font-bold text-blue-800 hover:text-blue-900 transition"
            >
              <span>Extras (elige varios y coloca las uñas)</span>
              <span className={`transform transition-transform ${showExtrasSelector ? "rotate-180" : ""}`}>
                <ChevronDown size={20} />
              </span>
            </button>
            <p className="text-xs text-blue-700 mt-1 mb-3">Ejemplo: Extra efecto ojo de gato — Uñas: 2. Deja en 0 si no aplica.</p>
            {showExtrasSelector && (
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {catalogExtras.filter((e) => e.active).map((extra) => {
                  const current = newService.extras.find((e) => e.extraId === extra.id);
                  return (
                    <div key={extra.id} className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100">
                      <div>
                        <p className="font-semibold text-gray-800">{extra.name}</p>
                        <p className="text-xs text-gray-500">
                          ${((extra as any).price || extra.priceSuggested || 0).toFixed(2)} por uña
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-xs text-gray-500">Uñas</label>
                        <input
                          type="number"
                          min={0}
                          max={10}
                          value={current?.nailsCount ?? 0}
                          onChange={(e) => updateExtraNailsCount(extra.id, parseInt(e.target.value || "0", 10))}
                          className="w-20 px-3 py-2 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-blue-500 focus:outline-none"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Added Extras List */}
          {newService.extras.length > 0 && (
            <div className="mb-4 p-4 bg-orange-50 rounded-lg border-2 border-orange-200">
              <p className="font-bold text-orange-800 mb-3">Extras seleccionados:</p>
              <div className="space-y-2">
                {newService.extras.map((e, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-lg border border-orange-200">
                    <div>
                      <p className="font-semibold text-gray-800">{e.extraName}</p>
                      <p className="text-sm text-orange-700">
                        ${e.pricePerNail.toFixed(2)}/uña × {e.nailsCount} uñas = ${e.totalPrice.toFixed(2)}
                      </p>
                    </div>
                    <button onClick={() => removeExtraFromList(idx)} className="text-red-600 hover:text-red-800 transition">
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Total Cost */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-pink-200 p-4 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 font-semibold">COSTO TOTAL:</p>
                <p className="text-3xl font-bold text-pink-600">${totalCost.toFixed(2)}</p>
              </div>
              <button
                onClick={handleAddService}
                disabled={newService.client === "" || newService.services.length === 0}
                className={`text-white px-8 py-3 rounded-lg hover:shadow-lg transition font-bold flex items-center gap-2 ${
                  newService.client === "" || newService.services.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700"
                }`}
              >
                <Check size={20} />
                Guardar Servicio
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-sm font-semibold mb-2 opacity-90">Servicios Hoy</h3>
          <div className="flex gap-8">
             <div>
                <p className="text-3xl font-bold">{userServices.length}</p>
                <p className="text-green-100 text-sm mt-1">servicios completados</p>
             </div>
             <div>
                <p className="text-3xl font-bold">${totalToday.toFixed(2)}</p>
                <p className="text-green-100 text-sm mt-1">ventas totales</p>
             </div>
             <div>
                <p className="text-3xl font-bold text-yellow-200">${finalTotalCommission.toFixed(2)}</p>
                <p className="text-green-100 text-sm mt-1">comisión estimada</p>
             </div>
          </div>
        </div>

        {/* Services List Table */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-800">Mis Servicios</h2>
            <button
              onClick={() => {
                const success = exportToCSV(filteredServices, "mis_servicios");
                if (success) showNotification("Reporte descargado");
                else showNotification("No hay datos para exportar", "error");
              }}
              className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
            >
              <Download size={18} />
              Exportar CSV
            </button>
          </div>

          {/* Filter UI */}
          <div className="p-4 bg-gray-50 border-b flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-300 shadow-sm focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-200">
               <Search size={18} className="text-gray-400" />
               <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={filters.search} 
                  onChange={e => setFilters({...filters, search: e.target.value})}
                  className="bg-transparent border-none focus:outline-none text-sm text-gray-700 w-48"
               />
            </div>
            <div className="flex gap-2 items-center">
               <input 
                  type="date" 
                  value={filters.dateFrom} 
                  onChange={e => setFilters({...filters, dateFrom: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-pink-500"
               />
               <span className="text-gray-400">a</span>
               <input 
                  type="date" 
                  value={filters.dateTo} 
                  onChange={e => setFilters({...filters, dateTo: e.target.value})}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:border-pink-500"
               />
            </div>
            {(filters.search || filters.dateFrom || filters.dateTo) && (
               <button 
                  onClick={() => setFilters({search: "", dateFrom: "", dateTo: ""})}
                  className="text-sm text-red-500 hover:text-red-700 underline"
               >
                  Limpiar filtros
               </button>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Fecha</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Cliente</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Servicio</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Pago</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Costo</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredServices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">No hay servicios</td>
                  </tr>
                ) : (
                  filteredServices.slice().reverse().map((service) => {
                    const isEditing = editingServiceId === service.id;

                    return (
                      <tr key={service.id} className="border-b hover:bg-gray-50 transition">
                         {isEditing ? (
                            <>
                              <td className="px-6 py-4">
                                <input
                                  type="date"
                                  value={editForm.date || ""}
                                  onChange={(e) => setEditForm({...editForm, date: e.target.value})}
                                  className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={editForm.client || ""}
                                  onChange={(e) => setEditForm({...editForm, client: e.target.value})}
                                  className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none w-full"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="text"
                                  value={editForm.service || ""}
                                  onChange={(e) => setEditForm({...editForm, service: e.target.value})}
                                  className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none w-full"
                                />
                              </td>
                              <td className="px-6 py-4">
                                <select
                                  value={editForm.paymentMethod || "cash"}
                                  onChange={(e) => setEditForm({...editForm, paymentMethod: e.target.value as PaymentMethod})}
                                  className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none"
                                >
                                  <option value="cash">Efectivo</option>
                                  <option value="transfer">Transferencia</option>
                                </select>
                              </td>
                              <td className="px-6 py-4">
                                <input
                                  type="number"
                                  value={editForm.cost || 0}
                                  onChange={(e) => setEditForm({...editForm, cost: parseFloat(e.target.value)})}
                                  className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-pink-500 focus:outline-none"
                                />
                              </td>
                              <td className="px-6 py-4 flex gap-2">
                                <button
                                  onClick={() => handleUpdateService(service.id)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  <Save size={18} />
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingServiceId(null);
                                    setEditForm({});
                                  }}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <X size={18} />
                                </button>
                              </td>
                            </>
                         ) : (
                            <>
                              <td className="px-6 py-4 text-sm">{service.date}</td>
                              <td className="px-6 py-4 text-sm font-medium">{service.client}</td>
                              <td className="px-6 py-4 text-sm">
                                <div>
                                  <p className="font-medium text-gray-800">{service.service || "Servicios personalizados"}</p>
                                  {service.services && service.services.length > 0 && (
                                    <div className="text-xs text-gray-600 mt-1">
                                      {service.services.map((s, i) => (
                                        <div key={i}>{s.serviceName}</div>
                                      ))}
                                    </div>
                                  )}
                                  {service.extras && service.extras.length > 0 && (
                                    <div className="text-xs text-gray-500 mt-1 border-t pt-1">
                                      {service.extras.map((e, i) => (
                                        <div key={i}>+ {e.extraName} ({e.nailsCount} uñas)</div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {service.paymentMethod === "transfer" ? "Transferencia" : "Efectivo"}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-green-600">${Number(service.cost).toFixed(2)}</td>
                              <td className="px-6 py-4 flex gap-2">
                                <button
                                  onClick={() => handleEditClick(service)}
                                  className="text-blue-600 hover:text-blue-800 transition"
                                >
                                  <Edit2 size={18} />
                                </button>
                                <button
                                  onClick={() => handleSoftDeleteService(service.id)}
                                  className="text-red-600 hover:text-red-800 transition"
                                >
                                  <Trash2 size={18} />
                                </button>
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
      </div>
    </div>
  );
};

export default StaffScreen;
