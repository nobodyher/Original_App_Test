export const ROLES = {
  OWNER: "owner",
  STAFF: "staff",
} as const;

export const COLLECTIONS = {
  USERS: "users",
  SERVICES: "services",
  EXPENSES: "expenses",
  CATALOG_SERVICES: "catalog_services",
  CATALOG_EXTRAS: "catalog_extras",
  CONSUMABLES: "consumables",
  CHEMICAL_PRODUCTS: "chemical_products",
  CLIENTS: "clients",
  SERVICE_RECIPES: "service_recipes",
  MATERIAL_RECIPES: "material_recipes",
} as const;

export const PAYMENT_METHODS = {
  CASH: "cash",
  TRANSFER: "transfer",
} as const;

export const CATEGORIES = {
  MANICURA: "manicura",
  PEDICURA: "pedicura",
} as const;

export const ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;
