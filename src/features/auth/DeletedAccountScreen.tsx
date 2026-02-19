import React from "react";
import { UserX, LogOut, AlertOctagon } from "lucide-react";

interface DeletedAccountScreenProps {
  onLogout: () => void;
}

const DeletedAccountScreen: React.FC<DeletedAccountScreenProps> = ({ onLogout }) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-slate-500/10 border-2 border-slate-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(100,116,139,0.15)]">
              <UserX size={44} className="text-slate-400" />
            </div>
            <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <AlertOctagon size={14} className="text-red-400" />
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl font-black text-text-main mb-3 tracking-tight">
          Cuenta <span className="text-slate-400">Eliminada</span>
        </h1>

        {/* Divider */}
        <div className="w-16 h-0.5 bg-slate-500/30 mx-auto mb-5 rounded-full" />

        {/* Message */}
        <p className="text-text-muted text-sm leading-relaxed mb-8 px-4">
          Esta cuenta ha sido eliminada permanentemente de nuestros registros.
          Si crees que esto es un error, por favor contacta con el soporte técnico.
        </p>

        {/* Logout button */}
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl border border-slate-500/30 text-slate-400 hover:bg-slate-500/10 hover:border-slate-500/50 transition-all duration-200 font-semibold text-sm group"
        >
          <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default DeletedAccountScreen;
