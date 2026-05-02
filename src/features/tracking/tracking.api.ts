import { apiRequest } from '../../lib/api/client'
import type { HeroLiveFilters, HeroLiveLocation } from './tracking.types'

const toQueryString = (filters: HeroLiveFilters): string => {
  const params = new URLSearchParams()

  if (filters.city) {
    params.set('city', filters.city)
  }

  if (filters.service) {
    params.set('service', filters.service)
  }

  if (filters.active !== undefined) {
    params.set('active', String(filters.active))
  }

  params.set('limit', '200')

  return `?${params.toString()}`
}

export const fetchHeroLiveLocations = async (
  filters: HeroLiveFilters,
): Promise<HeroLiveLocation[]> => {
  const response = await apiRequest<HeroLiveLocation[]>(
    `/api/dashboard/heroes/live${toQueryString(filters)}`,
  )

  return response.data
}
