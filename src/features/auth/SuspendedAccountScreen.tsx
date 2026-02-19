import React from "react";
import { ShieldOff, LogOut, AlertTriangle } from "lucide-react";

interface SuspendedAccountScreenProps {
  onLogout: () => void;
}

const SuspendedAccountScreen: React.FC<SuspendedAccountScreenProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.15)]">
              <ShieldOff size={44} className="text-red-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/40 flex items-center justify-center">
              <AlertTriangle size={14} className="text-orange-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-text-main mb-3 tracking-tight">
          Acceso{" "}
          <span className="text-red-400">Suspendido</span>
        </h1>

        {/* Divider */}
        <div className="w-16 h-0.5 bg-red-500/30 mx-auto mb-5 rounded-full" />

        {/* Message */}
        <p className="text-text-muted text-sm leading-relaxed mb-8 px-4">
          Tu suscripción ha vencido o presenta un retraso en el pago.
          Por favor, contacta con el administrador del sistema para
          restablecer tu acceso.
        </p>

        {/* Card with contact info hint */}
        <div className="bg-surface border border-border rounded-2xl p-5 mb-8 text-left">
          <p className="text-xs font-bold text-text-muted uppercase tracking-wider mb-3">
            ¿Qué puedes hacer?
          </p>
          <ul className="space-y-2 text-sm text-text-muted">
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              Contacta al soporte técnico para regularizar tu cuenta.
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary-500 mt-0.5">•</span>
              Una vez regularizado, el acceso se restaurará automáticamente.
            </li>
          </ul>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200 font-semibold text-sm group"
        >
          <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default SuspendedAccountScreen;
