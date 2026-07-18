import { api } from '@/lib/api'
import type { AddressResponse, AddressRequest } from '@/types/address'

export const addressApi = {
  list: () =>
    api.get<AddressResponse[]>('/api/addresses'),

  create: (body: AddressRequest) =>
    api.post<AddressResponse>('/api/addresses', body),

  update: (id: string, body: AddressRequest) =>
    api.put<AddressResponse>(`/api/addresses/${id}`, body),

  remove: (id: string) =>
    api.delete(`/api/addresses/${id}`),

  setDefault: (id: string) =>
    api.put<AddressResponse>(`/api/addresses/${id}/default`),
}
