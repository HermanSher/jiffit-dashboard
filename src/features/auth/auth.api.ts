import { apiRequest } from '../../lib/api/client'
import { fetchMyPermissions, fetchMyScreens } from '../access/access.api'
import { isSuperUser } from '../access/permissions'
import type { DashboardScreen, EffectivePermission } from '../access/access.types'
import type { AuthTokenPair, AuthUser, LoginPayload, LoginResult, MeResult } from './auth.types'

export const loginWithApi = async (payload: LoginPayload): Promise<LoginResult> => {
  const response = await apiRequest<LoginResult>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })

  return response.data
}

export const refreshWithApi = async (refreshToken: string): Promise<AuthTokenPair> => {
  const response = await apiRequest<AuthTokenPair>('/api/auth/refresh', {
    method: 'POST',
    auth: false,
    body: JSON.stringify({ refreshToken }),
  })

  return response.data
}

export const logoutWithApi = async (): Promise<void> => {
  await apiRequest<null>('/api/auth/logout', {
    method: 'POST',
  })
}

export const getMeWithApi = async (): Promise<MeResult> => {
  const response = await apiRequest<MeResult>('/api/auth/me', {
    toastErrors: false,
  })
  return response.data
}

export const normalizeMeUser = (profile: MeResult): AuthUser => ({
  id: profile.id,
  username: profile.username,
  name: profile.name,
  email: profile.email,
  role: profile.role.sName ?? 'User',
  roleCode: profile.role.sCode ?? '',
  rolePrecedence: profile.role.precedence,
  userType: profile.userType.sName ?? '',
  userTypeCode: profile.userType.sCode ?? '',
  isActive: profile.isActive,
  employmentStatus: profile.employmentStatus,
})

const isMissingNewAuthRoute = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  return message.includes('route not found') || message.includes('request failed with status 404')
}

export const bootstrapDashboardAccess = async (fallbackUser?: AuthUser): Promise<{
  user: AuthUser
  screens: DashboardScreen[]
  permissions: EffectivePermission[]
}> => {
  try {
    const [profile, screens, permissions] = await Promise.all([
      getMeWithApi(),
      fetchMyScreens(),
      fetchMyPermissions(),
    ])

    return {
      user: normalizeMeUser(profile),
      screens,
      permissions,
    }
  } catch (error) {
    if (fallbackUser && isSuperUser(fallbackUser) && isMissingNewAuthRoute(error)) {
      return {
        user: fallbackUser,
        screens: [],
        permissions: [],
      }
    }

    throw error
  }
}
