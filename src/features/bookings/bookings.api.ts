import { apiRequest } from '../../lib/api/client'
import type {
  BookingCustomer,
  BookingRecord,
  BookingService,
  BookingSlot,
  CreateBookingPayload,
  ServiceLocation,
  UpdateBookingPayload,
  UpdateBookingStatusPayload,
} from './bookings.types'

const fallbackServiceLocations: ServiceLocation[] = [
  {
    sCode: 'PATNA',
    sName: 'Patna',
    state: 'Bihar',
    country: 'India',
    latitude: 25.5941,
    longitude: 85.1376,
    radiusKm: 30,
    isActive: true,
  },
  {
    sCode: 'RANCHI',
    sName: 'Ranchi',
    state: 'Jharkhand',
    country: 'India',
    latitude: 23.3441,
    longitude: 85.3096,
    radiusKm: 30,
    isActive: true,
  },
  {
    sCode: 'LUCKNOW',
    sName: 'Lucknow',
    state: 'Uttar Pradesh',
    country: 'India',
    latitude: 26.8467,
    longitude: 80.9462,
    radiusKm: 35,
    isActive: true,
  },
]

export const fetchBookings = async (): Promise<BookingRecord[]> => {
  const response = await apiRequest<BookingRecord[]>('/api/bookings')
  return response.data
}

export const fetchBookingCustomers = async (): Promise<BookingCustomer[]> => {
  const response = await apiRequest<BookingCustomer[]>('/api/users?sUserTypeName=Customer&isActive=true')
  return response.data
}

export const fetchBookingServices = async (): Promise<BookingService[]> => {
  const response = await apiRequest<BookingService[]>('/api/services?isActive=true')

  if (response.data.length > 0) {
    return response.data
  }

  const fallbackResponse = await apiRequest<BookingService[]>('/api/services')
  return fallbackResponse.data
}

export const fetchBookingSlots = async (serviceId?: number): Promise<BookingSlot[]> => {
  const response = await apiRequest<BookingSlot[]>('/api/service-slots?isActive=true')

  if (!serviceId) {
    return response.data
  }

  return response.data
    .filter((slot) => slot.iServiceMasterId === null || slot.iServiceMasterId === serviceId)
    .sort((first, second) => {
      if (first.iServiceMasterId === serviceId && second.iServiceMasterId !== serviceId) {
        return -1
      }

      if (first.iServiceMasterId !== serviceId && second.iServiceMasterId === serviceId) {
        return 1
      }

      return first.slotName.localeCompare(second.slotName)
    })
}

export const fetchServiceLocations = async (): Promise<ServiceLocation[]> => {
  try {
    const response = await apiRequest<ServiceLocation[]>('/api/service-locations')
    return response.data
  } catch {
    return fallbackServiceLocations
  }
}

export const createBooking = async (payload: CreateBookingPayload): Promise<BookingRecord> => {
  const response = await apiRequest<BookingRecord>('/api/bookings', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return response.data
}

export const updateBooking = async (bookingId: number, payload: UpdateBookingPayload): Promise<BookingRecord> => {
  const response = await apiRequest<BookingRecord>(`/api/bookings/${bookingId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return response.data
}

export const updateBookingStatus = async (
  bookingId: number,
  payload: UpdateBookingStatusPayload,
): Promise<BookingRecord> => {
  const response = await apiRequest<BookingRecord>(`/api/bookings/${bookingId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })

  return response.data
}
