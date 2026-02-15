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
  Users,
  Calendar as CalendarIcon,
  ShoppingBag,
  Check,
} from "lucide-react";
import { UserAvatar } from "../../../components/ui/UserAvatar";
import type { Service, AppUser, CatalogService } from "../../../types";

interface HistoryTabProps {
  services: Service[];
  users: AppUser[];
  catalogServices: CatalogService[];
}

export default function HistoryTab({
  services,
  users,
  catalogServices,
}: HistoryTabProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [isEmployeeFilterOpen, setIsEmployeeFilterOpen] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);

  // --- Lógica de Filtrado de Servicios (Eliminados del Catálogo) ---
  const activeServices = useMemo(() => {
    // Mapa de IDs y Nombres activos
    const validServiceIds = new Set(
      catalogServices.filter((cs) => cs.active).map((cs) => cs.id),
    );
    const validServiceNames = new Set(
      catalogServices.filter((cs) => cs.active).map((cs) => cs.name),
    );

    return services.filter((transaction) => {
      // 1. Filtrar transacciones eliminadas (soft delete)
      if (transaction.deleted) return false;

      // 2. Filtrar transacciones de servicios inactivos en catálogo
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
      return true; // Si no tiene info de servicio, lo dejamos (o false segun preferencia, asumimos true para "otros")
    });
  }, [services, catalogServices]);

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
        const matchesEmployee =
          selectedEmployeeIds.length === 0 ||
          selectedEmployeeIds.includes(s.userId);
        return matchesDate && matchesEmployee;
      })
      .sort((a, b) => {
        // Ordenar por timestamp si existe, sino por fecha string
        if (a.timestamp && b.timestamp) {
          return b.timestamp.seconds - a.timestamp.seconds;
        }
        return 0;
      });
  }, [activeServices, selectedDate, selectedEmployeeIds]);

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



  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || "??";
  };

  const getUserPhoto = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.photoURL || null;
  };

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in text-text-main">
      {/* --- HEADER --- */}
      <div className="border-b border-border bg-surface flex flex-col md:flex-row items-center justify-between p-4 md:px-8 shrink-0 relative z-20 gap-4 md:h-20">
        <div className="flex items-center gap-6 w-full md:w-auto">
          {/* Employee Filter */}
          <div className="relative w-full md:w-auto">
            <button
              onClick={() => setIsEmployeeFilterOpen(!isEmployeeFilterOpen)}
              className={`flex items-center justify-center gap-2 px-4 py-1.5 rounded-xl text-sm font-semibold transition-all w-full md:w-auto ${
                selectedEmployeeIds.length > 0
                  ? "bg-primary-500 text-black shadow-lg shadow-primary-500/20"
                  : "bg-surface-highlight text-text-muted hover:text-text-main border border-border"
              }`}
            >
              <Users size={16} />
              {selectedEmployeeIds.length === 0
                ? "Filtrar por Estilista"
                : `${selectedEmployeeIds.length} Seleccionados`}
            </button>

            {/* Dropdown */}
            {isEmployeeFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsEmployeeFilterOpen(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-full md:w-64 bg-surface border border-border rounded-xl shadow-2xl z-20 overflow-hidden transform transition-all">
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
        </div>

        {/* Total del día */}
        <div className="w-full md:w-auto flex flex-col items-center justify-center text-center md:items-end md:text-right">
          <span className="text-xs text-text-muted uppercase font-bold tracking-wider">
            Total Ventas
          </span>
          <span className="text-2xl md:text-4xl font-black text-primary-500">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* --- BODY --- */}
      <div className="flex flex-1 flex-col md:flex-row overflow-hidden relative">
        {/* COLUMNA 1: CALENDARIO */}
        <div className="w-full md:w-[400px] bg-surface border-b md:border-b-0 md:border-r border-border flex flex-col shrink-0 relative z-30">
          <div className="p-4 md:p-6 border-b border-border flex items-center justify-between bg-surface relative z-10">
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
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredServices.map((service) => {
                      const dateObj = service.timestamp 
                        ? service.timestamp.toDate() 
                        : new Date(service.date + "T00:00:00");
                        
                      return (
                        <tr key={service.id} className="hover:bg-surface-highlight/50 transition-colors">
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
                                     <span className="text-primary-400 font-medium">@{service.client}</span>
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
