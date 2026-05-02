import { apiRequest } from '../../lib/api/client'

export const dispatchAssignment = async (bookingId: number): Promise<void> => {
  await apiRequest<unknown>(`/api/assignment/dispatch/${bookingId}`, {
    method: 'POST',
  })
}

export const retryAssignment = async (bookingId: number): Promise<void> => {
  await apiRequest<unknown>(`/api/assignment/retry/${bookingId}`, {
    method: 'POST',
  })
}
