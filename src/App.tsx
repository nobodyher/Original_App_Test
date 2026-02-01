import { useEffect, useState } from "react";
import type { Toast } from "./types";

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

const SalonApp = () => {
  // ====== Estado ======
  const { currentUser, setCurrentUser, users, loading, initialized } = useAuth();
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

  // ====== Render ======
  if (!currentUser) return (
    <LoginScreen 
      users={users} 
      loading={loading} 
      onLogin={setCurrentUser} 
      showNotification={showNotification} 
      notification={notification}
    />
  );

  if (currentUser.role === "owner") return (
    <>
      <OwnerScreen 
        users={users}
        currentUser={currentUser}
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
          setCurrentUser(null);
          showNotification("Sesión cerrada correctamente", "info");
        }}
      />
      <NotificationToast notification={notification} />
    </>
  );
  
  return (
    <StaffScreen
      currentUser={currentUser}
      services={services}
      catalogServices={catalogServices}
      catalogExtras={catalogExtras}
      materialRecipes={materialRecipes}
      chemicalProducts={chemicalProducts}
      consumables={consumables}
      notification={notification}
      showNotification={showNotification}
      onLogout={() => setCurrentUser(null)}
      addService={(user, data, recipes, chemProducts, total) => 
        salonService.addService(user, data, recipes, serviceRecipes, consumables, chemProducts, catalogServices, total)
      }
      updateService={salonService.updateService}
      softDeleteService={salonService.softDeleteService}
    />
  );
};

export default SalonApp;
