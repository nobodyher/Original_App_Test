import React, { useState } from "react";
import {
  Users,
  Plus,
  X,
  Search,
  Mail,
  Phone,
  Calendar,
  Percent,
  Lock,
  User,
  AlertTriangle,
} from "lucide-react";
import { UserAvatar } from "../../../../components/ui/UserAvatar";
import type { AppUser, Toast, Service } from "../../../../types";
import { StaffDetailView } from "../StaffDetailView";

// ============================================================================
// INTERFACES
// ============================================================================

export interface StaffManagerProps {
  // Data
  users: AppUser[];
  currentUser: AppUser | null;
  transactions?: Service[];

  // Actions
  createNewUser: (data: Omit<AppUser, "id">) => Promise<void>;
  updateUser: (userId: string, data: Partial<AppUser>) => Promise<void>;
  deleteUserPermanently: (userId: string) => Promise<void>;
  showNotification: (message: string, type?: Toast["type"]) => void;
}

// ============================================================================
// EMPTY STATE COMPONENT
// ============================================================================

const EmptyState = ({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
    <Icon size={64} className="text-gray-700/50 mb-4" strokeWidth={1.5} />
    <h3 className="text-sm font-bold text-text-main mb-2">{title}</h3>
    <p className="text-sm text-text-muted max-w-xs mx-auto">{message}</p>
  </div>
);

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const StaffManager: React.FC<StaffManagerProps> = ({
  users,
  currentUser,
  transactions = [],
  createNewUser,
  updateUser,
  deleteUserPermanently,
  showNotification,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Selected Staff for Details View
  const [selectedStaff, setSelectedStaff] = useState<AppUser | null>(null);

  // Add User Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    pin: "",
    commissionPct: "",
    phone: "",
    email: "",
    birthDate: "",
  });



  // Loading States
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  // Filter active staff members
  const activeStaff = users.filter(
    (user) =>
      user.role === "staff" &&
      user.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleCreateNewUser = async () => {
    setIsSubmitting(true);
    try {
      await createNewUser({
        name: newUser.name,
        pin: newUser.pin,
        commissionPct: parseFloat(newUser.commissionPct as string) || 0,
        phoneNumber: newUser.phone,
        email: newUser.email,
        birthDate: newUser.birthDate,
        color: "from-gray-700 to-gray-900", // Default dark elegant color
        role: "staff",
        active: true,
        icon: "user",
        ow: "",
        tenantId: currentUser?.tenantId || "",
      });

      setNewUser({
        name: "",
        pin: "",
        commissionPct: "",
        phone: "",
        email: "",
        birthDate: "",
      });
      setIsAddUserOpen(false);
      showNotification("Usuario creado exitosamente");
    } catch (error) {
      console.error("Error creando usuario:", error);
      const message =
        error instanceof Error ? error.message : "Error al crear usuario";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };



  const handleUpdateStaff = async (updatedData: Partial<AppUser>) => {
    if (!selectedStaff) return;

    try {
      await updateUser(selectedStaff.id, updatedData);

      // Update Local State
      setSelectedStaff((prev) => (prev ? { ...prev, ...updatedData } : null));

      // Notification
      showNotification("Personal actualizado correctamente", "success");
    } catch (error) {
      console.error("Error al actualizar:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteStaff = async () => {
    if (!selectedStaff) return;

    try {
      await deleteUserPermanently(selectedStaff.id);
      showNotification("Personal eliminado correctamente", "success");
      setSelectedStaff(null);
    } catch (error) {
      console.error("Error eliminando personal:", error);
      showNotification("Error al eliminar personal", "error");
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  // If a staff member is selected, show StaffDetailView
  if (selectedStaff) {
    return (
      <div className="animate-in fade-in slide-in-from-right duration-300">
        <StaffDetailView
          staff={selectedStaff}
          onClose={() => setSelectedStaff(null)}
          onUpdate={handleUpdateStaff}
          onDelete={handleDeleteStaff}
          transactions={transactions}
        />
      </div>
    );
  }

  // Otherwise, show staff list
  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
          <Users className="text-primary-600" />
          Personal
        </h3>
        <button
          onClick={() => setIsAddUserOpen(true)}
          className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95"
        >
          <Plus size={18} />
          Nuevo Personal
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Staff Grid */}
      {activeStaff.length === 0 ? (
        <div className="bg-surface rounded-xl border border-border p-12">
          <EmptyState
            icon={Users}
            title="No hay personal"
            message="Agrega el primer miembro del equipo para comenzar."
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeStaff.map((staff) => {
            return (
              <button
                key={staff.id}
                onClick={() => setSelectedStaff(staff)}
                className="bg-surface border border-border rounded-xl p-4 hover:border-primary-600/50 hover:shadow-lg transition-all duration-200 flex flex-col items-center gap-0 group active:scale-95 relative"
              >
                {/* Avatar with Status Overlay */}
                <div className="relative mb-3">
                  <div
                    className={`w-24 h-24 rounded-full border-4 border-surface-highlight shadow-sm overflow-hidden group-hover:scale-105 transition-transform duration-300 ${
                      !staff.active ? "grayscale opacity-70" : ""
                    }`}
                  >
                    <UserAvatar
                      image={staff.photoURL}
                      name={staff.name}
                      size="w-full h-full"
                      className="text-2xl"
                    />
                  </div>
                  {/* Status Dot Overlay */}
                  <div
                    className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-800 ${
                      staff.active ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                </div>

                {/* Info Center */}
                <div className="text-center w-full">
                  <h4
                    className={`text-lg font-bold truncate transition-colors ${
                      staff.active
                        ? "text-text-main group-hover:text-primary-600"
                        : "text-text-muted"
                    }`}
                  >
                    {staff.name}
                  </h4>
                  <p
                    className={`text-sm capitalize font-medium ${
                      staff.active ? "text-text-muted" : "text-text-dim"
                    }`}
                  >
                    {staff.role === "owner" ? "Propietario" : "Estilista"}
                  </p>
                </div>

                {/* Status Badge */}
                <span
                  className={`mt-3 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                    staff.active
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  {staff.active ? "Activo" : "Inactivo"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* Add User Modal */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setIsAddUserOpen(false)}
          />

          {/* Modal */}
          <div className="relative bg-surface rounded-2xl shadow-2xl border border-border w-full max-w-md animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Nuevo Personal
                </h3>
                <p className="text-sm text-text-muted">
                  Agregar miembro del equipo
                </p>
              </div>
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
              {/* Name */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                  <User size={16} />
                  Nombre Completo
                </label>
                <input
                  type="text"
                  placeholder="ej. María García"
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* PIN */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                  <Lock size={16} />
                  PIN (4 dígitos)
                </label>
                <input
                  type="password"
                  placeholder="••••"
                  maxLength={4}
                  value={newUser.pin}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, pin: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-mono text-2xl tracking-widest text-center"
                />
                {newUser.pin && newUser.pin.length !== 4 && (
                  <div className="flex items-center gap-1 text-xs text-orange-600">
                    <AlertTriangle size={12} />
                    El PIN debe tener exactamente 4 dígitos
                  </div>
                )}
              </div>

              {/* Commission */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                  <Percent size={16} />
                  Porcentaje de Comisión
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    placeholder="ej. 15"
                    value={newUser.commissionPct}
                    onChange={(e) =>
                      setNewUser((prev) => ({
                        ...prev,
                        commissionPct: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 pr-8 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                  <span className="absolute right-3 top-2.5 text-text-muted font-bold">
                    %
                  </span>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                  <Phone size={16} />
                  Teléfono
                </label>
                <input
                  type="tel"
                  placeholder="ej. +1 234 567 8900"
                  value={newUser.phone}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                  <Mail size={16} />
                  Email
                </label>
                <input
                  type="email"
                  placeholder="correo@ejemplo.com"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>

              {/* Birth Date */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-text-muted flex items-center gap-2">
                  <Calendar size={16} />
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={newUser.birthDate}
                  onChange={(e) =>
                    setNewUser((prev) => ({
                      ...prev,
                      birthDate: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setIsAddUserOpen(false)}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateNewUser}
                disabled={
                  isSubmitting ||
                  !newUser.name ||
                  newUser.pin.length !== 4 ||
                  !newUser.commissionPct
                }
                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Creando..." : "Crear Personal"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
