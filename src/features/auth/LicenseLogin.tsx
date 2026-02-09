import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-md p-8 bg-white shadow-xl">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Lock className="text-white" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Activar Licencia</h1>
          <p className="text-slate-500 text-sm">Ingresa las credenciales del local</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg flex items-center gap-2 text-sm font-bold">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Correo</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="admin@negocio.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <Button variant="primary" fullWidth disabled={loading} type="submit">
            {loading ? 'Verificando...' : 'Iniciar Sistema'}
          </Button>
        </form>
      </Card>
    </div>
  );
};