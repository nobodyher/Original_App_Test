import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
  Edit2,
  X,
  Check,
  LogOut,
  ChevronDown,
  Search,
  TrendingUp,
  User,
  Crown,
  ClipboardList,
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

const EmptyState = ({ 
  icon: Icon, 
  title, 
  message 
}: { 
  icon: any, 
  title: string, 
  message: string 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in col-span-full">
    <Icon size={64} className="text-gray-200 mb-4" strokeWidth={1.5} />
    <h3 className="text-lg font-bold text-gray-400 mb-2">{title}</h3>
    <p className="text-sm text-gray-400 max-w-xs mx-auto">{message}</p>
  </div>
);

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
  const [showServiceList, setShowServiceList] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Service>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    setIsSubmitting(true);
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
      // Delay notification to ensure UI feedback is seen
      setTimeout(() => {
          showNotification("Servicio agregado exitosamente");
      }, 200);
    } catch (error: any) {
      console.error("Error completo:", error);
      showNotification(`Error: ${error?.message || "Error desconocido"}`, "error");
    } finally {
      setIsSubmitting(false);
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

  // ... Logic remains essentially the same, just UI changes ...

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <NotificationToast notification={notification} />
      
      {/* Header with Glassmorphism */}
      <div className={`relative overflow-hidden bg-gradient-to-r ${currentUser.color} pb-12 pt-8 px-6 shadow-xl`}>
         <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
         <div className="relative max-w-5xl mx-auto flex justify-between items-end">
            <div>
              <p className="text-white/80 font-medium mb-1 uppercase tracking-wider text-xs">Panel de Staff</p>
              <h1 className="text-3xl font-black text-white tracking-tight">Hola, {currentUser.name}</h1>
            </div>
            
            <button
               onClick={onLogout}
               className="flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-5 py-2.5 rounded-2xl transition-all border border-white/20 text-sm font-bold shadow-lg"
            >
               <LogOut size={18} />
               <span className="hidden sm:inline">Salir</span>
            </button>
         </div>
      </div>

      {/* Main Content using Negative Margin for overlapping effect */}
      <div className="max-w-5xl mx-auto px-4 -mt-8 relative z-10 space-y-6">
         
         {/* Stats Row */}
         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl shadow-lg p-5 border border-purple-50 flex flex-col justify-between h-28 relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <Check size={64} className="text-purple-600" />
               </div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Servicios Hoy</p>
               <p className="text-4xl font-black text-gray-800">{userServices.length}</p>
            </div>
            <div className="bg-white rounded-2xl shadow-lg p-5 border border-green-50 flex flex-col justify-between h-28 relative overflow-hidden group">
               <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                  <TrendingUp size={64} className="text-green-600" />
               </div>
               <p className="text-gray-500 text-xs font-bold uppercase tracking-wider">Ventas Totales</p>
               <p className="text-4xl font-black text-green-600">${totalToday.toFixed(2)}</p>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-lg p-5 flex flex-col justify-between h-28 relative overflow-hidden text-white">
               <p className="text-gray-400 text-xs font-bold uppercase tracking-wider">Tu Comisión Est.</p>
               <p className="text-4xl font-black text-yellow-400">${finalTotalCommission.toFixed(2)}</p>
            </div>
         </div>

         {/* NEW SERVICE FORM - Split into Cards */}
         <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Form Inputs */}
            <div className="lg:col-span-2 space-y-6">
               
               {/* 1. Client & Basics Card */}
               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                     <span className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600">
                        <User size={16} />
                     </span>
                     Datos del Cliente
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Fecha</label>
                        <input
                           type="date"
                           value={newService.date}
                           onChange={(e) => setNewService({ ...newService, date: e.target.value })}
                           className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 transition-all duration-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none font-medium text-gray-700"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Cliente</label>
                        <input
                           type="text"
                           placeholder="Nombre del cliente"
                           value={newService.client}
                           onChange={(e) => setNewService({ ...newService, client: e.target.value })}
                           className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 transition-all duration-200 focus:bg-white focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none font-medium text-gray-700 placeholder-gray-400"
                        />
                     </div>
                  </div>
               </div>

               {/* 2. Service Selection Card */}
               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                     <span className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">
                        <Plus size={16} />
                     </span>
                     Seleccionar Servicios
                  </h3>
                  
                  {/* Category Buttons (Mobile Friendly) */}
                  <div className="flex gap-3 mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {["manicura", "pedicura"].map((cat) => (
                       <button
                          key={cat}
                          onClick={() => setNewService({ ...newService, category: cat as any })}
                          className={`flex-shrink-0 px-6 py-3 rounded-xl border-2 font-bold transition-all duration-200 active:scale-95 ${
                             newService.category === cat
                                ? "border-purple-500 bg-purple-50 text-purple-700 shadow-md"
                                : "border-gray-100 bg-white text-gray-400 hover:border-gray-200"
                          }`}
                       >
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                       </button>
                    ))}
                  </div>

                  {/* Service Dropdown */}
                  <div className="relative mb-6">
                     <button
                        onClick={() => setShowServiceList(!showServiceList)}
                        className="w-full h-14 pl-4 pr-10 rounded-xl bg-gray-50 border-2 border-gray-100 text-gray-700 font-medium text-left appearance-none focus:border-purple-500 focus:bg-white focus:outline-none transition-colors cursor-pointer"
                     >
                        + Añadir servicio al carrito...
                     </button>
                     <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <ChevronDown size={20} />
                     </div>
                     {showServiceList && (
                        <div className="absolute top-full left-0 mt-2 w-full max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                           {activeServices.map((cs) => (
                              <div
                                 key={cs.id}
                                 onClick={() => {
                                    selectCatalogService(cs);
                                    setShowServiceList(false);
                                 }}
                                 className="p-4 cursor-pointer hover:bg-purple-50 hover:pl-5 transition-all duration-200 border-b border-gray-100 last:border-0 flex justify-between items-center"
                              >
                                 <span className="font-bold text-gray-700">{cs.name}</span>
                                 <span className="font-bold text-purple-600">${cs.basePrice}</span>
                              </div>
                           ))}
                        </div>
                     )}
                  </div>

                  {/* Selected Services List */}
                  {newService.services.length > 0 && (
                     <div className="space-y-3">
                        {newService.services.map((s, idx) => (
                           <div key={idx} className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-100 group hover:border-purple-200 transition-colors">
                              <div className="flex items-center gap-3">
                                 <div className="w-2 h-10 rounded-full bg-purple-500"></div>
                                 <p className="font-bold text-gray-700">{s.serviceName}</p>
                              </div>
                              <div className="flex items-center gap-4">
                                 <span className="font-bold text-gray-800">${s.servicePrice}</span>
                                 <button 
                                    onClick={() => removeServiceFromList(idx)} 
                                    className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-gray-400 hover:text-red-500 hover:border-red-200 transition-colors"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
               
               {/* 3. Extras Card */}
               <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
                 <button
                    onClick={() => setShowExtrasSelector(!showExtrasSelector)}
                    className="w-full flex justify-between items-center"
                 > 
                    <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                        <span className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                            <Crown size={16} />
                        </span>
                        Extras & Decoración
                    </h3>
                    <ChevronDown size={20} className={`text-gray-400 transition-transform ${showExtrasSelector ? "rotate-180" : ""}`} />
                 </button>

                 {(showExtrasSelector || newService.extras.length > 0) && (
                    <div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
                       {/* Selector Area */}
                        {showExtrasSelector && (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                              {catalogExtras.filter((e) => e.active).map((extra) => {
                                 const current = newService.extras.find((e) => e.extraId === extra.id);
                                 const isActive = !!current;
                                 return (
                                    <div 
                                       key={extra.id} 
                                       className={`p-3 rounded-xl border-2 transition-all cursor-pointer ${isActive ? 'border-orange-400 bg-orange-50' : 'border-gray-100 bg-white hover:border-orange-200'}`}
                                    >
                                       <div className="flex justify-between items-start mb-2">
                                          <p className={`font-bold text-sm leading-tight ${isActive ? 'text-orange-900' : 'text-gray-700'}`}>{extra.name}</p>
                                          <span className="text-xs font-semibold bg-white px-2 py-0.5 rounded border border-gray-100">
                                             ${((extra as any).price || extra.priceSuggested || 0)}
                                          </span>
                                       </div>
                                       
                                       <div className="flex items-center justify-between mt-2 bg-white/50 rounded-lg p-1">
                                          <span className="text-[10px] uppercase font-bold text-gray-400 pl-1">Uñas:</span>
                                          <input
                                             type="number"
                                             min={0}
                                             max={10}
                                             value={current?.nailsCount ?? 0}
                                             onClick={(e) => e.stopPropagation()}
                                             onChange={(e) => updateExtraNailsCount(extra.id, parseInt(e.target.value || "0", 10))}
                                             className="w-12 text-center font-bold bg-transparent border-b-2 border-orange-200 focus:border-orange-500 focus:outline-none p-1"
                                          />
                                       </div>
                                    </div>
                                 );
                              })}
                           </div>
                        )}

                        {/* Selected Extras List */}
                        {newService.extras.length > 0 && (
                           <div className="space-y-2">
                              {newService.extras.map((e, idx) => (
                                 <div key={idx} className="flex justify-between items-center text-sm p-3 bg-orange-50/50 rounded-lg border border-orange-100">
                                    <div className="flex flex-col">
                                       <span className="font-bold text-gray-700">{e.extraName}</span>
                                       <span className="text-orange-600 text-xs font-medium">{e.nailsCount} uñas × ${e.pricePerNail}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                       <span className="font-bold text-gray-800">${e.totalPrice.toFixed(2)}</span>
                                       <button onClick={() => removeExtraFromList(idx)} className="text-gray-400 hover:text-red-500">
                                          <X size={16} />
                                       </button>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}
                    </div>
                 )}
               </div>

            </div>

            {/* Right Column: Total & Pay */}
            <div className="lg:col-span-1">
               <div className="bg-white rounded-[2rem] shadow-xl border border-gray-100 p-6 sticky top-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-6">Resumen</h3>
                  
                  <div className="space-y-4 mb-8">
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Servicios ({newService.services.length})</span>
                        <span className="font-medium">${newService.services.reduce((acc, s) => acc + s.servicePrice, 0).toFixed(2)}</span>
                     </div>
                     <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Extras ({newService.extras.length})</span>
                        <span className="font-medium">${newService.extras.reduce((acc, e) => acc + e.totalPrice, 0).toFixed(2)}</span>
                     </div>
                     <div className="h-px bg-gray-100 my-2" />
                     <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-gray-800">Total</span>
                        <span className="text-3xl font-black text-gray-900">${totalCost.toFixed(2)}</span>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Método de Pago</label>
                        <div className="grid grid-cols-2 gap-2">
                           <button
                              onClick={() => setNewService({ ...newService, paymentMethod: "cash" })}
                              className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                 newService.paymentMethod === "cash"
                                    ? "border-green-500 bg-green-50 text-green-700"
                                    : "border-gray-100 text-gray-400 hover:border-gray-200"
                              }`}
                           >
                              Efectivo
                           </button>
                           <button
                              onClick={() => setNewService({ ...newService, paymentMethod: "transfer" })}
                              className={`py-3 rounded-xl border-2 font-bold text-sm transition-all ${
                                 newService.paymentMethod === "transfer"
                                    ? "border-blue-500 bg-blue-50 text-blue-700"
                                    : "border-gray-100 text-gray-400 hover:border-gray-200"
                              }`}
                           >
                              Transferencia
                           </button>
                        </div>
                     </div>

                     <button
                        onClick={handleAddService}
                        disabled={newService.client === "" || newService.services.length === 0 || isSubmitting}
                        className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 ${
                           newService.client === "" || newService.services.length === 0
                              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                              : isSubmitting 
                                 ? "bg-black/70 text-white cursor-wait animate-pulse" 
                                 : "bg-black text-white hover:bg-gray-900 transform hover:-translate-y-1"
                        }`}
                     >
                        <Check size={20} className={isSubmitting ? "hidden" : ""} />
                        {isSubmitting ? "Procesando..." : "Confirmar Cobro"}
                     </button>
                  </div>
               </div>
            </div>
         </div>
         
         {/* Services List - Modern Card View */}
         <div className="pt-10">
            <div className="flex justify-between items-end mb-6">
               <h2 className="text-2xl font-black text-gray-800">Mis Servicios</h2>
               
               {/* Search / Filters Condensed */}
               <div className="flex gap-2">
                  <div className="relative group">
                     <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-pink-500" size={16} />
                     <input 
                        type="text" 
                        placeholder="Buscar..."
                        value={filters.search}
                        onChange={e => setFilters({...filters, search: e.target.value})}
                        className="pl-9 pr-4 py-2 rounded-xl bg-white border border-gray-200 transition-all duration-200 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/20 outline-none shadow-sm w-32 focus:w-48"
                     />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
               {filteredServices.length === 0 ? (
                  <EmptyState 
                    icon={ClipboardList} 
                    title="Sin servicios" 
                    message="Tus servicios realizados aparecerán aquí." 
                  />
               ) : (
                  filteredServices.slice().reverse().map((service) => {
                     const isEditing = editingServiceId === service.id;
                     
                     if (isEditing) {
                        return (
                           <div key={service.id} className="bg-white p-6 rounded-[2rem] shadow-xl ring-2 ring-blue-400 animate-pulse-once">
                              {/* Edit Mode Custom Form needed here or just keep simple inputs */}
                              <div className="space-y-3">
                                 <p className="font-bold text-blue-600">Editando servicio...</p>
                                 <input value={editForm.client} onChange={e => setEditForm({...editForm, client: e.target.value})} className="w-full p-2 border rounded" placeholder="Cliente" />
                                 <input value={editForm.cost} type="number" onChange={e => setEditForm({...editForm, cost: parseFloat(e.target.value)})} className="w-full p-2 border rounded" placeholder="Costo" />
                                 <div className="flex gap-2 pt-2">
                                     <button onClick={() => handleUpdateService(service.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex-1">Guardar</button>
                                     <button onClick={() => setEditingServiceId(null)} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-bold">Cancelar</button>
                                 </div>
                              </div>
                           </div>
                        )
                     }

                     return (
                        <div 
                           key={service.id} 
                           className={`group bg-white rounded-[2rem] shadow-sm border p-5 relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1 ${
                              service.paymentMethod === 'cash' ? 'border-l-[6px] border-l-green-400' : 'border-l-[6px] border-l-blue-400'
                           }`}
                        >
                           <div className="flex justify-between items-start mb-3">
                              <div>
                                 <h4 className="font-bold text-gray-800 text-lg">{service.client}</h4>
                                 <p className="text-gray-400 text-xs font-medium">{service.date}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-2xl font-black text-gray-900">${Number(service.cost).toFixed(2)}</p>
                                 <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    service.paymentMethod === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                                 }`}>
                                    {service.paymentMethod === 'transfer' ? 'Transferencia' : 'Efectivo'}
                                 </span>
                              </div>
                           </div>

                           <div className="bg-gray-50 rounded-xl p-3 mb-4">
                              {service.services?.map((s, i) => (
                                 <div key={i} className="flex justify-between items-center text-sm mb-1 last:mb-0">
                                    <span className="text-gray-600 font-medium">{s.serviceName}</span>
                                 </div>
                              ))}
                              {service.extras && service.extras.length > 0 && (
                                 <div className="mt-2 text-xs border-t border-gray-200 pt-2 space-y-1">
                                    {service.extras.map((e, i) => (
                                       <div key={i} className="flex justify-between text-gray-500">
                                          <span>+ {e.extraName}</span>
                                          <span>({e.nailsCount})</span>
                                       </div>
                                    ))}
                                 </div>
                              )}
                           </div>

                           <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => handleEditClick(service)} className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100">
                                 <Edit2 size={14} />
                              </button>
                              <button onClick={() => handleSoftDeleteService(service.id)} className="w-8 h-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center hover:bg-red-100">
                                 <Trash2 size={14} />
                              </button>
                           </div>
                        </div>
                     )
                  })
               )}
            </div>
         </div>
         
         <div className="h-10"/> {/* Spacer */}
      </div>
    </div>
  );
};

export default StaffScreen;
