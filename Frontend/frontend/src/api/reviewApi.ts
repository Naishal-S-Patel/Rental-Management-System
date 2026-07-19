import { api } from '@/lib/api'

export interface ReviewRequest {
  orderId: string
  productRating: number
  storeRating: number
  comment?: string
}

export interface ReviewResponse {
  id: number
  orderId: string
  productId: string
  storeId: string
  productRating: number
  storeRating: number
  comment?: string
  customerName: string
  createdAt: string
}

export const reviewApi = {
  create: (body: ReviewRequest) =>
    api.post<ReviewResponse>('/api/reviews', body),

  getProductReviews: (productId: string) =>
    api.get<ReviewResponse[]>(`/api/reviews/product/${productId}`),

  getOrderReview: (orderId: string) =>
    api.get<ReviewResponse | null>(`/api/reviews/order/${orderId}`),
}
