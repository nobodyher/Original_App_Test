import React, { useState } from "react";
import type { Service } from "../../../types";

interface AnalyticsTabProps {
  services: Service[];
}

const AnalyticsTab: React.FC<AnalyticsTabProps> = ({ services }) => {
  const [analyticsFilter, setAnalyticsFilter] = useState<
    "week" | "month" | "year" | "custom"
  >("week");
  const [customDateFrom, setCustomDateFrom] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [customDateTo, setCustomDateTo] = useState(
    new Date().toISOString().split("T")[0]
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
    // Except 'Domingo' is in weekdayNames[0] and weekdayData['Domingo'] exists.
    // 'Sábado' is in weekdayData.
    // Ensure dayName matches key. weekdayNames matches.
    if (weekdayData[dayName as keyof typeof weekdayData]) {
        weekdayData[dayName as keyof typeof weekdayData].revenue += s.cost;
        weekdayData[dayName as keyof typeof weekdayData].services += 1;
    }
  });

  // Calcular datos diarios para gráfica de tendencia (unused in UI but defined in original?)
  // Original had dailyData calculation code but didn't seem to render a line chart?
  // I'll include it just in case logic is needed, but only if used.
  // The snippet showed "Gráfica por día de semana" bar chart.
  // And "Gráfica de dona". 
  // It didn't render Line Chart.

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
    ([, a], [, b]) => b.revenue - a.revenue
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
    ([, a], [, b]) => b.count - a.count
  )[0];

  return (
    <div className="space-y-8 pb-10">
      {/* Filtros */}
      <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 p-6 border border-gray-100">
        <h3 className="text-xl font-black text-gray-800 mb-6 tracking-tight">Filtros de Análisis</h3>
        <div className="flex flex-wrap gap-3 mb-6">
          {(["week", "month", "year", "custom"] as const).map((filterType) => (
             <button
               key={filterType}
               onClick={() => setAnalyticsFilter(filterType)}
               className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 transform active:scale-95 ${
                 analyticsFilter === filterType
                   ? "bg-gray-900 text-white shadow-lg shadow-gray-900/20"
                   : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
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
               <span className="text-xs font-bold text-gray-400 uppercase ml-1">Desde</span>
               <input
                 type="date"
                 value={customDateFrom}
                 onChange={(e) => setCustomDateFrom(e.target.value)}
                 className="px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-violet-500 focus:outline-none bg-gray-50 font-semibold text-gray-700"
               />
            </div>
            <div className="flex flex-col gap-1">
               <span className="text-xs font-bold text-gray-400 uppercase ml-1">Hasta</span>
               <input
                 type="date"
                 value={customDateTo}
                 onChange={(e) => setCustomDateTo(e.target.value)}
                 className="px-4 py-2 border-2 border-gray-100 rounded-xl focus:border-violet-500 focus:outline-none bg-gray-50 font-semibold text-gray-700"
               />
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2">
           <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
           <p className="text-sm font-medium text-gray-500">
             Mostrando datos del: <strong className="text-gray-900">{dateRange.from}</strong> al <strong className="text-gray-900">{dateRange.to}</strong>
           </p>
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-[2rem] shadow-xl shadow-indigo-500/20 p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transform group-hover:scale-120 transition-transform">
             {/* Icon placeholder could go here */}
          </div>
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider">Ingresos Totales</h4>
          <p className="text-4xl font-black mt-2 tracking-tight">${totalIncome.toFixed(2)}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span>{totalServices} servicios realizados</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-pink-500 to-rose-500 text-white rounded-[2rem] shadow-xl shadow-pink-500/20 p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider">Ticket Promedio</h4>
          <p className="text-4xl font-black mt-2 tracking-tight">${averageTicket.toFixed(2)}</p>
           <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
            <span>Por cliente</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-amber-500 text-white rounded-[2rem] shadow-xl shadow-orange-500/20 p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider">Top Staff</h4>
          <p className="text-3xl font-black mt-2 truncate max-w-full">{topStaff?.[0] || "N/A"}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
             <span>Generó ${topStaff?.[1].revenue.toFixed(2) || "0.00"}</span>
          </div>
        </div>

        <div className="bg-gradient-to-br from-teal-400 to-emerald-500 text-white rounded-[2rem] shadow-xl shadow-teal-500/20 p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform">
          <h4 className="text-sm font-bold opacity-80 uppercase tracking-wider">Servicio Estrella</h4>
          <p className="text-2xl font-black mt-2 truncate max-w-full leading-tight">{topService?.[0] || "N/A"}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-sm">
             <span>{topService?.[1].count || 0} ventas</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Gráfica por día de semana */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-black text-gray-800">
                 Ingresos Semanales
               </h3>
               <div className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-xs font-bold">
                  Tendencia diaria
               </div>
            </div>
            
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-4 items-end h-[240px] pt-4 relative" style={{ minWidth: "100%" }}>
                {/* Global Gradients Definition */}
                <svg style={{ position: "absolute", width: 0, height: 0 }}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                    <linearGradient id="barGradientHover" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" />
                      <stop offset="100%" stopColor="#818cf8" />
                    </linearGradient>
                  </defs>
                </svg>

                {Object.entries(weekdayData).map(([day, data]) => {
                  const maxRevenue = Math.max(
                    ...Object.values(weekdayData).map((d) => d.revenue)
                  );
                  const isMax = maxRevenue > 0 && data.revenue === maxRevenue;
                  const heightPercent =
                    maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;
                  const barHeight = Math.max(heightPercent, 2); // Min height 2%

                  return (
                    <div
                      key={day}
                      className="flex-1 flex flex-col items-center gap-3 min-w-[60px] group"
                    >
                      <div className="relative w-full flex justify-center items-end flex-grow">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-[10px] font-bold py-1 px-2 rounded-lg whitespace-nowrap z-10 mb-2 pointer-events-none shadow-lg">
                          ${data.revenue.toFixed(2)}
                          <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                        </div>

                        {/* Visual Bar (SVG) */}
                        <svg
                          width="100%"
                          viewBox="0 0 40 100"
                          preserveAspectRatio="none"
                          className="w-full max-w-[40px] transition-all duration-300 ease-out hover:-translate-y-1"
                          style={{ height: "100%" }}
                        >
                          <rect
                            x="0"
                            y={100 - barHeight}
                            width="40"
                            height={barHeight}
                            rx="12"
                            fill={isMax ? "url(#barGradient)" : "#e5e7eb"}
                            fillOpacity={isMax ? 1 : 0.6}
                            className={`transition-all duration-300 ${
                               data.revenue > 0 ? "group-hover:fill-opacity-100" : ""
                            }`}
                            style={{
                                fill: data.revenue > 0 ? "url(#barGradient)" : "#e5e7eb"
                            }}
                          />
                        </svg>
                      </div>

                      <div className="text-center">
                        <p
                          className={`text-xs font-bold ${
                            isMax ? "text-violet-600" : "text-gray-400"
                          }`}
                        >
                          {day.slice(0, 3)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Gráfica de dona - Servicios más vendidos */}
          <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
            <h3 className="text-xl font-black text-gray-800 mb-8">
               Distribución de Servicios
            </h3>
            
            <div className="flex flex-col md:flex-row items-center gap-8">
              {/* Dona */}
              <div className="relative flex-shrink-0">
                {Object.entries(serviceStats).length > 0 ? (
                  <div className="relative">
                      <svg width="220" height="220" viewBox="0 0 200 200" className="transform -rotate-90">
                        {(() => {
                          const total = Object.values(serviceStats).reduce(
                            (sum, s) => sum + s.count,
                            0
                          );
                          const vibrantColors = [
                            "#8b5cf6", // Violet
                            "#ec4899", // Pink
                            "#f97316", // Orange
                            "#14b8a6", // Teal
                            "#f43f5e", // Rose
                            "#eab308", // Yellow
                            "#3b82f6", // Blue
                            "#6366f1", // Indigo
                          ];
                          let currentAngle = 0;

                          return Object.entries(serviceStats)
                            .sort(([, a], [, b]) => b.count - a.count)
                            .map(([, data], idx) => {
                              const sliceAngle = (data.count / total) * 360;
                              // Ensure we don't draw if 0
                              if (sliceAngle === 0) return null;

                              const startAngle = currentAngle;
                              const endAngle = currentAngle + sliceAngle;
                              currentAngle = endAngle;

                              // Circle for 100%
                              if (Math.abs(sliceAngle - 360) < 0.1) {
                                 return (
                                    <circle 
                                        key={idx} 
                                        cx="100" 
                                        cy="100" 
                                        r="85" 
                                        fill="none" 
                                        stroke={vibrantColors[idx % vibrantColors.length]} 
                                        strokeWidth="25"
                                    />
                                 );
                              }

                              // Calculate SVG arc path
                              const x1 = 100 + 85 * Math.cos((startAngle * Math.PI) / 180);
                              const y1 = 100 + 85 * Math.sin((startAngle * Math.PI) / 180);
                              const x2 = 100 + 85 * Math.cos((endAngle * Math.PI) / 180);
                              const y2 = 100 + 85 * Math.sin((endAngle * Math.PI) / 180);

                              const largeArc = sliceAngle > 180 ? 1 : 0;

                              const pathData = [
                                `M ${x1} ${y1}`,
                                `A 85 85 0 ${largeArc} 1 ${x2} ${y2}`,
                              ].join(" ");

                              return (
                                <path
                                  key={idx}
                                  d={pathData}
                                  fill="none"
                                  stroke={vibrantColors[idx % vibrantColors.length]}
                                  strokeWidth="25"
                                  strokeLinecap="round" // Smooth lines
                                  className="hover:opacity-80 transition-opacity cursor-pointer"
                                />
                              );
                            });
                        })()}
                      </svg>
                      {/* Center Stats */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                         <span className="text-3xl font-black text-gray-800">{totalServices}</span>
                         <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total</span>
                      </div>
                  </div>
                ) : (
                  <div className="w-[200px] h-[200px] rounded-full bg-gray-50 flex items-center justify-center text-gray-400 text-sm font-medium">
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
                      0
                    );
                    const percentage = ((data.count / total) * 100).toFixed(1);
                    const vibrantColors = [
                        "#8b5cf6", "#ec4899", "#f97316", "#14b8a6", 
                        "#f43f5e", "#eab308", "#3b82f6", "#6366f1"
                    ];

                    return (
                      <div
                        key={idx}
                        className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      >
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0 shadow-sm"
                          style={{ backgroundColor: vibrantColors[idx % vibrantColors.length] }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-gray-700 truncate group-hover:text-gray-900 transition-colors">
                            {service}
                          </p>
                          <p className="text-[10px] font-semibold text-gray-400">
                             ${data.revenue.toFixed(0)} • {data.count} u.
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-gray-800 bg-gray-100 px-2 py-1 rounded-lg">
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
