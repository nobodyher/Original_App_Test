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
import OwnerScreen from "./features/admin/OwnerScreen";
import LoginScreen from "./features/auth/LoginScreen";

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

  // ✅ CAMBIO 1: Pasamos la autorización al hook
  const authReady = !!isDeviceAuthorized;
  const { currentUser, users, loading, initialized, login, logout } =
    useAuth(authReady);

  // ✅ CAMBIO 2: useSalonData solo corre si auth está lista E inicializado
  const {
    services,
    expenses,
    catalogServices,
    consumables,
    catalogExtras,
    chemicalProducts,
    materialRecipes,
    serviceRecipes,
    clients,
    historyServices,
    loadHistory,
    loadingHistory,
    historyFullyLoaded,
  } = useSalonData(initialized && authReady);

  const [notification, setNotification] = useState<Toast | null>(null);

  // ====== Notificaciones ======
  const showNotification = (
    message: string,
    type: Toast["type"] = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2800);
  };

  // ✅ CAMBIO 3: Solo inicializar catálogo si estamos autorizados (BLOQUE ÚNICO)
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
                <SalonProvider
                  users={users}
                  currentUser={currentUser!}
                  services={services}
                  expenses={expenses}
                  catalogServices={catalogServices}
                  catalogExtras={catalogExtras}
                  materialRecipes={materialRecipes}
                  serviceRecipes={serviceRecipes}
                  consumables={consumables}

                  chemicalProducts={chemicalProducts}
                  clients={clients}
                  historyServices={historyServices}
                  loadHistory={loadHistory}
                  loadingHistory={loadingHistory}
                  historyFullyLoaded={historyFullyLoaded}
                  showNotification={showNotification}
                  addExpense={expenseService.addExpense}
                  deleteExpense={expenseService.deleteExpense}
                  updateServiceCost={salonService.updateServiceCost}
                  softDeleteService={salonService.softDeleteServiceAdmin}
                  permanentlyDeleteService={
                    salonService.permanentlyDeleteService
                  }
                  restoreDeletedService={salonService.restoreDeletedService}
                  createNewUser={userService.createNewUser}
                  updateUser={userService.updateUser}
                  updateUserCommission={userService.updateUserCommission}
                  deactivateUser={userService.deactivateUser}
                  deleteUserPermanently={userService.deleteUserPermanently}
                  addCatalogService={inventoryService.addCatalogService}
                  updateCatalogService={inventoryService.updateCatalogService}
                  deleteCatalogService={inventoryService.deleteCatalogService}
                  addExtra={inventoryService.addExtra}
                  updateExtra={inventoryService.updateExtra}
                  deleteExtra={inventoryService.deleteExtra}
                  addConsumable={inventoryService.addConsumable}
                  updateConsumable={inventoryService.updateConsumable}
                  deleteConsumable={inventoryService.deleteConsumable}
                  addChemicalProduct={inventoryService.addChemicalProduct}
                  updateChemicalProduct={inventoryService.updateChemicalProduct}
                  deleteChemicalProduct={inventoryService.deleteChemicalProduct}
                  initializeMaterialsData={
                    inventoryService.initializeMaterialsData
                  }
                  deleteClient={salonService.deleteClient}
                  onLogout={() => {
                    logout();
                    showNotification("Sesión cerrada correctamente", "info");
                  }}
                >
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
                  materialRecipes={materialRecipes}
                  chemicalProducts={chemicalProducts}
                  consumables={consumables}
                  notification={notification}
                  showNotification={showNotification}
                  onLogout={logout}
                  addService={(user, data, recipes, chemProducts, total) =>
                    salonService.addService(
                      user,
                      data,
                      recipes,
                      serviceRecipes,
                      consumables,
                      chemProducts,
                      catalogServices,
                      total,
                    )
                  }
                />
              </ProtectedRoute>
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

export default App;
