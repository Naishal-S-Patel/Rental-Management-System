import { api } from '@/lib/api'
import type { DashboardSummaryResponse, OverdueOrderResponse, RentalSettingsResponse, RentalSettingsRequest } from '@/types/dashboard'

export const dashboardApi = {
  getSummary: () =>
    api.get<DashboardSummaryResponse>('/api/dashboard/summary'),

  getOverdue: () =>
    api.get<OverdueOrderResponse[]>('/api/dashboard/overdue'),
}

export const settingsApi = {
  get: () =>
    api.get<RentalSettingsResponse>('/api/admin/rental-settings'),

  update: (body: RentalSettingsRequest) =>
    api.put<RentalSettingsResponse>('/api/admin/rental-settings', body),
}
