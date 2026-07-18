import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { OrderStatusBadge } from '@/components/StatusBadge'
import { orderApi } from '@/api/orderApi'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { OrderResponse, InvoiceResponse, SecurityDepositResponse, DepositTransactionResponse } from '@/types/order'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

const STATUS_STEPS = [
  'PENDING_ADMIN_CONFIRMATION',
  'CONFIRMED',
  'PAID',
  'SCHEDULED_PICKUP',
  'ACTIVE',
  'RETURNED',
  'SETTLED',
  'CLOSED',
]

const STATUS_LABELS: Record<string, string> = {
  PENDING_ADMIN_CONFIRMATION: 'Awaiting Approval',
  CONFIRMED: 'Confirmed',
  PAID: 'Paid',
  SCHEDULED_PICKUP: 'Scheduled for Pickup',
  ACTIVE: 'Active',
  RETURNED: 'Returned',
  SETTLED: 'Settled',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [deposit, setDeposit] = useState<SecurityDepositResponse | null>(null)
  const [depositTxns, setDepositTxns] = useState<DepositTransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [payingNow, setPayingNow] = useState(false)
  const confirmed = searchParams.get('confirmed') === '1'

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

  const handleCancel = async () => {
    if (!id) return
    setCancelling(true)
    try {
      await orderApi.cancel(id)
      toast.success('Order cancelled.')
      void fetchAll()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not cancel order.'))
    } finally {
      setCancelling(false)
    }
  }

  const handlePayNow = async () => {
    if (!id) return
    setPayingNow(true)
    try {
      const { data } = await orderApi.initiatePayment(id)
      const rzp = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'RentHub',
        description: `Order #${order?.orderNumber}`,
        handler: async () => {
          toast.success('Payment successful! Fetching updated order…')
          await fetchAll()
        },
        modal: {
          ondismiss: () => { setPayingNow(false); void fetchAll() },
        },
      })
      rzp.open()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not initiate payment.'))
      setPayingNow(false)
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

  if (loading) return <AppShell requiredRole="CUSTOMER"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>
  if (!order) return <AppShell requiredRole="CUSTOMER"><div className="alert alert-danger">Order not found.</div></AppShell>

  const currentStepIdx = STATUS_STEPS.indexOf(order.status)

  return (
    <AppShell requiredRole="CUSTOMER">
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        <Link to="/orders">My Orders</Link> / #{order.orderNumber}
      </div>

      {confirmed && (
        <div className="alert alert-success" style={{ marginBottom: 16 }}>
          <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i>
          Order #{order.orderNumber} submitted successfully. Payment will be required once the store approves your order.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'flex-start' }}>
        <div>
          {/* Header */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: 4 }}>Order #{order.orderNumber}</h1>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>Placed {formatDateTime(order.createdAt)}</div>
                  {order.storeName && (
                    <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                      <i className="fa-solid fa-store" style={{ marginRight: 6 }}></i>{order.storeName}
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <OrderStatusBadge status={order.status} />
                  {order.status === 'PENDING_ADMIN_CONFIRMATION' && (
                    <button className="btn btn-danger btn-sm" disabled={cancelling} onClick={() => void handleCancel()}>
                      {cancelling ? 'Cancelling…' : 'Cancel Order'}
                    </button>
                  )}
                  {order.status === 'CONFIRMED' && (
                    <button className="btn btn-primary" disabled={payingNow} onClick={() => void handlePayNow()}>
                      <i className="fa-solid fa-credit-card"></i>
                      {payingNow ? 'Opening payment…' : 'Pay Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Status Timeline */}
          {order.status !== 'CANCELLED' && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><span className="card-title">Status Timeline</span></div>
              <div className="card-body">
                <div className="timeline">
                  {STATUS_STEPS.map((s, i) => (
                    <div key={s} className="timeline-step">
                      <div className={`timeline-dot ${i < currentStepIdx ? 'done' : i === currentStepIdx ? 'current' : ''}`}>
                        {i < currentStepIdx && <i className="fa-solid fa-check" style={{ fontSize: '0.6rem' }}></i>}
                        {i === currentStepIdx && <i className="fa-solid fa-circle" style={{ fontSize: '0.4rem' }}></i>}
                      </div>
                      <div className="timeline-content">
                        <div style={{ fontSize: '0.8125rem', fontWeight: i <= currentStepIdx ? 600 : 400, color: i <= currentStepIdx ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {STATUS_LABELS[s]}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Order Lines */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header"><span className="card-title">Order Items</span></div>
            <div className="table-wrap" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Period</th>
                    <th>Qty</th>
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
                      <td>{formatCurrency(line.unitPrice)}</td>
                      <td style={{ fontWeight: 600 }}>{formatCurrency(line.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'right', fontWeight: 600, borderTop: '2px solid var(--border)' }}>Total</td>
                    <td style={{ fontWeight: 700, borderTop: '2px solid var(--border)' }}>{formatCurrency(order.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Deposit */}
          {deposit && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <div className="card-header"><span className="card-title">Security Deposit</span></div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 12 }}>
                  {[
                    { label: 'Held', value: formatCurrency(deposit.heldAmount) },
                    { label: 'Deducted', value: formatCurrency(deposit.deductedAmount) },
                    { label: 'Refunded', value: formatCurrency(deposit.refundedAmount) },
                  ].map((m) => (
                    <div key={m.label} style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: 12 }}>
                      <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontWeight: 700 }}>{m.value}</div>
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
          {/* Summary Card */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header"><span className="card-title">Summary</span></div>
            <div className="card-body">
              {[
                { label: 'Subtotal', value: formatCurrency(order.subtotal) },
                { label: 'Delivery', value: formatCurrency(order.deliveryCharge) },
                { label: 'Deposit', value: formatCurrency(order.depositAmount) },
              ].map((row) => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{row.label}</span>
                  <span style={{ fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
              <div className="divider" style={{ margin: '10px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Invoices */}
          {invoices.length > 0 && (
            <div className="card">
              <div className="card-header"><span className="card-title">Invoices</span></div>
              <div className="card-body">
                {invoices.map((inv) => (
                  <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <div>
                      <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>#{inv.invoiceNumber}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{inv.type} — {formatDate(inv.createdAt)}</div>
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
    </AppShell>
  )
}
