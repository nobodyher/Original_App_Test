import React, { useState, useMemo } from "react";
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
  Edit2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type {
  AppUser,
  Service,
  Expense,
  MaterialRecipe,
  OwnerFilters,
  PaymentMethod,
  Toast,
} from "../../../types";
import { exportToCSV, getRecipeCost } from "../../../utils/helpers";
import * as salonService from "../../../services/salonService";
import * as inventoryService from "../../../services/inventoryService";

interface OwnerDashboardProps {
  services: Service[];
  expenses: Expense[];
  users: AppUser[];
  currentUser: AppUser | null;
  materialRecipes: MaterialRecipe[];
  showNotification: (message: string, type?: Toast["type"]) => void;
  // Actions
  addExpense: (data: any) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateServiceCost: (id: string, cost: number) => Promise<void>;
  softDeleteService: (id: string, userId?: string) => Promise<void>; // Admin version
  permanentlyDeleteService: (id: string) => Promise<void>;
  restoreDeletedService: (id: string) => Promise<void>;
}

const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  services,
  expenses,
  users,
  currentUser,
  materialRecipes,
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

  const [newExpense, setNewExpense] = useState({
    date: new Date().toISOString().split("T")[0],
    description: "",
    category: "Agua",
    amount: "",
    userId: "",
  });

  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [editingServiceCost, setEditingServiceCost] = useState("");

  const getUserById = (id: string) => users.find((u) => u.id === id);

  // Local wrappers for actions with UI feedback
  const handleUpdateServiceCost = async (serviceId: string, newCost: number) => {
    try {
      await updateServiceCost(serviceId, newCost);
      setEditingServiceId(null);
      showNotification("Costo actualizado");
    } catch (error: any) {
      console.error("Error actualizando costo:", error);
      showNotification(error.message || "Error al actualizar", "error");
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
        amount: parseFloat(newExpense.amount),
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
    } catch (error: any) {
      console.error("Error agregando gasto:", error);
      showNotification(error.message || "Error al agregar gasto", "error");
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
            materialRecipes
          ))
      );
    }, 0);
    // Deduct reposicion expenses to avoid double counting if tracking cash flow
    const repoExpenses = filteredExpenses.reduce((sum, e) => {
      return e.category === "Reposicion" ? sum + e.amount : sum;
    }, 0);
    return Math.max(0, cost - repoExpenses);
  }, [filteredServices, filteredExpenses, materialRecipes]);

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
        const user = getUserById(s.userId);
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

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Search size={24} className="text-purple-500" />
          Filtros
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <input
            type="date"
            value={ownerFilters.dateFrom}
            onChange={(e) =>
              setOwnerFilters({ ...ownerFilters, dateFrom: e.target.value })
            }
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
          />
          <input
            type="date"
            value={ownerFilters.dateTo}
            onChange={(e) =>
              setOwnerFilters({ ...ownerFilters, dateTo: e.target.value })
            }
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
          />
          <select
            value={ownerFilters.paymentMethod}
            onChange={(e) =>
              setOwnerFilters({
                ...ownerFilters,
                paymentMethod: e.target.value as "all" | PaymentMethod,
              })
            }
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
          >
            <option value="all">Todos los pagos</option>
            <option value="cash">Efectivo</option>
            <option value="transfer">Transferencia</option>
          </select>
          <input
            type="text"
            placeholder="Buscar..."
            value={ownerFilters.search}
            onChange={(e) =>
              setOwnerFilters({ ...ownerFilters, search: e.target.value })
            }
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
          />
          <button
            onClick={() =>
              setOwnerFilters({
                dateFrom: "",
                dateTo: "",
                paymentMethod: "all",
                includeDeleted: false,
                search: "",
              })
            }
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition"
          >
            Limpiar
          </button>
        </div>
        <div className="mt-4">
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={ownerFilters.includeDeleted}
              onChange={(e) =>
                setOwnerFilters({
                  ...ownerFilters,
                  includeDeleted: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
            Incluir servicios eliminados
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-400 to-green-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign size={32} />
            <h3 className="text-sm font-semibold opacity-90">Ingresos Totales</h3>
          </div>
          <p className="text-3xl font-bold">${totalRevenue.toFixed(2)}</p>
          <p className="text-green-100 text-sm mt-1">
            {filteredServices.length} servicios
          </p>
        </div>

        <div className="bg-gradient-to-br from-red-400 to-red-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <CreditCard size={32} />
            <h3 className="text-sm font-semibold opacity-90">Gastos</h3>
          </div>
          <p className="text-3xl font-bold">${totalExpenses.toFixed(2)}</p>
          <p className="text-red-100 text-sm mt-1">
            {filteredExpenses.length} registros
          </p>
        </div>

        <div className="bg-gradient-to-br from-orange-400 to-orange-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Package size={32} />
            <h3 className="text-sm font-semibold opacity-90">Reposición</h3>
          </div>
          <p className="text-3xl font-bold">${totalReplenishmentCost.toFixed(2)}</p>
          <p className="text-orange-100 text-sm mt-1">consumibles</p>
        </div>

        <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <Wallet size={32} />
            <h3 className="text-sm font-semibold opacity-90">Ganancia Neta</h3>
          </div>
          <p className="text-3xl font-bold">${netProfit.toFixed(2)}</p>
          <p className="text-purple-100 text-sm mt-1">después de costos</p>
        </div>
      </div>

      {/* Comisiones por Personal */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <Percent size={24} className="text-blue-500" />
          Comisiones por Personal
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {userStats.length === 0 ? (
            <div className="col-span-full text-center text-gray-500 py-8">
              No hay datos disponibles
            </div>
          ) : (
            userStats.map((stat) => (
              <div
                key={stat.name}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg border-2 border-blue-200 p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-gray-800 text-lg">{stat.name}</h4>
                  <span className="text-xs font-semibold bg-blue-200 text-blue-800 px-2 py-1 rounded-full">
                    {stat.services} servicios
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">
                      Ingresos Generados
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      ${stat.revenue.toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Comisión Ganada</p>
                    <p
                      className={`text-2xl font-bold ${
                        stat.commission - stat.commissionPaid < 0
                          ? "text-red-600"
                          : "text-blue-600"
                      }`}
                    >
                      {stat.commission - stat.commissionPaid < 0 ? "-" : ""}$
                      {Math.abs(stat.commission - stat.commissionPaid).toFixed(2)}
                    </p>
                  </div>

                  <div className="bg-white p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Comisión Pagada</p>
                    <p className="text-2xl font-bold text-orange-600">
                      ${stat.commissionPaid.toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Gestión de Gastos */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <CreditCard size={24} className="text-red-500" />
          Gestión de Gastos
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 p-4 bg-red-50 rounded-lg">
          <input
            type="date"
            value={newExpense.date}
            onChange={(e) =>
              setNewExpense({ ...newExpense, date: e.target.value })
            }
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-gray-900 bg-white"
          />
          <input
            type="text"
            placeholder="Concepto"
            value={newExpense.description}
            onChange={(e) =>
              setNewExpense({ ...newExpense, description: e.target.value })
            }
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-gray-900 bg-white"
          />
          <select
            value={newExpense.category}
            onChange={(e) =>
              setNewExpense({
                ...newExpense,
                category: e.target.value,
                userId: "",
              })
            }
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-gray-900 bg-white"
          >
            <option value="Agua">Agua</option>
            <option value="Luz">Luz</option>
            <option value="Renta">Renta</option>
            <option value="Reposicion">Reposicion</option>
            <option value="Comisiones">Comisiones</option>
          </select>
          {newExpense.category === "Comisiones" && (
            <select
              value={newExpense.userId}
              onChange={(e) =>
                setNewExpense({ ...newExpense, userId: e.target.value })
              }
              className="px-4 py-2 border-2 border-purple-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white font-semibold"
            >
              <option value="">Seleccionar Personal</option>
              {users
                .filter((u) => u.role === "staff")
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          )}
          <input
            type="number"
            step="0.01"
            placeholder="Monto $"
            value={newExpense.amount}
            onChange={(e) =>
              setNewExpense({ ...newExpense, amount: e.target.value })
            }
            className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none text-gray-900 bg-white"
          />
          <button
            onClick={handleAddExpense}
            className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-semibold"
          >
            Agregar Gasto
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                  Concepto
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                  Categoría
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                  Monto
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No hay gastos registrados
                  </td>
                </tr>
              ) : (
                filteredExpenses.slice().reverse().map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 text-sm">{expense.date}</td>
                    <td className="px-6 py-4 text-sm font-medium">
                      {expense.description}
                    </td>
                    <td className="px-6 py-4 text-sm">{expense.category}</td>
                    <td className="px-6 py-4 text-sm font-bold text-red-600">
                      ${expense.amount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleDeleteExpense(expense.id)}
                        className="text-red-600 hover:text-red-800 transition"
                        title="Eliminar gasto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Todos los Servicios */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
          <h3 className="text-xl font-bold text-gray-800">Todos los Servicios</h3>
          <button
            onClick={() => exportToCSV(filteredServices, "todos_los_servicios")}
            className="flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition text-sm"
          >
            <Download size={18} />
            Exportar CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Empleada
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Cliente
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Servicio
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Pago
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Costo
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Comisión
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Reposición
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-500">
                    No hay servicios
                  </td>
                </tr>
              ) : (
                filteredServices.map((service) => (
                  <tr
                    key={service.id}
                    className={`border-b hover:bg-gray-50 transition ${
                      service.deleted ? "opacity-50 bg-red-50" : ""
                    }`}
                  >
                    <td className="px-4 py-3 text-sm">{service.date}</td>
                    <td className="px-4 py-3 text-sm font-medium">
                      {service.userName}
                    </td>
                    <td className="px-4 py-3 text-sm">{service.client}</td>
                    <td className="px-4 py-3 text-sm">{service.service}</td>
                    <td className="px-4 py-3 text-sm">
                      {service.paymentMethod === "transfer"
                        ? "Transferencia"
                        : "Efectivo"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {editingServiceId === service.id ? (
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.01"
                            value={editingServiceCost}
                            onChange={(e) =>
                              setEditingServiceCost(e.target.value)
                            }
                            className="w-24 px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-green-500 focus:outline-none"
                          />
                          <button
                            onClick={() =>
                              handleUpdateServiceCost(
                                service.id,
                                parseFloat(editingServiceCost)
                              )
                            }
                            className="text-green-600 hover:text-green-800"
                          >
                            <Check size={18} />
                          </button>
                          <button
                            onClick={() => setEditingServiceId(null)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <X size={18} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-green-600">
                            ${Number(service.cost).toFixed(2)}
                          </span>
                          <button
                            onClick={() => {
                              setEditingServiceId(service.id);
                              setEditingServiceCost(service.cost.toString());
                            }}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Edit2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-blue-600">
                      ${salonService.calcCommissionAmount(service, users).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-orange-600">
                      $
                      {(
                        service.reposicion || getRecipeCost(service.category)
                      ).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        {service.deleted ? (
                          <>
                            <button
                              onClick={() =>
                                handleRestoreDeletedService(service.id)
                              }
                              className="text-green-600 hover:text-green-800"
                              title="Restaurar"
                            >
                              <CheckCircle size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handlePermanentlyDeleteService(service.id)
                              }
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={() => handleSoftDeleteService(service.id)}
                              className="text-orange-600 hover:text-orange-800"
                              title="Eliminar temporalmente"
                            >
                              <XCircle size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handlePermanentlyDeleteService(service.id)
                              }
                              className="text-red-600 hover:text-red-800"
                              title="Eliminar permanentemente"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
