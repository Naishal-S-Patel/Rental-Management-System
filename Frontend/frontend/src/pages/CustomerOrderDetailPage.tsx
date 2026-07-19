import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { StatusStepper } from '@/components/StatusStepper'
import { OrderStatusBadge } from '@/components/StatusBadge'
import { Modal } from '@/components/Modal'
import { orderApi } from '@/api/orderApi'
import { reviewApi, type ReviewResponse } from '@/api/reviewApi'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { OrderResponse, InvoiceResponse, SecurityDepositResponse, DepositTransactionResponse } from '@/types/order'

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void }
  }
}

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

export function CustomerOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  
  const [order, setOrder] = useState<OrderResponse | null>(null)
  const [invoices, setInvoices] = useState<InvoiceResponse[]>([])
  const [deposit, setDeposit] = useState<SecurityDepositResponse | null>(null)
  const [depositTxns, setDepositTxns] = useState<DepositTransactionResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [cancelling, setCancelling] = useState(false)
  const [payingNow, setPayingNow] = useState(false)
  const [tab, setTab] = useState<'items' | 'deposit' | 'invoices'>('items')
  const confirmed = searchParams.get('confirmed') === '1'

  // Rating Flow States
  const [reviewed, setReviewed] = useState<ReviewResponse | null>(null)
  const [showRateModal, setShowRateModal] = useState(false)
  const [productRating, setProductRating] = useState(5)
  const [storeRating, setStoreRating] = useState(5)
  const [comment, setComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

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

      if (['RETURNED', 'SETTLED', 'CLOSED'].includes(o.status)) {
        try {
          const { data: rev } = await reviewApi.getOrderReview(id)
          setReviewed(rev)
        } catch { /* review may not exist yet */ }
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

  const pollOrderStatus = async (orderId: string, targetStatus: string, maxRetries = 15, intervalMs = 2000): Promise<boolean> => {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const { data: o } = await orderApi.get(orderId)
        if (o.status === targetStatus) {
          return true
        }
      } catch (err) {
        console.error('Polling error:', err)
      }
      await new Promise((resolve) => setTimeout(resolve, intervalMs))
    }
    return false
  }

  const handlePayNow = async () => {
    if (!id) return
    setPayingNow(true)
    try {
      const { data } = await orderApi.initiatePayment(id)
      const rzp = new window.Razorpay({
        key: data.razorpayKeyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: 'RentLo',
        description: `Order #${order?.id.slice(0, 8)}`,
        handler: async () => {
          toast.loading('Verifying payment, please wait...', { id: 'payment-verify' })
          try {
            await orderApi.verifyPaymentMock(id)
          } catch (err) {
            console.error('Mock verification failed:', err)
          }
          const verified = await pollOrderStatus(id, 'PAID')
          if (verified) {
            toast.success('Payment verified successfully!', { id: 'payment-verify' })
          } else {
            toast.error('Payment verification is taking longer than expected. Please refresh later.', { id: 'payment-verify' })
          }
          await fetchAll()
          setPayingNow(false)
        },
        modal: {
          ondismiss: () => {
            setPayingNow(false)
            void fetchAll()
          },
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

  const handleSubmitReview = async () => {
    if (!id) return
    setSubmittingReview(true)
    try {
      const { data } = await reviewApi.create({
        orderId: id,
        productRating,
        storeRating,
        comment
      })
      setReviewed(data)
      setShowRateModal(false)
      toast.success('Thank you for your rating & review!')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not submit review.'))
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) return <AppShell requiredRole="CUSTOMER"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>
  if (!order) return <AppShell requiredRole="CUSTOMER"><div className="o-content"><div className="alert alert-danger mt-3">Order not found.</div></div></AppShell>

  const actionButtons = (
    <div style={{ display: 'flex', gap: 8 }}>
      {order.status === 'PENDING_ADMIN_CONFIRMATION' && (
        <button className="btn btn-danger" disabled={cancelling} onClick={() => void handleCancel()}>
          {cancelling ? 'Cancelling…' : 'Cancel Order'}
        </button>
      )}
      {order.status === 'CONFIRMED' && (
        <button className="btn btn-primary" disabled={payingNow} onClick={() => void handlePayNow()}>
          {payingNow ? 'Opening payment…' : 'Pay Now'}
        </button>
      )}
      {['RETURNED', 'SETTLED', 'CLOSED'].includes(order.status) && (
        reviewed ? (
          <span className="badge badge-success" style={{ alignSelf: 'center', fontSize: '0.85rem', padding: '6px 12px', display: 'inline-flex', alignItems: 'center' }}>✓ Reviewed</span>
        ) : (
          <button className="btn btn-primary" onClick={() => setShowRateModal(true)}>
            ⭐ Rate Rental
          </button>
        )
      )}
    </div>
  )

  return (
    <AppShell requiredRole="CUSTOMER">
      <ControlPanel
        breadcrumbs={[
          { label: 'My Orders', to: '/orders' },
          { label: `#${order.id.slice(0, 8)}` },
        ]}
        actions={actionButtons}
      />

      <div className="o-content">
        {confirmed && (
          <div className="alert alert-success mt-3">
            ✓ Order #{order.id.slice(0, 8)} submitted successfully. Payment will be required once the store approves your order.
          </div>
        )}

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
          {/* Header Info */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 32px', marginBottom: 20 }}>
            <div className="o-form-group-inline">
              <span className="form-label">Store</span>
              <span style={{ fontWeight: 600 }}>{order.storeName ?? '—'}</span>
            </div>
            <div className="o-form-group-inline">
              <span className="form-label">Fulfillment</span>
              <span>{order.fulfillmentMethod === 'DELIVERY' ? '📦 Delivery' : '🏪 Pickup'}</span>
            </div>
            <div className="o-form-group-inline">
              <span className="form-label">Placed At</span>
              <span>{formatDateTime(order.createdAt)}</span>
            </div>
            <div className="o-form-group-inline">
              <span className="form-label">Status</span>
              <span><OrderStatusBadge status={order.status} /></span>
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
            <button className={`o-notebook-tab ${tab === 'items' ? 'active' : ''}`} onClick={() => setTab('items')}>Order Items</button>
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
                                Download
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

      {/* Star Ratings Submission Modal */}
      {showRateModal && (
        <Modal title="Rate your RentLo Rental" onClose={() => setShowRateModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowRateModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={submittingReview}
                onClick={handleSubmitReview}
              >
                {submittingReview ? 'Submitting…' : 'Submit Review'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label" style={{ fontWeight: 600 }}>Rate the Product (Condition & Experience)</label>
            <div className="stars-selector">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="stars-selector-btn"
                  onClick={() => setProductRating(star)}
                >
                  <span className={star <= productRating ? 'rating-star-filled' : 'rating-star-empty'}>★</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Rate the Store Partner</label>
            <div className="stars-selector">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  className="stars-selector-btn"
                  onClick={() => setStoreRating(star)}
                >
                  <span className={star <= storeRating ? 'rating-star-filled' : 'rating-star-empty'}>★</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group" style={{ marginTop: 18 }}>
            <label className="form-label" style={{ fontWeight: 600 }}>Review Comments (optional)</label>
            <textarea
              className="form-textarea"
              placeholder="Tell us what you liked or how we can improve..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{ width: '100%', minHeight: 80, padding: 10, borderRadius: 'var(--radius)', border: '1px solid var(--border-input)' }}
            />
          </div>
        </Modal>
      )}
    </AppShell>
  )
}
