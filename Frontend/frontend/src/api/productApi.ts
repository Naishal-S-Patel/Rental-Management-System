import { api } from '@/lib/api'
import type { PagedResponse, ProductResponse, ProductRequest, ProductVariantRequest, ProductVariantResponse, AttributeTypeResponse, AttributeTypeRequest, AttributeValueRequest, AttributeValueResponse } from '@/types/product'

export const productApi = {
  list: (params?: { category?: string; search?: string; mine?: boolean; adminId?: string; sort?: string; page?: number; size?: number }) =>
    api.get<PagedResponse<ProductResponse>>('/api/products', { params: { ...params, size: params?.size ?? 12 } }),

  get: (id: string) =>
    api.get<ProductResponse>(`/api/products/${id}`),

  getVariants: (id: string) =>
    api.get<ProductVariantResponse[]>(`/api/products/${id}/variants`),

  create: (body: ProductRequest) =>
    api.post<ProductResponse>('/api/products', body),

  update: (id: string, body: ProductRequest) =>
    api.put<ProductResponse>(`/api/products/${id}`, body),

  remove: (id: string) =>
    api.delete(`/api/products/${id}`),

  uploadImage: (id: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<ProductResponse>(`/api/products/${id}/images`, form)
  },

  createVariant: (productId: string, body: ProductVariantRequest) =>
    api.post<ProductVariantResponse>(`/api/products/${productId}/variants`, body),

  updateVariant: (variantId: string, body: ProductVariantRequest) =>
    api.put<ProductVariantResponse>(`/api/variants/${variantId}`, body),

  deleteVariant: (variantId: string) =>
    api.delete(`/api/variants/${variantId}`),

  // Attributes
  listAttributes: () =>
    api.get<AttributeTypeResponse[]>('/api/attributes'),

  createAttributeType: (body: AttributeTypeRequest) =>
    api.post<AttributeTypeResponse>('/api/attributes', body),

  createAttributeValue: (typeId: string, body: AttributeValueRequest) =>
    api.post<AttributeValueResponse>(`/api/attributes/${typeId}/values`, body),
}
