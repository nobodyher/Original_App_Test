import React, { useState } from "react";
import {
  TrendingUp,
  Crown,
  User,
  Lock,
} from "lucide-react";
import NotificationToast from "../../components/ui/NotificationToast";
import type { AppUser, Toast } from "../../types";

interface LoginScreenProps {
  users: AppUser[];
  loading: boolean;
  onLogin: (user: AppUser) => void;
  showNotification: (message: string, type?: Toast["type"]) => void;
  notification: Toast | null;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  loading,
  onLogin,
  showNotification,
  notification,
}) => {
  const [pins, setPins] = useState<Record<string, string>>({});
  
  const handlePinEntry = (userId: string, digit: string) => {
    const currentPin = pins[userId] || "";
    if (currentPin.length < 4) {
      const newPin = currentPin + digit;
      setPins({ ...pins, [userId]: newPin });
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

  const handleKeyDown = (e: React.KeyboardEvent, userId: string) => {
     if (e.key === "Enter") handleLogin(userId);
     if (e.key === "Backspace") handleBackspace(userId);
     if (/^[0-9]$/.test(e.key)) handlePinEntry(userId, e.key);
  };

  const activeUsers = users.filter((u) => u.active);

  if (loading) {
    return (
        <div className="min-h-screen bg-[#e0e5ec] flex items-center justify-center overflow-hidden relative">
          <div className="absolute top-[-20%] left-[-10%] w-[50vh] h-[50vh] bg-purple-400/30 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[50vh] h-[50vh] bg-pink-400/30 rounded-full blur-[100px]" />
          
          <div className="relative z-10 text-center">
             <div className="inline-flex items-center justify-center p-6 bg-white/20 backdrop-blur-xl rounded-[2rem] shadow-glass border border-white/40 mb-6 animate-pulse">
                <TrendingUp className="text-purple-600" size={56} />
             </div>
             <p className="text-gray-600 text-lg font-medium tracking-wide">Iniciando sistema...</p>
          </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 overflow-hidden relative selection:bg-purple-100">
      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-gray-100 to-purple-50 -z-20" />
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-300/30 rounded-full blur-[120px] -z-10 animate-blob" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-pink-300/30 rounded-full blur-[120px] -z-10 animate-blob animation-delay-2000" />
      <div className="absolute top-[40%] left-[40%] w-[400px] h-[400px] bg-blue-200/30 rounded-full blur-[100px] -z-10 animate-blob animation-delay-4000" />

      <NotificationToast notification={notification} />

      {/* Main Container */}
      <div className="w-full max-w-[1400px] relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex p-4 rounded-3xl bg-white/30 backdrop-blur-md border border-white/50 shadow-lg mb-4 ring-1 ring-white/60">
             <TrendingUp className="text-purple-700" size={48} strokeWidth={1.5} />
          </div>
          <h1 className="text-6xl font-black text-gray-800 tracking-tight drop-shadow-sm">
            Blossom<span className="text-purple-600">Nails</span>
          </h1>
          <p className="text-gray-500 text-xl font-medium tracking-wide uppercase text-opacity-80">
            Punto de Venta
          </p>
        </div>

        {/* Users Grid */}
        <div className="flex flex-wrap justify-center gap-8 items-start">
          {activeUsers.map((user) => {
              const currentPin = pins[user.id] || "";

              return (
              <div
                key={user.id}
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e, user.id)}
                className="group relative flex flex-col w-full max-w-[380px] bg-white/40 backdrop-blur-xl border border-white/60 rounded-[2.5rem] shadow-xl hover:shadow-2xl transition-all duration-500 overflow-hidden outline-none focus:ring-4 focus:ring-purple-400/50 cursor-pointer"
                onClick={(e) => {
                  // Ensure focus on click
                  e.currentTarget.focus();
                }}
              >
                {/* User Header / Avatar */}
                <div className="relative p-8 pb-4 flex flex-col items-center z-10">
                   <div className={`relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr ${user.color} shadow-lg mb-4 group-hover:scale-110 transition-transform duration-500`}>
                      <div className="w-full h-full rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center border-2 border-transparent">
                          {user.icon === "crown" ? (
                            <Crown className="text-gray-700" size={40} strokeWidth={1.5} />
                          ) : (
                            <User className="text-gray-700" size={40} strokeWidth={1.5} />
                          )}
                      </div>
                   </div>
                   <h3 className="text-2xl font-bold text-gray-800 mb-1">{user.name}</h3>
                   
                   {user.role === "owner" && (
                    <span className="px-3 py-1 bg-purple-100/50 border border-purple-200 text-purple-700 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
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
                                ? "bg-gray-800 border-gray-800 scale-110" 
                                : "bg-transparent border-gray-300"
                            }`}
                        />
                    ))}
                </div>

                {/* Numeric Keypad */}
                <div className="p-6 pt-0">
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent re-focusing parent if clicking button? 
                                  // Actually, we WANT parent to stay focused so typing continues working.
                                  // But clicking a button might steal focus if we aren't careful.
                                  // Let's explicitly keep focus on the card if possible or just rely on the card wrapper capturing keys if focused.
                                  // If button is clicked, it gets focus. Keydown on button propagates to parent? 
                                  // Yes, event bubbling. So if a button inside is focused, and we type, it should bubble up.
                                  handlePinEntry(user.id, num.toString())
                                }}
                                tabIndex={-1} // Prevent tabbing to individual number buttons to keep Tab navigation clean (user card -> next user card)
                                className="h-16 rounded-2xl bg-white/50 border border-white/60 shadow-sm text-2xl font-semibold text-gray-700 hover:bg-white/80 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center outline-none focus:bg-white/80"
                            >
                                {num}
                            </button>
                        ))}
                        {/* Empty spacer or 0 */}
                        <div /> 
                        <button
                             onClick={(e) => { e.stopPropagation(); handlePinEntry(user.id, "0"); }}
                             tabIndex={-1}
                             className="h-16 rounded-2xl bg-white/50 border border-white/60 shadow-sm text-2xl font-semibold text-gray-700 hover:bg-white/80 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center outline-none"
                        >
                            0
                        </button>
                        <button
                             onClick={(e) => { e.stopPropagation(); handleBackspace(user.id); }}
                             tabIndex={-1}
                             className="h-16 rounded-2xl bg-white/30 border border-white/40 shadow-sm text-gray-500 hover:bg-red-50 hover:text-red-500 hover:border-red-200 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center outline-none"
                        >
                           <span className="text-xl">⌫</span>
                        </button>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); handleLogin(user.id); }}
                        tabIndex={-1}
                        disabled={currentPin.length < 4}
                         className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all duration-300 ${
                            currentPin.length === 4 
                            ? `bg-gradient-to-r ${user.color} text-white hover:shadow-purple-500/30 hover:-translate-y-1`
                            : "bg-gray-200 text-gray-400 cursor-not-allowed"
                         }`}
                    >
                        <Lock size={20} strokeWidth={2} />
                        Acceder
                    </button>
                </div>
              </div>
          )})}
        </div>
        
        <div className="text-center mt-12">
            <p className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-white/20 backdrop-blur-md border border-white/30 text-gray-500 text-sm font-medium">
                <Lock size={14} /> Encrypted Security System
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
