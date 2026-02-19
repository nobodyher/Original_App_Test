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
  CLIENTS: "clients",
  INVENTORY: "inventory",
} as const;

export const PAYMENT_METHODS = {
  CASH: "cash",
  TRANSFER: "transfer",
} as const;

export const ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
} as const;

export const MASTER_ADMIN_UID = "UmfOxeIMw9gxLkXgeGoCamxBZ6p1";
