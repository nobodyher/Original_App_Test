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
  Camera,
  Eye,
  EyeOff,
  Lock,
} from "lucide-react";
import { UserAvatar } from "../../../components/ui/UserAvatar";
import { uploadToCloudinary } from "../../../services/cloudinaryService";
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
    photoURL: staff.photoURL || null,
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
        photoURL: staff.photoURL || null,
      });
    }
  }, [staff]);

  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // PIN Management State
  const [newPin, setNewPin] = useState("");
  const [showPin, setShowPin] = useState(false);

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      let finalPhotoURL = formData.photoURL;

      // Si hay una nueva imagen pendiente de subida, subirla a Cloudinary
      if (fileToUpload) {
        try {
          finalPhotoURL = await uploadToCloudinary(fileToUpload);
        } catch (uploadError) {
           console.error("Error uploading image:", uploadError);
           alert("Error al subir la imagen. Intenta de nuevo.");
           setIsSubmitting(false);
           return;
        }
      }

      const updateData: Partial<AppUser> = {
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        birthDate: formData.birthDate,
        commissionPct: Number(formData.commissionPct),
        active: formData.isActive,
        photoURL: finalPhotoURL || undefined,
      };

      // Solo enviar PIN si se escribió algo
      if (newPin.trim()) {
        updateData.pin = newPin.trim();
      }

      await onUpdate(updateData);
      
      // Limpiar campo PIN
      setNewPin("");
      // Optional: Show success notification handled by parent or here
      // Limpiar archivo pendiente después de guardar exitoso
      setFileToUpload(null);
    } catch (error) {
      console.error("Error updating staff:", error);
      alert("Error al guardar los cambios.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Manejador de selección de archivo
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona un archivo de imagen válido");
      return;
    }

    // Validar tamaño (max 10MB para Cloudinary está bien, pero mantenemos un límite razonable)
    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen es demasiado grande. Máximo 10MB.");
      return;
    }

    // Previsualización local inmediata
    const localPreviewUrl = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, photoURL: localPreviewUrl }));
    setFileToUpload(file);
  };

  // Filter Transactions
  const filteredTransactions = useMemo(() => {
    // Definir fechas de referencia sin mutar 'now'
    const now = new Date();

    // Inicio del día local
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    // Inicio de la semana (Domingo)
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    // Inicio del mes
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return transactions
      .filter((t) => t.userId === staff.id)
      .filter((t) => !t.deleted) // ✅ Excluir transacciones eliminadas (soft delete)
      .filter((t) => {
        // Usar timestamp si existe para precisión de zona horaria, si no, fallar a string date
        const tDate =
          t.timestamp && typeof t.timestamp.toDate === "function"
            ? t.timestamp.toDate()
            : new Date(t.date);

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
      .sort((a, b) => {
        const dateA =
          a.timestamp && typeof a.timestamp.toDate === "function"
            ? a.timestamp.toDate()
            : new Date(a.date);
        const dateB =
          b.timestamp && typeof b.timestamp.toDate === "function"
            ? b.timestamp.toDate()
            : new Date(b.date);
        return dateB.getTime() - dateA.getTime();
      });
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
            {/* Avatar with Upload */}
            <div className="relative mb-4 group">
              <div className="w-32 h-32 rounded-full border-4 border-surface shadow-xl overflow-hidden">
                <UserAvatar
                  image={formData.photoURL}
                  name={staff.name}
                  size="w-full h-full"
                  className="text-4xl"
                />
              </div>

              {/* Hover Overlay for Upload */}
              <label
                htmlFor="avatar-upload"
                className="absolute inset-0 rounded-full bg-black/50 hidden group-hover:flex items-center justify-center cursor-pointer transition-all"
              >
                <Camera size={32} className="text-white" />
              </label>

              {/* Hidden File Input */}
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />

              {/* Status Badge */}
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

              {/* PIN de Acceso */}
              <div className="space-y-1">
                <label className="text-xs font-medium text-text-muted uppercase tracking-wider ml-1">
                  PIN de Acceso
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted">
                    <Lock size={16} />
                  </div>
                  <input
                    type={showPin ? "text" : "password"}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value)}
                    placeholder="Escribe para cambiar el PIN..."
                    className="w-full pl-10 pr-10 py-2.5 bg-surface-highlight border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary-500/50 outline-none placeholder:text-text-muted/50"
                  />
                  <button
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary-500 transition-colors"
                  >
                    {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
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


            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Performance */}
        <div className="lg:col-span-2 space-y-6">
          {/* Action Bar */}
          <div className="flex items-center justify-end gap-2 mb-4">
             {/* Toggle Active */}
            <button
               onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
               className={`flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
                 formData.isActive
                   ? "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800"
                   : "bg-gray-100 text-gray-500 border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700"
               }`}
             >
               <Power size={16} />
               <span>{formData.isActive ? "Activo" : "Inactivo"}</span>
             </button>

            {/* Delete Button */}
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-transparent hover:border-red-200"
            >
              <Trash2 size={18} />
              Eliminar
            </button>

            {/* Save Button */}
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg shadow-sm hover:shadow active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              Guardar
            </button>
          </div>
          {/* Filters */}
          <div className="flex w-full overflow-x-auto no-scrollbar gap-2 px-1 pb-2 justify-start md:justify-center bg-surface p-2 rounded-xl border border-border shadow-sm">
            {(["today", "week", "month", "total"] as TimeFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-2 text-sm whitespace-nowrap rounded-lg font-medium transition-all ${
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
          <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden flex-1 flex flex-col">
            <div className="px-6 py-4 border-b border-border bg-surface-highlight/30 flex justify-between items-center">
              <h3 className="font-bold text-text-main">
                Historial de Servicios
              </h3>
              <p className="text-xs text-text-muted">
                {stats.totalServices} registros
              </p>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 max-h-[500px]">
              {filteredTransactions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTransactions.map((t) => {
                    const transactionDate = t.timestamp
                      ? t.timestamp.toDate()
                      : new Date(t.date);
                    
                    const isToday =
                      transactionDate.toDateString() ===
                      new Date().toDateString();

                    return (
                      <div
                        key={t.id}
                        className="bg-surface p-4 rounded-xl border border-border shadow-sm hover:shadow-md transition-all flex flex-col gap-2 group hover:border-primary-500/30"
                      >
                        {/* Header: Date */}
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-primary-600 uppercase tracking-wider bg-primary-50 dark:bg-primary-900/20 px-2 py-0.5 rounded-md w-fit">
                              {isToday ? "Hoy" : transactionDate.toLocaleDateString()}
                            </span>
                            <span className="text-xs text-text-muted mt-0.5 font-medium ml-1">
                              {transactionDate.toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                          
                          {/* Price Tag */}
                          <div className="text-right">
                             <span className="block text-lg font-black text-text-main">
                              ${t.cost.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Body: Client & Service */}
                        <div className="mt-1 pt-2 border-t border-border/50">
                          <p className="text-sm font-bold text-text-main truncate">
                             {t.client || "Cliente General"}
                          </p>
                          <div className="text-xs text-text-muted mt-1 flex flex-col gap-0.5">
                             <span className="flex items-center gap-1">
                                {t.services?.[0]?.serviceName || t.service || "Servicio"}
                             </span>
                             {t.services && t.services.length > 1 && (
                               <span className="text-primary-600 font-semibold">
                                 +{t.services.length - 1} servicios más
                               </span>
                             )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-text-muted">
                  <p>No hay servicios en este periodo.</p>
                </div>
              )}
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
