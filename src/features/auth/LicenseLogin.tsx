import React, { useState } from 'react';
import { signInWithEmailAndPassword, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth } from '../../firebase'; // Ajusta la ruta si es necesario
import { Lock, AlertCircle } from 'lucide-react';

import { Button } from '../../components/ui/Button'; // ✅ Esto busca el nombre exacto
import { Card } from '../../components/ui/Card';     // ✅ Esto también

export const LicenseLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // En src/features/auth/LicenseLogin.tsx

const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await setPersistence(auth, browserSessionPersistence);
      await signInWithEmailAndPassword(auth, email, password);
      
      // ✅ AGREGA ESTA LÍNEA AQUÍ:
      // Esto recarga la página para asegurar que la base de datos reconozca la licencia
      window.location.reload(); 

    } catch (err) {
      setError('Licencia no válida o error de conexión.');
      console.error(err);
      setLoading(false); // Solo quitamos el loading si falló
    } 
    // Nota: Si tiene éxito, no quitamos el loading porque la página se va a recargar
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary-900/10 via-background to-background -z-20" />
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-900/20 rounded-full blur-[120px] -z-10" />
      
      <Card className="w-full max-w-md p-8 bg-surface border border-border shadow-2xl shadow-black/50">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-primary-500/10 rounded-full flex items-center justify-center mx-auto mb-3 border border-primary-500/20">
            <Lock className="text-primary-500" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-text-main">Activar Licencia</h1>
          <p className="text-text-muted text-sm">Ingresa las credenciales del local</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-surface-highlight border border-border text-text-main rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-600"
              placeholder="admin@negocio.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-text-muted uppercase mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-surface-highlight border border-border text-text-main rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all placeholder:text-gray-600"
              placeholder="••••••••"
              required
            />
          </div>

          <Button 
            variant="primary" 
            fullWidth 
            disabled={loading} 
            type="submit"
            className="py-3 bg-primary-500 text-black font-bold hover:bg-primary-400 shadow-[0_0_20px_rgba(0,245,255,0.3)] hover:shadow-[0_0_30px_rgba(0,245,255,0.5)] transition-all rounded-xl mt-4"
          >
            {loading ? 'Verificando...' : 'Iniciar Sistema'}
          </Button>
        </form>
      </Card>
    </div>
  );
};