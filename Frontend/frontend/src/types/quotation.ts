// Quotation types

export type QuotationStatus = 'DRAFT' | 'SENT' | 'CONFIRMED' | 'REJECTED' | 'EXPIRED'

export interface QuotationLineResponse {
  id: string
  productVariantId: string
  productName: string
  quantity: number
  startDate: string
  endDate: string
  unitPrice: number
  lineTotal: number
}

export interface QuotationResponse {
  id: string
  customerId: string
  customerName: string
  customerEmail?: string
  quotationTemplateId?: number
  status: QuotationStatus
  validUntil: string
  lines: QuotationLineResponse[]
  subtotalAmount: number
  orderId?: string
  createdAt: string
}

export interface QuotationLineRequest {
  productVariantId: string
  quantity: number
  startDate: string
  endDate: string
}

export interface QuotationRequest {
  customerId: string
  quotationTemplateId?: number
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
