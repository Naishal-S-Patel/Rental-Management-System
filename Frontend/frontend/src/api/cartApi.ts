import { api } from '@/lib/api'
import type { CartResponse, CartItemRequest } from '@/types/cart'
import type { OrderResponse } from '@/types/order'

export const cartApi = {
  get: () =>
    api.get<CartResponse>('/api/cart'),

  addItem: (body: CartItemRequest) =>
    api.post<CartResponse>('/api/cart/items', body),

  updateItem: (itemId: string, body: CartItemRequest) =>
    api.put<CartResponse>(`/api/cart/items/${itemId}`, body),

  removeItem: (itemId: string) =>
    api.delete<void>(`/api/cart/items/${itemId}`),

  checkout: (body: { fulfillmentMethod: string; deliveryAddressId?: string }) =>
    api.post<OrderResponse>('/api/cart/checkout', body),
}
