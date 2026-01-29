import React, { useState } from "react";
import { LayoutDashboard, TrendingUp, Settings, LogOut } from "lucide-react";
import OwnerDashboard from "./components/OwnerDashboard";
import AnalyticsTab from "./components/AnalyticsTab";
import OwnerConfigTab from "./components/OwnerConfigTab";
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
} from "../../types";

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
  updateUserCommission: (userId: string, newCommission: number) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUserPermanently: (userId: string) => Promise<void>;

  addCatalogService: (name: string, category: "manicura" | "pedicura", price: number) => Promise<void>;
  updateCatalogService: (id: string, data: Partial<CatalogService>) => Promise<void>;
  deleteCatalogService: (id: string) => Promise<void>;

  addExtra: (name: string, price: number) => Promise<void>;
  updateExtra: (id: string, data: Partial<CatalogExtra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;

  addConsumable: (data: any) => Promise<void>;
  updateConsumable: (id: string, data: Partial<Consumable>) => Promise<void>;
  deleteConsumable: (id: string) => Promise<void>;

  addChemicalProduct: (data: any) => Promise<void>;
  updateChemicalProduct: (id: string, updates: Partial<ChemicalProduct>, currentProduct?: ChemicalProduct) => Promise<void>;
  deleteChemicalProduct: (id: string) => Promise<void>;

  initializeMaterialsData: () => Promise<void>;
}

const OwnerScreen: React.FC<OwnerScreenProps> = (props) => {
  const [ownerTab, setOwnerTab] = useState<"dashboard" | "analytics" | "config">("dashboard");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white p-6 shadow-lg">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Panel de Administración</h1>
            <p className="opacity-90">Bienvenid@, {props.currentUser?.name}</p>
          </div>
          <button
            onClick={props.onLogout}
            className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-4 py-2 rounded-lg hover:bg-white/30 transition shadow-sm"
          >
            <LogOut size={20} />
            <span>Salir</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="space-y-6">
          {/* Admin Tabs Navigation */}
          <div className="flex gap-4 border-b-2 border-gray-200 mt-6 mb-10 py-4 px-2 relative z-10 overflow-x-auto">
            <button
              onClick={() => setOwnerTab("dashboard")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold transition whitespace-nowrap ${
                ownerTab === "dashboard"
                  ? "bg-purple-600 text-white shadow-md transform -translate-y-1"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <LayoutDashboard size={20} />
              Dashboard
            </button>
            <button
              onClick={() => setOwnerTab("analytics")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold transition whitespace-nowrap ${
                ownerTab === "analytics"
                  ? "bg-purple-600 text-white shadow-md transform -translate-y-1"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <TrendingUp size={20} />
              Analíticas
            </button>
            <button
              onClick={() => setOwnerTab("config")}
              className={`flex items-center gap-2 px-6 py-3 rounded-t-lg font-semibold transition whitespace-nowrap ${
                ownerTab === "config"
                  ? "bg-purple-600 text-white shadow-md transform -translate-y-1"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              <Settings size={20} />
              Configuración
            </button>
          </div>

          {ownerTab === "dashboard" && (
            <OwnerDashboard
              services={props.services}
              expenses={props.expenses}
              users={props.users}
              currentUser={props.currentUser}
              materialRecipes={props.materialRecipes}
              showNotification={props.showNotification}
              addExpense={props.addExpense}
              deleteExpense={props.deleteExpense}
              updateServiceCost={props.updateServiceCost}
              softDeleteService={props.softDeleteService}
              permanentlyDeleteService={props.permanentlyDeleteService}
              restoreDeletedService={props.restoreDeletedService}
            />
          )}

          {ownerTab === "analytics" && (
            <AnalyticsTab services={props.services} />
          )}

          {ownerTab === "config" && (
            <OwnerConfigTab
              users={props.users}
              catalogServices={props.catalogServices}
              catalogExtras={props.catalogExtras}
              materialRecipes={props.materialRecipes}
              serviceRecipes={props.serviceRecipes}
              consumables={props.consumables}
              chemicalProducts={props.chemicalProducts}
              showNotification={props.showNotification}
              createNewUser={props.createNewUser}
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
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerScreen;
