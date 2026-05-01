import { apiRequest } from '../../lib/api/client'
import type {
  CreateEmployeeResult,
  CreateEmployeePayload,
  Employee,
  EmployeeFilters,
  EmployeeRole,
  EmployeeUserType,
} from './employees.types'

const toQueryString = (filters: EmployeeFilters): string => {
  const params = new URLSearchParams()

  if (filters.id !== undefined) {
    params.set('id', String(filters.id))
  }

  if (filters.username) {
    params.set('username', filters.username)
  }

  if (filters.iRoleMasterId !== undefined) {
    params.set('iRoleMasterId', String(filters.iRoleMasterId))
  }

  if (filters.sRoleName) {
    params.set('sRoleName', filters.sRoleName)
  }

  if (filters.iUserTypeMasterId !== undefined) {
    params.set('iUserTypeMasterId', String(filters.iUserTypeMasterId))
  }

  if (filters.sUserTypeName) {
    params.set('sUserTypeName', filters.sUserTypeName)
  }

  if (filters.createdFrom) {
    params.set('createdFrom', filters.createdFrom)
  }

  if (filters.createdTo) {
    params.set('createdTo', filters.createdTo)
  }

  const query = params.toString()
  return query.length > 0 ? `?${query}` : ''
}

export const fetchEmployees = async (filters: EmployeeFilters = {}): Promise<Employee[]> => {
  const response = await apiRequest<Employee[]>(`/api/users${toQueryString(filters)}`)
  return response.data
}

export const fetchRoles = async (): Promise<EmployeeRole[]> => {
  const response = await apiRequest<EmployeeRole[]>('/api/roles?isActive=true')
  return response.data
}

export const fetchUserTypes = async (): Promise<EmployeeUserType[]> => {
  const response = await apiRequest<EmployeeUserType[]>('/api/user-types?isActive=true')
  return response.data
}

export const createEmployee = async (payload: CreateEmployeePayload): Promise<CreateEmployeeResult> => {
  const response = await apiRequest<CreateEmployeeResult>('/api/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export const deleteEmployeesByIds = async (userIds: number[]): Promise<void> => {
  await apiRequest<{
    requestedCount: number
    deletedCount: number
    deletedUserIds: number[]
  }>('/api/users/bulk', {
    method: 'DELETE',
    body: JSON.stringify({ usersId: userIds }),
  })
}
