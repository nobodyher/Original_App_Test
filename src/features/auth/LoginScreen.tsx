import React, { useState } from "react";
import { TrendingUp, Crown, User, Lock } from "lucide-react";
import NotificationToast from "../../components/ui/NotificationToast";
import { Button } from "../../components/ui/Button"; // <--- Importamos Button
import { Card } from "../../components/ui/Card";     // <--- Importamos Card
import type { AppUser, Toast } from "../../types";

interface LoginScreenProps {
  users: AppUser[];
  // loading se maneja ahora en App.tsx o useAuth, pero lo mantenemos por compatibilidad si lo pasas
  loading?: boolean; 
  onLogin: (user: AppUser) => void;
  showNotification: (message: string, type?: Toast["type"]) => void;
  notification: Toast | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  showNotification,
  notification,
}) => {
  const [pins, setPins] = useState<Record<string, string>>({});

  const handlePinEntry = (userId: string, digit: string) => {
    const currentPin = pins[userId] || "";
    if (currentPin.length < 4) {
      setPins({ ...pins, [userId]: currentPin + digit });
    }
  };

  const handleBackspace = (userId: string) => {
    const currentPin = pins[userId] || "";
    setPins({ ...pins, [userId]: currentPin.slice(0, -1) });
  };

  const handleLogin = (userId: string) => {
    const user = users.find((u) => u.id === userId);
    if (user && pins[userId] === user.pin) {
      onLogin(user);
      setPins({});
      showNotification(`¡Bienvenida ${user.name}!`);
    } else {
      showNotification("PIN incorrecto", "error");
      setPins({ ...pins, [userId]: "" });
    }
  };

  const activeUsers = users.filter((u) => u.active);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative selection:bg-[#88304E]/20">
      {/* Estilos para animación de fondo */}
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob { animation: blob 10s infinite; }
        .animation-delay-2000 { animation-delay: 2s; }
        .animation-delay-4000 { animation-delay: 4s; }
      `}</style>
      
      {/* Background Blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F8FAFC] via-[#F1F5F9] to-[#E2E8F0] -z-20" />
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-[#3A1078]/30 rounded-full blur-[120px] -z-10 animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-[#88304E]/30 rounded-full blur-[120px] -z-10 animate-blob animation-delay-2000" />
      <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-[#C5A059]/30 rounded-full blur-[100px] -z-10 animate-blob animation-delay-4000" />

      <NotificationToast notification={notification} />

      {/* Main Container */}
      <div className="w-full max-w-[1400px] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-white/40 backdrop-blur-md border border-white/60 shadow-sm mb-4 ring-1 ring-white/70">
             <TrendingUp className="text-[#3A1078]" size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-6xl font-black text-[#0F172A] tracking-tight drop-shadow-sm">
            Nombre<span className="text-[#88304E]">Local</span>
          </h1>
          <p className="text-[#0F172A]/60 text-xl font-medium tracking-wide uppercase">
            Punto de Venta
          </p>
        </div>

        {/* Users Grid */}
        <div className="flex flex-wrap justify-center gap-8 items-start">
          {activeUsers.map((user) => {
              const currentPin = pins[user.id] || "";

              return (
              <Card
                key={user.id}
                className="group w-full max-w-[380px] hover:shadow-2xl transition-all duration-500 overflow-hidden focus-within:ring-4 focus-within:ring-[#3A1078]/30"
              >
                {/* User Header / Avatar */}
                <div className="relative p-8 pb-4 flex flex-col items-center z-10">
                   <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-[#3A1078] to-[#88304E] shadow-md mb-4 group-hover:scale-105 transition-transform duration-500">
                      <div className="w-full h-full rounded-full bg-[#F8FAFC] flex items-center justify-center border-2 border-transparent">
                          {user.icon === "crown" ? (
                            <Crown className="text-[#C5A059]" size={40} strokeWidth={1.5} />
                          ) : (
                            <User className="text-[#3A1078]" size={40} strokeWidth={1.5} />
                          )}
                      </div>
                   </div>
                   <h3 className="text-2xl font-bold text-[#0F172A] mb-1">{user.name}</h3>
                   
                   {user.role === "owner" && (
                    <span className="px-3 py-1 bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                      ADMIN
                    </span>
                   )}
                </div>

                {/* PIN Display (Dots) */}
                <div className="flex justify-center gap-3 my-6">
                    {[0, 1, 2, 3].map((idx) => (
                        <div 
                            key={idx} 
                            className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                                idx < currentPin.length 
                                ? "bg-[#3A1078] border-[#3A1078] scale-110" 
                                : "bg-transparent border-[#0F172A]/20"
                            }`}
                        />
                    ))}
                </div>

                {/* Numeric Keypad */}
                <div className="p-6 pt-0">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <Button
                                key={num}
                                variant="secondary"
                                className="h-16" // Clase extra para altura
                                onClick={(e) => {
                                  e.stopPropagation(); 
                                  handlePinEntry(user.id, num.toString())
                                }}
                            >
                                {num}
                            </Button>
                        ))}
                        
                        {/* Empty spacer */}
                        <div /> 
                        
                        <Button
                             variant="secondary"
                             className="h-16"
                             onClick={(e) => { e.stopPropagation(); handlePinEntry(user.id, "0"); }}
                        >
                            0
                        </Button>
                        
                        <Button
                             variant="danger"
                             className="h-16"
                             onClick={(e) => { e.stopPropagation(); handleBackspace(user.id); }}
                        >
                           <span className="text-xl">⌫</span>
                        </Button>
                    </div>

                    <Button
                        variant="primary"
                        fullWidth
                        disabled={currentPin.length < 4}
                        onClick={() => handleLogin(user.id)}
                        className="py-4 text-lg" // Clases extra
                    >
                        <Lock size={20} strokeWidth={2} />
                        Acceder
                    </Button>
                </div>
              </Card>
          )})}
        </div>
        
        <div className="text-center mt-12">
            <p className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/30 backdrop-blur-md border border-white/40 text-[#0F172A]/60 text-sm font-medium">
                <Lock size={14} /> Encrypted Security System
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;