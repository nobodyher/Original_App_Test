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
  Star,
  Percent,
  UserPlus,
  Phone,
  Mail,
  Calendar,
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
  Service,
} from "../../../types";
import { deleteClient } from "../../../services/salonService";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import { StaffDetailView } from "./StaffDetailView";

export type ConfigTab =
  | "services"
  | "consumables"
  | "personal"
  | "extras"
  | "materials"
  | "clients";

interface OwnerConfigTabProps {
  users: AppUser[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  materialRecipes: MaterialRecipe[];
  serviceRecipes: ServiceRecipe[];
  consumables: Consumable[];
  chemicalProducts: ChemicalProduct[];
  clients: Client[];
  currentUser: AppUser | null;
  transactions?: Service[]; // Optional for backward compatibility or make required if always available
  showNotification: (message: string, type?: Toast["type"]) => void;

  // Optional controlled props
  initialTab?: ConfigTab;
  hideNavigation?: boolean;

  // User Actions
  createNewUser: (data: Omit<AppUser, "id">) => Promise<void>;
  updateUser: (userId: string, data: Partial<AppUser>) => Promise<void>;
  updateUserCommission: (
    userId: string,
    newCommission: number,
  ) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUserPermanently: (userId: string) => Promise<void>;

  // Inventory/Catalog Actions
  addCatalogService: (
    name: string,
    category: "manicura" | "pedicura",
    price: number,
  ) => Promise<string>;
  updateCatalogService: (
    id: string,
    data: Partial<CatalogService>,
  ) => Promise<void>;
  deleteCatalogService: (id: string) => Promise<void>;

  addExtra: (name: string, price: number) => Promise<void>;
  updateExtra: (id: string, data: Partial<CatalogExtra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;

  addConsumable: (data: Omit<Consumable, "id" | "active">) => Promise<void>;
  updateConsumable: (id: string, data: Partial<Consumable>) => Promise<void>;
  deleteConsumable: (id: string) => Promise<void>;

  addChemicalProduct: (
    data: Omit<ChemicalProduct, "id" | "active">,
  ) => Promise<void>;
  updateChemicalProduct: (
    id: string,
    updates: Partial<ChemicalProduct>,
    currentProduct?: ChemicalProduct,
  ) => Promise<void>;
  deleteChemicalProduct: (id: string) => Promise<void>;

  initializeMaterialsData: () => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
}

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

const OwnerConfigTab: React.FC<OwnerConfigTabProps> = ({
  users,
  catalogServices,
  catalogExtras,
  materialRecipes,
  serviceRecipes,
  consumables,
  chemicalProducts,
  clients,
  currentUser,
  transactions = [],
  showNotification,
  initialTab,
  hideNavigation = false,
  createNewUser,
  updateUser,
  // deactivateUser: // Removed as we use updateUser for toggling status
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
}) => {
  const [activeTab, setActiveTab] = useState<ConfigTab>(
    initialTab || "services",
  );

  // Sync internal state with prop changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const tabs = [
    {
      id: "services",
      label: "Catálogo",
      icon: ShoppingCart,
      color: "text-primary-600",
    },
    {
      id: "consumables",
      label: "Consumibles",
      icon: Package,
      color: "text-primary-600",
    },
    {
      id: "personal",
      label: "Personal",
      icon: Users,
      color: "text-primary-600",
    },
    {
      id: "clients",
      label: "Clientes",
      icon: Users,
      color: "text-primary-600",
    },
    { id: "extras", label: "Extras", icon: Plus, color: "text-primary-400" },
    {
      id: "materials",
      label: "Químicos",
      icon: Beaker,
      color: "text-primary-600",
    }, // Using Beaker imported or ensuring it is imported
  ];

  const [newConsumable, setNewConsumable] = useState({
    name: "",
    unit: "",
    purchasePrice: "",
    packageSize: "",
    stockQty: "",
    minStockAlert: "",
  });

  const [newChemicalProduct, setNewChemicalProduct] = useState({
    name: "",
    quantity: "",
    unit: "ml",
    purchasePrice: "",
    stock: "",
    minStock: "",
  });

  const [newUser, setNewUser] = useState({
    name: "",
    pin: "",
    commissionPct: "",
    phone: "",
    email: "",
    birthDate: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [deletedClientIds, setDeletedClientIds] = useState<Set<string>>(
    new Set(),
  );

  // Unified Delete/Action State
  type DeleteItem = {
    type:
      | "service"
      | "staff"
      | "chemical"
      | "consumable"
      | "extra"
      | "client"
      | "toggle_staff";
    id: string;
    action?: "activar" | "desactivar";
    name?: string;
  } | null;

  const [itemToDelete, setItemToDelete] = useState<DeleteItem>(null);

  const [editingStaffItem, setEditingStaffItem] = useState<AppUser | null>(
    null,
  );
  const [editStaffForm, setEditStaffForm] = useState<Partial<AppUser>>({});
  const [selectedStaff, setSelectedStaff] = useState<AppUser | null>(null);

  // Extras Adding State
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");

  const [editingCatalogService, setEditingCatalogService] = useState<
    string | null
  >(null);

  // RESET SEARCH when opening existing service

  // Service Editing State (Slide-over)
  const [editingServiceItem, setEditingServiceItem] =
    useState<CatalogService | null>(null);
  const [editServiceForm, setEditServiceForm] = useState<
    Partial<CatalogService>
  >({});
  const [selectedMaterials, setSelectedMaterials] = useState<
    { materialId: string; qty: number }[]
  >([]);
  const [selectedConsumables, setSelectedConsumables] = useState<
    { consumableId: string; qty: number }[]
  >([]);

  // Search States for Service Editor
  const [materialSearch, setMaterialSearch] = useState("");
  const [consumableSearch, setConsumableSearch] = useState("");

  // Service Form Tabs
  const [serviceFormTab, setServiceFormTab] = useState<
    "info" | "chemicals" | "consumables"
  >("info");

  // Reset tab when opening a service
  React.useEffect(() => {
    if (editingServiceItem) {
      setServiceFormTab("info");
    }
  }, [editingServiceItem]);

  // Extras Editing State (Slide-over)
  const [editingExtraItem, setEditingExtraItem] = useState<CatalogExtra | null>(
    null,
  );
  const [editExtraForm, setEditExtraForm] = useState<Partial<CatalogExtra>>({});
  // Consumables Editing State (Slide-over)
  const [editingConsumableItem, setEditingConsumableItem] =
    useState<Consumable | null>(null);
  const [addingConsumableItem, setAddingConsumableItem] = useState(false);

  // Clients State
  const [clientsPage, setClientsPage] = useState(1);
  const [clientsSearch, setClientsSearch] = useState("");

  const filteredClients = useMemo(() => {
    return clients
      .filter((c) => !deletedClientIds.has(c.id))
      .filter((c) =>
        c.name.toLowerCase().includes(clientsSearch.toLowerCase()),
      );
  }, [clients, clientsSearch, deletedClientIds]);

  const paginatedClients = useMemo(() => {
    const start = (clientsPage - 1) * 7;
    return filteredClients.slice(start, start + 7);
  }, [filteredClients, clientsPage]);

  const [editConsumableForm, setEditConsumableForm] = useState<
    Partial<Consumable>
  >({});

  // Chemical Product Editing State (Slide-over)
  const [editingProduct, setEditingProduct] = useState<ChemicalProduct | null>(
    null,
  );
  const [addingChemicalProduct, setAddingChemicalProduct] = useState(false);
  const [editChemicalForm, setEditChemicalForm] = useState<
    Partial<ChemicalProduct>
  >({});

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
    return catalogServices.slice(
      (servicesPage - 1) * ITEMS_PER_PAGE,
      servicesPage * ITEMS_PER_PAGE,
    );
  }, [catalogServices, servicesPage]);

  const paginatedConsumables = useMemo(() => {
    return consumables.slice(
      (consumablesPage - 1) * ITEMS_PER_PAGE,
      consumablesPage * ITEMS_PER_PAGE,
    );
  }, [consumables, consumablesPage]);

  const paginatedExtras = useMemo(() => {
    return catalogExtras.slice(
      (extrasPage - 1) * ITEMS_PER_PAGE,
      extrasPage * ITEMS_PER_PAGE,
    );
  }, [catalogExtras, extrasPage]);

  const paginatedChemicals = useMemo(() => {
    const start = (chemicalsPage - 1) * CHEMICALS_PER_PAGE;
    return chemicalProducts.slice(start, start + CHEMICALS_PER_PAGE);
  }, [chemicalProducts, chemicalsPage]);

  // Dynamic Cost Calculation for Service Editing
  const totalEstimatedMaterialCost = useMemo(() => {
    // 1. Chemicals Cost
    // 1. Chemicals Cost
    const chemicalsCost = selectedMaterials.reduce((total, item) => {
      const chem = chemicalProducts.find((c) => c.id === item.materialId);
      if (!chem) return total;

      // Formula: (Price / PackageQty) * UsageQty
      const unitCost = (chem.purchasePrice || 0) / (chem.quantity || 1);
      return total + unitCost * item.qty;
    }, 0);

    // 2. Consumables Cost
    const consumablesCost = selectedConsumables.reduce((total, item) => {
      const cons = consumables.find((c) => c.id === item.consumableId);
      if (!cons) return total;

      const unitCost =
        cons.purchasePrice && cons.packageSize
          ? cons.purchasePrice / cons.packageSize
          : cons.unitCost || 0;

      return total + unitCost * item.qty;
    }, 0);

    return {
      chemicals: chemicalsCost,
      consumables: consumablesCost,
      total: chemicalsCost + consumablesCost,
    };
  }, [selectedMaterials, selectedConsumables, chemicalProducts, consumables]);

  // Wrappers
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

  const handleUpdateUser = async (
    userId: string,
    updates: Partial<AppUser>,
  ) => {
    try {
      await updateUser(userId, updates);
      setEditingStaffItem(null);
      showNotification("Perfil de usuario actualizado");
    } catch (error) {
      console.error("Error actualizando usuario:", error);
      const message =
        error instanceof Error ? error.message : "Error al actualizar";
      showNotification(message, "error");
    }
  };

  const handleUpdateStaff = async (updatedData: Partial<AppUser>) => {
    if (!selectedStaff) return;

    try {
      await updateUser(selectedStaff.id, updatedData);

      // 2. Update Local State
      setSelectedStaff((prev) => (prev ? { ...prev, ...updatedData } : null));

      // 3. Notification
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

  const handleSaveUnifiedService = async () => {
    if (!editingServiceItem) return;

    try {
      if (editingServiceItem.id === "new") {
        // CREACIÓN
        const newId = await addCatalogService(
          editServiceForm.name || "",
          editServiceForm.category || "manicura",
          editServiceForm.basePrice ? Number(editServiceForm.basePrice) : 0,
        );

        // Guardar materiales inmediatamente
        if (selectedMaterials.length > 0 || selectedConsumables.length > 0) {
          await updateCatalogService(newId, {
            manualMaterials: selectedMaterials,
            manualConsumables: selectedConsumables,
          });
        }

        showNotification("Servicio creado exitosamente");
      } else {
        // EDICIÓN
        await updateCatalogService(editingServiceItem.id, {
          ...editServiceForm,
          manualMaterials: selectedMaterials,
          manualConsumables: selectedConsumables,
        });
        showNotification("Servicio actualizado exitosamente");
      }
      setEditingServiceItem(null);
    } catch (error) {
      console.error("Error guardando servicio:", error);
      const message =
        error instanceof Error ? error.message : "Error al guardar";
      showNotification(message, "error");
    }
  };

  const handleUpdateCatalogService = async (
    id: string,
    updated: Partial<CatalogService>,
  ) => {
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

  const handleDeleteCatalogService = (id: string) => {
    setItemToDelete({ type: "service", id });
  };

  const handleToggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) => {
      const exists = prev.some((m) => m.materialId === materialId);
      if (exists) {
        return prev.filter((m) => m.materialId !== materialId);
      } else {
        return [...prev, { materialId, qty: 0 }]; // Default 0 to force user input
      }
    });
  };

  const handleMaterialQtyChange = (materialId: string, qty: number) => {
    setSelectedMaterials((prev) =>
      prev.map((m) =>
        m.materialId === materialId ? { ...m, qty: Math.max(0, qty) } : m,
      ),
    );
  };

  const handleToggleConsumable = (consumableId: string) => {
    setSelectedConsumables((prev) => {
      const exists = prev.some((c) => c.consumableId === consumableId);
      if (exists) {
        return prev.filter((c) => c.consumableId !== consumableId);
      } else {
        return [...prev, { consumableId, qty: 1 }];
      }
    });
  };

  const handleConsumableQtyChange = (consumableId: string, qty: number) => {
    setSelectedConsumables((prev) =>
      prev.map((c) =>
        c.consumableId === consumableId ? { ...c, qty: Math.max(1, qty) } : c,
      ),
    );
  };

  const handleAddExtra = async () => {
    setIsSubmitting(true);
    try {
      await addExtra(newExtraName, parseFloat(newExtraPrice) || 0);
      setNewExtraName("");
      setNewExtraPrice("");
      showNotification("Extra agregado");
    } catch (error) {
      console.error("Error agregando extra:", error);
      const message =
        error instanceof Error ? error.message : "Error al agregar";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateExtra = async (
    id: string,
    updates: Partial<CatalogExtra>,
  ) => {
    try {
      await updateExtra(id, updates);
      setEditingExtraItem(null);
      showNotification("Extra actualizado");
    } catch (error) {
      console.error("Error actualizando extra:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteExtra = (id: string) => {
    setItemToDelete({ type: "extra", id });
  };

  const handleDeleteClient = (id: string) => {
    if (!currentUser || currentUser.role !== "owner") return;
    setItemToDelete({ type: "client", id });
  };

  const handleAddConsumable = async () => {
    setIsSubmitting(true);
    try {
      await addConsumable({
        name: newConsumable.name,
        unit: newConsumable.unit,
        purchasePrice: parseFloat(newConsumable.purchasePrice) || 0,
        packageSize: parseFloat(newConsumable.packageSize) || 0,
        stockQty: parseFloat(newConsumable.stockQty) || 0,
        minStockAlert: parseFloat(newConsumable.minStockAlert) || 0,
      });

      setNewConsumable({
        name: "",
        unit: "",
        purchasePrice: "",
        packageSize: "",
        stockQty: "",
        minStockAlert: "",
      });
      showNotification("Consumible agregado");
    } catch (error) {
      console.error("Error agregando consumible:", error);
      const message =
        error instanceof Error ? error.message : "Error al agregar";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateConsumable = async (
    id: string,
    updated: Partial<Consumable>,
  ) => {
    try {
      await updateConsumable(id, updated);
      setEditingConsumableItem(null);
      showNotification("Consumible actualizado");
    } catch (error) {
      console.error("Error actualizando consumible:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteConsumable = (id: string) => {
    setItemToDelete({ type: "consumable", id });
  };

  const handleAddChemicalProduct = async () => {
    setIsSubmitting(true);
    try {
      const quantity = parseFloat(newChemicalProduct.quantity) || 0;
      const purchasePrice = parseFloat(newChemicalProduct.purchasePrice) || 0;

      // Costo por unidad (ml/g) = Precio / Cantidad
      const costPerUnit = quantity > 0 ? purchasePrice / quantity : 0;

      await addChemicalProduct({
        name: newChemicalProduct.name,
        quantity: quantity,
        unit: newChemicalProduct.unit as "ml" | "g" | "unid",
        purchasePrice: purchasePrice,
        yield: quantity, // Yield is now just the total content
        costPerService: costPerUnit, // Now storing Cost Per Unit
        stock: parseFloat(newChemicalProduct.stock || "0") || 0,
        minStock: parseFloat(newChemicalProduct.minStock || "0") || 0,
        yieldPerUnit: 0, // Deprecated
        currentYieldRemaining: 0, // Deprecated
      });

      setNewChemicalProduct({
        name: "",
        quantity: "",
        unit: "ml",
        purchasePrice: "",
        stock: "",
        minStock: "",
      });
      showNotification("Producto guardado");
    } catch (error) {
      console.error("Error agregando producto:", error);
      const message =
        error instanceof Error ? error.message : "Error al agregar";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateChemicalProduct = async (
    id: string,
    updates: Partial<ChemicalProduct>,
  ) => {
    try {
      const currentProduct = chemicalProducts.find((p) => p.id === id);
      if (currentProduct) {
        const newPrice =
          updates.purchasePrice !== undefined
            ? updates.purchasePrice
            : currentProduct.purchasePrice;
        const newQuantity =
          updates.quantity !== undefined
            ? updates.quantity
            : currentProduct.quantity;

        // Sync yield with quantity if quantity is updated
        if (updates.quantity !== undefined) {
          updates.yield = updates.quantity;
        }

        // Recalculate costPerUnit if price or quantity changes
        if (
          updates.purchasePrice !== undefined ||
          updates.quantity !== undefined
        ) {
          updates.costPerService = newQuantity > 0 ? newPrice / newQuantity : 0;
        }
      }

      await updateChemicalProduct(
        id,
        updates,
        chemicalProducts.find((p) => p.id === id),
      );
      showNotification("Producto actualizado");
    } catch (error) {
      console.error("Error actualizando producto:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteChemicalProduct = (id: string) => {
    setItemToDelete({ type: "chemical", id });
  };

  const handleConfirmAction = async () => {
    if (!itemToDelete) return;

    setIsSubmitting(true);
    try {
      switch (itemToDelete.type) {
        case "service":
          await deleteCatalogService(itemToDelete.id);
          showNotification("Servicio eliminado");
          break;
        case "staff":
          await deleteUserPermanently(itemToDelete.id);
          showNotification("Usuario eliminado permanentemente");
          break;
        case "chemical":
          await deleteChemicalProduct(itemToDelete.id);
          showNotification("Producto eliminado");
          break;
        case "consumable":
          await deleteConsumable(itemToDelete.id);
          showNotification("Consumible eliminado");
          break;
        case "extra":
          await deleteExtra(itemToDelete.id);
          showNotification("Extra eliminado");
          break;
        case "client":
          await deleteClient(itemToDelete.id);
          setDeletedClientIds((prev) => new Set(prev).add(itemToDelete.id));
          showNotification("Cliente eliminado");
          break;
        case "toggle_staff":
          await updateUser(itemToDelete.id, {
            active: itemToDelete.action === "activar",
          });
          showNotification(
            `Usuario ${itemToDelete.action === "activar" ? "activado" : "desactivado"} exitosamente`,
          );
          break;
      }
      setItemToDelete(null);
    } catch (error) {
      console.error("Error en acción de confirmación:", error);
      const message =
        error instanceof Error ? error.message : "Error al procesar la acción";
      showNotification(message, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfirmationModalProps = () => {
    if (!itemToDelete) return { title: "", message: "" };

    switch (itemToDelete.type) {
      case "service":
        return {
          title: "Eliminar Servicio",
          message:
            "¿Estás seguro de que deseas eliminar este servicio del catálogo?",
        };
      case "staff":
        return {
          title: "Eliminar Usuario",
          message:
            "¿Eliminar permanentemente a este usuario? Esta acción no es reversible.",
        };
      case "chemical":
        return {
          title: "Eliminar Producto",
          message:
            "¿Estás seguro de eliminar este producto químico del inventario?",
        };
      case "consumable":
        return {
          title: "Eliminar Consumible",
          message:
            "¿Eliminar este consumible? Se perderá el registro de stock.",
        };
      case "extra":
        return {
          title: "Eliminar Extra",
          message: "¿Estás seguro de eliminar este servicio extra?",
        };
      case "client":
        return {
          title: "Eliminar Cliente",
          message:
            "¿Estás seguro de que deseas eliminar a este cliente? Se perderá su historial.",
        };
      case "toggle_staff":
        return {
          title: `${itemToDelete.action === "activar" ? "Activar" : "Desactivar"} Usuario`,
          message: `¿Deseas ${itemToDelete.action} el acceso al sistema para ${itemToDelete.name}?`,
        };
      default:
        return {
          title: "Confirmar Acción",
          message: "¿Estás seguro de realizar esta acción?",
        };
    }
  };

  const lowStockConsumables = consumables.filter(
    (c) => c.active && c.stockQty <= c.minStockAlert,
  );

  return (
    <div className="space-y-6">
      {lowStockConsumables.length > 0 && (
        <div className="bg-linear-to-r from-orange-900/10 to-red-900/10 border border-orange-500/30 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-orange-600" size={32} />
            <div>
              <h3 className="text-xl font-bold text-text-main">
                ⚠️ Alertas de Stock Bajo
              </h3>
              <p className="text-sm text-text-muted">
                {lowStockConsumables.length} consumible(s) necesitan reposición
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockConsumables.map((c) => (
              <div
                key={c.id}
                className="bg-surface-highlight rounded-lg p-4 border border-orange-500/20"
              >
                <p className="font-bold text-text-main">{c.name}</p>
                <p className="text-sm text-text-muted">
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
        {/* Sidebar Navigation - Conditionally Rendered */}
        {!hideNavigation && (
          <nav className="lg:w-64 shrink-0 space-y-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ConfigTab)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out hover:pl-5 font-medium text-left relative overflow-hidden group ${
                    isActive
                      ? "bg-surface-highlight text-primary-500 border border-border"
                      : "text-text-main hover:bg-surface-highlight hover:text-primary-600"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-600" />
                  )}
                  <Icon size={20} strokeWidth={isActive ? 2 : 1.5} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Content Area */}
        <div
          className={`flex-1 bg-surface rounded-2xl shadow-none border border-border min-h-[600px] relative ${activeTab === "clients" ? "p-5" : "p-8"}`}
        >
          {/* Services Tab */}
          {activeTab === "services" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
                  <ShoppingCart className="text-primary-600" />
                  Catálogo de Servicios
                </h3>
                <button
                  onClick={() => {
                    setEditingServiceItem({
                      id: "new",
                      name: "",
                      category: "manicura",
                      basePrice: 0,
                      active: true,
                      createdAt: new Date().toISOString(),
                    } as unknown as CatalogService);
                    setEditServiceForm({ category: "manicura" });
                    setSelectedMaterials([]);
                    setSelectedConsumables([]);
                    setMaterialSearch("");
                    setConsumableSearch("");
                  }}
                  className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95"
                >
                  <Plus size={18} />
                  Nuevo Servicio
                </button>
              </div>

              <>
                <div className="bg-surface rounded-xl shadow-none border border-border">
                  <table className="w-full">
                    <thead className="bg-surface-highlight border-b border-border">
                      <tr>
                        <th className="w-10 px-4 py-3"></th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">
                          Nombre
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                          Categoría
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                          Precio Base
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                          Costo Material
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-text-muted uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
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

                          // Calcular costo total de materiales y consumibles
                          const materialsCost = (
                            cs.manualMaterials || []
                          ).reduce((sum, m) => {
                            const id = typeof m === "string" ? m : m.materialId;
                            const qty = typeof m === "string" ? 1 : m.qty;
                            const p = chemicalProducts.find(
                              (cp) => cp.id === id,
                            );
                            return sum + (p?.costPerService || 0) * qty;
                          }, 0);

                          const consumablesCost = (
                            cs.manualConsumables || []
                          ).reduce((sum, c) => {
                            const item = consumables.find(
                              (i) => i.id === c.consumableId,
                            );
                            if (!item) return sum;
                            const uCost =
                              item.purchasePrice && item.packageSize
                                ? item.purchasePrice / item.packageSize
                                : item.unitCost || 0;
                            return sum + uCost * c.qty;
                          }, 0);

                          const totalMaterialCost =
                            materialsCost + consumablesCost;

                          return (
                            <tr
                              key={cs.id}
                              className={`group transition-colors duration-200 hover:bg-surface-highlight ${
                                !cs.active
                                  ? "opacity-60 bg-surface-highlight"
                                  : ""
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
                                      className="w-full px-4 py-2 bg-surface-highlight border border-border rounded-xl text-sm font-medium text-text-main transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <select
                                      defaultValue={cs.category}
                                      id={`edit-service-category-${cs.id}`}
                                      className="w-full px-4 py-2 bg-surface-highlight border border-border rounded-xl text-sm text-text-main transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none appearance-none"
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
                                      className="w-32 px-4 py-2 bg-surface-highlight border border-border rounded-xl text-sm font-bold text-text-main transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                    />
                                  </td>
                                  <td className="px-6 py-4">
                                    <span className="text-gray-400">-</span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                        cs.active
                                          ? "bg-primary-600/10 text-primary-600"
                                          : "bg-primary-700/10 text-primary-700"
                                      }`}
                                    >
                                      {cs.active ? "Activo" : "Inactivo"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 flex items-center gap-2">
                                    <button
                                      onClick={() => {
                                        const name = (
                                          document.getElementById(
                                            `edit-service-name-${cs.id}`,
                                          ) as HTMLInputElement
                                        ).value;
                                        const category = (
                                          document.getElementById(
                                            `edit-service-category-${cs.id}`,
                                          ) as HTMLSelectElement
                                        ).value as "manicura" | "pedicura";
                                        const basePrice = parseFloat(
                                          (
                                            document.getElementById(
                                              `edit-service-price-${cs.id}`,
                                            ) as HTMLInputElement
                                          ).value,
                                        );

                                        handleUpdateCatalogService(cs.id, {
                                          name,
                                          category,
                                          basePrice,
                                        });
                                      }}
                                      className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors shadow-sm"
                                      title="Guardar"
                                    >
                                      <Save size={18} strokeWidth={2.5} />
                                    </button>
                                    <button
                                      onClick={() =>
                                        setEditingCatalogService(null)
                                      }
                                      className="p-2 rounded-xl bg-surface-highlight text-gray-400 hover:bg-surface-highlight/80 transition-colors"
                                      title="Cancelar"
                                    >
                                      <X size={18} strokeWidth={2.5} />
                                    </button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td className="px-6 py-4 text-sm font-medium text-text-main">
                                    <div className="flex items-center gap-2">
                                      {cs.name}
                                      {(cs.manualMaterials?.length ?? 0) > 0 ||
                                      (cs.manualConsumables?.length ?? 0) >
                                        0 ? (
                                        <div
                                          title="Configurado"
                                          className="text-emerald-500 bg-emerald-500/10 p-1 rounded-full"
                                        >
                                          <Beaker size={14} />
                                        </div>
                                      ) : (
                                        <div
                                          title="Sin receta"
                                          className="text-orange-400 bg-orange-500/10 p-1 rounded-full"
                                        >
                                          <AlertTriangle size={14} />
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 text-sm text-text-muted capitalize tracking-wide">
                                    {cs.category}
                                  </td>
                                  <td className="px-6 py-4 text-sm font-bold text-text-main font-mono">
                                    ${cs.basePrice.toFixed(2)}
                                  </td>
                                  <td className="px-6 py-4">
                                    {totalMaterialCost > 0 ? (
                                      <div
                                        className="flex flex-col"
                                        title={`Químicos: $${materialsCost.toFixed(2)} | Desechables: $${consumablesCost.toFixed(2)}`}
                                      >
                                        <span className="text-sm font-bold text-text-muted">
                                          ${totalMaterialCost.toFixed(2)}
                                        </span>
                                      </div>
                                    ) : (
                                      <span className="text-gray-400">-</span>
                                    )}
                                  </td>
                                  <td className="px-6 py-4">
                                    <span
                                      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] uppercase tracking-wider font-bold shadow-sm ${
                                        cs.active
                                          ? "bg-primary-600/10 text-primary-600 ring-1 ring-primary-600/20"
                                          : "bg-primary-700/10 text-primary-700 ring-1 ring-primary-700/20"
                                      }`}
                                    >
                                      {cs.active ? "Activo" : "Inactivo"}
                                    </span>
                                  </td>
                                  <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => {
                                          setEditingServiceItem(cs);
                                          setEditServiceForm(cs);
                                          setMaterialSearch("");
                                          setConsumableSearch("");

                                          // Tarea 1: Prioridad de Guardado (Admin) - MATERIALES
                                          // SI manualMaterials existe (incluso si está vacío), NO buscar en recetas antiguas

                                          if (
                                            cs.manualMaterials &&
                                            cs.manualMaterials.length > 0
                                          ) {
                                            // PRIORIDAD ALTA: Usar selección manual
                                            console.log(
                                              `⚠️ Usando selección manual (Prioridad Alta) para ${cs.name}`,
                                            );

                                            // Handle legacy string[] vs new objects
                                            const firstItem =
                                              cs.manualMaterials[0];
                                            if (typeof firstItem === "string") {
                                              setSelectedMaterials(
                                                (
                                                  cs.manualMaterials as unknown as string[]
                                                ).map((id) => ({
                                                  materialId: id,
                                                  qty: 1,
                                                })),
                                              );
                                            } else {
                                              setSelectedMaterials(
                                                cs.manualMaterials as {
                                                  materialId: string;
                                                  qty: number;
                                                }[],
                                              );
                                            }
                                          } else {
                                            // FALLBACK: Solo si NO existe manualMaterials, buscar en recetas antiguas
                                            console.log(
                                              `🔍 Cargando desde recetas antiguas para ${cs.name}`,
                                            );

                                            const legacyRecipe =
                                              materialRecipes.find(
                                                (r) =>
                                                  r.serviceId === cs.id ||
                                                  r.serviceName.toLowerCase() ===
                                                    cs.name.toLowerCase(),
                                              );

                                            const legacyMaterialIds: string[] =
                                              [];

                                            if (legacyRecipe) {
                                              for (const chemicalIdOrName of legacyRecipe.chemicalIds) {
                                                // Primero intentar encontrar por ID exacto
                                                let matchedProduct =
                                                  chemicalProducts.find(
                                                    (p) =>
                                                      p.id === chemicalIdOrName,
                                                  );

                                                // Si no se encuentra por ID, buscar por nombre normalizado
                                                if (!matchedProduct) {
                                                  const normalizedSearch =
                                                    chemicalIdOrName
                                                      .toLowerCase()
                                                      .replace(/_/g, " ")
                                                      .trim();
                                                  matchedProduct =
                                                    chemicalProducts.find(
                                                      (p) => {
                                                        const normalizedProductName =
                                                          p.name
                                                            .toLowerCase()
                                                            .replace(/_/g, " ")
                                                            .trim();
                                                        return (
                                                          normalizedProductName ===
                                                            normalizedSearch ||
                                                          normalizedProductName.includes(
                                                            normalizedSearch,
                                                          ) ||
                                                          normalizedSearch.includes(
                                                            normalizedProductName,
                                                          )
                                                        );
                                                      },
                                                    );
                                                }

                                                // Si encontramos coincidencia, agregar el ID del producto
                                                if (matchedProduct) {
                                                  legacyMaterialIds.push(
                                                    matchedProduct.id,
                                                  );
                                                }
                                              }
                                            }

                                            setSelectedMaterials(
                                              legacyMaterialIds.map((id) => ({
                                                materialId: id,
                                                qty: 1,
                                              })),
                                            );
                                          }

                                          // CONSUMIBLES - Aplicar misma lógica de prioridad
                                          if (
                                            cs.manualConsumables !==
                                              undefined &&
                                            cs.manualConsumables !== null
                                          ) {
                                            // PRIORIDAD ALTA: Usar selección manual
                                            console.log(
                                              `⚠️ Usando consumibles manuales (Prioridad Alta) para ${cs.name}`,
                                            );
                                            setSelectedConsumables(
                                              cs.manualConsumables,
                                            );
                                          } else {
                                            // FALLBACK: Buscar en serviceRecipes
                                            console.log(
                                              `🔍 Cargando consumibles desde recetas para ${cs.name}`,
                                            );
                                            console.log(
                                              `   Buscando por cs.id: "${cs.id}"`,
                                            );
                                            console.log(
                                              `   Buscando por cs.name: "${cs.name}"`,
                                            );
                                            console.log(
                                              `   IDs disponibles en serviceRecipes:`,
                                              serviceRecipes.map((r) => r.id),
                                            );

                                            // Buscar por el ID del documento (que es el nombre del servicio o ID del catálogo)
                                            const serviceRecipe =
                                              serviceRecipes.find(
                                                (r: ServiceRecipe) =>
                                                  r.id === cs.id ||
                                                  r.id === cs.name,
                                              );

                                            if (serviceRecipe) {
                                              console.log(
                                                `✅ Receta encontrada por ID de documento: ${serviceRecipe.id}`,
                                              );
                                              console.log(
                                                `   Items a cargar: ${serviceRecipe.items.length} consumibles`,
                                              );
                                              setSelectedConsumables(
                                                serviceRecipe.items,
                                              );
                                            } else {
                                              console.log(
                                                `❌ No se encontró receta para "${cs.name}"`,
                                              );
                                              console.log(
                                                `   Ningún ID coincide con "${cs.id}" ni con "${cs.name}"`,
                                              );
                                              setSelectedConsumables([]);
                                            }
                                          }
                                        }}
                                        className="p-2 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                        title="Editar"
                                      >
                                        <Edit2 size={16} />
                                      </button>
                                      <button
                                        onClick={() =>
                                          handleToggleCatalogService(
                                            cs.id,
                                            cs.active,
                                          )
                                        }
                                        className={`p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90`}
                                        title={
                                          cs.active ? "Desactivar" : "Activar"
                                        }
                                      >
                                        {cs.active ? (
                                          <XCircle size={16} />
                                        ) : (
                                          <CheckCircle size={16} />
                                        )}
                                      </button>
                                      {/* SOLO OWNER */}
                                      {currentUser?.role === "owner" && (
                                        <button
                                          onClick={() =>
                                            handleDeleteCatalogService(cs.id)
                                          }
                                          className="p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                          title="Eliminar"
                                        >
                                          <Trash2 size={16} />
                                        </button>
                                      )}
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
                <div className="flex justify-between items-center px-4 py-3 border-t border-border mt-2">
                  <div className="text-sm text-text-muted font-medium">
                    Mostrando{" "}
                    {Math.min(
                      (servicesPage - 1) * ITEMS_PER_PAGE + 1,
                      catalogServices.length,
                    )}{" "}
                    -{" "}
                    {Math.min(
                      servicesPage * ITEMS_PER_PAGE,
                      catalogServices.length,
                    )}{" "}
                    de {catalogServices.length} servicios
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setServicesPage((p) => Math.max(1, p - 1))}
                      disabled={servicesPage === 1}
                      className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 py-2 rounded-lg bg-primary-600 text-white font-bold shadow-sm shadow-primary-600/20">
                      {servicesPage}
                    </span>
                    <button
                      onClick={() =>
                        setServicesPage((p) =>
                          p * ITEMS_PER_PAGE < catalogServices.length
                            ? p + 1
                            : p,
                        )
                      }
                      disabled={
                        servicesPage * ITEMS_PER_PAGE >= catalogServices.length
                      }
                      className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </>
            </div>
          )}

          {activeTab === "consumables" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
                  <Package className="text-primary-600" />
                  Inventario de Consumibles
                </h3>
                <button
                  onClick={() => setAddingConsumableItem(true)}
                  className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95"
                >
                  <PlusCircle size={18} />
                  Nuevo Consumible
                </button>
              </div>

              <div className="bg-surface rounded-xl shadow-none border border-border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-surface-highlight border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-main">
                          Nombre
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-main">
                          Stock
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-main">
                          Costo Base
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-main">
                          Costo/Servicio
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-main">
                          Rendimiento
                        </th>
                        <th className="px-4 py-3 text-left text-sm font-semibold text-text-main">
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

                          // Calculate cost per unit (with fallback to legacy unitCost)
                          const costPerUnit =
                            c.purchasePrice && c.packageSize
                              ? c.purchasePrice / c.packageSize
                              : c.unitCost || 0;

                          // Calculate stock percentage for progress bar
                          const stockPercentage = c.packageSize
                            ? Math.min((c.stockQty / c.packageSize) * 100, 100)
                            : 100;

                          // Determine progress bar color
                          const progressColor =
                            stockPercentage > 50
                              ? "bg-primary-600" // Violet for good stock
                              : stockPercentage > 20
                                ? "bg-primary-400" // Gold for warning
                                : "bg-primary-700"; // Rose for critical

                          return (
                            <tr
                              key={c.id}
                              className={`border-b hover:bg-surface-highlight border-border transition-all duration-200 ${
                                isLowStock ? "bg-primary-400/5" : ""
                              }`}
                            >
                              {/* Nombre */}
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Package
                                    size={16}
                                    className="text-primary-600"
                                  />
                                  <span className="text-sm font-medium text-text-main">
                                    {c.name}
                                  </span>
                                  {isLowStock && (
                                    <span className="px-2 py-0.5 text-xs font-semibold text-primary-400 bg-primary-400/10 rounded-full">
                                      BAJO STOCK
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Stock con barra de progreso */}
                              <td className="px-4 py-3">
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between text-sm">
                                    <span
                                      className={`font-bold ${c.stockQty <= 0 ? "text-red-500" : "text-text-main"}`}
                                    >
                                      {c.stockQty} {c.unit}
                                    </span>
                                    {c.packageSize && (
                                      <span className="text-xs text-text-muted">
                                        / {c.packageSize}
                                      </span>
                                    )}
                                  </div>
                                  {c.packageSize && (
                                    <div className="w-full bg-surface-highlight rounded-full h-2 overflow-hidden border border-border">
                                      <div
                                        className={`h-full ${progressColor} transition-all duration-300 rounded-full`}
                                        style={{ width: `${stockPercentage}%` }}
                                      />
                                    </div>
                                  )}
                                </div>
                              </td>

                              {/* Costo Base */}
                              <td className="px-4 py-3">
                                {c.purchasePrice && c.packageSize ? (
                                  <div className="text-sm">
                                    <div className="font-semibold text-text-main">
                                      ${c.purchasePrice.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-text-muted">
                                      {c.packageSize} {c.unit}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">
                                    N/A
                                  </span>
                                )}
                              </td>

                              {/* Costo por Servicio */}
                              <td className="px-4 py-3">
                                <div className="text-sm font-semibold text-primary-600">
                                  ${costPerUnit.toFixed(3)}
                                </div>
                                <div className="text-xs text-text-muted">
                                  por {c.unit}
                                </div>
                              </td>

                              {/* Rendimiento */}
                              <td className="px-4 py-3">
                                <div className="text-sm">
                                  <div className="font-bold text-text-main">
                                    {c.stockQty} servicios
                                  </div>
                                  <div className="text-xs text-text-muted">
                                    restantes
                                  </div>
                                </div>
                              </td>

                              {/* Acciones */}
                              <td className="px-4 py-3 flex gap-2">
                                <button
                                  onClick={() => {
                                    setEditingConsumableItem(c);
                                    setEditConsumableForm(c);
                                  }}
                                  className="p-2 rounded-lg text-primary-500 hover:bg-primary-500/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                  title="Editar"
                                >
                                  <Edit2 size={18} />
                                </button>
                                {/* SOLO OWNER */}
                                {currentUser?.role === "owner" && (
                                  <button
                                    onClick={() => handleDeleteConsumable(c.id)}
                                    className="p-2 rounded-lg text-primary-700 hover:text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                    title="Eliminar"
                                  >
                                    <Trash2 size={18} />
                                  </button>
                                )}
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
                  <div className="text-sm text-text-muted font-medium">
                    Mostrando{" "}
                    {Math.min(
                      (consumablesPage - 1) * ITEMS_PER_PAGE + 1,
                      consumables.length,
                    )}{" "}
                    -{" "}
                    {Math.min(
                      consumablesPage * ITEMS_PER_PAGE,
                      consumables.length,
                    )}{" "}
                    de {consumables.length} consumibles
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setConsumablesPage((p) => Math.max(1, p - 1))
                      }
                      disabled={consumablesPage === 1}
                      className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 py-2 rounded-lg bg-primary-600 text-white font-bold shadow-sm shadow-primary-600/20">
                      {consumablesPage}
                    </span>
                    <button
                      onClick={() =>
                        setConsumablesPage((p) =>
                          p * ITEMS_PER_PAGE < consumables.length ? p + 1 : p,
                        )
                      }
                      disabled={
                        consumablesPage * ITEMS_PER_PAGE >= consumables.length
                      }
                      className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "personal" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 relative h-full">
              {/* Header */}
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
                    <Users className="text-primary-600" />
                    Gestión de Personal
                  </h3>
                  <p className="text-text-muted text-sm mt-1">
                    Administra el equipo, comisiones y accesos
                  </p>
                </div>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95"
                >
                  <Plus size={20} />
                  Nuevo Personal
                </button>
              </div>

              {/* Staff Detail View or Grid Layout */}
              {selectedStaff ? (
                <StaffDetailView
                  staff={selectedStaff}
                  onClose={() => setSelectedStaff(null)}
                  onUpdate={handleUpdateStaff}
                  onDelete={handleDeleteStaff}
                  transactions={transactions}
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {users
                    .filter((u) => u.role === "staff")
                    .map((user) => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedStaff(user)}
                        className="group bg-surface hover:bg-surface-highlight border hover:border-primary-500/30 rounded-2xl p-6 transition-all duration-300 flex flex-col items-center cursor-pointer relative overflow-hidden border-border shadow-sm hover:shadow-xl hover:-translate-y-1"
                      >
                        {/* Avatar y Estado */}
                        <div className="relative mb-4">
                          <div
                            className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold shadow-inner border-4 border-surface ${
                              user.active
                                ? "bg-primary-100/50 text-primary-600"
                                : "bg-gray-100 text-gray-400 grayscale"
                            }`}
                          >
                            {user.photoURL ? (
                              <img
                                src={user.photoURL}
                                alt={user.name}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              user.name.slice(0, 2).toUpperCase()
                            )}
                          </div>
                          {/* Indicador de Estado */}
                          <div
                            className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-4 border-surface ${
                              user.active ? "bg-green-500" : "bg-gray-400"
                            }`}
                          />
                        </div>

                        {/* Info */}
                        <div className="text-center w-full">
                          <h4
                            className={`text-lg font-bold text-text-main truncate w-full ${!user.active && "text-text-muted"}`}
                          >
                            {user.name}
                          </h4>
                          <p className="text-sm text-text-muted capitalize mt-1">
                            {user.role}
                          </p>
                        </div>
                      </div>
                    ))}

                  {/* Empty State / Add Placehoder */}
                  {users.filter((u) => u.role === "staff").length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-text-muted border-2 border-dashed border-border rounded-2xl bg-surface/30">
                      <UserPlus size={48} className="mb-4 opacity-20" />
                      <p className="text-lg font-medium">
                        No hay personal activa
                      </p>
                      <p className="text-sm">
                        Agrega nuevos miembros al equipo para comenzar
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Slide-over: Create New User */}
              {isAddUserOpen && (
                <div className="fixed inset-0 z-50 flex justify-end">
                  <div
                    className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsAddUserOpen(false)}
                  />
                  <div className="relative w-full max-w-[400px] bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-border flex justify-between items-center bg-surface-highlight/30">
                      <div>
                        <h3 className="text-lg font-bold text-text-main">
                          Nuevo Usuario
                        </h3>
                        <p className="text-xs text-text-muted">
                          Agregar miembro al equipo
                        </p>
                      </div>
                      <button
                        onClick={() => setIsAddUserOpen(false)}
                        className="p-2 hover:bg-surface-highlight rounded-full transition-colors text-text-muted hover:text-text-main"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-4 overflow-y-auto flex-1">
                      <div className="space-y-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-text-main">
                            Nombre Completo
                          </label>
                          <div className="relative">
                            <Users
                              size={18}
                              className="absolute left-3 top-3.5 text-text-muted"
                            />
                            <input
                              type="text"
                              placeholder="Ej. Ana García"
                              value={newUser.name}
                              onChange={(e) =>
                                setNewUser({ ...newUser, name: e.target.value })
                              }
                              className="w-full h-11 pl-10 pr-4 bg-surface text-text-main border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-text-muted/50"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-text-main">
                            PIN de Acceso
                          </label>
                          <div className="relative">
                            <Key
                              size={18}
                              className="absolute left-3 top-3.5 text-text-muted"
                            />
                            <input
                              type="password" /* o text si prefieren ver */
                              placeholder="4-6 dígitos"
                              value={newUser.pin}
                              onChange={(e) =>
                                setNewUser({ ...newUser, pin: e.target.value })
                              }
                              className="w-full h-11 pl-10 pr-4 bg-surface text-text-main border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-text-muted/50"
                            />
                          </div>
                          <p className="text-xs text-text-muted">
                            Usado para iniciar sesión en la tableta.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-text-main">
                            Comisión por Ventas (%)
                          </label>
                          <div className="relative">
                            <Percent
                              size={18}
                              className="absolute left-3 top-3.5 text-text-muted"
                            />
                            <input
                              type="number"
                              step="0.1"
                              placeholder="0.0"
                              value={newUser.commissionPct}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  commissionPct: e.target.value,
                                })
                              }
                              className="w-full h-11 pl-10 pr-4 bg-surface text-text-main border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-text-muted/50"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-text-main">
                            Teléfono
                          </label>
                          <div className="relative">
                            <Phone
                              size={18}
                              className="absolute left-3 top-3.5 text-text-muted"
                            />
                            <input
                              type="tel"
                              placeholder="612 345 678"
                              value={newUser.phone || ""}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  phone: e.target.value,
                                })
                              }
                              className="w-full h-11 pl-10 pr-4 bg-surface text-text-main border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-text-muted/50"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-text-main">
                            Email
                          </label>
                          <div className="relative">
                            <Mail
                              size={18}
                              className="absolute left-3 top-3.5 text-text-muted"
                            />
                            <input
                              type="email"
                              placeholder="correo@ejemplo.com"
                              value={newUser.email || ""}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  email: e.target.value,
                                })
                              }
                              className="w-full h-11 pl-10 pr-4 bg-surface text-text-main border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-text-muted/50"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium text-text-main">
                            Fecha de Nacimiento
                          </label>
                          <div className="relative">
                            <Calendar
                              size={18}
                              className="absolute left-3 top-3.5 text-text-muted"
                            />
                            <input
                              type="date"
                              value={newUser.birthDate || ""}
                              onChange={(e) =>
                                setNewUser({
                                  ...newUser,
                                  birthDate: e.target.value,
                                })
                              }
                              className="w-full h-11 pl-10 pr-4 bg-surface text-text-main border border-border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-text-muted/50"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-border bg-surface-highlight/30 flex gap-3">
                      <button
                        onClick={() => setIsAddUserOpen(false)}
                        className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleCreateNewUser}
                        disabled={isSubmitting || !newUser.name || !newUser.pin}
                        className="flex-1 h-11 rounded-xl bg-primary-600 text-white font-bold hover:bg-primary-500 shadow-lg shadow-primary-600/20 hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      >
                        {isSubmitting ? "Creando..." : "Crear Usuario"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "extras" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-2xl font-bold text-text-main mb-6 flex items-center gap-2">
                <Star className="text-primary-400" />
                Catálogo de Extras
              </h3>
              {/* Form agregar extra */}
              <div className="mb-6 p-4 bg-surface-highlight/50 rounded-lg border border-border">
                <h4 className="font-semibold text-text-main mb-3">
                  Agregar Nuevo Extra
                </h4>
                <div className="flex gap-2 flex-wrap items-end">
                  <input
                    type="text"
                    placeholder="Nombre del extra"
                    value={newExtraName}
                    onChange={(e) => setNewExtraName(e.target.value)}
                    className="px-4 py-2 bg-surface-highlight border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-400/20 focus:border-primary-400 focus:outline-none text-text-main placeholder-text-muted"
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Precio por uña"
                    value={newExtraPrice}
                    onChange={(e) => setNewExtraPrice(e.target.value)}
                    className="px-4 py-2 bg-surface-highlight border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-400/20 focus:border-primary-400 focus:outline-none text-text-main placeholder-text-muted"
                  />
                  <button
                    onClick={handleAddExtra}
                    disabled={isSubmitting}
                    className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95"
                  >
                    <PlusCircle size={20} />
                    Agregar Extra
                  </button>
                </div>
              </div>

              {/* Tabla de extras */}

              <div className="bg-surface rounded-xl shadow-none border border-border overflow-hidden">
                {catalogExtras.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-highlight border-b border-border">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">
                            Nombre del Extra
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">
                            Precio Sugerido
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">
                            Estado
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-text-main uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
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
                              extra.price || extra.priceSuggested || 0;
                            return (
                              <tr
                                key={extra.id}
                                className={`group transition-colors duration-200 hover:bg-surface-highlight ${
                                  !extra.active ? "opacity-60" : ""
                                }`}
                              >
                                <td className="px-6 py-4 text-sm font-medium text-text-main">
                                  {extra.name || "Sin nombre"}
                                </td>
                                <td className="px-6 py-4 text-sm font-bold text-text-main font-mono">
                                  ${price.toFixed(2)}
                                </td>
                                <td className="px-6 py-4">
                                  <span
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                      extra.active
                                        ? "bg-primary-600/10 text-primary-600"
                                        : "bg-primary-700/10 text-primary-700"
                                    }`}
                                  >
                                    {extra.active ? "Activo" : "Inactivo"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() => {
                                        setEditingExtraItem(extra);
                                        setEditExtraForm(extra);
                                      }}
                                      className="p-2 rounded-lg text-primary-600 hover:bg-primary-600/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                      title="Editar"
                                    >
                                      <Edit2 size={16} />
                                    </button>
                                    {/* SOLO OWNER */}
                                    {currentUser?.role === "owner" && (
                                      <button
                                        onClick={() =>
                                          handleDeleteExtra(extra.id)
                                        }
                                        className="p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                        title="Eliminar"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    )}
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
                  <div className="text-sm text-text-muted font-medium">
                    Mostrando{" "}
                    {Math.min(
                      (extrasPage - 1) * ITEMS_PER_PAGE + 1,
                      catalogExtras.length,
                    )}{" "}
                    -{" "}
                    {Math.min(
                      extrasPage * ITEMS_PER_PAGE,
                      catalogExtras.length,
                    )}{" "}
                    de {catalogExtras.length} extras
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExtrasPage((p) => Math.max(1, p - 1))}
                      disabled={extrasPage === 1}
                      className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <span className="px-4 py-2 rounded-lg bg-primary-400 text-white font-bold shadow-sm shadow-primary-400/20">
                      {extrasPage}
                    </span>
                    <button
                      onClick={() =>
                        setExtrasPage((p) =>
                          p * ITEMS_PER_PAGE < catalogExtras.length ? p + 1 : p,
                        )
                      }
                      disabled={
                        extrasPage * ITEMS_PER_PAGE >= catalogExtras.length
                      }
                      className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>

                {catalogExtras.length === 0 && (
                  <div className="text-center py-8 text-text-muted">
                    No hay extras registrados
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "materials" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-text-main flex items-center gap-2">
                  <Beaker className="text-primary-600" />
                  Inventario de Materiales Químicos
                </h3>
                <button
                  onClick={() => setAddingChemicalProduct(true)}
                  className="bg-primary-600 hover:bg-primary-600/80 text-white font-bold px-4 py-2 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 ease-out flex items-center gap-2 active:scale-95"
                >
                  <PlusCircle size={18} />
                  Nuevo Producto
                </button>
              </div>

              {/* Sección 1: Productos Químicos */}
              {chemicalProducts.length === 0 ? (
                <div className="bg-surface-highlight border border-border rounded-xl p-6 shadow-sm mb-8">
                  <EmptyState
                    icon={Beaker}
                    title="Inventario químico vacío"
                    message="Registra tus productos químicos para controlar el stock."
                  />
                </div>
              ) : (
                <div className="bg-surface rounded-xl shadow-none border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-highlight border-b border-border">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">
                            Producto
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">
                            Stock
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">
                            Presentación
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider">
                            Costo Compra
                          </th>
                          <th
                            className="px-6 py-4 text-left text-xs font-bold text-text-main uppercase tracking-wider"
                            title="Costo por Servicio"
                          >
                            $/Serv
                          </th>
                          <th className="px-6 py-4 text-right text-xs font-bold text-text-main uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedChemicals.map((product) => {
                          const isLowStock = product.stock <= product.minStock;

                          return (
                            <tr
                              key={product.id}
                              className={`group transition-colors duration-200 hover:bg-surface-highlight ${
                                !product.active ? "opacity-60" : ""
                              }`}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div
                                    className={`p-2 rounded-lg ${isLowStock ? "bg-red-500/10 text-red-500" : "bg-primary-500/10 text-primary-500"}`}
                                  >
                                    <Beaker size={20} />
                                  </div>
                                  <div>
                                    <div className="font-bold text-text-main text-sm">
                                      {product.name}
                                    </div>
                                    {!product.active && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-text-muted uppercase tracking-wide">
                                        Inactivo
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span
                                    className={`text-sm font-bold ${isLowStock ? "text-red-500" : "text-text-main"}`}
                                  >
                                    {product.stock} uds.
                                  </span>
                                  {isLowStock && (
                                    <span className="text-xs text-red-500 font-medium flex items-center gap-1">
                                      <AlertTriangle size={10} />
                                      Min: {product.minStock}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm text-text-muted font-medium">
                                {product.quantity} {product.unit}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-text-main font-mono">
                                ${product.purchasePrice.toFixed(2)}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-primary-600 font-mono">
                                    ${product.costPerService.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] text-gray-400">
                                    Rend: {product.yield} servs
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingProduct(product);
                                      setEditChemicalForm(product);
                                    }}
                                    className="p-2 rounded-lg text-primary-600 hover:bg-primary-600/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                    title="Editar"
                                  >
                                    <Edit2 size={16} />
                                  </button>
                                  {currentUser?.role === "owner" && (
                                    <button
                                      onClick={() =>
                                        handleDeleteChemicalProduct(product.id)
                                      }
                                      className="p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-all duration-200 hover:scale-110 active:scale-90"
                                      title="Eliminar"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              {/* Pagination Controls */}
              {chemicalProducts.length > 0 && (
                <div className="flex justify-between items-center px-2 mt-4">
                  <div className="text-sm text-text-muted">
                    Mostrando{" "}
                    {Math.min(
                      (chemicalsPage - 1) * ITEMS_PER_PAGE + 1,
                      chemicalProducts.length,
                    )}{" "}
                    a{" "}
                    {Math.min(
                      chemicalsPage * ITEMS_PER_PAGE,
                      chemicalProducts.length,
                    )}{" "}
                    de {chemicalProducts.length} productos
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        setChemicalsPage((p) => Math.max(1, p - 1))
                      }
                      disabled={chemicalsPage === 1}
                      className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="px-4 py-2 rounded-lg bg-primary-600 text-white font-bold shadow-sm shadow-primary-600/20">
                      {chemicalsPage}
                    </span>
                    <button
                      onClick={() =>
                        setChemicalsPage((p) =>
                          p * ITEMS_PER_PAGE < chemicalProducts.length
                            ? p + 1
                            : p,
                        )
                      }
                      disabled={
                        chemicalsPage * ITEMS_PER_PAGE >=
                        chemicalProducts.length
                      }
                      className="px-3 py-2 rounded-lg border border-border text-gray-400 hover:bg-surface-highlight disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================== PESTAÑA DE CLIENTES ==================== */}
          {activeTab === "clients" && (
            <div className="animate-in fade-in duration-300">
              {/* Header & Search Combined */}
              <div className="flex justify-between items-center mb-6 mt-0">
                <h2 className="text-xl font-bold text-text-main m-0">
                  Directorio de Clientes
                </h2>

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
                    className="w-full pl-9 pr-4 py-1.5 bg-surface-highlight border border-border rounded-lg text-sm text-text-main font-medium transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none shadow-sm placeholder-text-muted"
                  />
                  <div className="absolute left-3 top-2 text-primary-600">
                    <Users size={16} />
                  </div>
                </div>
              </div>

              {/* Tabla de Clientes */}
              <div className="overflow-hidden">
                {filteredClients.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-surface-highlight border-b border-border">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-text-main uppercase tracking-wider">
                            Cliente
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-text-main uppercase tracking-wider">
                            Última Visita
                          </th>
                          <th className="px-6 py-3 text-center text-xs font-semibold text-text-main uppercase tracking-wider">
                            Servicios
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-text-main uppercase tracking-wider">
                            Gasto Total
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-semibold text-text-main uppercase tracking-wider">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {paginatedClients.map((client) => (
                          <tr
                            key={client.id}
                            className="hover:bg-surface-highlight transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-600/10 flex items-center justify-center text-primary-600 font-bold text-sm group-hover:bg-primary-600/20 transition-colors">
                                  {client.name.substring(0, 2).toUpperCase()}
                                </div>
                                <div className="font-semibold text-text-main">
                                  {client.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-muted">
                              {client.lastVisit}
                            </td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium hover:bg-surface-highlight text-text-muted border border-border">
                                {client.totalServices} visitas
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-bold ${
                                  client.totalSpent > 500
                                    ? "bg-primary-600/10 text-primary-600"
                                    : "bg-primary-700/10 text-primary-700"
                                }`}
                              >
                                ${client.totalSpent.toFixed(2)}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {currentUser?.role === "owner" && (
                                <button
                                  onClick={() => handleDeleteClient(client.id)}
                                  className="p-2 rounded-lg text-primary-700 hover:bg-primary-700/10 transition-colors hover:scale-110 active:scale-90"
                                  title="Eliminar Cliente"
                                >
                                  <Trash2 size={18} />
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 bg-surface-highlight rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                      <Users size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-text-main mb-1">
                      {clientsSearch
                        ? "No se encontraron resultados"
                        : "Aún no hay clientes registrados"}
                    </h3>
                    <p className="text-text-muted max-w-sm mx-auto">
                      {clientsSearch
                        ? "Intenta con otro término de búsqueda."
                        : "Aparecerán aquí automáticamente al realizar ventas."}
                    </p>
                  </div>
                )}

                {/* Pagination */}
                {filteredClients.length > 7 && (
                  <div className="px-6 py-4 border-t border-border bg-surface-highlight/50 flex justify-between items-center">
                    <span className="text-sm text-text-muted">
                      Mostrando {(clientsPage - 1) * 7 + 1} -{" "}
                      {Math.min(clientsPage * 7, filteredClients.length)} de{" "}
                      {filteredClients.length}
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() =>
                          setClientsPage((p) => Math.max(1, p - 1))
                        }
                        disabled={clientsPage === 1}
                        className="p-2 rounded-lg hover:bg-surface-highlight border border-transparent hover:border-border disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-all font-medium"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <button
                        onClick={() =>
                          setClientsPage((p) =>
                            Math.min(
                              Math.ceil(filteredClients.length / 7),
                              p + 1,
                            ),
                          )
                        }
                        disabled={
                          clientsPage >= Math.ceil(filteredClients.length / 7)
                        }
                        className="p-2 rounded-lg hover:bg-surface-highlight border border-transparent hover:border-border disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 transition-all font-medium"
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

      {/* Slide-over para Edición de Servicio con Materiales */}
      {editingServiceItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingServiceItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-lg bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-text-main">
                  {editingServiceItem.id === "new"
                    ? "Nuevo Servicio"
                    : "Editar Servicio"}
                </h3>
                <p className="text-xs text-text-muted">
                  Configuración y materiales
                </p>
              </div>
              <button
                onClick={() => setEditingServiceItem(null)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-surface-highlight/20">
              {/* Tabs Navigation */}
              <div className="bg-surface px-6 pt-2 border-b border-border sticky top-0 z-10">
                <div className="flex gap-6">
                  <button
                    onClick={() => setServiceFormTab("info")}
                    className={`pb-3 text-sm font-semibold transition-all relative ${
                      serviceFormTab === "info"
                        ? "text-primary-600"
                        : "text-text-muted hover:text-text-main"
                    }`}
                  >
                    Información
                    {serviceFormTab === "info" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full" />
                    )}
                  </button>

                  <button
                    onClick={() => setServiceFormTab("chemicals")}
                    className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                      serviceFormTab === "chemicals"
                        ? "text-primary-600"
                        : "text-text-muted hover:text-text-main"
                    }`}
                  >
                    Químicos
                    {selectedMaterials.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary-100/10 text-primary-500 text-[10px] font-bold">
                        {selectedMaterials.length}
                      </span>
                    )}
                    {serviceFormTab === "chemicals" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full" />
                    )}
                  </button>

                  <button
                    onClick={() => setServiceFormTab("consumables")}
                    className={`pb-3 text-sm font-semibold transition-all relative flex items-center gap-2 ${
                      serviceFormTab === "consumables"
                        ? "text-primary-600"
                        : "text-text-muted hover:text-text-main"
                    }`}
                  >
                    Consumibles
                    {selectedConsumables.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-primary-100/10 text-primary-500 text-[10px] font-bold">
                        {selectedConsumables.length}
                      </span>
                    )}
                    {serviceFormTab === "consumables" && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 rounded-t-full" />
                    )}
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-4">
                {/* Información Básica */}
                {serviceFormTab === "info" && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="space-y-4">
                      <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                        <ShoppingCart size={18} className="text-primary-600" />
                        Información del Servicio
                      </h4>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-text-muted">
                          Nombre del Servicio
                        </label>
                        <input
                          type="text"
                          value={editServiceForm.name || ""}
                          onChange={(e) =>
                            setEditServiceForm((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="w-full h-11 px-4 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none placeholder:text-text-muted/50"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-text-muted">
                            Categoría
                          </label>
                          <select
                            value={editServiceForm.category || "manicura"}
                            onChange={(e) =>
                              setEditServiceForm((prev) => ({
                                ...prev,
                                category: e.target
                                  .value as CatalogService["category"],
                              }))
                            }
                            className="w-full h-11 px-4 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                          >
                            <option value="manicura">Manicura</option>
                            <option value="pedicura">Pedicura</option>
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-text-muted">
                            Precio Base
                          </label>
                          <div className="relative">
                            <span className="absolute left-3 top-3 text-text-muted font-bold">
                              $
                            </span>
                            <input
                              type="number"
                              step="0.01"
                              value={editServiceForm.basePrice ?? ""}
                              onChange={(e) => {
                                const val = e.target.value;
                                setEditServiceForm((prev) => ({
                                  ...prev,
                                  basePrice: val === "" ? 0 : parseFloat(val),
                                }));
                              }}
                              className="w-full h-11 pl-8 pr-4 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Cost Summary in Info Tab (Optional placement) */}
                    <div className="bg-surface rounded-xl p-4 border border-border shadow-sm">
                      <h4 className="font-bold text-text-main mb-3 flex items-center gap-2">
                        <DollarSign size={16} className="text-text-muted" />
                        Resumen de Costos Estimados
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-text-muted">
                          <span>
                            Costo Químicos ({selectedMaterials.length}):
                          </span>
                          <span>
                            ${totalEstimatedMaterialCost.chemicals.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-text-muted">
                          <span>
                            Costo Desechables (
                            {selectedConsumables.reduce((a, b) => a + b.qty, 0)}
                            ):
                          </span>
                          <span>
                            ${totalEstimatedMaterialCost.consumables.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between pt-2 border-t border-border mt-2">
                          <span className="font-black text-text-main uppercase">
                            Costo Total Materiales:
                          </span>
                          <span className="font-black text-primary-600 text-lg">
                            ${totalEstimatedMaterialCost.total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vincular Materiales */}
                {serviceFormTab === "chemicals" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                      <Beaker size={18} className="text-primary-600" />
                      Vincular Materiales
                    </h4>

                    <p className="text-sm text-text-muted">
                      Selecciona los productos químicos que se utilizan en este
                      servicio
                    </p>

                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Buscar material..."
                        value={materialSearch}
                        onChange={(e) => setMaterialSearch(e.target.value)}
                        className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      />
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto border border-border rounded-lg bg-surface">
                      {chemicalProducts.length === 0 ? (
                        <div className="p-6 text-center">
                          <Beaker
                            size={48}
                            className="mx-auto text-gray-700 mb-3"
                          />
                          <p className="text-sm text-gray-500">
                            No hay productos químicos disponibles
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {chemicalProducts
                            .filter(
                              (p) =>
                                p.active &&
                                p.name
                                  .toLowerCase()
                                  .includes(materialSearch.toLowerCase()),
                            )
                            .map((product) => {
                              const isLowStock =
                                product.stock <= product.minStock;

                              return (
                                <div
                                  key={product.id}
                                  className={`flex flex-col p-3 rounded-lg border transition-colors ${
                                    selectedMaterials.some(
                                      (m) => m.materialId === product.id,
                                    )
                                      ? "bg-primary-600/5 border-primary-600/20"
                                      : "bg-surface border-transparent hover:border-primary-600/20 hover:bg-surface-highlight"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={selectedMaterials.some(
                                        (m) => m.materialId === product.id,
                                      )}
                                      onChange={() =>
                                        handleToggleMaterial(product.id)
                                      }
                                      className="mt-1 w-5 h-5 text-primary-600 border-border rounded focus:ring-primary-600 focus:ring-2 cursor-pointer bg-surface"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-1">
                                        <span className="font-semibold text-text-main text-sm truncate">
                                          {product.name}
                                        </span>
                                        {isLowStock && (
                                          <span className="shrink-0 px-1.5 py-0.5 bg-primary-700/10 text-primary-700 text-[10px] font-bold rounded-full">
                                            BAJO
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-text-muted mb-2">
                                        Stock: {product.stock} | Pres:{" "}
                                        {product.quantity} {product.unit}
                                      </p>

                                      {/* Quantity Input - Only if selected */}
                                      {selectedMaterials.some(
                                        (m) => m.materialId === product.id,
                                      ) && (
                                        <div className="flex items-center gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                                          <label className="text-xs font-medium text-primary-600">
                                            Uso:
                                          </label>
                                          <div className="relative flex-1">
                                            <input
                                              type="number"
                                              min="0"
                                              step="0.1"
                                              value={
                                                selectedMaterials.find(
                                                  (m) =>
                                                    m.materialId === product.id,
                                                )?.qty || 0
                                              }
                                              onChange={(e) =>
                                                handleMaterialQtyChange(
                                                  product.id,
                                                  parseFloat(e.target.value) ||
                                                    0,
                                                )
                                              }
                                              className="w-full px-2 py-1 text-sm bg-surface border border-primary-600/20 rounded focus:ring-1 focus:ring-primary-600 focus:border-primary-500 outline-none font-bold text-primary-600"
                                              onClick={(e) =>
                                                e.stopPropagation()
                                              }
                                            />
                                            <span className="absolute right-2 top-1.5 text-xs text-text-muted pointer-events-none">
                                              {product.unit}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {selectedMaterials.length > 0 && (
                      <div className="bg-primary-600/5 border border-primary-600/20 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-primary-600" />
                          <p className="text-sm font-semibold text-primary-600">
                            {selectedMaterials.length} material
                            {selectedMaterials.length !== 1 ? "es" : ""}{" "}
                            seleccionado
                            {selectedMaterials.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Vincular Consumibles (Desechables) */}
                {serviceFormTab === "consumables" && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                    <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                      <Package size={18} className="text-primary-600" />
                      Vincular Consumibles (Desechables)
                    </h4>

                    <p className="text-sm text-text-muted">
                      Selecciona los consumibles desechables que se utilizan en
                      este servicio y especifica la cantidad
                    </p>

                    <div className="mb-3">
                      <input
                        type="text"
                        placeholder="Buscar material..."
                        value={consumableSearch}
                        onChange={(e) => setConsumableSearch(e.target.value)}
                        className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                      />
                    </div>

                    <div className="space-y-2 flex-1 overflow-y-auto border border-border rounded-lg bg-surface">
                      {consumables.length === 0 ? (
                        <div className="p-6 text-center">
                          <Package
                            size={48}
                            className="mx-auto text-gray-700 mb-3"
                          />
                          <p className="text-sm text-gray-500">
                            No hay consumibles disponibles
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-gray-100">
                          {consumables
                            .filter(
                              (c) =>
                                c.active &&
                                c.name
                                  .toLowerCase()
                                  .includes(consumableSearch.toLowerCase()),
                            )
                            .map((consumable) => {
                              const isSelected = selectedConsumables.some(
                                (sc) => sc.consumableId === consumable.id,
                              );
                              const selectedItem = selectedConsumables.find(
                                (sc) => sc.consumableId === consumable.id,
                              );
                              const isLowStock =
                                consumable.stockQty <= consumable.minStockAlert;

                              return (
                                <div
                                  key={consumable.id}
                                  className={`p-4 hover:bg-surface-highlight border-b border-border last:border-0 transition-colors ${
                                    isSelected ? "bg-primary-600/10" : ""
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <input
                                      type="checkbox"
                                      checked={isSelected}
                                      onChange={() =>
                                        handleToggleConsumable(consumable.id)
                                      }
                                      className="mt-1 w-5 h-5 text-primary-600 border-border rounded focus:ring-primary-600 focus:ring-2 cursor-pointer bg-surface"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2 mb-2">
                                        <p className="font-semibold text-text-main truncate">
                                          {consumable.name}
                                        </p>
                                        {isLowStock && (
                                          <span className="shrink-0 px-2 py-0.5 bg-primary-700/10 text-primary-700 text-[10px] font-bold rounded-full">
                                            BAJO STOCK
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-3">
                                        <p className="text-xs text-text-muted">
                                          <span className="font-medium">
                                            Unidad:
                                          </span>{" "}
                                          {consumable.unit}
                                        </p>
                                        <p
                                          className={`text-xs font-semibold ${isLowStock ? "text-orange-600" : "text-slate-500"}`}
                                        >
                                          Stock: {consumable.stockQty}{" "}
                                          {consumable.unit}
                                        </p>
                                      </div>

                                      {/* Quantity Input - Only show if selected */}
                                      {isSelected && (
                                        <div className="mt-3 flex items-center gap-2">
                                          <label className="text-xs font-medium text-text-muted">
                                            Cantidad:
                                          </label>
                                          <div className="relative">
                                            <input
                                              type="number"
                                              min="1"
                                              value={selectedItem?.qty || 1}
                                              onChange={(e) =>
                                                handleConsumableQtyChange(
                                                  consumable.id,
                                                  parseInt(e.target.value) || 1,
                                                )
                                              }
                                              className="w-20 px-3 py-1.5 text-sm bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                                            />
                                            <span className="ml-2 text-xs text-text-muted">
                                              {consumable.unit}
                                            </span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      )}
                    </div>

                    {selectedConsumables.length > 0 && (
                      <div className="bg-primary-600/5 border border-primary-600/20 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle size={18} className="text-primary-600" />
                          <p className="text-sm font-semibold text-primary-600">
                            {selectedConsumables.length} consumible
                            {selectedConsumables.length !== 1 ? "s" : ""}{" "}
                            seleccionado
                            {selectedConsumables.length !== 1 ? "s" : ""}
                          </p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {selectedConsumables.map((sc) => {
                            const consumable = consumables.find(
                              (c) => c.id === sc.consumableId,
                            );
                            return consumable ? (
                              <span
                                key={sc.consumableId}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-surface border border-primary-600/20 rounded-md text-xs text-text-main"
                              >
                                <span className="font-medium">
                                  {consumable.name}
                                </span>
                                <span className="text-primary-600 font-bold">
                                  ×{sc.qty}
                                </span>
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setEditingServiceItem(null)}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveUnifiedService}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/20 hover:bg-purple-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                {editingServiceItem.id === "new"
                  ? "Crear Servicio"
                  : "Guardar Cambios"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over para Edición de Producto Químico */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingProduct(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Editar Producto
                </h3>
                <p className="text-sm text-text-muted">
                  Gestión de inventario y costos
                </p>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Sección 1: Información e Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <Package size={18} className="text-primary-600" />
                  Información e Inventario
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    value={editChemicalForm.name || ""}
                    onChange={(e) =>
                      setEditChemicalForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      value={editChemicalForm.stock ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditChemicalForm((prev) => ({
                          ...prev,
                          stock: val === "" ? 0 : parseFloat(val),
                        }));
                      }}
                      className="w-full px-4 py-2 border border-primary-500/20 rounded-lg focus:border-primary-400 focus:ring-4 focus:ring-primary-400/20 outline-none transition-all bg-surface font-bold text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Alerta (Mínimo)
                    </label>
                    <input
                      type="number"
                      value={editChemicalForm.minStock ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditChemicalForm((prev) => ({
                          ...prev,
                          minStock: val === "" ? 0 : parseFloat(val),
                        }));
                      }}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:border-primary-400 outline-none transition-all bg-surface text-text-main"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Características y Costos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600" />
                  Características y Costos
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Contenido Neto
                    </label>
                    <input
                      type="number"
                      value={editChemicalForm.quantity ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditChemicalForm((prev) => ({
                          ...prev,
                          quantity: val === "" ? 0 : parseFloat(val),
                        }));
                      }}
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Unidad
                    </label>
                    <select
                      value={editChemicalForm.unit || "ml"}
                      onChange={(e) =>
                        setEditChemicalForm((prev) => ({
                          ...prev,
                          unit: e.target.value as ChemicalProduct["unit"],
                        }))
                      }
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    >
                      <option value="ml">Mililitros (ml)</option>
                      <option value="g">Gramos (g)</option>
                      <option value="unid">Unidades (u)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Precio de Compra (Por envase)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={editChemicalForm.purchasePrice ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditChemicalForm((prev) => ({
                          ...prev,
                          purchasePrice: val === "" ? 0 : parseFloat(val),
                        }));
                      }}
                      className="w-full pl-8 pr-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="mt-2 bg-primary-600/5 p-3 rounded-lg border border-primary-600/10 flex justify-between items-center animate-in fade-in duration-300">
                  <span className="text-sm font-medium text-text-muted">
                    Costo real:
                  </span>
                  <span className="text-lg font-bold text-primary-600">
                    $
                    {(
                      (editChemicalForm.purchasePrice || 0) /
                      (editChemicalForm.quantity || 1)
                    ).toFixed(4)}{" "}
                    por {editChemicalForm.unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingProduct && editChemicalForm) {
                    handleUpdateChemicalProduct(
                      editingProduct.id,
                      editChemicalForm,
                    );
                    setEditingProduct(null);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-900/20 hover:bg-purple-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over para AGREGAR Producto Químico */}
      {addingChemicalProduct && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setAddingChemicalProduct(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Agregar Producto
                </h3>
                <p className="text-sm text-text-muted">
                  Nuevo producto para el inventario
                </p>
              </div>
              <button
                onClick={() => setAddingChemicalProduct(false)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Sección 1: Información e Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <Package size={18} className="text-primary-600" />
                  Información e Inventario
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Gel Constructor, Top Coat"
                    value={newChemicalProduct.name}
                    onChange={(e) =>
                      setNewChemicalProduct((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newChemicalProduct.stock}
                      onChange={(e) =>
                        setNewChemicalProduct((prev) => ({
                          ...prev,
                          stock: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-primary-400/20 rounded-lg focus:border-primary-400 focus:ring-4 focus:ring-primary-400/20 outline-none transition-all bg-surface font-bold text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Alerta (Mínimo)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      value={newChemicalProduct.minStock}
                      onChange={(e) =>
                        setNewChemicalProduct((prev) => ({
                          ...prev,
                          minStock: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:border-primary-400 outline-none transition-all bg-surface text-text-main"
                    />
                  </div>
                </div>
              </div>

              {/* Sección 2: Características y Costos */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <DollarSign size={18} className="text-green-600" />
                  Características y Costos
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Contenido Neto
                    </label>
                    <input
                      type="number"
                      placeholder="ej. 1000"
                      value={newChemicalProduct.quantity}
                      onChange={(e) =>
                        setNewChemicalProduct((prev) => ({
                          ...prev,
                          quantity: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Unidad
                    </label>
                    <select
                      value={newChemicalProduct.unit || "ml"}
                      onChange={(e) =>
                        setNewChemicalProduct((prev) => ({
                          ...prev,
                          unit: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    >
                      <option value="ml">Mililitros (ml)</option>
                      <option value="g">Gramos (g)</option>
                      <option value="unid">Unidades (u)</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Precio de Compra (Por envase)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={newChemicalProduct.purchasePrice}
                      onChange={(e) =>
                        setNewChemicalProduct((prev) => ({
                          ...prev,
                          purchasePrice: e.target.value,
                        }))
                      }
                      className="w-full pl-8 pr-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-semibold"
                    />
                  </div>
                </div>

                <div className="mt-2 bg-primary-600/5 p-3 rounded-lg border border-primary-600/10 flex justify-between items-center animate-in fade-in duration-300">
                  <span className="text-sm font-medium text-text-muted">
                    Costo real:
                  </span>
                  <span className="text-lg font-bold text-primary-600">
                    $
                    {(
                      (parseFloat(newChemicalProduct.purchasePrice) || 0) /
                      (parseFloat(newChemicalProduct.quantity) || 1)
                    ).toFixed(4)}{" "}
                    por {newChemicalProduct.unit}
                  </span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => {
                  setAddingChemicalProduct(false);
                  setNewChemicalProduct({
                    name: "",
                    quantity: "",
                    unit: "ml",
                    purchasePrice: "",
                    stock: "",
                    minStock: "",
                  });
                }}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await handleAddChemicalProduct();
                    setAddingChemicalProduct(false);
                    // Reset form after successful add
                    setNewChemicalProduct({
                      name: "",
                      quantity: "",
                      unit: "ml",
                      purchasePrice: "",
                      stock: "",
                      minStock: "",
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner ${
                  isSubmitting
                    ? "opacity-60 cursor-wait animate-pulse pointer-events-none"
                    : ""
                }`}
              >
                {isSubmitting ? "Guardando..." : "Agregar Producto"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over para Edición de Consumibles */}
      {editingConsumableItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingConsumableItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Editar Consumible
                </h3>
                <p className="text-sm text-text-muted">
                  Gestión de insumos y costos
                </p>
              </div>
              <button
                onClick={() => setEditingConsumableItem(null)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  Información del Consumible
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Nombre del Consumible
                  </label>
                  <input
                    type="text"
                    value={editConsumableForm.name || ""}
                    onChange={(e) =>
                      setEditConsumableForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Unidad de Medida
                  </label>
                  <select
                    value={editConsumableForm.unit || "ml"}
                    onChange={(e) =>
                      setEditConsumableForm((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="ml">Mililitros (ml)</option>
                    <option value="g">Gramos (g)</option>
                    <option value="u">Unidades (u)</option>
                  </select>
                </div>
              </div>

              {/* Costos y Empaque */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <DollarSign size={18} className="text-primary-600" />
                  Costos y Empaque
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Precio Compra (Caja)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={editConsumableForm.purchasePrice ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          const newPrice = val === "" ? 0 : parseFloat(val);
                          const pkgSize = editConsumableForm.packageSize || 1;
                          const newUnitCost =
                            pkgSize > 0 ? newPrice / pkgSize : 0;

                          setEditConsumableForm((prev) => ({
                            ...prev,
                            purchasePrice: newPrice,
                            unitCost: parseFloat(newUnitCost.toFixed(4)),
                          }));
                        }}
                        className="w-full pl-8 pr-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Unidades por Paquete
                    </label>
                    <input
                      type="number"
                      placeholder="1"
                      value={editConsumableForm.packageSize ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const newSize = val === "" ? 0 : parseFloat(val);
                        const price = editConsumableForm.purchasePrice || 0;
                        const newUnitCost = newSize > 0 ? price / newSize : 0;

                        setEditConsumableForm((prev) => ({
                          ...prev,
                          packageSize: newSize,
                          unitCost: parseFloat(newUnitCost.toFixed(4)),
                        }));
                      }}
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Costo Unitario (Calculado)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.0001"
                      value={editConsumableForm.unitCost ?? ""}
                      disabled
                      className="w-full pl-8 pr-4 py-2 bg-surface-highlight text-text-muted border border-border rounded-lg cursor-not-allowed font-semibold"
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    Costo por {editConsumableForm.unit || "unidad"} resultante.
                    Se actualizará automáticamente.
                  </p>
                </div>
              </div>

              {/* Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-primary-400" />
                  Inventario y Alertas
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-orange-500/5 p-4 rounded-xl border border-orange-500/20">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main">
                      Stock Actual
                    </label>
                    <input
                      type="number"
                      value={editConsumableForm.stockQty ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditConsumableForm((prev) => ({
                          ...prev,
                          stockQty: val === "" ? 0 : parseFloat(val),
                        }));
                      }}
                      className="w-full px-4 py-2 border border-primary-500/20 rounded-lg focus:border-primary-400 focus:ring-4 focus:ring-primary-400/20 outline-none transition-all bg-surface font-bold text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Alerta (Mínimo)
                    </label>
                    <input
                      type="number"
                      value={editConsumableForm.minStockAlert ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditConsumableForm((prev) => ({
                          ...prev,
                          minStockAlert: val === "" ? 0 : parseFloat(val),
                        }));
                      }}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:border-primary-400 outline-none transition-all bg-surface text-text-main"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setEditingConsumableItem(null)}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingConsumableItem && editConsumableForm) {
                    handleUpdateConsumable(
                      editingConsumableItem.id,
                      editConsumableForm,
                    );
                    setEditingConsumableItem(null);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Actualizar Consumible
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over para AGREGAR Consumibles */}
      {addingConsumableItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setAddingConsumableItem(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Agregar Consumible
                </h3>
                <p className="text-sm text-text-muted">
                  Nuevo insumo para el inventario
                </p>
              </div>
              <button
                onClick={() => setAddingConsumableItem(false)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <Package size={18} className="text-blue-600" />
                  Información del Consumible
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Nombre del Consumible
                  </label>
                  <input
                    type="text"
                    placeholder="ej. Algodón, Guantes, Toallas"
                    value={newConsumable.name}
                    onChange={(e) =>
                      setNewConsumable((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Unidad de Medida
                  </label>
                  <input
                    type="text"
                    placeholder="ej. gramo, unidad, par, metro"
                    value={newConsumable.unit}
                    onChange={(e) =>
                      setNewConsumable((prev) => ({
                        ...prev,
                        unit: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                  />
                </div>
              </div>

              {/* Costos y Paquete */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <DollarSign size={18} className="text-primary-600" />
                  Información de Compra
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Precio de Compra
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-gray-400 font-bold">
                        $
                      </span>
                      <input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        value={newConsumable.purchasePrice}
                        onChange={(e) =>
                          setNewConsumable((prev) => ({
                            ...prev,
                            purchasePrice: e.target.value,
                          }))
                        }
                        className="w-full pl-8 pr-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-semibold"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Tamaño del Paquete
                    </label>
                    <input
                      type="number"
                      step="1"
                      placeholder="100"
                      value={newConsumable.packageSize}
                      onChange={(e) =>
                        setNewConsumable((prev) => ({
                          ...prev,
                          packageSize: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none"
                    />
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
                  <p className="text-xs text-text-muted">
                    <span className="font-semibold text-emerald-500">
                      Ejemplo:
                    </span>{" "}
                    Si compras un paquete de 100 guantes por $13.00, el costo
                    por unidad será $0.13
                  </p>
                </div>
              </div>

              {/* Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <AlertTriangle size={18} className="text-orange-500" />
                  Inventario Inicial
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-orange-500/5 p-4 rounded-xl border border-orange-500/10">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-text-main">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={newConsumable.stockQty}
                      onChange={(e) =>
                        setNewConsumable((prev) => ({
                          ...prev,
                          stockQty: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-primary-500/20 rounded-lg focus:border-primary-400 focus:ring-4 focus:ring-primary-400/20 outline-none transition-all bg-surface font-bold text-text-main"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-text-muted">
                      Alerta (Mínimo)
                    </label>
                    <input
                      type="number"
                      placeholder="10"
                      value={newConsumable.minStockAlert}
                      onChange={(e) =>
                        setNewConsumable((prev) => ({
                          ...prev,
                          minStockAlert: e.target.value,
                        }))
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:border-primary-400 outline-none transition-all bg-surface text-text-main"
                    />
                  </div>
                </div>

                <div className="bg-surface-highlight border border-border rounded-lg p-3">
                  <p className="text-xs text-text-muted">
                    <span className="font-semibold">Nota:</span> Recibirás una
                    alerta cuando el stock llegue al nivel mínimo configurado
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => {
                  setAddingConsumableItem(false);
                  setNewConsumable({
                    name: "",
                    unit: "",
                    purchasePrice: "",
                    packageSize: "",
                    stockQty: "",
                    minStockAlert: "",
                  });
                }}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    await handleAddConsumable();
                    setAddingConsumableItem(false);
                    // Reset form after successful add
                    setNewConsumable({
                      name: "",
                      unit: "",
                      purchasePrice: "",
                      packageSize: "",
                      stockQty: "",
                      minStockAlert: "",
                    });
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner ${
                  isSubmitting
                    ? "opacity-60 cursor-wait animate-pulse pointer-events-none"
                    : ""
                }`}
              >
                {isSubmitting ? "Guardando..." : "Agregar Consumible"}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Slide-over para Edición de Extras */}
      {editingExtraItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingExtraItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-[400px] bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold text-text-main">
                  Editar Extra
                </h3>
                <p className="text-xs text-text-muted">
                  Configuración de servicios adicionales
                </p>
              </div>
              <button
                onClick={() => setEditingExtraItem(null)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-400" />
                  Detalles del Extra
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Nombre del Extra
                  </label>
                  <input
                    type="text"
                    value={editExtraForm.name || ""}
                    onChange={(e) =>
                      setEditExtraForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full h-11 px-4 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Precio Sugerido (por Uña/Unidad)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-text-muted font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={editExtraForm.priceSuggested ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditExtraForm((prev) => ({
                          ...prev,
                          priceSuggested: val === "" ? 0 : parseFloat(val),
                        }));
                      }}
                      className="w-full h-11 pl-8 pr-4 bg-surface text-text-main border border-border rounded-xl transition-all duration-200 focus:ring-2 focus:ring-primary-400 focus:border-primary-400 outline-none font-bold"
                    />
                  </div>
                  <p className="text-xs text-text-muted">
                    Este precio se usará como base para el cálculo total (Precio
                    * Cantidad).
                  </p>
                </div>

                {/* Estado Activo */}
                <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl border border-border">
                  <div>
                    <span className="block font-semibold text-text-main">
                      Estado del Servicio
                    </span>
                    <span className="text-xs text-text-muted">
                      Visible en el catálogo de ventas
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setEditExtraForm((prev) => ({
                        ...prev,
                        active: !prev.active,
                      }))
                    }
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      editExtraForm.active
                        ? "bg-primary-600"
                        : "bg-primary-700/50"
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        editExtraForm.active ? "translate-x-6" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setEditingExtraItem(null)}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
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
                className="flex-1 px-4 py-3 rounded-xl bg-primary-400 text-white font-bold shadow-lg shadow-primary-400/20 hover:bg-primary-600 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Actualizar Extra
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Slide-over para Edición de Personal */}
      {editingStaffItem && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingStaffItem(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-surface h-full shadow-2xl border-l border-border flex flex-col animate-in slide-in-from-right duration-300">
            <div className="px-6 py-4 bg-surface-highlight border-b border-border flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-text-main">
                  Editar Perfil
                </h3>
                <p className="text-sm text-text-muted">
                  Gestión de empleado y comisiones
                </p>
              </div>
              <button
                onClick={() => setEditingStaffItem(null)}
                className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Identidad */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <Users size={18} className="text-primary-600" />
                  Identidad
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Nombre del Empleado
                  </label>
                  <input
                    type="text"
                    value={editStaffForm.name || ""}
                    onChange={(e) =>
                      setEditStaffForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg focus:border-primary-500 focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted flex items-center gap-1">
                    <Key size={14} /> PIN de Acceso
                  </label>
                  <input
                    type="text"
                    maxLength={4}
                    value={editStaffForm.pin || ""}
                    onChange={(e) =>
                      setEditStaffForm((prev) => ({
                        ...prev,
                        pin: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-mono tracking-widest"
                  />
                  <p className="text-xs text-text-muted">
                    PIN de 4 dígitos para iniciar sesión.
                  </p>
                </div>
              </div>

              {/* Finanzas */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <Percent size={18} className="text-primary-600" />
                  Configuración Financiera
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Porcentaje de Comisión
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={editStaffForm.commissionPct ?? ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditStaffForm((prev) => ({
                          ...prev,
                          commissionPct: val === "" ? 0 : parseFloat(val),
                        }));
                      }}
                      className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 outline-none font-bold text-lg"
                    />
                    <span className="absolute right-4 top-3 text-gray-400 font-bold">
                      %
                    </span>
                  </div>
                  <div className="p-3 bg-primary-600/10 rounded-lg text-sm text-primary-500">
                    Este empleado gana el{" "}
                    <strong>{editStaffForm.commissionPct ?? 0}%</strong> de cada
                    servicio realizado (calculado automáticamente).
                  </div>
                </div>
              </div>

              {/* Apariencia */}
              <div className="space-y-4">
                <h4 className="font-semibold text-text-main border-b border-border pb-2 flex items-center gap-2">
                  <Sparkles size={18} className="text-primary-600" />
                  Apariencia
                </h4>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-text-muted">
                    Color de Perfil
                  </label>
                  <select
                    value={editStaffForm.color}
                    onChange={(e) =>
                      setEditStaffForm((prev) => ({
                        ...prev,
                        color: e.target.value,
                      }))
                    }
                    className="w-full px-4 py-2 bg-surface text-text-main border border-border rounded-lg transition-all duration-200 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 focus:outline-none"
                  >
                    <option value="from-pink-500 to-rose-600">
                      Rosa (Pink)
                    </option>
                    <option value="from-purple-500 to-indigo-600">
                      Morado (Purple)
                    </option>
                    <option value="from-blue-500 to-cyan-600">
                      Azul (Blue)
                    </option>
                    <option value="from-emerald-500 to-teal-600">
                      Esmeralda (Emerald)
                    </option>
                    <option value="from-orange-500 to-amber-600">
                      Naranja (Orange)
                    </option>
                    <option value="from-gray-700 to-slate-800">
                      Oscuro (Dark)
                    </option>
                  </select>
                  <div
                    className={`h-12 w-full rounded-lg bg-linear-to-r ${editStaffForm.color} shadow-lg mt-2 flex items-center justify-center text-white font-bold opacity-90`}
                  >
                    Vista Previa
                  </div>
                </div>
              </div>

              {/* Estado */}
              <div className="flex items-center justify-between p-4 bg-surface-highlight rounded-xl border border-border">
                <div>
                  <span className="block font-semibold text-text-main">
                    Estado de la cuenta
                  </span>
                  <span className="text-xs text-text-muted">
                    {editStaffForm.active
                      ? "El empleado puede acceder al sistema"
                      : "Acceso bloqueado"}
                  </span>
                </div>
                <button
                  onClick={() =>
                    setEditStaffForm((prev) => ({
                      ...prev,
                      active: !prev.active,
                    }))
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    editStaffForm.active
                      ? "bg-primary-600"
                      : "bg-primary-700/50"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      editStaffForm.active ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-border bg-surface-highlight flex gap-3">
              <button
                onClick={() => setEditingStaffItem(null)}
                className="bg-background border border-border text-text-muted hover:bg-surface-highlight hover:text-text-main font-semibold rounded-xl px-4 py-2 transition-all flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingStaffItem && editStaffForm) {
                    handleUpdateUser(editingStaffItem.id, editStaffForm);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-primary-600 text-white font-bold shadow-lg shadow-primary-600/20 hover:bg-primary-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over para CREAR Nuevo Servicio */}

      <ConfirmationModal
        isOpen={itemToDelete !== null}
        onClose={() => setItemToDelete(null)}
        onConfirm={handleConfirmAction}
        title={getConfirmationModalProps().title}
        message={getConfirmationModalProps().message}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default OwnerConfigTab;
