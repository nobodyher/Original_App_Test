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
  Clock,
  Check,
} from "lucide-react";
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
    activeServices.forEach((s) => activitySet.add(s.date)); // s.date es YYYY-MM-DD
    return activitySet;
  }, [activeServices]);

  // --- Lógica de Filtrado (Vista) ---
  const filteredServices = useMemo(() => {
    const dateStr = format(selectedDate, "yyyy-MM-dd");
    return activeServices
      .filter((s) => {
        const matchesDate = s.date === dateStr;
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

  const getUserColor = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.color || "bg-gray-500";
  };

  const getUserName = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    return user?.name || "??";
  };

  return (
    <div className="flex flex-col h-full bg-background animate-fade-in text-text-main">
      {/* --- HEADER --- */}
      <div className="h-20 border-b border-border bg-surface flex items-center justify-between px-8 shrink-0 relative z-20">
        <div className="flex items-center gap-6">
          {/* Employee Filter */}
          <div className="relative">
            <button
              onClick={() => setIsEmployeeFilterOpen(!isEmployeeFilterOpen)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedEmployeeIds.length > 0
                  ? "bg-primary-500 text-black shadow-lg shadow-primary-500/20"
                  : "bg-surface-highlight text-text-muted hover:text-text-main border border-border"
              }`}
            >
              <Users size={18} />
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
                <div className="absolute top-full left-0 mt-2 w-64 bg-surface border border-border rounded-xl shadow-2xl z-20 overflow-hidden transform transition-all">
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

          <div className="h-8 w-px bg-border/50" />

          {/* Resumen Simple */}
          <div className="flex items-center gap-2 text-text-muted">
            <span className="font-bold text-text-main text-lg">
              {filteredServices.length}
            </span>
            <span className="text-sm">servicios encontrados</span>
          </div>
        </div>

        {/* Total del día (Opcional) */}
        <div className="flex flex-col items-end">
          <span className="text-xs text-text-muted uppercase font-bold tracking-wider">
            Total Ventas
          </span>
          <span className="text-xl font-black text-primary-500">
            ${totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* --- BODY --- */}
      <div className="flex flex-1 overflow-hidden">
        {/* COLUMNA 1: CALENDARIO */}
        <div className="w-[400px] bg-surface border-r border-border flex flex-col shrink-0">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-bold capitalize text-text-main">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h2>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-white transition"
              >
                <ChevronLeft size={20} />
              </button>
              <button
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 hover:bg-white/5 rounded-full text-text-muted hover:text-white transition"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          {/* Grid Semanal */}
          <div className="p-6 overflow-y-auto">
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
                const dateKey = format(day, "yyyy-MM-dd");
                const isSelected = isSameDay(day, selectedDate);
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const hasActivity = daysWithActivity.has(dateKey);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={day.toISOString()}
                    onClick={() => setSelectedDate(day)}
                    className={`
                      relative aspect-square rounded-full flex items-center justify-center text-sm font-medium transition-all
                      ${!isCurrentMonth ? "text-text-muted/20" : ""}
                      ${
                        isSelected
                          ? "bg-primary-500 text-black font-bold shadow-lg shadow-primary-500/20 scale-105"
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
        <div className="flex-1 bg-background p-8 overflow-y-auto">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl font-bold text-text-main mb-6 flex items-center gap-3">
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
              <div className="grid gap-4">
                {filteredServices.map((service) => (
                  <div
                    key={service.id}
                    className="group bg-surface hover:bg-surface-highlight border border-border rounded-2xl p-4 flex items-center justify-between transition-all duration-300 hover:shadow-lg hover:border-primary-500/20"
                  >
                    <div className="flex items-center gap-5">
                      {/* Hora */}
                      <div className="w-16 flex flex-col items-center justify-center border-r border-border/50 pr-4">
                        <span className="text-sm font-bold text-text-main">
                          {service.timestamp
                            ? format(service.timestamp.toDate(), "HH:mm")
                            : "--:--"}
                        </span>
                        <Clock size={12} className="text-text-muted mt-1" />
                      </div>

                      {/* Info Principal */}
                      <div className="flex items-center gap-4">
                        {/* Avatar del empleado */}
                        <div
                          className={`w-10 h-10 rounded-full bg-gradient-to-br ${getUserColor(service.userId)} p-0.5 shadow-sm`}
                          title={getUserName(service.userId)}
                        >
                          <div className="w-full h-full bg-surface rounded-full flex items-center justify-center text-xs font-bold text-white uppercase">
                            {getUserName(service.userId).substring(0, 2)}
                          </div>
                        </div>

                        <div>
                          <h4 className="font-bold text-text-main text-lg">
                            {service.service}
                          </h4>
                          <div className="flex items-center gap-2 text-xs text-text-muted">
                            <span className="font-medium text-primary-400">
                              @{service.client}
                            </span>
                            <span>•</span>
                            <span className="capitalize">
                              {service.paymentMethod === "cash"
                                ? "Efectivo"
                                : "Transferencia"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Precio */}
                    <div className="text-right pl-4">
                      <span className="block text-xl font-black text-text-main">
                        ${service.cost}
                      </span>
                      {service.services && service.services.length > 1 && (
                        <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">
                          {service.services.length} items
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
