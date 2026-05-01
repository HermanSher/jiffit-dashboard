export type EmploymentStatus = 'ACTIVE' | 'LEFT'

export interface EmployeeRole {
  iMasterId: number
  sCode: string
  sName: string
  precedence: number
  isActive: boolean
}

export interface EmployeeUserType {
  iMasterId: number
  sCode: string
  sName: string
  isActive: boolean
}

export interface Employee {
  id: number
  username: string
  firstName: string | null
  middleName: string | null
  lastName: string | null
  address: string | null
  mobileNo: string | null
  alternateNumber: string | null
  email: string | null
  iRoleMasterId: number | null
  iUserTypeMasterId: number | null
  employmentStatus: EmploymentStatus
  joinedAt: string
  leftAt: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  role: EmployeeRole | null
  userType: EmployeeUserType | null
}

export interface EmployeeFilters {
  id?: number
  username?: string
  iRoleMasterId?: number
  sRoleName?: string
  iUserTypeMasterId?: number
  sUserTypeName?: string
  createdFrom?: string
  createdTo?: string
}

export interface CreateEmployeePayload {
  username: string
  password: string
  firstName?: string
  middleName?: string
  lastName?: string
  address?: string
  alternateNumber?: string
  email?: string
  mobileNo?: string
  iRoleMasterId: number
  iUserTypeMasterId: number
  createdByUserId: number
  isActive?: boolean
}

export interface CreateEmployeeResult {
  id: number
  username: string
  role: {
    iMasterId: number
    sCode: string
    sName: string
  } | null
  userType: {
    iMasterId: number
    sName: string
  } | null
}
