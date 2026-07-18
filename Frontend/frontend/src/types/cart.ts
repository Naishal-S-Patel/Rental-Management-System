// Cart types

export interface CartItemResponse {
  id: string
  productId: string
  productName: string
  productCategory: string
  variantId?: string
  variantSku?: string
  variantAttributes?: { name: string; value: string }[]
  adminId: string
  storeName?: string
  quantity: number
  startDate: string
  endDate: string
  rentalPeriodId?: string
  rentalPeriodName?: string
  unitPrice: number
  amount: number
  imageUrl?: string
}

export interface CartResponse {
  id: string
  items: CartItemResponse[]
  total: number
}

export interface CartItemRequest {
  productVariantId?: string
  productId?: string
  quantity: number
  startDate: string
  endDate: string
  rentalPeriodId?: string
}
