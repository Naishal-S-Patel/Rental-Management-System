import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { OrderStatusBadge } from '@/components/StatusBadge'
import { Modal } from '@/components/Modal'
import { orderApi } from '@/api/orderApi'
import { formatCurrency, formatDate, formatDateTime, todayInputDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { OrderResponse, InvoiceResponse, SecurityDepositResponse, DepositTransactionResponse } from '@/types/order'

export function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [deposit, setDeposit] = useState<SecurityDepositResponse | null>(null)
  const [depositTxns, setDepositTxns] = useState<DepositTransactionResponse[]>([])
  const [loading, setLoading] = useState(true)

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
        const [{ data: dep }, { data: txns }] = await Promise.all([orderApi.getDeposit(id), orderApi.getDepositTransactions(id)])
        setDeposit(dep)
        setDepositTxns(txns)
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
  if (!order) return <AppShell requiredRole="ADMIN"><div className="alert alert-danger">Order not found.</div></AppShell>

  return (
    <AppShell requiredRole="ADMIN">
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        <Link to="/admin/orders">Orders</Link> / #{order.orderNumber}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'flex-start' }}>
        <div>
          {/* Header */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>Order #{order.orderNumber}</h1>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                    {formatDateTime(order.createdAt)}
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    Customer: <strong>{order.customerName}</strong> ({order.customerEmail})
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Fulfillment: {order.fulfillmentMethod === 'STANDARD_DELIVERY' ? 'Standard Delivery' : 'Pickup from Store'}
                    {order.deliveryAddress && ` — ${order.deliveryAddress}`}
                  </div>
                </div>
                <div>
                  <OrderStatusBadge status={order.status} />
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                {order.status === 'PENDING_ADMIN_CONFIRMATION' && (
                  <>
                    <button className="btn btn-primary" disabled={actionLoading} onClick={() => void doAction(() => orderApi.confirm(order.id), 'Order confirmed.')}>
                      <i className="fa-solid fa-check"></i> Confirm Order
                    </button>
                    <button className="btn btn-danger" onClick={() => setRejectModal(true)} disabled={actionLoading}>
                      <i className="fa-solid fa-xmark"></i> Reject
                    </button>
                  </>
                )}
                {order.status === 'PAID' && (
                  <button className="btn btn-primary" onClick={() => setPickupModal(true)} disabled={actionLoading}>
                    <i className="fa-solid fa-calendar-plus"></i> Schedule Pickup
                  </button>
                )}
                {order.status === 'SCHEDULED_PICKUP' && (
                  <button className="btn btn-primary" onClick={() => setPickupConfirmModal(true)} disabled={actionLoading}>
                    <i className="fa-solid fa-arrow-right-to-bracket"></i> Confirm Pickup
                  </button>
                )}
                {order.status === 'ACTIVE' && (
                  <>
                    <button className="btn btn-primary" onClick={() => setReturnModal(true)} disabled={actionLoading}>
                      <i className="fa-solid fa-arrow-left-from-bracket"></i> Confirm Return
                    </button>
                    <button className="btn btn-secondary" onClick={() => setDamageModal(true)} disabled={actionLoading}>
                      <i className="fa-solid fa-file-circle-exclamation"></i> Damage Report
                    </button>
                  </>
                )}
                {order.status === 'RETURNED' && (
                  <button className="btn btn-primary" disabled={actionLoading} onClick={() => void doAction(() => orderApi.settle(order.id), 'Order settled.')}>
                    <i className="fa-solid fa-calculator"></i> Settle Order
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Order Lines */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">Order Items</span></div>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Period</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Unit Price</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {order.lines.map((line) => (
                    <tr key={line.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{line.productName}</div>
                        {line.variantSku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {line.variantSku}</div>}
                      </td>
                      <td style={{ fontSize: '0.8125rem' }}>{formatDate(line.startDate)} — {formatDate(line.endDate)}</td>
                      <td>{line.quantity}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>{line.durationUnit}</td>
                      <td>{formatCurrency(line.unitPrice)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600, borderTop: '2px solid var(--border)' }}>Subtotal</td>
                    <td style={{ fontWeight: 600, borderTop: '2px solid var(--border)' }}>{formatCurrency(order.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600 }}>Delivery</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.deliveryCharge)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', fontWeight: 600 }}>Deposit</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(order.depositAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'right', fontWeight: 700 }}>Total</td>
                    <td style={{ fontWeight: 700 }}>{formatCurrency(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Deposit Ledger */}
          {deposit && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header"><span className="card-title">Deposit Ledger</span></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                  {[
                    { label: 'Status', value: deposit.status },
                    { label: 'Held', value: formatCurrency(deposit.heldAmount) },
                    { label: 'Deducted', value: formatCurrency(deposit.deductedAmount) },
                  ].map((m) => (
                    <div key={m.label} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: 10 }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                {depositTxns.length > 0 && (
                  <div className="table-wrap">
                    <table>
                      <thead><tr><th>Date</th><th>Type</th><th>Amount</th><th>Reason</th></tr></thead>
                      <tbody>
                        {depositTxns.map((t) => (
                          <tr key={t.id}>
                            <td>{formatDate(t.createdAt)}</td>
                            <td><span className={`badge ${t.type === 'REFUND' ? 'badge-success' : t.type === 'DEDUCTION' ? 'badge-danger' : 'badge-info'}`}>{t.type}</span></td>
                            <td>{formatCurrency(t.amount)}</td>
                            <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{t.reason}</td>
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

        {/* Sidebar */}
        <div>
          {invoices.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Invoices</span></div>
              <div className="card-body">
                {invoices.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>#{inv.invoiceNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.type} — {formatDate(inv.createdAt)}</div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{formatCurrency(inv.amount)}</div>
                    </div>
                    {inv.fileId && (
                      <button className="btn btn-secondary btn-sm" onClick={() => void handleDownloadInvoice(inv.id)}>
                        <i className="fa-solid fa-download"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
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
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: '0.875rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={damageReported} onChange={(e) => setDamageReported(e.target.checked)} />
            Damage reported
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
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
