import React, { useState, useMemo } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  DollarSign,
  X,
  ChevronLeft,
  ChevronRight,
  Edit2,
  Trash2,
} from "lucide-react";
import { collection, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "../../../../firebase";
import type { Client, Toast } from "../../../../types";

interface ClientsManagerProps {
  clients: Client[];
  onRefresh?: () => void;
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

const ClientsManager: React.FC<ClientsManagerProps> = ({
  clients,
  onRefresh,
  showNotification,
}) => {
  // Local State for Pagination & Search
  const [clientsPage, setClientsPage] = useState(1);
  const [clientsSearch, setClientsSearch] = useState("");
  const ITEMS_PER_PAGE = 7;

  // Modal States
  const [isClientModalOpen, setIsClientModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Form State
  const [clientFormData, setClientFormData] = useState({
    name: "",
    phone: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter & Pagination Logic
  const filteredClients = useMemo(() => {
    return clients.filter((c) =>
      c.name.toLowerCase().includes(clientsSearch.toLowerCase())
    );
  }, [clients, clientsSearch]);

  const paginatedClients = useMemo(() => {
    const start = (clientsPage - 1) * ITEMS_PER_PAGE;
    return filteredClients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredClients, clientsPage, ITEMS_PER_PAGE]);

  // Handlers
  const handleAddClient = async () => {
    if (!clientFormData.name.trim()) {
        showNotification("El nombre es obligatorio", "error");
        return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, "clients"), {
        ...clientFormData,
        firstVisit: new Date().toISOString(),
        lastVisit: new Date().toISOString(),
        totalSpent: 0,
        totalServices: 0,
        active: true,
      });
      showNotification("Cliente agregado correctamente");
      setIsClientModalOpen(false);
      setClientFormData({ name: "", phone: "" });
      onRefresh?.();
    } catch (error) {
      console.error("Error adding client:", error);
      showNotification("Error al agregar cliente", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateClient = async () => {
    if (!editingClient || !clientFormData.name.trim()) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "clients", editingClient.id), {
        name: clientFormData.name,
        phone: clientFormData.phone,
      });
      showNotification("Cliente actualizado correctamente");
      setEditingClient(null);
      setClientFormData({ name: "", phone: "" });
      onRefresh?.();
    } catch (error) {
      console.error("Error updating client:", error);
      showNotification("Error al actualizar cliente", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteClient = async (id: string) => {
    if (!window.confirm("¿Estás seguro de eliminar este cliente?")) return;
    try {
      await deleteDoc(doc(db, "clients", id));
      showNotification("Cliente eliminado");
      onRefresh?.();
    } catch (error) {
      console.error("Error deleting client:", error);
      showNotification("Error al eliminar cliente", "error");
    }
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setClientFormData({
        name: client.name,
        phone: client.phone || "",
    });
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Users className="text-indigo-600" />
          Base de Clientes
        </h3>
        <div className="flex gap-4">
             <div className="relative">
                <input
                    type="text"
                    placeholder="Buscar cliente..."
                    value={clientsSearch}
                    onChange={(e) => {
                    setClientsSearch(e.target.value);
                    setClientsPage(1);
                    }}
                    className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-64 transition-all"
                />
                <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
            </div>
            <button 
                onClick={() => {
                    setClientFormData({ name: "", phone: "" });
                    setIsClientModalOpen(true);
                }}
                className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm font-medium"
            >
                <Plus size={18} />
                Nuevo Cliente
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex-1">
        <table className="w-full">
          <thead className="bg-indigo-50/50 border-b border-gray-100">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Cliente
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Última Visita
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total Gastado
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Servicios
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {paginatedClients.length === 0 ? (
              <tr>
                <td colSpan={5}>
                  <EmptyState
                    icon={Users}
                    title="No hay clientes"
                    message={
                      clientsSearch
                        ? "No se encontraron resultados para tu búsqueda."
                        : "Aún no hay clientes registrados."
                    }
                  />
                </td>
              </tr>
            ) : (
              paginatedClients.map((client) => (
                <tr
                  key={client.id}
                  className="hover:bg-gray-50/80 transition-colors group"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        {client.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{client.name}</p>
                        {client.phone && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                             <Phone size={12} /> {client.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                        <Calendar size={14} className="text-gray-400"/>
                        {new Date(client.lastVisit).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-900">
                    <div className="flex items-center gap-1">
                        <DollarSign size={14} className="text-green-600"/>
                         {client.totalSpent.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                      {client.totalServices} visitas
                    </span>
                  </td>
                  <td className="px-6 py-4">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                             onClick={() => openEditModal(client)}
                             className="p-1.5 text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                             title="Editar"
                          >
                              <Edit2 size={16} />
                          </button>
                          <button 
                             onClick={() => handleDeleteClient(client.id)}
                             className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                             title="Eliminar"
                          >
                              <Trash2 size={16} />
                          </button>
                      </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination for Clients */}
      {filteredClients.length > ITEMS_PER_PAGE && (
        <div className="flex justify-between items-center px-4 py-3 mt-4 border-t border-gray-100">
          <span className="text-sm text-gray-500">
            Mostrando {(clientsPage - 1) * ITEMS_PER_PAGE + 1} -{" "}
            {Math.min(clientsPage * ITEMS_PER_PAGE, filteredClients.length)} de{" "}
            {filteredClients.length}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setClientsPage((p) => Math.max(1, p - 1))}
              disabled={clientsPage === 1}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() =>
                setClientsPage((p) =>
                  p * ITEMS_PER_PAGE < filteredClients.length ? p + 1 : p
                )
              }
              disabled={clientsPage * ITEMS_PER_PAGE >= filteredClients.length}
              className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Add Client Slide-over */}
      {isClientModalOpen && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setIsClientModalOpen(false)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                   <h3 className="text-xl font-bold text-gray-800">Nuevo Cliente</h3>
                   <button onClick={() => setIsClientModalOpen(false)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                      <X size={20} />
                   </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input 
                            type="text" 
                            value={clientFormData.name}
                            onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            placeholder="Ej. Maria Perez"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input 
                            type="tel" 
                            value={clientFormData.phone}
                            onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                            placeholder="Ej. 55 1234 5678"
                        />
                    </div>
                </div>
                <div className="mt-auto p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={() => setIsClientModalOpen(false)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleAddClient}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? "Guardando..." : "Guardar Cliente"}
                    </button>
                </div>
            </div>
         </div>
      )}

      {/* Edit Client Slide-over */}
      {editingClient && (
         <div className="fixed inset-0 z-50 flex justify-end">
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setEditingClient(null)} />
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-indigo-50/50">
                   <h3 className="text-xl font-bold text-gray-800">Editar Cliente</h3>
                   <button onClick={() => setEditingClient(null)} className="p-2 rounded-full hover:bg-gray-100 text-gray-500">
                      <X size={20} />
                   </button>
                </div>
                <div className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                        <input 
                            type="text" 
                            value={clientFormData.name}
                            onChange={(e) => setClientFormData({...clientFormData, name: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                        <input 
                            type="tel" 
                            value={clientFormData.phone}
                            onChange={(e) => setClientFormData({...clientFormData, phone: e.target.value})}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
                        />
                    </div>
                </div>
                <div className="mt-auto p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
                    <button onClick={() => setEditingClient(null)} className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors">
                        Cancelar
                    </button>
                    <button 
                        onClick={handleUpdateClient}
                        disabled={isSubmitting}
                        className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
                    >
                        {isSubmitting ? "Actualizando..." : "Actualizar Cliente"}
                    </button>
                </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default ClientsManager;
