import { apiRequest } from '../../lib/api/client'
import type {
  HeroVerificationApplication,
  HeroVerificationFilters,
  HeroVerificationUpdatePayload,
} from './hero-verifications.types'

const toQueryString = (filters: HeroVerificationFilters): string => {
  const params = new URLSearchParams()

  if (filters.status) {
    params.set('status', filters.status)
  }

  if (filters.city?.trim()) {
    params.set('city', filters.city.trim())
  }

  if (filters.search?.trim()) {
    params.set('search', filters.search.trim())
  }

  params.set('limit', '200')
  return `?${params.toString()}`
}

export const fetchHeroVerifications = async (
  filters: HeroVerificationFilters,
): Promise<HeroVerificationApplication[]> => {
  const response = await apiRequest<HeroVerificationApplication[]>(
    `/api/dashboard/hero-verifications${toQueryString(filters)}`,
  )

  return response.data
}

export const fetchHeroVerification = async (id: number): Promise<HeroVerificationApplication> => {
  const response = await apiRequest<HeroVerificationApplication>(
    `/api/dashboard/hero-verifications/${id}`,
  )

  return response.data
}

export const verifyHeroVerification = async (
  id: number,
  adminRemarks?: string,
): Promise<HeroVerificationApplication> => {
  const response = await apiRequest<HeroVerificationApplication>(
    `/api/dashboard/hero-verifications/${id}/verify`,
    {
      method: 'POST',
      body: JSON.stringify({ adminRemarks }),
    },
  )

  return response.data
}

export const updateHeroVerification = async (
  id: number,
  payload: HeroVerificationUpdatePayload,
): Promise<HeroVerificationApplication> => {
  const response = await apiRequest<HeroVerificationApplication>(
    `/api/dashboard/hero-verifications/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  )

  return response.data
}

export const rejectHeroVerification = async (
  id: number,
  rejectionReason: string,
  adminRemarks?: string,
): Promise<HeroVerificationApplication> => {
  const response = await apiRequest<HeroVerificationApplication>(
    `/api/dashboard/hero-verifications/${id}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ rejectionReason, adminRemarks }),
    },
  )

  return response.data
}

export const requestHeroResubmission = async (
  id: number,
  adminRemarks: string,
): Promise<HeroVerificationApplication> => {
  const response = await apiRequest<HeroVerificationApplication>(
    `/api/dashboard/hero-verifications/${id}/resubmission-required`,
    {
      method: 'POST',
      body: JSON.stringify({ adminRemarks }),
    },
  )

  return response.data
}
