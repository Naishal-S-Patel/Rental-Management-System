// Quotation types

export type QuotationStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED'

export interface QuotationLineResponse {
  id: string
  productId: string
  productName: string
  variantId?: string
  variantSku?: string
  quantity: number
  unitPrice: number
  durationUnit: string
  durationValue: number
  amount: number
}

export interface QuotationResponse {
  id: string
  quotationNumber: string
  status: QuotationStatus
  customerId: string
  customerName: string
  customerEmail: string
  templateId?: string
  templateName?: string
  validUntil: string
  lines: QuotationLineResponse[]
  total: number
  createdAt: string
}

export interface QuotationLineRequest {
  productId: string
  variantId?: string
  quantity: number
  unitPrice: number
  durationUnit: string
  durationValue: number
}

export interface QuotationRequest {
  customerId: string
  quotationTemplateId?: string
  validUntil: string
  lines: QuotationLineRequest[]
}

export interface QuotationTemplateResponse {
  id: string
  name: string
  header?: string
  footer?: string
  terms?: string
}

export interface QuotationTemplateRequest {
  name: string
  header?: string
  footer?: string
  terms?: string
}
