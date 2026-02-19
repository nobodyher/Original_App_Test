import React from "react";
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
  ShieldCheck,
} from "lucide-react";
import { UserAvatar } from "../ui/UserAvatar";
import { usePhotoUpload } from "../../hooks/usePhotoUpload"; 
import type { AppUser } from "../../types";
import ThemeToggle from "../ui/ThemeToggle"; 
import { useNavigate } from "react-router-dom";
import { MASTER_ADMIN_UID } from "../../constants/app";

export type ViewType = "dashboard" | "history" | "analytics" | "clients" | "admin" | "finance" | "saas-control";
export type ConfigTab = "catalog" | "inventory" | "personal";

interface SidebarProps {
  currentView: ViewType;
  adminSubTab: ConfigTab | null;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
  isAdminOpen: boolean;
  setIsAdminOpen: (isOpen: boolean) => void;
  currentUser: AppUser | null;
  onLogout: () => void;
  onNavigate: (view: ViewType) => void;
  onAdminSubTabChange: (tab: ConfigTab) => void;
  showNotification: (message: string, type?: "success" | "error" | "info") => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  adminSubTab,
  isSidebarOpen,
  setIsSidebarOpen,
  isAdminOpen,
  setIsAdminOpen,
  currentUser,
  onLogout,
  onNavigate,
  onAdminSubTabChange,
  showNotification,
}) => {
  const navigate = useNavigate();
  const { isUploading, handlePhotoChange } = usePhotoUpload(currentUser, showNotification);
  const isMasterAdmin = currentUser?.id === MASTER_ADMIN_UID;

  const handleAdminClick = () => {
    if (!isSidebarOpen) {
      setIsSidebarOpen(true);
      setIsAdminOpen(true);
      return;
    }
    setIsAdminOpen(!isAdminOpen);
  };

  const adminSubItems = [
    { id: "catalog", label: "Catálogo", icon: ShoppingCart },
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "personal", label: "Personal", icon: Users },
  ];

  /* 
     Navigation Logic:
     - For Finance: Navigate to /finance
     - For SaaS Control: Navigate to /saas-control
     - For Others: Call onNavigate (handled by parent or navigate to /admin)
  */
  const handleNavigation = (view: ViewType) => {
    if (view === "finance") {
      navigate("/finance");
    } else if (view === "saas-control") {
      navigate("/saas-control");
    } else {
      onNavigate(view);
    }
  };

  return (
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
          onClick={() => handleNavigation("dashboard")}
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
          onClick={() => handleNavigation("history")}
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
          onClick={() => handleNavigation("analytics")}
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

        {/* Finance */}
        <button
          onClick={() => handleNavigation("finance")}
          className={`w-full flex items-center ${isSidebarOpen ? "justify-start px-4 gap-4" : "justify-center px-2 gap-0"} py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
            currentView === "finance"
              ? "bg-primary-900/20 text-primary-500 border-r-2 border-primary-500 rounded-r-none"
              : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
          }`}
            title={!isSidebarOpen ? "Finanzas" : undefined}
        >
          <DollarSign
            size={20}
            strokeWidth={currentView === "finance" ? 2 : 1.5}
            className={`transition-colors duration-200 ${currentView === "finance" ? "text-primary-500" : "text-text-dim group-hover:text-text-main"}`}
          />
          {isSidebarOpen && <span>Finanzas</span>}
        </button>

        {/* Clients */}
        <button
          onClick={() => handleNavigation("clients")}
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

        {/* SaaS Control - Master Admin Only (MOVED HERE as requested) */}
        {isMasterAdmin && (
          <button
            onClick={() => handleNavigation("saas-control")}
            className={`w-full flex items-center ${isSidebarOpen ? "justify-start px-4 gap-4" : "justify-center px-2 gap-0"} py-3 rounded-xl transition-all duration-200 group text-sm font-semibold ${
              currentView === "saas-control"
                ? "bg-primary-900/20 text-primary-500 border-r-2 border-primary-500 rounded-r-none"
                : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
            }`}
            title={!isSidebarOpen ? "SaaS Control" : undefined}
          >
            <ShieldCheck
              size={20}
              strokeWidth={currentView === "saas-control" ? 2 : 1.5}
              className={`transition-colors duration-200 ${currentView === "saas-control" ? "text-primary-500" : "text-text-dim group-hover:text-text-main"}`}
            />
            {isSidebarOpen && <span>SaaS Control</span>}
          </button>
        )}

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
                  onClick={() => onAdminSubTabChange(subItem.id as ConfigTab)}
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
  );
};

export default Sidebar;
