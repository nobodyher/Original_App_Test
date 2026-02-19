import React, { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isToday,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  ShoppingBag,
  Check,
  Search,
  Users,
  Calendar as CalendarIcon,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { UserAvatar } from "../../../components/ui/UserAvatar";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";

import { useSalonContext } from "../../../context/SalonContext";

export default function HistoryTab() {
  const { 
    services, 
    historyServices, 
    loadHistory, 
    loadingHistory, 
    historyFullyLoaded,
    users,
    catalogServices,
    restoreDeletedService,
    permanentlyDeleteService,
    softDeleteService,
    showNotification,
    currentUser,
  } = useSalonContext();

  const allTransactions = useMemo(() => {
    // Combine recent and history services, avoiding duplicates just in case
    const recentIds = new Set(services.map(s => s.id));
    const uniqueHistory = historyServices.filter(s => !recentIds.has(s.id));
    return [...services, ...uniqueHistory];
  }, [services, historyServices]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isEmployeeFilterOpen, setIsEmployeeFilterOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeleted, setShowDeleted] = useState(false);
  
  // Confirmation Modal State
  type HistoryAction = {
    type: "restore" | "permanent_delete" | "soft_delete";
    id: string;
    name: string;
  } | null;
  const [actionToConfirm, setActionToConfirm] = useState<HistoryAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination State
  const [historyPage, setHistoryPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Reset pagination when filters change
  React.useEffect(() => {
    setHistoryPage(1);
  }, [currentMonth, selectedDate, selectedEmployeeIds, searchQuery, showDeleted]);

  // --- Lógica de Filtrado de Servicios (Eliminados del Catálogo) ---
  const activeServices = useMemo(() => {
    // Mapa de IDs y Nombres activos
    const validServiceIds = new Set(
      catalogServices.filter((cs) => cs.active).map((cs) => cs.id),
    );
    const validServiceNames = new Set(
      catalogServices.filter((cs) => cs.active).map((cs) => cs.name),
    );

    return allTransactions.filter((transaction) => {
      // 1. Filtrar transacciones según el modo de visualización
      if (showDeleted) {
        // Modo: Ver solo eliminados
        if (!transaction.deleted) return false;
      } else {
        // Modo: Ver solo activos
        if (transaction.deleted) return false;
      }

      // 2. Filtrar transacciones de servicios inactivos en catálogo (solo en modo activos)
      if (!showDeleted) {
        // Si tiene items (estructura nueva)
        if (transaction.services && transaction.services.length > 0) {
          return transaction.services.every((item) =>
            validServiceIds.has(item.serviceId),
          );
        }
        // Si es estructura antigua (solo nombre)
        if (transaction.service) {
          return validServiceNames.has(transaction.service);
        }
      }
      return true; // Si no tiene info de servicio, lo dejamos (o false segun preferencia, asumimos true para "otros")
    });
  }, [allTransactions, catalogServices, showDeleted]);

  // --- Lógica del Calendario ---
  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const daysWithActivity = useMemo(() => {
    const activitySet = new Set<string>();
    activeServices.forEach((s) => {
      // Use local date string if timestamp exists, otherwise fallback to s.date
      const dateKey = s.timestamp ? s.timestamp.toDate().toLocaleDateString() : s.date; 
      activitySet.add(dateKey);
    });
    return activitySet;
  }, [activeServices]);

  // --- Lógica de Filtrado (Vista) ---
  const filteredServices = useMemo(() => {
    return activeServices
      .filter((s) => {
        // Fix: Use local date string comparison to avoid UTC timezone issues
        // This ensures that if a user records a service on the 14th PM local time (15th UTC),
        // it still appears on the 14th filter.
        let serviceDate = s.date; // Fallback
        if (s.timestamp) {
           serviceDate = s.timestamp.toDate().toLocaleDateString();
        }
        const selectedDateStr = selectedDate.toLocaleDateString();
        
        const matchesDate = serviceDate === selectedDateStr;
        
        // Search Filter Logic
        // Clean search term: trim and remove @
        const searchClean = searchQuery.toLowerCase().trim().replace(/@/g, "");
        
        const serviceName = (s.service || "").toLowerCase();
        // Clean client name: remove @
        const clientNameClean = (s.client || "").toLowerCase().replace(/@/g, "");
        const staffName = (users.find(u => u.id === s.userId)?.name || "").toLowerCase();

        const matchesSearch = !searchClean || 
          serviceName.includes(searchClean) || 
          clientNameClean.includes(searchClean) || 
          staffName.includes(searchClean);

        const matchesEmployee =
          selectedEmployeeIds.length === 0 ||
          selectedEmployeeIds.includes(s.userId);
          
        return matchesDate && matchesEmployee && matchesSearch;
      })
      .sort((a, b) => {
        // Ordenar por timestamp si existe, sino por fecha string
        if (a.timestamp && b.timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds;
        }
        return 0;
      });
  }, [activeServices, selectedDate, selectedEmployeeIds, searchQuery, users]);

  const paginatedServices = useMemo(() => {
    const start = (historyPage - 1) * ITEMS_PER_PAGE;
    return filteredServices.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredServices, historyPage]);

  const totalAmount = filteredServices.reduce(
    (sum, s) => sum + Number(s.cost),
    0,
  );

  // --- Handlers ---
  const toggleEmployee = (id: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id],
    );
  };

  const isLastPageLocal = historyPage * ITEMS_PER_PAGE >= filteredServices.length;
  const canLoadMore = !historyFullyLoaded;

  const handleNextPage = async () => {
    if (!isLastPageLocal) {
      setHistoryPage((p) => p + 1);
    } else if (canLoadMore && !loadingHistory) {
      // Load more data
      await loadHistory();
      // We don't auto-advance here strictly because filters might hide new items.
      // But if the user intent was to see "more", and we loaded more, 
      // they can click again if valid, or we can rely on the user seeing new items if they appear.
      // However, usually "Next" implies "Go to next page". 
      // If we loaded data but list size didn't increase enough for a new page, staying here is correct.
      // If it DID increase, the user can now click Next again (or we could auto-advance).
      // For simplicity/stability, we'll just load. The UI will update showing we are no longer at "end" if new items appeared matching filters.
      // Better UX: Try to advance if possible?
      // let's just trigger load.
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || "??";
  };

  const getUserPhoto = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.photoURL || null;
  };

  // --- Action Handlers ---
  const handleRestore = (serviceId: string, serviceName: string) => {
    setActionToConfirm({ type: "restore", id: serviceId, name: serviceName });
  };

  const handlePermanentDelete = (serviceId: string, serviceName: string) => {
    setActionToConfirm({ type: "permanent_delete", id: serviceId, name: serviceName });
  };

  const handleSoftDelete = (serviceId: string, serviceName: string) => {
    setActionToConfirm({ type: "soft_delete", id: serviceId, name: serviceName });
  };

  const handleConfirmAction = async () => {
    if (!actionToConfirm || !currentUser) return;

    setIsSubmitting(true);
    try {
      if (actionToConfirm.type === "restore") {
        await restoreDeletedService(actionToConfirm.id);
        showNotification?.("Servicio restaurado correctamente", "success");
      } else if (actionToConfirm.type === "permanent_delete") {
        // Security: Verify tenantId
        const serviceToDelete = allTransactions.find(s => s.id === actionToConfirm.id);
        if (serviceToDelete && serviceToDelete.tenantId !== currentUser.tenantId) {
          showNotification?.("No tienes permisos para eliminar este servicio", "error");
          setActionToConfirm(null);
          setIsSubmitting(false);
          return;
        }

        await permanentlyDeleteService(actionToConfirm.id);
        showNotification?.("Servicio eliminado permanentemente", "success");
      } else if (actionToConfirm.type === "soft_delete") {
        await softDeleteService(actionToConfirm.id, currentUser.id);
        showNotification?.("Servicio eliminado del historial", "success");
      }
      setActionToConfirm(null);
    } catch (error) {
      console.error("Error in action:", error);
      showNotification?.("Error al procesar la acción", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalProps = () => {
    if (!actionToConfirm) return { title: "", message: "" };

    if (actionToConfirm.type === "restore") {
      return {
        title: "Restaurar Servicio",
        message: `¿Estás seguro de que deseas restaurar "${actionToConfirm.name}"? El servicio volverá a aparecer en tu historial activo y se incluirá en las estadísticas.`,
        variant: "info" as const,
      };
    }

    if (actionToConfirm.type === "soft_delete") {
      return {
        title: "Eliminar Servicio",
        message: `¿Estás seguro de que deseas eliminar "${actionToConfirm.name}"? El servicio se moverá a la papelera y podrás restaurarlo después si lo necesitas.`,
        variant: "danger" as const,
      };
    }

    return {
      title: "Eliminar Permanentemente",
      message: `¿Estás seguro de que deseas eliminar "${actionToConfirm.name}" permanentemente? Esta acción no se puede deshacer y el registro desaparecerá completamente de las estadísticas.`,
      variant: "danger" as const,
    };
  };

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in text-text-main">
      {/* ... Header ... */}


      {/* --- HEADER --- */}
      <div className="border-b border-border bg-surface flex flex-col md:flex-row items-center justify-between py-6 px-4 md:px-8 shrink-0 relative z-40 gap-4 md:h-20 md:rounded-xl md:border md:mx-6 md:mt-4">
        <div className="flex items-center gap-2 w-full md:w-auto md:gap-4">
          {/* Search Input */}
          <div className="relative flex-1 md:w-64 md:flex-none">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none">
              <Search size={16} />
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-surface-highlight border border-border rounded-xl pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-text-muted/70"
            />
          </div>

          {/* Employee Filter - Relocated to Header */}
          <div className="relative">
             <button
               onClick={() => setIsEmployeeFilterOpen(!isEmployeeFilterOpen)}
               className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
                 selectedEmployeeIds.length > 0
                   ? "bg-primary-500 text-black border-primary-500 shadow-lg shadow-primary-500/20"
                   : "bg-surface-highlight text-text-muted hover:text-text-main border-border"
               }`}
             >
               <Users size={16} />
               <span className="hidden md:inline">
                 {selectedEmployeeIds.length === 0
                   ? "Filtrar por Estilista"
                   : `${selectedEmployeeIds.length} Seleccionados`}
               </span>
               <span className="md:hidden">
                 {selectedEmployeeIds.length > 0 ? selectedEmployeeIds.length : ""}
               </span>
             </button>

             {/* Dropdown */}
             {isEmployeeFilterOpen && (
               <>
                 <div
                   className="fixed inset-0 z-10"
                   onClick={() => setIsEmployeeFilterOpen(false)}
                 />
                 <div className="absolute top-full right-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl z-50 overflow-hidden transform transition-all">
                   <div className="p-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
                     {users.map((user) => (
                       <button
                         key={user.id}
                         onClick={() => toggleEmployee(user.id)}
                         className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                       >
                         <div className="flex items-center gap-3">
                           <div
                             className={`w-2 h-2 rounded-full bg-gradient-to-r ${user.color}`}
                           />
                           <span className="text-sm font-medium text-text-main">
                             {user.name}
                           </span>
                         </div>
                         {selectedEmployeeIds.includes(user.id) && (
                           <Check size={16} className="text-primary-500" />
                         )}
                       </button>
                     ))}
                   </div>
                 </div>
               </>
             )}
          </div>

          {/* Deleted Items Toggle */}
          <button
            onClick={() => setShowDeleted(!showDeleted)}
            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              showDeleted
                ? "bg-red-500 text-white border-red-500 shadow-lg shadow-red-500/20"
                : "bg-surface-highlight text-text-muted hover:text-text-main border-border"
            }`}
            title={showDeleted ? "Ver servicios activos" : "Ver servicios eliminados"}
          >
            <Trash2 size={16} />
            <span className="hidden md:inline">
              {showDeleted ? "Eliminados" : "Ver Eliminados"}
            </span>
          </button>
        </div>

        {/* Total del día */}
        <div className="w-full md:w-auto flex flex-col items-center justify-center text-center md:items-end md:text-right mt-2 md:mt-0">
          <span className="text-xs text-text-muted uppercase font-bold tracking-wider">
            Total Ventas
          </span>
          <span className="text-2xl md:text-4xl font-black text-primary-500">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* --- BODY --- */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative items-start">
        {/* COLUMNA 1: FILTROS & CALENDARIO */}
        <div className="w-full md:w-[400px] flex flex-col shrink-0 relative z-30 md:sticky md:top-4 md:self-start h-fit bg-transparent">
          
          {/* Calendar Card Container */}
          <div className="bg-surface border border-border rounded-xl shadow-sm overflow-hidden mx-4 mt-4 md:mx-0 md:mt-0 md:mr-6">
            <div className="pt-4 pb-2 px-4 md:p-6 border-b border-border flex items-center justify-between bg-surface relative z-10">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-white transition flex-shrink-0"
              >
                <ChevronLeft size={20} />
              </button>

              <div 
                className="flex flex-col items-center justify-center mx-4 cursor-pointer hover:bg-white/5 px-4 py-1 rounded-lg transition-colors"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <span className="text-lg font-bold capitalize leading-none text-text-main flex items-center gap-2">
                  {format(currentMonth, "MMMM", { locale: es })}
                  <span className={`text-[10px] md:hidden transform transition-transform ${showCalendar ? 'rotate-180' : ''}`}>▼</span>
                </span>
                <span className="text-xs text-text-muted font-medium leading-none mt-1">
                  {format(currentMonth, "yyyy")}
                </span>
              </div>

              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-white transition flex-shrink-0"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Grid Semanal (Collapsible on Mobile) */}
            <div className={`
               md:block bg-surface
               ${showCalendar ? 'absolute top-full left-0 w-full shadow-2xl border-b border-border z-50 p-6 animate-in slide-in-from-top-5' : 'hidden md:block p-6 overflow-y-auto'}
            `}>
            <div className="grid grid-cols-7 mb-4">
              {["L", "M", "M", "J", "V", "S", "D"].map((d, i) => (
                <div
                  key={`${d}-${i}`}
                  className="text-center text-xs font-bold text-text-muted opacity-50"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day) => {
                // Fix: Use local date string for key matching
                const dateKey = day.toLocaleDateString();
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const hasActivity = daysWithActivity.has(dateKey);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => {
                      setSelectedDate(day);
                      setShowCalendar(false); // Close on select (mobile)
                    }}
                    className={`
                      relative aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${!isCurrentMonth ? "text-text-muted/20" : ""}
                      ${
                        isSelected
                          ? "bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 scale-105"
                          : "text-text-muted hover:bg-white/5 hover:text-text-main"
                      }
                      ${
                        isTodayDate && !isSelected
                          ? "ring-1 ring-primary-500/50 text-primary-500"
                          : ""
                      }
                    `}
                  >
                    {format(day, "d")}

                    {/* Activity Dot */}
                    {hasActivity && (
                      <div
                        className={`absolute bottom-2 w-1 h-1 rounded-full ${isSelected ? "bg-black" : "bg-cyan-400"}`}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          </div>

          {/* Load History Button */}

        </div>

        {/* COLUMNA 2: LISTA DE SERVICIOS */}
        <div className="flex-1 bg-background p-4 md:p-8 overflow-y-auto w-full">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-xl md:text-2xl font-bold text-text-main mb-4 md:mb-6 flex items-center gap-3">
              <CalendarIcon className="text-primary-500" />
              {format(selectedDate, "EEEE, d 'de' MMMM", { locale: es })}
            </h3>

            {filteredServices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-text-muted/50">
                <ShoppingBag
                  size={64}
                  strokeWidth={1}
                  className="mb-4 opacity-50"
                />
                <p className="text-xl font-medium">Sin actividad este día</p>
                <p className="text-sm">
                  No se encontraron servicios registrados para esta fecha.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-border bg-surface">
                <table className="w-full table-fixed">
                  <thead className="bg-surface-highlight border-b border-border">
                    <tr>
                      <th className="w-[60px] md:w-32 px-1 py-2 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
                        <span className="md:hidden">Día</span>
                        <span className="hidden md:inline">Fecha</span>
                      </th>
                      <th className="w-auto px-2 py-2 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                        Servicio
                      </th>
                      <th className="w-20 md:w-28 px-2 py-2 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                        Total
                      </th>
                      {/* Acciones column: delete for active, restore/perm-delete for deleted */}
                      <th className="w-14 md:w-20 px-2 py-2 text-center text-xs font-bold text-text-muted uppercase tracking-wider">
                        {showDeleted ? "Acciones" : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginatedServices.map((service) => {
                      const dateObj = service.timestamp 
                        ? service.timestamp.toDate() 
                        : new Date(service.date + "T00:00:00");
                        
                      return (
                        <tr 
                          key={service.id} 
                          className={`transition-colors ${
                            showDeleted 
                              ? "bg-red-500/5 border-red-500/20 opacity-75 hover:bg-red-500/10" 
                              : "hover:bg-surface-highlight/50"
                          }`}
                        >
                          {/* Fecha */}
                          <td className="px-1 py-3 text-center align-middle">
                             {/* MÓVIL: Stacked */}
                             <div className="flex flex-col items-center justify-center md:hidden leading-tight">
                                <span className="text-base font-bold text-text-main">
                                    {format(dateObj, 'dd')}
                                </span>
                                <span className="text-[10px] uppercase text-text-muted font-bold">
                                    {format(dateObj, 'MMM', { locale: es }).replace('.', '')}
                                </span>
                             </div>
                             {/* PC: Fecha Completa */}
                             <div className="hidden md:block text-sm text-text-muted">
                                {format(dateObj, 'dd/MM/yyyy')}
                             </div>
                          </td>

                          {/* Servicios */}
                          <td className="px-2 py-3 align-middle">
                            <div className="flex items-center gap-3">
                               <div className="shrink-0">
                                  <UserAvatar
                                    image={getUserPhoto(service.userId)}
                                    name={getUserName(service.userId)}
                                    size="w-8 h-8"
                                  />
                               </div>
                               <div className="min-w-0 flex-1 overflow-hidden">
                                  <p className="text-sm font-bold text-text-main truncate">
                                     {service.service}
                                  </p>
                                  <div className="flex items-center gap-1 text-xs text-text-muted mt-0.5 truncate">
                                     <span className="text-primary-400 font-medium">{(service.client || "").replace(/@/g, "")}</span>
                                     <span>•</span>
                                     <span className="capitalize">{service.paymentMethod === "cash" ? "Efect." : "Trans."}</span>
                                  </div>
                               </div>
                            </div>
                          </td>

                          {/* Precio */}
                          <td className="px-2 py-3 text-right align-middle">
                             <span className="block text-sm md:text-base font-bold text-text-main">
                               ${service.cost}
                             </span>
                             {service.services && service.services.length > 1 && (
                               <span className="text-[10px] text-text-muted inline-block bg-surface-highlight px-1.5 py-0.5 rounded-full mt-1">
                                 {service.services.length} it.
                               </span>
                             )}
                          </td>

                          {/* Action Buttons: always show delete for active, restore/perm-delete for deleted */}
                          <td className="px-2 py-3 text-center align-middle">
                            {showDeleted ? (
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  onClick={() => handleRestore(service.id, service.service || "Servicio")}
                                  className="p-2 rounded-lg bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 text-green-500 transition-all hover:shadow-md hover:shadow-green-500/20"
                                  title="Restaurar servicio"
                                >
                                  <RefreshCw size={16} />
                                </button>
                                <button
                                  onClick={() => handlePermanentDelete(service.id, service.service || "Servicio")}
                                  className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 transition-all hover:shadow-md hover:shadow-red-500/20"
                                  title="Eliminar permanentemente"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleSoftDelete(service.id, service.service || "Servicio")}
                                className="p-2 rounded-lg text-text-muted hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 border border-transparent transition-all"
                                title="Eliminar servicio"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>


          {/* Pagination Controls */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-border mt-4">
            <span className="text-xs text-text-muted font-medium">
              Mostrando {Math.min((historyPage - 1) * ITEMS_PER_PAGE + 1, filteredServices.length)} - {Math.min(historyPage * ITEMS_PER_PAGE, filteredServices.length)} de {filteredServices.length}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                disabled={historyPage === 1}
                className="p-2 rounded-lg hover:bg-surface-highlight disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-text-muted"
              >
                <ChevronLeft size={20} />
              </button>
              <span className="flex items-center justify-center px-3 font-bold text-text-main">
                {historyPage}
              </span>
              <button
                onClick={handleNextPage}
                disabled={loadingHistory || (isLastPageLocal && !canLoadMore)}
                className="p-2 rounded-lg hover:bg-surface-highlight disabled:opacity-30 disabled:hover:bg-transparent transition-colors text-text-muted flex items-center gap-1"
              >
                {loadingHistory ? (
                   <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                   <ChevronRight size={20} />
                )}
              </button>
            </div>
          </div>
        </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!actionToConfirm}
        onClose={() => setActionToConfirm(null)}
        onConfirm={handleConfirmAction}
        title={getModalProps().title}
        message={getModalProps().message}
        variant={getModalProps().variant}
        isLoading={isSubmitting}
      />
      </div>
    </div>
  );
}
