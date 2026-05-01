import { apiRequest } from '../../lib/api/client'
import type { LoginPayload, LoginResult } from './auth.types'

export const loginWithApi = async (payload: LoginPayload): Promise<LoginResult> => {
  const response = await apiRequest<LoginResult>('/api/auth/login', {
    method: 'POST',
    auth: false,
    body: JSON.stringify(payload),
  })

  return response.data
}
