// Address types

export interface AddressResponse {
  id: string
  label?: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
  isDefault: boolean
}

export interface AddressRequest {
  label?: string
  street: string
  city: string
  state: string
  zipCode: string
  country: string
}
