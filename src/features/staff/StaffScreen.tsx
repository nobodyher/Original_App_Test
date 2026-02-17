import React, { useState, useMemo } from "react";
import {
  Plus,
  Trash2,
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
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import ThemeToggle from "../../components/ui/ThemeToggle";
import { UserAvatar } from "../../components/ui/UserAvatar";
import type {
  AppUser,
  Service,
  ServiceItem,
  ExtraItem,
  CatalogService,
  CatalogExtra,
 
  InventoryItem,
  Client,
  Toast,
  Filters,
} from "../../types";
import { calcCommissionAmount } from "../../services/salonService";
import type { NewServiceState } from "../../services/salonService";

interface StaffScreenProps {
  currentUser: AppUser | null;
  services: Service[];
  clients: Client[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  
  inventoryItems: InventoryItem[];
  notification: Toast | null;
  showNotification: (message: string, type?: Toast["type"]) => void;
  onLogout: () => void;
  addService: (
    user: AppUser,
    data: NewServiceState,
    
    inventoryItems: InventoryItem[],
    total: number,
  ) => Promise<void>;
}

const EmptyState = ({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in col-span-full">
    <Icon size={64} className="text-text-muted mb-4" strokeWidth={1.5} />
    <h3 className="text-lg font-bold text-text-muted mb-2">{title}</h3>
    <p className="text-sm text-text-muted max-w-xs mx-auto">{message}</p>
  </div>
);

const StaffScreen: React.FC<StaffScreenProps> = ({
  currentUser,
  services,
  clients,
  catalogServices,
  catalogExtras,
  
  inventoryItems,
  notification,
  showNotification,
  onLogout,
  addService,
}) => {
  const [newService, setNewService] = useState<NewServiceState>({
    date: new Date().toISOString().split("T")[0],
    client: "",
    services: [],
    extras: [],
    paymentMethod: "cash",
  });

  const [showExtrasSelector, setShowExtrasSelector] = useState(false);
  const [showServiceList, setShowServiceList] = useState(false);
  
  // Autocomplete State
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    search: "",
    dateFrom: "",
    dateTo: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter clients for autocomplete
  const clientSuggestions = useMemo(() => {
    if (!newService.client || newService.client.length < 2) return [];
    const term = newService.client.toLowerCase();
    return clients
      .filter((c) => c.name.toLowerCase().includes(term))
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 5); // Limit to 5 suggestions
  }, [newService.client, clients]);

  const handleSelectClient = (clientName: string) => {
    setNewService((prev) => ({ ...prev, client: clientName }));
    setShowSuggestions(false);
  };

  const handleClientBlur = () => {
    // Delay hiding to allow click event on suggestion to fire
    setTimeout(() => {
      setShowSuggestions(false);
    }, 200);
  };

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
          srv.serviceName.toLowerCase().includes(filters.search.toLowerCase()),
        ) ||
        false;
      const matchDateFrom = !filters.dateFrom || s.date >= filters.dateFrom;
      const matchDateTo = !filters.dateTo || s.date <= filters.dateTo;
      return matchSearch && matchDateFrom && matchDateTo;
    });
  }, [userServices, filters]);

  const activeServices = useMemo(
    () => catalogServices.filter((s) => s.active),
    [catalogServices],
  );

  const calculateTotalCost = (
    servicesList: ServiceItem[],
    extrasList: ExtraItem[],
  ): number => {
    const servicesTotal = servicesList.reduce(
      (sum, s) => sum + s.servicePrice,
      0,
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
      const pricePerNail = extra.priceSuggested || extra.price || 0;
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
      await addService(
        currentUser,
        newService,
        inventoryItems,
        totalCost,
      );
      setNewService({
        date: new Date().toISOString().split("T")[0],
        client: "",
        services: [],
        extras: [],
        paymentMethod: "cash",
      });
      // Delay notification to ensure UI feedback is seen
      setTimeout(() => {
        showNotification("Servicio agregado exitosamente");
      }, 200);
    } catch (error) {
      console.error("Error completo:", error);
      const message =
        error instanceof Error ? error.message : "Error desconocido";
      showNotification(`Error: ${message}`, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalToday = userServices.reduce((sum, s) => sum + s.cost, 0);

  const finalTotalCommission = userServices.reduce((sum, s) => {
    if (!currentUser) return sum;
    return sum + calcCommissionAmount(s, [currentUser]);
  }, 0);

  if (!currentUser) return null;

  return (
    <div className="min-h-screen bg-background pb-20 relative selection:bg-primary-700/20">
      {/* Ambient Background Blobs (Subtle) */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-primary-600/10 rounded-full blur-[120px] opacity-60" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary-700/10 rounded-full blur-[120px] opacity-60" />
      </div>

      <NotificationToast notification={notification} />

      {/* Header with Glassmorphism - COMPACTED */}
      <div className="relative z-10 overflow-hidden bg-surface backdrop-blur-xl border-b border-primary-400/20 pb-3 pt-3 px-6 shadow-none">
        <div className="relative max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <UserAvatar
                image={currentUser.photoURL}
                name={currentUser.name}
                size="w-12 h-12"
                className="shadow-md ring-2 ring-primary-600/20"
              />
              <div>
                <p className="text-text-muted font-bold uppercase tracking-wider text-xs">
                  Panel de Staff
                </p>
                <h1 className="text-3xl font-black text-text-main tracking-tight leading-none">
                  Hola, {currentUser.name}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              variant="secondary"
              size="sm"
              onClick={onLogout}
              className="flex items-center gap-2"
            >
              <LogOut size={18} />
              <span className="hidden sm:inline">Cerrar Turno</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 mt-6 relative z-10 space-y-8">
        {/* BLOQUE A: Action Buttons - Nueva Venta (Moved to top for quick access) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

          {/* Left Column: Form Inputs (8 cols) */}
          <div className="xl:col-span-8 space-y-6">
            {/* 1. Client & Basics Card */}
            <Card className="p-8">
              <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-primary-700/10 flex items-center justify-center text-primary-700 ring-1 ring-primary-700/20">
                  <User size={20} />
                </span>
                Datos del Cliente
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase ml-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={newService.date}
                    onChange={(e) =>
                      setNewService({ ...newService, date: e.target.value })
                    }
                    className="w-full h-14 px-5 rounded-2xl bg-background border border-primary-400/20 transition-all duration-200 focus:bg-surface focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 outline-none font-semibold text-text-main"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase ml-1">
                    Cliente
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Nombre del cliente"
                      value={newService.client}
                      onChange={(e) => {
                        setNewService({ ...newService, client: e.target.value });
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={handleClientBlur}
                      className="w-full h-14 px-5 rounded-2xl bg-background border border-primary-400/20 transition-all duration-200 focus:bg-surface focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 outline-none font-semibold text-text-main placeholder-text-muted"
                      autoComplete="off"
                    />
                    
                    {/* Autocomplete Dropdown */}
                    {showSuggestions && clientSuggestions.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-surface border border-primary-400/20 rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-60 overflow-y-auto">
                        <div className="py-2">
                          {clientSuggestions.map((client) => (
                            <button
                              key={client.id}
                              className="w-full text-left px-5 py-3 hover:bg-primary-500/10 hover:text-primary-500 transition-colors flex items-center gap-3 group"
                              onClick={() => handleSelectClient(client.name)}
                              type="button" // Prevent form submission if inside a form
                            >
                              <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-xs font-bold ring-1 ring-primary-500/30 group-hover:bg-primary-500 group-hover:text-white transition-all">
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="font-bold text-text-main group-hover:text-primary-500 transition-colors">
                                {client.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>

            {/* 2. Service Selection Card */}
            <Card className="p-8 relative z-20">
              <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-3">
                <span className="w-10 h-10 rounded-2xl bg-primary-600/10 flex items-center justify-center text-primary-600 ring-1 ring-primary-600/20">
                  <Plus size={20} />
                </span>
                Seleccionar Servicios
              </h3>

              {/* Service Dropdown */}
              <div className="relative mb-8">
                <button
                  onClick={() => setShowServiceList(!showServiceList)}
                  className="w-full h-16 pl-6 pr-12 rounded-2xl bg-background border-2 border-dashed border-primary-400/40 text-text-muted font-bold text-left hover:bg-surface hover:border-primary-600/50 focus:border-primary-600 focus:bg-surface transition-all cursor-pointer flex items-center"
                >
                  + Añadir servicio al carrito...
                </button>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-primary-400">
                  <ChevronDown size={24} />
                </div>
                {showServiceList && (
                  <div className="absolute top-full left-0 mt-3 w-full max-h-80 overflow-y-auto bg-surface border border-border rounded-3xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 p-2">
                    {activeServices.map((cs) => (
                      <div
                        key={cs.id}
                        onClick={() => {
                          selectCatalogService(cs);
                          setShowServiceList(false);
                        }}
                        className="p-4 cursor-pointer hover:bg-white/5 rounded-2xl transition-all duration-200 flex justify-between items-center group"
                      >
                        <span className="font-bold text-text-muted group-hover:text-text-main">
                          {cs.name}
                        </span>
                        <span className="font-bold text-text-main bg-background px-3 py-1 rounded-lg group-hover:bg-white/10 shadow-sm">
                          ${cs.basePrice}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Services List */}
              {newService.services.length > 0 && (
                <div className="space-y-4">
                  {newService.services.map((s, idx) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center bg-surface p-5 rounded-2xl border border-primary-400/20 shadow-none transition-colors group hover:shadow-none"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-1.5 h-12 rounded-full bg-primary-600 group-hover:h-14 transition-all duration-300"></div>
                        <p className="font-bold text-text-main text-lg">
                          {s.serviceName}
                        </p>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="font-black text-text-main text-lg">
                          ${s.servicePrice}
                        </span>
                        <button
                          onClick={() => removeServiceFromList(idx)}
                          className="w-10 h-10 flex items-center justify-center rounded-xl bg-transparent text-text-muted hover:bg-red-500 hover:text-white transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* 3. Extras Card */}
            <Card className="p-8">
              <button
                onClick={() => setShowExtrasSelector(!showExtrasSelector)}
                className="w-full flex justify-between items-center group"
              >
                <h3 className="text-xl font-bold text-text-main flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-primary-400/10 flex items-center justify-center text-primary-400 ring-1 ring-primary-400/20">
                    <Crown size={20} />
                  </span>
                  Extras & Decoración
                </h3>
                <div className="p-2 rounded-full bg-background group-hover:bg-surface transition-colors">
                  <ChevronDown
                    size={24}
                    className={`text-primary-400 transition-transform duration-300 ${showExtrasSelector ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {(showExtrasSelector || newService.extras.length > 0) && (
                <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-500">
                  {/* Selector Area */}
                  {showExtrasSelector && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {catalogExtras
                        .filter((e) => e.active)
                        .map((extra) => {
                          const current = newService.extras.find(
                            (e) => e.extraId === extra.id,
                          );
                          const isActive = !!current;
                          return (
                            <div
                              key={extra.id}
                              className={`p-4 rounded-2xl border transition-all cursor-pointer hover:shadow-none ${isActive ? "border-primary-400/30 bg-primary-400/10" : "border-primary-400/20 bg-surface hover:border-primary-400/40"}`}
                            >
                              <div className="flex justify-between items-start mb-3">
                                <p
                                  className={`font-bold text-sm leading-tight ${isActive ? "text-text-main" : "text-text-muted"}`}
                                >
                                  {extra.name}
                                </p>
                                <span className="text-xs font-bold bg-surface px-2 py-1 rounded-lg border border-primary-400/20 shadow-sm text-text-muted">
                                  ${extra.priceSuggested || extra.price || 0}
                                </span>
                              </div>

                              <div className="flex items-center justify-between mt-2 bg-white/5 rounded-xl p-1.5 border border-primary-400/20">
                                <span className="text-[10px] uppercase font-bold text-text-muted pl-2">
                                  Uñas:
                                </span>
                                <input
                                  type="number"
                                  min={0}
                                  max={10}
                                  value={current?.nailsCount ?? 0}
                                  onClick={(e) => e.stopPropagation()}
                                  onChange={(e) =>
                                    updateExtraNailsCount(
                                      extra.id,
                                      parseInt(e.target.value || "0", 10),
                                    )
                                  }
                                  className="w-12 text-center font-black text-text-main bg-transparent border-b-2 border-primary-400/30 focus:border-primary-400 focus:outline-none p-1"
                                />
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}

                  {/* Selected Extras List */}
                  {newService.extras.length > 0 && (
                    <div className="space-y-3">
                      {newService.extras.map((e, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-sm p-4 bg-primary-400/10 rounded-2xl border border-primary-400/20"
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-text-main text-base">
                              {e.extraName}
                            </span>
                            <span className="text-primary-400 text-xs font-bold uppercase tracking-wide">
                              {e.nailsCount} uñas × ${e.pricePerNail}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-text-main text-lg">
                              ${e.totalPrice.toFixed(2)}
                            </span>
                            <button
                              onClick={() => removeExtraFromList(idx)}
                              className="text-text-muted hover:text-primary-700 transition-colors p-2 hover:bg-primary-700/10 rounded-lg"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Total & Pay (4 cols) */}
          <div className="xl:col-span-4">
            <Card className="p-8 sticky top-6">
              <h3 className="text-xl font-bold text-text-main mb-8">Resumen</h3>

              <div className="space-y-5 mb-10">
                <div className="flex justify-between text-base">
                  <span className="text-text-muted font-medium">
                    Servicios ({newService.services.length})
                  </span>
                  <span className="font-bold text-text-main">
                    $
                    {newService.services
                      .reduce((acc, s) => acc + s.servicePrice, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-base">
                  <span className="text-text-muted font-medium">
                    Extras ({newService.extras.length})
                  </span>
                  <span className="font-bold text-text-main">
                    $
                    {newService.extras
                      .reduce((acc, e) => acc + e.totalPrice, 0)
                      .toFixed(2)}
                  </span>
                </div>
                <div className="h-px bg-primary-400/20 my-4" />
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-text-main">
                    Total
                  </span>
                  <span className="text-4xl font-black text-text-main tracking-tight">
                    ${totalCost.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-text-muted uppercase mb-3 ml-1">
                    Método de Pago
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() =>
                        setNewService({ ...newService, paymentMethod: "cash" })
                      }
                      className={`py-4 rounded-2xl border font-bold text-sm transition-all duration-300 active:scale-95 ${
                        newService.paymentMethod === "cash"
                          ? "border-primary-400 bg-primary-400/10 text-primary-400 shadow-sm"
                          : "border-primary-400/20 bg-background text-text-muted hover:border-primary-400/50 hover:bg-surface"
                      }`}
                    >
                      Efectivo
                    </button>
                    <button
                      onClick={() =>
                        setNewService({
                          ...newService,
                          paymentMethod: "transfer",
                        })
                      }
                      className={`py-4 rounded-2xl border font-bold text-sm transition-all duration-300 active:scale-95 ${
                        newService.paymentMethod === "transfer"
                          ? "border-primary-600 bg-primary-600/10 text-primary-600 shadow-sm"
                          : "border-primary-400/20 bg-background text-text-muted hover:border-primary-600/50 hover:bg-surface"
                      }`}
                    >
                      Transferencia
                    </button>
                  </div>
                </div>

                <Button
                  variant="primary"
                  fullWidth
                  onClick={handleAddService}
                  disabled={
                    newService.client === "" ||
                    newService.services.length === 0 ||
                    isSubmitting
                  }
                  isLoading={isSubmitting}
                  className="w-full py-4 rounded-xl font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2 bg-primary-600 text-white hover:bg-primary-600/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {!isSubmitting && <Check size={24} strokeWidth={3} />}
                  Confirmar Cobro
                </Button>
              </div>
            </Card>
          </div>
        </div>

        {/* BLOQUE B: Statistics Cards - Resumen de Hoy (Moved below action buttons) */}
        <div className="my-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-none transition-all">
              <div className="absolute right-0 top-0 p-5 opacity-5 group-hover:scale-110 transition-transform">
                <Check size={80} className="text-primary-600" />
              </div>
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider">
                Servicios Hoy
              </p>
              <p className="text-5xl font-black text-text-main">
                {userServices.length}
              </p>
            </Card>
            <Card className="p-6 flex flex-col justify-between h-32 relative overflow-hidden group hover:shadow-none transition-all">
              <div className="absolute right-0 top-0 p-5 opacity-5 group-hover:scale-110 transition-transform">
                <TrendingUp size={80} className="text-primary-400" />
              </div>
              <p className="text-text-muted text-xs font-bold uppercase tracking-wider">
                Ventas Totales
              </p>
              <p className="text-5xl font-black text-text-main">
                ${totalToday.toFixed(2)}
              </p>
            </Card>
            <div className="bg-gradient-to-br from-primary-600 to-neutral-900 rounded-[2rem] shadow-none p-6 flex flex-col justify-between h-32 relative overflow-hidden text-white group">
              <div className="absolute right-0 top-0 p-5 opacity-10 group-hover:scale-110 transition-transform">
                <Crown size={80} className="text-primary-400" />
              </div>
              <p className="text-white/60 text-xs font-bold uppercase tracking-wider">
                Tu Comisión Est.
              </p>
              <p className="text-5xl font-black text-neutral-50">
                ${finalTotalCommission.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* BLOQUE C: Services List - Modern Card View (History at bottom) */}
        <div className="pt-16 pb-12">
          <div className="flex flex-col sm:flex-row justify-between items-end mb-8 gap-4">
            <h2 className="text-3xl font-black text-text-main tracking-tight">
              Mis Servicios
            </h2>

            {/* Search / Filters Condensed */}
            <div className="flex gap-2 w-full sm:w-auto">
              <div className="relative group w-full sm:w-auto">
                <Search
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary-600 transition-colors"
                  size={18}
                />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={filters.search}
                  onChange={(e) =>
                    setFilters({ ...filters, search: e.target.value })
                  }
                  className="w-full sm:w-64 pl-12 pr-6 py-3 rounded-2xl bg-surface border border-primary-400/20 transition-all duration-300 focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 outline-none shadow-none font-medium text-text-main"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-0 divide-y divide-gray-200 dark:divide-gray-700 bg-surface rounded-2xl border border-border overflow-hidden shadow-sm">
            {filteredServices.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Sin servicios"
                message="Tus servicios realizados aparecerán aquí."
              />
            ) : (
              <>
                {filteredServices
                  .slice()
                  .reverse()
                  .slice((filters.page || 0) * 10, ((filters.page || 0) + 1) * 10)
                  .map((service) => {
                    const serviceDate =
                      service.timestamp && typeof service.timestamp.toDate === "function"
                        ? service.timestamp.toDate()
                        : new Date(service.date + "T00:00:00");

                    const day = serviceDate.getDate();
                    const month = serviceDate.toLocaleString('es-ES', { month: 'short' });
                    // const displayDate = `${day} ${month}`; 

                    return (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 hover:bg-surface-highlight transition-colors group cursor-default"
                      >
                        {/* 1. Fecha (Izquierda) */}
                        <div className="flex flex-col w-12 text-center mr-3 border-r border-border/50 pr-3 items-center justify-center">
                          <span className="text-lg font-black text-text-main leading-none">
                            {day}
                          </span>
                          <span className="text-[10px] font-bold text-text-muted uppercase leading-none mt-1">
                            {month.replace('.', '')}
                          </span>
                        </div>

                        {/* 2. Detalles (Centro) */}
                        <div className="flex-1 min-w-0 flex flex-col mr-4">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-text-main truncate">
                              {service.client || "Cliente"}
                            </span>
                          </div>
                          <span className="text-xs text-text-muted truncate flex items-center gap-1">
                            {service.services?.[0]?.serviceName || "Servicio"}
                            {service.services && service.services.length > 1 && (
                               <span className="font-semibold text-text-main">
                                 +{service.services.length - 1}
                               </span>
                             )}
                            {service.extras && service.extras.length > 0 && (
                              <span className="text-primary-600 dark:text-primary-400 font-medium ml-1">
                                (+ {service.extras.length} extras)
                              </span>
                            )}
                          </span>
                        </div>

                        {/* 3. Precio (Derecha) */}
                        <div className="text-right pl-2 flex flex-col items-end gap-1">
                          <span className="block text-sm font-black text-emerald-600 dark:text-emerald-400 px-2 py-0 rounded-lg">
                            ${Number(service.cost).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Pagination Controls */}
                  {filteredServices.length > 10 && (
                    <div className="p-4 flex justify-between items-center bg-surface-highlight/20 border-t border-border">
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, page: Math.max(0, (prev.page || 0) - 1) }))}
                            disabled={!filters.page || filters.page === 0}
                            className="text-sm font-bold text-text-muted hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1"
                        >
                            Anterior
                        </button>
                        <span className="text-xs text-text-muted font-medium">
                            Página {(filters.page || 0) + 1} de {Math.ceil(filteredServices.length / 10)}
                        </span>
                        <button
                            onClick={() => setFilters(prev => ({ ...prev, page: Math.min(Math.ceil(filteredServices.length / 10) - 1, (prev.page || 0) + 1) }))}
                            disabled={(filters.page || 0) >= Math.ceil(filteredServices.length / 10) - 1}
                            className="text-sm font-bold text-text-muted hover:text-text-main disabled:opacity-30 disabled:cursor-not-allowed px-3 py-1"
                        >
                            Siguiente
                        </button>
                    </div>
                  )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffScreen;
