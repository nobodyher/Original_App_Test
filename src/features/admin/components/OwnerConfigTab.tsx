import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Users,
  Menu,
  X,
  Database,
} from "lucide-react";
import ConfirmationModal from "../../../components/ui/ConfirmationModal";
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../../firebase";
import type {
  AppUser,
  CatalogService,
  CatalogExtra,
  
  
  
  Toast,
  Service,
  InventoryItem
} from "../../../types";

// Import Tab Manager Components
import { StaffManager } from "./tabs/StaffManager";
import { InventoryManager } from "./tabs/InventoryManager";
import { CatalogManager } from "./tabs/CatalogManager";

export type ConfigTab =
  | "catalog"
  | "inventory"
  | "personal";

interface OwnerConfigTabProps {
  users: AppUser[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  
  
  currentUser: AppUser | null;
  transactions?: Service[];
  inventoryItems?: InventoryItem[]; // Unified items
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
    price: number,
    tenantId: string
  ) => Promise<string>;
  updateCatalogService: (
    id: string,
    data: Partial<CatalogService>,
  ) => Promise<void>;
  deleteCatalogService: (id: string) => Promise<void>;

  addExtra: (name: string, price: number, tenantId: string) => Promise<void>;
  updateExtra: (id: string, data: Partial<CatalogExtra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;
}

const OwnerConfigTab: React.FC<OwnerConfigTabProps> = ({
  users,
  catalogServices,
  catalogExtras,
  currentUser,
  transactions = [],
  showNotification,
  initialTab,
  hideNavigation = false,
  createNewUser,
  updateUser,
  deleteUserPermanently,
  addCatalogService,
  updateCatalogService,
  deleteCatalogService,
  addExtra,
  updateExtra,
  deleteExtra,
  inventoryItems = [], // Unified items
}) => {
  // ==========================================================================
  // INVENTORY HANDLERS (Unified)
  // ==========================================================================
  
  const handleAddInventory = async (product: Partial<InventoryItem>) => {
    if (!currentUser?.tenantId) {
      showNotification("Error: No se identificó la organización", "error");
      return;
    }
    try {
      await addDoc(collection(db, "inventory"), {
        ...product,
        active: true,
        tenantId: currentUser.tenantId,
        createdAt: serverTimestamp(),
      });
      showNotification("Producto agregado al inventario");
    } catch (error) {
      console.error("Error adding inventory:", error);
      showNotification("Error al agregar producto", "error");
    }
  };

  const handleUpdateInventory = async (id: string, updates: Partial<InventoryItem>) => {
    try {
      await updateDoc(doc(db, "inventory", id), updates);
      showNotification("Producto actualizado");
    } catch (error) {
      console.error("Error updating inventory:", error);
      showNotification("Error al actualizar producto", "error");
    }
  };

  // Confirmation Modal State
  const [confirmConfig, setConfirmConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading?: boolean;
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: () => {},
    isLoading: false,
  });

  const closeConfirmation = () =>
    setConfirmConfig((prev) => ({ ...prev, isOpen: false }));

  const handleDeleteInventory = (id: string) => {
    setConfirmConfig({
      isOpen: true,
      title: "Eliminar Producto",
      message:
        "¿Estás seguro de que deseas eliminar este producto del inventario? Esta acción no se puede deshacer.",
      isLoading: false,
      onConfirm: async () => {
        setConfirmConfig((prev) => ({ ...prev, isLoading: true }));
        try {
          await deleteDoc(doc(db, "inventory", id));
          showNotification("Producto eliminado");
          closeConfirmation();
        } catch (error) {
          console.error("Error deleting inventory:", error);
          showNotification("Error al eliminar producto", "error");
          setConfirmConfig((prev) => ({ ...prev, isLoading: false }));
        }
      },
    });
  };
  // ==========================================================================
  // STATE MANAGEMENT (Navigation Only)
  // ==========================================================================

  const [activeTab, setActiveTab] = useState<ConfigTab>(initialTab || "catalog");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync internal state with external prop changes (Sidebar navigation)
  useEffect(() => {
    if (initialTab && initialTab !== activeTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ==========================================================================
  // TAB CONFIGURATION
  // ==========================================================================

  const tabs: {
    id: ConfigTab;
    label: string;
    icon: React.ElementType;
    description: string;
  }[] = [
    {
      id: "catalog",
      label: "Catálogo",
      icon: ShoppingCart,
      description: "Servicios y Extras",
    },
    {
      id: "inventory", // Unified tab
      label: "Inventario",
      icon: Database,
      description: "Gestión unificada de stock",
    },
    {
      id: "personal",
      label: "Personal",
      icon: Users,
      description: "Gestión de empleados",
    },
  ];

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================

  const handleTabChange = (tab: ConfigTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
  };

  // ==========================================================================
  // RENDER
  // ==========================================================================

  return (
    <div className="flex h-[calc(100vh-theme(spacing.20))] bg-background">
      {/* Sidebar Navigation */}
      {!hideNavigation && (
        <>
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden fixed top-24 left-4 z-50 p-3 bg-surface rounded-xl border border-border shadow-lg"
          >
            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* Sidebar */}
          <aside
            className={"fixed lg:sticky top-0 left-0 h-full w-64 bg-surface border-r border-border transition-transform duration-300 ease-in-out z-40 lg:block overflow-y-auto " + (isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0")}
          >
            <div className="p-6 space-y-2">
              <h2 className="text-lg font-bold text-text-main mb-4 px-3">
                Configuración
              </h2>

              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`w-full p-3 rounded-xl text-left transition-all duration-200 group ${
                      isActive
                        ? "bg-primary-600 text-white shadow-lg shadow-primary-600/20"
                        : "hover:bg-surface-highlight text-text-muted hover:text-text-main"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        size={20}
                        className={
                          isActive
                            ? "text-white"
                            : "text-text-muted group-hover:text-primary-600"
                        }
                      />
                      <div>
                        <p
                          className={`font-semibold ${isActive ? "text-white" : ""}`}
                        >
                          {tab.label}
                        </p>
                        <p
                          className={`text-xs ${isActive ? "text-primary-100" : "text-text-muted"}`}
                        >
                          {tab.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          {/* Mobile Overlay */}
          {isMobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 lg:hidden"
              onClick={() => setIsMobileMenuOpen(false)}
            />
          )}
        </>
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden bg-background relative">
        <div className="h-full overflow-y-auto p-4 lg:p-8 scrollbar-hide">
          <div className="w-full max-w-full space-y-6">
            
            {/* Catalog Tab */}
            {activeTab === "catalog" && (
              <CatalogManager
                // Services props
                catalogServices={catalogServices}
                inventoryItems={inventoryItems}
                addCatalogService={async (name, price) => {
                  if (!currentUser?.tenantId) {
                    throw new Error("No se puede crear un servicio sin tenantId válido");
                  }
                  return addCatalogService(name, price, currentUser.tenantId);
                }}
                updateCatalogService={updateCatalogService}
                deleteCatalogService={deleteCatalogService}
                // Extras props
                catalogExtras={catalogExtras}
                addExtra={async (name, price) => {
                  if (!currentUser?.tenantId) {
                    throw new Error("No se puede crear un extra sin tenantId válido");
                  }
                  return addExtra(name, price, currentUser.tenantId);
                }}
                updateExtra={updateExtra}
                deleteExtra={deleteExtra}
                // Shared props
                currentUser={currentUser}
                showNotification={showNotification}
              />
            )}

            {/* Inventory Unified Tab */}
            {activeTab === "inventory" && (
              <InventoryManager
                inventoryItems={inventoryItems}
                currentUser={currentUser}
                showNotification={showNotification}
                onAdd={handleAddInventory}
                onUpdate={handleUpdateInventory}
                onDelete={handleDeleteInventory}
                onEdit={() => {}} // Handled internally by InventoryManager for now
              />
            )}

            {/* Personal/Staff Tab */}
            {activeTab === "personal" && (
              <StaffManager
                users={users}
                currentUser={currentUser}
                transactions={transactions}
                createNewUser={createNewUser}
                updateUser={updateUser}
                deleteUserPermanently={deleteUserPermanently}
                showNotification={showNotification}
              />
            )}
          </div>
        </div>
      </div>

      <ConfirmationModal
        isOpen={confirmConfig.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmConfig.onConfirm}
        title={confirmConfig.title}
        message={confirmConfig.message}
        isLoading={confirmConfig.isLoading}
      />
      
      
    </div>
  );
};

export default OwnerConfigTab;
