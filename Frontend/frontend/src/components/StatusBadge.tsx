import type { OrderStatus } from '@/types/order'
import type { QuotationStatus } from '@/types/quotation'

const ORDER_STATUS_MAP: Record<OrderStatus, { label: string; cls: string }> = {
  PENDING_ADMIN_CONFIRMATION: { label: 'Awaiting Approval', cls: 'badge-warning' },
  CONFIRMED: { label: 'Confirmed', cls: 'badge-info' },
  PAID: { label: 'Paid', cls: 'badge-info' },
  SCHEDULED_PICKUP: { label: 'Scheduled for Pickup', cls: 'badge-info' },
  ACTIVE: { label: 'Active', cls: 'badge-success' },
  RETURNED: { label: 'Returned', cls: 'badge-neutral' },
  SETTLED: { label: 'Settled', cls: 'badge-success' },
  CLOSED: { label: 'Closed', cls: 'badge-neutral' },
  CANCELLED: { label: 'Cancelled', cls: 'badge-danger' },
}

const QUOTATION_STATUS_MAP: Record<QuotationStatus, { label: string; cls: string }> = {
  DRAFT: { label: 'Draft', cls: 'badge-neutral' },
  SENT: { label: 'Sent', cls: 'badge-info' },
  CONFIRMED: { label: 'Confirmed', cls: 'badge-success' },
  REJECTED: { label: 'Rejected', cls: 'badge-danger' },
  EXPIRED: { label: 'Expired', cls: 'badge-neutral' },
}

export function OrderStatusBadge({ status, overdue }: { status: OrderStatus; overdue?: boolean }) {
  const map = ORDER_STATUS_MAP[status] ?? { label: status, cls: 'badge-neutral' }
  return (
    <span style={{ display: 'inline-flex', gap: '4px', alignItems: 'center' }}>
      <span className={`badge ${map.cls}`}>{map.label}</span>
      {overdue && <span className="badge badge-danger">Overdue</span>}
    </span>
  )
}

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const map = QUOTATION_STATUS_MAP[status] ?? { label: status, cls: 'badge-neutral' }
  return <span className={`badge ${map.cls}`}>{map.label}</span>
}

export function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`badge ${active ? 'badge-success' : 'badge-neutral'}`}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}

export function DefaultBadge() {
  return <span className="badge badge-info">Default</span>
}
