import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Menu,
  PanelLeftClose,
  DollarSign,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import OwnerDashboard from "./components/OwnerDashboard";
import HistoryTab from "./components/HistoryTab";
import AnalyticsTab from "./components/AnalyticsTab";
import OwnerConfigTab from "./components/OwnerConfigTab";
import { ClientsManager } from "./components/tabs/ClientsManager";
import type { ConfigTab } from "./components/OwnerConfigTab";
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
    if (saved && ["catalog", "inventory", "personal"].includes(saved)) {
      return saved as ConfigTab;
    }
  } catch (e) {
    console.warn("Failed to read admin tab preference", e);
  }
  return "catalog";
};

const OwnerScreen: React.FC = () => {
  const navigate = useNavigate();
  const {
    users,
    currentUser,
    services,
    expenses,
    catalogServices,
    catalogExtras,
    
    clients,
    inventoryItems, // Unified items
    showNotification,
    onLogout,
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
  >(getInitialView as any);
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

  // Sync admin accordion state with current view - Removed to avoid useEffect state update issues
  // Initial state covers the load case, and handlers cover the interaction cases.





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
    { id: "catalog", label: "Catálogo", icon: ShoppingCart },
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "personal", label: "Personal", icon: Users },
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

              {/* Finance */}
               <button
                onClick={() => {
                  navigate("/finance");
                  setIsMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold text-text-muted hover:bg-surface-highlight hover:text-text-main`}
              >
                <DollarSign size={20} />
                <span>Finanzas</span>
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
      <Sidebar
        currentView={currentView as any}
        adminSubTab={adminSubTab}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        isAdminOpen={isAdminOpen}
        setIsAdminOpen={setIsAdminOpen}
        currentUser={currentUser}
        onLogout={onLogout}
        onNavigate={(view) => {
          if (view === "finance") {
             navigate("/finance");
          } else {
             setCurrentView(view as any);
          }
        }}
        onAdminSubTabChange={(tab) => {
             setCurrentView("admin");
             setAdminSubTab(tab);
        }}
        showNotification={showNotification}
      />

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto relative bg-background scroll-smooth pt-16 md:pt-0">
        <div className="w-full px-6 py-4 min-h-screen">
          {/* Dynamic Header for Content */}
          <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 animate-fade-in-up">
            <div>
              <h2 className="text-3xl font-bold text-text-main tracking-tight">
                {currentView === "dashboard" && "Resumen del Día"}
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
                    catalogServices={catalogServices}
                    inventoryItems={inventoryItems}
                    showNotification={showNotification}
                    onNavigateToInventory={handleNavigateToInventory}

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
