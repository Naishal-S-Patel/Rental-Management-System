// Cart types — aligned to backend CartResponse / CartItemResponse DTOs

export interface CartItemVariantAttribute {
  name: string
  value: string
}

export interface CartItemResponse {
  id: number // backend Long
  productId: string
  productName: string
  productCategory: string
  variantId: string
  variantSku?: string
  variantAttributes: CartItemVariantAttribute[]
  adminId: string
  storeName?: string
  quantity: number
  startDate: string
  endDate: string
  rentalPeriodId?: number
  rentalPeriodName?: string
  unitPrice: number
  lineTotal: number
  imageUrl?: string
}

export interface CartResponse {
  id: string
  items: CartItemResponse[]
  subtotalAmount: number
  depositAmount: number
  totalAmount: number
}

export interface CartItemRequest {
  productVariantId?: string
  productId?: string
  quantity: number
  startDate: string
  endDate: string
  rentalPeriodId?: number
}
