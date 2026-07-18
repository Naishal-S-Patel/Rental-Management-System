import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { cartApi } from '@/api/cartApi'
import { addressApi } from '@/api/addressApi'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CartResponse } from '@/types/cart'
import type { AddressResponse, AddressRequest } from '@/types/address'
import type { OrderResponse } from '@/types/order'

type Step = 'fulfillment' | 'address' | 'review'

export function CheckoutPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState<Step>('fulfillment')
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState('')
  const [fulfillment, setFulfillment] = useState<'STANDARD_DELIVERY' | 'PICKUP_FROM_STORE'>('STANDARD_DELIVERY')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showNewAddr, setShowNewAddr] = useState(false)
  const [newAddr, setNewAddr] = useState<AddressRequest>({ street: '', city: '', state: '', zipCode: '', country: 'India' })

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
      setNewAddr({ street: '', city: '', state: '', zipCode: '', country: 'India' })
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save address.'))
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { data: order } = await cartApi.checkout({
        fulfillmentMethod: fulfillment,
        deliveryAddressId: fulfillment === 'STANDARD_DELIVERY' ? selectedAddressId : undefined,
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
      <div className="page-header">
        <h1 className="page-title">Checkout</h1>
      </div>

      {/* Step bar */}
      <div className="step-bar">
        {STEPS.map((s, i) => (
          <div key={s.key} className={`step-bar-item ${i < stepIdx ? 'done' : i === stepIdx ? 'active' : ''}`}>
            {i < stepIdx && <i className="fa-solid fa-check" style={{ marginRight: 4 }}></i>}
            {s.label}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'flex-start' }}>
        <div>
          {/* Step 1 — Fulfillment */}
          {step === 'fulfillment' && (
            <div className="card">
              <div className="card-header"><span className="card-title">Delivery Method</span></div>
              <div className="card-body">
                {([
                  { val: 'STANDARD_DELIVERY', label: 'Standard Delivery', desc: 'Delivered to your address', icon: 'fa-solid fa-truck' },
                  { val: 'PICKUP_FROM_STORE', label: 'Pickup from Store', desc: 'Collect from the Admin\'s location', icon: 'fa-solid fa-store' },
                ] as const).map((opt) => (
                  <label key={opt.val} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', border: `1px solid ${fulfillment === opt.val ? 'var(--primary)' : 'var(--border)'}`, marginBottom: 10, cursor: 'pointer', background: fulfillment === opt.val ? 'var(--primary-light)' : 'var(--bg-surface)' }}>
                    <input type="radio" name="fulfillment" checked={fulfillment === opt.val} onChange={() => setFulfillment(opt.val)} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: 2 }}>
                        <i className={opt.icon} style={{ marginRight: 8 }}></i>{opt.label}
                        <span className="badge badge-success" style={{ marginLeft: 8 }}>Free</span>
                      </div>
                      <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{opt.desc}</div>
                    </div>
                  </label>
                ))}
                <button
                  className="btn btn-primary"
                  onClick={() => setStep(fulfillment === 'STANDARD_DELIVERY' ? 'address' : 'review')}
                >
                  Continue <i className="fa-solid fa-arrow-right"></i>
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
                  <label key={addr.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px', border: `1px solid ${selectedAddressId === addr.id ? 'var(--primary)' : 'var(--border)'}`, marginBottom: 8, cursor: 'pointer', background: selectedAddressId === addr.id ? 'var(--primary-light)' : 'var(--bg-surface)' }}>
                    <input type="radio" name="address" checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} style={{ marginTop: 2 }} />
                    <div style={{ fontSize: '0.875rem' }}>
                      {addr.label && <div style={{ fontWeight: 600, marginBottom: 2 }}>{addr.label}</div>}
                      <div>{addr.street}, {addr.city}, {addr.state} {addr.zipCode}, {addr.country}</div>
                      {addr.isDefault && <span className="badge badge-info" style={{ marginTop: 4 }}>Default</span>}
                    </div>
                  </label>
                ))}

                {!showNewAddr && (
                  <button className="btn btn-secondary btn-sm" style={{ marginTop: 8 }} onClick={() => setShowNewAddr(true)}>
                    <i className="fa-solid fa-plus"></i> Add new address
                  </button>
                )}

                {showNewAddr && (
                  <div style={{ border: '1px solid var(--border)', padding: 14, marginTop: 10 }}>
                    <div style={{ fontWeight: 600, marginBottom: 10, fontSize: '0.875rem' }}>New Address</div>
                    {[
                      { key: 'street', label: 'Street', placeholder: '123 Main St' },
                      { key: 'city', label: 'City', placeholder: 'Mumbai' },
                      { key: 'state', label: 'State', placeholder: 'Maharashtra' },
                      { key: 'zipCode', label: 'ZIP Code', placeholder: '400001' },
                      { key: 'country', label: 'Country', placeholder: 'India' },
                    ].map((f) => (
                      <div className="form-group" key={f.key}>
                        <label className="form-label">{f.label}</label>
                        <input className="form-input" placeholder={f.placeholder} value={(newAddr as Record<string, string>)[f.key]} onChange={(e) => setNewAddr((p) => ({ ...p, [f.key]: e.target.value }))} />
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
                    <i className="fa-solid fa-arrow-left"></i> Back
                  </button>
                  <button className="btn btn-primary" disabled={!selectedAddressId} onClick={() => setStep('review')}>
                    Continue <i className="fa-solid fa-arrow-right"></i>
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
                  {fulfillment === 'STANDARD_DELIVERY' ? 'Standard Delivery' : 'Pickup from Store'}
                </div>
                {fulfillment === 'STANDARD_DELIVERY' && selectedAddressId && (() => {
                  const addr = addresses.find((a) => a.id === selectedAddressId)
                  return addr ? (
                    <div style={{ marginBottom: 14, fontSize: '0.875rem' }}>
                      <span style={{ fontWeight: 600 }}>Delivery to:</span>{' '}
                      {addr.street}, {addr.city}, {addr.state} {addr.zipCode}
                    </div>
                  ) : null
                })()}

                <div className="alert alert-info" style={{ marginBottom: 14 }}>
                  Submitting this order sends it to the store for approval. Payment is required only after the Admin confirms your order.
                </div>

                <div style={{ display: 'flex', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => setStep(fulfillment === 'STANDARD_DELIVERY' ? 'address' : 'fulfillment')}>
                    <i className="fa-solid fa-arrow-left"></i> Back
                  </button>
                  <button className="btn btn-primary" disabled={submitting} onClick={() => void handleSubmit()}>
                    {submitting ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Submitting…</> : 'Submit Order'}
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
                <span style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</span>
              </div>
            ))}
            <div className="divider" style={{ margin: '10px 0' }}></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>Total</span>
              <span>{formatCurrency(cart?.total ?? 0)}</span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
