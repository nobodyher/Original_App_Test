import React, { useState } from "react";
import {
  Users,
  ShoppingCart,
  Package,
  Plus,
  Check,
  X,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  Save,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Layers,
} from "lucide-react";
import type {
  AppUser,
  CatalogService,
  CatalogExtra,
  MaterialRecipe,
  Consumable,
  ChemicalProduct,
  Toast,
} from "../../../types";

interface OwnerConfigTabProps {
  users: AppUser[];
  catalogServices: CatalogService[];
  catalogExtras: CatalogExtra[];
  materialRecipes: MaterialRecipe[];
  consumables: Consumable[];
  chemicalProducts: ChemicalProduct[];
  showNotification: (message: string, type?: Toast["type"]) => void;

  // User Actions
  createNewUser: (data: any) => Promise<void>;
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
  consumables,
  chemicalProducts,
  showNotification,
  createNewUser,
  updateUserCommission,
  deactivateUser,
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
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    personal: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const [newCatalogService, setNewCatalogService] = useState({
    name: "",
    category: "manicura" as "manicura" | "pedicura",
    basePrice: "",
  });

  const [newConsumable, setNewConsumable] = useState({
    name: "",
    unit: "",
    unitCost: "",
    stockQty: "",
    minStockAlert: "",
  });

  const [newChemicalProduct, setNewChemicalProduct] = useState({
    name: "",
    quantity: "",
    unit: "ml",
    purchasePrice: "",
    yield: "",
  });

  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);
  const [newExtraName, setNewExtraName] = useState("");
  const [newExtraPrice, setNewExtraPrice] = useState("");

  const [newUser, setNewUser] = useState({
    name: "",
    pin: "",
    commissionPct: "",
    color: "from-blue-500 to-blue-600",
  });

  const [editingUserCommission, setEditingUserCommission] = useState<string | null>(null);
  const [editingCommissionValue, setEditingCommissionValue] = useState("");

  const [editingCatalogService, setEditingCatalogService] = useState<string | null>(null);
  const [editingConsumable, setEditingConsumable] = useState<string | null>(null);

  // Wrappers
  const handleCreateNewUser = async () => {
    try {
      await createNewUser({
        name: newUser.name,
        pin: newUser.pin,
        commissionPct: newUser.commissionPct,
        color: newUser.color,
      });

      setNewUser({
        name: "",
        pin: "",
        commissionPct: "",
        color: "from-blue-500 to-blue-600",
      });
      showNotification("Usuario creado exitosamente");
    } catch (error: any) {
      console.error("Error creando usuario:", error);
      showNotification(error.message || "Error al crear usuario", "error");
    }
  };

  const handleUpdateUserCommission = async (userId: string, newCommission: number) => {
    try {
      await updateUserCommission(userId, newCommission);
      setEditingUserCommission(null);
      showNotification("Comisión actualizada");
    } catch (error: any) {
      console.error("Error actualizando comisión:", error);
      showNotification(error.message || "Error al actualizar", "error");
    }
  };

  const handleDeactivateUser = async (userId: string) => {
    if (!window.confirm("¿Desactivar este usuario?")) return;
    try {
      await deactivateUser(userId);
      showNotification("Usuario desactivado");
    } catch (error: any) {
      console.error("Error desactivando usuario:", error);
      showNotification("Error al desactivar", "error");
    }
  };

  const handleDeleteUserPermanently = async (userId: string) => {
    if (
      !window.confirm(
        "¿Eliminar este usuario permanentemente? Esta acción no se puede deshacer."
      )
    )
      return;

    try {
      await deleteUserPermanently(userId);
      showNotification("Usuario eliminado permanentemente");
    } catch (error: any) {
      console.error("Error eliminando usuario:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleAddCatalogService = async () => {
    try {
      await addCatalogService(
        newCatalogService.name,
        newCatalogService.category,
        parseFloat(newCatalogService.basePrice)
      );

      setNewCatalogService({ name: "", category: "manicura", basePrice: "" });
      showNotification("Servicio agregado al catálogo");
    } catch (error: any) {
      console.error("Error agregando servicio:", error);
      showNotification(error.message || "Error al agregar", "error");
    }
  };

  const handleUpdateCatalogService = async (id: string, updated: Partial<CatalogService>) => {
    try {
      await updateCatalogService(id, updated);
      setEditingCatalogService(null);
      showNotification("Servicio actualizado");
    } catch (error) {
      console.error("Error actualizando servicio:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleToggleCatalogService = async (id: string, active: boolean) => {
    try {
      await updateCatalogService(id, { active: !active });
      showNotification(active ? "Servicio desactivado" : "Servicio activado");
    } catch (error) {
      console.error("Error actualizando servicio:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteCatalogService = async (id: string) => {
    if (!window.confirm("¿Eliminar este servicio del catálogo?")) return;
    try {
      await deleteCatalogService(id);
      showNotification("Servicio eliminado");
    } catch (error) {
      console.error("Error eliminando servicio:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleAddExtra = async () => {
    try {
      await addExtra(newExtraName, parseFloat(newExtraPrice));
      setNewExtraName("");
      setNewExtraPrice("");
      showNotification("Extra agregado");
    } catch (error: any) {
      console.error("Error agregando extra:", error);
      showNotification(error.message || "Error al agregar", "error");
    }
  };

  const handleUpdateExtra = async (id: string, name: string, price: number) => {
    try {
      await updateExtra(id, { name, priceSuggested: price });
      setEditingExtraId(null);
      showNotification("Extra actualizado");
    } catch (error) {
      console.error("Error actualizando extra:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleToggleExtra = async (id: string, active: boolean) => {
    try {
      await updateExtra(id, { active: !active });
      showNotification(active ? "Extra desactivado" : "Extra activado");
    } catch (error) {
      console.error("Error actualizando extra:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteExtra = async (id: string) => {
    if (!window.confirm("¿Eliminar este extra?")) return;
    try {
      await deleteExtra(id);
      showNotification("Extra eliminado");
    } catch (error) {
      console.error("Error eliminando extra:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleAddConsumable = async () => {
    try {
      await addConsumable({
        name: newConsumable.name,
        unit: newConsumable.unit,
        unitCost: parseFloat(newConsumable.unitCost),
        stockQty: parseFloat(newConsumable.stockQty),
        minStockAlert: parseFloat(newConsumable.minStockAlert),
      });

      setNewConsumable({
        name: "",
        unit: "",
        unitCost: "",
        stockQty: "",
        minStockAlert: "",
      });
      showNotification("Consumible agregado");
    } catch (error: any) {
      console.error("Error agregando consumible:", error);
      showNotification(error.message || "Error al agregar", "error");
    }
  };

  const handleUpdateConsumable = async (id: string, updated: Partial<Consumable>) => {
    try {
      await updateConsumable(id, updated);
      setEditingConsumable(null);
      showNotification("Consumible actualizado");
    } catch (error) {
      console.error("Error actualizando consumible:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteConsumable = async (id: string) => {
    if (!window.confirm("¿Eliminar este consumible?")) return;
    try {
      await deleteConsumable(id);
      showNotification("Consumible eliminado");
    } catch (error) {
      console.error("Error eliminando consumible:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const handleAddChemicalProduct = async () => {
    try {
      await addChemicalProduct({
        name: newChemicalProduct.name,
        quantity: parseFloat(newChemicalProduct.quantity),
        unit: newChemicalProduct.unit as "ml" | "L" | "g" | "kg" | "unid",
        purchasePrice: parseFloat(newChemicalProduct.purchasePrice),
        yield: parseFloat(newChemicalProduct.yield),
        costPerService: 0,
        stock: 0,
        minStock: 0,
      });

      setNewChemicalProduct({
        name: "",
        quantity: "",
        unit: "ml",
        purchasePrice: "",
        yield: "",
      });
      showNotification("Producto guardado");
    } catch (error: any) {
      console.error("Error agregando producto:", error);
      showNotification(error.message || "Error al agregar", "error");
    }
  };

  const handleUpdateChemicalProduct = async (id: string, updates: Partial<ChemicalProduct>) => {
    try {
      await updateChemicalProduct(
        id,
        updates,
        chemicalProducts.find((p) => p.id === id)
      );
      showNotification("Producto actualizado");
    } catch (error) {
      console.error("Error actualizando producto:", error);
      showNotification("Error al actualizar", "error");
    }
  };

  const handleDeleteChemicalProduct = async (id: string) => {
    if (!window.confirm("¿Eliminar este producto químico?")) return;
    try {
      await deleteChemicalProduct(id);
      showNotification("Producto eliminado");
    } catch (error) {
      console.error("Error eliminando producto:", error);
      showNotification("Error al eliminar", "error");
    }
  };

  const lowStockConsumables = consumables.filter(
    (c) => c.active && c.stockQty <= c.minStockAlert
  );

  return (
    <div className="space-y-6">
      {lowStockConsumables.length > 0 && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-300 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="text-orange-600" size={32} />
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                ⚠️ Alertas de Stock Bajo
              </h3>
              <p className="text-sm text-gray-600">
                {lowStockConsumables.length} consumible(s) necesitan reposición
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lowStockConsumables.map((c) => (
              <div
                key={c.id}
                className="bg-white rounded-lg p-4 border-2 border-orange-200"
              >
                <p className="font-bold text-gray-800">{c.name}</p>
                <p className="text-sm text-gray-600">
                  Stock actual: <span className="font-bold">{c.stockQty}</span>{" "}
                  {c.unit} (mínimo: {c.minStockAlert})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}



      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <button
          onClick={() => toggleSection("services")}
          className="w-full p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-4">
            <ShoppingCart size={24} className="text-purple-600" />
            <span className="text-lg font-bold text-gray-800">Catálogo de Servicios</span>
          </div>
          {expandedSections["services"] ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections["services"] && (
        <div className="p-6 border-t border-gray-100 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-purple-50 rounded-lg">
            <input
              type="text"
              placeholder="Nombre del servicio"
              value={newCatalogService.name}
              onChange={(e) =>
                setNewCatalogService({
                  ...newCatalogService,
                  name: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <select
              value={newCatalogService.category}
              onChange={(e) =>
                setNewCatalogService({
                  ...newCatalogService,
                  category: e.target.value as "manicura" | "pedicura",
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            >
              <option value="manicura">Manicura</option>
              <option value="pedicura">Pedicura</option>
            </select>
            <input
              type="number"
              step="0.01"
              placeholder="Precio base $"
              value={newCatalogService.basePrice}
              onChange={(e) =>
                setNewCatalogService({
                  ...newCatalogService,
                  basePrice: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <button
              onClick={handleAddCatalogService}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-semibold"
            >
              Agregar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Categoría
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Precio
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {catalogServices.map((cs) => {
                  const isEditing = editingCatalogService === cs.id;

                  return (
                    <tr
                      key={cs.id}
                      className={`border-b hover:bg-gray-50 transition ${
                        !cs.active ? "opacity-60" : ""
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              defaultValue={cs.name}
                              id={`edit-service-name-${cs.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <select
                              defaultValue={cs.category}
                              id={`edit-service-category-${cs.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none"
                            >
                              <option value="manicura">Manicura</option>
                              <option value="pedicura">Pedicura</option>
                            </select>
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={cs.basePrice}
                              id={`edit-service-price-${cs.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                cs.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {cs.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => {
                                const name = (
                                  document.getElementById(
                                    `edit-service-name-${cs.id}`
                                  ) as HTMLInputElement
                                ).value;
                                const category = (
                                  document.getElementById(
                                    `edit-service-category-${cs.id}`
                                  ) as HTMLSelectElement
                                ).value as "manicura" | "pedicura";
                                const basePrice = parseFloat(
                                  (
                                    document.getElementById(
                                      `edit-service-price-${cs.id}`
                                    ) as HTMLInputElement
                                  ).value
                                );

                                handleUpdateCatalogService(cs.id, {
                                  name,
                                  category,
                                  basePrice,
                                });
                              }}
                              className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => setEditingCatalogService(null)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm font-medium">
                            {cs.name}
                          </td>
                          <td className="px-4 py-3 text-sm">{cs.category}</td>
                          <td className="px-4 py-3 text-sm font-bold text-green-700">
                            ${cs.basePrice.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                cs.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {cs.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => setEditingCatalogService(cs.id)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() =>
                                handleToggleCatalogService(cs.id, cs.active)
                              }
                              className={`p-2 rounded-lg transition ${
                                cs.active
                                  ? "text-orange-600 hover:bg-orange-50"
                                  : "text-green-600 hover:bg-green-50"
                              }`}
                              title={cs.active ? "Desactivar" : "Activar"}
                            >
                              {cs.active ? (
                                <XCircle size={18} />
                              ) : (
                                <CheckCircle size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => handleDeleteCatalogService(cs.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <button
          onClick={() => toggleSection("consumables")}
          className="w-full p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-4">
            <Package size={24} className="text-purple-600" />
            <span className="text-lg font-bold text-gray-800">Inventario de Consumibles</span>
          </div>
          {expandedSections["consumables"] ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections["consumables"] && (
        <div className="p-6 border-t border-gray-100 animate-in slide-in-from-top-2">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6 p-4 bg-purple-50 rounded-lg">
            <input
              type="text"
              placeholder="Nombre"
              value={newConsumable.name}
              onChange={(e) =>
                setNewConsumable({ ...newConsumable, name: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <input
              type="text"
              placeholder="Unidad"
              value={newConsumable.unit}
              onChange={(e) =>
                setNewConsumable({ ...newConsumable, unit: e.target.value })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Costo/unidad"
              value={newConsumable.unitCost}
              onChange={(e) =>
                setNewConsumable({
                  ...newConsumable,
                  unitCost: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <input
              type="number"
              placeholder="Stock inicial"
              value={newConsumable.stockQty}
              onChange={(e) =>
                setNewConsumable({
                  ...newConsumable,
                  stockQty: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <input
              type="number"
              placeholder="Alerta mínima"
              value={newConsumable.minStockAlert}
              onChange={(e) =>
                setNewConsumable({
                  ...newConsumable,
                  minStockAlert: e.target.value,
                })
              }
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
            />
            <button
              onClick={handleAddConsumable}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-semibold"
            >
              Agregar
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Unidad
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Costo/unidad
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Alerta
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {consumables.map((c) => {
                  const isLowStock = c.stockQty <= c.minStockAlert;
                  const isEditing = editingConsumable === c.id;

                  return (
                    <tr
                      key={c.id}
                      className={`border-b hover:bg-gray-50 transition ${
                        isLowStock ? "bg-orange-50" : ""
                      }`}
                    >
                      {isEditing ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              defaultValue={c.name}
                              id={`edit-consumable-name-${c.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              defaultValue={c.unit}
                              id={`edit-consumable-unit-${c.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={c.unitCost}
                              id={`edit-consumable-cost-${c.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              defaultValue={c.stockQty}
                              id={`edit-consumable-stock-${c.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              defaultValue={c.minStockAlert}
                              id={`edit-consumable-alert-${c.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none"
                            />
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => {
                                const name = (
                                  document.getElementById(
                                    `edit-consumable-name-${c.id}`
                                  ) as HTMLInputElement
                                ).value;
                                const unit = (
                                  document.getElementById(
                                    `edit-consumable-unit-${c.id}`
                                  ) as HTMLInputElement
                                ).value;
                                const unitCost = parseFloat(
                                  (
                                    document.getElementById(
                                      `edit-consumable-cost-${c.id}`
                                    ) as HTMLInputElement
                                  ).value
                                );
                                const stockQty = parseFloat(
                                  (
                                    document.getElementById(
                                      `edit-consumable-stock-${c.id}`
                                    ) as HTMLInputElement
                                  ).value
                                );
                                const minStockAlert = parseFloat(
                                  (
                                    document.getElementById(
                                      `edit-consumable-alert-${c.id}`
                                    ) as HTMLInputElement
                                  ).value
                                );

                                handleUpdateConsumable(c.id, {
                                  name,
                                  unit,
                                  unitCost,
                                  stockQty,
                                  minStockAlert,
                                });
                              }}
                              className="p-2 rounded-lg text-green-600 hover:bg-green-50 transition"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => setEditingConsumable(null)}
                              className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 transition"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 text-sm font-medium">
                            {c.name}
                          </td>
                          <td className="px-4 py-3 text-sm">{c.unit}</td>
                          <td className="px-4 py-3 text-sm">
                            ${c.unitCost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-sm font-bold">
                            {c.stockQty} {c.unit}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {c.minStockAlert}
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => setEditingConsumable(c.id)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                              title="Editar"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteConsumable(c.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                              title="Eliminar"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <button
          onClick={() => toggleSection("personal")}
          className="w-full p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-4">
            <Users size={24} className="text-purple-600" />
            <span className="text-lg font-bold text-gray-800">Gestionar Personal</span>
          </div>
          {expandedSections["personal"] ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections["personal"] && (
        <div className="p-6 border-t border-gray-100 animate-in slide-in-from-top-2">
          {/* Crear nuevo usuario */}
          <div className="mb-8 p-6 bg-blue-50 rounded-lg border-2 border-blue-200">
            <h4 className="text-lg font-bold text-blue-900 mb-4">
              Crear Nuevo Usuario
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Nombre"
                value={newUser.name}
                onChange={(e) =>
                  setNewUser({ ...newUser, name: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
              />
              <input
                type="password"
                placeholder="PIN (4+ dígitos)"
                value={newUser.pin}
                onChange={(e) =>
                  setNewUser({ ...newUser, pin: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Comisión %"
                value={newUser.commissionPct}
                onChange={(e) =>
                  setNewUser({ ...newUser, commissionPct: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
              />
              <select
                value={newUser.color}
                onChange={(e) =>
                  setNewUser({ ...newUser, color: e.target.value })
                }
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-gray-900 bg-white"
              >
                <option value="from-blue-500 to-blue-600">Azul</option>
                <option value="from-pink-500 to-pink-600">Rosa</option>
                <option value="from-green-500 to-green-600">Verde</option>
                <option value="from-purple-500 to-purple-600">Morado</option>
                <option value="from-orange-500 to-orange-600">Naranja</option>
              </select>
              <button
                onClick={handleCreateNewUser}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-semibold"
              >
                <Plus size={18} className="inline mr-2" />
                Crear Usuario
              </button>
            </div>
          </div>

          {/* Lista de usuarios */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Comisión
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter((u) => u.role === "staff")
                  .map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b hover:bg-gray-50 transition ${
                        !user.active ? "opacity-50 bg-gray-100" : ""
                      }`}
                    >
                      <td className="px-4 py-3 text-sm font-medium">
                        {user.name}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {editingUserCommission === user.id ? (
                          <div className="flex gap-2">
                            <input
                              type="number"
                              step="0.1"
                              value={editingCommissionValue}
                              onChange={(e) =>
                                setEditingCommissionValue(e.target.value)
                              }
                              className="w-20 px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none"
                            />
                            <button
                              onClick={() =>
                                handleUpdateUserCommission(
                                  user.id,
                                  parseFloat(editingCommissionValue)
                                )
                              }
                              className="text-green-600 hover:text-green-800"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => setEditingUserCommission(null)}
                              className="text-gray-500 hover:text-gray-700"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-purple-600">
                              {user.commissionPct}%
                            </span>
                            <button
                              onClick={() => {
                                setEditingUserCommission(user.id);
                                setEditingCommissionValue(
                                  user.commissionPct.toString()
                                );
                              }}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            user.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => handleDeactivateUser(user.id)}
                          className={`p-2 rounded-lg transition ${
                            user.active
                              ? "text-orange-600 hover:bg-orange-50"
                              : "text-green-600 hover:bg-green-50"
                          }`}
                          title={user.active ? "Desactivar" : "Activar"}
                        >
                          {user.active ? (
                            <XCircle size={18} />
                          ) : (
                            <CheckCircle size={18} />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteUserPermanently(user.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                          title="Eliminar permanentemente"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <button
          onClick={() => toggleSection("extras")}
          className="w-full p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-4">
            <Plus size={24} className="text-purple-600" />
            <span className="text-lg font-bold text-gray-800">Gestión de Extras</span>
          </div>
          {expandedSections["extras"] ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections["extras"] && (
        <div className="p-6 border-t border-gray-100 animate-in slide-in-from-top-2">
          {/* Form agregar extra */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border-2 border-gray-200">
            <h4 className="font-semibold text-gray-700 mb-3">
              Agregar Nuevo Extra
            </h4>
            <div className="flex gap-2 flex-wrap items-end">
              <input
                type="text"
                placeholder="Nombre del extra"
                value={newExtraName}
                onChange={(e) => setNewExtraName(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
              />
              <input
                type="number"
                step="0.01"
                placeholder="Precio por uña"
                value={newExtraPrice}
                onChange={(e) => setNewExtraPrice(e.target.value)}
                className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-purple-500 focus:outline-none text-gray-900 bg-white"
              />
              <button
                onClick={handleAddExtra}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-2 rounded-lg hover:shadow-lg transition font-semibold"
              >
                Agregar
              </button>
            </div>
          </div>

          {/* Tabla de extras */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Nombre
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Precio/Uña
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {catalogExtras.map((extra) => {
                  const price =
                    (extra as any).price || extra.priceSuggested || 0;
                  return (
                    <tr
                      key={extra.id}
                      className={`border-b hover:bg-gray-50 transition ${
                        !extra.active ? "opacity-60" : ""
                      }`}
                    >
                      {editingExtraId === extra.id ? (
                        <>
                          <td className="px-4 py-3">
                            <input
                              type="text"
                              defaultValue={extra.name || ""}
                              id={`edit-name-${extra.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none w-full"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <input
                              type="number"
                              step="0.01"
                              defaultValue={price}
                              id={`edit-price-${extra.id}`}
                              className="px-2 py-1 border-2 border-gray-300 rounded text-gray-900 bg-white focus:border-purple-500 focus:outline-none w-20"
                            />
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                extra.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {extra.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => {
                                const nameInput = document.getElementById(
                                  `edit-name-${extra.id}`
                                ) as HTMLInputElement;
                                const priceInput = document.getElementById(
                                  `edit-price-${extra.id}`
                                ) as HTMLInputElement;
                                handleUpdateExtra(
                                  extra.id,
                                  nameInput.value,
                                  parseFloat(priceInput.value) || 0
                                );
                              }}
                              className="text-green-600 hover:text-green-800"
                            >
                              <Save size={18} />
                            </button>
                            <button
                              onClick={() => setEditingExtraId(null)}
                              className="p-2 rounded-lg text-gray-500 hover:text-gray-700"
                            >
                              <X size={18} />
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="px-4 py-3 font-semibold text-gray-900">
                            {extra.name || "Sin nombre"}
                          </td>
                          <td className="px-4 py-3 text-gray-700">
                            ${price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold cursor-pointer ${
                                extra.active
                                  ? "bg-green-100 text-green-700"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                              onClick={() =>
                                handleToggleExtra(extra.id, extra.active)
                              }
                            >
                              {extra.active ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => setEditingExtraId(extra.id)}
                              className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteExtra(extra.id)}
                              className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {catalogExtras.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No hay extras registrados
            </div>
          )}
        </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <button
          onClick={() => toggleSection("materials")}
          className="w-full p-6 flex justify-between items-center bg-white hover:bg-gray-50 transition"
        >
          <div className="flex items-center gap-4">
            <Layers size={24} className="text-purple-600" />
            <span className="text-lg font-bold text-gray-800">Inventario de Materiales Químicos</span>
          </div>
          {expandedSections["materials"] ? <ChevronUp /> : <ChevronDown />}
        </button>

        {expandedSections["materials"] && (
        <div className="p-6 border-t border-gray-100 animate-in slide-in-from-top-2">
          {/* Botón de inicialización (solo si no hay datos) */}
          {chemicalProducts.length === 0 && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 rounded-lg">
              <h4 className="text-lg font-bold text-gray-800 mb-2">
                🚀 Inicialización Requerida
              </h4>
              <p className="text-gray-600 mb-4">
                Haz clic en el botón para agregar automáticamente 8 productos
                químicos y 6 recetas de servicios a Firebase.
              </p>
              <button
                onClick={initializeMaterialsData}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white px-8 py-3 rounded-lg hover:shadow-lg transition font-bold text-lg"
              >
                ✨ Inicializar Datos de Materiales
              </button>
            </div>
          )}

          {/* Sección 1: Productos Químicos */}
          <div className="mb-8">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Productos Químicos
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-4">
              <input
                type="text"
                placeholder="Nombre producto (ej: Alcohol)"
                className="border p-2 rounded"
                value={newChemicalProduct.name}
                onChange={(e) =>
                  setNewChemicalProduct({
                    ...newChemicalProduct,
                    name: e.target.value,
                  })
                }
              />
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder="Cant. compra"
                  className="border p-2 rounded w-full"
                  value={newChemicalProduct.quantity}
                  onChange={(e) =>
                    setNewChemicalProduct({
                      ...newChemicalProduct,
                      quantity: e.target.value,
                    })
                  }
                />
                <select
                  className="border p-2 rounded bg-white"
                  value={newChemicalProduct.unit}
                  onChange={(e) =>
                    setNewChemicalProduct({
                      ...newChemicalProduct,
                      unit: e.target.value,
                    })
                  }
                >
                  <option value="ml">ml</option>
                  <option value="L">L</option>
                  <option value="g">g</option>
                  <option value="kg">kg</option>
                  <option value="unid">unid</option>
                </select>
              </div>
              <input
                type="number"
                placeholder="Precio Compra ($)"
                className="border p-2 rounded"
                value={newChemicalProduct.purchasePrice}
                onChange={(e) =>
                  setNewChemicalProduct({
                    ...newChemicalProduct,
                    purchasePrice: e.target.value,
                  })
                }
              />
              <input
                type="number"
                placeholder="Rendimiento est. (servicios)"
                className="border p-2 rounded"
                value={newChemicalProduct.yield}
                onChange={(e) =>
                  setNewChemicalProduct({
                    ...newChemicalProduct,
                    yield: e.target.value,
                  })
                }
              />
              <button
                onClick={handleAddChemicalProduct}
                className="bg-purple-600 text-white p-2 rounded hover:bg-purple-700 font-bold"
              >
                Guardar
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-purple-50">
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Cantidad
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Precio Compra
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Rendimiento
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Costo/Servicio
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Stock
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-600">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {chemicalProducts.map((product) => (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-gray-900">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {product.quantity} {product.unit}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        ${product.purchasePrice.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {product.yield} servicios
                      </td>
                      <td className="px-4 py-3 font-bold text-green-600">
                        ${product.costPerService.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            product.stock <= product.minStock
                              ? "bg-red-100 text-red-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {product.stock} unidades
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${
                            product.active
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {product.active ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-4 py-3 flex gap-2">
                        <button
                          onClick={() => {
                            const newStock = prompt(
                              `Stock actual de ${product.name}:`,
                              product.stock.toString()
                            );
                            if (newStock !== null) {
                              const stockNum = parseInt(newStock);
                              if (!isNaN(stockNum) && stockNum >= 0) {
                                handleUpdateChemicalProduct(product.id, {
                                  stock: stockNum,
                                });
                              }
                            }
                          }}
                          className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 transition"
                          title="Actualizar Stock"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteChemicalProduct(product.id)}
                          className="p-2 rounded-lg text-red-600 hover:bg-red-50 transition"
                          title="Eliminar"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {chemicalProducts.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No hay productos químicos registrados. Los productos se agregarán
                automáticamente.
              </div>
            )}
          </div>

          {/* Sección 2: Recetas por Servicio */}
          <div className="mt-8 pt-8 border-t-2 border-gray-200">
            <h4 className="text-lg font-semibold text-gray-700 mb-4">
              Recetas de Servicios (Costo de Materiales)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {materialRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4 border-2 border-purple-200"
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
      </div>
    </div>
  );
};

export default OwnerConfigTab;
