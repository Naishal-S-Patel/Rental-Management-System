// Mirrors com.hackathon.starter.enums.Role
export type Role = 'ADMIN' | 'CUSTOMER'

export type AuthProvider = 'MANUAL' | 'GOOGLE'

export interface AuthResponse {
  accessToken: string
  refreshToken: string
  tokenType: string
}

export interface UserResponse {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  authProvider: AuthProvider
  verified: boolean
  profilePhotoUrl?: string
  profileImageFileId?: string
  storeName?: string
  createdAt: string
}

export interface MessageResponse {
  message: string
}

export interface ErrorResponse {
  timestamp: string
  status: number
  error: string
  message: string
  path: string
  details?: string[]
}

export interface SignupRequest {
  email: string
  password: string
  firstName: string
  lastName: string
  role: Role
  storeName?: string
}

export interface LoginRequest {
  email: string
  password: string
}
