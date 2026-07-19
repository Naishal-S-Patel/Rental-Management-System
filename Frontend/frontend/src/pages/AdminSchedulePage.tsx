import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { orderApi } from '@/api/orderApi'
import { formatDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { PickupResponse, ReturnResponse } from '@/types/order'

export function AdminSchedulePage() {
  const today = new Date().toISOString().split('T')[0]
  const [date, setDate] = useState(today)
  const [pickups, setPickups] = useState<PickupResponse[]>([])
  const [returns, setReturns] = useState<ReturnResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    Promise.all([orderApi.getPickups(date), orderApi.getReturns(date)])
      .then(([{ data: p }, { data: r }]) => { setPickups(p); setReturns(r) })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load schedule.')))
      .finally(() => setLoading(false))
  }, [date])

  return (
    <AppShell requiredRole="ADMIN">
      <ControlPanel
        breadcrumbs={[{ label: 'Schedule' }]}
        actions={
          <input type="date" className="form-input" value={date} onChange={(e) => setDate(e.target.value)} style={{ width: 160 }} />
        }
      />

      <div className="o-content">
        {loading && <div className="loading-overlay"><span className="spinner"></span></div>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}

      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Pickups */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                → Pickups ({pickups.length})
              </span>
            </div>
            {pickups.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No pickups scheduled.</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Scheduled</th>
                      <th>Confirmed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pickups.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 600 }}>
                          <Link to={`/admin/orders/${p.orderId}`}>#{p.orderNumber || p.orderId.slice(0, 8)}</Link>
                        </td>
                        <td>{p.customerName || '—'}</td>
                        <td style={{ fontSize: '0.8125rem' }}>{formatDate(p.scheduledDate)}</td>
                        <td>
                          {p.confirmedAt
                            ? <span className="badge badge-success">✓</span>
                            : <span className="badge badge-warning">Pending</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Returns */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">
                ← Returns ({returns.length})
              </span>
            </div>
            {returns.length === 0 ? (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No returns expected.</p>
              </div>
            ) : (
              <div className="table-wrap" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Order #</th>
                      <th>Customer</th>
                      <th>Damage</th>
                      <th>Confirmed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {returns.map((r) => (
                      <tr key={r.id}>
                        <td style={{ fontWeight: 600 }}>
                          <Link to={`/admin/orders/${r.orderId}`}>#{r.orderNumber || r.orderId.slice(0, 8)}</Link>
                        </td>
                        <td>{r.customerName || '—'}</td>
                        <td>
                          {r.damageReported
                            ? <span className="badge badge-danger">Yes</span>
                            : <span className="badge badge-success">None</span>
                          }
                        </td>
                        <td>
                          {r.confirmedAt
                            ? <span className="badge badge-success">✓</span>
                            : <span className="badge badge-warning">Pending</span>
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
      </div>
    </AppShell>
  )
}
