import React, { useState } from "react";
import ChemicalsManager from "./config/ChemicalsManager";
import ServicesManager from "./config/ServicesManager";
import ConsumablesManager from "./config/ConsumablesManager";
import StaffManager from "./config/StaffManager";
import ExtrasManager from "./config/ExtrasManager";
import ClientsManager from "./config/ClientsManager";
import {
  Users,
  ShoppingCart,
  Package,
  Plus,
  Beaker,
  Sparkles,
} from "lucide-react";
import type {
  AppUser,
  CatalogService,
  CatalogExtra,
  MaterialRecipe,
  ServiceRecipe,
  Consumable,
  ChemicalProduct,
  Toast,
  Client,
} from "../../../types";

interface OwnerConfigTabProps {
  users: AppUser[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  materialRecipes: MaterialRecipe[];
  serviceRecipes: ServiceRecipe[];
  consumables: Consumable[];
  chemicalProducts: ChemicalProduct[];
  clients: Client[];
  showNotification: (message: string, type?: Toast["type"]) => void;

  // User Actions
  createNewUser: (data: any) => Promise<void>;
  updateUser: (userId: string, data: Partial<AppUser>) => Promise<void>;
  updateUserCommission: (userId: string, newCommission: number) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUserPermanently: (userId: string) => Promise<void>;

  // Inventory/Catalog Actions
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





const OwnerConfigTab: React.FC<OwnerConfigTabProps> = ({
  users,
  catalogServices,
  catalogExtras,
  materialRecipes,
  serviceRecipes,
  consumables,
  chemicalProducts,
  clients,
  showNotification,
  createNewUser,
  updateUser,
  // updateUserCommission, // unused directly here as handled by updateUser usually, but kept in props
  // deactivateUser, // Unused as handled by StaffManager internal toggle via onUpdate
  deleteUserPermanently,
  addCatalogService,
  updateCatalogService,
  deleteCatalogService,
  addExtra,
  updateExtra,
  deleteExtra,
  addConsumable,
  updateConsumable,
  deleteConsumable,
  addChemicalProduct,
  updateChemicalProduct,
  deleteChemicalProduct,
  initializeMaterialsData,
}) => {
  const [activeTab, setActiveTab] = useState<
    "services" | "consumables" | "personal" | "extras" | "materials" | "clients"
  >("services");

  React.useEffect(() => {
     // No specialized loading state needed for now, handled by sub-components or data hooks
  }, [activeTab]);

  const tabs = [
    { id: "services", label: "Catálogo", icon: ShoppingCart, color: "text-purple-600" },
    { id: "consumables", label: "Consumibles", icon: Package, color: "text-blue-600" },
    { id: "personal", label: "Personal", icon: Users, color: "text-pink-600" },
    { id: "clients", label: "Clientes", icon: Users, color: "text-indigo-600" },
    { id: "extras", label: "Extras", icon: Plus, color: "text-orange-600" },
    { id: "materials", label: "Químicos", icon: Beaker, color: "text-green-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Navigation */}
        <nav className="lg:w-64 shrink-0 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ease-in-out hover:pl-5 font-medium text-left relative overflow-hidden group ${
                  isActive
                    ? "bg-white shadow-sm text-purple-700"
                    : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 h-8 w-1 bg-purple-600 rounded-r-full shadow-[0_0_10px_rgb(147,51,234)] animate-in slide-in-from-left-1"></div>
                )}

                <Icon
                  size={20}
                  className={`transition-colors duration-300 ${
                    isActive ? tab.color : "text-gray-400 group-hover:text-gray-600"
                  }`}
                />
                <span className="relative z-10">{tab.label}</span>
                
                {isActive && (
                  <div className="absolute inset-0 bg-linear-to-r from-purple-50 to-transparent opacity-50"></div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Content Area */}
        <div className={`flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 min-h-[600px] relative ${activeTab === 'clients' ? 'p-5' : 'p-8'}`}>

          {/* Services Tab */}
          {activeTab === "services" && (
            <ServicesManager 
              services={catalogServices}
              chemicals={chemicalProducts}
              consumables={consumables}
              materialRecipes={materialRecipes}
              serviceRecipes={serviceRecipes}
              onAdd={addCatalogService}
              onUpdate={updateCatalogService}
              onDelete={deleteCatalogService}
              onRefresh={() => {}} 
            />
          )}

          {/* Personal Tab - Refactored to StaffManager */}
          {activeTab === "personal" && (
            <StaffManager
              staff={users}
              onRefresh={() => {}} 
              onAdd={createNewUser}
              onUpdate={updateUser}
              onDelete={deleteUserPermanently}
              showNotification={showNotification}
            />
          )}

          {/* Clients Tab */}
          {activeTab === "clients" && (
             <ClientsManager 
                clients={clients}
                onRefresh={() => {}} // Data updates via real-time subscription
                showNotification={showNotification}
             />
          )}

          {activeTab === "extras" && (
            <ExtrasManager 
              extras={catalogExtras}
              onAdd={addExtra}
              onUpdate={updateExtra}
              onDelete={deleteExtra}
              showNotification={showNotification}
              onRefresh={() => {}}
            />
          )}

          {activeTab === "materials" && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Beaker className="text-green-600" />
                Inventario de Materiales Químicos
              </h3>
          {/* Botón de inicialización (solo si no hay datos) */}
          {chemicalProducts.length === 0 && (
            <div className="mb-6 p-6 bg-linear-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                🚀 Inicialización Requerida
              </h4>
              <p className="text-gray-600 mb-4">
                Haz clic en el botón para agregar automáticamente 8 productos
                químicos y 6 recetas de servicios a Firebase.
              </p>
              <button
                onClick={initializeMaterialsData}
                className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl shadow-sm hover:shadow-md transition-all font-bold text-lg"
              >
                ✨ Inicializar Datos de Materiales
              </button>
            </div>
          )}

          
          {/* Sección 1: Productos Químicos */}
          <ChemicalsManager 
            chemicals={chemicalProducts} 
            onAdd={addChemicalProduct}
            onUpdate={updateChemicalProduct}
            onDelete={deleteChemicalProduct}
          />

          {/* Sección 2: Recetas por Servicio */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Recetas de Servicios (Costo de Materiales)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materialRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                 className="bg-white border-2 border-dashed border-gray-300 rounded-xl p-6 hover:border-purple-300 transition-colors group"
                >
                  <h5 className="font-bold text-gray-800 mb-2">
                    {recipe.serviceName}
                  </h5>
                  <div className="text-sm text-gray-600 mb-3">
                    <span className="font-semibold">Categoría:</span>{" "}
                    {recipe.category === "manicura" ? "Manicura" : "Pedicura"}
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Químicos:</span>
                      <span className="font-semibold text-blue-600">
                        ${recipe.chemicalsCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Desechables:</span>
                      <span className="font-semibold text-orange-600">
                        ${recipe.disposablesCost.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-purple-300">
                      <span className="font-bold text-gray-800">TOTAL:</span>
                      <span className="font-bold text-green-600 text-lg">
                        ${recipe.totalCost.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {materialRecipes.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay recetas configuradas. Las recetas se agregarán
                automáticamente.
              </div>
            )}
          </div>

          {/* Nota informativa */}
          <div className="mt-6 p-4 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Información:</strong> Los costos de materiales se
              calculan automáticamente cuando se registra un servicio y se suman
              al campo de reposición. Los productos químicos y recetas se
              inicializarán automáticamente en Firebase.
            </p>
          </div>
        </div>
        )}

          {activeTab === "consumables" && (
            <ConsumablesManager 
              consumables={consumables}
              onAdd={addConsumable}
              onUpdate={updateConsumable}
              onDelete={deleteConsumable}
              showNotification={showNotification}
              onRefresh={() => {}}
            />
          )}

      </div>
      </div>
    </div>
  );
};

export default OwnerConfigTab;
