import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { Modal } from '@/components/Modal'
import { ProductPlaceholderSvg } from '@/components/ProductPlaceholderSvg'
import { productApi } from '@/api/productApi'
import { cartApi } from '@/api/cartApi'
import { rentalPeriodApi } from '@/api/pricelistApi'
import { reviewApi, type ReviewResponse } from '@/api/reviewApi'
import { formatCurrency, todayInputDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { ProductResponse } from '@/types/product'
import type { RentalPeriodResponse } from '@/types/pricelist'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [rentalPeriods, setRentalPeriods] = useState<RentalPeriodResponse[]>([])
  const [reviews, setReviews] = useState<ReviewResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedImg, setSelectedImg] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [startDate, setStartDate] = useState(todayInputDate())
  const [endDate, setEndDate] = useState('')
  const [selectedPeriodId, setSelectedPeriodId] = useState('')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})

  useEffect(() => {
    if (!id) return
    setLoading(true)
    Promise.all([
      productApi.get(id),
      rentalPeriodApi.list(),
      reviewApi.getProductReviews(id)
    ])
      .then(([{ data: p }, { data: rp }, { data: revs }]) => {
        setProduct(p)
        setRentalPeriods(rp)
        setReviews(revs)
      })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load product.')))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <AppShell requiredRole="CUSTOMER"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>
  if (error || !product) return <AppShell requiredRole="CUSTOMER"><div className="o-content"><div className="alert alert-danger mt-3">{error || 'Product not found.'}</div></div></AppShell>

  const hasVariants = product.variants && product.variants.length > 0
  const hasConfigurableAttributes = hasVariants && product.variants.some((v) => v.attributeValues && v.attributeValues.length > 0)

  const getImageUrl = (idx: number) => {
    const img = product.images?.[idx]
    if (!img) return null
    if (img.url) {
      if (img.url.startsWith('http')) return img.url
      return `${BASE_URL}${img.url}`
    }
    return img.fileId ? `${BASE_URL}/api/files/${img.fileId}` : null
  }

  const rentalPeriodIdNum = selectedPeriodId ? Number(selectedPeriodId) : undefined

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
        rentalPeriodId: rentalPeriodIdNum,
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
    if (hasConfigurableAttributes) {
      setShowConfigModal(true)
    } else if (hasVariants) {
      void handleAddToCart(product.variants[0].id)
    }
  }

  const renderStars = (rating: number = 0) => {
    const stars = []
    const rounded = Math.round(rating)
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <span key={i} className={i <= rounded ? 'rating-star-filled' : 'rating-star-empty'}>
          ★
        </span>
      )
    }
    return stars
  }

  // Group attribute types for variant picker
  const attrGroups: Record<string, { typeId: string; typeName: string; values: { valueId: string; value: string }[] }> = {}
  if (hasVariants) {
    product.variants.forEach((v) => {
      v.attributeValues.forEach((av) => {
        const tId = String(av.attributeTypeId)
        const vId = String(av.id)
        if (!attrGroups[tId]) {
          attrGroups[tId] = { typeId: tId, typeName: av.attributeTypeName, values: [] }
        }
        if (!attrGroups[tId].values.find((x) => x.valueId === vId)) {
          attrGroups[tId].values.push({ valueId: vId, value: av.value })
        }
      })
    })
  }

  const matchedVariant = hasVariants
    ? product.variants.find((v) =>
        Object.entries(selectedAttrs).every(([typeId, valueId]) =>
          v.attributeValues.some((av) => String(av.attributeTypeId) === typeId && String(av.id) === valueId),
        ),
      ) ?? null
    : null

  return (
    <AppShell requiredRole="CUSTOMER">
      <ControlPanel
        breadcrumbs={[
          { label: 'Products', to: '/products' },
          { label: product.name },
        ]}
      />

      <div className="o-content">
        <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px', alignItems: 'flex-start', marginTop: 16 }}>
          {/* Images */}
          <div>
            <div style={{
              border: '1px solid var(--border)',
              background: 'var(--bg-subtle)',
              aspectRatio: '4/3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              borderRadius: 'var(--radius)',
              position: 'relative'
            }}>
              {getImageUrl(selectedImg) ? (
                <img src={getImageUrl(selectedImg)!} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <ProductPlaceholderSvg category={product.category} name={product.name} />
              )}
            </div>
            {(product.images || []).length > 1 && (
              <div style={{ display: 'flex', gap: '8px', marginTop: '8px', flexWrap: 'wrap' }}>
                {(product.images || []).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImg(i)}
                    style={{
                      width: 56,
                      height: 44,
                      border: `2px solid ${i === selectedImg ? 'var(--primary)' : 'var(--border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      background: 'var(--bg-subtle)',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      padding: 0
                    }}
                  >
                    {getImageUrl(i) && <img src={getImageUrl(i)!} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Panel */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '6px', letterSpacing: '-0.02em' }}>{product.name}</h1>
            
            {/* Rating display */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 16, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex' }}>{renderStars(product.ratingAverage)}</div>
              <span style={{ fontWeight: 600 }}>{product.ratingAverage ? product.ratingAverage.toFixed(1) : 'No ratings yet'}</span>
              <span style={{ color: 'var(--text-muted)' }}>({reviews.length} reviews)</span>
            </div>

            {/* Dynamic Price Display */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {formatCurrency(product.dynamicPrice ?? product.basePrice)}
                </span>
                <span style={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)' }}>/ unit</span>

                {/* Show crossed-out base price if dynamic differs meaningfully */}
                {product.dynamicPrice != null && Math.abs((product.dynamicPrice - product.basePrice) / product.basePrice) > 0.02 && (
                  <span style={{ fontSize: '1rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                    {formatCurrency(product.basePrice)}
                  </span>
                )}

                {/* ⓘ info icon that reveals breakdown on hover */}
                {product.topDriverBadge && (
                  <span title={[
                    product.demandNote,
                    product.seasonalMultiplier && product.seasonalMultiplier !== 1.0 ? `🌤️ Season ×${product.seasonalMultiplier.toFixed(2)}` : null,
                    product.festivalMultiplier && product.festivalMultiplier !== 1.0 ? `🎉 Festival ×${product.festivalMultiplier.toFixed(2)}` : null,
                    product.weekendMultiplier && product.weekendMultiplier !== 1.0 ? `📅 Weekend ×${product.weekendMultiplier.toFixed(2)}` : null,
                    product.weatherMultiplier && product.weatherMultiplier !== 1.0 ? `🌧️ Weather ×${product.weatherMultiplier.toFixed(2)}` : null,
                    product.scarcityMultiplier && product.scarcityMultiplier !== 1.0 ? `⚡ Scarcity ×${product.scarcityMultiplier.toFixed(2)}` : null,
                  ].filter(Boolean).join('\n') ?? undefined}
                    style={{ cursor: 'help', fontSize: '0.85rem', color: 'var(--primary)', opacity: 0.7, fontWeight: 700 }}>
                    ⓘ
                  </span>
                )}
              </div>

              {/* Demand badge pill */}
              {product.topDriverBadge && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  background: 'linear-gradient(135deg, rgba(255,56,92,0.08), rgba(255,150,50,0.08))',
                  border: '1px solid rgba(255,56,92,0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--primary)',
                  marginTop: 6
                }}>
                  {product.topDriverBadge}
                </div>
              )}

              {/* Price adjustment line if meaningful */}
              {product.priceAdjustment != null && Math.abs(product.priceAdjustment) > 0 && (
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>
                  Base {formatCurrency(product.basePrice)}
                  {' · '}
                  <span style={{ color: product.priceAdjustment > 0 ? '#e07000' : '#2a9d5c', fontWeight: 600 }}>
                    {product.priceAdjustment > 0 ? '+' : ''}{formatCurrency(product.priceAdjustment)} demand adjustment
                  </span>
                </div>
              )}
            </div>

            {product.storeName && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                🏫 Sold by{' '}
                <Link to={`/products?store=${product.adminId}`} style={{ fontWeight: 700, color: 'var(--primary)' }}>{product.storeName}</Link>
              </div>
            )}

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '24px', lineHeight: '1.6' }}>
              {product.description}
            </p>

            {/* Date selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">Start Date</label>
                <input type="date" className="form-input" value={startDate} onChange={(e) => setStartDate(e.target.value)} min={todayInputDate()} />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label">End Date</label>
                <input type="date" className="form-input" value={endDate} onChange={(e) => setEndDate(e.target.value)} min={startDate || todayInputDate()} />
              </div>
            </div>

            {rentalPeriods.length > 0 && (
              <div className="form-group">
                <label className="form-label">Rental Period Template (optional)</label>
                <select className="form-select" value={selectedPeriodId} onChange={(e) => setSelectedPeriodId(e.target.value)}>
                  <option value="">-- custom dates --</option>
                  {rentalPeriods.map((rp) => (
                    <option key={rp.id} value={rp.id}>{rp.name} ({rp.durationValue} {rp.durationUnit.toLowerCase()})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Quantity */}
            <div className="form-group" style={{ marginBottom: 24 }}>
              <label className="form-label">Quantity</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <button
                  className="btn btn-secondary"
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                >
                  −
                </button>
                <span style={{ minWidth: 32, textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>{quantity}</span>
                <button
                  className="btn btn-secondary"
                  style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
                  onClick={() => setQuantity((q) => q + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <button
                className="btn btn-primary"
                style={{ padding: '12px 28px', fontSize: '1rem', borderRadius: 'var(--radius)' }}
                onClick={handleClickAddToCart}
                disabled={addingToCart || !product.active || !hasVariants}
              >
                {addingToCart ? 'Adding to Cart…' : 'Rent Now →'}
              </button>
              {!product.active && <span className="badge badge-danger">Currently Unavailable</span>}
              {product.active && !hasVariants && <span className="badge badge-danger">Out of Stock</span>}
            </div>

            <div className="divider" style={{ margin: '24px 0' }}></div>

            <div style={{ background: 'var(--primary-light)', border: '1px solid rgba(255, 56, 92, 0.1)', padding: '16px', fontSize: '0.85rem', borderRadius: 'var(--radius)' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>🛡️ Security Deposit Refund Guarantee</div>
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                A deposit of <strong>{formatCurrency(product.securityDepositAmount)}</strong> is held securely during your rental period. It will be refunded in full automatically within 24 hours of returning the gear in good condition.
              </div>
            </div>
          </div>
        </div>

        {/* Reviews Section tab */}
        <div style={{ marginTop: 48, background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
          <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', marginBottom: 20 }}>
            Customer Feedback & Reviews ({reviews.length})
          </h2>
          
          {reviews.length === 0 ? (
            <div style={{ color: 'var(--text-secondary)', fontStyle: 'italic', padding: '10px 0' }}>
              No reviews for this product yet. Be the first to rent and review it!
            </div>
          ) : (
            <div className="reviews-grid">
              {reviews.map((rev) => (
                <div key={rev.id} className="review-item-card">
                  <div className="review-item-header">
                    <span className="review-item-author">👤 {rev.customerName}</span>
                    <span className="review-item-date">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 2, marginBottom: 8, fontSize: '0.85rem' }}>
                    {renderStars(rev.productRating)}
                  </div>
                  {rev.comment && <p className="review-item-comment">"{rev.comment}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Variant Configure Modal */}
      {showConfigModal && (
        <Modal title="Select Attributes" onClose={() => setShowConfigModal(false)}
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
                      borderRadius: 'var(--radius)',
                    }}
                  >
                    {v.value}
                  </button>
                ))}
              </div>
            </div>
          ))}
          {matchedVariant && (
            <div className="alert alert-success" style={{ marginTop: 12 }}>
              ✓ SKU Available: <strong>{matchedVariant.sku}</strong> — {matchedVariant.availableQuantity ?? matchedVariant.totalQuantity} items left
            </div>
          )}
          {Object.keys(selectedAttrs).length > 0 && !matchedVariant && (
            <div className="alert alert-warning" style={{ marginTop: 12 }}>No variant matches this combination. Please choose another combination.</div>
          )}
        </Modal>
      )}
    </AppShell>
  )
}
