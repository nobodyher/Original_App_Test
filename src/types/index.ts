import type { Timestamp } from "firebase/firestore";
import { ROLES, PAYMENT_METHODS, CATEGORIES } from "../constants/app";

export type Role = (typeof ROLES)[keyof typeof ROLES];

export type AppUser = {
  id: string;
  name: string;
  pin: string;
  role: Role;
  color: string;
  ow: string;
  icon: "crown" | "user";
  commissionPct: number;
  active: boolean;
  photoURL?: string;

  // Nuevos campos para el CRM de Staff:
  phoneNumber?: string; // Para contacto
  email?: string; // Para contacto y notificaciones
  birthDate?: string; // Para recordatorios de cumpleaños (Formato ISO: YYYY-MM-DD)
  // commissionRate eliminado a favor de commissionPct
  isActive?: boolean; // Para "Soft Delete" (true = activo, false = inactivo/papelera)
};

export type PaymentMethod =
  (typeof PAYMENT_METHODS)[keyof typeof PAYMENT_METHODS];

export type ServiceItem = {
  serviceId: string;
  serviceName: string;
  servicePrice: number;
};

export type ExtraItem = {
  extraId: string;
  extraName: string;
  pricePerNail: number;
  nailsCount: number;
  totalPrice: number;
};

export type Service = {
  id: string;
  date: string;
  timestamp?: Timestamp;
  client: string;
  services?: ServiceItem[];
  extras?: ExtraItem[];
  service?: string;
  cost: number;
  userId: string;
  userName: string;
  paymentMethod: PaymentMethod;
  commissionPct: number;
  category?: (typeof CATEGORIES)[keyof typeof CATEGORIES];
  reposicion?: number;
  deleted?: boolean;
};

export type CreateServicePayload = Omit<Service, "id" | "timestamp"> & {
  timestamp?: any;
};

export type Expense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  userId?: string;
  deleted?: boolean;
};

export type Toast = { type: "success" | "error" | "info"; message: string };

export type OwnerFilters = {
  dateFrom: string;
  dateTo: string;
  paymentMethod: "all" | PaymentMethod;
  includeDeleted: boolean;
  search: string;
};

export type Filters = {
  search: string;
  dateFrom: string;
  dateTo: string;
  page?: number;
};

export type CatalogService = {
  id: string;
  name: string;
  category: (typeof CATEGORIES)[keyof typeof CATEGORIES];
  basePrice: number;
  active: boolean;
  manualMaterials?: { materialId: string; qty: number }[]; // IDs de productos químicos y cantidad de uso
  manualConsumables?: RecipeItem[]; // IDs y cantidades de consumibles seleccionados manualmente
};

export type Consumable = {
  id: string;
  name: string;
  unit: string;

  // Inventory tracking
  stockQty: number; // Cantidad actual en stock
  minStockAlert: number; // Alerta de stock mínimo

  // Purchase information
  purchasePrice: number; // Precio de compra del paquete completo
  packageSize: number; // Cantidad en el paquete (ej: 50 pares, 100 unidades)

  // Legacy field (keep for backward compatibility)
  unitCost?: number; // Deprecated: use purchasePrice/packageSize instead

  active: boolean;
  category?: string;
};

export type RecipeItem = {
  consumableId: string;
  qty: number;
};

export type ServiceRecipe = {
  id: string;
  serviceId: string;
  items: RecipeItem[];
};

export type CatalogExtra = {
  id: string;
  name: string;
  priceSuggested: number;
  appliesToCategories: string[];
  active: boolean;
  price?: number;
};

export type ChemicalProduct = {
  id: string;
  name: string;
  quantity: number;
  unit: "ml" | "kg" | "L" | "g" | "unid";
  purchasePrice: number;
  yield: number;
  costPerService: number;
  stock: number;
  minStock: number;
  yieldPerUnit?: number; // Rendimiento por botella/unidad
  currentYieldRemaining?: number; // Usos restantes de la botella actual
  active: boolean;
};

export type MaterialRecipe = {
  id: string;
  serviceId: string;
  serviceName: string;
  chemicalIds: string[];
  chemicalsCost: number;
  disposablesCost: number;
  totalCost: number;
  category: (typeof CATEGORIES)[keyof typeof CATEGORIES];
  active: boolean;
};

export type MaterialInput =
  | string
  | {
      id?: string;
      materialId?: string;
      quantity?: number;
      qty?: number;
      amount?: number;
    };

export type Client = {
  id: string;
  name: string;
  phone?: string;
  email?: string; // Contacto
  phoneNumber?: string; // Contacto
  createdAt?: any; // Timestamp creation
  firstVisit: string;
  lastVisit: string;
  totalSpent: number;
  totalServices: number;
  preferredStaffId?: string;
  active: boolean;
};

export type InventoryItem = {
  id: string;
  name: string;
  stock: number; // Unified stock
  minStock: number;
  unit: string;
  content: number; // Unified quantity/packageSize
  purchasePrice: number;
  active: boolean;
  // Fallbacks for safety during transition
  stockQty?: number;
  minStockAlert?: number;
  quantity?: number;
  packageSize?: number;
  // Legacy differentiation
  type?: 'consumable' | 'material';
  unitCost?: number;
  needsReview?: boolean;
  originalId?: string;
  currentContent?: number; // Content remaining in the open package
};
