import React, { useState, useEffect, useCallback } from "react";
import { Lock, ArrowLeft, Delete } from "lucide-react";
import NotificationToast from "../../components/ui/NotificationToast";
import { Card } from "../../components/ui/Card";
import type { AppUser, Toast } from "../../types";

import ThemeToggle from "../../components/ui/ThemeToggle";
import { UserAvatar } from "../../components/ui/UserAvatar";
import neonLogo from "../../assets/neon_logo.png";
import { verifyPin } from "../../utils/security";
import {
  isLockedOut,
  getLockoutSecondsRemaining,
  recordFailedAttempt,
  getRemainingAttempts,
  clearAttempts,
} from "../../utils/pinAttempts";

interface LoginScreenProps {
  users: AppUser[];
  onLogin: (user: AppUser) => void;
  showNotification: (message: string, type?: Toast["type"]) => void;
  notification: Toast | null;
  loading?: boolean;
}

const LoginScreen: React.FC<LoginScreenProps> = ({
  users,
  onLogin,
  showNotification,
  notification,
}) => {
  const [selectedUser, setSelectedUser] = useState<AppUser | null>(null);
  const [pin, setPin] = useState("");
  const [lockoutSeconds, setLockoutSeconds] = useState(0);

  const activeUsers = users
    .filter((u) => u.active)
    .sort((a, b) => {
      if (a.role === "owner" && b.role !== "owner") return -1;
      if (a.role !== "owner" && b.role === "owner") return 1;
      return 0;
    });

  // Lockout countdown timer
  useEffect(() => {
    if (!selectedUser) return;
    const interval = setInterval(() => {
      const remaining = getLockoutSecondsRemaining(selectedUser.id);
      setLockoutSeconds(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedUser]);

  const handleUserClick = (user: AppUser) => {
    setSelectedUser(user);
    setPin("");
    setLockoutSeconds(getLockoutSecondsRemaining(user.id));
  };

  const handleBack = () => {
    setSelectedUser(null);
    setPin("");
  };

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      setPin((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
  };

  const handleLogin = useCallback(async () => {
    if (!selectedUser) return;

    // Check lockout before attempting
    if (isLockedOut(selectedUser.id)) {
      const secs = getLockoutSecondsRemaining(selectedUser.id);
      showNotification(`Demasiados intentos. Espera ${secs}s`, "error");
      setPin("");
      return;
    }

    let isValid = false;
    try {
      // All PINs must be bcrypt hashes (starting with $2)
      if (selectedUser.pin.startsWith("$2")) {
        isValid = await verifyPin(pin, selectedUser.pin);
      } else {
        // PIN not hashed yet — reject and prompt admin to update
        console.warn(`User ${selectedUser.name} has an unhashed PIN. Please update via admin panel.`);
        isValid = false;
      }
    } catch (error) {
      console.error("Error verifying PIN:", error);
      isValid = false;
    }

    if (isValid) {
      clearAttempts(selectedUser.id);
      // Reset view to Dashboard on explicit login
      localStorage.setItem("owner_currentView", "dashboard");
      onLogin(selectedUser);
      showNotification(`¡Bienvenida ${selectedUser.name}!`);
      setPin("");
      setSelectedUser(null);
    } else {
      recordFailedAttempt(selectedUser.id);
      const remaining = getRemainingAttempts(selectedUser.id);
      const locked = isLockedOut(selectedUser.id);

      if (locked) {
        setLockoutSeconds(getLockoutSecondsRemaining(selectedUser.id));
        showNotification("Cuenta bloqueada por 30 segundos", "error");
      } else if (remaining > 0) {
        showNotification(`PIN incorrecto. Intentos restantes: ${remaining}`, "error");
      } else {
        showNotification("PIN incorrecto", "error");
      }
      setPin("");
    }
  }, [selectedUser, pin, onLogin, showNotification]);

  // Keyboard support for PIN entry
  useEffect(() => {
    if (!selectedUser) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isLockedOut(selectedUser.id)) return; // Block keyboard input during lockout
      // Numbers 0-9
      if (/^\d$/.test(e.key)) {
        setPin((prev) => (prev.length < 4 ? prev + e.key : prev));
      }
      // Backspace
      else if (e.key === "Backspace") {
        setPin((prev) => prev.slice(0, -1));
      }
      // Escape
      else if (e.key === "Escape") {
        setSelectedUser(null);
        setPin("");
      }
      // Enter
      else if (e.key === "Enter") {
        handleLogin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedUser, handleLogin]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>
      {/* Background Effects */}

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-background to-background -z-20" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-900/20 rounded-full blur-[120px] -z-10 animate-blob" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary-800/10 rounded-full blur-[120px] -z-10 animate-blob animation-delay-2000" />

      <NotificationToast notification={notification} />

      <div className="w-full max-w-4xl relative z-10 p-6">
        {/* Header (Visible only when no user is selected) */}
        {!selectedUser && (
          <div className="text-center mb-12 space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="inline-flex p-4 rounded-3xl bg-surface/40 backdrop-blur-md border border-white/10 shadow-2xl shadow-black/20 mb-4 ring-1 ring-white/5">
              <img 
                src={neonLogo} 
                alt="Logo" 
                className="w-16 h-16 object-contain dark:filter-none filter invert"
              />
            </div>
            <h1 className="text-5xl text-text-main tracking-tight drop-shadow-lg font-bold">
              <span className="text-primary-500">Voidly</span>
            </h1>
            <p className="text-text-muted text-sm uppercase tracking-wider font-semibold">
              Selecciona tu usuario
            </p>
          </div>
        )}

        {/* STEP 1: User Selection */}
        {!selectedUser && (
          <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto animate-in zoom-in-95 duration-500">
            {activeUsers.map((user) => (
              <button
                key={user.id}
                onClick={() => handleUserClick(user)}
                className="w-40 sm:w-48 group relative flex flex-col items-center p-6 rounded-2xl bg-surface border border-border hover:bg-surface-highlight hover:border-primary-500/30 transition-all duration-300 hover:scale-105 active:scale-95 text-left h-full"
              >
                <div className="relative w-24 h-24 rounded-full p-[3px] bg-gradient-to-tr from-primary-500 to-primary-600 shadow-lg shadow-primary-500/20 mb-4 group-hover:shadow-primary-500/40 transition-shadow">
                  <div className="w-full h-full rounded-full bg-surface-highlight flex items-center justify-center border-2 border-surface overflow-hidden">
                    <UserAvatar
                      image={user.photoURL}
                      name={user.name}
                      size="w-full h-full"
                      className="rounded-full"
                    />
                  </div>
                </div>
                <span className="text-lg font-bold text-text-muted group-hover:text-primary-500 transition-colors">
                  {user.name}
                </span>
                <span className={`mt-2 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border transition-colors duration-300 group-hover:bg-surface-highlight/50
                  ${
                    user.role === "owner"
                      ? "text-primary-500/70 border-primary-500/20"
                      : "text-text-muted/70 border-border"
                  }`}
                >
                  {user.role === "owner" ? "Admin" : "Staff"}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* STEP 2: PIN Entry */}
        {selectedUser && (
          <div className="max-w-sm mx-auto animate-in zoom-in-95 slide-in-from-bottom-8 duration-500">
            <Card className="p-8 backdrop-blur-xl bg-surface/60 border-primary-500/20 shadow-2xl shadow-black/40 relative overflow-hidden">
              {/* Back Button */}
              <button
                onClick={handleBack}
                className="absolute top-4 left-4 p-2 text-text-muted hover:text-white hover:bg-white/10 rounded-full transition-colors z-20"
                aria-label="Volver"
              >
                <ArrowLeft size={24} />
              </button>

              {/* User Info with Void Glow */}
              <div className="text-center mb-8 mt-4">
                <div className="relative w-24 h-24 mx-auto mb-4 rounded-full p-[3px] bg-gradient-to-tr from-primary-500 to-primary-600 shadow-lg shadow-primary-500/40 ring-4 ring-primary-500/20 animate-pulse-slow">
                  <div className="w-full h-full rounded-full bg-surface-highlight flex items-center justify-center border-2 border-surface overflow-hidden">
                    <UserAvatar
                      image={selectedUser.photoURL}
                      name={selectedUser.name}
                      size="w-full h-full"
                      className="rounded-full"
                    />
                  </div>
                </div>
                <h2 className="text-2xl font-bold text-text-main mb-1">
                  Hola, {selectedUser.name}
                </h2>
                <p className="text-sm text-text-muted font-medium">
                  Ingresa tu PIN de acceso
                </p>
              </div>

              {/* PIN Dots */}
              <div className="flex justify-center gap-4 mb-8">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-300 ${
                      idx < pin.length
                        ? "bg-primary-500 shadow-[0_0_15px_rgba(6,182,212,0.8)] scale-125"
                        : "bg-surface-highlight border-2 border-border opacity-50"
                    }`}
                  />
                ))}
              </div>

              {/* Lockout Warning */}
              {lockoutSeconds > 0 && (
                <div className="mb-4 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-center">
                  <p className="text-red-400 text-sm font-medium">
                    ⚠️ Bloqueado por {lockoutSeconds}s
                  </p>
                </div>
              )}

              {/* Keypad */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    onClick={() => handleDigit(num.toString())}
                    disabled={lockoutSeconds > 0}
                    className="h-16 w-16 mx-auto rounded-full bg-surface border border-border text-2xl font-bold text-text-main hover:bg-surface-highlight hover:text-primary-600 hover:border-primary-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                  >
                    {num}
                  </button>
                ))}
                <div /> {/* Spacer */}
                <button
                  onClick={() => handleDigit("0")}
                  disabled={lockoutSeconds > 0}
                  className="h-16 w-16 mx-auto rounded-full bg-surface border border-border text-2xl font-bold text-text-main hover:bg-surface-highlight hover:text-primary-600 hover:border-primary-400 hover:scale-110 active:scale-95 transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  0
                </button>
                <button
                  onClick={handleBackspace}
                  disabled={lockoutSeconds > 0}
                  className="h-16 w-16 mx-auto rounded-full bg-surface border border-border text-red-400 flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/50 hover:scale-105 active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Delete size={24} />
                </button>
              </div>

              <button
                onClick={handleLogin}
                disabled={pin.length < 4 || lockoutSeconds > 0}
                className="w-full py-4 rounded-xl bg-primary-600 text-white font-bold text-lg hover:bg-primary-500 hover:shadow-lg hover:shadow-primary-500/20 disabled:opacity-50 disabled:shadow-none transition-all duration-300 flex items-center justify-center gap-2 transform active:scale-95"
              >
                <Lock size={20} />
                {lockoutSeconds > 0 ? `Bloqueado (${lockoutSeconds}s)` : "Acceder"}
              </button>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginScreen;
