import React, { useState, useMemo } from "react";
import {
  Package,
  PlusCircle,
  X,
  Edit2,
  Trash2,
  Beaker,
  AlertTriangle,
  DollarSign,
  Percent,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { ChemicalProduct } from "../../../../types";

interface ChemicalsManagerProps {
  chemicals: ChemicalProduct[];
  onAdd: (data: Partial<ChemicalProduct>) => Promise<void>;
  onUpdate: (id: string, data: Partial<ChemicalProduct>, currentProduct?: ChemicalProduct) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh?: () => void;
}

const EmptyState = ({ 
  icon: Icon, 
  title, 
  message 
}: { 
  icon: React.ElementType, 
  title: string, 
  message: string 
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center animate-fade-in">
    <Icon size={64} className="text-gray-200 mb-4" strokeWidth={1.5} />
    <h3 className="text-lg font-bold text-gray-400 mb-2">{title}</h3>
    <p className="text-sm text-gray-400 max-w-xs mx-auto">{message}</p>
  </div>
);

const ChemicalsManager: React.FC<ChemicalsManagerProps> = ({
  chemicals,
  onAdd,
  onUpdate,
  onDelete,
}) => {
  // State from User Request
  const [addingChemicalProduct, setAddingChemicalProduct] = useState(false); // isChemicalModalOpen
  const [editingProduct, setEditingProduct] = useState<ChemicalProduct | null>(null); // isEditChemicalModalOpen, editingChemical
  
  const [newChemicalProduct, setNewChemicalProduct] = useState({ // chemicalFormData
    name: "",
    quantity: "",
    unit: "ml",
    purchasePrice: "",
    yield: "",
    stock: "",
    yieldPerUnit: "",
  });

  const [editChemicalForm, setEditChemicalForm] = useState<Partial<ChemicalProduct>>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Pagination
  const [chemicalsPage, setChemicalsPage] = useState(1);
  const CHEMICALS_PER_PAGE = 7;

  const paginatedChemicals = useMemo(() => {
    const start = (chemicalsPage - 1) * CHEMICALS_PER_PAGE;
    return chemicals.slice(start, start + CHEMICALS_PER_PAGE);
  }, [chemicals, chemicalsPage]);

  // Handlers
  const handleAddChemicalProduct = async () => {
    setIsSubmitting(true);
    try {
      const yieldPerUnit = (parseFloat(newChemicalProduct.yieldPerUnit) || parseFloat(newChemicalProduct.yield) || 0);
      
      await onAdd({
        name: newChemicalProduct.name,
        quantity: parseFloat(newChemicalProduct.quantity) || 0,
        unit: newChemicalProduct.unit as "ml" | "L" | "g" | "kg" | "unid",
        purchasePrice: parseFloat(newChemicalProduct.purchasePrice) || 0,
        yield: parseFloat(newChemicalProduct.yield) || 0,
        costPerService: 0,
        stock: parseFloat(newChemicalProduct.stock || "0") || 0,
        minStock: 0,
        yieldPerUnit: yieldPerUnit,
        currentYieldRemaining: yieldPerUnit,
      });

      setNewChemicalProduct({
        name: "",
        quantity: "",
        unit: "ml",
        purchasePrice: "",
        yield: "",
        stock: "",
        yieldPerUnit: "",
      });
      setAddingChemicalProduct(false);
    } catch (error: any) {
      console.error("Error agregando producto:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateChemicalProduct = async (id: string, updates: Partial<ChemicalProduct>) => {
    try {
      await onUpdate(
        id,
        updates,
        chemicals.find((p) => p.id === id)
      );
      setEditingProduct(null);
    } catch (error) {
      console.error("Error actualizando producto:", error);
    }
  };

  const handleDeleteChemicalProduct = async (id: string) => {
    if (!window.confirm("¿Eliminar este producto químico?")) return;
    try {
      await onDelete(id);
    } catch (error) {
      console.error("Error eliminando producto:", error);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-700 mb-4">
          Productos Químicos
        </h4>

        {/* Botón para agregar nuevo producto químico */}
        <div className="mb-6">
          <button
            onClick={() => setAddingChemicalProduct(true)}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 ease-out font-bold flex items-center justify-center gap-3 group"
          >
            <PlusCircle size={24} className="group-hover:rotate-90 transition-transform duration-300" />
            Agregar Nuevo Producto Químico
          </button>
        </div>

        {paginatedChemicals.length === 0 ? (
           <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 shadow-sm mb-8">
              <EmptyState 
                icon={Beaker} 
                title="Inventario químico vacío" 
                message="Registra tus productos químicos para controlar el stock." 
              />
           </div>
        ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedChemicals.map((product) => {
             const isLowStock = product.stock <= product.minStock;

             return (
               <div 
                  key={product.id}
                  className={`bg-white rounded-2xl p-5 border shadow-sm hover:shadow-md transition-all duration-200 group relative ${isLowStock ? 'border-orange-200 ring-1 ring-orange-100' : 'border-slate-100 hover:border-purple-100'}`}
               >
                  {/* Header Badge */}
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h5 className="font-bold text-gray-800 text-lg leading-tight">{product.name}</h5>
                        <p className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                           <Package size={14} />
                           {product.quantity} {product.unit} (compra)
                        </p>
                     </div>
                     <span className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wide border ${product.active ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                        {product.active ? 'Activo' : 'Inactivo'}
                     </span>
                  </div>

                  {/* Body Statistics */}
                  <div className="space-y-3 mb-6">
                     <div className={`flex flex-col p-3 rounded-lg ${isLowStock ? 'bg-orange-50 border border-orange-100' : 'bg-slate-50 border border-slate-100'}`}>
                        <span className="text-xs text-slate-400 mb-2 uppercase font-bold tracking-wider">Inventario</span>
                        <div className="flex items-center gap-2">
                            {isLowStock && <AlertTriangle size={18} className="text-orange-500 animate-pulse" />}
                            <span className={`text-sm font-semibold ${isLowStock ? 'text-orange-600' : 'text-slate-700'}`}>
                               Stock: {product.stock} uds. | Uso: {product.currentYieldRemaining || product.yieldPerUnit || product.yield}/{product.yieldPerUnit || product.yield}
                            </span>
                         </div>
                     </div>

                     <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="p-2.5 border border-slate-100 rounded-lg">
                            <span className="block text-xs text-slate-400 mb-1 uppercase font-bold tracking-wider">Costo Unit.</span>
                            <span className="font-semibold text-slate-700">${product.purchasePrice.toFixed(2)}</span>
                        </div>
                        <div className="p-2.5 border border-purple-100 bg-purple-50/30 rounded-lg">
                             <span className="block text-xs text-purple-600 mb-1 uppercase font-bold tracking-wider">Costo/Servicio</span>
                             <span className="font-bold text-purple-700">${product.costPerService.toFixed(2)}</span>
                        </div>
                     </div>
                     
                     <div className="text-xs text-center text-slate-400">
                        Rendimiento aprox: <span className="font-medium text-slate-600">{product.yield} servicios</span>
                     </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-slate-50 mt-auto">
                      <button
                        onClick={() => {
                            setEditingProduct(product);
                            setEditChemicalForm(product);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 p-2 rounded-lg text-purple-600 hover:bg-purple-50 font-medium text-sm transition-all duration-200 hover:scale-105 active:scale-95 border border-transparent hover:border-purple-100 group"
                      >
                         <Edit2 size={16} className="group-hover:scale-110 transition-transform" /> 
                         Editar
                      </button>
                      <button
                         onClick={() => handleDeleteChemicalProduct(product.id)}
                         className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200 hover:scale-110 active:scale-90"
                         title="Eliminar"
                      >
                         <Trash2 size={18} />
                      </button>
                  </div>
               </div>
             );
          })}
        </div>
        )}

         {/* Pagination Controls */}
         <div className="flex justify-between items-center px-2 mt-4">
            <div className="text-sm text-gray-500">
                Mostrando {((chemicalsPage - 1) * CHEMICALS_PER_PAGE) + 1} a {Math.min(chemicalsPage * CHEMICALS_PER_PAGE, chemicals.length)} de {chemicals.length} productos
            </div>
            <div className="flex gap-2">
                <button
                    onClick={() => setChemicalsPage(p => Math.max(1, p - 1))}
                    disabled={chemicalsPage === 1}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={16} />
                </button>
                <span className="flex items-center px-3 font-semibold text-gray-700">
                    Página {chemicalsPage}
                </span>
                <button
                    onClick={() => setChemicalsPage(p => (p * CHEMICALS_PER_PAGE < chemicals.length ? p + 1 : p))}
                    disabled={chemicalsPage * CHEMICALS_PER_PAGE >= chemicals.length}
                    className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={16} />
                </button>
            </div>
         </div>
      </div>

      {/* Slide-over para Edición de Producto Químico */}
      {editingProduct && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setEditingProduct(null)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-purple-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Editar Producto</h3>
                <p className="text-sm text-gray-500">Gestión de inventario y costos</p>
              </div>
              <button 
                onClick={() => setEditingProduct(null)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Package size={18} className="text-purple-600" />
                   Información del Producto
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Producto</label>
                  <input
                    type="text"
                    value={editChemicalForm.name || ""}
                    onChange={(e) => setEditChemicalForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Cantidad</label>
                      <input
                        type="number"
                        value={editChemicalForm.quantity || 0}
                        onChange={(e) => setEditChemicalForm(prev => ({ ...prev, quantity: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Unidad</label>
                      <select
                        value={editChemicalForm.unit || "ml"}
                        onChange={(e) => setEditChemicalForm(prev => ({ ...prev, unit: e.target.value as any }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      >
                         <option value="ml">ml</option>
                         <option value="L">Litros</option>
                         <option value="g">Gramos</option>
                         <option value="kg">Kilos</option>
                         <option value="unid">Unidades</option>
                      </select>
                   </div>
                </div>
              </div>

              {/* Costos y Rendimiento */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <DollarSign size={18} className="text-green-600" />
                   Costos y Rendimiento
                </h4>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Precio de Compra</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          value={editChemicalForm.purchasePrice || 0}
                          onChange={(e) => setEditChemicalForm(prev => ({ ...prev, purchasePrice: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                          className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Rendimiento (Servicios)</label>
                      <input
                        type="number"
                        value={editChemicalForm.yield || 0}
                        onChange={(e) => setEditChemicalForm(prev => ({ ...prev, yield: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                    </div>
                </div>
              </div>

              {/* Rendimiento por Unidad */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Percent size={18} className="text-purple-600" />
                   Rendimiento por Unidad
                </h4>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Usos por Unidad</label>
                      <input
                        type="number"
                        value={editChemicalForm.yieldPerUnit || 0}
                        onChange={(e) => setEditChemicalForm(prev => ({ ...prev, yieldPerUnit: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Usos Restantes</label>
                      <input
                        type="number"
                        value={editChemicalForm.currentYieldRemaining || 0}
                        onChange={(e) => setEditChemicalForm(prev => ({ ...prev, currentYieldRemaining: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                      />
                    </div>
                </div>
              </div>
              
              {/* Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-orange-500" />
                   Gestión de Inventario
                </h4>

                <div className="grid grid-cols-2 gap-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-gray-700">Stock Actual</label>
                       <input
                         type="number"
                         value={editChemicalForm.stock || 0}
                         onChange={(e) => setEditChemicalForm(prev => ({ ...prev, stock: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                         className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all bg-white font-bold text-gray-800"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-medium text-gray-600">Stock Mínimo (Alerta)</label>
                       <input
                         type="number"
                         value={editChemicalForm.minStock || 0}
                         onChange={(e) => setEditChemicalForm(prev => ({ ...prev, minStock: e.target.value === "" ? 0 : parseFloat(e.target.value) }))}
                         className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:border-orange-500 outline-none transition-all bg-white"
                       />
                    </div>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => setEditingProduct(null)}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (editingProduct && editChemicalForm) {
                    handleUpdateChemicalProduct(editingProduct.id, editChemicalForm);
                  }
                }}
                className="flex-1 px-4 py-3 rounded-xl bg-purple-600 text-white font-bold shadow-lg shadow-purple-200 hover:bg-purple-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Slide-over para AGREGAR Producto Químico */}
      {addingChemicalProduct && (
        <div className="fixed inset-0 z-60 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
            onClick={() => setAddingChemicalProduct(false)}
          />

          {/* Panel */}
          <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-green-50/50">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Agregar Producto Químico</h3>
                <p className="text-sm text-gray-500">Nuevo producto para el inventario</p>
              </div>
              <button 
                onClick={() => setAddingChemicalProduct(false)}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-all duration-300 hover:rotate-90 active:scale-90"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* Información Básica */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Beaker size={18} className="text-green-600" />
                   Información del Producto
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Nombre del Producto</label>
                  <input
                    type="text"
                    placeholder="ej. Gel Constructor, Top Coat, Base Coat"
                    value={newChemicalProduct.name}
                    onChange={(e) => setNewChemicalProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Cantidad</label>
                      <input
                        type="number"
                        placeholder="100"
                        value={newChemicalProduct.quantity}
                        onChange={(e) => setNewChemicalProduct(prev => ({ ...prev, quantity: e.target.value }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                   </div>
                   <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Unidad</label>
                      <select
                        value={newChemicalProduct.unit}
                        onChange={(e) => setNewChemicalProduct(prev => ({ ...prev, unit: e.target.value }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      >
                         <option value="ml">ml</option>
                         <option value="L">Litros</option>
                         <option value="g">Gramos</option>
                         <option value="kg">Kilos</option>
                         <option value="unid">Unidades</option>
                      </select>
                   </div>
                </div>
              </div>

              {/* Costos y Rendimiento */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <DollarSign size={18} className="text-green-600" />
                   Costos y Rendimiento
                </h4>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Precio de Compra</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-gray-400 font-bold">$</span>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={newChemicalProduct.purchasePrice}
                          onChange={(e) => setNewChemicalProduct(prev => ({ ...prev, purchasePrice: e.target.value }))}
                          className="w-full pl-8 pr-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none font-semibold"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-600">Rendimiento Total</label>
                      <input
                        type="number"
                        placeholder="50"
                        value={newChemicalProduct.yield}
                        onChange={(e) => setNewChemicalProduct(prev => ({ ...prev, yield: e.target.value }))}
                        className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-green-500/20 focus:border-green-500 outline-none"
                      />
                    </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Rendimiento:</span> Número total de servicios que se pueden realizar con todo el producto
                  </p>
                </div>
              </div>

              {/* Rendimiento por Unidad */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <Percent size={18} className="text-purple-600" />
                   Rendimiento por Unidad
                </h4>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-600">Usos por Unidad (Botella/Paquete)</label>
                  <input
                    type="number"
                    placeholder="25"
                    value={newChemicalProduct.yieldPerUnit}
                    onChange={(e) => setNewChemicalProduct(prev => ({ ...prev, yieldPerUnit: e.target.value }))}
                    className="w-full px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg transition-all duration-200 focus:ring-4 focus:ring-purple-500/20 focus:border-purple-500 outline-none"
                  />
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                  <p className="text-xs text-gray-600">
                    <span className="font-semibold">Ejemplo:</span> Si una botella de 100ml rinde para 25 servicios, ingresa 25
                  </p>
                </div>
              </div>

              {/* Inventario */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-700 border-b pb-2 flex items-center gap-2">
                   <AlertTriangle size={18} className="text-orange-500" />
                   Inventario Inicial
                </h4>

                <div className="space-y-2 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                  <label className="text-sm font-bold text-gray-700">Stock Inicial (Unidades)</label>
                  <input
                    type="number"
                    placeholder="5"
                    value={newChemicalProduct.stock}
                    onChange={(e) => setNewChemicalProduct(prev => ({ ...prev, stock: e.target.value }))}
                    className="w-full px-4 py-2 border border-orange-200 rounded-lg focus:border-orange-500 focus:ring-4 focus:ring-orange-200 outline-none transition-all bg-white font-bold text-gray-800"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Número de botellas/paquetes que tienes en inventario
                  </p>
                </div>
              </div>

            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
              <button
                onClick={() => {
                  setAddingChemicalProduct(false);
                  setNewChemicalProduct({
                    name: "",
                    quantity: "",
                    unit: "ml",
                    purchasePrice: "",
                    yield: "",
                    stock: "",
                    yieldPerUnit: "",
                  });
                }}
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-600 font-semibold hover:bg-gray-100 transition-all duration-200 active:scale-95"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddChemicalProduct}
                disabled={isSubmitting}
                className={`flex-1 px-4 py-3 rounded-xl bg-green-600 text-white font-bold shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-xl hover:brightness-110 transition-all duration-200 active:scale-95 active:shadow-inner ${
                  isSubmitting ? "opacity-60 cursor-wait animate-pulse pointer-events-none" : ""
                }`}
              >
                {isSubmitting ? "Guardando..." : "Agregar Producto"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChemicalsManager;
