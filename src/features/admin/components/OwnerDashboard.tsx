import React, { useState, useMemo, useEffect } from "react";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
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
} from "lucide-react";
import type {
  AppUser,
  Service,
  Expense,
  MaterialRecipe,
  CatalogService,
  ChemicalProduct,
  OwnerFilters,
  PaymentMethod,
  Toast,
} from "../../../types";
import * as salonService from "../../../services/salonService";
import * as inventoryService from "../../../services/inventoryService";

interface OwnerDashboardProps {
  services: Service[];
  expenses: Expense[];
  users: AppUser[];
  currentUser: AppUser | null;
  materialRecipes: MaterialRecipe[];
  catalogServices: CatalogService[];  // NEW
  chemicalProducts: ChemicalProduct[];  // NEW
  showNotification: (message: string, type?: Toast["type"]) => void;
  // Actions
  addExpense: (data: Omit<Expense, "id">) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateServiceCost: (id: string, cost: number) => Promise<void>;
  softDeleteService: (id: string, userId?: string) => Promise<void>; // Admin version
  permanentlyDeleteService: (id: string) => Promise<void>;
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
  materialRecipes,
  catalogServices,  // NEW
  chemicalProducts,  // NEW
  showNotification,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    setServicesPage(1);
    setExpensesPage(1);
  }, [ownerFilters]);

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceCost, setEditingServiceCost] = useState("");

  // Local wrappers for actions with UI feedback
  const handleUpdateServiceCost = async (serviceId: string, newCost: number) => {
    try {
      await updateServiceCost(serviceId, newCost);
      setEditingServiceId(null);
      showNotification("Costo actualizado");
    } catch (error) {
      console.error("Error actualizando costo:", error);
      const message = error instanceof Error ? error.message : "Error al actualizar";
      showNotification(message, "error");
    }
  };

  const handleSoftDeleteService = async (serviceId: string) => {
    if (
      !window.confirm(
        "¿Eliminar temporalmente este servicio? (Se guardará como historial)"
      )
    )
      return;

    try {
      await softDeleteService(serviceId, currentUser?.id);
      showNotification("Servicio eliminado temporalmente");
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handlePermanentlyDeleteService = async (serviceId: string) => {
    if (
      !window.confirm(
        "¿Eliminar permanentemente este servicio? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      await permanentlyDeleteService(serviceId);
      showNotification("Servicio eliminado permanentemente");
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      showNotification("Error al eliminar", "error");
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
      const message = error instanceof Error ? error.message : "Error al agregar gasto";
      showNotification(message, "error");
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!window.confirm("¿Eliminar este gasto?")) return;
    try {
      await deleteExpense(id);
      showNotification("Gasto eliminado");
    } catch (error) {
      console.error("Error eliminando gasto:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (!ownerFilters.includeDeleted && s.deleted) return false;
      const matchSearch =
        !ownerFilters.search ||
        s.client.toLowerCase().includes(ownerFilters.search.toLowerCase()) ||
        (s.service?.toLowerCase() || "").includes(ownerFilters.search.toLowerCase()) ||
        s.userName.toLowerCase().includes(ownerFilters.search.toLowerCase());
      const matchDateFrom = !ownerFilters.dateFrom || s.date >= ownerFilters.dateFrom;
      const matchDateTo = !ownerFilters.dateTo || s.date <= ownerFilters.dateTo;
      const matchPayment =
        ownerFilters.paymentMethod === "all" || s.paymentMethod === ownerFilters.paymentMethod;
      return matchSearch && matchDateFrom && matchDateTo && matchPayment;
    });
  }, [services, ownerFilters]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      if (!ownerFilters.includeDeleted && e.deleted) return false;
      const matchDateFrom = !ownerFilters.dateFrom || e.date >= ownerFilters.dateFrom;
      const matchDateTo = !ownerFilters.dateTo || e.date <= ownerFilters.dateTo;
      return matchDateFrom && matchDateTo;
    });
  }, [expenses, ownerFilters]);

  // Export to Excel function
  const handleExportExcel = () => {
    try {
      const dataToExport = filteredServices.map(service => ({
        Fecha: service.date,
        'Realizado por': service.userName,
        Cliente: service.client,
        'Método de Pago': service.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia',
        'Monto Total': service.cost
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
      worksheet['!cols'] = wscols;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte");

      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
      
      saveAs(data, `Reporte_Servicios_${new Date().toISOString().split('T')[0]}.xlsx`);
      showNotification("Reporte exportado exitosamente", "success");
    } catch (error) {
      console.error("Error exporting to Excel:", error);
      showNotification("Error al exportar reporte", "error");
    }
  };

  const totalRevenue = useMemo(
    () => filteredServices.reduce((sum, s) => sum + s.cost, 0),
    [filteredServices]
  );
  
  const totalExpenses = useMemo(
    () =>
      filteredExpenses
        .filter((e) => e.category !== "Comisiones")
        .reduce((sum, e) => sum + e.amount, 0),
    [filteredExpenses]
  );

  const totalCommissions = useMemo(
    () =>
      filteredServices.reduce(
        (sum, s) => sum + salonService.calcCommissionAmount(s, users),
        0
      ),
    [filteredServices, users]
  );

  const totalReplenishmentCost = useMemo(() => {
    const cost = filteredServices.reduce((sum, s) => {
      return (
        sum +
        (s.reposicion ||
          inventoryService.calculateTotalReplenishmentCost(
            s.services || [],
            materialRecipes,
            catalogServices,
            chemicalProducts
          ))
      );
    }, 0);
    // Deduct reposicion expenses to avoid double counting if tracking cash flow
    const repoExpenses = filteredExpenses.reduce((sum, e) => {
      return e.category === "Reposicion" ? sum + e.amount : sum;
    }, 0);
    return Math.max(0, cost - repoExpenses);
  }, [filteredServices, filteredExpenses, materialRecipes, catalogServices, chemicalProducts]);

  const netProfit = useMemo(
    () =>
      totalRevenue - totalExpenses - totalCommissions - totalReplenishmentCost,
    [totalRevenue, totalExpenses, totalCommissions, totalReplenishmentCost]
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
          color: user?.color || "from-gray-400 to-gray-600",
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

  const sortedServices = useMemo(() => [...filteredServices], [filteredServices]);
  const paginatedServices = useMemo(() => {
    const start = (servicesPage - 1) * ITEMS_PER_PAGE;
    return sortedServices.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedServices, servicesPage]);

  const sortedExpenses = useMemo(() => [...filteredExpenses], [filteredExpenses]);
  const paginatedExpenses = useMemo(() => {
    const start = (expensesPage - 1) * ITEMS_PER_PAGE;
    return sortedExpenses.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedExpenses, expensesPage]);

  return (
    <div className="space-y-8 pb-20">
      
      {/* Header & Filters Section */}
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#3A1078] rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-20 pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight">Panel Financiero</h2>
            <p className="text-gray-500 font-medium">Resumen de operaciones y rendimiento</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 bg-gray-50/80 p-2 rounded-2xl border border-gray-200/60 backdrop-blur-sm">
             <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm focus-within:ring-2 focus-within:ring-[#3A1078]/20 transition-all">
                <Search size={18} className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar..."
                  value={ownerFilters.search}
                  onChange={(e) => setOwnerFilters({ ...ownerFilters, search: e.target.value })}
                  className="bg-transparent text-sm w-32 focus:outline-none text-gray-700 font-medium placeholder-gray-400"
                />
             </div>
             
             <div className="h-8 w-px bg-gray-300 mx-1 hidden md:block"></div>

             <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={ownerFilters.dateFrom}
                  onChange={(e) => setOwnerFilters({ ...ownerFilters, dateFrom: e.target.value })}
                  className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3A1078]/20 shadow-sm"
                />
                <span className="text-gray-400 font-bold">-</span>
                <input
                  type="date"
                  value={ownerFilters.dateTo}
                  onChange={(e) => setOwnerFilters({ ...ownerFilters, dateTo: e.target.value })}
                  className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3A1078]/20 shadow-sm"
                />
             </div>

             <div className="h-8 w-px bg-gray-300 mx-1 hidden md:block"></div>

             <select
                value={ownerFilters.paymentMethod}
                onChange={(e) => setOwnerFilters({ ...ownerFilters, paymentMethod: e.target.value as "all" | PaymentMethod })}
                className="bg-white border border-gray-200 text-gray-700 text-sm font-semibold rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#3A1078]/20 shadow-sm cursor-pointer"
             >
                <option value="all">Todos</option>
                <option value="cash">Efectivo</option>
                <option value="transfer">Transferencia</option>
             </select>

             {(ownerFilters.dateFrom || ownerFilters.dateTo || ownerFilters.search || ownerFilters.paymentMethod !== 'all') && (
                <button
                  onClick={() => setOwnerFilters({ dateFrom: "", dateTo: "", paymentMethod: "all", includeDeleted: false, search: "" })}
                  className="ml-2 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-500 hover:bg-red-100 transition-colors"
                  title="Limpiar filtros"
                >
                  <X size={16} />
                </button>
             )}
          </div>
        </div>
        
        <div className="mt-4 flex items-center gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-700 transition-colors">
              <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${ownerFilters.includeDeleted ? 'bg-[#3A1078] border-[#3A1078]' : 'bg-white border-gray-300'}`}>
                  {ownerFilters.includeDeleted && <Check size={12} className="text-white" />}
              </div>
              <input
                type="checkbox"
                checked={ownerFilters.includeDeleted}
                onChange={(e) => setOwnerFilters({ ...ownerFilters, includeDeleted: e.target.checked })}
                className="hidden"
              />
              Ver eliminados
            </label>
        </div>
      </div>

      {/* Premium Stats Cards - Banking Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card - Oro Champagne Premium */}
        <div className="bg-gradient-to-br from-[#A08040] to-[#C5A059] rounded-[2rem] p-6 text-white shadow-2xl shadow-yellow-900/20 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <DollarSign size={120} />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                   <DollarSign size={20} />
                </div>
                <span className="font-medium text-amber-50 text-sm uppercase tracking-wider">Ingresos Brutos</span>
             </div>
             <div>
                <h3 className="text-4xl font-black tracking-tight mb-1 mb-1">${totalRevenue.toFixed(2)}</h3>
                <div className="flex items-center gap-2 text-amber-100 text-xs font-medium bg-black/20 w-fit px-3 py-1 rounded-full">
                   <span>{filteredServices.length} transacciones</span>
                </div>
             </div>
          </div>
        </div>

        {/* Expenses Card - Rosa Ojo de Perdiz Premium */}
        <div className="bg-gradient-to-br from-[#602035] to-[#88304E] rounded-[2rem] p-6 text-white shadow-2xl shadow-rose-900/20 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <CreditCard size={120} />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                   <CreditCard size={20} />
                </div>
                <span className="font-medium text-rose-100 text-sm uppercase tracking-wider">Gastos Totales</span>
             </div>
             <div>
                <h3 className="text-4xl font-black tracking-tight mb-1">${totalExpenses.toFixed(2)}</h3>
                <div className="flex items-center gap-2 text-rose-200 text-xs font-medium bg-rose-900/30 w-fit px-3 py-1 rounded-full">
                   <span>{filteredExpenses.length} movimientos</span>
                </div>
             </div>
          </div>
        </div>

         {/* Replenishment Card - Slate Premium */}
         <div className="bg-gradient-to-br from-[#0F172A] to-[#334155] rounded-[2rem] p-6 text-white shadow-2xl shadow-gray-900/20 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
           <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
             <Package size={120} />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                   <Package size={20} />
                </div>
                <span className="font-medium text-gray-200 text-sm uppercase tracking-wider">Reposición</span>
             </div>
             <div>
                <h3 className="text-4xl font-black tracking-tight mb-1">${totalReplenishmentCost.toFixed(2)}</h3>
                <div className="flex items-center gap-2 text-gray-300 text-xs font-medium bg-gray-800/50 w-fit px-3 py-1 rounded-full">
                   <span>Costo materiales</span>
                </div>
             </div>
          </div>
        </div>

        {/* Net Profit Card - Violeta Real Premium */}
        <div className="bg-gradient-to-br from-[#2A0B55] to-[#3A1078] rounded-[2rem] p-6 text-white shadow-2xl shadow-violet-900/30 relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-4 ring-violet-900/5">
           <div className="absolute inset-0 bg-gradient-to-br from-[#3A1078]/20 to-[#240A48]/40"></div>
           <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
             <Wallet size={120} />
          </div>
          <div className="relative z-10 flex flex-col justify-between h-full min-h-[160px]">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shadow-lg">
                   <Wallet size={20} className="text-white" />
                </div>
                <span className="font-bold text-violet-100 text-sm uppercase tracking-wider">Ganancia Neta</span>
             </div>
             <div>
                <h3 className="text-4xl font-black tracking-tight mb-1 text-white">
                   ${netProfit.toFixed(2)}
                </h3>
                <div className="flex items-center gap-2 text-violet-200 text-xs font-medium">
                   <span>Después de comisiones y costos</span>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* Main Content Areas Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
         
         {/* Left Column: Transactions & Financial Details (2 cols wide) */}
         <div className="xl:col-span-2 space-y-8">
            
            {/* Recent Services Table Container */}
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="px-8 py-6 border-b border-gray-100 flex flex-col md:flex-row justify-between items-center bg-gray-50/50 backdrop-blur-xl">
                  <div>
                     <h3 className="text-xl font-bold text-[#0F172A]">Transacciones Recientes</h3>
                     <p className="text-gray-400 text-xs font-medium mt-1">Historial de servicios y pagos</p>
                  </div>
                  <button
                     onClick={handleExportExcel}
                     className="mt-4 md:mt-0 flex items-center gap-2 bg-[#3A1078] text-white px-5 py-2.5 rounded-xl hover:bg-[#2A0B55] transition shadow-lg shadow-[#3A1078]/10 text-sm font-bold"
                  >
                     <Download size={16} />
                     Exportar Excel
                  </button>
               </div>

               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-100">
                           <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider pl-8">Fecha & Staff</th>
                           <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cliente / Servicio</th>
                           <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Método</th>
                           <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Monto</th>
                           <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider pr-8">Acciones</th>
                        </tr>
                     </thead>
                  <tbody className="divide-y divide-gray-50">
                        {paginatedServices.length === 0 ? (
                           <tr>
                              <td colSpan={5} className="px-8 py-12 text-center text-gray-400 font-medium">No se encontraron servicios.</td>
                           </tr>
                        ) : (
                           paginatedServices.map((service) => (
                              <tr key={service.id} className={`group transition-colors hover:bg-gray-50/80 ${service.deleted ? 'bg-red-50/50' : ''}`}>
                                 <td className="px-6 py-5 pl-8">
                                    <div className="flex flex-col">
                                       <span className="font-bold text-gray-800 text-sm">{service.date}</span>
                                       <span className="text-xs font-semibold text-gray-400">{service.userName}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <div className="flex flex-col">
                                       <span className="font-bold text-gray-800 text-sm">{service.client}</span>
                                       <span className="text-xs text-gray-500 truncate max-w-[150px]">{service.service}</span>
                                    </div>
                                 </td>
                                 <td className="px-6 py-5">
                                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                       service.paymentMethod === 'cash' 
                                          ? 'bg-[#C5A059]/10 text-[#C5A059] border-[#C5A059]/20' 
                                          : 'bg-[#3A1078]/10 text-[#3A1078] border-[#3A1078]/20'
                                    }`}>
                                       {service.paymentMethod === 'cash' ? 'Efectivo' : 'Transferencia'}
                                    </span>
                                 </td>
                                 <td className="px-6 py-5 text-right">
                                    {editingServiceId === service.id ? (
                                       <div className="flex justify-end gap-2">
                                          <input
                                             type="number"
                                             value={editingServiceCost}
                                             onChange={(e) => setEditingServiceCost(e.target.value)}
                                             className="w-20 text-right px-2 py-1 border rounded text-sm font-bold text-gray-900"
                                             autoFocus
                                          />
                                          <button onClick={() => handleUpdateServiceCost(service.id, parseFloat(editingServiceCost))} className="text-[#C5A059] hover:scale-110 transition"><Check size={16}/></button>
                                          <button onClick={() => setEditingServiceId(null)} className="text-gray-400 hover:text-gray-600 hover:scale-110 transition"><X size={16}/></button>
                                       </div>
                                    ) : (
                                       <div className="flex flex-col items-end">
                                          <span className="font-black text-gray-900 text-base group-hover:text-[#3A1078] transition-colors cursor-pointer flex items-center gap-2" onClick={() => { setEditingServiceId(service.id); setEditingServiceCost(service.cost.toString()); }}>
                                             ${Number(service.cost).toFixed(2)}
                                          </span>
                                          <span className="text-[10px] font-bold text-gray-400">Comisión: ${salonService.calcCommissionAmount(service, users).toFixed(2)}</span>
                                       </div>
                                    )}
                                 </td>
                                 <td className="px-6 py-5 text-right pr-8">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       {service.deleted ? (
                                          <>
                                             <button onClick={() => handleRestoreDeletedService(service.id)} className="p-2 rounded-full bg-[#C5A059]/10 text-[#C5A059] hover:bg-[#C5A059]/20 transition" title="Restaurar"><CheckCircle size={16}/></button>
                                             <button onClick={() => handlePermanentlyDeleteService(service.id)} className="p-2 rounded-full bg-[#88304E]/10 text-[#88304E] hover:bg-[#88304E]/20 transition" title="Borrar Permanente"><Trash2 size={16}/></button>
                                          </>
                                       ) : (
                                          <button onClick={() => handleSoftDeleteService(service.id)} className="p-2 rounded-full bg-gray-100 text-gray-500 hover:bg-[#88304E]/10 hover:text-[#88304E] transition" title="Eliminar"><Trash2 size={16}/></button>
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
                 <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <span className="text-xs font-semibold text-gray-400">
                      Mostrando {Math.min((servicesPage - 1) * ITEMS_PER_PAGE + 1, sortedServices.length)} - {Math.min(servicesPage * ITEMS_PER_PAGE, sortedServices.length)} de {sortedServices.length}
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setServicesPage(p => Math.max(1, p - 1))}
                        disabled={servicesPage === 1}
                        className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-gray-600"
                      >
                        <ChevronLeft size={16} />
                      </button>
                      <span className="text-sm font-bold text-gray-700 px-2">
                        {servicesPage}
                      </span>
                      <button
                        onClick={() => setServicesPage(p => (p * ITEMS_PER_PAGE < sortedServices.length ? p + 1 : p))}
                        disabled={servicesPage * ITEMS_PER_PAGE >= sortedServices.length}
                        className="p-2 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all text-gray-600"
                      >
                        <ChevronRight size={16} />
                      </button>
                    </div>
                 </div>
               )}
            </div>

            {/* Commissions Section */}
            <div>
               <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Percent size={20} className="text-[#3A1078]" />
                  Rendimiento del Equipo
               </h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userStats.length === 0 ? (
                     <div className="py-8 text-center text-gray-500 italic bg-white rounded-2xl border border-gray-100">Sin datos de rendimiento.</div>
                  ) : (
                     userStats.map((stat) => (
                        <div key={stat.name} className="bg-white rounded-[2rem] p-6 shadow-lg border border-gray-100 relative overflow-hidden">
                           <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`}></div>
                           <div className="flex justify-between items-start mb-4">
                              <div>
                                 <h4 className="font-bold text-gray-900 text-lg">{stat.name}</h4>
                                 <p className="text-gray-400 text-xs font-medium">{stat.services} servicios realizados</p>
                              </div>
                              <div className="bg-gray-50 px-3 py-1 rounded-lg">
                                 <p className="text-xs text-gray-500 font-bold uppercase">Generado</p>
                                 <p className="text-sm font-black text-gray-800">${stat.revenue.toFixed(2)}</p>
                              </div>
                           </div>
                           
                           <div className="space-y-3">
                              <div className="flex justify-between items-center p-3 rounded-xl bg-[#3A1078]/5 border border-[#3A1078]/10">
                                 <span className="text-xs font-bold text-[#3A1078] uppercase">Comisión Total</span>
                                 <span className="font-bold text-[#3A1078]">${stat.commission.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between items-center p-3 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/20">
                                 <span className="text-xs font-bold text-[#C5A059] uppercase">Pagado</span>
                                 <span className="font-bold text-[#C5A059]">${stat.commissionPaid.toFixed(2)}</span>
                              </div>
                              
                              <div className="pt-2 border-t border-gray-100 flex justify-between items-end">
                                 <span className="text-xs font-semibold text-gray-400">Por pagar</span>
                                 <span className={`text-xl font-black ${stat.commission - stat.commissionPaid < 0 ? 'text-red-500' : 'text-gray-900'}`}>
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
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 p-6 sticky top-6">
               <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#88304E]/10 flex items-center justify-center text-[#88304E]">
                     <CreditCard size={16} />
                  </div>
                  Registrar Gasto
               </h3>

               <div className="space-y-4 mb-8">
                  <div className="space-y-2">
                     <label className="text-xs font-bold text-gray-400 uppercase ml-2">Concepto</label>
                     <input
                        type="text"
                        placeholder="Ej. Recibo de Luz"
                        value={newExpense.description}
                        onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3A1078] focus:ring-4 focus:ring-[#3A1078]/10 transition-all outline-none font-medium text-gray-700"
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Monto</label>
                        <input
                           type="number"
                           placeholder="$0.00"
                           value={newExpense.amount}
                           onChange={(e) => {
                             const val = e.target.value;
                             setNewExpense({ 
                               ...newExpense, 
                               amount: val === "" ? "" : parseFloat(val) 
                             });
                           }}
                           className="w-full h-12 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3A1078] focus:ring-4 focus:ring-[#3A1078]/10 transition-all outline-none font-medium text-gray-700"
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Categoría</label>
                        <div className="relative">
                           <button
                              onClick={() => setShowCategoryList(!showCategoryList)}
                              className="w-full h-12 px-2 rounded-xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-[#3A1078] focus:outline-none font-medium text-gray-700 text-sm text-left flex items-center justify-between"
                           >
                              <span>{newExpense.category}</span>
                              <ChevronDown size={16} className="text-gray-400" />
                           </button>
                           
                           {showCategoryList && (
                              <div className="absolute z-[60] mt-1 max-h-60 overflow-y-auto w-full bg-white border border-gray-200 rounded-xl shadow-2xl">
                                 {["Agua", "Luz", "Renta", "Reposicion", "Comisiones"].map((cat) => (
                                    <div
                                       key={cat}
                                       onClick={() => {
                                          setNewExpense({ ...newExpense, category: cat, userId: "" });
                                          setShowCategoryList(false);
                                       }}
                                       className="p-3 hover:bg-[#88304E]/10 cursor-pointer text-sm font-medium text-gray-700 transition-colors border-b border-gray-50 last:border-0"
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
                        <label className="text-xs font-bold text-gray-400 uppercase ml-2">Personal</label>
                        <button
                           onClick={() => setShowStaffList(!showStaffList)}
                           className="w-full h-12 px-4 rounded-xl bg-purple-50 border border-purple-200 text-purple-900 font-bold focus:outline-none text-left flex items-center justify-between"
                        >
                           <span>
                              {users.find(u => u.id === newExpense.userId)?.name || "Seleccionar personal..."}
                           </span>
                           <ChevronDown size={16} className="text-purple-400" />
                        </button>

                        {showStaffList && (
                           <div className="absolute z-[60] mt-1 max-h-60 overflow-y-auto w-full bg-white border border-gray-200 rounded-xl shadow-2xl">
                              {users.filter((u) => u.role === "staff").map((u) => (
                                 <div
                                    key={u.id}
                                    onClick={() => {
                                       setNewExpense({ ...newExpense, userId: u.id });
                                       setShowStaffList(false);
                                    }}
                                    className="p-3 hover:bg-purple-50 cursor-pointer text-sm font-bold text-gray-700 transition-colors border-b border-gray-50 last:border-0"
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
                        className="w-full h-14 rounded-xl bg-[#3A1078] text-white font-bold text-lg hover:bg-[#2A0B55] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-violet-900/20 flex items-center justify-center gap-2"
                     >
                        <DollarSign size={20} />
                        Agregar Gasto
                     </button>
                  </div>
               </div>

               <div className="border-t border-gray-100 pt-6">
                  <h4 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">Últimos Gastos</h4>
                  <div className="space-y-3">
                     {paginatedExpenses.length === 0 ? (
                        <p className="text-sm text-gray-400 italic text-center py-4">No hay gastos recientes.</p>
                     ) : (
                        paginatedExpenses.map((expense) => (
                           <div key={expense.id} className="group flex justify-between items-center p-3 rounded-xl bg-gray-50 hover:bg-white hover:shadow-md border border-transparent hover:border-gray-100 transition-all">
                              <div className="flex flex-col">
                                 <span className="font-bold text-gray-700 text-sm">{expense.description}</span>
                                 <div className="flex gap-2 text-xs">
                                    <span className="text-gray-400">{expense.category}</span>
                                    <span className="text-gray-300">•</span>
                                    <span className="text-gray-400 font-medium">{expense.date}</span>
                                 </div>
                              </div>
                              <div className="flex items-center gap-3">
                                 <span className="font-bold text-[#88304E] block text-right">${expense.amount.toFixed(2)}</span>
                                 <button
                                    onClick={() => handleDeleteExpense(expense.id)}
                                    className="text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
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
                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                       <span className="text-[10px] font-semibold text-gray-400">
                         {Math.min((expensesPage - 1) * ITEMS_PER_PAGE + 1, sortedExpenses.length)}-{Math.min(expensesPage * ITEMS_PER_PAGE, sortedExpenses.length)} de {sortedExpenses.length}
                       </span>
                       <div className="flex items-center gap-1">
                         <button
                           onClick={() => setExpensesPage(p => Math.max(1, p - 1))}
                           disabled={expensesPage === 1}
                           className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-gray-500"
                         >
                           <ChevronLeft size={14} />
                         </button>
                         <button
                           onClick={() => setExpensesPage(p => (p * ITEMS_PER_PAGE < sortedExpenses.length ? p + 1 : p))}
                           disabled={expensesPage * ITEMS_PER_PAGE >= sortedExpenses.length}
                           className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:hover:bg-transparent transition-all text-gray-500"
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
    </div>
  );
};

export default OwnerDashboard;
