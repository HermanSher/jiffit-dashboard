import { apiRequest } from '../../lib/api/client'
import type { Employee, EmployeeRole } from '../employees/employees.types'
import type { DashboardScreen } from './access.types'

export interface PermissionCatalogItem {
  iMasterId: number
  sCode: string
  sName: string
  description: string | null
  isActive: boolean
}

export interface ScreenPermissionAssignment {
  iMasterId: number
  roleId?: number
  userId?: number
  screenId: number
  permissionId: number
  isAllowed: boolean
  screen: DashboardScreen
  permission: PermissionCatalogItem
}

export interface PermissionAssignmentPayload {
  assignments: Array<{
    screenId: number
    permissionId: number
    isAllowed: boolean
  }>
}

export const fetchScreensCatalog = async (): Promise<DashboardScreen[]> => {
  const response = await apiRequest<DashboardScreen[]>('/api/screens')
  return response.data
}

export const fetchPermissionsCatalog = async (): Promise<PermissionCatalogItem[]> => {
  const response = await apiRequest<PermissionCatalogItem[]>('/api/permissions')
  return response.data
}

export const fetchRoleTargets = async (): Promise<EmployeeRole[]> => {
  const response = await apiRequest<EmployeeRole[]>('/api/roles?isActive=true')
  return response.data
}

export const fetchUserTargets = async (): Promise<Employee[]> => {
  const response = await apiRequest<Employee[]>('/api/users')
  return response.data
}

export const fetchRoleScreenPermissions = async (
  roleId: number,
): Promise<ScreenPermissionAssignment[]> => {
  const response = await apiRequest<ScreenPermissionAssignment[]>(
    `/api/roles/${roleId}/screen-permissions`,
  )
  return response.data
}

export const fetchUserScreenPermissions = async (
  userId: number,
): Promise<ScreenPermissionAssignment[]> => {
  const response = await apiRequest<ScreenPermissionAssignment[]>(
    `/api/users/${userId}/screen-permissions`,
  )
  return response.data
}

export const saveRoleScreenPermissions = async (
  roleId: number,
  payload: PermissionAssignmentPayload,
): Promise<ScreenPermissionAssignment[]> => {
  const response = await apiRequest<ScreenPermissionAssignment[]>(
    `/api/roles/${roleId}/screen-permissions`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return response.data
}

export const saveUserScreenPermissions = async (
  userId: number,
  payload: PermissionAssignmentPayload,
): Promise<ScreenPermissionAssignment[]> => {
  const response = await apiRequest<ScreenPermissionAssignment[]>(
    `/api/users/${userId}/screen-permissions`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return response.data
}
