import React, { useState } from "react";
import {
  Calendar,
  LayoutDashboard,
  TrendingUp,
  Settings,
  LogOut,
  ChevronDown,
  ShoppingCart,
  Package,
  Users,
  Plus,
  Beaker,
  User,
  Menu,
  PanelLeftClose,
} from "lucide-react";
import OwnerDashboard from "./components/OwnerDashboard";
import HistoryTab from "./components/HistoryTab";
import AnalyticsTab from "./components/AnalyticsTab";
import OwnerConfigTab from "./components/OwnerConfigTab";
import type { ConfigTab } from "./components/OwnerConfigTab";
import { Button } from "../../components/ui/Button";
import type {
  AppUser,
  Service,
  Expense,
  CatalogService,
  ServiceRecipe,
  CatalogExtra,
  MaterialRecipe,
  Consumable,
  ChemicalProduct,
  Toast,
  Client,
} from "../../types";
import { DashboardSkeleton, TableSkeleton } from "../../components/ui/Skeleton";

interface OwnerScreenProps {
  users: AppUser[];
  currentUser: AppUser | null;
  services: Service[];
  expenses: Expense[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  materialRecipes: MaterialRecipe[];
  serviceRecipes: ServiceRecipe[];
  consumables: Consumable[];
  chemicalProducts: ChemicalProduct[];
  clients: Client[];
  showNotification: (message: string, type?: Toast["type"]) => void;
  onLogout: () => void;

  // Actions passed down
  addExpense: (data: any) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateServiceCost: (id: string, cost: number) => Promise<void>;
  softDeleteService: (id: string, userId?: string) => Promise<void>;
  permanentlyDeleteService: (id: string) => Promise<void>;
  restoreDeletedService: (id: string) => Promise<void>;

  createNewUser: (data: any) => Promise<void>;
  updateUser: (userId: string, data: Partial<AppUser>) => Promise<void>;
  updateUserCommission: (
    userId: string,
    newCommission: number,
  ) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUserPermanently: (userId: string) => Promise<void>;

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

  addConsumable: (data: any) => Promise<void>;
  updateConsumable: (id: string, data: Partial<Consumable>) => Promise<void>;
  deleteConsumable: (id: string) => Promise<void>;

  addChemicalProduct: (data: any) => Promise<void>;
  updateChemicalProduct: (
    id: string,
    updates: Partial<ChemicalProduct>,
    currentProduct?: ChemicalProduct,
  ) => Promise<void>;
  deleteChemicalProduct: (id: string) => Promise<void>;

  initializeMaterialsData: () => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
}

const OwnerScreen: React.FC<OwnerScreenProps> = (props) => {
  const [currentView, setCurrentView] = useState<
    "dashboard" | "history" | "analytics" | "admin"
  >("dashboard");
  const [adminSubTab, setAdminSubTab] = useState<ConfigTab>("services");
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Trigger loading state on view change
  React.useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, [currentView, adminSubTab]);

  const handleAdminClick = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setIsAdminOpen(true);
      return;
    }
    setIsAdminOpen(!isAdminOpen);
  };

  const handleSubTabClick = (tab: ConfigTab) => {
    setCurrentView("admin");
    setAdminSubTab(tab);
  };

  const adminSubItems = [
    { id: "services", label: "Catálogo", icon: ShoppingCart },
    { id: "consumables", label: "Consumibles", icon: Package },
    { id: "personal", label: "Personal", icon: Users },
    { id: "extras", label: "Extras", icon: Plus },
    { id: "materials", label: "Químicos", icon: Beaker },
  ];

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden">
      <aside
        className={`${isSidebarOpen ? "w-72" : "w-20"} bg-surface border-r border-border flex flex-col shadow-sm relative z-20 shrink-0 transition-all duration-300 ease-in-out`}
      >
        {/* Sidebar Header */}
        <div
          className={`h-24 flex items-center ${isSidebarOpen ? "px-8 justify-between" : "px-0 justify-center"} border-b border-border transition-all duration-300`}
        >
          {isSidebarOpen && (
            <div>
              <h1 className="text-xl font-black text-text-main tracking-tight">
                Nombre<span className="text-primary-500">Local</span>
              </h1>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wider mt-1">
                Panel de Control
              </p>
            </div>
          )}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-text-dim hover:text-text-main p-2 transition-colors rounded-lg hover:bg-surface-highlight"
          >
            {isSidebarOpen ? <PanelLeftClose size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto overflow-x-hidden">
          {/* Dashboard */}
          <button
            onClick={() => setCurrentView("dashboard")}
            className={`w-full flex items-center ${isSidebarOpen ? "justify-start px-4 gap-4" : "justify-center px-2 gap-0"} py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
              currentView === "dashboard"
                ? "bg-primary-900/20 text-primary-500 border-r-2 border-primary-500 rounded-r-none"
                : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
            }`}
            title={!isSidebarOpen ? "Dashboard" : undefined}
          >
            <LayoutDashboard
              size={20}
              strokeWidth={currentView === "dashboard" ? 2 : 1.5}
              className={`transition-colors duration-200 ${currentView === "dashboard" ? "text-primary-500" : "text-text-dim group-hover:text-text-main"}`}
            />
            {isSidebarOpen && <span>Dashboard</span>}
          </button>

          {/* History */}
          <button
            onClick={() => setCurrentView("history")}
            className={`w-full flex items-center ${isSidebarOpen ? "justify-start px-4 gap-4" : "justify-center px-2 gap-0"} py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
              currentView === "history"
                ? "bg-primary-900/20 text-primary-500 border-r-2 border-primary-500 rounded-r-none"
                : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
            }`}
            title={!isSidebarOpen ? "Historial" : undefined}
          >
            <Calendar
              size={20}
              strokeWidth={currentView === "history" ? 2 : 1.5}
              className={`transition-colors duration-200 ${currentView === "history" ? "text-primary-500" : "text-text-dim group-hover:text-text-main"}`}
            />
            {isSidebarOpen && <span>Historial</span>}
          </button>

          {/* Analytics */}
          <button
            onClick={() => setCurrentView("analytics")}
            className={`w-full flex items-center ${isSidebarOpen ? "justify-start px-4 gap-4" : "justify-center px-2 gap-0"} py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
              currentView === "analytics"
                ? "bg-primary-900/20 text-primary-500 border-r-2 border-primary-500 rounded-r-none"
                : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
            }`}
            title={!isSidebarOpen ? "Analíticas" : undefined}
          >
            <TrendingUp
              size={20}
              strokeWidth={currentView === "analytics" ? 2 : 1.5}
              className={`transition-colors duration-200 ${currentView === "analytics" ? "text-primary-500" : "text-text-dim group-hover:text-text-main"}`}
            />
            {isSidebarOpen && <span>Analíticas</span>}
          </button>

          {/* Administration (Accordion) */}
          <div className="pt-2">
            <button
              onClick={handleAdminClick}
              className={`w-full flex items-center ${isSidebarOpen ? "justify-between px-4" : "justify-center px-2"} py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
                currentView === "admin"
                  ? "text-primary-500 bg-primary-900/20 border-r-2 border-primary-500 rounded-r-none"
                  : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
              }`}
              title={!isSidebarOpen ? "Administración" : undefined}
            >
              <div
                className={`flex items-center ${isSidebarOpen ? "gap-4" : "gap-0"}`}
              >
                <Settings
                  size={20}
                  strokeWidth={currentView === "admin" ? 2 : 1.5}
                  className={`transition-colors duration-200 ${currentView === "admin" ? "text-primary-500" : "text-text-dim group-hover:text-text-main"}`}
                />
                {isSidebarOpen && <span>Administración</span>}
              </div>
              {isSidebarOpen && (
                <ChevronDown
                  size={16}
                  className={`text-text-dim transition-transform duration-300 ${isAdminOpen ? "rotate-180" : ""}`}
                />
              )}
            </button>

            {/* Animated Submenu */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out space-y-1 ${
                isAdminOpen && isSidebarOpen
                  ? "max-h-96 opacity-100 mt-2"
                  : "max-h-0 opacity-0 mt-0"
              }`}
            >
              {adminSubItems.map((subItem) => {
                const isSubActive =
                  currentView === "admin" && adminSubTab === subItem.id;
                const SubIcon = subItem.icon;
                return (
                  <button
                    key={subItem.id}
                    onClick={() => handleSubTabClick(subItem.id as ConfigTab)}
                    className={`w-full flex items-center gap-3 pl-12 pr-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                      isSubActive
                        ? "text-primary-500 font-semibold bg-primary-900/20 border-r-2 border-primary-500 rounded-r-none"
                        : "text-text-muted hover:text-text-main hover:bg-surface-highlight"
                    }`}
                  >
                    <SubIcon
                      size={16}
                      className={
                        isSubActive ? "text-primary-500" : "text-text-dim"
                      }
                    />
                    {subItem.label}
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Sidebar Footer - User Profile */}
        <div className="p-4 mt-auto border-t border-border bg-surface flex flex-col gap-2">
          <div
            className={`flex items-center ${
              isSidebarOpen ? "gap-3 px-3" : "gap-0 justify-center px-0"
            } py-3 rounded-xl bg-surface-highlight/30 border border-border transition-all duration-300`}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary-600 to-primary-800 p-[2px] shadow-sm flex-shrink-0">
              <div className="w-full h-full rounded-full bg-surface-highlight flex items-center justify-center">
                <span className="font-bold text-primary-500 text-xs">
                  {props.currentUser?.name?.substring(0, 2).toUpperCase()}
                </span>
              </div>
            </div>

            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden transition-all duration-300 delay-100">
                <p className="text-sm font-bold text-text-main truncate">
                  {props.currentUser?.name}
                </p>
                <p className="text-xs text-text-muted truncate">Propietario</p>
              </div>
            )}
          </div>

          <button
            onClick={props.onLogout}
            className={`flex items-center justify-center py-2.5 rounded-lg text-sm transition-all duration-200 group border border-red-500/20 text-red-400 hover:bg-red-500/10 ${
              isSidebarOpen ? "w-full gap-3 px-4" : "w-10 h-10 mx-auto"
            }`}
            title="Cerrar Sesión"
          >
            <LogOut
              size={20}
              className="text-red-400 group-hover:text-red-300 transition-colors"
            />
            {isSidebarOpen && (
              <span className="font-medium">Cerrar Sesión</span>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-background scroll-smooth">
        <div className="max-w-7xl mx-auto p-8 lg:p-12 min-h-screen">
          {/* Dynamic Header for Content */}
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
            <div>
              <h2 className="text-3xl font-bold text-text-main tracking-tight">
                {currentView === "dashboard" && "Resumen General"}
                {currentView === "analytics" && "Métricas y Reportes"}
                {currentView === "admin" && (
                  <span className="flex items-center gap-2">
                    Administración
                    <span className="text-text-dim">/</span>
                    <span className="text-primary-500">
                      {adminSubItems.find((i) => i.id === adminSubTab)?.label}
                    </span>
                  </span>
                )}
              </h2>
              <p className="text-text-muted mt-2 text-lg">
                {currentView === "dashboard" &&
                  "Vista rápida del estado de tu negocio hoy."}
                {currentView === "analytics" &&
                  "Analiza el rendimiento y crecimiento de tu salón."}
                {currentView === "admin" &&
                  "Gestiona los recursos y configuración de tu sistema."}
              </p>
            </div>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text-muted bg-surface px-4 py-2 rounded-full border border-border shadow-sm">
                {new Date().toLocaleDateString("es-MX", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
          </header>

          {/* Content Switcher */}
          <div className="relative min-h-[500px]">
            {isLoading ? (
              <div className="absolute inset-0 z-10 bg-surface/50 backdrop-blur-sm flex items-start justify-center pt-20 rounded-3xl">
                {currentView === "admin" ? (
                  <TableSkeleton />
                ) : (
                  <DashboardSkeleton />
                )}
              </div>
            ) : (
              <div className="animate-fade-in-up duration-500">
                {currentView === "dashboard" && (
                  <OwnerDashboard
                    services={props.services}
                    expenses={props.expenses}
                    users={props.users}
                    currentUser={props.currentUser}
                    materialRecipes={props.materialRecipes}
                    catalogServices={props.catalogServices}
                    chemicalProducts={props.chemicalProducts}
                    showNotification={props.showNotification}
                    addExpense={props.addExpense}
                    deleteExpense={props.deleteExpense}
                    updateServiceCost={props.updateServiceCost}
                    softDeleteService={props.softDeleteService}
                    permanentlyDeleteService={props.permanentlyDeleteService}
                    restoreDeletedService={props.restoreDeletedService}
                  />
                )}

                {currentView === "history" && (
                  <HistoryTab services={props.services} users={props.users} />
                )}

                {currentView === "analytics" && (
                  <AnalyticsTab services={props.services} />
                )}

                {currentView === "admin" && (
                  <OwnerConfigTab
                    initialTab={adminSubTab}
                    hideNavigation={true}
                    users={props.users}
                    catalogServices={props.catalogServices}
                    catalogExtras={props.catalogExtras}
                    materialRecipes={props.materialRecipes}
                    serviceRecipes={props.serviceRecipes}
                    consumables={props.consumables}
                    chemicalProducts={props.chemicalProducts}
                    clients={props.clients}
                    currentUser={props.currentUser}
                    showNotification={props.showNotification}
                    createNewUser={props.createNewUser}
                    updateUser={props.updateUser}
                    updateUserCommission={props.updateUserCommission}
                    deactivateUser={props.deactivateUser}
                    deleteUserPermanently={props.deleteUserPermanently}
                    addCatalogService={props.addCatalogService}
                    updateCatalogService={props.updateCatalogService}
                    deleteCatalogService={props.deleteCatalogService}
                    addExtra={props.addExtra}
                    updateExtra={props.updateExtra}
                    deleteExtra={props.deleteExtra}
                    addConsumable={props.addConsumable}
                    updateConsumable={props.updateConsumable}
                    deleteConsumable={props.deleteConsumable}
                    addChemicalProduct={props.addChemicalProduct}
                    updateChemicalProduct={props.updateChemicalProduct}
                    deleteChemicalProduct={props.deleteChemicalProduct}
                    initializeMaterialsData={props.initializeMaterialsData}
                    deleteClient={props.deleteClient}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerScreen;
