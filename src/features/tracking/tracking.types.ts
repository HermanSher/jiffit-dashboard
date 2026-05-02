export interface HeroLiveLocation {
  heroId: number
  username: string
  displayName: string
  mobileNo: string | null
  workerState: string | null
  isAvailable: boolean | null
  averageRating: number | null
  totalRatings: number | null
  latitude: number
  longitude: number
  accuracy: number | null
  heading: number | null
  speed: number | null
  batteryLevel: number | null
  lastUpdatedAt: string
  isStale: boolean
  status: 'LIVE' | 'STALE'
  serviceAreas: Array<{
    city: string | null
    state: string | null
    pincode: string | null
  }>
  services: Array<{
    serviceId: number
    serviceCode: string
    serviceName: string
  }>
}

export interface HeroLiveFilters {
  city?: string
  service?: string
  active?: boolean
}
