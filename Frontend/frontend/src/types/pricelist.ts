// Pricelist & Rental Period types

export type DurationUnit = 'HOUR' | 'DAY' | 'WEEK' | 'MONTH' | 'YEAR'

export interface PricelistItemResponse {
  id: string
  productId?: string
  productName?: string
  productVariantId?: string
  variantSku?: string
  durationUnit: DurationUnit
  unitPrice: number
}

export interface PricelistResponse {
  id: string
  name: string
  isDefault: boolean
  validFrom?: string
  validTo?: string
  items: PricelistItemResponse[]
}

export interface PricelistRequest {
  name: string
  isDefault?: boolean
  validFrom?: string
  validTo?: string
}

export interface PricelistItemRequest {
  productVariantId?: string
  durationUnit: DurationUnit
  unitPrice: number
}

export interface RentalPeriodResponse {
  id: string
  name: string
  durationValue: number
  durationUnit: DurationUnit
}

export interface RentalPeriodRequest {
  name: string
  durationValue: number
  durationUnit: DurationUnit
}
