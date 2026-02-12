import React, { useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { Service } from "../../../types";

interface AnalyticsTabProps {
  services: Service[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ services }) => {
  const [analyticsFilter, setAnalyticsFilter] = useState<
    "week" | "month" | "year" | "custom"
  >("week");
  const [customDateFrom, setCustomDateFrom] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [customDateTo, setCustomDateTo] = useState(
    new Date().toISOString().split("T")[0],
  );

  // Calcular rango de fechas según filtro
  const getDateRange = () => {
    const today = new Date();
    let from = new Date();
    let to = new Date(today);

    switch (analyticsFilter) {
      case "week": {
        from = new Date(today);
        // Calcular el lunes de la semana actual
        const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si es domingo, retroceder 6 días
        from.setDate(today.getDate() - daysToMonday);

        // Calcular el domingo de la semana actual
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        break;
      }
      case "month":
        from = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case "year":
        from = new Date(today.getFullYear(), 0, 1);
        break;
      case "custom":
        from = new Date(customDateFrom);
        to = new Date(customDateTo);
        break;
    }

    return {
      from: from.toISOString().split("T")[0],
      to: to.toISOString().split("T")[0],
    };
  };

  const dateRange = getDateRange();

  // Filtrar servicios en el rango
  const filteredServices = services.filter((s) => {
    if (s.deleted) return false;
    return s.date >= dateRange.from && s.date <= dateRange.to;
  });

  // Calcular datos por día de semana
  const weekdayData = {
    Lunes: { revenue: 0, services: 0 },
    Martes: { revenue: 0, services: 0 },
    Miércoles: { revenue: 0, services: 0 },
    Jueves: { revenue: 0, services: 0 },
    Viernes: { revenue: 0, services: 0 },
    Sábado: { revenue: 0, services: 0 },
    Domingo: { revenue: 0, services: 0 },
  };

  const weekdayNames = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];

  filteredServices.forEach((s) => {
    const date = new Date(s.date);
    // getDay() returns 0 for Sunday, so we map correctly
    const dayName = weekdayNames[date.getDay()];
    // weekdayData keys are Spanish names corresponding to weekdayNames
    if (weekdayData[dayName as keyof typeof weekdayData]) {
      weekdayData[dayName as keyof typeof weekdayData].revenue += s.cost;
      weekdayData[dayName as keyof typeof weekdayData].services += 1;
    }
  });

  // Calcular métricas
  const totalIncome = filteredServices.reduce((sum, s) => sum + s.cost, 0);
  const totalServices = filteredServices.length;
  const averageTicket = totalServices > 0 ? totalIncome / totalServices : 0;

  // Empleada con más ingresos
  const staffStats: Record<string, { revenue: number; services: number }> = {};
  filteredServices.forEach((s) => {
    if (!staffStats[s.userName]) {
      staffStats[s.userName] = { revenue: 0, services: 0 };
    }
    staffStats[s.userName].revenue += s.cost;
    staffStats[s.userName].services += 1;
  });

  const topStaff = Object.entries(staffStats).sort(
    ([, a], [, b]) => b.revenue - a.revenue,
  )[0];

  // Servicio más vendido
  const serviceStats: Record<string, { count: number; revenue: number }> = {};
  filteredServices.forEach((s) => {
    const serviceName =
      s.services?.[0]?.serviceName || s.service || "Sin especificar";
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = { count: 0, revenue: 0 };
    }
    serviceStats[serviceName].count += 1;
    serviceStats[serviceName].revenue += s.cost;
  });

  const topService = Object.entries(serviceStats).sort(
    ([, a], [, b]) => b.count - a.count,
  )[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Filtros */}
      <div className="bg-surface rounded-2xl shadow-none p-6 border border-border">
        <h3 className="text-xl font-black text-text-main mb-6 tracking-tight">
          Filtros de Análisis
        </h3>
        <div className="flex flex-wrap gap-3 mb-6">
          {(["week", "month", "year", "custom"] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setAnalyticsFilter(filterType)}
              className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 transform active:scale-95 ${
                analyticsFilter === filterType
                  ? "bg-primary-600 text-white shadow-none"
                  : "bg-background text-text-muted hover:bg-surface hover:text-primary-600 border border-transparent hover:border-primary-600/20"
              }`}
            >
              {filterType === "week" && "Esta Semana"}
              {filterType === "month" && "Este Mes"}
              {filterType === "year" && "Este Año"}
              {filterType === "custom" && "Personalizado"}
            </button>
          ))}
        </div>

        {analyticsFilter === "custom" && (
          <div className="flex flex-wrap gap-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-text-muted uppercase ml-1">
                Desde
              </span>
              <input
                type="date"
                value={customDateFrom}
                onChange={(e) => setCustomDateFrom(e.target.value)}
                className="px-4 py-2 border border-border rounded-xl focus:border-primary-600 focus:outline-none bg-background font-semibold text-text-main"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-text-muted uppercase ml-1">
                Hasta
              </span>
              <input
                type="date"
                value={customDateTo}
                onChange={(e) => setCustomDateTo(e.target.value)}
                className="px-4 py-2 border border-border rounded-xl focus:border-primary-600 focus:outline-none bg-background font-semibold text-text-main"
              />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-primary-600 animate-pulse"></div>
          <p className="text-sm font-medium text-text-muted">
            Mostrando datos del:{" "}
            <strong className="text-text-main">{dateRange.from}</strong> al{" "}
            <strong className="text-text-main">{dateRange.to}</strong>
          </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Income - Cyan Gradient */}
        <div className="bg-gradient-to-br from-primary-600 to-primary-700 text-white rounded-[2rem] shadow-none p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transform group-hover:scale-120 transition-transform">
            {/* Icon placeholder could go here */}
          </div>
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider">
            Ingresos Totales
          </h4>
          <p className="text-4xl font-black mt-2 tracking-tight">
            ${totalIncome.toFixed(2)}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span>{totalServices} servicios realizados</span>
          </div>
        </div>

        {/* Ticket - Cyan/Blue Gradient */}
        <div className="bg-gradient-to-br from-primary-700 to-blue-600 text-white rounded-[2rem] shadow-none p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider">
            Ticket Promedio
          </h4>
          <p className="text-4xl font-black mt-2 tracking-tight">
            ${averageTicket.toFixed(2)}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span>Por cliente</span>
          </div>
        </div>

        {/* Staff - Violet/Indigo Gradient */}
        <div className="bg-gradient-to-br from-cyan-900 to-blue-900 text-white rounded-[2rem] shadow-none p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider">
            Top Staff
          </h4>
          <p className="text-3xl font-black mt-2 truncate max-w-full">
            {topStaff?.[0] || "N/A"}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-black/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span>Generó ${topStaff?.[1].revenue.toFixed(2) || "0.00"}</span>
          </div>
        </div>

        {/* Service - Dark Gradient */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-[2rem] shadow-none p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider">
            Servicio Estrella
          </h4>
          <p className="text-2xl font-black mt-2 truncate max-w-full leading-tight">
            {topService?.[0] || "N/A"}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span>{topService?.[1].count || 0} ventas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">
        {/* Gráfica por día de semana */}
        <div className="bg-surface rounded-[2.5rem] shadow-none p-8 border border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-black text-text-main">
              Ingresos Semanales
            </h3>
            <div className="px-3 py-1 rounded-full bg-primary-600/10 text-primary-600 text-xs font-bold">
              Tendencia diaria
            </div>
          </div>

          <div style={{ width: "100%", height: 400 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={Object.entries(weekdayData).map(([day, data]) => ({
                  name: day.slice(0, 3),
                  revenue: data.revenue,
                }))}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#1E293B"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#94A3B8"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  stroke="#94A3B8"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  cursor={{ fill: "transparent" }}
                  contentStyle={{
                    backgroundColor: "#0F172A",
                    borderColor: "#1E293B",
                    color: "#F1F5F9",
                    borderRadius: "0.75rem",
                  }}
                  itemStyle={{ color: "#F1F5F9" }}
                  formatter={(value: any) => [
                    `$${Number(value).toFixed(2)}`,
                    "Ingresos",
                  ]}
                />
                <Bar
                  dataKey="revenue"
                  fill="#06B6D4"
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                  activeBar={{ fill: "#22D3EE" }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfica de dona - Servicios más vendidos */}
        <div className="bg-surface rounded-[2.5rem] shadow-none p-8 border border-border">
          <h3 className="text-xl font-black text-text-main mb-8">
            Distribución de Servicios
          </h3>

          <div className="flex flex-col md:flex-row items-center gap-8">
            {/* Dona */}
            <div className="relative flex-shrink-0">
              {Object.values(serviceStats).length > 0 ? (
                <div className="relative" style={{ width: 220, height: 220 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={Object.entries(serviceStats)
                          .sort(([, a], [, b]) => b.count - a.count)
                          .map(([name, data]) => ({
                            name,
                            value: data.count,
                            revenue: data.revenue,
                          }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={85}
                        paddingAngle={2}
                        dataKey="value"
                        stroke="none"
                      >
                        {Object.entries(serviceStats)
                          .sort(([, a], [, b]) => b.count - a.count)
                          .map((entry, index) => {
                            const vibrantColors = [
                              "#06B6D4",
                              "#6366F1",
                              "#10B981",
                              "#8B5CF6",
                              "#F59E0B",
                              "#EC4899",
                              "#64748b",
                              "#94A3B8",
                            ];
                            return (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  vibrantColors[index % vibrantColors.length]
                                }
                              />
                            );
                          })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          borderColor: "#1E293B",
                          color: "#F1F5F9",
                          borderRadius: "0.75rem",
                        }}
                        itemStyle={{ color: "#F1F5F9" }}
                        formatter={(value: any, name: any, props: any) => [
                          `${value} ventas ($${props.payload.revenue.toFixed(
                            2,
                          )})`,
                          name,
                        ]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Center Stats */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-black text-text-main">
                      {totalServices}
                    </span>
                    <span className="text-xs font-bold text-text-muted uppercase tracking-wider">
                      Total
                    </span>
                  </div>
                </div>
              ) : (
                <div className="w-[200px] h-[200px] rounded-full bg-background flex items-center justify-center text-text-muted text-sm font-medium">
                  Sin datos
                </div>
              )}
            </div>

            {/* Leyenda */}
            <div className="flex-1 w-full space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {Object.entries(serviceStats)
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 6) // Limit to top 6
                .map(([service, data], idx) => {
                  const total = Object.values(serviceStats).reduce(
                    (sum, s) => sum + s.count,
                    0,
                  );
                  const percentage = ((data.count / total) * 100).toFixed(1);
                  const vibrantColors = [
                    "#06B6D4",
                    "#6366F1",
                    "#10B981",
                    "#8B5CF6",
                    "#F59E0B",
                    "#EC4899",
                    "#64748b",
                    "#94A3B8",
                  ];

                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group"
                    >
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                        style={{
                          backgroundColor:
                            vibrantColors[idx % vibrantColors.length],
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-muted truncate group-hover:text-text-main transition-colors">
                          {service}
                        </p>
                        <p className="text-[10px] font-semibold text-text-muted">
                          ${data.revenue.toFixed(0)} • {data.count} u.
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-black text-text-main bg-background px-2 py-1 rounded-lg">
                          {percentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
