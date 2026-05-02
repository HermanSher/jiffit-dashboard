import { apiRequest } from '../../lib/api/client'
import type { MasterRecord } from './masters.types'

export const fetchMasterRecords = async (endpoint: string): Promise<MasterRecord[]> => {
  const response = await apiRequest<MasterRecord[]>(`${endpoint}?isActive=true`)

  if (response.data.length > 0) {
    return response.data
  }

  const fallbackResponse = await apiRequest<MasterRecord[]>(endpoint)
  return fallbackResponse.data
}

export const createMasterRecord = async (
  endpoint: string,
  payload: Record<string, unknown>,
): Promise<MasterRecord> => {
  const response = await apiRequest<MasterRecord>(endpoint, {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export const deleteMasterRecord = async (
  endpoint: string,
  id: number | string,
): Promise<MasterRecord> => {
  const response = await apiRequest<MasterRecord>(`${endpoint}/${id}`, {
    method: 'DELETE',
  })

  return response.data
}

export const updateMasterRecord = async (
  endpoint: string,
  id: number | string,
  payload: Record<string, unknown>,
): Promise<MasterRecord> => {
  const response = await apiRequest<MasterRecord>(`${endpoint}/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return response.data
}
