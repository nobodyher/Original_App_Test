import { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import type { Toast, AppUser } from "./types";

import LoadingScreen from "./components/ui/LoadingScreen";

import NotificationToast from "./components/ui/NotificationToast";
import * as userService from "./services/userService";
import * as salonService from "./services/salonService";
import * as inventoryService from "./services/inventoryService";
import * as expenseService from "./services/expenseService";

import StaffScreen from "./features/staff/StaffScreen";
import OwnerScreen from "./features/admin/OwnerScreen";
import LoginScreen from "./features/auth/LoginScreen";

import { useAuth } from "./hooks/useAuth"; 
import { useSalonData } from "./hooks/useSalonData"; 

// Tailwind injected in main.tsx

const App = () => {
  // ====== Estado ======
  const { currentUser, users, loading, initialized, login, logout } = useAuth();
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
  } = useSalonData(initialized);

  const [notification, setNotification] = useState<Toast | null>(null);

  // ====== Notificaciones ======
  const showNotification = (
    message: string,
    type: Toast["type"] = "success",
  ) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 2800);
  };

  useEffect(() => {
    // Inicializar catálogo usando el servicio
    inventoryService.initializeCatalog()
      .then((seeded) => {
        if (seeded) showNotification("Catálogo inicializado");
      })
      .catch((error) => {
        console.error("Error al inicializar catálogo", error);
        showNotification("Error al inicializar catálogo", "error");
      });
  }, []);

  if (loading) {
  return <LoadingScreen />;
}

  return (
    <>
      <Routes>
        <Route path="/login" element={
          currentUser ? <Navigate to={currentUser.role === 'owner' ? '/admin' : '/staff'} replace /> : 
          <LoginScreen 
            users={users} 
            loading={loading} 
            onLogin={login} 
            showNotification={showNotification} 
            notification={notification}
          />
        } />
        
        <Route path="/admin" element={
          <ProtectedRoute currentUser={currentUser} allowedRole="owner">
             <OwnerScreen 
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
                showNotification={showNotification}
                addExpense={expenseService.addExpense}
                deleteExpense={expenseService.deleteExpense}
                updateServiceCost={salonService.updateServiceCost}
                softDeleteService={salonService.softDeleteServiceAdmin}
                permanentlyDeleteService={salonService.permanentlyDeleteService}
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
                initializeMaterialsData={inventoryService.initializeMaterialsData}
                onLogout={() => {
                  logout();
                  showNotification("Sesión cerrada correctamente", "info");
                }}
              />
          </ProtectedRoute>
        } />

        <Route path="/staff" element={
          <ProtectedRoute currentUser={currentUser} allowedRole="staff">
            <StaffScreen
              currentUser={currentUser!}
              services={services}
              catalogServices={catalogServices}
              catalogExtras={catalogExtras}
              materialRecipes={materialRecipes}
              chemicalProducts={chemicalProducts}
              consumables={consumables}
              notification={notification}
              showNotification={showNotification}
              onLogout={logout}
              addService={(user, data, recipes, chemProducts, total) => 
                salonService.addService(user, data, recipes, serviceRecipes, consumables, chemProducts, catalogServices, total)
              }
              updateService={salonService.updateService}
              softDeleteService={salonService.softDeleteService}
            />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to={currentUser ? (currentUser.role === 'owner' ? '/admin' : '/staff') : '/login'} replace />} />
      </Routes>
      <NotificationToast notification={notification} />
    </>
  );
};

// Componente para proteger rutas
const ProtectedRoute = ({ 
  currentUser, 
  allowedRole, 
  children 
}: { 
  currentUser: AppUser | null, 
  allowedRole: string, 
  children: React.ReactNode 
}) => {
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== allowedRole) {
    return <Navigate to={currentUser.role === 'owner' ? '/admin' : '/staff'} replace />;
  }

  return <>{children}</>;
};

export default App;
