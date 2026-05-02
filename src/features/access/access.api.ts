import { apiRequest } from '../../lib/api/client'
import type { DashboardScreen, EffectivePermission } from './access.types'

export const fetchMyScreens = async (): Promise<DashboardScreen[]> => {
  const response = await apiRequest<DashboardScreen[]>('/api/me/screens')
  return response.data
}

export const fetchMyPermissions = async (): Promise<EffectivePermission[]> => {
  const response = await apiRequest<EffectivePermission[]>('/api/me/permissions')
  return response.data
}
