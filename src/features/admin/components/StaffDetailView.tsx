import React, { useState, useMemo, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  Calendar,
  Mail,
  Phone,
  Percent,
  Power,
  DollarSign,
  Briefcase,
  TrendingUp,
  Trash2,
} from "lucide-react";
import type { AppUser, Service } from "../../../types";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";

interface StaffDetailViewProps {
  staff: AppUser;
  onClose: () => void;
  onUpdate: (data: Partial<AppUser>) => Promise<void>;
  onDelete: () => void;
  transactions: Service[];
}

type TimeFilter = "today" | "week" | "month" | "total";

export const StaffDetailView: React.FC<StaffDetailViewProps> = ({
  staff,
  onClose,
  onDelete,
  onUpdate,
  transactions,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<TimeFilter>("month");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    phoneNumber: staff.phoneNumber || "",
    birthDate: staff.birthDate || "",
    email: staff.email || "",
    commissionPct: staff.commissionPct || 0,
    isActive: staff.active ?? true,
    // Note: 'active' property in AppUser, 'isActive' in form.
  });

  // Sincronizar el formulario cada vez que cambie el usuario seleccionado
  useEffect(() => {
    console.log("Datos recibidos en detalle:", staff); // Debug para ver si llegan los datos

    if (staff) {
      setFormData({
        phoneNumber: staff.phoneNumber || "",
        birthDate: staff.birthDate ? staff.birthDate.split("T")[0] : "", // Keep the split logic as it's better
        email: staff.email || "",
        commissionPct: staff.commissionPct || 0,
        isActive: staff.active !== undefined ? staff.active : true,
      });
    }
  }, [staff]);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await onUpdate({
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        birthDate: formData.birthDate,
        commissionPct: Number(formData.commissionPct),
        active: formData.isActive,
      });
      // Optional: Show success notification handled by parent or here
    } catch (error) {
      console.error("Error updating staff:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions
      .filter((t) => t.userId === staff.id)
      .filter((t) => {
        const tDate = new Date(t.date); // Assuming ISO string or compatible
        if (isNaN(tDate.getTime())) return false;

        switch (filter) {
          case "today":
            return tDate >= startOfDay;
          case "week":
            return tDate >= startOfWeek;
          case "month":
            return tDate >= startOfMonth;
          case "total":
            return true;
          default:
            return true;
        }
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, staff.id, filter]);

  // Calculate Stats
  const stats = useMemo(() => {
    const totalGenerated = filteredTransactions.reduce(
      (sum, t) => sum + t.cost,
      0,
    );
    const totalServices = filteredTransactions.length;
    const commissionToPay =
      totalGenerated * (Number(formData.commissionPct) / 100);

    return {
      totalGenerated,
      totalServices,
      commissionToPay,
    };
  }, [filteredTransactions, formData.commissionPct]);

  return (
    <div className="h-full flex flex-col animate-in fade-in slide-in-from-right duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full">
        {/* LEFT COLUMN: Profile */}
        <div className="lg:col-span-1 bg-surface rounded-2xl border border-border shadow-sm flex flex-col overflow-hidden h-fit">
          {/* Header & Back Button */}
          <div className="p-4 border-b border-border bg-surface-highlight/30">
            <button
              onClick={onClose}
              className="flex items-center gap-2 text-text-muted hover:text-text-main transition-colors text-sm font-medium"
            >
              <ArrowLeft size={18} />
              Volver a la lista
            </button>
          </div>

          <div className="p-6 flex flex-col items-center">
            {/* Avatar */}
            <div className="relative mb-4">
              <div className="w-32 h-32 rounded-full border-4 border-surface shadow-xl flex items-center justify-center text-4xl bg-gradient-to-br from-primary-100 to-white text-primary-600 font-bold overflow-hidden">
                {staff.photoURL ? (
                  <img
                    src={staff.photoURL}
                    alt={staff.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  staff.name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div
                className={`absolute bottom-2 right-2 w-6 h-6 rounded-full border-4 border-surface ${
                  formData.isActive ? "bg-emerald-500" : "bg-gray-400"
                }`}
              />
            </div>

            <h2 className="text-2xl font-bold text-text-main text-center">
              {staff.name}
            </h2>
            <p className="text-text-muted text-sm capitalize mb-6">
              {staff.role}
            </p>

            {/* Form */}
            <div className="w-full space-y-4">
              {/* Phone */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">
                  Celular
                </label>
                <div className="relative">
                  <Phone
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) =>
                      setFormData({ ...formData, phoneNumber: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-highlight border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary-500/50 outline-none"
                    placeholder="Número de contacto"
                  />
                </div>
              </div>

              {/* Birthdate */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">
                  Fecha de Nacimiento
                </label>
                <div className="relative">
                  <Calendar
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) =>
                      setFormData({ ...formData, birthDate: e.target.value })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-highlight border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">
                  Email
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder="correo@ejemplo.com"
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-highlight border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary-500/50 outline-none"
                  />
                </div>
              </div>

              <div className="h-px bg-border my-4" />

              {/* Commission */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">
                  % Comisión
                </label>
                <div className="relative">
                  <Percent
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                  />
                  <input
                    type="number"
                    value={formData.commissionPct}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        commissionPct: Number(e.target.value),
                      })
                    }
                    className="w-full pl-10 pr-4 py-2.5 bg-surface-highlight border border-border rounded-xl text-sm font-bold text-text-main focus:ring-2 focus:ring-primary-500/50 outline-none"
                  />
                </div>
              </div>

              {/* Active Switch */}
              <div className="flex items-center justify-between p-3 bg-surface-highlight rounded-xl border border-border">
                <div className="flex items-center gap-2">
                  <Power size={18} className="text-text-muted" />
                  <span className="text-sm font-medium text-text-main">
                    Cuenta Activa
                  </span>
                </div>
                <button
                  onClick={() =>
                    setFormData({ ...formData, isActive: !formData.isActive })
                  }
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ease-in-out ${
                    formData.isActive ? "bg-emerald-500" : "bg-gray-300"
                  }`}
                >
                  <span
                    className={`absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-transform duration-200 ease-in-out ${
                      formData.isActive ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={isSubmitting}
                className="w-full mt-4 bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-primary-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Save size={18} />
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>

              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={isSubmitting}
                className="w-full mt-3 bg-white hover:bg-red-50 text-red-500 hover:text-red-600 border border-transparent hover:border-red-200 font-bold py-3 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Eliminar Personal
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Filters */}
          <div className="bg-surface p-2 rounded-xl border border-border inline-flex gap-1 shadow-sm">
            {(["today", "week", "month", "total"] as TimeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-primary-600 text-white shadow-md"
                    : "text-text-muted hover:text-text-main hover:bg-surface-highlight"
                }`}
              >
                {f === "today"
                  ? "Hoy"
                  : f === "week"
                    ? "Semana"
                    : f === "month"
                      ? "Mes"
                      : "Total"}
              </button>
            ))}
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Sales */}
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between group hover:border-primary-500/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-lg bg-primary-100/50 text-primary-600">
                  <DollarSign size={20} />
                </div>
                <TrendingUp size={16} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
                  Total Generado
                </p>
                <h3 className="text-2xl font-bold text-text-main mt-1">
                  ${stats.totalGenerated.toLocaleString()}
                </h3>
              </div>
            </div>

            {/* Total Services */}
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between group hover:border-blue-500/30 transition-colors">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-lg bg-blue-100/50 text-blue-600">
                  <Briefcase size={20} />
                </div>
                <div className="h-4 w-4 rounded-full bg-blue-500" />
              </div>
              <div>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
                  Servicios Realizados
                </p>
                <h3 className="text-2xl font-bold text-text-main mt-1">
                  {stats.totalServices}
                </h3>
              </div>
            </div>

            {/* Commission */}
            <div className="bg-surface p-5 rounded-2xl border border-border shadow-sm flex flex-col justify-between group hover:border-purple-500/30 transition-colors bg-gradient-to-br from-surface to-purple-50/10">
              <div className="flex justify-between items-start mb-2">
                <div className="p-2 rounded-lg bg-purple-100/50 text-purple-600">
                  <Percent size={20} />
                </div>
                <div className="text-xs font-bold text-purple-600 bg-purple-100 py-1 px-2 rounded-full">
                  {formData.commissionPct}%
                </div>
              </div>
              <div>
                <p className="text-text-muted text-xs font-medium uppercase tracking-wider">
                  Comisión a Pagar
                </p>
                <h3 className="text-2xl font-bold text-purple-700 mt-1">
                  ${stats.commissionToPay.toLocaleString()}
                </h3>
              </div>
            </div>
          </div>

          {/* History Table */}
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1">
            <div className="px-6 py-4 border-b border-border bg-surface-highlight/30">
              <h3 className="font-bold text-text-main">
                Historial de Servicios
              </h3>
              <p className="text-xs text-text-muted">
                {stats.totalServices} registros encontrados
              </p>
            </div>
            <div className="overflow-y-auto max-h-[400px]">
              <table className="w-full">
                <thead className="bg-surface-highlight sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase">
                      Servicio
                    </th>
                    <th className="text-left py-3 px-6 text-xs font-medium text-text-muted uppercase">
                      Fecha
                    </th>
                    <th className="text-right py-3 px-6 text-xs font-medium text-text-muted uppercase">
                      Monto
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((t) => (
                      <tr
                        key={t.id}
                        className="hover:bg-surface-highlight transition-colors"
                      >
                        <td className="py-3 px-6 text-sm text-text-main font-medium">
                          {t.services?.[0]?.serviceName ||
                            t.service ||
                            "Servicio Gral."}
                          {t.services && t.services.length > 1 && (
                            <span className="text-xs text-text-muted ml-1">
                              (+{t.services.length - 1})
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-6 text-sm text-text-muted">
                          {new Date(t.date).toLocaleDateString()}
                          <span className="text-xs ml-2 opacity-50">
                            {new Date(t.date).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </td>
                        <td className="py-3 px-6 text-sm text-text-main font-bold text-right">
                          ${t.cost.toFixed(2)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="py-8 text-center text-text-muted"
                      >
                        No hay servicios en este periodo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => {
          onDelete();
          setShowDeleteModal(false);
        }}
        title={`¿Eliminar a ${staff.name}?`}
        message="Esta acción eliminará permanentemente al empleado y todo su historial. No se puede deshacer."
        isLoading={isSubmitting}
      />
    </div>
  );
};
