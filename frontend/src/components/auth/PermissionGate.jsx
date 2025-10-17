import { useMemo } from 'react';
import { useRBAC } from '../../context/RBACContext.jsx';

const normalizePermissions = (permissions) => {
  if (!permissions) {
    return [];
  }
  if (Array.isArray(permissions)) {
    return permissions;
  }
  return [permissions];
};

export const PermissionGate = ({
  permissions,
  mode = 'all',
  fallback = null,
  children,
  includeLegacyRole
}) => {
  const { permissionSet, isLoading, roles } = useRBAC();
  const requiredPermissions = useMemo(() => normalizePermissions(permissions), [permissions]);

  if (isLoading) {
    return null;
  }

  if (!requiredPermissions.length) {
    return children;
  }

  const hasPermissions =
    mode === 'any'
      ? requiredPermissions.some((permission) => permissionSet.has(permission))
      : requiredPermissions.every((permission) => permissionSet.has(permission));

  if (hasPermissions) {
    return children;
  }

  if (includeLegacyRole) {
    const legacyMatch = roles?.some((role) => role.name === includeLegacyRole);
    if (legacyMatch) {
      return children;
    }
  }

  return fallback;
};

export default PermissionGate;
