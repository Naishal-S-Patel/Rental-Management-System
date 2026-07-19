// Dashboard types

export interface DashboardSummaryResponse {
  activeRentals: number
  rentalsDueToday: number
  upcomingPickups: number
  upcomingReturns: number
  overdueRentals: number
  revenue: number
  depositsHeld: number
  lateFeeCollection: number
  damagedRentals: number
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
  gracePeriodDays: number
  dailyLateFeePercentage: number
  maxLateFeeMultiplier: number
  defaultPickupWindowDays: number
  defaultReturnWindowDays: number
  updatedAt?: string
}

export interface RentalSettingsRequest {
  gracePeriodDays: number
  dailyLateFeePercentage: number
  maxLateFeeMultiplier: number
  defaultPickupWindowDays: number
  defaultReturnWindowDays: number
}
