import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
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
      <ControlPanel
        breadcrumbs={[{ label: 'Dashboard' }]}
      />

      <div className="o-content">
        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {summary && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap: '16px',
            marginTop: 16,
            marginBottom: 24
          }}>
            {[
              { label: 'Active Rentals', value: summary.activeRentals, link: '/admin/orders?status=ACTIVE', icon: '🔄', color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Due Today', value: summary.rentalsDueToday, link: '/admin/schedule', icon: '⏰', color: '#D97706', bg: '#FEF3C7' },
              { label: 'Upcoming Pickups', value: summary.upcomingPickups, link: '/admin/schedule', icon: '🏪', color: '#059669', bg: '#ECFDF5' },
              { label: 'Upcoming Returns', value: summary.upcomingReturns, link: '/admin/schedule', icon: '📦', color: '#4F46E5', bg: '#EEF2FF' },
              { label: 'Overdue Rentals', value: summary.overdueRentals, link: '/admin/orders?status=ACTIVE', icon: '⚠️', color: '#DC2626', bg: '#FEF2F2', danger: true },
              { label: 'Total Revenue', value: formatCurrency(summary.revenue), link: '/admin/orders', icon: '💰', color: '#059669', bg: '#ECFDF5', isAmount: true },
              { label: 'Deposits Held', value: formatCurrency(summary.depositsHeld), link: '/admin/orders', icon: '🛡️', color: '#0D9488', bg: '#F0FDFA', isAmount: true },
              { label: 'Late Fees Collected', value: formatCurrency(summary.lateFeeCollection), link: '/admin/orders', icon: '⏳', color: '#7C3AED', bg: '#F5F3FF', isAmount: true },
              { label: 'Damaged Items', value: summary.damagedRentals, link: '/admin/orders', icon: '🚨', color: '#DC2626', bg: '#FEF2F2', danger: true },
            ].map((m) => (
              <div
                key={m.label}
                className="shadow-tinted"
                style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: '12px',
                  padding: '16px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'transform 0.15s, border-color 0.15s',
                  borderLeft: `4px solid ${m.color}`
                }}
                onClick={() => navigate(m.link)}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    {m.label}
                  </div>
                  <div style={{
                    fontSize: m.isAmount ? '1.35rem' : '1.8rem',
                    fontWeight: 800,
                    marginTop: 6,
                    color: m.danger && Number(m.value) > 0 ? 'var(--status-danger)' : 'var(--text-primary)',
                    fontFamily: 'Sora, sans-serif'
                  }}>
                    {m.value}
                  </div>
                </div>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  backgroundColor: m.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.4rem'
                }}>
                  {m.icon}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Overdue Orders */}
        {overdue.length > 0 && (
          <div className="card" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <div className="card-header" style={{ padding: '16px 20px' }}>
              <span className="card-title" style={{ color: 'var(--status-danger)', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                🚨 Overdue Rentals ({overdue.length})
              </span>
            </div>
            <div className="table-wrap" style={{ border: 'none', borderRadius: 0 }}>
              <table>
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Product</th>
                    <th>Due Date</th>
                    <th>Days Overdue</th>
                    <th className="text-right">Late Fee</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {overdue.map((o) => (
                    <tr key={o.orderId}>
                      <td style={{ fontWeight: 600 }}>#{o.orderNumber || o.orderId.slice(0, 8)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{o.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{o.customerEmail}</div>
                      </td>
                      <td>{o.productName}</td>
                      <td style={{ color: 'var(--status-danger)', fontWeight: 600 }}>{formatDate(o.dueDate)}</td>
                      <td><span className="badge badge-danger" style={{ borderRadius: '4px' }}>{o.daysOverdue}d overdue</span></td>
                      <td className="text-right" style={{ fontWeight: 800, color: 'var(--status-danger)' }}>{formatCurrency(o.lateFeeAccrued)}</td>
                      <td>
                        <Link to={`/admin/orders/${o.orderId}`} className="btn btn-secondary btn-sm" style={{ borderRadius: '6px' }}>View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Compact, centered success state for zero overdue items */}
        {overdue.length === 0 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 24 }}>
            <div className="shadow-tinted" style={{
              maxWidth: '440px',
              width: '100%',
              background: '#fff',
              border: '1px solid var(--border)',
              borderLeft: '4px solid var(--status-success)',
              borderRadius: '12px',
              padding: '32px 24px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '2.5rem', display: 'block', marginBottom: 12 }}>🎉</span>
              <h4 style={{ fontFamily: 'Sora, sans-serif', fontWeight: 800, margin: '0 0 6px 0', color: 'var(--text-primary)' }}>
                All Clear!
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
                No overdue rentals found. All orders are returned or within their active schedule.
              </p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
