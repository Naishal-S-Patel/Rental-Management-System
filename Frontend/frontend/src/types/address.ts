// Address types

export interface AddressResponse {
  id: string
  label?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
  isDefault: boolean
}

export interface AddressRequest {
  label?: string
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}
