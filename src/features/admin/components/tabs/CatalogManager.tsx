import React, { useState } from "react";
import {
  ShoppingCart,
  PlusCircle,
} from "lucide-react";
import type {
  AppUser,
  CatalogService,
  CatalogExtra,
  Toast,
  InventoryItem,
} from "../../../../types";
import { ServicesManager } from "./ServicesManager";
import { ExtrasManager } from "./ExtrasManager";

interface CatalogManagerProps {
  // Services Data & Actions
  catalogServices: CatalogService[];
  inventoryItems?: InventoryItem[];
  addCatalogService: (name: string, price: number) => Promise<string>;
  updateCatalogService: (id: string, data: Partial<CatalogService>) => Promise<void>;
  deleteCatalogService: (id: string) => Promise<void>;

  // Extras Data & Actions
  catalogExtras: CatalogExtra[];
  addExtra: (name: string, price: number) => Promise<void>;
  updateExtra: (id: string, updates: Partial<CatalogExtra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;

  // Shared
  currentUser: AppUser | null;
  showNotification: (message: string, type?: Toast["type"]) => void;
}

export const CatalogManager: React.FC<CatalogManagerProps> = ({
  catalogServices,
  inventoryItems,
  addCatalogService,
  updateCatalogService,
  deleteCatalogService,
  catalogExtras,
  addExtra,
  updateExtra,
  deleteExtra,
  currentUser,
  showNotification,
}) => {
  const [activeTab, setActiveTab] = useState<"services" | "extras">("services");

  return (
    <div className="space-y-6">
      {/* Internal Tab Switcher */}
      <div className="bg-surface rounded-xl border border-border p-1 flex gap-1 w-fit">
        <button
          onClick={() => setActiveTab("services")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "services"
              ? "bg-primary-600 text-white shadow-md"
              : "text-text-muted hover:text-text-main hover:bg-surface-highlight"
          }`}
        >
          <ShoppingCart size={16} />
          Servicios
        </button>
        <button
          onClick={() => setActiveTab("extras")}
          className={`px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${
            activeTab === "extras"
              ? "bg-primary-600 text-white shadow-md"
              : "text-text-muted hover:text-text-main hover:bg-surface-highlight"
          }`}
        >
          <PlusCircle size={16} />
          Extras
        </button>
      </div>

      {/* Content Area */}
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === "services" ? (
          <ServicesManager
            catalogServices={catalogServices}
            inventoryItems={inventoryItems}
            currentUser={currentUser}
            addCatalogService={addCatalogService}
            updateCatalogService={updateCatalogService}
            deleteCatalogService={deleteCatalogService}
            showNotification={showNotification}
          />
        ) : (
          <ExtrasManager
            catalogExtras={catalogExtras}
            currentUser={currentUser}
            addExtra={addExtra}
            updateExtra={updateExtra}
            deleteExtra={deleteExtra}
            showNotification={showNotification}
          />
        )}
      </div>
    </div>
  );
};
