import { api } from '@/lib/api'
import type {
  OrderResponse,
  PaymentInitiateResponse,
  PaymentResponse,
  SecurityDepositResponse,
  DepositTransactionResponse,
  InvoiceResponse,
  DamageReportResponse,
  PickupResponse,
  ReturnResponse,
  OrderRejectRequest,
  PickupScheduleRequest,
  ReturnConfirmRequest,
} from '@/types/order'
import type { PagedResponse } from '@/types/product'

export const orderApi = {
  list: (params?: { status?: string; page?: number; size?: number }) =>
    api.get<PagedResponse<OrderResponse>>('/api/orders', { params: { ...params, size: params?.size ?? 20 } }),

  get: (id: string) =>
    api.get<OrderResponse>(`/api/orders/${id}`),

  confirm: (id: string) =>
    api.post<OrderResponse>(`/api/orders/${id}/confirm`),

  reject: (id: string, body?: OrderRejectRequest) =>
    api.post<OrderResponse>(`/api/orders/${id}/reject`, body),

  cancel: (id: string) =>
    api.post<OrderResponse>(`/api/orders/${id}/cancel`),

  initiatePayment: (id: string) =>
    api.post<PaymentInitiateResponse>(`/api/orders/${id}/payment`),

  getPayments: (id: string) =>
    api.get<PaymentResponse[]>(`/api/orders/${id}/payments`),

  getDeposit: (id: string) =>
    api.get<SecurityDepositResponse>(`/api/orders/${id}/deposit`),

  getDepositTransactions: (id: string) =>
    api.get<DepositTransactionResponse[]>(`/api/orders/${id}/deposit/transactions`),

  getInvoices: (id: string) =>
    api.get<InvoiceResponse[]>(`/api/orders/${id}/invoices`),

  schedulePickup: (id: string, body: PickupScheduleRequest) =>
    api.post<PickupResponse>(`/api/orders/${id}/pickup/schedule`, body),

  confirmPickup: (id: string, checklistNotes?: string) =>
    api.post<PickupResponse>(`/api/orders/${id}/pickup/confirm`, { checklistNotes }),

  confirmReturn: (id: string, body: ReturnConfirmRequest) =>
    api.post<ReturnResponse>(`/api/orders/${id}/return/confirm`, body),

  settle: (id: string) =>
    api.post<OrderResponse>(`/api/orders/${id}/return/settle`),

  addDamageReport: (id: string, description: string, estimatedCost: number, photos?: File[]) => {
    const form = new FormData()
    form.append('description', description)
    form.append('estimatedCost', String(estimatedCost))
    if (photos) {
      photos.forEach((p) => form.append('photos', p))
    }
    return api.post<DamageReportResponse>(`/api/orders/${id}/damage-report`, form)
  },

  // Schedule views
  getPickups: (date?: string) =>
    api.get<PickupResponse[]>('/api/pickups', { params: { date } }),

  getReturns: (date?: string) =>
    api.get<ReturnResponse[]>('/api/returns', { params: { date } }),

  downloadInvoice: (invoiceId: string) =>
    api.get<Blob>(`/api/invoices/${invoiceId}/download`, { responseType: 'blob' }),

  receiveOfflinePayment: (id: string) =>
    api.post<void>(`/api/orders/${id}/offline-payment`),

  verifyPaymentMock: (id: string) =>
    api.post<void>(`/api/orders/${id}/verify-mock`),
}
