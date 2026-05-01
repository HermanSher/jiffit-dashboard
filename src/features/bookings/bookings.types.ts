export type BookingStatus =
  | 'DRAFT'
  | 'HOLD'
  | 'CONFIRMED'
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'ASSIGNMENT_PENDING'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED'

export type PaymentStatus = 'PENDING' | 'AUTHORIZED' | 'PAID' | 'FAILED' | 'REFUNDED' | 'CANCELLED'

export interface ServiceLocation {
  sCode: string
  sName: string
  state: string
  country: string
  latitude: number
  longitude: number
  radiusKm: number
  isActive: boolean
}

export interface BookingCustomer {
  id?: number
  iMasterId: number
  username: string
  firstName: string | null
  middleName: string | null
  lastName: string | null
  email: string | null
  mobileNo: string | null
}

export interface BookingService {
  iMasterId: number
  sCode: string
  sName: string
  basePrice: string | number
  salePrice: string | number | null
  taxPercentage: string | number | null
  minQuantity: number
  maxQuantity: number | null
  isActive: boolean
}

export interface BookingSlot {
  iMasterId: number
  iServiceMasterId: number | null
  slotName: string
  startTime: string
  endTime: string
  maxBookings: number
  isActive: boolean
}

export interface BookingAddressSnapshot {
  city?: string
  cityCode?: string
  state?: string
  country?: string
  latitude?: number
  longitude?: number
  addressLine1?: string
  landmark?: string
  pincode?: string
  source?: string
}

export interface BookingRecord {
  iTransId: number
  bookingNo: string
  iCustomerUserMasterId: number
  iServiceMasterId: number | null
  requestedServiceName: string | null
  quantity: number
  iAddressMasterId: number | null
  serviceAddressSnapshot: BookingAddressSnapshot | null
  iSlotMasterId: number | null
  scheduledStartAt: string | null
  scheduledEndAt: string | null
  iCouponMasterId: number | null
  couponCode: string | null
  baseAmount: string | number
  discountAmount: string | number
  taxAmount: string | number
  finalAmount: string | number
  paymentStatus: PaymentStatus
  bookingStatus: BookingStatus
  confirmedAt: string | null
  holdReason: string | null
  cancelledAt: string | null
  cancelReason: string | null
  remarks: string | null
  isActive: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  customer: BookingCustomer | null
  service: BookingService | null
  slot: BookingSlot | null
}

export interface CreateBookingPayload {
  iCustomerUserMasterId: number
  iServiceMasterId?: number
  requestedServiceName?: string
  quantity: number
  bookingStatus?: BookingStatus
  iSlotMasterId?: number
  scheduledStartAt?: string
  scheduledEndAt?: string
  couponCode?: string
  holdReason?: string
  remarks?: string
  serviceAddressSnapshot?: BookingAddressSnapshot
}

export type UpdateBookingPayload = Partial<CreateBookingPayload>

export interface UpdateBookingStatusPayload {
  bookingStatus: 'CONFIRMED' | 'HOLD' | 'CANCELLED'
  holdReason?: string
  cancelReason?: string
  remarks?: string
}
