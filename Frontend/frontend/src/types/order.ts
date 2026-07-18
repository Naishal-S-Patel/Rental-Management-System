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

export type FulfillmentMethod = 'STANDARD_DELIVERY' | 'PICKUP_FROM_STORE'

export interface OrderLineResponse {
  id: string
  productId: string
  productName: string
  variantId?: string
  variantSku?: string
  quantity: number
  unitPrice: number
  durationUnit: string
  durationValue: number
  startDate: string
  endDate: string
  amount: number
}

export interface OrderResponse {
  id: string
  orderNumber: string
  status: OrderStatus
  fulfillmentMethod: FulfillmentMethod
  deliveryAddressId?: string
  deliveryAddress?: string
  customerId: string
  customerName: string
  customerEmail: string
  adminId: string
  storeName?: string
  lines: OrderLineResponse[]
  subtotal: number
  deliveryCharge: number
  total: number
  depositAmount: number
  createdAt: string
  updatedAt: string
}

export interface CheckoutRequest {
  fulfillmentMethod: FulfillmentMethod
  deliveryAddressId?: string
}

export interface PaymentInitiateResponse {
  razorpayOrderId: string
  amount: number
  currency: string
  keyId: string
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
  invoiceNumber: string
  type: 'RENTAL' | 'LATE_FEE'
  amount: number
  fileId?: string
  createdAt: string
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
  orderNumber: string
  customerName: string
  scheduledDate: string
  confirmedAt?: string
  checklistNotes?: string
}

export interface ReturnResponse {
  id: string
  orderId: string
  orderNumber: string
  customerName: string
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
