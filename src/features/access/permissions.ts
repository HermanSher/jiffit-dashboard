import { useMemo } from 'react'
import { useAuthStore } from '../auth/auth.store'
import type { AuthUser } from '../auth/auth.types'
import type { DashboardScreen, EffectivePermission, PermissionAction } from './access.types'

const normalizeCode = (value: string | null | undefined): string =>
  String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

export const isSuperUser = (user: AuthUser | null | undefined): boolean =>
  normalizeCode(user?.roleCode) === 'SU' || normalizeCode(user?.role) === 'SUPER_USER'

export const isCustomerUser = (user: AuthUser | null | undefined): boolean => {
  const typeCode = normalizeCode(user?.userTypeCode)
  const typeName = normalizeCode(user?.userType)

  return typeCode.includes('CUSTOMER') || typeName.includes('CUSTOMER')
}

const permissionMatchesAction = (
  permissionCode: string,
  screenCode: string,
  action: PermissionAction,
): boolean => {
  const normalizedPermission = normalizeCode(permissionCode)
  const normalizedScreen = normalizeCode(screenCode)
  const normalizedAction = normalizeCode(action)

  return (
    normalizedPermission === normalizedAction ||
    normalizedPermission === `${normalizedScreen}_${normalizedAction}` ||
    normalizedPermission.endsWith(`_${normalizedAction}`)
  )
}

export const hasScreenAction = (
  user: AuthUser | null,
  permissions: EffectivePermission[],
  screenCode: string,
  action: PermissionAction,
): boolean => {
  if (isSuperUser(user)) {
    return true
  }

  if (isCustomerUser(user)) {
    return false
  }

  const normalizedScreen = normalizeCode(screenCode)

  return permissions.some((entry) => {
    if (!entry.isAllowed) {
      return false
    }

    const entryScreen = normalizeCode(entry.screenCode)
    return (
      entryScreen === normalizedScreen &&
      permissionMatchesAction(entry.permissionCode, screenCode, action)
    )
  })
}

export const hasAnyScreenAccess = (
  user: AuthUser | null,
  screens: DashboardScreen[],
  permissions: EffectivePermission[],
  screenCode: string,
  routePath?: string,
): boolean => {
  if (isSuperUser(user)) {
    return true
  }

  if (isCustomerUser(user)) {
    return false
  }

  const normalizedScreen = normalizeCode(screenCode)
  const normalizedRoute = routePath?.trim()

  return (
    hasScreenAction(user, permissions, screenCode, 'VIEW') ||
    screens.some((screen) => normalizeCode(screen.sCode) === normalizedScreen) ||
    Boolean(normalizedRoute && screens.some((screen) => screen.routePath === normalizedRoute))
  )
}

export const usePermissionHelpers = () => {
  const user = useAuthStore((state) => state.user)
  const screens = useAuthStore((state) => state.screens)
  const permissions = useAuthStore((state) => state.permissions)

  return useMemo(
    () => ({
      isSuperUser: isSuperUser(user),
      isCustomerUser: isCustomerUser(user),
      canView: (screenCode: string) => hasScreenAction(user, permissions, screenCode, 'VIEW'),
      canCreate: (screenCode: string) => hasScreenAction(user, permissions, screenCode, 'CREATE'),
      canUpdate: (screenCode: string) => hasScreenAction(user, permissions, screenCode, 'UPDATE'),
      canDelete: (screenCode: string) => hasScreenAction(user, permissions, screenCode, 'DELETE'),
      canExport: (screenCode: string) => hasScreenAction(user, permissions, screenCode, 'EXPORT'),
      canAssign: (screenCode: string) => hasScreenAction(user, permissions, screenCode, 'ASSIGN'),
      canAccessScreen: (screenCode: string, routePath?: string) =>
        hasAnyScreenAccess(user, screens, permissions, screenCode, routePath),
    }),
    [permissions, screens, user],
  )
}
