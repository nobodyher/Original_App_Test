import React, { useState, useMemo } from "react";
import {
  Users,
  ShoppingCart,
  Package,
  Plus,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  AlertTriangle,
  Beaker,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  DollarSign,
  Sparkles,
  Key,
  Percent,
} from "lucide-react";
import type {
  AppUser,
  CatalogService,
  CatalogExtra,
  MaterialRecipe,
  ServiceRecipe,
  Consumable,
  ChemicalProduct,
  Toast,
  Client,
} from "../../../types";

interface OwnerConfigTabProps {
  users: AppUser[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  materialRecipes: MaterialRecipe[];
  serviceRecipes: ServiceRecipe[];
  consumables: Consumable[];
  chemicalProducts: ChemicalProduct[];
  clients: Client[];
  showNotification: (message: string, type?: Toast["type"]) => void;

  // User Actions
  createNewUser: (data: any) => Promise<void>;
  updateUser: (userId: string, data: Partial<AppUser>) => Promise<void>;
  updateUserCommission: (userId: string, newCommission: number) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUserPermanently: (userId: string) => Promise<void>;

  // Inventory/Catalog Actions
  addCatalogService: (name: string, category: "manicura" | "pedicura", price: number) => Promise<void>;
  updateCatalogService: (id: string, data: Partial<CatalogService>) => Promise<void>;
  deleteCatalogService: (id: string) => Promise<void>;

  addExtra: (name: string, price: number) => Promise<void>;
  updateExtra: (id: string, data: Partial<CatalogExtra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;

  addConsumable: (data: any) => Promise<void>;
  updateConsumable: (id: string, data: Partial<Consumable>) => Promise<void>;
  deleteConsumable: (id: string) => Promise<void>;

  addChemicalProduct: (data: any) => Promise<void>;
  updateChemicalProduct: (id: string, updates: Partial<ChemicalProduct>, currentProduct?: ChemicalProduct) => Promise<void>;
  deleteChemicalProduct: (id: string) => Promise<void>;
  
  initializeMaterialsData: () => Promise<void>;
}

const TableSkeleton = () => (
  <div className="animate-in fade-in duration-300 w-full">
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-100">
          <tr>
            {[1, 2, 3, 4].map((i) => (
              <th key={i} className="px-6 py-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-skeleton"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {[1, 2, 3, 4, 5].map((row) => (
            <tr key={row}>
              {[1, 2, 3, 4].map((col) => (
                <td key={col} className="px-6 py-4">
                  <div className="h-4 w-full bg-gray-100 rounded animate-skeleton"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const EmptyState = ({ 
  icon: Icon, 
  title, 
  message 
}: { 
  icon: any, 
  title: string, 
  message: string 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
    <Icon size={64} className="text-gray-200 mb-4" strokeWidth={1.5} />
    <h3 className="text-lg font-bold text-gray-400 mb-2">{title}</h3>
    <p className="text-sm text-gray-400 max-w-xs mx-auto">{message}</p>
  </div>
);

const OwnerConfigTab: React.FC<OwnerConfigTabProps> = ({
  users,
  catalogServices,
  catalogExtras,
  materialRecipes,
  consumables,
  chemicalProducts,
  clients,
  showNotification,
  createNewUser,
  updateUser,
  deactivateUser,
  deleteUserPermanently,
  addCatalogService,
  updateCatalogService,
  deleteCatalogService,
  addExtra,
  updateExtra,
  deleteExtra,
  addConsumable,
  updateConsumable,
  deleteConsumable,
  addChemicalProduct,
  updateChemicalProduct,
  deleteChemicalProduct,
  initializeMaterialsData,
}) => {
  const [activeTab, setActiveTab] = useState<
    "services" | "consumables" | "personal" | "extras" | "materials" | "clients"
  >("services");

  // Skeleton Loading State
  const [isTableLoading, setIsTableLoading] = useState(false);

  React.useEffect(() => {
     setIsTableLoading(true);
     const timer = setTimeout(() => setIsTableLoading(false), 600);
     return () => clearTimeout(timer);
  }, [activeTab]);

  const tabs = [
    { id: "services", label: "Catálogo", icon: ShoppingCart, color: "text-purple-600" },
    { id: "consumables", label: "Consumibles", icon: Package, color: "text-blue-600" },
    { id: "personal", label: "Personal", icon: Users, color: "text-pink-600" },
    { id: "clients", label: "Clientes", icon: Users, color: "text-indigo-600" },
    { id: "extras", label: "Extras", icon: Plus, color: "text-orange-600" },
    { id: "materials", label: "Químicos", icon: Beaker, color: "text-green-600" }, // Using Beaker imported or ensuring it is imported
  ];

  const [newCatalogService, setNewCatalogService] = useState({
    name: "",
    category: "manicura" as "manicura" | "pedicura",
    basePrice: "",
  });

  const [newConsumable, setNewConsumable] = useState({
    name: "",
    unit: "",
    unitCost: "",
    stockQty: "",
    minStockAlert: "",
  });

  const [newChemicalProduct, setNewChemicalProduct] = useState({
    name: "",
    quantity: "",
    unit: "ml",
    purchasePrice: "",
    yield: "",
  });

  const [newUser, setNewUser] = useState({
    name: "",
    pin: "",
    commissionPct: "",
    color: "from-blue-500 to-blue-600",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingStaffItem, setEditingStaffItem] = useState<AppUser | null>(null);
  const [editStaffForm, setEditStaffForm] = useState<Partial<AppUser>>({});

  // Extras Adding State
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");

  const [editingCatalogService, setEditingCatalogService] = useState<string | null>(null);
  
  // Extras Editing State (Slide-over)
  const [editingExtraItem, setEditingExtraItem] = useState<CatalogExtra | null>(null);
  const [editExtraForm, setEditExtraForm] = useState<Partial<CatalogExtra>>({});
  // Consumables Editing State (Slide-over)
  const [editingConsumableItem, setEditingConsumableItem] = useState<Consumable | null>(null);
  
  // Clients State
  const [clientsPage, setClientsPage] = useState(1);
  const [clientsSearch, setClientsSearch] = useState("");

  const filteredClients = useMemo(() => {
    return clients.filter(c => 
      c.name.toLowerCase().includes(clientsSearch.toLowerCase())
    );
  }, [clients, clientsSearch]);

  const paginatedClients = useMemo(() => {
    const start = (clientsPage - 1) * 7;
    return filteredClients.slice(start, start + 7);
  }, [filteredClients, clientsPage]);

  const [editConsumableForm, setEditConsumableForm] = useState<Partial<Consumable>>({});
  
  // Chemical Product Editing State (Slide-over)
  const [editingProduct, setEditingProduct] = useState<ChemicalProduct | null>(null);
  const [editChemicalForm, setEditChemicalForm] = useState<Partial<ChemicalProduct>>({});

  // Pagination States
  const ITEMS_PER_PAGE = 7;
  const [servicesPage, setServicesPage] = useState(1);
  const [consumablesPage, setConsumablesPage] = useState(1);
  const [extrasPage, setExtrasPage] = useState(1);
  
  // Pagination Link Reset Logic
  React.useEffect(() => {
    setServicesPage(1);
  }, [catalogServices.length]);

  React.useEffect(() => {
    setConsumablesPage(1);
  }, [consumables.length]);

  React.useEffect(() => {
    setExtrasPage(1);
  }, [catalogExtras.length]);
  
  // Chemicals Pagination (Updated limit)
  const [chemicalsPage, setChemicalsPage] = useState(1);
  const CHEMICALS_PER_PAGE = 7;

  // Memoized Paginated Data
  const paginatedServices = useMemo(() => {
    return catalogServices.slice((servicesPage - 1) * ITEMS_PER_PAGE, servicesPage * ITEMS_PER_PAGE);
  }, [catalogServices, servicesPage]);

  const paginatedConsumables = useMemo(() => {
    return consumables.slice((consumablesPage - 1) * ITEMS_PER_PAGE, consumablesPage * ITEMS_PER_PAGE);
  }, [consumables, consumablesPage]);

  const paginatedExtras = useMemo(() => {
    return catalogExtras.slice((extrasPage - 1) * ITEMS_PER_PAGE, extrasPage * ITEMS_PER_PAGE);
  }, [catalogExtras, extrasPage]);

  const paginatedChemicals = useMemo(() => {
    const start = (chemicalsPage - 1) * CHEMICALS_PER_PAGE;
    return chemicalProducts.slice(start, start + CHEMICALS_PER_PAGE);
  }, [chemicalProducts, chemicalsPage]);

  // Wrappers
  const handleCreateNewUser = async () => {
    setIsSubmitting(true);
    try {
      await createNewUser({
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
      showNotification("Usuario creado exitosamente");
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      showNotification(error.message || "Error al crear usuario", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateUser = async (userId: string, updates: Partial<AppUser>) => {
    try {
      await updateUser(userId, updates);
      setEditingStaffItem(null);
      showNotification("Perfil de usuario actualizado");
    } catch (error: any) {
      console.error("Error actualizando usuario:", error);
      showNotification(error.message || "Error al actualizar", "error");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!window.confirm("¿Desactivar este usuario?")) return;
    try {
      await deactivateUser(userId);
      showNotification("Usuario desactivado");
    } catch (error: any) {
      console.error("Error desactivando usuario:", error);
      showNotification("Error al desactivar", "error");
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
      await deleteUserPermanently(userId);
      showNotification("Usuario eliminado permanentemente");
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleAddCatalogService = async () => {
    setIsSubmitting(true);
    try {
      await addCatalogService(
        newCatalogService.name,
        newCatalogService.category,
        parseFloat(newCatalogService.basePrice)
      );

      setNewCatalogService({ name: "", category: "manicura", basePrice: "" });
      showNotification("Servicio agregado al catálogo");
    } catch (error: any) {
      console.error("Error agregando servicio:", error);
      showNotification(error.message || "Error al agregar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCatalogService = async (id: string, updated: Partial<CatalogService>) => {
    try {
      await updateCatalogService(id, updated);
      setEditingCatalogService(null);
      showNotification("Servicio actualizado");
    } catch (error) {
      console.error("Error actualizando servicio:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleToggleCatalogService = async (id: string, active: boolean) => {
    try {
      await updateCatalogService(id, { active: !active });
      showNotification(active ? "Servicio desactivado" : "Servicio activado");
    } catch (error) {
      console.error("Error actualizando servicio:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteCatalogService = async (id: string) => {
    if (!window.confirm("¿Eliminar este servicio del catálogo?")) return;
    try {
      await deleteCatalogService(id);
      showNotification("Servicio eliminado");
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleAddExtra = async () => {
    setIsSubmitting(true);
    try {
      await addExtra(newExtraName, parseFloat(newExtraPrice));
      setNewExtraName("");
      setNewExtraPrice("");
      showNotification("Extra agregado");
    } catch (error: any) {
      console.error("Error agregando extra:", error);
      showNotification(error.message || "Error al agregar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExtra = async (id: string, updates: Partial<CatalogExtra>) => {
    try {
      await updateExtra(id, updates);
      setEditingExtraItem(null);
      showNotification("Extra actualizado");
    } catch (error) {
      console.error("Error actualizando extra:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleToggleExtra = async (id: string, active: boolean) => {
    try {
      await updateExtra(id, { active: !active });
      showNotification(active ? "Extra desactivado" : "Extra activado");
    } catch (error) {
      console.error("Error actualizando extra:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (!window.confirm("¿Eliminar este extra?")) return;
    try {
      await deleteExtra(id);
      showNotification("Extra eliminado");
    } catch (error) {
      console.error("Error eliminando extra:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleAddConsumable = async () => {
    setIsSubmitting(true);
    try {
      await addConsumable({
        name: newConsumable.name,
        unit: newConsumable.unit,
        unitCost: parseFloat(newConsumable.unitCost),
        stockQty: parseFloat(newConsumable.stockQty),
        minStockAlert: parseFloat(newConsumable.minStockAlert),
      });

      setNewConsumable({
        name: "",
        unit: "",
        unitCost: "",
        stockQty: "",
        minStockAlert: "",
      });
      showNotification("Consumible agregado");
    } catch (error: any) {
      console.error("Error agregando consumible:", error);
      showNotification(error.message || "Error al agregar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateConsumable = async (id: string, updated: Partial<Consumable>) => {
    try {
      await updateConsumable(id, updated);
      setEditingConsumableItem(null);
      showNotification("Consumible actualizado");
    } catch (error) {
      console.error("Error actualizando consumible:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteConsumable = async (id: string) => {
    if (!window.confirm("¿Eliminar este consumible?")) return;
    try {
      await deleteConsumable(id);
      showNotification("Consumible eliminado");
    } catch (error) {
      console.error("Error eliminando consumible:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleAddChemicalProduct = async () => {
    setIsSubmitting(true);
    try {
      await addChemicalProduct({
        name: newChemicalProduct.name,
        quantity: parseFloat(newChemicalProduct.quantity),
        unit: newChemicalProduct.unit as "ml" | "L" | "g" | "kg" | "unid",
        purchasePrice: parseFloat(newChemicalProduct.purchasePrice),
        yield: parseFloat(newChemicalProduct.yield),
        costPerService: 0,
        stock: 0,
        minStock: 0,
      });

      setNewChemicalProduct({
        name: "",
        quantity: "",
        unit: "ml",
        purchasePrice: "",
        yield: "",
      });
      showNotification("Producto guardado");
    } catch (error: any) {
      console.error("Error agregando producto:", error);
      showNotification(error.message || "Error al agregar", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateChemicalProduct = async (id: string, updates: Partial<ChemicalProduct>) => {
    try {
      await updateChemicalProduct(
        id,
        updates,
        chemicalProducts.find((p) => p.id === id)
      );
      showNotification("Producto actualizado");
    } catch (error) {
      console.error("Error actualizando producto:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteChemicalProduct = async (id: string) => {
    if (!window.confirm("¿Eliminar este producto químico?")) return;
    try {
      await deleteChemicalProduct(id);
      showNotification("Producto eliminado");
    } catch (error) {
      console.error("Error eliminando producto:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const lowStockConsumables = consumables.filter(
    (c) => c.active && c.stockQty <= c.minStockAlert
  );

  return (
    <div className="space-y-6">
      {lowStockConsumables.length > 0 && (
        <div className="bg-linear-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-orange-600" size={32} />
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                ⚠️ Alertas de Stock Bajo
              </h3>
              <p className="text-sm text-gray-600">
                {lowStockConsumables.length} consumible(s) necesitan reposición
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockConsumables.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-lg p-4 border-2 border-orange-200"
              >
                <p className="font-bold text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-600">
                  Stock actual: <span className="font-bold">{c.stockQty}</span>{" "}
                  {c.unit} (mínimo: {c.minStockAlert})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}



      {/* Main Tab Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out hover:pl-5 font-medium text-left relative overflow-hidden group ${
                  isActive
                    ? "bg-white shadow-sm text-purple-700"
                    : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-purple-600 rounded-r-full shadow-[0_0_10px_rgb(147,51,234)] animate-in slide-in-from-left-1"></div>
                )}

                <Icon
                  size={20}
                  className={isActive ? tab.color : "text-gray-400"}
                />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[600px] relative ${activeTab === 'clients' ? 'p-5' : 'p-8'}`}>

          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <ShoppingCart className="text-purple-600" />
                Catálogo de Servicios
              </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-purple-50 rounded-lg">
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={newCatalogService.name}
              onChange={(e) =>
                setNewCatalogService({
                  ...newCatalogService,
                  name: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <select
              value={newCatalogService.category}
              onChange={(e) =>
                setNewCatalogService({
                  ...newCatalogService,
                  category: e.target.value as "manicura" | "pedicura",
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            >
              <option value="manicura">Manicura</option>
              <option value="pedicura">Pedicura</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Precio base $"
              value={newCatalogService.basePrice}
              onChange={(e) =>
                setNewCatalogService({
                  ...newCatalogService,
// fixed in previous step or handled here if shift occurred
                  basePrice: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <button
              onClick={handleAddCatalogService}
              disabled={isSubmitting}
              className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out font-semibold ${
                isSubmitting ? "opacity-60 cursor-wait animate-pulse pointer-events-none" : "cursor-pointer hover:-translate-y-0.5 active:scale-95 active:shadow-inner"
              }`}
            >
              Agregar
            </button>
          </div>



          {isTableLoading ? (
             <TableSkeleton />
          ) : (
          <>
          <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Categoría
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Precio Base
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedServices.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState 
                        icon={ShoppingCart} 
                        title="No hay servicios" 
                        message="Usa el formulario de arriba para añadir el primer servicio al catálogo." 
                      />
                    </td>
                  </tr>
                ) : (
                  paginatedServices.map((cs) => {
                  const isEditing = editingCatalogService === cs.id;

                  return (
                    <tr
                      key={cs.id}
                      className={`group transition-colors duration-200 even:bg-slate-50/30 hover:bg-gray-100/80 ${
                        !cs.active ? "opacity-60 bg-gray-50" : ""
                      }`}
                    >
                      <td className="w-4"></td>
                      {isEditing ? (
                        <>
                          <td className="px-6 py-4">
                            <input
                              type="text"
                              defaultValue={cs.name}
                              id={`edit-service-name-${cs.id}`}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-900 transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <select
                              defaultValue={cs.category}
                              id={`edit-service-category-${cs.id}`}
                              className="w-full px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-700 transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none appearance-none bg-white"
                            >
                              <option value="manicura">Manicura</option>
                              <option value="pedicura">Pedicura</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={cs.basePrice}
                              id={`edit-service-price-${cs.id}`}
                              className="w-32 px-4 py-2 border border-gray-200 rounded-xl text-sm font-bold text-gray-900 transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                            />
                          </td>
                          <td className="px-6 py-4">
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                cs.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                             }`}>
                                {cs.active ? "Activo" : "Inactivo"}
                             </span>
                          </td>
                          <td className="px-6 py-4 flex items-center gap-2">
                            <button
                              onClick={() => {
                                const name = (
                                  document.getElementById(
                                    `edit-service-name-${cs.id}`
                                  ) as HTMLInputElement
                                ).value;
                                const category = (
                                  document.getElementById(
                                    `edit-service-category-${cs.id}`
                                  ) as HTMLSelectElement
                                ).value as "manicura" | "pedicura";
                                const basePrice = parseFloat(
                                  (
                                    document.getElementById(
                                      `edit-service-price-${cs.id}`
                                    ) as HTMLInputElement
                                  ).value
                                );

                                handleUpdateCatalogService(cs.id, {
                                  name,
                                  category,
                                  basePrice,
                                });
                              }}
                              className="p-2 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-colors shadow-sm"
                              title="Guardar"
                            >
                              <Save size={18} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => setEditingCatalogService(null)}
                              className="p-2 rounded-xl bg-gray-50 text-gray-400 hover:bg-gray-100 transition-colors"
                              title="Cancelar"
                            >
                              <X size={18} strokeWidth={2.5} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {cs.name}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600 capitalize tracking-wide">
                            {cs.category}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-gray-900 font-mono">
                            ${cs.basePrice.toFixed(2)}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm ${
                                cs.active
                                  ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              }`}
                            >
                              {cs.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              <button
                                onClick={() => setEditingCatalogService(cs.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:scale-110 active:scale-90"
                                title="Editar"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() =>
                                  handleToggleCatalogService(cs.id, cs.active)
                                }
                                className={`p-2 rounded-lg transition-colors ${
                                  cs.active
                                    ? "text-slate-400 hover:text-orange-500 hover:bg-orange-50"
                                    : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                                } transition-all duration-200 hover:scale-110 active:scale-90`}
                                title={cs.active ? "Desactivar" : "Activar"}
                              >
                                {cs.active ? (
                                  <XCircle size={16} />
                                ) : (
                                  <CheckCircle size={16} />
                                )}
                              </button>
                              <button
                                onClick={() => handleDeleteCatalogService(cs.id)}
                                className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
                                title="Eliminar"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>

          {/* Catalog Operations Pagination */}
          <div className="flex justify-between items-center px-4 py-3 border-t border-gray-100 mt-2">
            <div className="text-sm text-gray-500 font-medium">
              Mostrando {Math.min((servicesPage - 1) * ITEMS_PER_PAGE + 1, catalogServices.length)} - {Math.min(servicesPage * ITEMS_PER_PAGE, catalogServices.length)} de {catalogServices.length} servicios
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                disabled={servicesPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 rounded-lg bg-purple-600 text-white font-bold shadow-sm shadow-purple-200">
                {servicesPage}
              </span>
              <button
                onClick={() => setServicesPage((p) => (p * ITEMS_PER_PAGE < catalogServices.length ? p + 1 : p))}
                disabled={servicesPage * ITEMS_PER_PAGE >= catalogServices.length}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          </>
          )}
        </div>
        )}

          {activeTab === "consumables" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Package className="text-blue-600" />
                Inventario de Consumibles
              </h3>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-6 bg-slate-50 border border-slate-200 rounded-xl shadow-sm">
            <h4 className="md:col-span-6 font-bold text-gray-800 mb-2 flex items-center gap-2">
               <PlusCircle size={18} className="text-purple-600" />
               Agregar Nuevo Consumible
            </h4>
            <input
              type="text"
              placeholder="Nombre"
              value={newConsumable.name}
              onChange={(e) =>
                setNewConsumable({ ...newConsumable, name: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            />
            <input
              type="text"
              placeholder="Unidad"
              value={newConsumable.unit}
              onChange={(e) =>
                setNewConsumable({ ...newConsumable, unit: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Costo/unidad"
              value={newConsumable.unitCost}
              onChange={(e) =>
                setNewConsumable({
                  ...newConsumable,
                  unitCost: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            />
            <input
              type="number"
              placeholder="Stock inicial"
              value={newConsumable.stockQty}
              onChange={(e) =>
                setNewConsumable({
                  ...newConsumable,
                  stockQty: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            />
            <input
              type="number"
              placeholder="Alerta mínima"
              value={newConsumable.minStockAlert}
              onChange={(e) =>
                setNewConsumable({
                  ...newConsumable,
                  minStockAlert: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
            />
            <button
              onClick={handleAddConsumable}
              disabled={isSubmitting}
              className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out font-semibold ${
                isSubmitting ? "opacity-60 cursor-wait animate-pulse pointer-events-none" : "cursor-pointer hover:-translate-y-0.5 active:scale-95 active:shadow-inner"
              }`}
            >
              Agregar
            </button>
          </div>

          {isTableLoading ? (
             <TableSkeleton />
          ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Unidad
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Costo/unidad
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Alerta
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedConsumables.length === 0 ? (
                   <tr>
                      <td colSpan={6}>
                        <EmptyState 
                          icon={Package} 
                          title="Sin consumibles" 
                          message="Agrega algodón, acetona, limas y otros materiales aquí." 
                        />
                      </td>
                   </tr>
                ) : (
                  paginatedConsumables.map((c) => {
                  const isLowStock = c.stockQty <= c.minStockAlert;

                  return (
                    <tr
                      key={c.id}
                      className={`border-b hover:bg-gray-100/80 transition-colors duration-200 ${
                        isLowStock ? "bg-orange-50" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {c.name}
                      </td>
                      <td className="px-4 py-3 text-sm">{c.unit}</td>
                      <td className="px-4 py-3 text-sm">
                        ${c.unitCost.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-sm font-bold">
                        {c.stockQty} {c.unit}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {c.minStockAlert}
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => {
                            setEditingConsumableItem(c);
                            setEditConsumableForm(c);
                          }}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition-all duration-200 hover:scale-110 active:scale-90"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteConsumable(c.id)}
                          className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>

          {/* Consumables Pagination */}
          <div className="flex justify-between items-center px-4 py-3 mt-4">
             <div className="text-sm text-gray-500 font-medium">
              Mostrando {Math.min((consumablesPage - 1) * ITEMS_PER_PAGE + 1, consumables.length)} - {Math.min(consumablesPage * ITEMS_PER_PAGE, consumables.length)} de {consumables.length} consumibles
             </div>
             <div className="flex gap-2">
              <button
                onClick={() => setConsumablesPage((p) => Math.max(1, p - 1))}
                disabled={consumablesPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 rounded-lg bg-blue-600 text-white font-bold shadow-sm shadow-blue-200">
                {consumablesPage}
              </span>
              <button
                onClick={() => setConsumablesPage((p) => (p * ITEMS_PER_PAGE < consumables.length ? p + 1 : p))}
                disabled={consumablesPage * ITEMS_PER_PAGE >= consumables.length}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
             </div>
          </div>
          </div>
          )}
        </div>
        )}

          {activeTab === "personal" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Users className="text-pink-600" />
                Gestionar Personal
              </h3>
          {/* Crear nuevo usuario */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h4 className="text-lg font-bold text-blue-900 mb-4">
              Crear Nuevo Usuario
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none text-gray-900 bg-white"
              />
              <input
                type="password"
                placeholder="PIN (4+ dígitos)"
                value={newUser.pin}
                onChange={(e) =>
                  setNewUser({ ...newUser, pin: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none text-gray-900 bg-white"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Comisión %"
                value={newUser.commissionPct}
                onChange={(e) =>
                  setNewUser({ ...newUser, commissionPct: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none text-gray-900 bg-white"
              />
              <select
                value={newUser.color}
                onChange={(e) =>
                  setNewUser({ ...newUser, color: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-pink-500/20 focus:border-pink-500 focus:outline-none text-gray-900 bg-white"
              >
                <option value="from-blue-500 to-blue-600">Azul</option>
                <option value="from-pink-500 to-pink-600">Rosa</option>
                <option value="from-green-500 to-green-600">Verde</option>
                <option value="from-purple-500 to-purple-600">Morado</option>
                <option value="from-orange-500 to-orange-600">Naranja</option>
              </select>
              <button
                onClick={handleCreateNewUser}
                disabled={isSubmitting}
                className={`bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out font-semibold flex items-center justify-center ${
                  isSubmitting ? "opacity-60 cursor-wait animate-pulse pointer-events-none" : "cursor-pointer hover:-translate-y-0.5 active:scale-95 active:shadow-inner"
                }`}
              >
                <Plus size={18} className="inline mr-2" />
                Crear Usuario
              </button>
            </div>
          </div>

          {/* Lista de usuarios */}
          {/* Lista de usuarios - Diseño Cards */}
          {isTableLoading ? (
             <TableSkeleton />
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {users.filter((u) => u.role === "staff").length === 0 ? (
                <div className="col-span-full">
                   <EmptyState 
                      icon={Users} 
                      title="No hay personal" 
                      message="Crea un nuevo usuario con rol de Staff para que pueda acceder al sistema." 
                   />
                </div>
            ) : (
                users
              .filter((u) => u.role === "staff")
              .map((user) => (
                <div
                  key={user.id}
                  className={`bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex flex-col items-center text-center transition-all hover:bg-gray-100/80 hover:shadow-md hover:border-purple-100 group relative ${
                    !user.active ? "opacity-75 grayscale-[0.5]" : ""
                  }`}
                >
                  {/* Status Badge Top Right */}
                  <div className="absolute top-4 right-4">
                    <span
                      className={`w-3 h-3 rounded-full block ring-2 ring-white ${
                        user.active ? "bg-emerald-400" : "bg-slate-300"
                      }`}
                    />
                  </div>

                  {/* Avatar Circle */}
                  <div className="w-20 h-20 rounded-full bg-linear-to-br from-purple-100 to-pink-50 flex items-center justify-center text-2xl font-bold text-purple-700 mb-4 shadow-inner ring-4 ring-white">
                    {user.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name */}
                  <h5 className="text-lg font-bold text-gray-800 mb-1">
                    {user.name}
                  </h5>
                  <p className="text-sm text-slate-500 mb-4 font-medium">Role: Staff</p>

                  {/* Commission Bubble */}
                  <div className="mb-6">
                      <button
                        onClick={() => {
                          setEditingStaffItem(user);
                          setEditStaffForm(user);
                        }}
                        className="inline-flex flex-col items-center justify-center w-16 h-16 rounded-full bg-purple-50 border-2 border-dashed border-purple-200 hover:border-purple-400 hover:bg-purple-100 transition-all cursor-pointer group/comm"
                        title="Editar Perfil y Comisión"
                      >
                         <span className="text-xl font-black text-purple-600 leading-none">
                           {user.commissionPct}<span className="text-xs align-top">%</span>
                         </span>
                         <span className="text-[9px] font-bold text-purple-400 uppercase tracking-widest mt-0.5 group-hover/comm:text-purple-600">Comisión</span>
                      </button>
                  </div>

                  {/* Actions Footer */}
                  <div className="w-full pt-4 border-t border-slate-50 flex justify-center gap-4">
                     <button
                        onClick={() => handleDeactivateUser(user.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                             user.active 
                             ? "text-slate-500 hover:text-orange-600 hover:bg-orange-50"
                             : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                        }`}
                        title={user.active ? "Desactivar Cuenta" : "Reactivar Cuenta"}
                     >
                        {user.active ? <XCircle size={18} /> : <CheckCircle size={18} />}
                        {user.active ? "Desactivar" : "Activar"}
                     </button>
                     
                     <button
                        onClick={() => handleDeleteUserPermanently(user.id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Eliminar Permanentemente"
                     >
                        <Trash2 size={18} />
                     </button>
                  </div>
                </div>
              ))
              )}
          </div>
          )}
        </div>
        )}

          {activeTab === "extras" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Plus className="text-orange-600" />
                Gestión de Extras
              </h3>
          {/* Form agregar extra */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3">
              Agregar Nuevo Extra
            </h4>
            <div className="flex gap-2 flex-wrap items-end">
              <input
                type="text"
                placeholder="Nombre del extra"
                value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none text-gray-900 bg-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Precio por uña"
                value={newExtraPrice}
                onChange={(e) => setNewExtraPrice(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 focus:outline-none text-gray-900 bg-white"
              />
              <button
                onClick={handleAddExtra}
                disabled={isSubmitting}
                className={`bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out font-semibold ${
                  isSubmitting ? "opacity-60 cursor-wait animate-pulse pointer-events-none" : "cursor-pointer hover:-translate-y-0.5 active:scale-95 active:shadow-inner"
                }`}
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Tabla de extras */}
          {isTableLoading ? (
             <TableSkeleton />
          ) : (
          <div className="overflow-hidden rounded-xl border border-gray-100 shadow-sm bg-white">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Precio/Uña
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginatedExtras.length === 0 ? (
                   <tr>
                      <td colSpan={4}>
                        <EmptyState 
                          icon={Sparkles} 
                          title="Sin extras" 
                          message="Agrega decoraciones y servicios adicionales aquí." 
                        />
                      </td>
                   </tr>
                ) : (
                  paginatedExtras.map((extra) => {
                  const price =
                    (extra as any).price || extra.priceSuggested || 0;
                  return (
                    <tr
                      key={extra.id}
                      className={`group transition-colors duration-200 even:bg-slate-50/30 hover:bg-gray-100/80 ${
                        !extra.active ? "opacity-60" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {extra.name || "Sin nombre"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold text-gray-900 font-mono">
                        ${price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          onClick={() => handleToggleExtra(extra.id, extra.active)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm cursor-pointer hover:scale-105 transition-transform ${
                            extra.active
                              ? "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200"
                              : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                          }`}
                          title="Clic para alternar estado"
                        >
                          {extra.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              setEditingExtraItem(extra);
                              setEditExtraForm(extra);
                            }}
                            className="p-2 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-all duration-200 hover:scale-110 active:scale-90"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteExtra(extra.id)}
                            className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
              </tbody>
            </table>
          </div>
          )}
          
          {/* Extras Pagination */}
          <div className="flex justify-between items-center px-4 py-3 mt-4">
            <div className="text-sm text-gray-500 font-medium">
              Mostrando{" "}
              {Math.min(
                (extrasPage - 1) * ITEMS_PER_PAGE + 1,
                catalogExtras.length
              )}{" "}
              -{" "}
              {Math.min(extrasPage * ITEMS_PER_PAGE, catalogExtras.length)} de{" "}
              {catalogExtras.length} extras
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setExtrasPage((p) => Math.max(1, p - 1))}
                disabled={extrasPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold shadow-sm shadow-orange-200">
                {extrasPage}
              </span>
              <button
                onClick={() =>
                  setExtrasPage((p) =>
                    p * ITEMS_PER_PAGE < catalogExtras.length ? p + 1 : p
                  )
                }
                disabled={extrasPage * ITEMS_PER_PAGE >= catalogExtras.length}
                className="px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>


          {catalogExtras.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay extras registrados
            </div>
          )}
        </div>
        )}

          {activeTab === "materials" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Beaker className="text-green-600" />
                Inventario de Materiales Químicos
              </h3>
          {/* Botón de inicialización (solo si no hay datos) */}
          {chemicalProducts.length === 0 && (
            <div className="mb-6 p-6 bg-linear-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                🚀 Inicialización Requerida
              </h4>
              <p className="text-gray-600 mb-4">
                Haz clic en el botón para agregar automáticamente 8 productos
                químicos y 6 recetas de servicios a Firebase.
              </p>
              <button
                onClick={initializeMaterialsData}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-lg"
              >
                ✨ Inicializar Datos de Materiales
              </button>
            </div>
          )}

          {/* Sección 1: Productos Químicos */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Productos Químicos
            </h4>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
               <h5 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <PlusCircle size={20} className="text-purple-600" />
                  Agregar Nuevo Producto Químico
               </h5>
               <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Nombre producto (ej: Alcohol)"
                className="border-2 border-slate-200 p-2.5 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 focus:outline-none bg-white"
                value={newChemicalProduct.name}
                onChange={(e) =>
                  setNewChemicalProduct({
                    ...newChemicalProduct,
                    name: e.target.value,
                  })
                }
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Cant."
                  className="border-2 border-slate-200 p-2.5 rounded-lg w-full transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 focus:outline-none bg-white"
                  value={newChemicalProduct.quantity}
                  onChange={(e) =>
                    setNewChemicalProduct({
                      ...newChemicalProduct,
                      quantity: e.target.value,
                    })
                  }
                />
                <select
                  className="border-2 border-slate-200 p-2.5 rounded-lg bg-white transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 focus:outline-none"
                  value={newChemicalProduct.unit}
                  onChange={(e) =>
                    setNewChemicalProduct({
                      ...newChemicalProduct,
                      unit: e.target.value,
                    })
                  }
                >
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="unid">unid</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Precio ($)"
                className="border-2 border-slate-200 p-2.5 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 focus:outline-none bg-white"
                value={newChemicalProduct.purchasePrice}
                onChange={(e) =>
                  setNewChemicalProduct({
                    ...newChemicalProduct,
                    purchasePrice: e.target.value,
                  })
                }
              />
              <input
                type="number"
                placeholder="Rendimiento (servicios)"
                className="border-2 border-slate-200 p-2.5 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 focus:outline-none bg-white"
                value={newChemicalProduct.yield}
                onChange={(e) =>
                  setNewChemicalProduct({
                    ...newChemicalProduct,
                    yield: e.target.value,
                  })
                }
              />
              <button
                onClick={handleAddChemicalProduct}
                disabled={isSubmitting}
                className={`bg-purple-600 hover:bg-purple-700 text-white p-2.5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out font-bold ${
                  isSubmitting ? "opacity-60 cursor-wait animate-pulse pointer-events-none" : "cursor-pointer hover:-translate-y-0.5 active:scale-95 active:shadow-inner"
                }`}
              >
                Guardar
              </button>
            </div>
          </div>

            {/* Buscador y filtros arriba del todo si se desea, por ahora directo a la tabla */}
           <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Productos Químicos
            </h4>

            {paginatedChemicals.length === 0 ? (
               <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
                  <EmptyState 
                    icon={Beaker} 
                    title="Inventario químico vacío" 
                    message="Registra tus productos químicos para controlar el stock." 
                  />
               </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedChemicals.map((product) => {
                 const isLowStock = product.stock <= product.minStock;

                 return (
                   <div 
                      key={product.id}
                      className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 group relative ${isLowStock ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100 hover:border-purple-100'}`}
                   >
                      {/* Header Badge */}
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <h5 className="font-bold text-gray-800 text-lg leading-tight">{product.name}</h5>
                            <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                               <Package size={14} />
                               {product.quantity} {product.unit} (compra)
                            </p>
                         </div>
                         <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${product.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                            {product.active ? 'Activo' : 'Inactivo'}
                         </span>
                      </div>

                      {/* Body Statistics */}
                      <div className="space-y-3 mb-6">
                         <div className={`flex items-center justify-between p-3 rounded-lg ${isLowStock ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50 border border-slate-100'}`}>
                            <span className="text-sm text-slate-600 font-medium">Stock Actual</span>
                             <div className="flex items-center gap-2">
                                {isLowStock && <AlertTriangle size={18} className="text-orange-500 animate-pulse" />}
                                <span className={`text-2xl font-bold ${isLowStock ? 'text-orange-600' : 'text-slate-800'}`}>
                                   {product.stock}
                                </span>
                             </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="p-2.5 border border-slate-100 rounded-lg">
                                <span className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Costo Unit.</span>
                                <span className="font-semibold text-slate-700">${product.purchasePrice.toFixed(2)}</span>
                            </div>
                            <div className="p-2.5 border border-purple-100 bg-purple-50/30 rounded-lg">
                                 <span className="block text-xs text-purple-600 mb-1 uppercase font-bold tracking-wider">Costo/Servicio</span>
                                 <span className="font-bold text-purple-700">${product.costPerService.toFixed(2)}</span>
                            </div>
                         </div>
                         
                         <div className="text-xs text-center text-slate-400">
                            Rendimiento aprox: <span className="font-medium text-slate-600">{product.yield} servicios</span>
                         </div>
                      </div>

                      {/* Footer Actions */}
                      <div className="flex items-center gap-2 pt-4 border-t border-slate-50 mt-auto">
                          <button
                            onClick={() => {
                                setEditingProduct(product);
                                setEditChemicalForm(product);
                            }}
                            className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-purple-600 hover:bg-purple-50 font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 border border-transparent hover:border-purple-100 group"
                          >
                             <Edit2 size={16} className="group-hover:scale-110 transition-transform" /> 
                             Editar
                          </button>
                          <button
                             onClick={() => handleDeleteChemicalProduct(product.id)}
                             className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
                             title="Eliminar"
                          >
                             <Trash2 size={18} />
                          </button>
                      </div>
                   </div>
                 );
              })}
            </div>
            )}
            </div>

             {/* Pagination Controls */}
             <div className="flex justify-between items-center px-2 mt-4">
                <div className="text-sm text-gray-500">
                    Mostrando {((chemicalsPage - 1) * 5) + 1} a {Math.min(chemicalsPage * 5, chemicalProducts.length)} de {chemicalProducts.length} productos
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setChemicalsPage(p => Math.max(1, p - 1))}
                        disabled={chemicalsPage === 1}
                        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span className="flex items-center px-3 font-semibold text-gray-700">
                        Página {chemicalsPage}
                    </span>
                    <button
                        onClick={() => setChemicalsPage(p => (p * 5 < chemicalProducts.length ? p + 1 : p))}
                        disabled={chemicalsPage * 5 >= chemicalProducts.length}
                        className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
             </div>


          </div>

          {/* Sección 2: Recetas por Servicio */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Recetas de Servicios (Costo de Materiales)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materialRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                 className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-300 transition-colors group"
                >
                  <h5 className="font-bold text-gray-800 mb-2">
                    {recipe.serviceName}
                  </h5>
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-semibold">Categoría:</span>{" "}
                    {recipe.category === "manicura" ? "Manicura" : "Pedicura"}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Químicos:</span>
                      <span className="font-semibold text-blue-600">
                        ${recipe.chemicalsCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Desechables:</span>
                      <span className="font-semibold text-orange-600">
                        ${recipe.disposablesCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-purple-300">
                      <span className="font-bold text-gray-800">TOTAL:</span>
                      <span className="font-bold text-green-600 text-lg">
                        ${recipe.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {materialRecipes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay recetas configuradas. Las recetas se agregarán
                automáticamente.
              </div>
            )}
          </div>

          {/* Nota informativa */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Información:</strong> Los costos de materiales se
              calculan automáticamente cuando se registra un servicio y se suman
              al campo de reposición. Los productos químicos y recetas se
              inicializarán automáticamente en Firebase.
            </p>
          </div>
        </div>
        )}

      {/* ==================== PESTAÑA DE CLIENTES ==================== */}
      {activeTab === "clients" && (
        <div className="animate-in fade-in duration-300">
           {/* Header & Search Combined */}
           <div className="flex justify-between items-center mb-6 mt-0">
              <h2 className="text-xl font-bold text-gray-800 m-0">Directorio de Clientes</h2>
              
              {/* Buscador Integrado */}
               <div className="relative w-full md:w-64">
                <input
                  type="text"
                  placeholder="Buscar cliente..."
                  value={clientsSearch}
                  onChange={(e) => {
                    setClientsSearch(e.target.value);
                    setClientsPage(1);
                   }}
                  className="w-full pl-9 pr-4 py-1.5 bg-white border border-gray-200 rounded-lg text-sm transition-all duration-200 focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 focus:outline-none shadow-sm"
                />
                 <div className="absolute left-3 top-2 text-gray-400">
                    <Users size={16} />
                 </div>
              </div>
           </div>

           {/* Tabla de Clientes */}
           <div className="overflow-hidden">
             {filteredClients.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full">
                    <thead className="bg-gray-50/50 border-b border-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Última Visita</th>
                        <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">Servicios</th>
                         <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Gasto Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                       {paginatedClients.map((client) => (
                         <tr key={client.id} className="hover:bg-indigo-50/30 transition-colors group">
                           <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                 <div className="w-10 h-10 rounded-full bg-indigo-100/50 flex items-center justify-center text-indigo-600 font-bold text-sm group-hover:bg-indigo-200/50 transition-colors">
                                    {client.name.substring(0, 2).toUpperCase()}
                                 </div>
                                 <div className="font-semibold text-gray-800">{client.name}</div>
                              </div>
                           </td>
                           <td className="px-6 py-4 text-sm text-gray-500">
                              {client.lastVisit}
                           </td>
                           <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                {client.totalServices} visitas
                              </span>
                           </td>
                           <td className="px-6 py-4 text-right">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                client.totalSpent > 500 
                                  ? "bg-purple-100 text-purple-700" 
                                  : "bg-green-100 text-green-700"
                              }`}>
                                ${client.totalSpent.toFixed(2)}
                              </span>
                           </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
             ) : (
                <div className="p-12 text-center">
                   <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Users size={32} />
                   </div>
                   <h3 className="text-lg font-medium text-gray-900 mb-1">
                     {clientsSearch ? "No se encontraron resultados" : "Aún no hay clientes registrados"}
                   </h3>
                   <p className="text-gray-500 max-w-sm mx-auto">
                      {clientsSearch 
                        ? "Intenta con otro término de búsqueda." 
                        : "Aparecerán aquí automáticamente al realizar ventas."}
                   </p>
                </div>
             )}
             
             {/* Pagination */}
              {filteredClients.length > 7 && (
                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    Mostrando {((clientsPage - 1) * 7) + 1} - {Math.min(clientsPage * 7, filteredClients.length)} de {filteredClients.length}
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setClientsPage(p => Math.max(1, p - 1))}
                      disabled={clientsPage === 1}
                      className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-all font-medium"
                    >
                      <ChevronLeft size={20} />
                    </button>
                    <button
                      onClick={() => setClientsPage(p => Math.min(Math.ceil(filteredClients.length / 7), p + 1))}
                       disabled={clientsPage >= Math.ceil(filteredClients.length / 7)}
                      className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-all font-medium"
                    >
                      <ChevronRight size={20} />
                    </button>
                  </div>
                </div>
              )}
           </div>
        </div>
      )}
      </div>
    </div>
      {/* Slide-over para Edición de Producto Químico */}
      {editingProduct && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingProduct(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Editar Producto</h3>
                <p className="text-sm text-gray-500">Gestión de inventario y costos</p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Package size={18} className="text-purple-600" />
                   Información del Producto
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Producto</label>
                  <input
                    type="text"
                    value={editChemicalForm.name || ""}
                    onChange={(e) => setEditChemicalForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Cantidad</label>
                      <input
                        type="number"
                        value={editChemicalForm.quantity ?? ""}
                        onChange={(e) => setEditChemicalForm(prev => ({ ...prev, quantity: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Unidad</label>
                      <select
                        value={editChemicalForm.unit || "ml"}
                        onChange={(e) => setEditChemicalForm(prev => ({ ...prev, unit: e.target.value as any }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      >
                         <option value="ml">ml</option>
                         <option value="L">Litros</option>
                         <option value="g">Gramos</option>
                         <option value="kg">Kilos</option>
                         <option value="unid">Unidades</option>
                      </select>
                   </div>
                </div>
              </div>

              {/* Costos y Rendimiento */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <ShoppingCart size={18} className="text-green-600" />
                   Costos y Rendimiento
                </h4>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Precio de Compra</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editChemicalForm.purchasePrice ?? ""}
                          onChange={(e) => setEditChemicalForm(prev => ({ ...prev, purchasePrice: parseFloat(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Rendimiento (Servicios)</label>
                      <input
                        type="number"
                        value={editChemicalForm.yield ?? ""}
                        onChange={(e) => setEditChemicalForm(prev => ({ ...prev, yield: parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                    </div>
                </div>
              </div>

              {/* Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-orange-500" />
                   Gestión de Inventario
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Stock Actual</label>
                       <input
                         type="number"
                         value={editChemicalForm.stock ?? ""}
                         onChange={(e) => setEditChemicalForm(prev => ({ ...prev, stock: parseFloat(e.target.value) }))}
                         className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all bg-white font-bold text-gray-800"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-600">Stock Mínimo (Alerta)</label>
                       <input
                         type="number"
                         value={editChemicalForm.minStock ?? ""}
                         onChange={(e) => setEditChemicalForm(prev => ({ ...prev, minStock: parseFloat(e.target.value) }))}
                         className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all bg-white"
                       />
                    </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingProduct && editChemicalForm) {
                    handleUpdateChemicalProduct(editingProduct.id, editChemicalForm);
                    setEditingProduct(null);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Slide-over para Edición de Consumibles */}
      {editingConsumableItem && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingConsumableItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-blue-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Editar Consumible</h3>
                <p className="text-sm text-gray-500">Gestión de insumos y costos</p>
              </div>
              <button 
                onClick={() => setEditingConsumableItem(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Package size={18} className="text-blue-600" />
                   Información del Consumible
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Consumible</label>
                  <input
                    type="text"
                    value={editConsumableForm.name || ""}
                    onChange={(e) => setEditConsumableForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-600">Unidad de Medida</label>
                   <input
                     type="text"
                     placeholder="ej. Caja, Paquete, Unidad"
                     value={editConsumableForm.unit || ""}
                     onChange={(e) => setEditConsumableForm(prev => ({ ...prev, unit: e.target.value }))}
                      className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                   />
                </div>
              </div>

              {/* Costos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <DollarSign size={18} className="text-green-600" />
                   Costo Unitario
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Costo por {editConsumableForm.unit || "unidad"}</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      value={editConsumableForm.unitCost ?? ""}
                      onChange={(e) => setEditConsumableForm(prev => ({ ...prev, unitCost: parseFloat(e.target.value) }))}
                      className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-semibold"
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                     Este valor se usa para calcular el costo de materiales de los servicios.
                  </p>
                </div>
              </div>

              {/* Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-orange-500" />
                   Inventario y Alertas
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Stock Actual</label>
                       <input
                         type="number"
                         value={editConsumableForm.stockQty ?? ""}
                         onChange={(e) => setEditConsumableForm(prev => ({ ...prev, stockQty: parseFloat(e.target.value) }))}
                         className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all bg-white font-bold text-gray-800"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-600">Alerta (Mínimo)</label>
                       <input
                         type="number"
                         value={editConsumableForm.minStockAlert ?? ""}
                         onChange={(e) => setEditConsumableForm(prev => ({ ...prev, minStockAlert: parseFloat(e.target.value) }))}
                         className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all bg-white"
                       />
                    </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditingConsumableItem(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingConsumableItem && editConsumableForm) {
                    handleUpdateConsumable(editingConsumableItem.id, editConsumableForm);
                    setEditingConsumableItem(null);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Actualizar Consumible
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Slide-over para Edición de Extras */}
      {editingExtraItem && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingExtraItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-orange-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Editar Extra</h3>
                <p className="text-sm text-gray-500">Configuración de servicios adicionales</p>
              </div>
              <button 
                onClick={() => setEditingExtraItem(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Sparkles size={18} className="text-orange-600" />
                   Detalles del Extra
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Extra</label>
                  <input
                    type="text"
                    value={editExtraForm.name || ""}
                    onChange={(e) => setEditExtraForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                   <label className="text-sm font-medium text-gray-600">Precio Sugerido (por Uña/Unidad)</label>
                   <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                      <input
                        type="number"
                        step="0.01"
                        value={editExtraForm.priceSuggested ?? ""}
                        onChange={(e) => setEditExtraForm(prev => ({ ...prev, priceSuggested: parseFloat(e.target.value) }))}
                        className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 outline-none font-bold"
                       />
                   </div>
                   <p className="text-xs text-slate-400">
                      Este precio se usará como base para el cálculo total (Precio * Cantidad).
                   </p>
                </div>
                
                 {/* Estado Activo */}
                 <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                    <div>
                       <span className="block font-semibold text-gray-700">Estado del Servicio</span>
                       <span className="text-xs text-gray-500">Visible en el catálogo de ventas</span>
                    </div>
                    <button
                      onClick={() => setEditExtraForm(prev => ({ ...prev, active: !prev.active }))}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        editExtraForm.active ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          editExtraForm.active ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                 </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditingExtraItem(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingExtraItem && editExtraForm) {
                    handleUpdateExtra(editingExtraItem.id, editExtraForm);
                    setEditingExtraItem(null);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-orange-600 text-white font-bold shadow-lg shadow-orange-200 hover:bg-orange-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Actualizar Extra
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

export default OwnerConfigTab;

