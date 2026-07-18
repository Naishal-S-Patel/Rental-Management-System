// Dashboard types

export interface DashboardSummaryResponse {
  activeRentals: number
  dueToday: number
  upcomingPickups: number
  upcomingReturns: number
  overdueCount: number
  totalRevenue: number
  depositsHeld: number
  lateFeesCollected: number
}

export interface OverdueOrderResponse {
  orderId: string
  orderNumber: string
  customerName: string
  customerEmail: string
  productName: string
  dueDate: string
  daysOverdue: number
  lateFeeAccrued: number
}

export interface RentalSettingsResponse {
  id: string
  gracePeriodDays: number
  dailyLateFeePercent: number
  maxLateFeeMutiplier: number
  pickupWindowHours: number
  returnWindowHours: number
}

export interface RentalSettingsRequest {
  gracePeriodDays: number
  dailyLateFeePercent: number
  maxLateFeeMutiplier: number
  pickupWindowHours: number
  returnWindowHours: number
}
