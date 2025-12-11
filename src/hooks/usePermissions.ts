import { useAuth } from '../context/AuthContext';
import { ROLE_PERMISSIONS } from '../constants';
import { RolePermissions } from '../types';

export const usePermissions = () => {
  const { traceTIUser } = useAuth();

  const hasPermission = (permission: keyof RolePermissions): boolean => {
    if (!traceTIUser) return false;

    const permissionRole = traceTIUser.role === 'SUPER_ADMIN'
      ? 'super_admin'
      : traceTIUser.role === 'INTEGRATOR'
      ? 'admin'
      : 'user';

    return ROLE_PERMISSIONS[permissionRole]?.[permission] ?? false;
  };

  const canAccessItem = (item: { assigned_to?: string; created_by?: string; department?: string }): boolean => {
    if (!traceTIUser) return false;

    if (traceTIUser.role === 'SUPER_ADMIN' || traceTIUser.role === 'INTEGRATOR') {
      return true;
    }

    return item.assigned_to === traceTIUser.id || item.created_by === traceTIUser.id;
  };

  const canEditItem = (item: { assigned_to?: string; created_by?: string }): boolean => {
    if (!hasPermission('canEdit')) return false;
    if (traceTIUser?.role === 'SUPER_ADMIN' || traceTIUser?.role === 'INTEGRATOR') {
      return true;
    }
    return item.assigned_to === traceTIUser?.id || item.created_by === traceTIUser?.id;
  };

  const canDeleteItem = (): boolean => {
    return hasPermission('canDelete');
  };

  const permissionRole = traceTIUser?.role === 'SUPER_ADMIN'
    ? 'super_admin'
    : traceTIUser?.role === 'INTEGRATOR'
    ? 'admin'
    : 'user';

  return {
    hasPermission,
    canAccessItem,
    canEditItem,
    canDeleteItem,
    permissions: traceTIUser ? ROLE_PERMISSIONS[permissionRole] : null,
    role: permissionRole,
  };
};
