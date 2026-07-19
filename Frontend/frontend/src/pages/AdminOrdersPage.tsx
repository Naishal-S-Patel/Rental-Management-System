import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { OrderStatusBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import { orderApi } from '@/api/orderApi'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { OrderResponse, OrderStatus } from '@/types/order'

const STATUS_TABS: { label: string; value: OrderStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Awaiting Approval', value: 'PENDING_ADMIN_CONFIRMATION' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Scheduled', value: 'SCHEDULED_PICKUP' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Returned', value: 'RETURNED' },
  { label: 'Settled', value: 'SETTLED' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

type ViewMode = 'list' | 'kanban'

const KANBAN_STAGES: { status: OrderStatus; label: string; stageClass: string }[] = [
  { status: 'PENDING_ADMIN_CONFIRMATION', label: 'Awaiting Approval', stageClass: 'stage-pending' },
  { status: 'CONFIRMED', label: 'Confirmed', stageClass: 'stage-confirmed' },
  { status: 'PAID', label: 'Paid', stageClass: 'stage-paid' },
  { status: 'SCHEDULED_PICKUP', label: 'Scheduled', stageClass: 'stage-confirmed' },
  { status: 'ACTIVE', label: 'Active', stageClass: 'stage-active' },
  { status: 'RETURNED', label: 'Returned', stageClass: 'stage-confirmed' },
]

export function AdminOrdersPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialStatus = (searchParams.get('status') as OrderStatus | null) ?? ''
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>(initialStatus)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [view, setView] = useState<ViewMode>('list')

  useEffect(() => {
    setLoading(true)
    setError('')
    orderApi.list({ status: statusFilter || undefined, page, size: 20 })
      .then(({ data }) => { setOrders(data.content); setTotalPages(data.totalPages) })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load orders.')))
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  const filteredOrders = search
    ? orders.filter((o) =>
        o.id.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()),
      )
    : orders

  return (
    <AppShell requiredRole="ADMIN">
      <ControlPanel
        breadcrumbs={[{ label: 'Orders' }]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="search-bar" style={{ maxWidth: 260 }}>
              <input
                type="text"
                placeholder="Search order # or customer…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button>🔍</button>
            </div>
            <div className="view-toggle">
              <button className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`} onClick={() => setView('list')}>☰</button>
              <button className={`view-toggle-btn ${view === 'kanban' ? 'active' : ''}`} onClick={() => setView('kanban')}>⊞</button>
            </div>
          </div>
        }
      />

      <div className="o-content">
        {/* Status tabs */}
        <div className="o-notebook-tabs mt-3">
          {STATUS_TABS.map((t) => (
            <button
              key={t.value}
              className={`o-notebook-tab ${statusFilter === t.value ? 'active' : ''}`}
              onClick={() => { setStatusFilter(t.value); setPage(0) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="loading-overlay"><span className="spinner"></span></div>}
        {error && <div className="alert alert-danger">{error}</div>}

        {!loading && filteredOrders.length === 0 && (
          <div className="empty-state">
            <p>No orders found.</p>
          </div>
        )}

        {/* LIST VIEW */}
        {!loading && filteredOrders.length > 0 && view === 'list' && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Date</th>
                    <th>Fulfillment</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.map((order) => (
                    <tr key={order.id} onClick={() => navigate(`/admin/orders/${order.id}`)} style={{ cursor: 'pointer' }}>
                      <td style={{ fontWeight: 600 }}>#{order.id.slice(0, 8)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                      </td>
                      <td>{formatDate(order.createdAt)}</td>
                      <td>
                        {order.fulfillmentMethod === 'DELIVERY' ? '📦 Delivery' : '🏪 Pickup'}
                      </td>
                      <td><OrderStatusBadge status={order.status} /></td>
                      <td className="text-right" style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}

        {/* KANBAN VIEW */}
        {!loading && filteredOrders.length > 0 && view === 'kanban' && (
          <div className="kanban-board mt-3">
            {KANBAN_STAGES.map((stage) => {
              const stageOrders = filteredOrders.filter((o) => o.status === stage.status)
              return (
                <div key={stage.status} className="kanban-column">
                  <div className="kanban-column-header">
                    {stage.label}
                    <span className="kanban-column-count">{stageOrders.length}</span>
                  </div>
                  <div className="kanban-cards">
                    {stageOrders.map((order) => (
                      <div
                        key={order.id}
                        className={`kanban-card ${stage.stageClass}`}
                        onClick={() => navigate(`/admin/orders/${order.id}`)}
                      >
                        <div className="kanban-card-title">#{order.id.slice(0, 8)}</div>
                        <div className="kanban-card-meta">{order.customerName}</div>
                        <div className="kanban-card-meta">{formatCurrency(order.totalAmount)} · {formatDate(order.createdAt)}</div>
                      </div>
                    ))}
                    {stageOrders.length === 0 && (
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '16px', textAlign: 'center' }}>
                        No orders
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
