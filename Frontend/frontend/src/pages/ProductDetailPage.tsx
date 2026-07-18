import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { Modal } from '@/components/Modal'
import { productApi } from '@/api/productApi'
import { cartApi } from '@/api/cartApi'
import { rentalPeriodApi } from '@/api/pricelistApi'
import { formatCurrency, formatDateInput, todayInputDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { ProductResponse, ProductVariantResponse } from '@/types/product'
import type { RentalPeriodResponse } from '@/types/pricelist'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [rentalPeriods, setRentalPeriods] = useState<RentalPeriodResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImg, setSelectedImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [startDate, setStartDate] = useState(todayInputDate())
  const [endDate, setEndDate] = useState('')
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariantResponse | null>(null)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([productApi.get(id), rentalPeriodApi.list()])
      .then(([{ data: p }, { data: rp }]) => {
        setProduct(p)
        setRentalPeriods(rp)
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load product.')))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <AppShell requiredRole="CUSTOMER"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>
  if (error || !product) return <AppShell requiredRole="CUSTOMER"><div className="alert alert-danger">{error || 'Product not found.'}</div></AppShell>

  const hasVariants = product.variants && product.variants.length > 0

  const getImageUrl = (idx: number) => {
    const img = product.images?.[idx]
    if (!img) return null
    return img.url || `${BASE_URL}/api/files/${img.fileId}`
  }

  const handleAddToCart = async (variantId?: string) => {
    if (!endDate) { toast.error('Please select an end date.'); return }
    setAddingToCart(true)
    try {
      await cartApi.addItem({
        productId: !variantId ? product.id : undefined,
        productVariantId: variantId,
        quantity,
        startDate,
        endDate,
        rentalPeriodId: selectedPeriodId || undefined,
      })
      toast.success('Added to cart')
      navigate('/cart')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add to cart.'))
    } finally {
      setAddingToCart(false)
    }
  }

  const handleClickAddToCart = () => {
    if (hasVariants) {
      setShowConfigModal(true)
    } else {
      void handleAddToCart()
    }
  }

  // Group attribute types for variant picker
  const attrGroups: Record<string, { typeId: string; typeName: string; values: { valueId: string; value: string }[] }> = {}
  if (hasVariants) {
    product.variants.forEach((v) => {
      v.attributeValues.forEach((av) => {
        if (!attrGroups[av.attributeTypeId]) {
          attrGroups[av.attributeTypeId] = { typeId: av.attributeTypeId, typeName: av.attributeTypeName, values: [] }
        }
        if (!attrGroups[av.attributeTypeId].values.find((x) => x.valueId === av.id)) {
          attrGroups[av.attributeTypeId].values.push({ valueId: av.id, value: av.value })
        }
      })
    })
  }


  const matchedVariant = hasVariants
    ? product.variants.find((v) =>
        Object.entries(selectedAttrs).every(([typeId, valueId]) =>
          v.attributeValues.some((av) => av.attributeTypeId === typeId && av.id === valueId),
        ),
      ) ?? null
    : null

  return (
    <AppShell requiredRole="CUSTOMER">
      {/* Breadcrumb */}
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
        <Link to="/products">Products</Link> <span style={{ margin: '0 6px' }}>/</span> {product.name}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: '24px', alignItems: 'flex-start' }}>
        {/* Images */}
        <div>
          <div style={{ border: '1px solid var(--border)', background: 'var(--bg-subtle)', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {getImageUrl(selectedImg) ? (
              <img src={getImageUrl(selectedImg)!} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <i className="fa-solid fa-image" style={{ fontSize: '3rem', color: 'var(--text-muted)' }}></i>
            )}
          </div>
          {product.images.length > 1 && (
            <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImg(i)}
                  style={{ width: 56, height: 44, border: `2px solid ${i === selectedImg ? 'var(--primary)' : 'var(--border)'}`, background: 'var(--bg-subtle)', cursor: 'pointer', overflow: 'hidden', padding: 0 }}
                >
                  {getImageUrl(i) && <img src={getImageUrl(i)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '4px' }}>{product.name}</h1>
          <div style={{ fontSize: '1.375rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '8px' }}>
            {formatCurrency(product.basePrice)}
            <span style={{ fontSize: '0.8125rem', fontWeight: 400, color: 'var(--text-muted)', marginLeft: 4 }}>/ unit</span>
          </div>

          {product.storeName && (
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>
              <i className="fa-solid fa-store" style={{ marginRight: 6 }}></i>
              Sold by{' '}
              <Link to={`/products?store=${product.adminId}`} style={{ fontWeight: 600 }}>{product.storeName}</Link>
            </div>
          )}

          <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginBottom: '16px', lineHeight: '1.6' }}>
            {product.description}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Start date</label>
              <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={todayInputDate()} />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">End date</label>
              <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || todayInputDate()} />
            </div>
          </div>

          {rentalPeriods.length > 0 && (
            <div className="form-group">
              <label className="form-label">Rental period template (optional)</label>
              <select className="form-select" value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)}>
                <option value="">-- custom dates --</option>
                {rentalPeriods.map((rp) => (
                  <option key={rp.id} value={rp.id}>{rp.name} ({rp.durationValue} {rp.durationUnit.toLowerCase()})</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setQuantity((q) => Math.max(1, q - 1))}>
                <i className="fa-solid fa-minus"></i>
              </button>
              <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 600 }}>{quantity}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => setQuantity((q) => q + 1)}>
                <i className="fa-solid fa-plus"></i>
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px' }}>
            <button
              className="btn btn-primary"
              onClick={handleClickAddToCart}
              disabled={addingToCart || !product.active}
            >
              {addingToCart
                ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Adding…</>
                : <><i className="fa-solid fa-cart-plus"></i> Add to Cart</>}
            </button>
            {!product.active && <span className="badge badge-danger">Currently unavailable</span>}
          </div>

          <div className="divider" style={{ margin: '20px 0' }}></div>

          <div style={{ background: 'var(--bg-subtle)', border: '1px solid var(--border)', padding: '12px', fontSize: '0.8125rem' }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Security deposit</div>
            <div style={{ color: 'var(--text-secondary)' }}>
              {formatCurrency(product.securityDepositAmount)} — held until return, refunded in full for on-time return.
            </div>
          </div>
        </div>
      </div>

      {/* Variant Configure Modal */}
      {showConfigModal && (
        <Modal title="Configure — choose variant" onClose={() => setShowConfigModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowConfigModal(false)}>Cancel</button>
              <button
                className="btn btn-primary"
                disabled={!matchedVariant || addingToCart}
                onClick={() => { void handleAddToCart(matchedVariant?.id); setShowConfigModal(false) }}
              >
                {addingToCart ? 'Adding…' : 'Add to Cart'}
              </button>
            </>
          }
        >
          {Object.values(attrGroups).map((group) => (
            <div key={group.typeId} className="form-group">
              <label className="form-label">{group.typeName}</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {group.values.map((v) => (
                  <button
                    key={v.valueId}
                    onClick={() => setSelectedAttrs((prev) => ({ ...prev, [group.typeId]: v.valueId }))}
                    style={{
                      padding: '6px 14px',
                      border: `1px solid ${selectedAttrs[group.typeId] === v.valueId ? 'var(--primary)' : 'var(--border-input)'}`,
                      background: selectedAttrs[group.typeId] === v.valueId ? 'var(--primary-light)' : 'var(--bg-surface)',
                      color: selectedAttrs[group.typeId] === v.valueId ? 'var(--primary)' : 'var(--text-primary)',
                      cursor: 'pointer',
                      fontSize: '0.8125rem',
                      fontWeight: 500,
                    }}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {matchedVariant && (
            <div className="alert alert-success" style={{ marginTop: 8 }}>
              <i className="fa-solid fa-circle-check" style={{ marginRight: 6 }}></i>
              SKU: <strong>{matchedVariant.sku}</strong> — {matchedVariant.availableQuantity ?? matchedVariant.totalQuantity} available
            </div>
          )}
          {Object.keys(selectedAttrs).length > 0 && !matchedVariant && (
            <div className="alert alert-warning" style={{ marginTop: 8 }}>No variant matches this combination.</div>
          )}
        </Modal>
      )}
    </AppShell>
  )
}
