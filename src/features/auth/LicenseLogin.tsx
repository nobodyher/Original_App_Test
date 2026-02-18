import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../../firebase';
import { AlertCircle, Mail, KeyRound } from 'lucide-react';
import neonLogo from '../../assets/neon_logo.png';

export const LicenseLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      window.location.reload();
    } catch (err) {
      setError('Licencia no válida o error de conexión.');
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">

      {/* Animated background blobs */}
      <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[55%] bg-primary-500/10 rounded-full blur-[130px] animate-blob -z-10" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[50%] h-[50%] bg-primary-500/10 rounded-full blur-[130px] animate-blob animation-delay-2000 -z-10" />
      <div className="absolute top-[40%] left-[55%] w-[35%] h-[35%] bg-secondary/5 rounded-full blur-[100px] animate-blob -z-10" style={{ animationDelay: '4s' }} />

      {/* Card */}
      <div className="w-full max-w-md bg-surface border border-border rounded-3xl shadow-2xl shadow-black/40 p-10 relative z-10">

        {/* Logo + Brand */}
        <div className="flex flex-col items-center mb-8">
          <img
            src={neonLogo}
            alt="Logo"
            className="w-20 h-20 object-contain mb-4 drop-shadow-[0_0_12px_rgba(6,182,212,0.5)]"
          />
          <h1 className="text-4xl font-extrabold text-text-main tracking-tight">
            Voidly
          </h1>
          <p className="text-text-muted text-sm mt-1 tracking-wide">Inicia sesión para gestionar tu salón</p>
        </div>



        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-4">

          {/* Error banner */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl flex items-center gap-2 text-sm font-semibold">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Email */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest">
              Correo
            </label>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-void pl-10"
                placeholder="admin@negocio.com"
                required
                autoComplete="email"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-text-muted uppercase tracking-widest">
              Contraseña
            </label>
            <div className="relative">
              <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-void pl-10"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="
              w-full mt-2 py-3.5 px-6 rounded-xl
              bg-primary-500 text-black
              font-bold text-sm uppercase tracking-widest
              shadow-[0_0_20px_rgba(6,182,212,0.35)]
              hover:shadow-[0_0_30px_rgba(6,182,212,0.55)]
              hover:bg-primary-400
              active:scale-[0.98]
              transition-all duration-200
              disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
            "
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Verificando...
              </span>
            ) : (
              'Iniciar Sistema'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-center text-text-dim text-xs mt-8 tracking-wide">
          Acceso exclusivo para administradores autorizados
        </p>
      </div>
    </div>
  );
};