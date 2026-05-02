import type { ReactNode } from 'react'
import type { PermissionAction } from '../../features/access/access.types'
import { usePermissionHelpers } from '../../features/access/permissions'

interface PermissionGateProps {
  screenCode: string
  action?: PermissionAction
  fallback?: ReactNode
  children: ReactNode
}

export const PermissionGate = ({
  screenCode,
  action = 'VIEW',
  fallback = null,
  children,
}: PermissionGateProps) => {
  const permissions = usePermissionHelpers()
  const allowed =
    action === 'VIEW'
      ? permissions.canView(screenCode)
      : action === 'CREATE'
        ? permissions.canCreate(screenCode)
        : action === 'UPDATE'
          ? permissions.canUpdate(screenCode)
          : action === 'DELETE'
            ? permissions.canDelete(screenCode)
            : action === 'EXPORT'
              ? permissions.canExport(screenCode)
              : permissions.canAssign(screenCode)

  return allowed ? children : fallback
}
