import type { Timestamp, FieldValue } from "firebase/firestore";
import { ROLES, PAYMENT_METHODS } from "../constants/app";

export type Role = (typeof ROLES)[keyof typeof ROLES];

export type AppUser = {
  id: string;
  name: string;
  pin: string;
  role: Role;
  color: string;
  /** @deprecated — not used in any component, kept for Firestore backward compatibility */
  ow?: string;
  icon: "crown" | "user";
  commissionPct: number;
  active: boolean;
  photoURL?: string;

  // CRM de Staff:
  tenantId: string;
  phoneNumber?: string;
  email?: string;
  birthDate?: string; // Formato ISO: YYYY-MM-DD

  // Payment Info
  paymentType?: 'commission' | 'fixed' | 'hybrid';
  baseSalary?: number;
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
  reposicion?: number;
  deleted?: boolean;
  tenantId?: string; // Multi-tenant ID
};

export type CreateServicePayload = Omit<Service, "id" | "timestamp"> & {
  timestamp?: Timestamp | FieldValue | null;
};

export type Expense = {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  tenantId?: string;
  staffId?: string;
  registeredBy?: string;
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
  basePrice: number;
  active: boolean;
  tenantId: string;
  manualMaterials?: { materialId: string; qty: number }[]; // IDs de productos químicos y cantidad de uso
  manualConsumables?: RecipeItem[]; // IDs y cantidades de consumibles seleccionados manualmente
};

export type RecipeItem = {
  consumableId: string;
  qty: number;
};

export type CatalogExtra = {
  id: string;
  name: string;
  price?: number;
  priceSuggested: number;
  active: boolean;
  tenantId?: string;
  createdAt?: Timestamp | null;
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
  email?: string;
  phoneNumber?: string;
  createdAt?: Timestamp | null;
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
  stock: number;
  minStock: number;
  unit: string;
  content: number;
  purchasePrice: number;
  active: boolean;
  // Legacy fallbacks — kept for backward compatibility with older Firestore documents
  stockQty?: number;
  minStockAlert?: number;
  quantity?: number;
  packageSize?: number;
  type?: 'consumable' | 'material';
  unitCost?: number;
  needsReview?: boolean;
  originalId?: string;
  currentContent?: number;
  lastOpened?: Timestamp | null;
};
