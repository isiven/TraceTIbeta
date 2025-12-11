import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'admin' | 'manager' | 'user' | 'viewer';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00a651]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && profile && !hasRequiredRole(profile.role, requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acceso Denegado</h2>
          <p className="text-gray-600 mb-4">
            No tienes permisos suficientes para acceder a esta sección.
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-[#00a651] text-white px-4 py-2 rounded-lg hover:bg-[#008f45] transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function hasRequiredRole(
  userRole: string,
  requiredRole: string
): boolean {
  const roleHierarchy: Record<string, number> = {
    super_admin: 5,
    admin: 4,
    manager: 3,
    user: 2,
    viewer: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
