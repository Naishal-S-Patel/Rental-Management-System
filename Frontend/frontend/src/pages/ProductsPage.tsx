import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Pagination } from '@/components/Pagination'
import { ProductPlaceholderSvg } from '@/components/ProductPlaceholderSvg'
import { productApi } from '@/api/productApi'
import { formatCurrency } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { ProductResponse } from '@/types/product'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function ProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [category, setCategory] = useState('')
  const [storeFilter, setStoreFilter] = useState('')
  const [stores, setStores] = useState<{ id: string; name: string }[]>([])
  const [wishlisted, setWishlisted] = useState<Record<string, boolean>>({})

  // Recommendations for sparse views
  const [suggestions, setSuggestions] = useState<ProductResponse[]>([])

  // Category counts (dummy metrics to show as badges in collapsible rail)
  const [catCounts, setCatCounts] = useState<Record<string, number>>({
    'Electronics': 0,
    'Furniture': 0,
    'Photography': 0,
    'Sports': 0,
    'Vehicles': 0,
    'Tools': 0
  })

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await productApi.list({ search: search || undefined, category: category || undefined, page, size: 12 })
      setProducts(data.content)
      setTotalPages(data.totalPages)
      
      // Extract unique stores
      const storeMap = new Map<string, string>()
      const counts: Record<string, number> = { 'Electronics': 0, 'Furniture': 0, 'Photography': 0, 'Sports': 0, 'Vehicles': 0, 'Tools': 0 }
      
      data.content.forEach((p) => {
        if (p.adminId && p.storeName) storeMap.set(p.adminId, p.storeName)
        if (p.category && counts[p.category] !== undefined) {
          counts[p.category] += 1
        }
      })
      setStores(Array.from(storeMap.entries()).map(([id, name]) => ({ id, name })))
      setCatCounts(counts)
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load products.'))
    } finally {
      setLoading(false)
    }
  }, [search, category, page])

  useEffect(() => { void fetchProducts() }, [fetchProducts])

  // Load general suggestions once on mount
  useEffect(() => {
    productApi.list({ page: 0, size: 6 })
      .then(({ data }) => setSuggestions(data.content))
      .catch(() => {})
  }, [])

  const filteredProducts = storeFilter
    ? products.filter((p) => p.adminId === storeFilter)
    : products

  const getImageUrl = (p: ProductResponse) => {
    const img = p.images?.[0]
    if (!img) return null
    if (img.url && img.url.startsWith('http')) return img.url
    return img.url ? `${BASE_URL}${img.url}` : (img.fileId ? `${BASE_URL}/api/files/${img.fileId}` : null)
  }

  const toggleWishlist = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setWishlisted(prev => ({ ...prev, [id]: !prev[id] }))
  }

  // Renders gold/empty star ratings based on dynamic metrics from the backend
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

  // Helper function to render a product card consistently
  const renderProductCard = (product: ProductResponse) => {
    const imgUrl = getImageUrl(product)
    const hasVariants = product.variants && product.variants.length > 0
    const totalStock = hasVariants
      ? product.variants.reduce((s, v) => s + (v.availableQuantity ?? v.totalQuantity ?? 0), 0)
      : 999
    
    const isStarred = wishlisted[product.id] || false
    const ratingAvg = product.ratingAverage ?? 0
    const reviewsCount = product.reviewCount ?? 0

    return (
      <div
        key={product.id}
        className="tactile-card"
        onClick={() => navigate(`/products/${product.id}`)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${product.id}`)}
      >
        {/* Image wrap with aspect ratio */}
        <div className="tactile-card-image-wrap">
          {imgUrl ? (
            <img src={imgUrl} alt={product.name} loading="lazy" />
          ) : (
            <ProductPlaceholderSvg category={product.category} name={product.name} />
          )}

          {/* Wishlist Heart Icon overlay */}
          <button
            className={`wishlist-btn ${isStarred ? 'active' : ''}`}
            onClick={(e) => toggleWishlist(product.id, e)}
            title="Add to Wishlist"
          >
            {isStarred ? '❤️' : '🤍'}
          </button>
        </div>

        {/* Card Body */}
        <div className="tactile-card-body">
          {totalStock === 0 ? (
            <span className="badge badge-danger" style={{ alignSelf: 'flex-start', marginBottom: 6 }}>Sold Out</span>
          ) : (
            product.storeName && (
              <span className="tactile-card-store">🏫 {product.storeName}</span>
            )
          )}

          <h3 className="tactile-card-title">{product.name}</h3>

          {/* Star Rating Display */}
          <div className="tactile-card-rating">
            {renderStars(ratingAvg)}
            <span style={{ marginLeft: 4, fontWeight: 600 }}>
              {ratingAvg > 0 ? ratingAvg.toFixed(1) : 'No reviews'}
            </span>
            {reviewsCount > 0 && (
              <span style={{ color: 'var(--text-muted)' }}>({reviewsCount})</span>
            )}
          </div>

          {/* Dynamic demand badge — only shown when there's a meaningful price adjustment */}
          {product.topDriverBadge && (
            <div title={product.demandNote ?? undefined} style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: 'linear-gradient(135deg, rgba(255,56,92,0.08), rgba(255,150,50,0.08))',
              border: '1px solid rgba(255,56,92,0.2)',
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              color: 'var(--primary)',
              marginTop: 4,
              cursor: 'help',
              maxWidth: '100%',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {product.topDriverBadge}
            </div>
          )}

          <div className="tactile-card-footer">
            <div className="tactile-card-price">
              {/* Show dynamic price if available, silently fall back to basePrice */}
              <span className="tactile-card-amount">
                {formatCurrency(product.dynamicPrice ?? product.basePrice)}
              </span>
              <span className="tactile-card-unit">/ unit</span>
            </div>
            
            <button
              className="btn btn-primary btn-sm"
              style={{
                padding: '8px 14px',
                borderRadius: 'var(--radius-sm)',
                fontWeight: 600
              }}
              onClick={(e) => {
                e.stopPropagation()
                navigate(`/products/${product.id}`)
              }}
            >
              Rent Now →
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Filter recommendations to avoid duplicate items currently displayed
  const recommendations = suggestions
    .filter(p => !filteredProducts.some(fp => fp.id === p.id))
    .slice(0, 3)

  return (
    <AppShell requiredRole="CUSTOMER">
      {/* Search Bar & Header Section — padded to prevent clipping */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 12px',
        borderBottom: '1px solid var(--border)',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16,
        boxSizing: 'border-box'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '1.8rem', letterSpacing: '-0.02em', margin: 0 }}>Browse Gear</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Access premium items locally on RentLo</p>
        </div>

        {/* Global Search with inset icon */}
        <div style={{
          position: 'relative',
          width: '100%',
          maxWidth: 400,
          display: 'flex',
          alignItems: 'center'
        }}>
          <span style={{ position: 'absolute', left: 14, color: 'var(--text-muted)', pointerEvents: 'none' }}>🔍</span>
          <input
            type="text"
            placeholder="What are you looking for?"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setCategory(''); setPage(0) } }}
            style={{
              width: '100%',
              padding: '12px 16px 12px 40px',
              borderRadius: 'var(--radius)',
              border: '1px solid var(--border-input)',
              backgroundColor: 'var(--bg-surface)',
              fontFamily: 'inherit',
              fontSize: '0.9rem',
              boxShadow: 'var(--shadow-sm)',
              outline: 'none'
            }}
          />
          {searchInput && (
            <button
              onClick={() => { setSearchInput(''); setSearch(''); setPage(0) }}
              style={{
                position: 'absolute',
                right: 14,
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '1rem'
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* View Cart Button (fully styled with no edge cutoffs) */}
        <button
          onClick={() => navigate('/cart')}
          className="btn btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 'var(--radius)', marginRight: 4 }}
        >
          🛒 View Cart
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '30px', alignItems: 'flex-start' }}>
        {/* Collapsible Filter Rail */}
        <aside style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Category Section */}
          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
            <div className="filter-group-title">
              <span>Categories</span>
              {(category || storeFilter) && (
                <button
                  style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 600, fontSize: '0.75rem', cursor: 'pointer', padding: 0 }}
                  onClick={() => { setCategory(''); setStoreFilter(''); setPage(0) }}
                >
                  Clear All
                </button>
              )}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {[
                { label: '💻 Electronics', val: 'Electronics' },
                { label: '🛋️ Furniture', val: 'Furniture' },
                { label: '📷 Photography', val: 'Photography' },
                { label: '⚽ Sports', val: 'Sports' },
                { label: '🚗 Vehicles', val: 'Vehicles' },
                { label: '🔧 Tools', val: 'Tools' }
              ].map((cat) => {
                const isSelected = category === cat.val
                return (
                  <div
                    key={cat.val}
                    onClick={() => { setCategory(isSelected ? '' : cat.val); setStoreFilter(''); setPage(0) }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 'var(--radius-sm)',
                      background: isSelected ? 'var(--primary-light)' : 'transparent',
                      color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      fontSize: '0.85rem'
                    }}
                  >
                    <span>{cat.label}</span>
                    <span style={{ fontSize: '0.75rem', opacity: 0.65 }}>({catCounts[cat.val] ?? 0})</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Stores Filter */}
          {stores.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 18, boxShadow: 'var(--shadow-sm)' }}>
              <div className="filter-group-title">Stores</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                <div
                  onClick={() => setStoreFilter('')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '8px 10px',
                    borderRadius: 'var(--radius-sm)',
                    background: storeFilter === '' ? 'var(--primary-light)' : 'transparent',
                    color: storeFilter === '' ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: storeFilter === '' ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.85rem'
                  }}
                >
                  🏫 All Stores
                </div>
                {stores.map((s) => {
                  const isSelected = storeFilter === s.id
                  return (
                    <div
                      key={s.id}
                      onClick={() => setStoreFilter(isSelected ? '' : s.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '8px 10px',
                        borderRadius: 'var(--radius-sm)',
                        background: isSelected ? 'var(--primary-light)' : 'transparent',
                        color: isSelected ? 'var(--primary)' : 'var(--text-secondary)',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      📦 {s.name}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </aside>

        {/* Product Grid */}
        <div style={{ minWidth: 0 }}>
          {loading && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: 24 }}>
              {[1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} style={{
                  background: '#fff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  height: 340,
                  animation: 'pulse 1.5s infinite ease-in-out'
                }} />
              ))}
            </div>
          )}

          {error && (
            <div className="alert alert-danger" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{error}</span>
              <button className="btn btn-sm btn-secondary" onClick={() => void fetchProducts()}>Retry</button>
            </div>
          )}

          {!loading && filteredProducts.length === 0 && (
            <div className="empty-state" style={{ padding: '80px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '3rem', marginBottom: 12 }}>📦</div>
              <h3 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.25rem', marginBottom: 8 }}>No listings found</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: 20 }}>Try refining your categories or search query.</p>
              <button className="btn btn-primary" onClick={() => { setCategory(''); setSearch(''); setSearchInput(''); setStoreFilter(''); setPage(0) }}>
                Reset All Filters
              </button>
            </div>
          )}

          {/* Dynamic Grid: caps container width and centers items when counts are sparse (1 or 2 items) */}
          {!loading && filteredProducts.length > 0 && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 24,
              maxWidth: filteredProducts.length === 1 ? '300px' : filteredProducts.length === 2 ? '620px' : 'none',
              margin: filteredProducts.length <= 2 ? '0 auto' : '0'
            }}>
              {filteredProducts.map((product) => renderProductCard(product))}
            </div>
          )}

          {/* Designed recommendations module for low result count views */}
          {!loading && filteredProducts.length > 0 && filteredProducts.length <= 2 && recommendations.length > 0 && (
            <div style={{
              marginTop: '48px',
              borderTop: '1px solid var(--border)',
              paddingTop: '32px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <span style={{ fontSize: '1.4rem' }}>💡</span>
                <h4 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.1rem', fontWeight: 800, margin: 0 }}>
                  Explore other categories too!
                </h4>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: 20 }}>
                We've only got a couple of items under this filter view right now. Explore these trending items from other categories:
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
                {recommendations.map((product) => renderProductCard(product))}
              </div>
            </div>
          )}

          <div style={{ marginTop: 40 }}>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
