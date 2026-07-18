import { api } from '@/lib/api'
import type { QuotationResponse, QuotationRequest, QuotationTemplateResponse, QuotationTemplateRequest } from '@/types/quotation'
import type { PagedResponse } from '@/types/product'
import type { OrderResponse } from '@/types/order'

export const quotationApi = {
  list: (params?: { status?: string; page?: number; size?: number }) =>
    api.get<PagedResponse<QuotationResponse>>('/api/quotations', { params }),

  get: (id: string) =>
    api.get<QuotationResponse>(`/api/quotations/${id}`),

  create: (body: QuotationRequest) =>
    api.post<QuotationResponse>('/api/quotations', body),

  update: (id: string, body: QuotationRequest) =>
    api.put<QuotationResponse>(`/api/quotations/${id}`, body),

  confirm: (id: string) =>
    api.post<OrderResponse>(`/api/quotations/${id}/confirm`),

  reject: (id: string) =>
    api.post<QuotationResponse>(`/api/quotations/${id}/reject`),

  // Templates
  listTemplates: () =>
    api.get<QuotationTemplateResponse[]>('/api/quotation-templates'),

  createTemplate: (body: QuotationTemplateRequest) =>
    api.post<QuotationTemplateResponse>('/api/quotation-templates', body),

  updateTemplate: (id: string, body: QuotationTemplateRequest) =>
    api.put<QuotationTemplateResponse>(`/api/quotation-templates/${id}`, body),

  deleteTemplate: (id: string) =>
    api.delete(`/api/quotation-templates/${id}`),
}
