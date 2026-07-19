import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { cartApi } from '@/api/cartApi'
import { addressApi } from '@/api/addressApi'
import { formatCurrency } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CartResponse } from '@/types/cart'
import type { AddressResponse, AddressRequest } from '@/types/address'

type Step = 'fulfillment' | 'address' | 'review'

export function CheckoutPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('fulfillment')
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [fulfillment, setFulfillment] = useState<'DELIVERY' | 'STORE_PICKUP'>('DELIVERY')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showNewAddr, setShowNewAddr] = useState(false)
  const [newAddr, setNewAddr] = useState<AddressRequest>({ line1: '', city: '', state: '', postalCode: '', country: 'India' })

  useEffect(() => {
    Promise.all([cartApi.get(), addressApi.list()])
      .then(([{ data: c }, { data: a }]) => {
        setCart(c)
        setAddresses(a)
        const def = a.find((x) => x.isDefault)
        if (def) setSelectedAddressId(def.id)
      })
      .catch(() => toast.error('Failed to load checkout data.'))
      .finally(() => setLoading(false))
  }, [])

  const handleAddAddress = async () => {
    try {
      const { data } = await addressApi.create(newAddr)
      setAddresses((prev) => [...prev, data])
      setSelectedAddressId(data.id)
      setShowNewAddr(false)
      setNewAddr({ line1: '', city: '', state: '', postalCode: '', country: 'India' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save address.'))
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: order } = await cartApi.checkout({
        fulfillmentMethod: fulfillment,
        deliveryAddressId: fulfillment === 'DELIVERY' ? selectedAddressId : undefined,
      })
      navigate(`/orders/${order.id}?confirmed=1`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Checkout failed.'))
    } finally {
      setSubmitting(false)
    }
  }

  const STEPS: { key: Step; label: string }[] = [
    { key: 'fulfillment', label: '1. Fulfillment' },
    { key: 'address', label: '2. Address' },
    { key: 'review', label: '3. Review' },
  ]

  const stepIdx = STEPS.findIndex((s) => s.key === step)

  if (loading) return <AppShell requiredRole="CUSTOMER"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>

  return (
    <AppShell requiredRole="CUSTOMER">
      <ControlPanel breadcrumbs={[{ label: 'Checkout' }]} />

      <div className="o-content">
        {/* Step bar */}
        <div className="step-bar mt-3">
          {STEPS.map((s, i) => (
            <div key={s.key} className={`step-bar-item ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}>
              {i < stepIdx && '✓ '}{s.label}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'flex-start', marginTop: 16 }}>
          <div>
            {/* Step 1 — Fulfillment */}
            {step === 'fulfillment' && (
              <div className="card">
                <div className="card-header"><span className="card-title">Delivery Method</span></div>
                <div className="card-body">
                  {([
                    { val: 'DELIVERY', label: 'Standard Delivery', desc: 'Delivered to your address' },
                    { val: 'STORE_PICKUP', label: 'Pickup from Store', desc: 'Collect from the Admin\'s location' },
                  ] as const).map((opt) => (
                    <label key={opt.val} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', border: `1px solid ${fulfillment === opt.val ? 'var(--primary)' : 'var(--border)'}`, marginBottom: 10, cursor: 'pointer', background: fulfillment === opt.val ? 'var(--primary-light)' : 'var(--bg-surface)', borderRadius: 'var(--radius)' }}>
                      <input type="radio" name="fulfillment" checked={fulfillment === opt.val} onChange={() => setFulfillment(opt.val)} style={{ marginTop: 2 }} />
                      <div>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>
                          {opt.label}
                          <span className="badge badge-success" style={{ marginLeft: 8 }}>Free</span>
                        </div>
                        <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                  <button
                    className="btn btn-primary"
                    onClick={() => setStep(fulfillment === 'DELIVERY' ? 'address' : 'review')}
                  >
                    Continue →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2 — Address */}
            {step === 'address' && (
              <div className="card">
                <div className="card-header"><span className="card-title">Delivery Address</span></div>
                <div className="card-body">
                  {addresses.map((addr) => (
                    <label key={addr.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', border: `1px solid ${selectedAddressId === addr.id ? 'var(--primary)' : 'var(--border)'}`, marginBottom: 8, cursor: 'pointer', background: selectedAddressId === addr.id ? 'var(--primary-light)' : 'var(--bg-surface)', borderRadius: 'var(--radius)' }}>
                      <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} style={{ marginTop: 2 }} />
                      <div style={{ fontSize: '0.875rem' }}>
                        {addr.label && <div style={{ fontWeight: 600, marginBottom: 2 }}>{addr.label}</div>}
                        <div>{addr.line1}, {addr.city}, {addr.state} {addr.postalCode}, {addr.country}</div>
                        {addr.isDefault && <span className="badge badge-info" style={{ marginTop: 4 }}>Default</span>}
                      </div>
                    </label>
                  ))}

                  {!showNewAddr && (
                    <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowNewAddr(true)}>
                      + Add new address
                    </button>
                  )}

                  {showNewAddr && (
                    <div style={{ border: '1px solid var(--border)', padding: 14, marginTop: 10, borderRadius: 'var(--radius)' }}>
                      <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.875rem' }}>New Address</div>
                      {[
                        { key: 'line1', label: 'Street', placeholder: '123 Main St' },
                        { key: 'city', label: 'City', placeholder: 'Mumbai' },
                        { key: 'state', label: 'State', placeholder: 'Maharashtra' },
                        { key: 'postalCode', label: 'ZIP Code', placeholder: '400001' },
                        { key: 'country', label: 'Country', placeholder: 'India' },
                      ].map((f) => (
                        <div className="form-group" key={f.key}>
                          <label className="form-label">{f.label}</label>
                          <input className="form-input" placeholder={f.placeholder} value={(newAddr as any)[f.key]} onChange={(e) => setNewAddr((p) => ({ ...p, [f.key]: e.target.value }))} />
                        </div>
                      ))}
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => void handleAddAddress()}>Save Address</button>
                        <button className="btn btn-secondary btn-sm" onClick={() => setShowNewAddr(false)}>Cancel</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button className="btn btn-secondary" onClick={() => setStep('fulfillment')}>
                      ← Back
                    </button>
                    <button className="btn btn-primary" disabled={!selectedAddressId} onClick={() => setStep('review')}>
                      Continue →
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3 — Review */}
            {step === 'review' && (
              <div className="card">
                <div className="card-header"><span className="card-title">Review & Submit</span></div>
                <div className="card-body">
                  <div style={{ marginBottom: 12, fontSize: '0.875rem' }}>
                    <span style={{ fontWeight: 600 }}>Fulfillment:</span>{' '}
                    {fulfillment === 'DELIVERY' ? 'Standard Delivery' : 'Pickup from Store'}
                  </div>
                  {fulfillment === 'DELIVERY' && selectedAddressId && (() => {
                    const addr = addresses.find((a) => a.id === selectedAddressId)
                    return addr ? (
                      <div style={{ marginBottom: 14, fontSize: '0.875rem' }}>
                        <span style={{ fontWeight: 600 }}>Delivery to:</span>{' '}
                        {addr.line1}, {addr.city}, {addr.state} {addr.postalCode}
                      </div>
                    ) : null
                  })()}

                  <div className="alert alert-info" style={{ marginBottom: 14 }}>
                    Submitting this order sends it to the store for approval. Payment is required only after the Admin confirms your order.
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn btn-secondary" onClick={() => setStep(fulfillment === 'DELIVERY' ? 'address' : 'fulfillment')}>
                      ← Back
                    </button>
                    <button className="btn btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
                      {submitting ? 'Submitting…' : 'Submit Order'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="card">
            <div className="card-header"><span className="card-title">Summary</span></div>
            <div className="card-body" style={{ padding: '12px' }}>
              {cart?.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.8125rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>
                    {item.productName} x{item.quantity}
                  </span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.lineTotal)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cart?.subtotalAmount ?? 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Security Deposit</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cart?.depositAmount ?? 0)}</span>
              </div>
              <div className="divider" style={{ margin: '8px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span>
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cart?.totalAmount ?? 0)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
