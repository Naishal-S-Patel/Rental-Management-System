import { api } from '@/lib/api'
import type { MessageResponse, UserResponse } from '@/types/auth'

export const userApi = {
  getMe: () => api.get<UserResponse>('/api/users/me'),

  getCurrentUser: () => api.get<UserResponse>('/api/users/me'),

  updateProfile: (body: { firstName: string; lastName: string }) =>
    api.put<UserResponse>('/api/users/me/profile', body),

  changePassword: (body: { currentPassword: string; newPassword: string }) =>
    api.put<MessageResponse>('/api/users/me/password', body),

  uploadPhoto: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<UserResponse>('/api/users/me/photo', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}
