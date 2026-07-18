import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { cartApi } from '@/api/cartApi'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { CartResponse, CartItemResponse } from '@/types/cart'

export function CartPage() {
  const navigate = useNavigate()
  const [cart, setCart] = useState<CartResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

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

  const handleRemove = async (itemId: string) => {
    setUpdatingId(itemId)
    try {
      await cartApi.removeItem(itemId)
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
      const { data } = await cartApi.updateItem(item.id, {
        productVariantId: item.variantId,
        productId: !item.variantId ? item.productId : undefined,
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

  return (
    <AppShell requiredRole="CUSTOMER">
      <div className="page-header">
        <div>
          <h1 className="page-title">Shopping Cart</h1>
          <div className="page-subtitle">{items.length} item{items.length !== 1 ? 's' : ''}</div>
        </div>
        <Link to="/products" className="btn btn-secondary">
          <i className="fa-solid fa-arrow-left"></i> Continue Shopping
        </Link>
      </div>

      {loading && <div className="loading-overlay"><span className="spinner"></span></div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {mixedStore && (
        <div className="alert alert-warning">
          <i className="fa-solid fa-triangle-exclamation" style={{ marginRight: 8 }}></i>
          Your cart contains products from multiple stores ({storeIds.map((id) => {
            const item = items.find((i) => i.adminId === id)
            return item?.storeName ?? id
          }).join(', ')}). Please remove items to leave only one store before checking out.
        </div>
      )}

      {!loading && items.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-cart-shopping"></i>
          <p>Your cart is empty.</p>
          <Link to="/products" className="btn btn-primary" style={{ marginTop: 16 }}>Browse Products</Link>
        </div>
      )}

      {!loading && items.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '20px', alignItems: 'flex-start' }}>
          {/* Items */}
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rental Period</th>
                  <th>Qty</th>
                  <th>Unit Price</th>
                  <th>Amount</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{item.productName}</div>
                      {item.variantSku && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {item.variantSku}</div>}
                      {item.variantAttributes && item.variantAttributes.length > 0 && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.variantAttributes.map((a) => `${a.name}: ${a.value}`).join(', ')}
                        </div>
                      )}
                      {item.storeName && (
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>
                          <i className="fa-solid fa-store" style={{ marginRight: 3 }}></i>{item.storeName}
                        </div>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {formatDate(item.startDate)} — {formatDate(item.endDate)}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" disabled={updatingId === item.id} onClick={() => void handleQty(item, item.quantity - 1)}>
                          <i className="fa-solid fa-minus"></i>
                        </button>
                        <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                        <button className="btn btn-secondary btn-sm" disabled={updatingId === item.id} onClick={() => void handleQty(item, item.quantity + 1)}>
                          <i className="fa-solid fa-plus"></i>
                        </button>
                      </div>
                    </td>
                    <td>{formatCurrency(item.unitPrice)}</td>
                    <td style={{ fontWeight: 600 }}>{formatCurrency(item.amount)}</td>
                    <td>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={updatingId === item.id}
                        onClick={() => void handleRemove(item.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="card">
            <div className="card-header"><span className="card-title">Order Summary</span></div>
            <div className="card-body">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                <span style={{ fontWeight: 600 }}>{formatCurrency(cart?.total ?? 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14, fontSize: '0.875rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Delivery</span>
                <span>Determined at checkout</span>
              </div>
              <div className="divider" style={{ margin: '12px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16, fontWeight: 700 }}>
                <span>Total</span>
                <span>{formatCurrency(cart?.total ?? 0)}</span>
              </div>
              <button
                className="btn btn-primary btn-block"
                disabled={mixedStore || items.length === 0}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  )
}
