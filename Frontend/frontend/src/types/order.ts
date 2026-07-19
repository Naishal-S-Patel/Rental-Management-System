// Order & related types

export type OrderStatus =
  | 'PENDING_ADMIN_CONFIRMATION'
  | 'CONFIRMED'
  | 'PAID'
  | 'SCHEDULED_PICKUP'
  | 'ACTIVE'
  | 'RETURNED'
  | 'SETTLED'
  | 'CLOSED'
  | 'CANCELLED'

export type FulfillmentMethod = 'DELIVERY' | 'STORE_PICKUP'

export interface OrderLineResponse {
  id: string
  productVariantId: string
  productName: string
  quantity: number
  startDate: string
  endDate: string
  unitPrice: number
  lineTotal: number
}

export interface OrderResponse {
  id: string
  customerId: string
  customerName: string
  customerEmail?: string
  owningAdminId: string
  storeName?: string
  status: OrderStatus
  fulfillmentMethod: FulfillmentMethod
  deliveryAddressId?: string
  deliveryAddress?: string
  lines: OrderLineResponse[]
  subtotalAmount: number
  depositAmount: number
  totalAmount: number
  confirmedBy?: string
  confirmedAt?: string
  createdAt: string
  updatedAt?: string
}

export interface CheckoutRequest {
  fulfillmentMethod: FulfillmentMethod
  deliveryAddressId?: string
}

export interface PaymentInitiateResponse {
  razorpayOrderId: string
  razorpayKeyId: string
  amount: number
  currency: string
}

export interface PaymentResponse {
  id: string
  razorpayPaymentId: string
  amount: number
  status: string
  createdAt: string
}

export interface SecurityDepositResponse {
  id: string
  amount: number
  status: 'HELD' | 'DEDUCTED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
  heldAmount: number
  deductedAmount: number
  refundedAmount: number
}

export interface DepositTransactionResponse {
  id: string
  type: 'HOLD' | 'DEDUCTION' | 'REFUND'
  amount: number
  reason: string
  createdAt: string
}

export interface InvoiceResponse {
  id: string
  invoiceNumber?: string
  type: 'RENTAL' | 'LATE_FEE'
  amount: number
  fileId?: string
  issuedAt: string
}

export interface DamageReportResponse {
  id: string
  description: string
  estimatedCost: number
  photos: string[]
  createdAt: string
}

export interface PickupResponse {
  id: string
  orderId: string
  orderNumber?: string
  customerName?: string
  scheduledDate: string
  confirmedAt?: string
  checklistNotes?: string
}

export interface ReturnResponse {
  id: string
  orderId: string
  orderNumber?: string
  customerName?: string
  conditionNotes?: string
  damageReported: boolean
  missingAccessories: boolean
  confirmedAt?: string
}

export interface OrderRejectRequest {
  reason: string
}

export interface PickupScheduleRequest {
  scheduledDate: string
}

export interface ReturnConfirmRequest {
  conditionNotes: string
  damageReported: boolean
  missingAccessories: boolean
}
