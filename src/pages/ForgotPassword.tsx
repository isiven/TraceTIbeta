import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Radar, Mail, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Error al enviar el correo de recuperación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Radar className="w-12 h-12 text-[#00a651]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¿Olvidaste tu contraseña?
          </h1>
          <p className="text-gray-600">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {success ? (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
                <CheckCircle className="w-5 h-5 text-green-600 mr-3 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-green-800 font-medium mb-1">
                    Correo enviado exitosamente
                  </p>
                  <p className="text-green-700 text-sm">
                    Revisa tu bandeja de entrada y sigue las instrucciones para restablecer tu contraseña.
                  </p>
                </div>
              </div>

              <Link
                to="/login"
                className="block w-full bg-[#00a651] text-white text-center py-2 rounded-lg font-semibold hover:bg-[#008f45] transition-colors"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a651] focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                    disabled={loading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#00a651] text-white py-2 rounded-lg font-semibold hover:bg-[#008f45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
              </button>

              <Link
                to="/login"
                className="block text-center text-sm text-gray-600 hover:text-gray-900"
              >
                Volver al inicio de sesión
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
