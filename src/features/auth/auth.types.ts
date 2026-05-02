export interface AuthUser {
  id: number
  username: string
  name: string
  email: string
  role: string
  roleCode: string
  rolePrecedence?: number | null
  userType: string
  userTypeCode: string
  isActive: boolean
  employmentStatus?: 'ACTIVE' | 'LEFT'
}

export interface LoginPayload {
  username: string
  password: string
  deviceInfo?: string
}

export interface LoginResult {
  accessToken?: string
  refreshToken?: string
  token?: string
  user: AuthUser
}

export interface AuthTokenPair {
  accessToken: string
  refreshToken: string
}

export interface MeResult {
  id: number
  username: string
  name: string
  email: string
  role: {
    iMasterId: number | null
    sCode: string | null
    sName: string | null
    precedence: number | null
  }
  userType: {
    iMasterId: number | null
    sCode: string | null
    sName: string | null
  }
  isActive: boolean
  employmentStatus: 'ACTIVE' | 'LEFT'
}
