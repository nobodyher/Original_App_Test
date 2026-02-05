import React from "react";
import { Beaker, Check } from "lucide-react";
import type { ChemicalProduct } from "../../../../types";

interface ServiceMaterialSelectorProps {
  chemicals: ChemicalProduct[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

const ServiceMaterialSelector: React.FC<ServiceMaterialSelectorProps> = ({
  chemicals,
  selectedIds,
  onChange,
}) => {
  const handleToggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((item) => item !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="w-full">
      <div className="flex items-center gap-2 mb-3 text-gray-700 font-semibold">
        <Beaker size={18} className="text-purple-600" />
        <span>Materiales y Químicos Requeridos</span>
      </div>
      
      <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-xl bg-gray-50/50 p-2 space-y-2 custom-scrollbar">
        {chemicals.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">
            No hay productos químicos registrados
          </div>
        ) : (
          chemicals.map((product) => {
            const isSelected = selectedIds.includes(product.id);
            const stock = product.stock;
            const yieldVal = product.yieldPerUnit || product.yield;
            const currentYield = product.currentYieldRemaining || yieldVal;
            
            return (
              <div
                key={product.id}
                onClick={() => handleToggle(product.id)}
                className={`
                  relative flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 group
                  ${isSelected 
                    ? "bg-purple-50 border-purple-200 shadow-sm" 
                    : "bg-white border-gray-100 hover:border-purple-100 hover:bg-gray-50"
                  }
                `}
              >
                {/* Custom Checkbox */}
                <div 
                  className={`
                    w-5 h-5 rounded border flex items-center justify-center transition-colors duration-200
                    ${isSelected 
                      ? "bg-purple-600 border-purple-600 text-white" 
                      : "bg-white border-gray-300 group-hover:border-purple-300"
                    }
                  `}
                >
                  {isSelected && <Check size={12} strokeWidth={3} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <span className={`text-sm font-medium truncate ${isSelected ? "text-purple-900" : "text-gray-700"}`}>
                      {product.name}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-medium bg-slate-100 px-1.5 py-0.5 rounded">
                      Stock: {stock}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      | Uso: {currentYield}/{yieldVal} {product.unit}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <p className="text-xs text-gray-400 mt-2 px-1">
        Selecciona los productos químicos que se consumen en este servicio.
      </p>
    </div>
  );
};

export default ServiceMaterialSelector;
