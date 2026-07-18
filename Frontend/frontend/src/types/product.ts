// Product & Variant types

export interface AttributeValueResponse {
  id: string
  value: string
  attributeTypeId: string
  attributeTypeName: string
}

export interface AttributeTypeResponse {
  id: string
  name: string
  values: AttributeValueResponse[]
}

export interface ProductVariantResponse {
  id: string
  sku: string
  totalQuantity: number
  availableQuantity: number
  active: boolean
  attributeValues: AttributeValueResponse[]
}

export interface ProductImageResponse {
  id: string
  fileId: string
  url: string
}

export interface ProductResponse {
  id: string
  name: string
  description: string
  category: string
  basePrice: number
  securityDepositAmount: number
  active: boolean
  adminId: string
  storeName?: string
  images: ProductImageResponse[]
  variants: ProductVariantResponse[]
  createdAt: string
}

export interface PagedResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  number: number
  size: number
}

export interface ProductRequest {
  name: string
  description: string
  category: string
  basePrice: number
  securityDepositAmount: number
  active?: boolean
}

export interface ProductVariantRequest {
  sku: string
  totalQuantity: number
  attributeValueIds: string[]
}

export interface AttributeTypeRequest {
  name: string
}

export interface AttributeValueRequest {
  value: string
}
