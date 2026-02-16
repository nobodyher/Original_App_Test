import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Phone,
  Calendar,
} from "lucide-react";
import type { Client, Toast, AppUser } from "../../../../types";

// ============================================================================
// INTERFACES
// ============================================================================

export interface ClientsManagerProps {
  // Data
  clients: Client[];
  currentUser: AppUser | null;

  // Actions
  deleteClient: (clientId: string) => Promise<void>;
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

export const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  currentUser,
  deleteClient,
  showNotification,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  // Search & Pagination
  const [clientsSearch, setClientsSearch] = useState("");
  const [clientsPage, setClientsPage] = useState(1);
  const [deletedClientIds, setDeletedClientIds] = useState<Set<string>>(
    new Set(),
  );

  const ITEMS_PER_PAGE = 7;

  // Helper for relative time
  const getTimeAgo = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const diff = new Date().getTime() - new Date(dateStr).getTime();
    const days = Math.floor(diff / (1000 * 3600 * 24));
    
    if (days === 0) return "Hoy";
    if (days === 1) return "Ayer";
    if (days < 30) return `Hace ${days} días`;
    if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
    return dateStr;
  };

  // ==========================================================================
  // COMPUTED VALUES
  // ==========================================================================

  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => !deletedClientIds.has(c.id))
      .filter((c) =>
        c.name.toLowerCase().includes(clientsSearch.toLowerCase()),
      )
      .sort((a, b) => {
        // Sort by lastVisit descending (newest first)
        const dateA = a.lastVisit ? new Date(a.lastVisit).getTime() : 0;
        const dateB = b.lastVisit ? new Date(b.lastVisit).getTime() : 0;
        return dateB - dateA;
      });
  }, [clients, clientsSearch, deletedClientIds]);

  const paginatedClients = useMemo(() => {
    const start = (clientsPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, clientsPage]);

  const totalPages = Math.ceil(filteredClients.length / ITEMS_PER_PAGE);

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleDeleteClient = async (id: string) => {
    if (!currentUser || currentUser.role !== "owner") {
      showNotification("Solo el propietario puede eliminar clientes", "error");
      return;
    }

    try {
      await deleteClient(id);
      setDeletedClientIds((prev) => new Set(prev).add(id));
      showNotification("Cliente eliminado");
    } catch (error) {
      console.error("Error eliminando cliente:", error);
      showNotification("Error al eliminar cliente", "error");
    }
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
          <Users className="text-primary-600" />
          Clientes
        </h3>

        {/* Search Bar */}
        <div className="relative w-full md:w-96">
          <Search
            size={20}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Buscar cliente por nombre..."
            value={clientsSearch}
            onChange={(e) => {
              setClientsSearch(e.target.value);
              setClientsPage(1); // Reset to first page on search
            }}
            className="w-full pl-10 pr-4 py-3 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
          />
        </div>
      </div>

      {/* Stats Card */}
      <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl p-6 text-white shadow-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-primary-100 text-xs font-medium uppercase">
              Total Clientes
            </p>
            <p className="text-3xl font-bold mt-1">{clients.length}</p>
          </div>
          <div>
            <p className="text-primary-100 text-xs font-medium uppercase">
              Resultados
            </p>
            <p className="text-3xl font-bold mt-1">{filteredClients.length}</p>
          </div>
          <div>
            <p className="text-primary-100 text-xs font-medium uppercase">
              Página Actual
            </p>
            <p className="text-3xl font-bold mt-1">{clientsPage}</p>
          </div>
          <div>
            <p className="text-primary-100 text-xs font-medium uppercase">
              Total Páginas
            </p>
            <p className="text-3xl font-bold mt-1">{totalPages || 1}</p>
          </div>
        </div>
      </div>

      {/* Clients Table */}
      <div className="bg-surface rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            {/* Table Header */}
            <thead className="bg-surface-highlight">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider w-1/4">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Visitas Totales
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Gasto Total
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Primera Visita
                </th>
                 <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                  Última Visita
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-text-muted uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-border">
              {paginatedClients.length === 0 ? (
                <tr>
                  <td colSpan={4}>
                    {clientsSearch ? (
                      <EmptyState
                        icon={Search}
                        title="No se encontraron clientes"
                        message={`No hay resultados para "${clientsSearch}"`}
                      />
                    ) : (
                      <EmptyState
                        icon={Users}
                        title="No hay clientes registrados"
                        message="Los clientes aparecerán aquí cuando se creen nuevos servicios."
                      />
                    )}
                  </td>
                </tr>
              ) : (
                paginatedClients.map((client) => (
                  <tr
                    key={client.id}
                    className="group transition-colors duration-200 hover:bg-surface-highlight"
                  >
                    {/* Name */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                          {client.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-text-main text-base">
                            {client.name}
                          </p>
                          {client.phoneNumber && (
                             <p className="text-xs text-text-muted flex items-center gap-1">
                               <Phone size={10} /> {client.phoneNumber}
                             </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total Services (Visits) */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-sm border border-emerald-500/20">
                          🏅 {client.totalServices || 0} visitas
                        </span>
                      </div>
                    </td>

                    {/* Total Spent */}
                    <td className="px-6 py-4">
                       <span className="font-black text-text-main text-base">
                         ${(client.totalSpent || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                       </span>
                    </td>

                    {/* First Visit */}
                    <td className="px-6 py-4">
                      <span className="text-sm text-text-muted font-medium">
                        {client.firstVisit || "N/A"}
                      </span>
                    </td>

                     {/* Last Visit */}
                    <td className="px-6 py-4">
                      <div className={`flex items-center gap-2 text-sm font-bold ${
                         getTimeAgo(client.lastVisit) === "Hoy" || getTimeAgo(client.lastVisit) === "Ayer" 
                         ? "text-primary-500" 
                         : "text-text-muted"
                      }`}>
                        <Calendar size={14} />
                        <span>{getTimeAgo(client.lastVisit)}</span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      {currentUser?.role === "owner" && (
                        <button
                          onClick={() => handleDeleteClient(client.id)}
                          className="p-2 rounded-lg bg-red-600 text-white hover:bg-red-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                          title="Eliminar cliente"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-border bg-surface-highlight">
            <p className="text-sm text-text-muted">
              Mostrando {paginatedClients.length} de {filteredClients.length}{" "}
              clientes (Página {clientsPage} de {totalPages})
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setClientsPage((p) => Math.max(1, p - 1))}
                disabled={clientsPage === 1}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={() =>
                  setClientsPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={clientsPage === totalPages}
                className="p-2 rounded-lg bg-surface border border-border hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Info Note */}
      <div className="bg-primary-600/5 border border-primary-600/20 rounded-xl p-4">
        <p className="text-sm text-text-muted">
          <span className="font-semibold text-primary-600">Nota:</span> Los
          clientes se crean automáticamente cuando se registra un nuevo servicio
          con un nombre de cliente. La base de datos mantiene un registro de
          todos los clientes únicos.
        </p>
      </div>
    </div>
  );
};
