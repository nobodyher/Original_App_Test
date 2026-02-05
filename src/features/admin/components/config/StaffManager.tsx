import React, { useState } from "react";
import {
  Users,
  Plus,
  X,
  Edit2,
  Trash2,
  Key,
  Percent,
  Sparkles,
  Shield,
  User,
  Briefcase,
  UserCheck,
  UserX,
} from "lucide-react";
import type { AppUser, Toast } from "../../../../types";

interface StaffManagerProps {
  staff: AppUser[];
  onRefresh?: () => void;
  onAdd: (data: any) => Promise<void>;
  onUpdate: (id: string, data: Partial<AppUser>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  showNotification: (message: string, type?: Toast["type"]) => void;
}

const EmptyState = ({
  icon: Icon,
  title,
  message,
}: {
  icon: any;
  title: string;
  message: string;
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
    <Icon size={64} className="text-gray-200 mb-4" strokeWidth={1.5} />
    <h3 className="text-lg font-bold text-gray-400 mb-2">{title}</h3>
    <p className="text-sm text-gray-400 max-w-xs mx-auto">{message}</p>
  </div>
);

const StaffManager: React.FC<StaffManagerProps> = ({
  staff,
  onRefresh,
  onAdd,
  onUpdate,
  onDelete,
  showNotification,
}) => {
  // State
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    pin: "",
    commissionPct: "",
    color: "from-blue-500 to-blue-600",
  });

  const [editingStaffItem, setEditingStaffItem] = useState<AppUser | null>(null);
  const [editStaffForm, setEditStaffForm] = useState<Partial<AppUser>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handlers
  const handleCreateNewUser = async () => {
    setIsSubmitting(true);
    try {
      await onAdd({
        name: newUser.name,
        pin: newUser.pin,
        commissionPct: newUser.commissionPct,
        color: newUser.color,
      });

      setNewUser({
        name: "",
        pin: "",
        commissionPct: "",
        color: "from-blue-500 to-blue-600",
      });
      setIsAddingUser(false);
      showNotification("Usuario creado exitosamente");
      onRefresh?.();
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      showNotification(error.message || "Error al crear usuario", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<AppUser>) => {
    try {
      await onUpdate(userId, updates);
      setEditingStaffItem(null);
      showNotification("Perfil de usuario actualizado");
      onRefresh?.();
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      showNotification(error.message || "Error al actualizar", "error");
    }
  };

  const handleToggleStaffStatus = async (user: AppUser) => {
    const action = user.active ? "desactivar" : "activar";
    if (!window.confirm(`¿Desea ${action} a este empleado?`)) return;

    try {
      await onUpdate(user.id, { active: !user.active });
      showNotification(`Usuario ${user.active ? "desactivado" : "activado"} exitosamente`);
      onRefresh?.();
    } catch (error: any) {
      console.error(`Error al ${action} usuario:`, error);
      showNotification(`Error al ${action} usuario`, "error");
    }
  };

  const handleDeleteUserPermanently = async (userId: string) => {
    if (
      !window.confirm(
        "¿Eliminar este usuario permanentemente? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      await onDelete(userId);
      showNotification("Usuario eliminado permanentemente");
      onRefresh?.();
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-pink-600" />
            Equipo de Trabajo
          </h3>
          <button
            onClick={() => setIsAddingUser(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-lg shadow-md hover:shadow-lg transition-all active:scale-95"
          >
            <Plus size={18} />
            <span className="font-bold">Nuevo Empleado</span>
          </button>
        </div>

        {/* Staff Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-pink-50 to-purple-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Empleado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Comisión</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">PIN</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Estado</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {staff.length === 0 ? (
                <tr>
                   <td colSpan={6}>
                      <EmptyState 
                        icon={Users} 
                        title="Sin empleados" 
                        message="Agrega a tu equipo para comenzar a asignar servicios." 
                      />
                   </td>
                </tr>
              ) : (
                staff.map((user) => (
                  <tr key={user.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-10 w-10 rounded-full bg-linear-to-br ${user.color} flex items-center justify-center text-white font-bold shadow-md`}
                        >
                          {user.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{user.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Shield size={16} className={user.role === 'owner' ? 'text-purple-600' : 'text-gray-400'} />
                        <span className={`text-sm font-medium ${user.role === 'owner' ? 'text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md' : 'text-gray-600'}`}>
                          {user.role === 'owner' ? 'Administrador' : 'Estilista'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded-md w-fit">
                        <Percent size={14} className="text-gray-400" />
                        <span>{user.commissionPct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 font-mono text-gray-500">
                        <Key size={14} />
                        <span>****</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                          user.active
                            ? "bg-green-50 text-green-700 border-green-100"
                            : "bg-red-50 text-red-700 border-red-100"
                        }`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${user.active ? 'bg-green-500' : 'bg-red-500'}`}></span>
                        {user.active ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingStaffItem(user);
                            setEditStaffForm({ ...user });
                          }}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar perfil"
                        >
                          <Edit2 size={16} />
                        </button>
                        {user.role !== 'owner' && (
                           <>
                             <button
                               onClick={() => handleToggleStaffStatus(user)}
                               className={`p-1.5 rounded-lg transition-colors ${
                                 user.active
                                   ? "text-gray-400 hover:text-red-600 hover:bg-red-50"
                                   : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                               }`}
                               title={user.active ? "Desactivar acceso" : "Activar acceso"}
                             >
                               {user.active ? <UserX size={16} /> : <UserCheck size={16} />}
                             </button>
                             <button
                               onClick={() => handleDeleteUserPermanently(user.id)}
                               className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                               title="Eliminar permanentemente"
                             >
                               <Trash2 size={16} />
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

      {/* Slide-over para Agregar Personal */}
      {isAddingUser && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
             className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
             onClick={() => setIsAddingUser(false)}
          />

          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
             <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-pink-50/50">
               <div>
                 <h3 className="text-xl font-bold text-gray-800">Nuevo Empleado</h3>
                 <p className="text-sm text-gray-500">Registrar nuevo miembro del equipo</p>
               </div>
               <button 
                 onClick={() => setIsAddingUser(false)}
                 className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
               >
                 <X size={20} />
               </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                   <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                      <User size={18} className="text-pink-600" />
                      Datos Personales
                   </h4>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Nombre Completo</label>
                      <input
                        type="text"
                        placeholder="ej. Ana García"
                        value={newUser.name}
                        onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">PIN de Acceso</label>
                      <input
                        type="text"
                        maxLength={4}
                        placeholder="0000"
                        value={newUser.pin}
                        onChange={(e) => setNewUser(prev => ({ ...prev, pin: e.target.value }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-mono tracking-widest"
                      />
                   </div>
                </div>

                {/* Financial Config */}
                <div className="space-y-4">
                   <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                      <Briefcase size={18} className="text-purple-600" />
                      Configuración Laboral
                   </h4>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Comisión por Servicio (%)</label>
                      <div className="relative">
                        <input
                           type="number"
                           min="0"
                           max="100"
                           placeholder="50"
                           value={newUser.commissionPct}
                           onChange={(e) => setNewUser(prev => ({ ...prev, commissionPct: e.target.value }))}
                           className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none font-bold"
                        />
                         <span className="absolute right-4 top-2.5 text-gray-400 font-bold">%</span>
                      </div>
                   </div>
                </div>

                {/* Appearance */}
                <div className="space-y-4">
                   <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                      <Sparkles size={18} className="text-indigo-600" />
                      Personalización
                   </h4>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Color de Perfil</label>
                      <select
                           value={newUser.color}
                           onChange={(e) => setNewUser(prev => ({ ...prev, color: e.target.value }))}
                           className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        >
                           <option value="from-pink-500 to-rose-600">Rosa (Pink)</option>
                           <option value="from-purple-500 to-indigo-600">Morado (Purple)</option>
                           <option value="from-blue-500 to-cyan-600">Azul (Blue)</option>
                           <option value="from-emerald-500 to-teal-600">Esmeralda (Emerald)</option>
                           <option value="from-orange-500 to-amber-600">Naranja (Orange)</option>
                           <option value="from-gray-700 to-slate-800">Oscuro (Dark)</option>
                        </select>
                        <div className={`h-12 w-full rounded-lg bg-linear-to-r ${newUser.color} shadow-lg mt-2 flex items-center justify-center text-white font-bold opacity-90`}>
                           Vista Previa
                        </div>
                   </div>
                </div>
             </div>

             <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
               <button
                 onClick={() => setIsAddingUser(false)}
                 className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all active:scale-95"
               >
                 Cancelar
               </button>
               <button
                 onClick={handleCreateNewUser}
                 disabled={isSubmitting}
                 className={`flex-1 px-4 py-3 rounded-xl bg-pink-600 text-white font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 hover:shadow-xl transition-all active:scale-95 ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
               >
                 {isSubmitting ? 'Creando...' : 'Crear Empleado'}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* Slide-over para Edición de Personal */}
      {editingStaffItem && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingStaffItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-pink-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Editar Perfil</h3>
                <p className="text-sm text-gray-500">Gestión de empleado y comisiones</p>
              </div>
              <button 
                onClick={() => setEditingStaffItem(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Identidad */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Users size={18} className="text-pink-600" />
                   Identidad
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Empleado</label>
                  <input
                    type="text"
                    value={editStaffForm.name || ""}
                    onChange={(e) => setEditStaffForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg focus:border-pink-500 focus:ring-4 focus:ring-pink-50/50 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                     <Key size={14} /> PIN de Acceso
                   </label>
                   <input
                        type="text"
                        maxLength={4}
                        value={editStaffForm.pin || ""}
                        onChange={(e) => setEditStaffForm(prev => ({ ...prev, pin: e.target.value }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-mono tracking-widest"
                   />
                   <p className="text-xs text-slate-400">
                      PIN de 4 dígitos para iniciar sesión.
                   </p>
                </div>
              </div>

               {/* Finanzas */}
               <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Percent size={18} className="text-purple-600" />
                   Configuración Financiera
                </h4>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-600">Porcentaje de Comisión</label>
                   <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={editStaffForm.commissionPct ?? ""}
                        onChange={(e) => setEditStaffForm(prev => ({ ...prev, commissionPct: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 outline-none font-bold text-lg"
                       />
                       <span className="absolute right-4 top-3 text-gray-400 font-bold">%</span>
                   </div>
                   <div className="p-3 bg-purple-50 rounded-lg text-sm text-purple-700">
                      Este empleado gana el <strong>{editStaffForm.commissionPct ?? 0}%</strong> de cada servicio realizado (calculado automáticamente).
                   </div>
                </div>
              </div>

               {/* Apariencia */}
               <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Sparkles size={18} className="text-indigo-600" />
                   Apariencia
                </h4>
                
                 <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Color de Perfil</label>
                  <select
                    value={editStaffForm.color}
                    onChange={(e) => setEditStaffForm(prev => ({ ...prev, color: e.target.value }))}
                     className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none"
                  >
                    <option value="from-pink-500 to-rose-600">Rosa (Pink)</option>
                    <option value="from-purple-500 to-indigo-600">Morado (Purple)</option>
                    <option value="from-blue-500 to-cyan-600">Azul (Blue)</option>
                    <option value="from-emerald-500 to-teal-600">Esmeralda (Emerald)</option>
                    <option value="from-orange-500 to-amber-600">Naranja (Orange)</option>
                    <option value="from-gray-700 to-slate-800">Oscuro (Dark)</option>
                  </select>
                   <div className={`h-12 w-full rounded-lg bg-linear-to-r ${editStaffForm.color} shadow-lg mt-2 flex items-center justify-center text-white font-bold opacity-90`}>
                      Vista Previa
                   </div>
                </div>
               </div>

                {/* Estado */}
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                       <span className="block font-semibold text-gray-700">Estado de la cuenta</span>
                       <span className="text-xs text-gray-500">{editStaffForm.active ? 'El empleado puede acceder al sistema' : 'Acceso bloqueado'}</span>
                    </div>
                    <button
                      onClick={() => setEditStaffForm(prev => ({ ...prev, active: !prev.active }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editStaffForm.active ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editStaffForm.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                 </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditingStaffItem(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingStaffItem && editStaffForm) {
                    handleUpdateUser(editingStaffItem.id, editStaffForm);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-pink-600 text-white font-bold shadow-lg shadow-pink-200 hover:bg-pink-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
