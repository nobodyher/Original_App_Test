import React, { useEffect, useState, useCallback } from "react";
import { collection, getDocs, doc, updateDoc, setDoc, deleteDoc, writeBatch, query, where } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";
import { getAuth, createUserWithEmailAndPassword, signOut } from "firebase/auth";
import { db, firebaseConfig } from "../../firebase";
import { hashPin } from "../../utils/security";
import { 
  ShieldCheck, RefreshCw, CheckCircle2, XCircle, Loader2, Plus, Trash2, 
  AlertTriangle 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/layout/Sidebar";
import type { ViewType } from "../../components/layout/Sidebar";
import MobileNavigation from "../../components/layout/MobileNavigation";

import type { AppUser } from "../../types";

interface Tenant {
  id: string;
  name: string;
  status: "active" | "suspended" | string;
}

interface MasterAdminScreenProps {
  showNotification: (message: string, type?: "success" | "error" | "info") => void;
  currentUser: AppUser | null;
  onLogout: () => void;
}

const MasterAdminScreen: React.FC<MasterAdminScreenProps> = ({ showNotification, currentUser, onLogout }) => {
  const navigate = useNavigate();
  // Removed useAuth(true) to avoid flickering. using props instead.
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Layout State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  // Creation State
  const [isCreating, setIsCreating] = useState(false);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [newTenantName, setNewTenantName] = useState("");
  const [newTenantId, setNewTenantId] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newOwnerPin, setNewOwnerPin] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerPassword, setNewOwnerPassword] = useState("");

  // Delete Modal State
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [tenantToDelete, setTenantToDelete] = useState<Tenant | null>(null);
  const [deleteConfirmationId, setDeleteConfirmationId] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    try {
      const snap = await getDocs(collection(db, "tenants"));
      const data: Tenant[] = snap.docs.map((d) => ({
        id: d.id,
        name: d.data().name ?? d.id,
        status: d.data().status ?? "active",
      }));
      setTenants(data);
    } catch (err) {
      console.error("Error fetching tenants:", err);
      showNotification("Error al cargar los tenants", "error");
    } finally {
      setLoading(false);
    }
  }, [showNotification]);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const toggleStatus = async (tenant: Tenant) => {
    const newStatus = tenant.status === "active" ? "suspended" : "active";
    setUpdatingId(tenant.id);
    try {
      await updateDoc(doc(db, "tenants", tenant.id), { status: newStatus });
      setTenants((prev) =>
        prev.map((t) => (t.id === tenant.id ? { ...t, status: newStatus } : t))
      );
      showNotification("Estado del local actualizado correctamente", "success");
    } catch (err) {
      console.error("Error updating tenant status:", err);
      showNotification("Error al actualizar el estado", "error");
    } finally {
      setUpdatingId(null);
    }
  };

  const openDeleteModal = (tenant: Tenant) => {
    setTenantToDelete(tenant);
    setDeleteConfirmationId("");
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!tenantToDelete) return;
    if (deleteConfirmationId !== tenantToDelete.id) {
        showNotification("El ID no coincide", "error");
        return;
    }

    setIsDeleting(true);
    try {
        const batchSize = 500;
        const collectionsToCheck = [
            "users", 
            "services", 
            "inventory", 
            "clients", 
            "expenses", 
            "catalog_services", 
            "catalog_extras"
        ];

        // 1. Delete all related documents in batches
        for (const colName of collectionsToCheck) {
            const q = query(collection(db, colName), where("tenantId", "==", tenantToDelete.id));
            const snapshot = await getDocs(q);
            
            // Chunk deletions
            const chunks = [];
            for (let i = 0; i < snapshot.docs.length; i += batchSize) {
                chunks.push(snapshot.docs.slice(i, i + batchSize));
            }

            for (const chunk of chunks) {
                const batch = writeBatch(db);
                chunk.forEach(doc => batch.delete(doc.ref));
                await batch.commit();
            }
        }

        // 2. Delete the tenant document itself
        await deleteDoc(doc(db, "tenants", tenantToDelete.id));

        showNotification("Tenant y todos sus datos eliminados correctamente", "success");
        setDeleteModalOpen(false);
        setTenantToDelete(null);
        fetchTenants();

    } catch (err) {
        console.error("Error deleting tenant:", err);
        showNotification("Error crítico al eliminar tenant. Revisa la consola.", "error");
    } finally {
        setIsDeleting(false);
    }
  };

  // Helper to create user without logging out the admin
  const createOwnerUser = async (email: string, pass: string) => {
    // 1. Initialize a secondary app instance
    const secondaryAppName = "secondaryApp";
    let secondaryApp = getApps().find(app => app.name === secondaryAppName);
    
    if (!secondaryApp) {
      secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
    }

    const secondaryAuth = getAuth(secondaryApp);

    // 2. Create the user
    const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, pass);
    const newUid = userCredential.user.uid;

    // 3. Sign out from secondary app to clean up session
    await signOut(secondaryAuth);
    
    return newUid;
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim() || !newTenantId.trim() || !newOwnerEmail.trim() || !newOwnerPassword.trim() || !newOwnerName.trim() || !newOwnerPin.trim()) {
      showNotification("Todos los campos son obligatorios", "error");
      return;
    }

    if (newOwnerPassword.length < 6) {
        showNotification("La contraseña debe tener al menos 6 caracteres", "error");
        return;
    }

    setCreatingLoading(true);
    try {
      const hashedPin = await hashPin(newOwnerPin.trim());

      // 1. Create Authentication User
      const newUid = await createOwnerUser(newOwnerEmail.trim(), newOwnerPassword.trim());

      // 2. Create User Document
      await setDoc(doc(db, "users", newUid), {
        email: newOwnerEmail.trim(),
        role: "owner",
        tenantId: newTenantId.trim(),
        name: newOwnerName.trim(), 
        pin: hashedPin,
        active: true,
        createdAt: new Date(),
        icon: "crown"
      });

      // 3. Create Tenant Document
      await setDoc(doc(db, "tenants", newTenantId.trim()), {
        name: newTenantName.trim(),
        status: "active",
      });

      showNotification("Tenant y Usuario creados exitosamente", "success");
      setIsCreating(false);
      
      // Clear form
      setNewTenantName("");
      setNewTenantId("");
      setNewOwnerName("");
      setNewOwnerPin("");
      setNewOwnerEmail("");
      setNewOwnerPassword("");
      
      fetchTenants(); // Refresh list
    } catch (err: unknown) {
      console.error("Error creating tenant/user:", err);
      const error = err as { code?: string; message?: string };
      if (error.code === "auth/email-already-in-use") {
        showNotification("El email ya está registrado.", "error");
      } else {
        showNotification("Error: " + (error.message || "Error desconocido"), "error");
      }
    } finally {
      setCreatingLoading(false);
    }
  };

  const handleDeleteTenant = (tenant: Tenant) => {
      openDeleteModal(tenant);
  };

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden">
      {/* Sidebar for navigation */}
      <Sidebar
        currentView={"saas-control" as ViewType}  
        adminSubTab={null}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isAdminOpen={isAdminOpen}
        setIsAdminOpen={setIsAdminOpen}
        currentUser={currentUser}
        onLogout={() => {
            onLogout();
            navigate("/login");
        }}
        onNavigate={(view) => {
           if (view === "finance") {
             navigate("/finance");
           } else {
             // For all other views (dashboard, history, analytics, clients, admin),
             // set the preference and go to the main admin route.
             localStorage.setItem("owner_currentView", view);
             navigate("/admin");
           }
        }}
        onAdminSubTabChange={(tab) => {
             // For subtabs, we set view to admin and the specific subtab
             localStorage.setItem("owner_currentView", "admin");
             localStorage.setItem("owner_adminSubTab", tab);
             navigate("/admin");
        }}
        showNotification={showNotification}
      />

      <MobileNavigation 
        currentUser={currentUser}
        currentView={"saas-control" as ViewType}
        onNavigate={(view) => {
           if (view === "finance") {
             navigate("/finance");
           } else {
             localStorage.setItem("owner_currentView", view);
             navigate("/admin");
           }
        }}
        onAdminSubTabChange={(tab) => {
           localStorage.setItem("owner_currentView", "admin");
           localStorage.setItem("owner_adminSubTab", tab);
           navigate("/admin");
        }}
        onLogout={() => {
            onLogout();
            navigate("/login");
        }}
        showNotification={showNotification}
      />

      <main className="flex-1 overflow-y-auto relative bg-background scroll-smooth pt-16 md:pt-0">
        <div className="w-full px-6 py-8 min-h-screen">
            
          <div className="max-w-6xl mx-auto space-y-6">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-text-main tracking-tight flex items-center gap-3">
                  <ShieldCheck className="text-primary-500" size={32} />
                  SaaS Control
                </h1>
                <p className="text-text-muted text-sm mt-1">
                  Gestión maestra de tenants y suscripciones.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={fetchTenants}
                  className="p-2 rounded-xl bg-surface border border-border text-text-muted hover:text-primary-500 transition-colors"
                  title="Recargar lista"
                >
                  <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
                <button
                  onClick={() => setIsCreating(true)}
                  className="px-4 py-2 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 shadow-lg shadow-primary-500/20 flex items-center gap-2 transition-all"
                >
                  <Plus size={20} />
                  Nuevo Usuario
                </button>
              </div>
            </header>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
               <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Total Tenants</p>
                  <p className="text-3xl font-black text-text-main mt-2">{tenants.length}</p>
               </div>
               <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Activos</p>
                  <p className="text-3xl font-black text-green-500 mt-2">{tenants.filter(t => t.status === 'active').length}</p>
               </div>
               <div className="bg-surface border border-border p-6 rounded-2xl shadow-sm">
                  <p className="text-text-muted text-xs font-bold uppercase tracking-wider">Suspendidos</p>
                  <p className="text-3xl font-black text-red-500 mt-2">{tenants.filter(t => t.status === 'suspended').length}</p>
               </div>
            </div>

            {/* List */}
            <div className="bg-surface border border-border rounded-2xl shadow-sm overflow-hidden animate-fade-in-up">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border bg-surface-highlight/50">
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                        Nombre del Local
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                        ID (Tenant)
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center">
                          <Loader2 className="animate-spin mx-auto text-primary-500 mb-2" size={24} />
                          <p className="text-sm text-text-muted">Cargando tenants...</p>
                        </td>
                      </tr>
                    ) : tenants.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-text-muted">
                          No hay tenants registrados.
                        </td>
                      </tr>
                    ) : (
                      tenants.map((tenant) => {
                        const isActive = tenant.status === "active";
                        const isUpdating = updatingId === tenant.id;

                        return (
                          <tr key={tenant.id} className="hover:bg-surface-highlight/30 transition-colors group">
                            <td className="px-6 py-4">
                              <span className="font-bold text-text-main text-sm">
                                {tenant.name}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <code className="text-xs font-mono bg-black/20 px-1.5 py-0.5 rounded text-text-dim">
                                {tenant.id}
                              </code>
                            </td>
                            <td className="px-6 py-4">
                              <div
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${
                                  isActive
                                    ? "bg-green-500/10 text-green-500 border-green-500/20"
                                    : "bg-red-500/10 text-red-500 border-red-500/20"
                                }`}
                              >
                                {isActive ? (
                                  <CheckCircle2 size={12} />
                                ) : (
                                  <XCircle size={12} />
                                )}
                                {isActive ? "Activo" : "Suspendido"}
                              </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => toggleStatus(tenant)}
                                disabled={isUpdating}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all duration-200 ${
                                  isActive
                                    ? "border-red-500/20 text-red-500 hover:bg-red-500/10"
                                    : "border-green-500/20 text-green-500 hover:bg-green-500/10"
                                } disabled:opacity-50`}
                              >
                                {isUpdating ? "Actualizando..." : isActive ? "Suspender" : "Activar"}
                              </button>

                              <button
                                onClick={() => handleDeleteTenant(tenant)}
                                disabled={isUpdating}
                                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border border-red-500/20 text-red-500 hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-200 ml-2 disabled:opacity-50"
                                title="Eliminar permanentemente"
                              >
                                <Trash2 size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCreating(false)} />
          <div className="relative w-full max-w-lg bg-surface border border-border rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <h2 className="text-xl font-black text-text-main mb-6 flex items-center gap-2">
                <Plus className="text-primary-500" />
                Nuevo Usuario / Negocio
            </h2>
            
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    Nombre del Local
                </label>
                <input
                    type="text"
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="Ej: Salon de Belleza Elite"
                    className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-text-dim/50"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                    ID del Tenant (Identificador Único)
                </label>
                <div className="relative">
                    <input
                        type="text"
                        value={newTenantId}
                        onChange={(e) => setNewTenantId(e.target.value)}
                        placeholder="Ej: client_1"
                        className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-text-dim/50 font-mono text-sm"
                    />
                     <p className="text-[10px] text-text-dim mt-1.5 ml-1">
                        Este será el ID interno del negocio.
                     </p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-4 mt-2">
                <p className="text-xs font-bold text-primary-500 uppercase tracking-wider mb-4">
                    Cuenta del Dueño
                </p>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                            Nombre del Dueño
                        </label>
                        <input
                            type="text"
                            value={newOwnerName}
                            onChange={(e) => setNewOwnerName(e.target.value)}
                            placeholder="Ej: María Pérez"
                            className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-text-dim/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                            PIN de Acceso (Numérico)
                        </label>
                        <input
                            type="text"
                            value={newOwnerPin}
                            onChange={(e) => setNewOwnerPin(e.target.value)}
                            placeholder="Ej: 1234"
                            maxLength={8}
                            className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-text-dim/50 font-mono tracking-widest"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                            Email (Usuario)
                        </label>
                        <input
                            type="email"
                            value={newOwnerEmail}
                            onChange={(e) => setNewOwnerEmail(e.target.value)}
                            placeholder="dueño@ejemplo.com"
                            className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-text-dim/50"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                            Contraseña Inicial
                        </label>
                        <input
                            type="text"
                            value={newOwnerPassword}
                            onChange={(e) => setNewOwnerPassword(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-primary-500/50 transition-all placeholder:text-text-dim/50 font-mono"
                        />
                    </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-border text-text-muted font-bold hover:bg-surface-highlight hover:text-text-main transition-colors"
                    disabled={creatingLoading}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 hover:shadow-lg transition-all shadow-primary-500/20 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    disabled={creatingLoading}
                >
                    {creatingLoading ? <Loader2 size={18} className="animate-spin" /> : null}
                    {creatingLoading ? "Creando..." : "Crear Tenant & Usuario"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteModalOpen && tenantToDelete && (
         <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
             <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteModalOpen(false)} />
             <div className="relative w-full max-w-md bg-surface border border-red-500/30 rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
                <div className="flex items-center gap-4 mb-4">
                    <div className="p-3 rounded-full bg-red-500/10">
                        <AlertTriangle className="w-8 h-8 text-red-500" />
                    </div>
                    <h3 className="text-xl font-bold text-text-main">¿Eliminar Permanentemente?</h3>
                </div>

                <div className="space-y-4 mb-6">
                    <p className="text-text-muted leading-relaxed text-sm">
                        Estás a punto de eliminar el tenant <span className="font-bold text-text-main">{tenantToDelete.name}</span>.
                    </p>
                    <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-3 text-xs text-red-400 font-mono">
                        Se borrarán: Usuarios, Inventario, Servicios, Clientes, Gastos, Catálogos.
                    </div>
                    <p className="text-text-muted text-xs font-semibold">
                        ⚠️ Esta acción NO SE PUEDE DESHACER.
                    </p>
                </div>

                <div className="mb-6">
                    <label className="block text-xs font-bold text-text-muted uppercase tracking-wider mb-2">
                        Escribe <span className="select-all text-text-main font-mono bg-black/20 px-1 rounded">{tenantToDelete.id}</span> para confirmar:
                    </label>
                    <input 
                        type="text" 
                        value={deleteConfirmationId}
                        onChange={(e) => setDeleteConfirmationId(e.target.value)}
                        placeholder={tenantToDelete.id}
                        className="w-full bg-surface-highlight border border-border rounded-lg px-4 py-3 text-text-main focus:outline-none focus:ring-2 focus:ring-red-500/50 transition-all font-mono text-sm"
                        disabled={isDeleting}
                    />
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={() => setDeleteModalOpen(false)}
                        disabled={isDeleting}
                        className="flex-1 px-4 py-3 rounded-xl border border-border text-text-muted font-bold hover:bg-surface-highlight hover:text-text-main transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmDelete}
                        disabled={deleteConfirmationId !== tenantToDelete.id || isDeleting}
                        className="flex-1 px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 hover:shadow-lg transition-all shadow-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                        {isDeleting ? "Eliminando..." : "Eliminar Todo"}
                    </button>
                </div>
             </div>
         </div>
      )}
    </div>
  );
};

export default MasterAdminScreen;
