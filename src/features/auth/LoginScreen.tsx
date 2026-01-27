import React, { useState } from "react";
import {
  TrendingUp,
  Crown,
  User,
  Eye,
  EyeOff,
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
  const [showPin, setShowPin] = useState<Record<string, boolean>>({});

  const handlePinChange = (userId: string, value: string) => {
    const numericValue = value.replace(/\D/g, "").slice(0, 4);
    setPins({ ...pins, [userId]: numericValue });
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

  const handleKeyPress = (e: React.KeyboardEvent, userId: string) => {
    if (e.key === "Enter" && (pins[userId] || "").length === 4)
      handleLogin(userId);
  };

  const activeUsers = users.filter((u) => u.active);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-3xl shadow-2xl mb-6 animate-pulse">
            <TrendingUp className="text-white" size={56} />
          </div>
          <p className="text-gray-600 text-lg font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 flex items-center justify-center p-4">
      <NotificationToast notification={notification} />
      <div className="w-full max-w-5xl">
        <div className="text-center mb-12">
          <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 p-4 rounded-3xl shadow-2xl mb-6">
            <TrendingUp className="text-white" size={56} />
          </div>
          <h1 className="text-5xl font-black text-gray-800 mb-3 tracking-tight">
            Blossom Nails
          </h1>
          <p className="text-gray-500 text-lg font-medium">
            Sistema de Gestión
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeUsers.map((user) => (
            <div
              key={user.id}
              className="bg-white rounded-3xl shadow-xl p-8 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-100"
            >
              <div className="text-center mb-6">
                <div
                  className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br ${user.color} shadow-lg mb-4`}
                >
                  {user.icon === "crown" ? (
                    <Crown className="text-white" size={40} />
                  ) : (
                    <User className="text-white" size={40} />
                  )}
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-1">
                  {user.name}
                </h3>
                {user.role === "owner" && (
                  <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase">
                    Administradora
                  </span>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 ml-1 uppercase tracking-wider">
                    Ingresa tu PIN
                  </label>
                  <div className="relative">
                    <input
                      type={showPin[user.id] ? "text" : "password"}
                      value={pins[user.id] || ""}
                      onChange={(e) =>
                        handlePinChange(user.id, e.target.value)
                      }
                      onKeyPress={(e) => handleKeyPress(e, user.id)}
                      maxLength={4}
                      placeholder="••••"
                      className="w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:border-purple-500 focus:bg-white focus:outline-none text-3xl text-center tracking-[0.5em] transition-all font-bold"
                    />
                    <button
                      onClick={() =>
                        setShowPin({
                          ...showPin,
                          [user.id]: !showPin[user.id],
                        })
                      }
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-purple-500 transition-colors"
                    >
                      {showPin[user.id] ? (
                        <EyeOff size={20} />
                      ) : (
                        <Eye size={20} />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleLogin(user.id)}
                  disabled={!pins[user.id] || pins[user.id].length < 4}
                  className={`w-full bg-gradient-to-r ${user.color} text-white py-4 rounded-2xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  <Lock size={20} />
                  Entrar
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8 text-gray-400 text-sm">
          <p className="flex items-center justify-center gap-2">
            <Lock size={16} />
            Sistema seguro con autenticación por PIN personal
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginScreen;
