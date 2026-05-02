export type HeroVerificationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PENDING_HUB_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED'

export interface HeroVerificationHub {
  id: number
  name: string
  addressLine1: string | null
  city: string | null
  latitude: number
  longitude: number
  contactNumber: string | null
}

export interface HeroVerificationUpdatePayload {
  fullName?: string
  selectedCity?: string
  selectedJobRole?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
  workType?: string
  vehicleType?: string
  earningsType?: string
  adminRemarks?: string
  verificationStatus?: 'PENDING_HUB_VERIFICATION' | 'VERIFIED'
}

export interface HeroVerificationApplication {
  id: number
  heroUserId: number
  heroCode: string | null
  username: string
  fullName: string
  mobileNumber: string
  email: string | null
  dateOfBirth: string | null
  gender: string | null
  fatherName: string | null
  alternateMobileNumber: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string | null
  pincode: string | null
  latitude: number | null
  longitude: number | null
  selectedJobRole: string | null
  selectedCity: string | null
  workType: string | null
  vehicleType: string | null
  earningsType: string | null
  onboardingSource: string | null
  referralCode: string | null
  verificationStatus: HeroVerificationStatus
  isVerified: boolean
  workerState: string | null
  nearestHub: HeroVerificationHub | null
  submittedAt: string | null
  verifiedAt: string | null
  verifiedBy: {
    id: number
    username: string
    name: string | null
  } | null
  rejectionReason: string | null
  adminRemarks: string | null
  createdAt: string
  updatedAt: string
}

export interface HeroVerificationFilters {
  status?: HeroVerificationStatus | ''
  city?: string
  search?: string
}
