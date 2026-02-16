import React, { useState, useEffect } from "react";
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
  Menu,
  PanelLeftClose,
} from "lucide-react";
import OwnerDashboard from "./components/OwnerDashboard";
import HistoryTab from "./components/HistoryTab";
import AnalyticsTab from "./components/AnalyticsTab";
import OwnerConfigTab from "./components/OwnerConfigTab";
import { ClientsManager } from "./components/tabs/ClientsManager";
import type { ConfigTab } from "./components/OwnerConfigTab";
import ThemeToggle from "../../components/ui/ThemeToggle";
import { UserAvatar } from "../../components/ui/UserAvatar";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";

import { useSalonContext } from "../../context/SalonContext";

// Helper functions for persistence
const getInitialView = (): "dashboard" | "history" | "analytics" | "clients" | "admin" => {
  try {
    const saved = localStorage.getItem("owner_currentView");
    if (
      saved &&
      ["dashboard", "history", "analytics", "clients", "admin"].includes(saved)
    ) {
      return saved as "dashboard" | "history" | "analytics" | "clients" | "admin";
    }
  } catch (e) {
    console.warn("Failed to read view preference", e);
  }
  return "dashboard";
};

const getInitialAdminTab = (): ConfigTab => {
  try {
    const saved = localStorage.getItem("owner_adminSubTab");
    if (saved) {
      return saved as ConfigTab;
    }
  } catch (e) {
    console.warn("Failed to read admin tab preference", e);
  }
  return "services";
};

const OwnerScreen: React.FC = () => {
  const {
    users,
    currentUser,
    services,
    expenses,
    catalogServices,
    catalogExtras,
    materialRecipes,
    serviceRecipes,
    consumables,
    chemicalProducts,
    clients,
    inventoryItems, // Unified items
    showNotification,
    onLogout,
    addExpense,
    deleteExpense,
    updateServiceCost,
    softDeleteService,
    permanentlyDeleteService,
    restoreDeletedService,
    createNewUser,
    updateUser,
    updateUserCommission,
    deactivateUser,
    deleteUserPermanently,
    addCatalogService,
    updateCatalogService,
    deleteCatalogService,
    addExtra,
    updateExtra,
    deleteExtra,
    deleteClient,
  } = useSalonContext();

  const [currentView, setCurrentView] = useState<
    "dashboard" | "history" | "analytics" | "clients" | "admin"
  >(getInitialView);
  const [adminSubTab, setAdminSubTab] = useState<ConfigTab>(getInitialAdminTab);
  const [isAdminOpen, setIsAdminOpen] = useState(currentView === "admin");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const { isUploading, handlePhotoChange } = usePhotoUpload(currentUser, showNotification);

  // Persist state changes
  useEffect(() => {
    localStorage.setItem("owner_currentView", currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem("owner_adminSubTab", adminSubTab);
  }, [adminSubTab]);

  // Sync admin accordion state with current view
  useEffect(() => {
    if (currentView === "admin") {
      setIsAdminOpen(true);
    }
  }, [currentView]);



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

  const handleNavigateToInventory = (tab: "inventory") => {
    setCurrentView("admin");
    setAdminSubTab(tab as ConfigTab);
    setIsAdminOpen(true);
  };


  const adminSubItems = [
    { id: "services", label: "Catálogo", icon: ShoppingCart },
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "personal", label: "Personal", icon: Users },
    { id: "extras", label: "Extras", icon: Plus },
    { id: "clients", label: "Clientes", icon: Users },
  ];

  return (
    <div className="flex h-screen bg-bg-main overflow-hidden">
      {/* =========================================================================
          MOBILE HEADER (Visible only on md:hidden)
      ========================================================================= */}
      <div className="fixed top-0 left-0 w-full h-16 bg-surface border-b border-border z-50 flex items-center justify-between px-4 md:hidden">
        {/* Left: Hamburger Menu */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-text-main hover:bg-surface-highlight rounded-lg transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Center: Title */}
        <div className="text-center">
          <p className="text-sm font-black text-text-main tracking-tight">
            <span className="text-primary-500">Voidly</span> Admin
          </p>
        </div>

        {/* Right: User Avatar (Interactive) */}
        <div className="flex-shrink-0 relative">
          {isUploading ? (
             <div className="w-8 h-8 rounded-full border-2 border-primary-500 border-t-transparent animate-spin"></div>
          ) : (
             <label className="relative cursor-pointer block">
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*"
                  onChange={handlePhotoChange}
                  disabled={isUploading}
                />
                <UserAvatar
                  image={currentUser?.photoURL}
                  name={currentUser?.name || "Admin"}
                  size="w-8 h-8"
                  className="shadow-sm ring-1 ring-primary-600/20"
                />
                 <div className="absolute inset-0 bg-black/30 rounded-full opacity-0 active:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-3 h-3 bg-white/80 rounded-full" />
                 </div>
             </label>
          )}
        </div>
      </div>

      {/* =========================================================================
          MOBILE DRAWER (Overlay)
      ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-surface h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <h2 className="text-lg font-black text-text-main">
                <span className="text-primary-500">Voidly</span>
              </h2>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-text-muted hover:text-text-main"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {/* Dashboard */}
              <button
                onClick={() => {
                  setCurrentView("dashboard");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                  currentView === "dashboard"
                    ? "bg-primary-900/20 text-primary-500"
                    : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                }`}
              >
                <LayoutDashboard size={20} />
                <span>Dashboard</span>
              </button>

              {/* History */}
              <button
                onClick={() => {
                  setCurrentView("history");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                  currentView === "history"
                    ? "bg-primary-900/20 text-primary-500"
                    : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                }`}
              >
                <Calendar size={20} />
                <span>Historial</span>
              </button>

              {/* Analytics */}
              <button
                onClick={() => {
                  setCurrentView("analytics");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                  currentView === "analytics"
                    ? "bg-primary-900/20 text-primary-500"
                    : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                }`}
              >
                <TrendingUp size={20} />
                <span>Analíticas</span>
              </button>

              {/* Clients */}
              <button
                onClick={() => {
                  setCurrentView("clients");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                  currentView === "clients"
                    ? "bg-primary-900/20 text-primary-500"
                    : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                }`}
              >
                <Users size={20} />
                <span>Clientes</span>
              </button>

              {/* Administration Accordion */}
              <div className="pt-2">
                <button
                  onClick={() => setIsAdminOpen(!isAdminOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                    currentView === "admin"
                      ? "text-primary-500 bg-primary-900/20"
                      : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <Settings size={20} />
                    <span>Administración</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`transition-transform duration-300 ${isAdminOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isAdminOpen && (
                  <div className="mt-2 space-y-1 pl-4">
                    {adminSubItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        onClick={() => {
                          handleSubTabClick(subItem.id as ConfigTab);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm transition-all duration-200 ${
                          currentView === "admin" && adminSubTab === subItem.id
                            ? "text-primary-500 font-semibold bg-primary-900/20"
                            : "text-text-muted hover:text-text-main hover:bg-surface-highlight"
                        }`}
                      >
                        <subItem.icon size={16} />
                        {subItem.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            <div className="p-4 border-t border-border">
               <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DESKTOP SIDEBAR (Hidden on mobile)
      ========================================================================= */}
      <aside
        className={`hidden md:flex ${isSidebarOpen ? "w-52" : "w-20"} bg-surface border-r border-border flex-col shadow-sm relative z-20 shrink-0 transition-all duration-300 ease-in-out`}
      >
        {/* Sidebar Header */}
        <div
          className={`h-24 flex items-center ${isSidebarOpen ? "px-8 justify-between" : "px-0 justify-center"} border-b border-border transition-all duration-300`}
        >
          {isSidebarOpen && (
            <div>
              <h1 className="text-xl font-black text-text-main tracking-tight">
                <span className="text-primary-500">Voidly</span>
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

          {/* Clients */}
          <button
            onClick={() => setCurrentView("clients")}
            className={`w-full flex items-center ${isSidebarOpen ? "justify-start px-4 gap-4" : "justify-center px-2 gap-0"} py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
              currentView === "clients"
                ? "bg-primary-900/20 text-primary-500 border-r-2 border-primary-500 rounded-r-none"
                : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
            }`}
            title={!isSidebarOpen ? "Clientes" : undefined}
          >
            <Users
              size={20}
              strokeWidth={currentView === "clients" ? 2 : 1.5}
              className={`transition-colors duration-200 ${currentView === "clients" ? "text-primary-500" : "text-text-dim group-hover:text-text-main"}`}
            />
            {isSidebarOpen && <span>Clientes</span>}
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
            <div className="flex-shrink-0 relative group">
              {isUploading ? (
                 <div className="w-10 h-10 rounded-full border-2 border-primary-500 border-t-transparent animate-spin flex items-center justify-center bg-surface"></div>
              ) : (
                 <label className="cursor-pointer relative block">
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handlePhotoChange}
                      disabled={isUploading}
                    />
                    <UserAvatar
                      image={currentUser?.photoURL}
                      name={currentUser?.name || "Admin"}
                      size="w-10 h-10"
                      className="shadow-sm ring-2 ring-primary-600/20 transition-transform group-hover:scale-105"
                    />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Settings size={14} className="text-white opacity-80" />
                    </div>
                 </label>
              )}
            </div>

            {isSidebarOpen && (
              <div className="flex-1 overflow-hidden transition-all duration-300 delay-100">
                <p className="text-sm font-bold text-text-main truncate">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-text-muted truncate">Propietario</p>
              </div>
            )}
          </div>

          <div className="mb-2 flex justify-center">
            <ThemeToggle />
          </div>

          <button
            onClick={onLogout}
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
      <main className="flex-1 overflow-y-auto relative bg-background scroll-smooth pt-16 md:pt-0">
        <div className="w-full px-6 py-4 min-h-screen">
          {/* Dynamic Header for Content */}
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
            <div>
              <h2 className="text-3xl font-bold text-text-main tracking-tight">
                {currentView === "dashboard" && "Resumen General"}
                {currentView === "history" && "Historial de Ventas"}
                {currentView === "analytics" && "Métricas y Reportes"}
                {currentView === "clients" && "Gestión de Clientes"}
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
              <div className="animate-fade-in-up duration-500">
                {currentView === "dashboard" && (
                  <OwnerDashboard
                    services={services}
                    expenses={expenses}
                    users={users}
                    currentUser={currentUser}
                    materialRecipes={materialRecipes}
                    catalogServices={catalogServices}
                    inventoryItems={inventoryItems}
                    serviceRecipes={serviceRecipes}
                    showNotification={showNotification}
                    onNavigateToInventory={handleNavigateToInventory}
                    addExpense={addExpense}
                    deleteExpense={deleteExpense}
                    updateServiceCost={updateServiceCost}
                    softDeleteService={softDeleteService}
                    permanentlyDeleteService={permanentlyDeleteService}
                    restoreDeletedService={restoreDeletedService}
                  />
                )}

                {currentView === "history" && (
                  <HistoryTab />
                )}

                {currentView === "analytics" && (
                  <AnalyticsTab services={services} />
                )}

                {currentView === "clients" && (
                  <ClientsManager
                    clients={clients}
                    currentUser={currentUser}
                    deleteClient={deleteClient}
                    showNotification={showNotification}
                  />
                )}

                {currentView === "admin" && (
                  <OwnerConfigTab
                    initialTab={adminSubTab}
                    hideNavigation={true}
                    users={users}
                    catalogServices={catalogServices}
                    catalogExtras={catalogExtras}
                    materialRecipes={materialRecipes}
                    serviceRecipes={serviceRecipes}
                    consumables={consumables}
                    chemicalProducts={chemicalProducts}
                    clients={clients}
                    inventoryItems={inventoryItems}
                    currentUser={currentUser}
                    showNotification={showNotification}
                    createNewUser={createNewUser}
                    updateUser={updateUser}
                    updateUserCommission={updateUserCommission}
                    deactivateUser={deactivateUser}
                    deleteUserPermanently={deleteUserPermanently}
                    addCatalogService={addCatalogService}
                    updateCatalogService={updateCatalogService}
                    deleteCatalogService={deleteCatalogService}
                    addExtra={addExtra}
                    updateExtra={updateExtra}
                    deleteExtra={deleteExtra}
                    deleteClient={deleteClient}
                    transactions={services}
                  />
                )}
              </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default OwnerScreen;
