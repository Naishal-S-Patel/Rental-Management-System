import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
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
        o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()),
      )
    : orders

  return (
    <AppShell requiredRole="ADMIN">
      <div className="page-header">
        <div>
          <h1 className="page-title">Orders</h1>
          <div className="page-subtitle">All orders for your store</div>
        </div>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '16px', gap: 0, overflowX: 'auto' }}>
        {STATUS_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setStatusFilter(t.value); setPage(0) }}
            style={{
              padding: '8px 12px',
              fontSize: '0.8125rem',
              fontWeight: statusFilter === t.value ? 600 : 400,
              border: 'none',
              borderBottom: `2px solid ${statusFilter === t.value ? 'var(--primary)' : 'transparent'}`,
              background: 'none',
              color: statusFilter === t.value ? 'var(--primary)' : 'var(--text-secondary)',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ marginBottom: '12px' }}>
        <div className="search-bar" style={{ maxWidth: 300 }}>
          <input
            type="text"
            placeholder="Search order # or customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>
      </div>

      {loading && <div className="loading-overlay"><span className="spinner"></span></div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && filteredOrders.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-box-open"></i>
          <p>No orders found.</p>
        </div>
      )}

      {!loading && filteredOrders.length > 0 && (
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
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.orderNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDate(order.createdAt)}</td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      <i className={order.fulfillmentMethod === 'STANDARD_DELIVERY' ? 'fa-solid fa-truck' : 'fa-solid fa-store'} style={{ marginRight: 6, color: 'var(--text-muted)' }}></i>
                      {order.fulfillmentMethod === 'STANDARD_DELIVERY' ? 'Delivery' : 'Pickup'}
                    </td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.total)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/orders/${order.id}`)}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </AppShell>
  )
}
