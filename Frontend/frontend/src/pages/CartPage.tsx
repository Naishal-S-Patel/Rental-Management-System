import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { cartApi } from '@/api/cartApi'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CartResponse, CartItemResponse } from '@/types/cart'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<number | null>(null)

  const fetchCart = async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await cartApi.get()
      setCart(data)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load cart.'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void fetchCart() }, [])

  const handleRemove = async (itemId: number) => {
    setUpdatingId(itemId)
    try {
      await cartApi.removeItem(String(itemId))
      await fetchCart()
      toast.success('Item removed')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove item.'))
    } finally {
      setUpdatingId(null)
    }
  }

  const handleQty = async (item: CartItemResponse, newQty: number) => {
    if (newQty < 1) return
    setUpdatingId(item.id)
    try {
      const { data } = await cartApi.updateItem(String(item.id), {
        productVariantId: item.variantId,
        quantity: newQty,
        startDate: item.startDate,
        endDate: item.endDate,
        rentalPeriodId: item.rentalPeriodId,
      })
      setCart(data)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update quantity.'))
    } finally {
      setUpdatingId(null)
    }
  }

  // Mixed-store check
  const storeIds = cart ? [...new Set(cart.items.map((i) => i.adminId))] : []
  const mixedStore = storeIds.length > 1

  const items = cart?.items ?? []

  const getImageUrl = (item: CartItemResponse) => {
    if (!item.imageUrl) return null
    if (item.imageUrl.startsWith('http')) return item.imageUrl
    return `${BASE_URL}${item.imageUrl}`
  }

  return (
    <AppShell requiredRole="CUSTOMER">
      <ControlPanel
        breadcrumbs={[{ label: 'Shopping Cart' }]}
        actions={
          <Link to="/products" className="btn btn-secondary">
            ← Continue Shopping
          </Link>
        }
      />

      <div className="o-content">
        {loading && <div className="loading-overlay"><span className="spinner"></span></div>}
        {error && (
          <div className="alert alert-danger mt-3">
            {error}
            <button className="btn btn-sm btn-secondary" style={{ marginLeft: 12 }} onClick={() => void fetchCart()}>
              Retry
            </button>
          </div>
        )}

        {mixedStore && (
          <div className="alert alert-warning mt-3">
            Your cart contains products from multiple stores ({storeIds.map((id) => {
              const item = items.find((i) => i.adminId === id)
              return item?.storeName ?? id
            }).join(', ')}). Please remove items to leave only one store before checking out.
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="empty-state mt-3">
            <p>Your cart is empty.</p>
            <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
          </div>
        )}

        {!loading && items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'flex-start', marginTop: 16 }}>
            {/* Items */}
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Rental Period</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Unit Price</th>
                    <th className="text-right">Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => {
                    const imgUrl = getImageUrl(item)
                    return (
                      <tr key={item.id}>
                        <td>
                          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                            {imgUrl && <img src={imgUrl} alt={item.productName} style={{ width: 40, height: 40, objectFit: 'cover', border: '1px solid var(--border)' }} />}
                            <div>
                              <div style={{ fontWeight: 600 }}>{item.productName}</div>
                              {item.variantSku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.variantSku}</div>}
                              {item.variantAttributes && item.variantAttributes.length > 0 && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                  {item.variantAttributes.map((a) => `${a.name}: ${a.value}`).join(', ')}
                                </div>
                              )}
                              {item.storeName && (
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                  Sold by {item.storeName}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {formatDate(item.startDate)} — {formatDate(item.endDate)}
                          {item.rentalPeriodName && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{item.rentalPeriodName}</div>}
                        </td>
                        <td className="text-right">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" disabled={updatingId === item.id} onClick={() => void handleQty(item, item.quantity - 1)}>
                              −
                            </button>
                            <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                            <button className="btn btn-secondary btn-sm" disabled={updatingId === item.id} onClick={() => void handleQty(item, item.quantity + 1)}>
                              +
                            </button>
                          </div>
                        </td>
                        <td className="text-right" style={{ fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.unitPrice)}</td>
                        <td className="text-right" style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(item.lineTotal)}</td>
                        <td>
                          <button
                            className="btn btn-danger btn-sm"
                            disabled={updatingId === item.id}
                            onClick={() => void handleRemove(item.id)}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Sidebar */}
            <div className="card">
              <div className="card-header">
                <span className="card-title">Order Summary</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cart?.subtotalAmount ?? 0)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Security Deposit</span>
                  <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cart?.depositAmount ?? 0)}</span>
                </div>
                <div className="divider" style={{ margin: '12px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1rem', marginBottom: 16 }}>
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--primary)', fontVariantNumeric: 'tabular-nums' }}>{formatCurrency(cart?.totalAmount ?? 0)}</span>
                </div>
                <button
                  className="btn btn-primary btn-block btn-lg"
                  disabled={mixedStore || items.length === 0}
                  onClick={() => navigate('/checkout')}
                >
                  Proceed to Checkout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
