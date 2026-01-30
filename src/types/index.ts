import type { DocumentData } from "firebase/firestore";

export type Role = "owner" | "staff";

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
};

export type PaymentMethod = "cash" | "transfer";

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
  client: string;
  services?: ServiceItem[];
  extras?: ExtraItem[];
  service?: string;
  cost: number;
  userId: string;
  userName: string;
  paymentMethod: PaymentMethod;
  commissionPct: number;
  category?: "manicura" | "pedicura";
  reposicion?: number;
  deleted?: boolean;
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
};

export type CatalogService = {
  id: string;
  name: string;
  category: "manicura" | "pedicura";
  basePrice: number;
  active: boolean;
};

export type Consumable = {
  id: string;
  name: string;
  unit: string;
  unitCost: number;
  stockQty: number;
  minStockAlert: number;
  active: boolean;
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
  category: "manicura" | "pedicura";
  active: boolean;
};

export type Client = {
  id: string;
  name: string;
  phone?: string;
  firstVisit: string;
  lastVisit: string;
  totalSpent: number;
  totalServices: number;
  preferredStaffId?: string;
  active: boolean;
};
