import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Closed', value: 'CLOSED' },
  { label: 'Cancelled', value: 'CANCELLED' },
]

export function CustomerOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<OrderStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    orderApi.list({ status: statusFilter || undefined, page, size: 20 })
      .then(({ data }) => { setOrders(data.content); setTotalPages(data.totalPages) })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load orders.')))
      .finally(() => setLoading(false))
  }, [statusFilter, page])

  return (
    <AppShell requiredRole="CUSTOMER">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Orders</h1>
          <div className="page-subtitle">All orders across all stores</div>
        </div>
      </div>

      {/* Status tabs */}
      <div className="o-notebook-tabs">
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

      {!loading && orders.length === 0 && (
        <div className="empty-state">
          <p>No orders found.</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
        </div>
      )}

      {!loading && orders.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Store</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontWeight: 600 }}>#{order.id.slice(0, 8)}</td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{order.storeName ?? '—'}</td>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDate(order.createdAt)}</td>
                    <td><OrderStatusBadge status={order.status} /></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/orders/${order.id}`)}>
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
