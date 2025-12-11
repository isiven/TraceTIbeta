import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Radar, Mail, Lock, User, Building2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { signUp } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    accountType: 'end_user' as 'integrator' | 'end_user',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validaciones
      if (!formData.fullName.trim()) {
        throw new Error('Nombre completo es requerido');
      }
      if (!formData.email.trim()) {
        throw new Error('Email es requerido');
      }
      if (!formData.organizationName.trim()) {
        throw new Error('Nombre de empresa es requerido');
      }
      if (formData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      // Llamar signUp del AuthContext con TODOS los datos
      await signUp({
        email: formData.email.trim(),
        password: formData.password,
        fullName: formData.fullName.trim(),
        companyName: formData.organizationName.trim(),
        accountType: formData.accountType,
      });

      // Éxito - redirigir al dashboard
      navigate('/app');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error al registrarse con Google');
      setLoading(false);
    }
  };

  const handleMicrosoftSignup = async () => {
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'azure',
        options: {
          redirectTo: `${window.location.origin}/app`,
        },
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Error al registrarse con Microsoft');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Radar className="w-12 h-12 text-[#00a651]" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Crea tu cuenta
          </h1>
          <p className="text-gray-600">
            Comienza a gestionar tus activos IT hoy
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 mb-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre Completo
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a651] focus:border-transparent"
                  placeholder="Juan Pérez"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a651] focus:border-transparent"
                  placeholder="tu@email.com"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="organizationName" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre de la Empresa
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="organizationName"
                  name="organizationName"
                  type="text"
                  value={formData.organizationName}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a651] focus:border-transparent"
                  placeholder="Mi Empresa"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="accountType" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Cuenta
              </label>
              <select
                id="accountType"
                name="accountType"
                value={formData.accountType}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a651] focus:border-transparent"
                disabled={loading}
              >
                <option value="end_user">Usuario Final</option>
                <option value="integrator">Integrador (Multi-cliente)</option>
              </select>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a651] focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#00a651] focus:border-transparent"
                  placeholder="••••••••"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="w-4 h-4 text-[#00a651] border-gray-300 rounded focus:ring-[#00a651] mt-1"
                required
                disabled={loading}
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-700">
                Acepto los{' '}
                <a href="#" className="text-[#00a651] hover:underline">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="#" className="text-[#00a651] hover:underline">
                  política de privacidad
                </a>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00a651] text-white py-2 rounded-lg font-semibold hover:bg-[#008f45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
            </button>
          </form>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">O regístrate con</span>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Google
            </button>

            <button
              onClick={handleMicrosoftSignup}
              disabled={loading}
              className="w-full border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 23 23">
                <path fill="#f35325" d="M0 0h11v11H0z" />
                <path fill="#81bc06" d="M12 0h11v11H12z" />
                <path fill="#05a6f0" d="M0 12h11v11H0z" />
                <path fill="#ffba08" d="M12 12h11v11H12z" />
              </svg>
              Microsoft
            </button>
          </div>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          ¿Ya tienes una cuenta?{' '}
          <Link to="/login" className="text-[#00a651] font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
