import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { LicenseLogin } from "./features/auth/LicenseLogin";
import { Routes, Route, Navigate } from "react-router-dom";
import type { Toast, AppUser } from "./types";

import LoadingScreen from "./components/ui/LoadingScreen";
import NotificationToast from "./components/ui/NotificationToast";
import * as userService from "./services/userService";
import * as salonService from "./services/salonService";

import * as inventoryService from "./services/inventoryService";
import * as expenseService from "./services/expenseService";

import { SalonProvider } from "./context/SalonContext";

import StaffScreen from "./features/staff/StaffScreen";
import FinanceScreen from "./features/finance/FinanceScreen";
import OwnerScreen from "./features/admin/OwnerScreen";
import LoginScreen from "./features/auth/LoginScreen";
import MasterAdminScreen from "./features/admin/MasterAdminScreen";
import SuspendedAccountScreen from "./features/auth/SuspendedAccountScreen";
import DeletedAccountScreen from "./features/auth/DeletedAccountScreen";
import { MASTER_ADMIN_UID } from "./constants/app";

import { useAuth } from "./hooks/useAuth";
import { useSalonData } from "./hooks/useSalonData";

// Tailwind injected in main.tsx

const App = () => {
  const [isDeviceAuthorized, setIsDeviceAuthorized] = useState<boolean | null>(
    null,
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsDeviceAuthorized(!!user);
    });
    return () => unsubscribe();
  }, []);

  const authReady = !!isDeviceAuthorized;
  const { currentUser, users, loading, isSuspended, userDocMissing, login, logout } =
    useAuth(authReady);

  const {
    services,
    expenses,
    catalogServices,
    catalogExtras,
    clients,
    historyServices,
    loadHistory,
    loadingHistory,
    historyFullyLoaded,
    inventoryItems,
  } = useSalonData(authReady, currentUser);

  const [notification, setNotification] = useState<Toast | null>(null);

  // ====== Notificaciones ======
  const showNotification = (
    message: string,
    type: Toast["type"] = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2800);
  };

  // Props compartidas para SalonProvider (admin y finance usan el mismo contexto)
  const sharedProviderProps = {
    users,
    currentUser: currentUser!,
    services,
    expenses,
    catalogServices,
    catalogExtras,
    inventoryItems,
    clients,
    historyServices,
    loadHistory,
    loadingHistory,
    historyFullyLoaded,
    showNotification,
    addExpense: (data: Parameters<typeof expenseService.addExpense>[0]) =>
      expenseService.addExpense(data, currentUser?.tenantId || ""),
    deleteExpense: expenseService.deleteExpense,
    updateServiceCost: salonService.updateServiceCost,
    softDeleteService: salonService.softDeleteServiceAdmin,
    permanentlyDeleteService: salonService.permanentlyDeleteService,
    restoreDeletedService: salonService.restoreDeletedService,
    createNewUser: (data: Parameters<typeof userService.createNewUser>[0]) =>
      userService.createNewUser({ ...data, tenantId: currentUser?.tenantId || "" }),
    updateUser: userService.updateUser,
    deleteUserPermanently: userService.deleteUserPermanently,
    addCatalogService: (name: string, price: number, tenantId: string) =>
      inventoryService.addCatalogService(name, price, tenantId),
    updateCatalogService: inventoryService.updateCatalogService,
    deleteCatalogService: inventoryService.deleteCatalogService,
    addExtra: (name: string, price: number, tenantId: string) =>
      inventoryService.addExtra(name, price, tenantId),
    updateExtra: inventoryService.updateExtra,
    deleteExtra: inventoryService.deleteExtra,
    deleteClient: salonService.deleteClient,
    onLogout: () => {
      logout();
      showNotification("Sesión cerrada correctamente", "info");
    },
  };

  // Solo inicializar catálogo si estamos autorizados (BLOQUE ÚNICO)
  useEffect(() => {
    if (authReady) {
      inventoryService
        .initializeCatalog()
        .then((seeded) => {
          if (seeded) showNotification("Catálogo inicializado");
        })
        .catch((error) => {
          console.error("Error al inicializar catálogo", error);
        });
    }
  }, [authReady]);

  // --- Renderizado Condicional ---

  if (isDeviceAuthorized === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-[0_0_15px_rgba(6,182,212,0.4)]"></div>
          <p className="text-primary-500 font-medium animate-pulse">
            Verificando licencia...
          </p>
        </div>
      </div>
    );
  }

  if (!isDeviceAuthorized) {
    return <LicenseLogin />;
  }

  if (loading) {
    return <LoadingScreen />;
  }

  // --- Cuenta Eliminada ---
  // Si está autenticado en Firebase (isDeviceAuthorized) pero Firestore dice explícitamente que no existe doc
  if (!loading && isDeviceAuthorized && userDocMissing) {
    return <DeletedAccountScreen onLogout={logout} />;
  }

  // --- Bloqueo por Suspensión ---
  // Si el tenant está suspendido y el usuario NO es el master admin, mostrar pantalla de bloqueo
  if (isSuspended && currentUser && currentUser.id !== MASTER_ADMIN_UID) {
    return (
      <SuspendedAccountScreen
        onLogout={() => {
          logout();
        }}
      />
    );
  }

  return (
    <>
      <div className="animate-fade-in-up">
        <Routes>
          <Route
            path="/login"
            element={
              currentUser ? (
                <Navigate
                  to={currentUser.role === "owner" ? "/admin" : "/staff"}
                  replace
                />
              ) : (
                <LoginScreen
                  users={users}
                  loading={loading}
                  onLogin={login}
                  showNotification={showNotification}
                  notification={notification}
                />
              )
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRole="owner">
                <SalonProvider {...sharedProviderProps}>
                  <OwnerScreen />
                </SalonProvider>
              </ProtectedRoute>
            }
          />

          <Route
            path="/staff"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRole="staff">
                <StaffScreen
                  currentUser={currentUser!}
                  services={services}
                  clients={clients}
                  catalogServices={catalogServices}
                  catalogExtras={catalogExtras}
                  
                  inventoryItems={inventoryItems}
                  notification={notification}
                  showNotification={showNotification}
                  onLogout={logout}
                  addService={(user, data, items, total) =>
                    salonService.addService(
                      user,
                      data,
                      
                      
                      items,
                      catalogServices,
                      total,
                    )
                  }
                />
              </ProtectedRoute>
            }
          />

          <Route
            path="/finance"
            element={
              <ProtectedRoute currentUser={currentUser} allowedRole="owner">
                <SalonProvider {...sharedProviderProps}>
                  <FinanceScreen />
                </SalonProvider>
              </ProtectedRoute>
            }
          />

          <Route
            path="/saas-control"
            element={
              <MasterAdminRoute currentUser={currentUser}>
                <MasterAdminScreen 
                  showNotification={showNotification} 
                  currentUser={currentUser}
                  onLogout={logout}
                />
              </MasterAdminRoute>
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to={
                  currentUser
                    ? currentUser.role === "owner"
                      ? "/admin"
                      : "/staff"
                    : "/login"
                }
                replace
              />
            }
          />
        </Routes>
      </div>
      <NotificationToast notification={notification} />
    </>
  );
};

// Componente para proteger rutas
const ProtectedRoute = ({
  currentUser,
  allowedRole,
  children,
}: {
  currentUser: AppUser | null;
  allowedRole: string;
  children: React.ReactNode;
}) => {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== allowedRole) {
    return (
      <Navigate
        to={currentUser.role === "owner" ? "/admin" : "/staff"}
        replace
      />
    );
  }

  return <>{children}</>;
};

// Componente para proteger la ruta del Master Admin
const MasterAdminRoute = ({
  currentUser,
  children,
}: {
  currentUser: AppUser | null;
  children: React.ReactNode;
}) => {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.id !== MASTER_ADMIN_UID) {
    return (
      <Navigate
        to={currentUser.role === "owner" ? "/admin" : "/staff"}
        replace
      />
    );
  }

  return <>{children}</>;
};

export default App;
