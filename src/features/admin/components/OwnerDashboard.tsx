import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import {
  DollarSign,
  CreditCard,
  Package,
  Wallet,
  Trash2,
  Download,
  Check,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
} from "lucide-react";
import type {
  AppUser,
  Service,
  Expense,
  
  CatalogService,
  OwnerFilters,
  Toast,
  
  InventoryItem,
} from "../../../types";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import * as salonService from "../../../services/salonService";
import * as inventoryService from "../../../services/inventoryService";
import InventoryAlerts from "./InventoryAlerts";

interface OwnerDashboardProps {
  services: Service[];
  expenses: Expense[];
  users: AppUser[];
  currentUser: AppUser | null;
  
  catalogServices: CatalogService[];
  inventoryItems: InventoryItem[];
  
  showNotification: (message: string, type?: Toast["type"]) => void;
  onNavigateToInventory?: (tab: "inventory") => void;
  // Actions
  updateServiceCost: (id: string, cost: number) => Promise<void>;
  softDeleteService: (id: string, userId?: string, inventoryContext?: { service: Service; inventoryItems: InventoryItem[]; catalogServices: CatalogService[] }) => Promise<void>;
  permanentlyDeleteService: (id: string, inventoryContext?: { service: Service; inventoryItems: InventoryItem[]; catalogServices: CatalogService[] }) => Promise<void>;
  restoreDeletedService: (id: string) => Promise<void>;
}



const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  services,
  expenses,
  users,
  currentUser,
  
  catalogServices,
  inventoryItems,
  
  showNotification,
  onNavigateToInventory,
  updateServiceCost,
  softDeleteService,
  permanentlyDeleteService,
  restoreDeletedService,
}) => {
  const today = format(new Date(), "yyyy-MM-dd");
  const [ownerFilters] = useState<OwnerFilters>({
    dateFrom: today,
    dateTo: today,
    paymentMethod: "all",
    includeDeleted: false,
    search: "",
  });

  // Pagination State
  const [servicesPage, setServicesPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setServicesPage(1);
  }, [ownerFilters]);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceCost, setEditingServiceCost] = useState("");

  // Confirmation Modal State
  type DashboardAction = {
    type: "soft_delete_service" | "permanent_delete_service";
    id: string;
  } | null;

  const [actionToConfirm, setActionToConfirm] = useState<DashboardAction>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Local wrappers for actions with UI feedback
  const handleUpdateServiceCost = async (
    serviceId: string,
    newCost: number,
  ) => {
    try {
      await updateServiceCost(serviceId, newCost);
      setEditingServiceId(null);
      showNotification("Costo actualizado");
    } catch (error) {
      console.error("Error actualizando costo:", error);
      const message =
        error instanceof Error ? error.message : "Error al actualizar";
      showNotification(message, "error");
    }
  };

  const handleSoftDeleteService = (serviceId: string) => {
    setActionToConfirm({ type: "soft_delete_service", id: serviceId });
  };

  const handlePermanentlyDeleteService = (serviceId: string) => {
    setActionToConfirm({ type: "permanent_delete_service", id: serviceId });
  };



  const handleConfirmAction = async () => {
    if (!actionToConfirm) return;

    setIsSubmitting(true);
    try {
      switch (actionToConfirm.type) {
        case "soft_delete_service": {
          // Buscar el servicio que se va a eliminar
          const serviceToDelete = services.find(s => s.id === actionToConfirm.id);
          
          if (serviceToDelete && serviceToDelete.services && serviceToDelete.services.length > 0) {
            // Pasar contexto de inventario para restaurar stock
            await softDeleteService(actionToConfirm.id, currentUser?.id, {
              service: serviceToDelete,
              inventoryItems,
              catalogServices,
            });
            showNotification("Servicio eliminado e inventario restaurado");
          } else {
            // Sin servicios en la transacción, solo marcar como eliminado
            await softDeleteService(actionToConfirm.id, currentUser?.id);
            showNotification("Servicio eliminado temporalmente");
          }
          break;
        }
        case "permanent_delete_service": {
          // Buscar el servicio que se va a eliminar permanentemente
          const serviceToDelete = services.find(s => s.id === actionToConfirm.id);
          
          if (serviceToDelete && serviceToDelete.services && serviceToDelete.services.length > 0) {
            // Pasar contexto de inventario para restaurar stock
            await permanentlyDeleteService(actionToConfirm.id, {
              service: serviceToDelete,
              inventoryItems,
              catalogServices,
            });
            showNotification("Servicio eliminado e inventario restaurado");
          } else {
            // Sin servicios, solo borrar
            await permanentlyDeleteService(actionToConfirm.id);
            showNotification("Servicio eliminado permanentemente");
          }
          break;
        }
      }
      setActionToConfirm(null);
    } catch (error) {
      console.error("Error en acción de confirmación:", error);
      showNotification("Error al procesar la acción", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModalProps = () => {
    if (!actionToConfirm) return { title: "", message: "" };
    switch (actionToConfirm.type) {
      case "soft_delete_service":
        return {
          title: "Eliminar Transacción",
          message:
            "¿Estás seguro de que deseas eliminar esta transacción? Esto afectará los cálculos de ingresos totales y podrá ser restaurada desde el historial.",
        };
        case "permanent_delete_service":
        return {
          title: "Eliminar Permanentemente",
          message:
            "¿Eliminar permanentemente este servicio? Esta acción no se puede deshacer.",
        };
      default:
        return { title: "Confirmar", message: "¿Estás seguro?" };
    }
  };

  const handleRestoreDeletedService = async (serviceId: string) => {
    try {
      await restoreDeletedService(serviceId);
      showNotification("Servicio restaurado");
    } catch (error) {
      console.error("Error restaurando servicio:", error);
      showNotification("Error al restaurar", "error");
    }
  };



  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!ownerFilters.includeDeleted && s.deleted) return false;
      const matchSearch =
        !ownerFilters.search ||
        s.client.toLowerCase().includes(ownerFilters.search.toLowerCase()) ||
        (s.service?.toLowerCase() || "").includes(
          ownerFilters.search.toLowerCase(),
        ) ||
        s.userName.toLowerCase().includes(ownerFilters.search.toLowerCase());
      const matchDateFrom =
        !ownerFilters.dateFrom || s.date >= ownerFilters.dateFrom;
      const matchDateTo = !ownerFilters.dateTo || s.date <= ownerFilters.dateTo;
      const matchPayment =
        ownerFilters.paymentMethod === "all" ||
        s.paymentMethod === ownerFilters.paymentMethod;
      return matchSearch && matchDateFrom && matchDateTo && matchPayment;
    });
  }, [services, ownerFilters]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!ownerFilters.includeDeleted && e.deleted) return false;
      const matchDateFrom =
        !ownerFilters.dateFrom || e.date >= ownerFilters.dateFrom;
      const matchDateTo = !ownerFilters.dateTo || e.date <= ownerFilters.dateTo;
      return matchDateFrom && matchDateTo;
    });
  }, [expenses, ownerFilters]);

  // Export to Excel function
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredServices.map((service) => ({
        Fecha: service.date,
        "Realizado por": service.userName,
        Cliente: service.client,
        "Método de Pago":
          service.paymentMethod === "cash" ? "Efectivo" : "Transferencia",
        "Monto Total": service.cost,
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);

      // Column widths
      const wscols = [
        { wch: 15 }, // Fecha
        { wch: 20 }, // Staff
        { wch: 20 }, // Cliente
        { wch: 15 }, // Metodo
        { wch: 15 }, // Monto
      ];
      worksheet["!cols"] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

      const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array",
      });
      const data = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8",
      });

      saveAs(
        data,
        `Reporte_Servicios_${new Date().toISOString().split("T")[0]}.xlsx`,
      );
      showNotification("Reporte exportado exitosamente", "success");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showNotification("Error al exportar reporte", "error");
    }
  };

  const totalRevenue = useMemo(
    () => filteredServices.reduce((sum, s) => sum + s.cost, 0),
    [filteredServices],
  );

  const totalCash = useMemo(
    () =>
      filteredServices
        .filter((s) => s.paymentMethod === "cash")
        .reduce((sum, s) => sum + s.cost, 0),
    [filteredServices],
  );

  const totalTransfer = useMemo(
    () =>
      filteredServices
        .filter((s) => s.paymentMethod === "transfer")
        .reduce((sum, s) => sum + s.cost, 0),
    [filteredServices],
  );

  const totalExpenses = useMemo(
    () =>
      filteredExpenses
        .filter((e) => e.category !== "Comisiones" && e.category !== "Sueldos")
        .reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses],
  );

  const totalCommissions = useMemo(
    () =>
      filteredServices.reduce(
        (sum, s) => sum + salonService.calcCommissionAmount(s, users),
        0,
      ),
    [filteredServices, users],
  );

  const totalReplenishmentCost = useMemo(() => {
    const cost = filteredServices.reduce((sum, s) => {
      return (
        sum +
        (s.reposicion ||
          inventoryService.calculateTotalReplenishmentCost(
            s.services || [],
            
            catalogServices,
            inventoryItems,
          ))
      );
    }, 0);
    // Deduct reposicion expenses to avoid double counting if tracking cash flow
    const repoExpenses = filteredExpenses.reduce((sum, e) => {
      return e.category === "Reposicion" ? sum + e.amount : sum;
    }, 0);
    return Math.max(0, cost - repoExpenses);
  }, [
    filteredServices,
    filteredExpenses,
    catalogServices,
    inventoryItems,
  ]);

  const netProfit = useMemo(
    () =>
      totalRevenue - totalExpenses - totalCommissions - totalReplenishmentCost,
    [totalRevenue, totalExpenses, totalCommissions, totalReplenishmentCost],
  );

  /* userStats logic removed - moved to FinanceScreen */

  const sortedServices = useMemo(() => {
    return [...filteredServices].sort((a, b) => {
      // Sort by timestamp desc if available
      if (a.timestamp && b.timestamp) {
        return b.timestamp.seconds - a.timestamp.seconds;
      }
      // Fallback to date/time string comparison
      // Try to construct full date time if possible, otherwise date string
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return dateB - dateA;
    });
  }, [filteredServices]);
  const paginatedServices = useMemo(() => {
    const start = (servicesPage - 1) * ITEMS_PER_PAGE;
    return sortedServices.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedServices, servicesPage]);

  /* sortedExpenses and paginatedExpenses removed */

  return (
    <div className="space-y-8 pb-20">


      {/* Premium Stats Cards - Banking Style */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {/* Revenue Card - Surface with simple border */}
        <div className="bg-surface border border-white/10 rounded-[2rem] p-3 md:p-6 shadow-none relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 text-current z-0 pointer-events-none group-hover:scale-110 transition-transform">
            <DollarSign className="w-16 h-16 md:w-24 md:h-24 text-text-muted" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[100px] md:min-h-[160px]">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-primary-600/10 backdrop-blur-md flex items-center justify-center border border-primary-600/20">
                <DollarSign size={16} className="md:w-5 md:h-5 text-primary-600" />
              </div>
              <span className="font-medium text-text-muted text-xs md:text-sm uppercase tracking-wider opacity-90">
                Ingresos
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-4xl font-black tracking-tight mb-1 text-text-main">
                ${totalRevenue.toFixed(2)}
              </h3>
              <div className="hidden md:flex items-center gap-2 text-primary-600 text-xs font-medium bg-primary-600/10 w-fit px-3 py-1 rounded-full mb-3">
                <span>{filteredServices.length} transacciones</span>
              </div>

              {/* Desglose por método de pago */}
              <div className="hidden md:flex bg-background rounded-xl p-2 items-center justify-between gap-2 backdrop-blur-sm border border-border">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-full bg-green-500/10 text-green-500">
                    <DollarSign size={10} />
                  </div>
                  <span className="text-xs font-bold text-text-main">
                    ${totalCash.toFixed(0)}
                  </span>
                </div>
                <div className="w-px h-3 bg-border"></div>
                <div className="flex items-center gap-1.5">
                  <div className="p-1 rounded-full bg-blue-500/10 text-blue-500">
                    <CreditCard size={10} />
                  </div>
                  <span className="text-xs font-bold text-text-main">
                    ${totalTransfer.toFixed(0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Expenses Card - Surface with simple border */}
        <div className="bg-surface border border-white/10 rounded-[2rem] p-3 md:p-6 shadow-none relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 text-current z-0 pointer-events-none group-hover:scale-110 transition-transform">
            <CreditCard className="w-16 h-16 md:w-24 md:h-24 text-text-muted" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[100px] md:min-h-[160px]">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-rose-500/10 backdrop-blur-md flex items-center justify-center border border-rose-500/20">
                <CreditCard size={16} className="md:w-5 md:h-5 text-rose-500" />
              </div>
              <span className="font-medium text-text-muted text-xs md:text-sm uppercase tracking-wider opacity-90">
                Gastos
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-4xl font-black tracking-tight mb-1 text-text-main">
                ${totalExpenses.toFixed(2)}
              </h3>
              <div className="hidden md:flex items-center gap-2 text-rose-500 text-xs font-medium bg-rose-500/10 w-fit px-3 py-1 rounded-full">
                <span>{filteredExpenses.length} movimientos</span>
              </div>
            </div>
          </div>
        </div>

        {/* Replenishment Card - Surface with simple border */}
        <div className="bg-surface border border-white/10 rounded-[2rem] p-3 md:p-6 shadow-none relative overflow-hidden group transition-all duration-300 hover:-translate-y-1">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 text-current z-0 pointer-events-none group-hover:scale-110 transition-transform">
            <Package className="w-16 h-16 md:w-24 md:h-24 text-text-muted" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[100px] md:min-h-[160px]">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gray-500/10 backdrop-blur-md flex items-center justify-center border border-gray-500/20">
                <Package size={16} className="md:w-5 md:h-5 text-gray-400" />
              </div>
              <span className="font-medium text-text-muted text-xs md:text-sm uppercase tracking-wider opacity-90">
                Reposición
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-4xl font-black tracking-tight mb-1 text-text-main">
                ${totalReplenishmentCost.toFixed(2)}
              </h3>
              <div className="hidden md:flex items-center gap-2 text-gray-500 text-xs font-medium bg-gray-500/10 w-fit px-3 py-1 rounded-full">
                <span>Costo materiales</span>
              </div>
            </div>
          </div>
        </div>

        {/* Net Profit Card - Surface with simple border */}
        <div className="bg-surface border border-white/10 rounded-[2rem] p-3 md:p-6 shadow-none relative overflow-hidden group transition-all duration-300 hover:-translate-y-1 ring-4 ring-white/5">
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-10 text-current z-0 pointer-events-none group-hover:scale-110 transition-transform">
            <Wallet className="w-16 h-16 md:w-24 md:h-24 text-text-muted" />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[100px] md:min-h-[160px]">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-violet-500/10 flex items-center justify-center shadow-lg border border-violet-500/20">
                <Wallet size={16} className="md:w-5 md:h-5 text-violet-500" />
              </div>
              <span className="font-bold text-text-muted text-xs md:text-sm uppercase tracking-wider opacity-90">
                Ganancia
              </span>
            </div>
            <div>
              <h3 className="text-lg md:text-4xl font-black tracking-tight mb-1 text-text-main">
                ${netProfit.toFixed(2)}
              </h3>
              <div className="hidden md:flex items-center gap-2 text-violet-500 text-xs font-medium bg-violet-500/10 px-3 py-1 rounded-full w-fit">
                <span>Después de comisiones y costos</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inventory Alerts Widget */}
      <InventoryAlerts
        inventoryItems={inventoryItems}
        onNavigateToTab={onNavigateToInventory}
        onShowNotification={showNotification}
      />

      {/* Main Content Areas Layout */}
      <div className="grid grid-cols-1 gap-8">
        {/* Left Column: Transactions & Financial Details */}
        <div className="space-y-8">
          {/* Recent Services Table Container */}
          <div className="bg-surface rounded-[2.5rem] shadow-none border border-border overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500 min-h-[600px] flex flex-col">
            <div className="px-8 py-6 border-b border-border flex flex-col md:flex-row justify-between items-center bg-background backdrop-blur-xl">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Transacciones Recientes
                </h3>
                <p className="text-text-muted text-xs font-medium mt-1">
                  Historial de servicios y pagos
                </p>
              </div>
              <button
                onClick={handleExportExcel}
                className="mt-4 md:mt-0 flex items-center gap-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl hover:bg-primary-600/80 transition shadow-none text-sm font-bold"
              >
                <Download size={16} />
                Exportar Excel
              </button>
            </div>

            <div className="overflow-x-auto flex-1">
              <table className="w-full">
                <thead>
                  <tr className="bg-background border-b border-border">
                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider pl-8">
                      Fecha & Staff
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      Cliente / Servicio
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                      Método
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                      Monto
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase tracking-wider pr-8">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedServices.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-8 py-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center h-[400px]">
                          <div className="w-20 h-20 rounded-full bg-surface-highlight flex items-center justify-center mb-6 border border-border border-dashed">
                             <Inbox className="w-10 h-10 text-text-muted opacity-30" />
                          </div>
                          <h4 className="text-lg font-bold text-text-main mb-2">
                             No hay transacciones recientes
                          </h4>
                          <p className="text-text-muted text-sm max-w-xs mx-auto">
                             Las transacciones de servicios aparecerán aquí una vez registradas.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedServices.map((service) => (
                      <tr
                        key={service.id}
                        className={`group transition-colors hover:bg-white/5 ${service.deleted ? "bg-red-500/10" : ""}`}
                      >
                        <td className="px-6 py-5 pl-8">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-main text-sm">
                              {service.timestamp ? (
                                <>
                                  {format(
                                    service.timestamp.toDate(),
                                    "dd/MM/yyyy",
                                  )}
                                  <span className="text-text-muted text-xs ml-1">
                                    -{" "}
                                    {format(
                                      service.timestamp.toDate(),
                                      "HH:mm",
                                    )}
                                  </span>
                                </>
                              ) : (
                                service.date.split("-").reverse().join("/")
                              )}
                            </span>
                            <span className="text-xs font-semibold text-text-muted">
                              {service.userName}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="font-bold text-text-main text-sm">
                              {service.client}
                            </span>
                            <span className="text-xs text-text-muted truncate max-w-[150px]">
                              {service.service}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                              service.paymentMethod === "cash"
                                ? "bg-primary-400/10 text-primary-400 border-primary-400/20"
                                : "bg-primary-600/10 text-primary-600 border-primary-600/20"
                            }`}
                          >
                            {service.paymentMethod === "cash"
                              ? "Efectivo"
                              : "Transferencia"}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {editingServiceId === service.id ? (
                            <div className="flex justify-end gap-2">
                              <input
                                type="number"
                                value={editingServiceCost}
                                onChange={(e) =>
                                  setEditingServiceCost(e.target.value)
                                }
                                className="w-20 text-right px-2 py-1 border rounded text-sm font-bold text-text-main bg-surface"
                                autoFocus
                              />
                              <button
                                onClick={() =>
                                  handleUpdateServiceCost(
                                    service.id,
                                    parseFloat(editingServiceCost),
                                  )
                                }
                                className="text-primary-400 hover:scale-110 transition"
                              >
                                <Check size={16} />
                              </button>
                              <button
                                onClick={() => setEditingServiceId(null)}
                                className="text-text-muted hover:text-text-main hover:scale-110 transition"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex flex-col items-end">
                              <span
                                className="font-black text-text-main text-base group-hover:text-primary-600 transition-colors cursor-pointer flex items-center gap-2"
                                onClick={() => {
                                  setEditingServiceId(service.id);
                                  setEditingServiceCost(
                                    service.cost.toString(),
                                  );
                                }}
                              >
                                ${Number(service.cost).toFixed(2)}
                              </span>
                              <span className="text-[10px] font-bold text-text-muted">
                                Comisión: $
                                {salonService
                                  .calcCommissionAmount(service, users)
                                  .toFixed(2)}
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right pr-8">
                          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {service.deleted ? (
                              <>
                                <button
                                  onClick={() =>
                                    handleRestoreDeletedService(service.id)
                                  }
                                  className="p-2 rounded-full bg-primary-400/10 text-primary-400 hover:bg-primary-400/20 transition"
                                  title="Restaurar"
                                >
                                  <CheckCircle size={16} />
                                </button>
                                <button
                                  onClick={() =>
                                    handlePermanentlyDeleteService(service.id)
                                  }
                                  className="p-2 rounded-full bg-primary-700/10 text-primary-700 hover:bg-primary-700/20 transition"
                                  title="Borrar Permanente"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() =>
                                  handleSoftDeleteService(service.id)
                                }
                                className="p-2 rounded-full bg-background text-text-muted hover:bg-primary-700/10 hover:text-primary-700 transition"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Services Pagination */}
            {sortedServices.length > ITEMS_PER_PAGE && (
              <div className="px-8 py-4 border-t border-border flex items-center justify-between bg-background">
                <span className="text-xs font-semibold text-text-muted">
                  Mostrando{" "}
                  {Math.min(
                    (servicesPage - 1) * ITEMS_PER_PAGE + 1,
                    sortedServices.length,
                  )}{" "}
                  -{" "}
                  {Math.min(
                    servicesPage * ITEMS_PER_PAGE,
                    sortedServices.length,
                  )}{" "}
                  de {sortedServices.length}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                    disabled={servicesPage === 1}
                    className="p-2 rounded-lg hover:bg-surface hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-text-muted"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="text-sm font-bold text-text-main px-2">
                    {servicesPage}
                  </span>
                  <button
                    onClick={() =>
                      setServicesPage((p) =>
                        p * ITEMS_PER_PAGE < sortedServices.length ? p + 1 : p,
                      )
                    }
                    disabled={
                      servicesPage * ITEMS_PER_PAGE >= sortedServices.length
                    }
                    className="p-2 rounded-lg hover:bg-surface hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-text-muted"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
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
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default OwnerDashboard;
