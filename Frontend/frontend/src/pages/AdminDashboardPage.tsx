import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { dashboardApi } from '@/api/dashboardApi'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { DashboardSummaryResponse, OverdueOrderResponse } from '@/types/dashboard'

export function AdminDashboardPage() {
  const navigate = useNavigate()
  const [summary, setSummary] = useState<DashboardSummaryResponse | null>(null)
  const [overdue, setOverdue] = useState<OverdueOrderResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([dashboardApi.getSummary(), dashboardApi.getOverdue()])
      .then(([{ data: s }, { data: o }]) => { setSummary(s); setOverdue(o) })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load dashboard.')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <AppShell requiredRole="ADMIN"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>

  return (
    <AppShell requiredRole="ADMIN">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <div className="page-subtitle">Overview of your store activity</div>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {summary && (
        <div className="metrics-grid">
          {[
            { label: 'Active Rentals', value: summary.activeRentals, icon: 'fa-solid fa-box', link: '/admin/orders?status=ACTIVE' },
            { label: 'Due Today', value: summary.dueToday, icon: 'fa-solid fa-clock', link: '/admin/schedule' },
            { label: 'Upcoming Pickups', value: summary.upcomingPickups, icon: 'fa-solid fa-arrow-right-to-bracket', link: '/admin/schedule' },
            { label: 'Upcoming Returns', value: summary.upcomingReturns, icon: 'fa-solid fa-arrow-left-from-bracket', link: '/admin/schedule' },
            { label: 'Overdue', value: summary.overdueCount, icon: 'fa-solid fa-triangle-exclamation', link: '/admin/orders?status=ACTIVE', danger: true },
            { label: 'Revenue', value: formatCurrency(summary.totalRevenue), icon: 'fa-solid fa-indian-rupee-sign', link: '/admin/orders', isAmount: true },
            { label: 'Deposits Held', value: formatCurrency(summary.depositsHeld), icon: 'fa-solid fa-vault', link: '/admin/orders', isAmount: true },
            { label: 'Late Fees', value: formatCurrency(summary.lateFeesCollected), icon: 'fa-solid fa-percent', link: '/admin/orders', isAmount: true },
          ].map((m) => (
            <div
              key={m.label}
              className="metric-card"
              style={{ cursor: 'pointer' }}
              onClick={() => navigate(m.link)}
            >
              <div className="metric-label">
                <i className={m.icon} style={{ marginRight: 6, color: m.danger ? 'var(--status-danger)' : 'var(--text-muted)' }}></i>
                {m.label}
              </div>
              <div className="metric-value" style={{ color: m.danger && Number(m.value) > 0 ? 'var(--status-danger)' : 'var(--text-primary)' }}>
                {m.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Overdue Orders */}
      {overdue.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ color: 'var(--status-danger)' }}>
              <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }}></i>
              Overdue Rentals ({overdue.length})
            </span>
          </div>
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Product</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                  <th>Late Fee</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((o) => (
                  <tr key={o.orderId}>
                    <td style={{ fontWeight: 600 }}>#{o.orderNumber}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{o.customerEmail}</div>
                    </td>
                    <td>{o.productName}</td>
                    <td style={{ color: 'var(--status-danger)' }}>{formatDate(o.dueDate)}</td>
                    <td><span className="badge badge-danger">{o.daysOverdue}d</span></td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(o.lateFeeAccrued)}</td>
                    <td>
                      <Link to={`/admin/orders/${o.orderId}`} className="btn btn-secondary btn-sm">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {overdue.length === 0 && !loading && (
        <div className="card">
          <div className="card-body">
            <div className="empty-state" style={{ padding: '24px' }}>
              <i className="fa-solid fa-circle-check" style={{ color: 'var(--status-success)', fontSize: '2rem', marginBottom: 8 }}></i>
              <p>No overdue rentals.</p>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
