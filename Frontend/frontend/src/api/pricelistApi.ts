import { api } from '@/lib/api'
import type { PricelistResponse, PricelistRequest, PricelistItemRequest, PricelistItemResponse, RentalPeriodResponse, RentalPeriodRequest } from '@/types/pricelist'

export const pricelistApi = {
  list: () =>
    api.get<PricelistResponse[]>('/api/pricelists'),

  create: (body: PricelistRequest) =>
    api.post<PricelistResponse>('/api/pricelists', body),

  update: (id: string, body: PricelistRequest) =>
    api.put<PricelistResponse>(`/api/pricelists/${id}`, body),

  remove: (id: string) =>
    api.delete(`/api/pricelists/${id}`),

  addItem: (pricelistId: string, body: PricelistItemRequest) =>
    api.post<PricelistItemResponse>(`/api/pricelists/${pricelistId}/items`, body),

  removeItem: (pricelistId: string, itemId: string) =>
    api.delete(`/api/pricelists/${pricelistId}/items/${itemId}`),
}

export const rentalPeriodApi = {
  list: () =>
    api.get<RentalPeriodResponse[]>('/api/rental-periods'),

  create: (body: RentalPeriodRequest) =>
    api.post<RentalPeriodResponse>('/api/rental-periods', body),

  update: (id: string, body: RentalPeriodRequest) =>
    api.put<RentalPeriodResponse>(`/api/rental-periods/${id}`, body),

  remove: (id: string) =>
    api.delete(`/api/rental-periods/${id}`),
}
