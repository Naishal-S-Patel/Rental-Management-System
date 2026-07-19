// Product & Variant types — aligned to backend ProductResponse / ProductVariantResponse DTOs

export interface AttributeValueResponse {
  id: number // backend Long
  value: string
  attributeTypeId: number
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
  id: number
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
  ratingAverage?: number
  reviewCount?: number
  createdAt: string

  // ── Dynamic pricing enrichment (optional — null when feature off or Groq failed) ──
  /** Adjusted price to show. Equals basePrice when feature is off or Groq failed. */
  dynamicPrice?: number | null
  /** Product of all active factor multipliers. 1.0 when feature off. */
  combinedMultiplier?: number | null
  /** dynamicPrice - basePrice. 0 when no adjustment. */
  priceAdjustment?: number | null
  /** Short badge string for top 1-2 driving factors, e.g. "🎉 Raksha Bandhan in 6 days · Monsoon". Null if no meaningful adjustment. */
  topDriverBadge?: string | null
  /** Full demand explanation for tooltip/popover. */
  demandNote?: string | null
  // Per-factor multipliers for breakdown popover
  seasonalMultiplier?: number | null
  festivalMultiplier?: number | null
  weekendMultiplier?: number | null
  durationMultiplier?: number | null
  weatherMultiplier?: number | null
  categoryTrendMultiplier?: number | null
  scarcityMultiplier?: number | null
  // Contextual strings
  currentSeason?: string | null
  nearestFestival?: string | null
  daysToFestival?: number | null
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
