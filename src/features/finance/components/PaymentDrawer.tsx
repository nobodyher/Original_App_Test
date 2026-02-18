import React, { useEffect, useState } from "react";
import { X, CheckCircle, Briefcase, TrendingUp, DollarSign } from "lucide-react";
import type { AppUser } from "../../../types";

interface PaymentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  employee: AppUser | null;
  revenue: number;
  commission: number; // This is Total Earnings (Base + Commission)
  commissionPaid: number;
  onRegisterPayment: (amount: number, description: string, category: string) => Promise<void>;
}

export const PaymentDrawer: React.FC<PaymentDrawerProps> = ({
  isOpen,
  onClose,
  employee,
  revenue,
  commission: totalEarnings, // Rename for clarity
  commissionPaid,
  onRegisterPayment,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState<number | "">("");

  // Payment Calculation
  // 'totalEarnings' already includes Base Salary for Fixed/Hybrid from FinanceScreen calculation
  const pendingAmount = Math.max(0, Math.round((totalEarnings - commissionPaid) * 100) / 100);
  
  // Suggested total is the pending amount
  const calculatedTotal = pendingAmount;

  // Handle animation
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      setPaymentAmount(calculatedTotal); // Pre-fill with pending amount
    } else {
      setIsVisible(false);
    }
  }, [isOpen, calculatedTotal]);

  // Close on ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  const paymentType = employee?.paymentType || "commission";
  const baseSalary = employee?.baseSalary || 0;
  // Determine Category based on Payment Type
  const paymentCategory = paymentType === 'commission' ? "Comisiones" : "Sueldos";
  const paymentDescription = `Pago a ${employee?.name}`; // Simple description

  const handlePay = async () => {
    const amountToPay = typeof paymentAmount === "number" ? paymentAmount : 0;
    
    if (amountToPay <= 0) return;
    
    setIsSubmitting(true);
    try {
      await onRegisterPayment(amountToPay, paymentDescription, paymentCategory);
      onClose();
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!employee) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-md bg-surface border-l border-border shadow-2xl transform transition-transform duration-300 ease-out ${
          isVisible ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-border flex justify-between items-center bg-surface-highlight/30">
            <div>
              <h2 className="text-xl font-bold text-text-main">Registrar Pago</h2>
              <p className="text-sm text-text-muted">
                {employee.name} • {paymentType === 'fixed' ? 'Sueldo Fijo' : paymentType === 'hybrid' ? 'Híbrido' : 'Comisión'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-surface-highlight text-text-muted transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            
            {/* Payment Input Card */}
             <div className="bg-surface rounded-2xl border border-border p-6 shadow-sm">
              <label className="text-sm font-bold text-text-muted mb-2 block">
                Monto a Pagar
              </label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-3.5 text-text-muted" size={20} />
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value === "" ? "" : parseFloat(e.target.value))}
                  className="w-full pl-12 pr-4 py-3 bg-surface-highlight text-2xl font-bold text-text-main border border-border rounded-xl focus:ring-4 focus:ring-primary-500/20 outline-none transition-all"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Earnings Breakdown Card */}
            <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">
                Desglose de Ganancias
              </h3>
              
              {/* Revenue (Only for Commission/Hybrid) */}
              {(paymentType === 'commission' || paymentType === 'hybrid') && (
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-text-secondary">
                    <DollarSign size={16} />
                    <span>Ventas Generadas</span>
                  </div>
                  <span className="font-semibold text-text-main">
                    ${revenue.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Base Salary (Fixed/Hybrid) */}
              {(paymentType === 'fixed' || paymentType === 'hybrid') && (
                <div className="flex justify-between items-center text-emerald-600">
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} />
                    <span>Sueldo Base</span>
                  </div>
                  <span className="font-bold">
                    + ${baseSalary.toLocaleString()}
                  </span>
                </div>
              )}

              {/* Commission Calc (Commission/Hybrid) */}
              {(paymentType === 'commission' || paymentType === 'hybrid') && (
                <div className="flex justify-between items-center text-emerald-600">
                    <div className="flex items-center gap-2">
                        <TrendingUp size={16} />
                        <span>Comisión ({employee.commissionPct}%)</span>
                    </div>
                    <span className="font-bold">
                        + ${(totalEarnings - (paymentType === 'hybrid' ? baseSalary : 0)).toFixed(2)}
                    </span>
                </div>
              )}
              
              <div className="h-px bg-border border-dashed" />
              
              <div className="flex justify-between items-center pt-1">
                <span className="font-bold text-text-main">Total Ganado</span>
                <span className="text-xl font-black text-text-main">
                  ${totalEarnings.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Deductions Card */}
            <div className="bg-surface rounded-2xl border border-border p-5 space-y-4">
               <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">
                Pagos Realizados
              </h3>
              <div className="flex justify-between items-center text-red-500">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} />
                  <span>Ya Pagado</span>
                </div>
                <span className="font-bold">
                  - ${commissionPaid.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Total Result */}
             <div className="bg-surface-highlight/50 rounded-2xl p-6 text-center border border-primary-500/20">
                <p className="text-sm font-medium text-text-muted mb-1">
                    Monto Pendiente
                </p>
                <div className="text-4xl font-black text-primary-600">
                    ${pendingAmount.toFixed(2)}
                </div>
            </div>
          </div>

        {/* Footer */}
        <div className="p-6 border-t border-border bg-surface-highlight/30">
           <button
             onClick={handlePay}
             disabled={isSubmitting || !paymentAmount || Number(paymentAmount) <= 0}
             className="w-full py-4 px-6 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl shadow-lg hover:shadow-primary-600/20 transition-all flex items-center justify-center gap-2"
           >
             {isSubmitting ? (
               <>
                 <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 Procesando...
               </>
             ) : (
               <>
                 <CheckCircle size={20} />
                 Registrar Pago
               </>
             )}
           </button>
        </div>
        </div>
      </div>
    </>
  );
};
