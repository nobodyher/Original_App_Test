import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu,
  PanelLeftClose,
  LayoutDashboard,
  Calendar,
  TrendingUp,
  DollarSign,
  Users,
  Settings,
  ShieldCheck,
  ChevronDown,
  LogOut,
  ShoppingCart,
  Package,
} from "lucide-react";
import { UserAvatar } from "../ui/UserAvatar";
import { usePhotoUpload } from "../../hooks/usePhotoUpload";
import type { AppUser } from "../../types";
import { MASTER_ADMIN_UID } from "../../constants/app";
import type { ViewType, ConfigTab } from "./Sidebar";

interface MobileNavigationProps {
  currentUser: AppUser | null;
  currentView: ViewType;
  adminSubTab?: ConfigTab | null; // Optional if not in admin view
  onNavigate: (view: ViewType) => void;
  onAdminSubTabChange?: (tab: ConfigTab) => void;
  onLogout: () => void;
  showNotification: (message: string, type?: "success" | "error" | "info") => void;
}

const MobileNavigation: React.FC<MobileNavigationProps> = ({
  currentUser,
  currentView,
  adminSubTab,
  onNavigate,
  onAdminSubTabChange,
  onLogout,
  showNotification,
}) => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const { isUploading, handlePhotoChange } = usePhotoUpload(currentUser, showNotification);
  
  const isMasterAdmin = currentUser?.id === MASTER_ADMIN_UID;

  const handleNavigation = (view: ViewType) => {
    onNavigate(view);
    setIsOpen(false);
  };

  const handleAdminSubTabClick = (tab: ConfigTab) => {
    if (onAdminSubTabChange) {
      onAdminSubTabChange(tab);
    }
    setIsOpen(false);
  };

  const adminSubItems = [
    { id: "catalog", label: "Catálogo", icon: ShoppingCart },
    { id: "inventory", label: "Inventario", icon: Package },
    { id: "personal", label: "Personal", icon: Users },
  ];

  return (
    <>
      {/* =========================================================================
          MOBILE HEADER (Visible only on md:hidden)
      ========================================================================= */}
      <div className="fixed top-0 left-0 w-full h-16 bg-surface border-b border-border z-50 flex items-center justify-between px-4 md:hidden">
        {/* Left: Hamburger Menu */}
        <button
          onClick={() => setIsOpen(true)}
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
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />

          {/* Drawer Content */}
          <div className="relative w-4/5 max-w-xs bg-surface h-full shadow-2xl animate-in slide-in-from-left duration-300 flex flex-col">
            <div className="h-16 flex items-center justify-between px-6 border-b border-border">
              <h2 className="text-lg font-black text-text-main">
                <span className="text-primary-500">Voidly</span>
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 text-text-muted hover:text-text-main"
              >
                <PanelLeftClose size={20} />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
              {/* Dashboard */}
              <button
                onClick={() => handleNavigation("dashboard")}
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
                onClick={() => handleNavigation("history")}
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
                onClick={() => handleNavigation("analytics")}
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
                   setIsOpen(false);
                }}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                   location.pathname === "/finance" ? "bg-primary-900/20 text-primary-500" : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                }`}
              >
                <DollarSign size={20} />
                <span>Finanzas</span>
              </button>

              {/* Clients */}
              <button
                onClick={() => handleNavigation("clients")}
                className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                  currentView === "clients"
                    ? "bg-primary-900/20 text-primary-500"
                    : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                }`}
              >
                <Users size={20} />
                <span>Clientes</span>
              </button>
              
              {/* SaaS Control - Master Admin Only */}
              {isMasterAdmin && (
                <button
                    onClick={() => {
                        navigate("/saas-control");
                        setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-semibold ${
                    currentView === "saas-control" || location.pathname === "/saas-control"
                        ? "bg-primary-900/20 text-primary-500"
                        : "text-text-muted hover:bg-surface-highlight hover:text-text-main"
                    }`}
                >
                    <ShieldCheck size={20} />
                    <span>SaaS Control</span>
                </button>
              )}

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
                        onClick={() => handleAdminSubTabClick(subItem.id as ConfigTab)}
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
                title="Cerrar Sesión"
              >
                <LogOut size={20} />
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MobileNavigation;
