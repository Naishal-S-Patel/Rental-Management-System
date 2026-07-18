import { api } from '@/lib/api'
import type { AuthResponse, LoginRequest, MessageResponse, SignupRequest } from '@/types/auth'

export const authApi = {
  signup: (body: SignupRequest) => api.post<MessageResponse>('/api/auth/signup', body),

  login: (body: LoginRequest) => api.post<AuthResponse>('/api/auth/login', body),

  refresh: (refreshToken: string) => api.post<AuthResponse>('/api/auth/refresh', { refreshToken }),

  logout: () => api.post<MessageResponse>('/api/auth/logout'),

  logoutAllDevices: () => api.post<MessageResponse>('/api/auth/logout-all-devices'),

  verifyEmail: (token: string) => api.post<MessageResponse>('/api/auth/verify', { token }),

  resendVerification: (email: string) =>
    api.post<MessageResponse>('/api/auth/resend-verification', { email }),

  forgotPassword: (email: string) => api.post<MessageResponse>('/api/auth/forgot-password', { email }),

  resetPassword: (token: string, newPassword: string) =>
    api.post<MessageResponse>('/api/auth/reset-password', { token, newPassword }),

  exchangeOAuth2Code: (code: string) => api.post<AuthResponse>('/api/auth/oauth2/exchange', { code }),
}
