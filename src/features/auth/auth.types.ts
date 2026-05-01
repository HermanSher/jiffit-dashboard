export interface AuthUser {
  id: number
  username: string
  name: string
  email: string
  role: string
  roleCode: string
  isActive: boolean
}

export interface LoginPayload {
  username: string
  password: string
}

export interface LoginResult {
  token: string
  user: AuthUser
}
