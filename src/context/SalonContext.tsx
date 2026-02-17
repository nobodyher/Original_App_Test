import React, { createContext, useContext, type ReactNode } from "react";
import type {
  AppUser,
  Service,
  Expense,
  CatalogService,
  CatalogExtra,
  Toast,
  Client,
  InventoryItem,
} from "../types";

// Definición completa de las props que manejará el contexto
// (Espejo de OwnerScreenProps para eliminar prop drilling)
export interface SalonContextType {
  // Datos
  users: AppUser[];
  currentUser: AppUser | null;
  services: Service[];
  expenses: Expense[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  clients: Client[];
  inventoryItems: InventoryItem[]; // Unified inventory items
  
  // History Pagination
  historyServices: Service[];
  loadHistory: () => Promise<void>;
  loadingHistory: boolean;
  historyFullyLoaded: boolean;
  
  // Utilidades UI
  showNotification: (message: string, type?: Toast["type"]) => void;
  // onLogout se mantiene fuera o se puede integrar si auth se mueve a contexto global,
  // por ahora lo incluimos para consistencia.
  onLogout: () => void;

  // Acciones (Actions)
  addExpense: (data: any) => Promise<void>;
  deleteExpense: (id: string) => Promise<void>;
  updateServiceCost: (id: string, cost: number) => Promise<void>;
  softDeleteService: (id: string, userId?: string) => Promise<void>;
  permanentlyDeleteService: (id: string) => Promise<void>;
  restoreDeletedService: (id: string) => Promise<void>;

  createNewUser: (data: any) => Promise<void>;
  updateUser: (userId: string, data: Partial<AppUser>) => Promise<void>;
  updateUserCommission: (
    userId: string,
    newCommission: number
  ) => Promise<void>;
  deactivateUser: (userId: string) => Promise<void>;
  deleteUserPermanently: (userId: string) => Promise<void>;

  addCatalogService: (
    name: string,
    basePrice: number,
    tenantId: string
  ) => Promise<string>;
  updateCatalogService: (
    id: string,
    data: Partial<CatalogService>
  ) => Promise<void>;
  deleteCatalogService: (id: string) => Promise<void>;

  addExtra: (name: string, price: number, tenantId: string) => Promise<void>;
  updateExtra: (id: string, data: Partial<CatalogExtra>) => Promise<void>;
  deleteExtra: (id: string) => Promise<void>;

  deleteClient: (clientId: string) => Promise<void>;
}

// 1. Crear el Contexto
const SalonContext = createContext<SalonContextType | undefined>(undefined);

// 2. Hook Personalizado
export const useSalonContext = () => {
  const context = useContext(SalonContext);
  if (!context) {
    throw new Error("useSalonContext must be used within a SalonProvider");
  }
  return context;
};

// 3. Provider Component
interface SalonProviderProps extends SalonContextType {
  children: ReactNode;
}

export const SalonProvider: React.FC<SalonProviderProps> = ({
  children,
  ...props
}) => {
  return (
    <SalonContext.Provider value={props}>
      {children}
    </SalonContext.Provider>
  );
};
