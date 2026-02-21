import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  DollarSign,
  CreditCard,
  Users,
  Trash2,
  ChevronDown,
  Calendar,
  Filter,
  Package,
  Wallet,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import MobileNavigation from "../../components/layout/MobileNavigation";
import * as salonService from "../../services/salonService";
import ConfirmationModal from "../../components/ui/ConfirmationModal";
import { useSalonContext } from "../../context/SalonContext";
import { PaymentDrawer } from "./components/PaymentDrawer";

interface ExpenseFormState {
  date: string;
  description: string;
  category: string;
  amount: number | "";
  staffId: string;
}

const FinanceScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    services,
    expenses,
    users,
    addExpense,
    deleteExpense,
    showNotification,
    currentUser,
  } = useSalonContext();

  // Sidebar state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [adminSubTab, setAdminSubTab] = useState<"catalog" | "inventory" | "personal">("personal");

  const handleLogout = () => {
    navigate("/login");
  };

  const [activeTab, setActiveTab] = useState<"staff" | "expenses">("staff");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // ... (existing state)
  const [dateFilter, setDateFilter] = useState({
    from: "",
    to: "",
  });

  // --- Expenses State ---
  const [newExpense, setNewExpense] = useState<ExpenseFormState>({
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
    category: "Agua",
    amount: "",
    staffId: "",
  });
  const [showCategoryList, setShowCategoryList] = useState(false);
  const [showStaffList, setShowStaffList] = useState(false);
  const [actionToConfirm, setActionToConfirm] = useState<string | null>(null); // ID of expense to delete
  const [isSubmitting, setIsSubmitting] = useState(false);

  const userStats = useMemo(() => {
    // Filter services inside useMemo
    const filteredServices = services.filter((s) => {
      if (s.deleted) return false;
      // Filter by date if set
      const matchDateFrom = !dateFilter.from || s.date >= dateFilter.from;
      const matchDateTo = !dateFilter.to || s.date <= dateFilter.to;
      return matchDateFrom && matchDateTo;
    });

    const filteredExpensesList = expenses.filter((e) => {
      if (e.deleted) return false;
      const matchDateFrom = !dateFilter.from || e.date >= dateFilter.from;
      const matchDateTo = !dateFilter.to || e.date <= dateFilter.to;
      return matchDateFrom && matchDateTo;
    });

    const stats: Record<
      string,
      {
        userId: string;
        name: string;
        revenue: number;
        commission: number; // This will now represent "Total Earnings" (Commission + Base)
        commissionPaid: number;
        services: number;
        color: string;
        paymentType: 'commission' | 'fixed' | 'hybrid';
        baseSalary: number;
      }
    > = {};

    // 1. Initialize all active staff to ensure they appear even without services (important for Fixed/Hybrid)
    users
      .filter((u) => u.role !== "owner" && u.active)
      .forEach((u) => {
        stats[u.id] = {
          userId: u.id,
          name: u.name,
          revenue: 0,
          commission: 0,
          commissionPaid: 0,
          services: 0,
          color: u.color || "from-gray-500 to-gray-700",
          paymentType: u.paymentType || 'commission',
          baseSalary: Number(u.baseSalary) || 0,
        };
        
        // Add Base Salary to commission (Total Earnings) initially for Fixed/Hybrid
        if (u.paymentType === 'fixed' || u.paymentType === 'hybrid') {
             stats[u.id].commission += (Number(u.baseSalary) || 0);
        }
      });

    // 2. Add Service Revenue and Commissions
    filteredServices.forEach((s) => {
      // If user not in stats (e.g. inactive but has history), initialize them
      if (!stats[s.userId]) {
        const user = users.find((u) => u.id === s.userId);
        stats[s.userId] = {
          userId: s.userId,
          name: s.userName,
          revenue: 0,
          commission: 0,
          commissionPaid: 0,
          services: 0,
          color: user?.color || "from-gray-500 to-gray-700",
          paymentType: user?.paymentType || 'commission',
          baseSalary: Number(user?.baseSalary) || 0,
        };
        // Add base salary if applicable (though likely 0 if inactive/not found properly)
         if (stats[s.userId].paymentType === 'fixed' || stats[s.userId].paymentType === 'hybrid') {
             stats[s.userId].commission += stats[s.userId].baseSalary;
        }
      }

      stats[s.userId].revenue += s.cost;
      
      // Calculate Commission from Service
      const serviceCommission = salonService.calcCommissionAmount(s, users);
      
      // Add to total earnings ONLY if Commission or Hybrid
      // If Fixed, service commission doesn't add to earnings (unless specific override, but standard fixed is just fixed)
      if (stats[s.userId].paymentType !== 'fixed') {
          stats[s.userId].commission += serviceCommission;
      }
      
      stats[s.userId].services++;
    });

    // 3. Subtract Paid Amounts
    filteredExpensesList.forEach((e) => {
      // Check for staffId priority, fallback to userId for legacy records
      const targetStaffId = e.staffId;
      
      if ((e.category === "Comisiones" || e.category === "Sueldos") && targetStaffId) {
        if (stats[targetStaffId]) {
          stats[targetStaffId].commissionPaid += e.amount;
        } else {
            // Handle edge case: User has payments but is not active/initialized
             const user = users.find((u) => u.id === targetStaffId);
             if (user) {
                stats[targetStaffId] = {
                  userId: targetStaffId,
                  name: user.name,
                  revenue: 0,
                  commission: 0, // Will be negative pending if we don't add base, but simple logic for now
                  commissionPaid: e.amount,
                  services: 0,
                  color: user.color || "from-gray-500 to-gray-700",
                  paymentType: user.paymentType || 'commission',
                  baseSalary: Number(user.baseSalary) || 0,
                };
                 if (stats[targetStaffId].paymentType === 'fixed' || stats[targetStaffId].paymentType === 'hybrid') {
                     stats[targetStaffId].commission += stats[targetStaffId].baseSalary;
                }
             }
        }
      }
    });

    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [services, expenses, users, dateFilter]);

  const [expenseSubTab, setExpenseSubTab] = useState<"general" | "payroll">("general");

  // --- Logic for Expenses (Tab 2) ---
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => {
        if (e.deleted) return false;
        
        // Filter by Date
        const matchDateFrom = !dateFilter.from || e.date >= dateFilter.from;
        const matchDateTo = !dateFilter.to || e.date <= dateFilter.to;
        
        // Filter by SubTab (General vs Payroll)
        const isPayroll = !!e.staffId;
        const matchSubTab = expenseSubTab === "payroll" ? isPayroll : !isPayroll;

        return matchDateFrom && matchDateTo && matchSubTab;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, dateFilter, expenseSubTab]);

  // --- Global Balance Calculations (filtered by tenantId) ---
  // Note: services and expenses are already filtered by tenantId at Firestore level (useSalonData hook)
  const globalBalance = useMemo(() => {
    const activeServices = services.filter((s) => !s.deleted);

    // Total revenue from all non-deleted services
    const totalIngresos = activeServices.reduce((sum, s) => sum + (s.cost || 0), 0);

    // Fondo de Reposición: sum of material costs stored in each service record
    // The `reposicion` field is saved at time of sale and reflects actual material usage
    const totalMaterialCost = activeServices.reduce((sum, s) => sum + (s.reposicion || 0), 0);

    // Total expenses (all categories)
    const allExpenses = expenses.filter((e) => !e.deleted);

    // Staff payments (commissions + salaries)
    const totalPersonal = allExpenses
      .filter((e) => e.category === "Comisiones" || e.category === "Sueldos")
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    // General expenses (everything except staff payments)
    const totalGenerales = allExpenses
      .filter((e) => e.category !== "Comisiones" && e.category !== "Sueldos")
      .reduce((sum, e) => sum + (e.amount || 0), 0);

    const totalGastos = totalPersonal + totalGenerales;

    // Fondo de Reposición = total material cost used in services
    // (what you need to restock to keep operating)
    const fondoReposicion = totalMaterialCost;

    // Ganancia disponible: revenue minus ALL expenses (staff + general)
    const gananciaDisponible = totalIngresos - totalGastos;

    return {
      totalIngresos,
      totalGastos,
      fondoReposicion,
      gananciaDisponible: Math.max(0, gananciaDisponible),
    };
  }, [services, expenses]);

  const handleAddExpense = async () => {
    try {
      if (!newExpense.amount || !newExpense.description) {
        showNotification("Completa los campos obligatorios", "error");
        return;
      }

      await addExpense({
        date: newExpense.date,
        description: newExpense.description,
        category: newExpense.category,
        amount: !newExpense.amount ? 0 : Number(newExpense.amount),
        staffId: newExpense.staffId,
        registeredBy: currentUser?.id,
      });

      setNewExpense({
        date: format(new Date(), "yyyy-MM-dd"),
        description: "",
        category: "Agua",
        amount: "",
        staffId: "",
      });
      showNotification("Gasto agregado");
    } catch (error) {
      console.error("Error agregando gasto:", error);
      showNotification("Error al agregar gasto", "error");
    }
  };

  const handleDeleteExpense = async () => {
    if (!actionToConfirm) return;
    setIsSubmitting(true);
    try {
      await deleteExpense(actionToConfirm);
      showNotification("Gasto eliminado");
      setActionToConfirm(null);
    } catch (error) {
      console.error("Error eliminando gasto:", error);
      showNotification("Error al eliminar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegisterPayment = async (amount: number, description: string, category: string) => {
    if (!selectedEmployeeId) return;

    try {
      await addExpense({
        date: format(new Date(), "yyyy-MM-dd"),
        description,
        category,
        amount,
        staffId: selectedEmployeeId,
        registeredBy: currentUser?.id,
      });
      showNotification("Pago registrado con éxito");
    } catch (error) {
      console.error("Error registering payment:", error);
      showNotification("Error al registrar el pago", "error");
      throw error;
    }
  };

  return (
    <div className="flex h-screen w-full bg-background text-text-main overflow-hidden font-header">
      <Sidebar
        currentView="finance"
        adminSubTab={adminSubTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isAdminOpen={isAdminOpen}
        setIsAdminOpen={setIsAdminOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
        onNavigate={(view) => {
          if (view !== "finance") {
            localStorage.setItem("owner_currentView", view);
            navigate("/admin");
          }
        }}
        onAdminSubTabChange={(tab) => {
          setAdminSubTab(tab); // Update local state for immediate feedback
          localStorage.setItem("owner_currentView", "admin");
          localStorage.setItem("owner_adminSubTab", tab);
          navigate("/admin");
        }}
        showNotification={showNotification}

      />

      <MobileNavigation 
        currentUser={currentUser}
        currentView="finance"
        onNavigate={(view) => {
          if (view !== "finance") {
            localStorage.setItem("owner_currentView", view);
            navigate("/admin");
          }
        }}
        onLogout={handleLogout}
        showNotification={showNotification}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <main className="flex-1 overflow-y-auto relative bg-background scroll-smooth p-4 md:p-8 pt-24 md:pt-8">
          <div className="max-w-7xl mx-auto space-y-6 pb-20 animate-fade-in-up">
            {/* Header with Title and Date */}
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-4 py-4 md:py-6">
              <div>
                <h2 className="text-3xl font-black text-text-main tracking-tight">
                  Finanzas
                </h2>
                <p className="text-text-muted font-medium mt-1">
                  Métricas y reportes financieros
                </p>
              </div>
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-text-muted bg-surface px-4 py-2 rounded-full border border-border shadow-sm flex items-center gap-2">
                  <Calendar size={16} />
                  <span className="capitalize">
                    {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
                  </span>
                </p>
              </div>
            </header>

            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border-b border-border pb-4">
              <div className="flex bg-surface p-1 rounded-xl border border-border">
                <button
                  onClick={() => setActiveTab("staff")}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === "staff"
                      ? "bg-primary-600 text-white shadow-md"
                      : "text-text-muted hover:text-text-main hover:bg-surface-highlight"
                  }`}
                >
                  <Users size={16} />
                  Pagos a Personal
                </button>
                <button
                  onClick={() => setActiveTab("expenses")}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
                    activeTab === "expenses"
                      ? "bg-primary-600 text-white shadow-md"
                      : "text-text-muted hover:text-text-main hover:bg-surface-highlight"
                  }`}
                >
                  <CreditCard size={16} />
                  Gastos Generales
                </button>
              </div>

              {/* Global Date Filter */}
              <div className="flex items-center gap-2 bg-surface p-2 rounded-xl border border-border">
                <Calendar size={16} className="text-text-muted ml-2" />
                <input
                  type="date"
                  value={dateFilter.from}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, from: e.target.value })
                  }
                  className="bg-transparent text-sm font-medium text-text-main focus:outline-none w-32"
                  placeholder="Desde"
                />
                <span className="text-text-muted">-</span>
                <input
                  type="date"
                  value={dateFilter.to}
                  onChange={(e) =>
                    setDateFilter({ ...dateFilter, to: e.target.value })
                  }
                  className="bg-transparent text-sm font-medium text-text-main focus:outline-none w-32"
                  placeholder="Hasta"
                />
                {(dateFilter.from || dateFilter.to) && (
                  <button
                    onClick={() => setDateFilter({ from: "", to: "" })}
                    className="p-1 hover:bg-red-500/10 hover:text-red-500 rounded-full text-text-muted transition-colors"
                    title="Limpiar filtros"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Content Area */}
            {activeTab === "staff" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userStats.length === 0 ? (
                  <div className="col-span-full py-12 flex flex-col items-center justify-center text-center p-8 bg-surface rounded-[2rem] border border-border border-dashed">
                    <div className="w-16 h-16 rounded-full bg-surface-highlight flex items-center justify-center mb-4">
                      <Users className="w-8 h-8 text-text-muted opacity-50" />
                    </div>
                    <h4 className="text-lg font-bold text-text-main mb-1">
                      Sin datos de rendimiento
                    </h4>
                    <p className="text-text-muted text-sm max-w-[250px]">
                      No hay actividad registrada en este periodo.
                    </p>
                  </div>
                ) : (
                  userStats.map((stat) => (
                    <div
                      key={stat.name}
                      onClick={() => setSelectedEmployeeId(stat.userId)}
                      className="bg-surface rounded-[2rem] p-6 shadow-sm border border-border relative overflow-hidden group hover:border-primary-600/30 transition-all hover:-translate-y-1 cursor-pointer"
                    >
                      <div
                        className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stat.color}`}
                      ></div>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-bold text-lg text-text-main flex items-center gap-2">
                             {stat.name}
                          </h3>
                          <p className="text-xs text-text-muted font-medium">
                            {stat.services} servicios
                          </p>
                        </div>
                        <div className="bg-background px-3 py-1 rounded-lg border border-border">
                          <p className="text-xs text-text-muted font-bold uppercase">
                            Generado
                          </p>
                          <p className="text-sm font-black text-text-main">
                            ${stat.revenue.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {/* Payment Info / Breakdown */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-border/50">
                    <div className="flex justify-between items-center">
                        <span className="text-xs font-semibold text-text-muted">
                            {stat.paymentType === 'fixed' ? 'Sueldo Fijo' : 
                             stat.paymentType === 'hybrid' ? 'Híbrido' : 'Comisión'}
                        </span>
                        {stat.paymentType === 'hybrid' && (
                           <span className="text-[10px] bg-primary-50 dark:bg-primary-900/20 text-primary-600 px-1.5 py-0.5 rounded">
                             Base: ${stat.baseSalary}
                           </span>
                        )}
                    </div>
                    
                    <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-text-muted">
                        Total Ganado
                      </span>
                      <span className="text-xl font-black text-text-main">
                        ${stat.commission.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex justify-between items-baseline">
                       <span className="text-xs text-emerald-600 font-medium bg-emerald-50 dark:bg-emerald-900/20 px-1.5 py-0.5 rounded">
                         Pagado: ${stat.commissionPaid.toFixed(2)}
                       </span>
                    </div>
                  </div>

                  {/* Pending Payment Indicator */}
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-text-muted">
                        Pendiente
                      </span>
                      <span
                        className={`text-2xl font-black ${
                          stat.commission - stat.commissionPaid > 0
                            ? "text-primary-600"
                            : "text-green-500"
                        }`}
                      >
                        $
                        {Math.max(
                          0,
                          stat.commission - stat.commissionPaid,
                        ).toFixed(2)}
                      </span>
                    </div>
                    {stat.commission - stat.commissionPaid > 0 && (
                      <div className="mt-2 text-xs font-bold text-center text-white bg-primary-600 py-1.5 rounded-lg shadow-sm group-hover:bg-primary-700 transition-colors">
                        Click para Pagar
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Financial Context Cards */}
                <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Card A: Fondo de Reposición */}
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-cyan-500/20 bg-surface p-5 flex items-center gap-4 group hover:border-cyan-500/40 transition-all shadow-sm dark:shadow-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-transparent pointer-events-none" />
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                      <Package size={22} className="text-cyan-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-cyan-400/80 uppercase tracking-wider mb-0.5">Fondo de Reposición</p>
                      <p className="text-2xl font-black text-text-main">
                        ${globalBalance.fondoReposicion.toFixed(2)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">Costo real de materiales usados en servicios</p>
                    </div>
                  </div>

                  {/* Card B: Ganancia Disponible */}
                  <div className="relative overflow-hidden rounded-2xl border border-gray-200 dark:border-emerald-500/20 bg-surface p-5 flex items-center gap-4 group hover:border-emerald-500/40 transition-all shadow-sm dark:shadow-none">
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="shrink-0 w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Wallet size={22} className="text-emerald-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-emerald-400/80 uppercase tracking-wider mb-0.5">Ganancia Disponible</p>
                      <p className="text-2xl font-black text-text-main">
                        ${globalBalance.gananciaDisponible.toFixed(2)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">Ingresos · menos todos los gastos</p>
                    </div>
                  </div>
                </div>
                {/* Left Column: Form (1 col) */}
                <div className="lg:col-span-1">
                  <div className="bg-surface rounded-[2.5rem] shadow-sm border border-border p-6 sticky top-6">
                    <h3 className="text-xl font-bold text-text-main mb-6 flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-primary-700/10 flex items-center justify-center text-primary-700">
                        <CreditCard size={16} />
                      </div>
                      Registrar Gasto
                    </h3>

                    <div className="space-y-4">
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
                              onClick={() =>
                                setShowCategoryList(!showCategoryList)
                              }
                              className="w-full h-12 px-2 rounded-xl bg-background border border-border focus:bg-surface focus:border-primary-600 focus:outline-none font-medium text-text-main text-sm text-left flex items-center justify-between"
                            >
                              <span>{newExpense.category}</span>
                              <ChevronDown
                                size={16}
                                className="text-text-muted"
                              />
                            </button>

                            {showCategoryList && (
                              <div className="absolute z-[60] mt-1 max-h-60 overflow-y-auto w-full bg-surface border border-border rounded-xl shadow-2xl">
                                {[
                                  "Agua",
                                  "Luz",
                                  "Renta",
                                  "Reposicion",
                                  "Comisiones",
                                  "Mantenimiento",
                                  "Publicidad",
                                  "Otros",
                                ].map((cat) => (
                                  <div
                                    key={cat}
                                    onClick={() => {
                                      setNewExpense({
                                        ...newExpense,
                                        category: cat,
                                        staffId: "",
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

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase ml-2">
                          Fecha
                        </label>
                        <input
                          type="date"
                          value={newExpense.date}
                          onChange={(e) =>
                            setNewExpense({
                              ...newExpense,
                              date: e.target.value,
                            })
                          }
                          className="w-full h-12 px-4 rounded-xl bg-background border border-border focus:bg-surface focus:border-primary-600 focus:ring-4 focus:ring-primary-600/10 transition-all outline-none font-medium text-text-main"
                        />
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
                              {users.find((u) => u.id === newExpense.staffId)
                                ?.name || "Seleccionar personal..."}
                            </span>
                            <ChevronDown
                              size={16}
                              className="text-purple-400"
                            />
                          </button>

                          {showStaffList && (
                            <div className="absolute z-[60] mt-1 max-h-60 overflow-y-auto w-full bg-surface border border-border rounded-xl shadow-2xl">
                              {users
                                .filter((u) => u.role === "staff")
                                .map((u) => (
                                  <div
                                    key={u.id}
                                    onClick={() => {
                                      setNewExpense({
                                        ...newExpense,
                                        staffId: u.id,
                                      });
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
                  </div>
                </div>

                {/* Right Column: List (2 cols) */}
                <div className="lg:col-span-2">
                  <div className="bg-surface rounded-[2.5rem] shadow-sm border border-border p-6 min-h-[500px]">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <h3 className="text-xl font-bold text-text-main flex items-center gap-2">
                        <Filter size={20} className="text-text-muted" />
                        Historial de Gastos
                        </h3>
                        
                        {/* Sub-tabs for Expenses */}
                        <div className="flex bg-background p-1 rounded-lg border border-border">
                            <button
                                onClick={() => setExpenseSubTab("general")}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                expenseSubTab === "general"
                                    ? "bg-surface shadow text-text-main"
                                    : "text-text-muted hover:text-text-main"
                                }`}
                            >
                                Del Local
                            </button>
                            <button
                                onClick={() => setExpenseSubTab("payroll")}
                                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
                                expenseSubTab === "payroll"
                                    ? "bg-surface shadow text-text-main"
                                    : "text-text-muted hover:text-text-main"
                                }`}
                            >
                                Nómina
                            </button>
                        </div>
                    </div>

                    <div className="space-y-3">
                      {filteredExpenses.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center">
                          <div className="w-16 h-16 rounded-full bg-surface-highlight flex items-center justify-center mb-4">
                            <CreditCard className="w-8 h-8 text-text-muted opacity-50" />
                          </div>
                          <p className="text-text-muted font-medium">
                            No hay gastos registrados en esta categoría.
                          </p>
                        </div>
                      ) : (
                        filteredExpenses.map((expense) => (
                          <div
                            key={expense.id}
                            className="group flex justify-between items-center p-4 rounded-2xl bg-background hover:bg-surface-highlight border border-transparent hover:border-border transition-all"
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center bg-surface border border-border shrink-0 font-bold text-xs
                                         ${
                                           expense.category === "Comisiones" || expense.category === "Sueldos"
                                             ? "text-purple-500 bg-purple-500/10 border-purple-500/20"
                                             : expense.category === "Reposicion"
                                             ? "text-blue-500 bg-blue-500/10 border-blue-500/20"
                                             : "text-text-muted"
                                         }`}
                              >
                                {expenseSubTab === 'payroll' ? <Users size={16} /> : expense.category.substring(0, 2).toUpperCase()}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-text-main text-base">
                                  {expenseSubTab === 'payroll' ? (
                                      // Show Staff Name if available, else description
                                      users.find(u => u.id === expense.staffId)?.name || expense.description
                                  ) : (
                                      expense.description
                                  )}
                                </span>
                                <div className="flex gap-2 text-xs mt-1">
                                  <span className="bg-surface px-2 py-0.5 rounded text-text-muted border border-border">
                                    {expense.category}
                                  </span>
                                  <span className="text-text-muted font-medium flex items-center gap-1">
                                    <Calendar size={10} />
                                    {expense.date}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="font-black text-text-main text-lg block text-right">
                                ${expense.amount.toFixed(2)}
                              </span>
                              <button
                                onClick={() => setActionToConfirm(expense.id)}
                                className="p-2 rounded-full text-text-muted hover:bg-red-500/10 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                title="Eliminar Gasto"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
              isOpen={!!actionToConfirm}
              onClose={() => setActionToConfirm(null)}
              onConfirm={handleDeleteExpense}
              title="Eliminar Gasto"
              message="¿Estás seguro de que deseas eliminar este gasto? Esta acción modificará los cálculos financieros."
              isLoading={isSubmitting}
            />
          </div>
        </main>
      </div>

      <PaymentDrawer
        isOpen={!!selectedEmployeeId}
        onClose={() => setSelectedEmployeeId(null)}
        employee={users.find(u => u.id === selectedEmployeeId) || null}
        revenue={userStats.find(s => s.userId === selectedEmployeeId)?.revenue || 0}
        commission={userStats.find(s => s.userId === selectedEmployeeId)?.commission || 0}
        commissionPaid={userStats.find(s => s.userId === selectedEmployeeId)?.commissionPaid || 0}
        onRegisterPayment={handleRegisterPayment}
      />
    </div>
  );
};

export default FinanceScreen;
