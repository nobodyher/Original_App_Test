import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { format } from "date-fns";
import {
  Search,
  DollarSign,
  CreditCard,
  Package,
  Wallet,
  Percent,
  Trash2,
  Download,
  Check,
  X,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Inbox,
  Users,
} from "lucide-react";
import type {
  AppUser,
  Service,
  Expense,
  
  CatalogService,
  OwnerFilters,
  PaymentMethod,
  Toast,
  
  InventoryItem,
} from "../../../types";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import * as salonService from "../../../services/salonService";
import * as inventoryService from "../../../services/inventoryService";
import { CustomSelect } from "../../../components/ui/CustomSelect";
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
  addExpense: (data: Omit<Expense, "id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateServiceCost: (id: string, cost: number) => Promise<void>;
  softDeleteService: (id: string, userId?: string, inventoryContext?: { service: Service; inventoryItems: InventoryItem[]; catalogServices: CatalogService[] }) => Promise<void>;
  permanentlyDeleteService: (id: string, inventoryContext?: { service: Service; inventoryItems: InventoryItem[]; catalogServices: CatalogService[] }) => Promise<void>;
  restoreDeletedService: (id: string) => Promise<void>;
}

interface ExpenseFormState {
  date: string;
  description: string;
  category: string;
  amount: number | "";
  userId: string;
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
  addExpense,
  deleteExpense,
  updateServiceCost,
  softDeleteService,
  permanentlyDeleteService,
  restoreDeletedService,
}) => {
  const [ownerFilters, setOwnerFilters] = useState<OwnerFilters>({
    dateFrom: "",
    dateTo: "",
    paymentMethod: "all",
    includeDeleted: false,
    search: "",
  });

  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showStaffList, setShowStaffList] = useState(false);

  const [newExpense, setNewExpense] = useState<ExpenseFormState>({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "Agua",
    amount: "",
    userId: "",
  });

  // Pagination State
  const [servicesPage, setServicesPage] = useState(1);
  const [expensesPage, setExpensesPage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    setServicesPage(1);
    setExpensesPage(1);
  }, [ownerFilters]);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceCost, setEditingServiceCost] = useState("");

  // Confirmation Modal State
  type DashboardAction = {
    type: "soft_delete_service" | "permanent_delete_service" | "delete_expense";
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

  const handleDeleteExpense = (id: string) => {
    setActionToConfirm({ type: "delete_expense", id });
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
        case "delete_expense":
          await deleteExpense(actionToConfirm.id);
          showNotification("Gasto eliminado");
          break;
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
      case "delete_expense":
        return {
          title: "Eliminar Gasto",
          message: "¿Eliminar este gasto? Se recalcularán los totales.",
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

  const handleAddExpense = async () => {
    try {
      await addExpense({
        date: newExpense.date,
        description: newExpense.description,
        category: newExpense.category,
        amount: newExpense.amount === "" ? 0 : newExpense.amount,
        userId: newExpense.userId,
      });

      setNewExpense({
        date: new Date().toISOString().split("T")[0],
        description: "",
        category: "Agua",
        amount: "",
        userId: "",
      });
      showNotification("Gasto agregado");
    } catch (error) {
      console.error("Error agregando gasto:", error);
      const message =
        error instanceof Error ? error.message : "Error al agregar gasto";
      showNotification(message, "error");
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
        .filter((e) => e.category !== "Comisiones")
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

  const userStats = useMemo(() => {
    const stats: Record<
      string,
      {
        name: string;
        revenue: number;
        commission: number;
        commissionPaid: number;
        services: number;
        color: string;
      }
    > = {};

    filteredServices.forEach((s) => {
      if (!stats[s.userId]) {
        const user = users.find((u) => u.id === s.userId);
        stats[s.userId] = {
          name: s.userName,
          revenue: 0,
          commission: 0,
          commissionPaid: 0,
          services: 0,
          color: user?.color || "from-text-muted to-text-main",
        };
      }
      stats[s.userId].revenue += s.cost;
      stats[s.userId].commission += salonService.calcCommissionAmount(s, users);
      stats[s.userId].services++;
    });

    filteredExpenses.forEach((e) => {
      if (e.category === "Comisiones" && e.userId) {
        if (stats[e.userId]) {
          stats[e.userId].commissionPaid += e.amount;
        }
      }
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [filteredServices, filteredExpenses, users]);

  const sortedServices = useMemo(
    () => [...filteredServices],
    [filteredServices],
  );
  const paginatedServices = useMemo(() => {
    const start = (servicesPage - 1) * ITEMS_PER_PAGE;
    return sortedServices.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedServices, servicesPage]);

  const sortedExpenses = useMemo(
    () => [...filteredExpenses],
    [filteredExpenses],
  );
  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * ITEMS_PER_PAGE;
    return sortedExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedExpenses, expensesPage]);

  return (
    <div className="space-y-8 pb-20">
      {/* Header & Filters Section */}
      <div className="bg-surface rounded-3xl shadow-none border border-border p-6 relative">
        <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20"></div>
        </div>

        <div className="relative z-20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black text-text-main tracking-tight">
              Panel Financiero
            </h2>

          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 bg-background p-2 rounded-2xl border border-border backdrop-blur-sm w-full md:w-auto mb-6 md:mb-0">
            {/* Search - Order 1 on mobile */}
            <div className="order-1 flex items-center gap-2 bg-surface px-3 py-2 rounded-xl border border-border shadow-sm focus-within:ring-2 focus-within:ring-primary-600/20 transition-all w-full md:w-auto">
              <Search size={18} className="text-text-muted" />
              <input
                type="text"
                placeholder="Buscar..."
                value={ownerFilters.search}
                onChange={(e) =>
                  setOwnerFilters({ ...ownerFilters, search: e.target.value })
                }
                className="bg-transparent text-sm w-full md:w-32 focus:outline-none text-text-main font-medium placeholder-text-muted"
              />
            </div>

            <div className="h-8 w-px bg-border mx-1 hidden md:block order-2"></div>

            {/* Dates - Order 2 on mobile */}
            <div className="order-2 flex flex-col sm:flex-row items-center gap-2 w-full md:w-auto">
              <input
                type="date"
                value={ownerFilters.dateFrom}
                onChange={(e) =>
                  setOwnerFilters({ ...ownerFilters, dateFrom: e.target.value })
                }
                className="bg-surface border border-border text-text-main text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600/20 shadow-sm w-full sm:flex-1 md:w-auto md:flex-none"
              />
              <span className="text-text-muted font-bold hidden md:inline">-</span>
              <input
                type="date"
                value={ownerFilters.dateTo}
                onChange={(e) =>
                  setOwnerFilters({ ...ownerFilters, dateTo: e.target.value })
                }
                className="bg-surface border border-border text-text-main text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-600/20 shadow-sm w-full sm:flex-1 md:w-auto md:flex-none"
              />
            </div>

            <div className="h-8 w-px bg-border mx-1 hidden md:block order-3"></div>

            {/* Payment Method - Order 3 on mobile */}
            <div className="order-3 w-full md:w-48">
              <CustomSelect
                value={ownerFilters.paymentMethod}
                onChange={(val) =>
                  setOwnerFilters({
                    ...ownerFilters,
                    paymentMethod: val as "all" | PaymentMethod,
                  })
                }
                options={[
                  { label: "Todos", value: "all" },
                  { label: "Efectivo", value: "cash" },
                  { label: "Transferencia", value: "transfer" },
                ]}
                placeholder="Método de Pago"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <label className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wide cursor-pointer hover:text-text-main transition-colors">
            <div
              className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ownerFilters.includeDeleted ? "bg-primary-600 border-primary-600" : "bg-surface border-border"}`}
            >
              {ownerFilters.includeDeleted && (
                <Check size={12} className="text-white" />
              )}
            </div>
            <input
              type="checkbox"
              checked={ownerFilters.includeDeleted}
              onChange={(e) =>
                setOwnerFilters({
                  ...ownerFilters,
                  includeDeleted: e.target.checked,
                })
              }
              className="hidden"
            />
            Ver eliminados
          </label>
        </div>
      </div>

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
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Transactions & Financial Details (2 cols wide) */}
        <div className="xl:col-span-2 space-y-8">
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

          {/* Commissions Section */}
          <div>
            <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
              <Percent size={20} className="text-primary-600" />
              Rendimiento del Equipo
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {userStats.length === 0 ? (
                <div className="col-span-2 py-12 flex flex-col items-center justify-center text-center p-8 bg-surface rounded-[2rem] border border-border border-dashed">
                  <div className="w-16 h-16 rounded-full bg-surface-highlight flex items-center justify-center mb-4">
                    <Users className="w-8 h-8 text-text-muted opacity-50" />
                  </div>
                  <h4 className="text-lg font-bold text-text-main mb-1">
                    Sin datos de rendimiento
                  </h4>
                  <p className="text-text-muted text-sm max-w-[250px]">
                    No hay actividad registrada para el equipo aún.
                  </p>
                </div>
              ) : (
                userStats.map((stat) => (
                  <div
                    key={stat.name}
                    className="bg-surface rounded-[2rem] p-6 shadow-none border border-border relative overflow-hidden group hover:border-primary-600/30 transition-colors"
                  >
                    <div
                      className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`}
                    ></div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-bold text-text-main text-lg">
                          {stat.name}
                        </h4>
                        <p className="text-text-muted text-xs font-medium">
                          {stat.services} servicios realizados
                        </p>
                      </div>
                      <div className="bg-background px-3 py-1 rounded-lg">
                        <p className="text-xs text-text-muted font-bold uppercase">
                          Generado
                        </p>
                        <p className="text-sm font-black text-text-main">
                          ${stat.revenue.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 rounded-xl bg-primary-600/10 border border-primary-600/20">
                        <span className="text-xs font-bold text-primary-600 uppercase">
                          Comisión Total
                        </span>
                        <span className="font-bold text-primary-600">
                          ${stat.commission.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center p-3 rounded-xl bg-primary-400/10 border border-primary-400/20">
                        <span className="text-xs font-bold text-primary-400 uppercase">
                          Pagado
                        </span>
                        <span className="font-bold text-primary-400">
                          ${stat.commissionPaid.toFixed(2)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-border flex justify-between items-end">
                        <span className="text-xs font-semibold text-text-muted">
                          Por pagar
                        </span>
                        <span
                          className={`text-xl font-black ${stat.commission - stat.commissionPaid < 0 ? "text-red-500" : "text-text-main"}`}
                        >
                          ${(stat.commission - stat.commissionPaid).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Expenses Management */}
        <div className="xl:col-span-1">
          <div className="bg-surface rounded-[2.5rem] shadow-none border border-border p-6 sticky top-6">
            <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary-700/10 flex items-center justify-center text-primary-700">
                <CreditCard size={16} />
              </div>
              Registrar Gasto
            </h3>

            <div className="space-y-4 mb-8">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase ml-2">
                  Concepto
                </label>
                <input
                  type="text"
                  placeholder="Ej. Recibo de Luz"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                  className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:bg-surface focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 transition-all outline-none font-medium text-text-main"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase ml-2">
                    Monto
                  </label>
                  <input
                    type="number"
                    placeholder="$0.00"
                    value={newExpense.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      setNewExpense({
                        ...newExpense,
                        amount: val === "" ? "" : parseFloat(val),
                      });
                    }}
                    className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:bg-surface focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 transition-all outline-none font-medium text-text-main"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase ml-2">
                    Categoría
                  </label>
                  <div className="relative">
                    <button
                      onClick={() => setShowCategoryList(!showCategoryList)}
                      className="w-full h-12 px-2 rounded-xl bg-background border border-border focus:bg-surface focus:border-primary-600 focus:outline-none font-medium text-text-main text-sm text-left flex items-center justify-between"
                    >
                      <span>{newExpense.category}</span>
                      <ChevronDown size={16} className="text-text-muted" />
                    </button>

                    {showCategoryList && (
                      <div className="absolute z-[60] mt-1 max-h-60 overflow-y-auto w-full bg-surface border border-border rounded-xl shadow-2xl">
                        {[
                          "Agua",
                          "Luz",
                          "Renta",
                          "Reposicion",
                          "Comisiones",
                        ].map((cat) => (
                          <div
                            key={cat}
                            onClick={() => {
                              setNewExpense({
                                ...newExpense,
                                category: cat,
                                userId: "",
                              });
                              setShowCategoryList(false);
                            }}
                            className="p-3 hover:bg-primary-700/10 cursor-pointer text-sm font-medium text-text-main transition-colors border-b border-background last:border-0"
                          >
                            {cat}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {newExpense.category === "Comisiones" && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 relative">
                  <label className="text-xs font-bold text-text-muted uppercase ml-2">
                    Personal
                  </label>
                  <button
                    onClick={() => setShowStaffList(!showStaffList)}
                    className="w-full h-12 px-4 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 font-bold focus:outline-none text-left flex items-center justify-between"
                  >
                    <span>
                      {users.find((u) => u.id === newExpense.userId)?.name ||
                        "Seleccionar personal..."}
                    </span>
                    <ChevronDown size={16} className="text-purple-400" />
                  </button>

                  {showStaffList && (
                    <div className="absolute z-[60] mt-1 max-h-60 overflow-y-auto w-full bg-surface border border-border rounded-xl shadow-2xl">
                      {users
                        .filter((u) => u.role === "staff")
                        .map((u) => (
                          <div
                            key={u.id}
                            onClick={() => {
                              setNewExpense({ ...newExpense, userId: u.id });
                              setShowStaffList(false);
                            }}
                            className="p-3 hover:bg-purple-500/10 cursor-pointer text-sm font-bold text-text-main transition-colors border-b border-background last:border-0"
                          >
                            {u.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              <div className="pt-2">
                <button
                  onClick={handleAddExpense}
                  className="w-full h-14 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-600/80 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-none flex items-center justify-center gap-2"
                >
                  <DollarSign size={20} />
                  Agregar Gasto
                </button>
              </div>
            </div>

            <div className="border-t border-border pt-6">
              <h4 className="text-xs font-bold text-text-muted uppercase mb-4 tracking-wider">
                Últimos Gastos
              </h4>
              <div className="space-y-3">
                {paginatedExpenses.length === 0 ? (
                  <p className="text-sm text-text-muted italic text-center py-4">
                    No hay gastos recientes.
                  </p>
                ) : (
                  paginatedExpenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="group flex justify-between items-center p-3 rounded-xl bg-background hover:bg-surface hover:shadow-none border border-transparent hover:border-border transition-all"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-text-main text-sm">
                          {expense.description}
                        </span>
                        <div className="flex gap-2 text-xs">
                          <span className="text-text-muted">
                            {expense.category}
                          </span>
                          <span className="text-text-muted">•</span>
                          <span className="text-text-muted font-medium">
                            {expense.date}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-primary-700 block text-right">
                          ${expense.amount.toFixed(2)}
                        </span>
                        <button
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-text-muted hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Expenses Pagination */}
              {sortedExpenses.length > ITEMS_PER_PAGE && (
                <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-text-muted">
                    {Math.min(
                      (expensesPage - 1) * ITEMS_PER_PAGE + 1,
                      sortedExpenses.length,
                    )}
                    -
                    {Math.min(
                      expensesPage * ITEMS_PER_PAGE,
                      sortedExpenses.length,
                    )}{" "}
                    de {sortedExpenses.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpensesPage((p) => Math.max(1, p - 1))}
                      disabled={expensesPage === 1}
                      className="p-1 rounded hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-muted"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      onClick={() =>
                        setExpensesPage((p) =>
                          p * ITEMS_PER_PAGE < sortedExpenses.length
                            ? p + 1
                            : p,
                        )
                      }
                      disabled={
                        expensesPage * ITEMS_PER_PAGE >= sortedExpenses.length
                      }
                      className="p-1 rounded hover:bg-background disabled:opacity-30 disabled:hover:bg-transparent transition-all text-text-muted"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
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
