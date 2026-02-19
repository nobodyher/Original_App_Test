import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ShoppingCart,
  Package,
  Users,
} from "lucide-react";
import Sidebar from "../../components/layout/Sidebar";
import type { ViewType } from "../../components/layout/Sidebar";
import MobileNavigation from "../../components/layout/MobileNavigation";
import OwnerDashboard from "./components/OwnerDashboard";
import HistoryTab from "./components/HistoryTab";
import AnalyticsTab from "./components/AnalyticsTab";
import OwnerConfigTab from "./components/OwnerConfigTab";
import { ClientsManager } from "./components/tabs/ClientsManager";
import type { ConfigTab } from "./components/OwnerConfigTab";
// Removed UserAvatar, usePhotoUpload as they are in MobileNavigation
import { useSalonContext } from "../../context/SalonContext";

// Helper functions for persistence
const getInitialView = (): Exclude<ViewType, "finance" | "saas-control"> => {
  try {
    const saved = localStorage.getItem("owner_currentView");
    if (
      saved &&
      ["dashboard", "history", "analytics", "clients", "admin"].includes(saved)
    ) {
      return saved as Exclude<ViewType, "finance" | "saas-control">;
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
    Exclude<ViewType, "finance" | "saas-control">
  >(getInitialView);
  const [adminSubTab, setAdminSubTab] = useState<ConfigTab>(getInitialAdminTab);
  const [isAdminOpen, setIsAdminOpen] = useState(currentView === "admin");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);




  // Persist state changes
  useEffect(() => {
    localStorage.setItem("owner_currentView", currentView);
  }, [currentView]);

  useEffect(() => {
    localStorage.setItem("owner_adminSubTab", adminSubTab);
  }, [adminSubTab]);

  // Sync admin accordion state with current view - Removed to avoid useEffect state update issues
  // Initial state covers the load case, and handlers cover the interaction cases.







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
      <MobileNavigation 
        currentUser={currentUser}
        currentView={currentView}
        adminSubTab={adminSubTab}
        onNavigate={(view) => {
           if (view === "finance") {
             navigate("/finance");
           } else if (view === "saas-control") {
             navigate("/saas-control");
           } else {
             setCurrentView(view);
           }
        }}
        onAdminSubTabChange={(tab) => {
           setCurrentView("admin");
           setAdminSubTab(tab);
        }}
        onLogout={onLogout}
        showNotification={showNotification}
      />

      {/* =========================================================================
          DESKTOP SIDEBAR (Hidden on mobile)
      ========================================================================= */}
      <Sidebar
        currentView={currentView}
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
          } else if (view === "saas-control") {
             navigate("/saas-control");
          } else {
             setCurrentView(view);
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
