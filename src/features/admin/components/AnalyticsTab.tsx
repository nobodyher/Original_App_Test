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
      case "week":
        from = new Date(today);
        // Calcular el lunes de la semana actual
        const dayOfWeek = today.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
        const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Si es domingo, retroceder 6 días
        from.setDate(today.getDate() - daysToMonday);

        // Calcular el domingo de la semana actual
        to = new Date(from);
        to.setDate(from.getDate() + 6);
        break;
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
    <div className="space-y-6">
      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Filtros</h3>
        <div className="flex flex-wrap gap-3 mb-4">
          <button
            onClick={() => setAnalyticsFilter("week")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              analyticsFilter === "week"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Esta semana
          </button>
          <button
            onClick={() => setAnalyticsFilter("month")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              analyticsFilter === "month"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Este mes
          </button>
          <button
            onClick={() => setAnalyticsFilter("year")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              analyticsFilter === "year"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Este año
          </button>
          <button
            onClick={() => setAnalyticsFilter("custom")}
            className={`px-4 py-2 rounded-lg font-semibold transition ${
              analyticsFilter === "custom"
                ? "bg-purple-600 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            Personalizado
          </button>
        </div>

        {analyticsFilter === "custom" && (
          <div className="flex gap-4">
            <input
              type="date"
              value={customDateFrom}
              onChange={(e) => setCustomDateFrom(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
            <input
              type="date"
              value={customDateTo}
              onChange={(e) => setCustomDateTo(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none"
            />
          </div>
        )}

        <p className="text-sm text-gray-600 mt-4">
          Período: <strong>{dateRange.from}</strong> a{" "}
          <strong>{dateRange.to}</strong>
        </p>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl shadow-lg p-6">
          <h4 className="text-sm font-semibold opacity-90">Total Ingresos</h4>
          <p className="text-3xl font-bold mt-2">${totalIncome.toFixed(2)}</p>
          <p className="text-green-100 text-xs mt-2">
            {totalServices} servicios
          </p>
        </div>

        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-xl shadow-lg p-6">
          <h4 className="text-sm font-semibold opacity-90">Ticket Promedio</h4>
          <p className="text-3xl font-bold mt-2">${averageTicket.toFixed(2)}</p>
          <p className="text-blue-100 text-xs mt-2">por servicio</p>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <h4 className="text-sm font-semibold opacity-90">
            Empleada Destaque
          </h4>
          <p className="text-2xl font-bold mt-2">{topStaff?.[0] || "N/A"}</p>
          <p className="text-orange-100 text-xs mt-2">
            ${topStaff?.[1].revenue.toFixed(2) || "0.00"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-pink-400 to-pink-600 text-white rounded-xl shadow-lg p-6">
          <h4 className="text-sm font-semibold opacity-90">Servicio Top</h4>
          <p className="text-2xl font-bold mt-2 truncate">
            {topService?.[0] || "N/A"}
          </p>
          <p className="text-pink-100 text-xs mt-2">
            {topService?.[1].count} servicios
          </p>
        </div>
      </div>

      {/* Gráfica por día de semana */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Ingresos por Día de Semana
        </h3>
        <div className="overflow-x-auto">
          <div className="flex gap-4 pb-4" style={{ minWidth: "100%" }}>
            {Object.entries(weekdayData)
              .filter(([day]) => day !== "Domingo") // Exclude Sunday for now? Original code did this?
              // The original snippet: .filter(([day]) => day !== "Domingo")
              // Why? Maybe because salon is closed? I'll keep it as is.
              .map(([day, data]) => {
                const maxRevenue = Math.max(
                  ...Object.values(weekdayData).map((d) => d.revenue)
                );
                // Avoid division by zero
                const heightPercent =
                  maxRevenue > 0 ? (data.revenue / maxRevenue) * 100 : 0;

                return (
                  <div key={day} className="flex-1 min-w-20">
                    <div className="flex flex-col items-center gap-2">
                      <div
                        className="w-full bg-gray-100 rounded-lg relative"
                        style={{ height: "200px" }}
                      >
                        <div
                          className="bg-gradient-to-t from-purple-500 to-purple-300 rounded-lg absolute bottom-0 w-full transition-all duration-300"
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <p className="text-sm font-semibold text-gray-700">
                        {day}
                      </p>
                      <p className="text-xs text-gray-600">
                        ${data.revenue.toFixed(0)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {data.services} servicios
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Gráfica de dona - Servicios más vendidos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">
          Servicios Más Vendidos
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dona */}
          <div className="flex justify-center items-center">
            {Object.entries(serviceStats).length > 0 ? (
              <svg width="200" height="200" viewBox="0 0 200 200">
                {(() => {
                  const total = Object.values(serviceStats).reduce(
                    (sum, s) => sum + s.count,
                    0
                  );
                  const colors = [
                    "#FF6B6B",
                    "#4ECDC4",
                    "#45B7D1",
                    "#FFA07A",
                    "#98D8C8",
                    "#F7DC6F",
                    "#BB8FCE",
                    "#85C1E2",
                  ];
                  let currentAngle = -90;

                  return Object.entries(serviceStats)
                    .sort(([, a], [, b]) => b.count - a.count)
                    .map(([service, data], idx) => {
                      const percentage = (data.count / total) * 100;
                      // Don't render tiny slices that break SVG arcs logic (e.g. 100%)
                      // If 100%, render circle?
                      // The original code was naive. I'll maintain it for now ("intact logic").
                      
                      const sliceAngle = (data.count / total) * 360;
                      const startAngle = currentAngle;
                      const endAngle = currentAngle + sliceAngle;
                      currentAngle = endAngle;

                      // Fix for 100% slice (full circle)
                      if (Math.abs(sliceAngle - 360) < 0.01) {
                         return (
                            <circle 
                                key={idx} 
                                cx="100" 
                                cy="100" 
                                r="90" 
                                fill={colors[idx % colors.length]} 
                                stroke="white" 
                                strokeWidth="2"
                            />
                         );
                      }

                      const startRad = (startAngle * Math.PI) / 180;
                      const endRad = (endAngle * Math.PI) / 180;
                      const innerRadius = 60;
                      const outerRadius = 90;

                      const x1Inner = 100 + innerRadius * Math.cos(startRad);
                      const y1Inner = 100 + innerRadius * Math.sin(startRad);
                      const x2Inner = 100 + innerRadius * Math.cos(endRad);
                      const y2Inner = 100 + innerRadius * Math.sin(endRad);

                      const x1Outer = 100 + outerRadius * Math.cos(startRad);
                      const y1Outer = 100 + outerRadius * Math.sin(startRad);
                      const x2Outer = 100 + outerRadius * Math.cos(endRad);
                      const y2Outer = 100 + outerRadius * Math.sin(endRad);

                      const largeArc = sliceAngle > 180 ? 1 : 0;

                      const pathData = [
                        `M ${x1Outer} ${y1Outer}`,
                        `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2Outer} ${y2Outer}`,
                        `L ${x2Inner} ${y2Inner}`,
                        `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x1Inner} ${y1Inner}`,
                        "Z",
                      ].join(" ");

                      return (
                        <path
                          key={idx}
                          d={pathData}
                          fill={colors[idx % colors.length]}
                          stroke="white"
                          strokeWidth="2"
                        />
                      );
                    });
                })()}
              </svg>
            ) : (
              <p className="text-gray-500">Sin datos disponibles</p>
            )}
          </div>

          {/* Leyenda y detalles */}
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {Object.entries(serviceStats)
              .sort(([, a], [, b]) => b.count - a.count)
              .map(([service, data], idx) => {
                const total = Object.values(serviceStats).reduce(
                  (sum, s) => sum + s.count,
                  0
                );
                const percentage = ((data.count / total) * 100).toFixed(1);
                const colors = [
                  "#FF6B6B",
                  "#4ECDC4",
                  "#45B7D1",
                  "#FFA07A",
                  "#98D8C8",
                  "#F7DC6F",
                  "#BB8FCE",
                  "#85C1E2",
                ];

                return (
                  <div
                    key={idx}
                    className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{
                        backgroundColor: colors[idx % colors.length],
                      }}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {service}
                      </p>
                      <p className="text-xs text-gray-600">
                        {data.count} servicios • ${data.revenue.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-800">
                        {percentage}%
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsTab;
