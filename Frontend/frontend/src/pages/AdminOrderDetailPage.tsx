import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { StatusStepper } from '@/components/StatusStepper'
import { Modal } from '@/components/Modal'
import { orderApi } from '@/api/orderApi'
import { formatCurrency, formatDate, formatDateTime, todayInputDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { OrderResponse, InvoiceResponse, SecurityDepositResponse, DepositTransactionResponse } from '@/types/order'

const LIFECYCLE_STEPS = [
  { key: 'PENDING_ADMIN_CONFIRMATION', label: 'Awaiting Approval' },
  { key: 'CONFIRMED', label: 'Confirmed' },
  { key: 'PAID', label: 'Paid' },
  { key: 'SCHEDULED_PICKUP', label: 'Scheduled' },
  { key: 'ACTIVE', label: 'Active' },
  { key: 'RETURNED', label: 'Returned' },
  { key: 'SETTLED', label: 'Settled' },
  { key: 'CLOSED', label: 'Closed' },
]

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [deposit, setDeposit] = useState<SecurityDepositResponse | null>(null)
  const [depositTxns, setDepositTxns] = useState<DepositTransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'items' | 'deposit' | 'invoices'>('items')

  // Action modals/state
  const [rejectModal, setRejectModal] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [pickupModal, setPickupModal] = useState(false)
  const [pickupDate, setPickupDate] = useState(todayInputDate())
  const [pickupConfirmModal, setPickupConfirmModal] = useState(false)
  const [pickupNotes, setPickupNotes] = useState('')
  const [returnModal, setReturnModal] = useState(false)
  const [returnNotes, setReturnNotes] = useState('')
  const [damageReported, setDamageReported] = useState(false)
  const [missingAccessories, setMissingAccessories] = useState(false)
  const [damageModal, setDamageModal] = useState(false)
  const [damageDesc, setDamageDesc] = useState('')
  const [damageCost, setDamageCost] = useState('')
  const [actionLoading, setActionLoading] = useState(false)

  const fetchAll = async () => {
    if (!id) return
    setLoading(true)
    try {
      const [{ data: o }, { data: inv }] = await Promise.all([orderApi.get(id), orderApi.getInvoices(id)])
      setOrder(o)
      setInvoices(inv)
      if (['PAID', 'ACTIVE', 'RETURNED', 'SETTLED', 'CLOSED'].includes(o.status)) {
        try {
          const [{ data: dep }, { data: txns }] = await Promise.all([orderApi.getDeposit(id), orderApi.getDepositTransactions(id)])
          setDeposit(dep)
          setDepositTxns(txns)
        } catch { /* deposit may not exist yet */ }
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to load order.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchAll() }, [id])

  const doAction = async (action: () => Promise<unknown>, successMsg: string) => {
    setActionLoading(true)
    try {
      await action()
      toast.success(successMsg)
      await fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Action failed.'))
    } finally {
      setActionLoading(false)
    }
  }

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const { data } = await orderApi.downloadInvoice(invoiceId)
      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-${invoiceId}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Download failed.')
    }
  }

  if (loading) return <AppShell requiredRole="ADMIN"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>
  if (!order) return <AppShell requiredRole="ADMIN"><div className="o-content"><div className="alert alert-danger mt-3">Order not found.</div></div></AppShell>

  // Build action buttons based on current status
  const actionButtons = (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {order.status === 'PENDING_ADMIN_CONFIRMATION' && (
        <>
          <button className="btn btn-primary" disabled={actionLoading} onClick={() => void doAction(() => orderApi.confirm(order.id), 'Order confirmed.')}>
            ✓ Confirm
          </button>
          <button className="btn btn-danger" onClick={() => setRejectModal(true)} disabled={actionLoading}>
            ✗ Reject
          </button>
        </>
      )}
      {order.status === 'CONFIRMED' && (
        <button className="btn btn-primary" disabled={actionLoading} onClick={() => void doAction(() => orderApi.receiveOfflinePayment(order.id), 'Offline payment received.')}>
          💵 Receive Payment (Offline)
        </button>
      )}
      {order.status === 'PAID' && (
        <button className="btn btn-primary" onClick={() => setPickupModal(true)} disabled={actionLoading}>
          Schedule Pickup
        </button>
      )}
      {order.status === 'SCHEDULED_PICKUP' && (
        <button className="btn btn-primary" onClick={() => setPickupConfirmModal(true)} disabled={actionLoading}>
          Confirm Pickup
        </button>
      )}
      {order.status === 'ACTIVE' && (
        <>
          <button className="btn btn-primary" onClick={() => setReturnModal(true)} disabled={actionLoading}>
            Confirm Return
          </button>
          <button className="btn btn-secondary" onClick={() => setDamageModal(true)} disabled={actionLoading}>
            Damage Report
          </button>
        </>
      )}
      {order.status === 'RETURNED' && (
        <button className="btn btn-primary" disabled={actionLoading} onClick={() => void doAction(() => orderApi.settle(order.id), 'Order settled.')}>
          Settle Order
        </button>
      )}
    </div>
  )

  return (
    <AppShell requiredRole="ADMIN">
      <ControlPanel
        breadcrumbs={[
          { label: 'Orders', to: '/admin/orders' },
          { label: `#${order.id.slice(0, 8)}` },
        ]}
        actions={actionButtons}
      />

      <div className="o-content">
        {/* Status Stepper */}
        {!['CANCELLED', 'REJECTED'].includes(order.status) && (
          <div style={{ margin: '16px 0' }}>
            <StatusStepper steps={LIFECYCLE_STEPS} currentStep={order.status} />
          </div>
        )}
        {['CANCELLED', 'REJECTED'].includes(order.status) && (
          <div className="alert alert-danger mt-3">
            This order has been {order.status.toLowerCase()}.
          </div>
        )}

        {/* Designed Summary Stat Cards Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: deposit ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {/* Items Card */}
          <div 
            onClick={() => setTab('items')}
            className={`shadow-tinted ${tab === 'items' ? 'active' : ''}`}
            style={{
              background: '#fff',
              borderLeft: `4px solid ${tab === 'items' ? 'var(--primary)' : '#94A3B8'}`,
              borderTop: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s, border-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Items Rented</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{order.lines.length}</div>
            </div>
            <div style={{ fontSize: '2rem', opacity: 0.85 }}>🛍️</div>
          </div>

          {/* Invoices Card */}
          <div 
            onClick={() => setTab('invoices')}
            className={`shadow-tinted ${tab === 'invoices' ? 'active' : ''}`}
            style={{
              background: '#fff',
              borderLeft: `4px solid ${tab === 'invoices' ? 'var(--primary)' : '#94A3B8'}`,
              borderTop: '1px solid var(--border)',
              borderRight: '1px solid var(--border)',
              borderBottom: '1px solid var(--border)',
              borderRadius: '8px',
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'transform 0.15s, border-color 0.15s'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Invoices</div>
              <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{invoices.length}</div>
            </div>
            <div style={{ fontSize: '2rem', opacity: 0.85 }}>📄</div>
          </div>

          {/* Deposit Card */}
          {deposit && (
            <div 
              onClick={() => setTab('deposit')}
              className={`shadow-tinted ${tab === 'deposit' ? 'active' : ''}`}
              style={{
                background: '#fff',
                borderLeft: `4px solid ${tab === 'deposit' ? 'var(--primary)' : '#94A3B8'}`,
                borderTop: '1px solid var(--border)',
                borderRight: '1px solid var(--border)',
                borderBottom: '1px solid var(--border)',
                borderRadius: '8px',
                padding: '16px 20px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'transform 0.15s, border-color 0.15s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Deposit</div>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: 4 }}>{formatCurrency(deposit.amount)}</div>
              </div>
              <div style={{ fontSize: '2rem', opacity: 0.85 }}>🛡️</div>
            </div>
          )}
        </div>

        {/* Form Sheet */}
        <div className="o-form-sheet">
          {/* Header info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', marginBottom: 20 }}>
            <div className="o-form-group-inline">
              <span className="form-label">Customer</span>
              <span style={{ fontWeight: 600 }}>{order.customerName}</span>
            </div>
            <div className="o-form-group-inline">
              <span className="form-label">Email</span>
              <span>{order.customerEmail}</span>
            </div>
            <div className="o-form-group-inline">
              <span className="form-label">Fulfillment</span>
              <span>{order.fulfillmentMethod === 'DELIVERY' ? '📦 Delivery' : '🏪 Pickup'}</span>
            </div>
            <div className="o-form-group-inline">
              <span className="form-label">Date</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            {order.deliveryAddress && (
              <div className="o-form-group-inline" style={{ gridColumn: '1 / -1' }}>
                <span className="form-label">Address</span>
                <span>{order.deliveryAddress}</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="o-notebook-tabs">
            <button className={`o-notebook-tab ${tab === 'items' ? 'active' : ''}`} onClick={() => setTab('items')}>Order Lines</button>
            <button className={`o-notebook-tab ${tab === 'invoices' ? 'active' : ''}`} onClick={() => setTab('invoices')}>Invoices ({invoices.length})</button>
            {deposit && <button className={`o-notebook-tab ${tab === 'deposit' ? 'active' : ''}`} onClick={() => setTab('deposit')}>Deposit</button>}
          </div>

          {/* Tab: Items */}
          {tab === 'items' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Period</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{line.productName}</div>
                      </td>
                      <td>{formatDate(line.startDate)} — {formatDate(line.endDate)}</td>
                      <td className="text-right">{line.quantity}</td>
                      <td className="text-right">{formatCurrency(line.unitPrice)}</td>
                      <td className="text-right" style={{ fontWeight: 600 }}>{formatCurrency(line.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="text-right" style={{ fontWeight: 600, borderTop: '2px solid var(--border)' }}>Subtotal</td>
                    <td className="text-right" style={{ fontWeight: 600, borderTop: '2px solid var(--border)' }}>{formatCurrency(order.subtotalAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="text-right" style={{ fontWeight: 600 }}>Deposit</td>
                    <td className="text-right" style={{ fontWeight: 600 }}>{formatCurrency(order.depositAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="text-right" style={{ fontWeight: 700, fontSize: '1rem' }}>Total</td>
                    <td className="text-right" style={{ fontWeight: 700, fontSize: '1rem' }}>{formatCurrency(order.totalAmount)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* Tab: Invoices */}
          {tab === 'invoices' && (
            <>
              {invoices.length === 0 && <div className="empty-state"><p>No invoices generated yet.</p></div>}
              {invoices.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Type</th>
                        <th>Date</th>
                        <th className="text-right">Amount</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((inv) => (
                        <tr key={inv.id}>
                          <td style={{ fontWeight: 600 }}>#{inv.id.slice(0, 8)}</td>
                          <td><span className="badge badge-neutral">{inv.type}</span></td>
                          <td>{formatDate(inv.issuedAt)}</td>
                          <td className="text-right" style={{ fontWeight: 600 }}>{formatCurrency(inv.amount)}</td>
                          <td>
                            {inv.id && (
                              <button className="btn btn-secondary btn-sm" onClick={() => void handleDownloadInvoice(inv.id)}>
                                ↓ PDF
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}

          {/* Tab: Deposit */}
          {tab === 'deposit' && deposit && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
                {[
                  { label: 'Status', value: deposit.status },
                  { label: 'Held', value: formatCurrency(deposit.heldAmount) },
                  { label: 'Deducted', value: formatCurrency(deposit.deductedAmount) },
                ].map((m) => (
                  <div key={m.label} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: 10 }}>
                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
                    <div style={{ fontWeight: 700 }}>{m.value}</div>
                  </div>
                ))}
              </div>
              {depositTxns.length > 0 && (
                <div className="table-wrap">
                  <table>
                    <thead><tr><th>Date</th><th>Type</th><th className="text-right">Amount</th><th>Reason</th></tr></thead>
                    <tbody>
                      {depositTxns.map((t) => (
                        <tr key={t.id}>
                          <td>{formatDate(t.createdAt)}</td>
                          <td><span className={`badge ${t.type === 'REFUND' ? 'badge-success' : t.type === 'DEDUCTION' ? 'badge-danger' : 'badge-info'}`}>{t.type}</span></td>
                          <td className="text-right">{formatCurrency(t.amount)}</td>
                          <td style={{ color: 'var(--text-secondary)' }}>{t.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reject Modal */}
      {rejectModal && (
        <Modal title="Reject Order" onClose={() => setRejectModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setRejectModal(false)}>Cancel</button>
              <button className="btn btn-danger" disabled={actionLoading} onClick={() => void doAction(() => orderApi.reject(order.id, { reason: rejectReason }), 'Order rejected.').then(() => setRejectModal(false))}>
                Reject Order
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Reason (optional)</label>
            <textarea className="form-textarea" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Explain reason for rejection…" />
          </div>
        </Modal>
      )}

      {/* Schedule Pickup Modal */}
      {pickupModal && (
        <Modal title="Schedule Pickup" onClose={() => setPickupModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPickupModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={actionLoading} onClick={() => void doAction(() => orderApi.schedulePickup(order.id, { scheduledDate: pickupDate }), 'Pickup scheduled.').then(() => setPickupModal(false))}>
                Schedule
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Scheduled Date</label>
            <input type="date" className="form-input" value={pickupDate} min={todayInputDate()} onChange={(e) => setPickupDate(e.target.value)} />
          </div>
        </Modal>
      )}

      {/* Confirm Pickup Modal */}
      {pickupConfirmModal && (
        <Modal title="Confirm Pickup" onClose={() => setPickupConfirmModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setPickupConfirmModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={actionLoading} onClick={() => void doAction(() => orderApi.confirmPickup(order.id, pickupNotes), 'Pickup confirmed — order is now active.').then(() => setPickupConfirmModal(false))}>
                Confirm Pickup
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Checklist / Notes (optional)</label>
            <textarea className="form-textarea" value={pickupNotes} onChange={(e) => setPickupNotes(e.target.value)} placeholder="Items checked, condition notes…" />
          </div>
        </Modal>
      )}

      {/* Confirm Return Modal */}
      {returnModal && (
        <Modal title="Confirm Return" onClose={() => setReturnModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setReturnModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={actionLoading} onClick={() => void doAction(() => orderApi.confirmReturn(order.id, { conditionNotes: returnNotes, damageReported, missingAccessories }), 'Return confirmed.').then(() => setReturnModal(false))}>
                Confirm Return
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Condition Notes</label>
            <textarea className="form-textarea" value={returnNotes} onChange={(e) => setReturnNotes(e.target.value)} placeholder="Describe item condition on return…" />
          </div>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.9rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={damageReported} onChange={(e) => setDamageReported(e.target.checked)} />
            Damage reported
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={missingAccessories} onChange={(e) => setMissingAccessories(e.target.checked)} />
            Missing accessories
          </label>
        </Modal>
      )}

      {/* Damage Report Modal */}
      {damageModal && (
        <Modal title="Add Damage Report" onClose={() => setDamageModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDamageModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={actionLoading || !damageDesc} onClick={() => void doAction(() => orderApi.addDamageReport(order.id, damageDesc, Number(damageCost)), 'Damage report added.').then(() => setDamageModal(false))}>
                Submit Report
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="form-textarea" value={damageDesc} onChange={(e) => setDamageDesc(e.target.value)} placeholder="Describe the damage…" />
          </div>
          <div className="form-group">
            <label className="form-label">Estimated Cost (INR)</label>
            <input type="number" className="form-input" value={damageCost} onChange={(e) => setDamageCost(e.target.value)} placeholder="0" min="0" />
          </div>
        </Modal>
      )}
    </AppShell>
  )
}
