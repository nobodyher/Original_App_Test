import React, { useState, useEffect } from "react";
import {
  ShoppingCart,
  Package,
  Users,
  Beaker,
  PlusCircle,
  Star,
  Menu,
  X,
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

// Import Tab Manager Components
import { ServicesManager } from "./tabs/ServicesManager";
import { StaffManager } from "./tabs/StaffManager";
import { ConsumablesManager } from "./tabs/ConsumablesManager";
import { ChemicalsManager } from "./tabs/ChemicalsManager";
import { ExtrasManager } from "./tabs/ExtrasManager";
import { ClientsManager } from "./tabs/ClientsManager";

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
  transactions?: Service[];
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
  deleteClient: deleteClientProp,
}) => {
  // ==========================================================================
  // STATE MANAGEMENT (Navigation Only)
  // ==========================================================================

  const [activeTab, setActiveTab] = useState<ConfigTab>(initialTab || "services");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync internal state with external prop changes (Sidebar navigation)
  useEffect(() => {
    if (initialTab) {
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
      id: "services",
      label: "Servicios",
      icon: ShoppingCart,
      description: "Catálogo de servicios",
    },
    {
      id: "consumables",
      label: "Consumibles",
      icon: Package,
      description: "Productos desechables",
    },
    {
      id: "materials",
      label: "Químicos",
      icon: Beaker,
      description: "Productos químicos",
    },
    {
      id: "extras",
      label: "Extras",
      icon: PlusCircle,
      description: "Servicios adicionales",
    },
    {
      id: "personal",
      label: "Personal",
      icon: Users,
      description: "Gestión de empleados",
    },
    {
      id: "clients",
      label: "Clientes",
      icon: Star,
      description: "Base de datos de clientes",
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
            className={`${
              isMobileMenuOpen
                ? "translate-x-0"
                : "-translate-x-full lg:translate-x-0"
            } fixed lg:sticky top-0 left-0 h-full w-64 bg-surface border-r border-border transition-transform duration-300 ease-in-out z-40 lg:block overflow-y-auto`}
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
            
            {/* Admin Profile Section - Visible on all tabs for quick access */}


            {/* Services Tab */}
            {activeTab === "services" && (
              <ServicesManager
                catalogServices={catalogServices}
                materialRecipes={materialRecipes || []}
                serviceRecipes={serviceRecipes || []}
                consumables={consumables}
                chemicalProducts={chemicalProducts}
                currentUser={currentUser}
                addCatalogService={addCatalogService}
                updateCatalogService={updateCatalogService}
                deleteCatalogService={deleteCatalogService}
                showNotification={showNotification}
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

            {/* Consumables Tab */}
            {activeTab === "consumables" && (
              <ConsumablesManager
                consumables={consumables}
                currentUser={currentUser}
                addConsumable={addConsumable}
                updateConsumable={updateConsumable}
                deleteConsumable={deleteConsumable}
                showNotification={showNotification}
              />
            )}

            {/* Materials/Chemicals Tab */}
            {activeTab === "materials" && (
              <ChemicalsManager
                chemicalProducts={chemicalProducts}
                currentUser={currentUser}
                addChemicalProduct={addChemicalProduct}
                updateChemicalProduct={updateChemicalProduct}
                deleteChemicalProduct={deleteChemicalProduct}
                showNotification={showNotification}
              />
            )}

            {/* Extras Tab */}
            {activeTab === "extras" && (
              <ExtrasManager
                catalogExtras={catalogExtras}
                currentUser={currentUser}
                addExtra={addExtra}
                updateExtra={updateExtra}
                deleteExtra={deleteExtra}
                showNotification={showNotification}
              />
            )}

            {/* Clients Tab */}
            {activeTab === "clients" && (
              <ClientsManager
                clients={clients}
                currentUser={currentUser}
                deleteClient={deleteClientProp}
                showNotification={showNotification}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OwnerConfigTab;
