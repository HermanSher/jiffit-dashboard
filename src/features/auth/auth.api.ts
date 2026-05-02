import { apiRequest } from '../../lib/api/client'
import { fetchMyPermissions, fetchMyScreens } from '../access/access.api'
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
  const response = await apiRequest<MeResult>('/api/auth/me')
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

export const bootstrapDashboardAccess = async (): Promise<{
  user: AuthUser
  screens: DashboardScreen[]
  permissions: EffectivePermission[]
}> => {
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
}
