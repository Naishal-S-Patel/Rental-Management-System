import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { AppShell } from '@/components/AppShell'
import { Pagination } from '@/components/Pagination'
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

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const { data } = await productApi.list({ search: search || undefined, category: category || undefined, page, size: 12 })
      setProducts(data.content)
      setTotalPages(data.totalPages)
      // Extract unique stores
      const storeMap = new Map<string, string>()
      data.content.forEach((p) => {
        if (p.adminId && p.storeName) storeMap.set(p.adminId, p.storeName)
      })
      setStores(Array.from(storeMap.entries()).map(([id, name]) => ({ id, name })))
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load products.'))
    } finally {
      setLoading(false)
    }
  }, [search, category, page])

  useEffect(() => { void fetchProducts() }, [fetchProducts])

  const filteredProducts = storeFilter
    ? products.filter((p) => p.adminId === storeFilter)
    : products

  const getImageUrl = (p: ProductResponse) => {
    const img = p.images?.[0]
    if (!img) return null
    return img.url || `${BASE_URL}/api/files/${img.fileId}`
  }

  return (
    <AppShell requiredRole="CUSTOMER">
      {/* Top bar */}
      <div className="top-bar">
        <div style={{ fontWeight: 600, fontSize: '1rem' }}>Browse Products</div>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search products…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0) } }}
          />
          <button onClick={() => { setSearch(searchInput); setPage(0) }}>
            <i className="fa-solid fa-magnifying-glass"></i>
          </button>
        </div>
        <button
          onClick={() => navigate('/cart')}
          className="btn btn-secondary"
        >
          <i className="fa-solid fa-cart-shopping"></i>
          Cart
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start' }}>
        {/* Filter Rail */}
        <div className="filter-rail">
          <div className="card">
            <div className="card-header" style={{ padding: '10px 12px' }}>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600 }}>Filters</span>
              {(category || storeFilter) && (
                <button
                  className="btn btn-sm"
                  style={{ padding: '2px 8px', fontSize: '0.7rem' }}
                  onClick={() => { setCategory(''); setStoreFilter(''); setPage(0) }}
                >
                  Clear
                </button>
              )}
            </div>
            <div className="card-body" style={{ padding: '10px 12px' }}>
              <div className="filter-section">
                <div className="filter-section-title">Category</div>
                {['Electronics', 'Furniture', 'Photography', 'Sports', 'Vehicles', 'Tools'].map((c) => (
                  <label key={c} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input
                      type="radio"
                      name="category"
                      checked={category === c}
                      onChange={() => { setCategory(category === c ? '' : c); setPage(0) }}
                    />
                    {c}
                  </label>
                ))}
              </div>

              {stores.length > 0 && (
                <div className="filter-section" style={{ borderBottom: 'none' }}>
                  <div className="filter-section-title">Store</div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: '0.8125rem', cursor: 'pointer' }}>
                    <input type="radio" name="store" checked={storeFilter === ''} onChange={() => setStoreFilter('')} />
                    All stores
                  </label>
                  {stores.map((s) => (
                    <label key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 0', fontSize: '0.8125rem', cursor: 'pointer' }}>
                      <input type="radio" name="store" checked={storeFilter === s.id} onChange={() => setStoreFilter(s.id)} />
                      {s.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading && (
            <div className="loading-overlay"><span className="spinner"></span></div>
          )}
          {error && <div className="alert alert-danger">{error}</div>}
          {!loading && filteredProducts.length === 0 && (
            <div className="empty-state">
              <i className="fa-solid fa-box-open"></i>
              <p>No products found. Try a different search or filter.</p>
            </div>
          )}

          {!loading && filteredProducts.length > 0 && (
            <div className="product-grid">
              {filteredProducts.map((product) => {
                const imgUrl = getImageUrl(product)
                const hasVariants = product.variants && product.variants.length > 0
                const totalStock = hasVariants
                  ? product.variants.reduce((s, v) => s + (v.availableQuantity ?? 0), 0)
                  : 999
                return (
                  <div
                    key={product.id}
                    className="product-card"
                    onClick={() => navigate(`/products/${product.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && navigate(`/products/${product.id}`)}
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt={product.name} className="product-card-img" />
                    ) : (
                      <div className="product-card-img-placeholder">
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                    <div className="product-card-body">
                      {totalStock === 0 && (
                        <span className="badge badge-danger" style={{ marginBottom: 4 }}>Out of Stock</span>
                      )}
                      <div className="product-card-name">{product.name}</div>
                      <div className="product-card-price">{formatCurrency(product.basePrice)} <span style={{ fontWeight: 400, fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ unit</span></div>
                      {product.storeName && (
                        <div className="product-card-store">
                          <i className="fa-solid fa-store" style={{ marginRight: 3 }}></i>
                          {product.storeName}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>
    </AppShell>
  )
}
