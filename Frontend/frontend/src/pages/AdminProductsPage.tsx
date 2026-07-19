import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { ActiveBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import { productApi } from '@/api/productApi'
import { formatCurrency } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { ProductResponse } from '@/types/product'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function AdminProductsPage() {
  const navigate = useNavigate()
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')

  const fetchProducts = () => {
    setLoading(true)
    setError('')
    productApi.list({
      mine: true,
      search: search || undefined,
      category: selectedCategory || undefined,
      page,
      size: 20
    })
      .then(({ data }) => { setProducts(data.content); setTotalPages(data.totalPages) })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load products.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [search, page, selectedCategory])

  const handleDelete = async (id: string) => {
    if (!confirm('Soft-delete this product?')) return
    try {
      await productApi.remove(id)
      toast.success('Product deactivated.')
      fetchProducts()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete product.'))
    }
  }

  return (
    <AppShell requiredRole="ADMIN">
      <ControlPanel
        breadcrumbs={[{ label: 'Products' }]}
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="search-bar" style={{ maxWidth: 260 }}>
              <input type="text" placeholder="Search products…" value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0) } }}
              />
              <button onClick={() => { setSearch(searchInput); setPage(0) }}>🔍</button>
            </div>

            <select className="form-select" style={{ width: 'auto', minWidth: 130 }}
              value={selectedCategory} onChange={(e) => { setSelectedCategory(e.target.value); setPage(0) }}>
              <option value="">All Categories</option>
              {['Electronics', 'Furniture', 'Photography', 'Sports', 'Vehicles', 'Tools', 'Camping'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button className="btn btn-primary" onClick={() => navigate('/admin/products/new')}>
              + New
            </button>
          </div>
        }
      />

      <div className="o-content">
        {loading && <div className="loading-overlay"><span className="spinner"></span></div>}
        {error && <div className="alert alert-danger mt-3">{error}</div>}

        {!loading && products.length === 0 && (
          <div className="empty-state mt-3">
            <p>No products yet. Add your first product to get started.</p>
            <button className="btn btn-primary mt-2" onClick={() => navigate('/admin/products/new')}>
              + Add Product
            </button>
          </div>
        )}

        {!loading && products.length > 0 && (
          <>
            <div className="table-wrap mt-3">
              <table>
                <thead>
                  <tr>
                    <th style={{ width: 52 }}></th>
                    <th>Name</th>
                    <th>Category</th>
                    <th className="text-right">Base Price</th>
                    <th className="text-right">Deposit</th>
                    <th className="text-right">Variants</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const imgUrl = p.images?.[0]?.url
                      ? (p.images[0].url.startsWith('http') ? p.images[0].url : `${BASE_URL}${p.images[0].url}`)
                      : (p.images?.[0]?.fileId ? `${BASE_URL}/api/files/${p.images[0].fileId}` : null)
                    return (
                      <tr key={p.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                        <td style={{ padding: '6px 12px' }}>
                          {imgUrl
                            ? <img src={imgUrl} alt={p.name} style={{ width: 40, height: 32, objectFit: 'cover', border: '1px solid var(--border)' }} />
                            : <div style={{ width: 40, height: 32, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem' }}>IMG</div>
                          }
                        </td>
                        <td style={{ fontWeight: 600 }}>{p.name}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{p.category}</td>
                        <td className="text-right">{formatCurrency(p.basePrice)}</td>
                        <td className="text-right">{formatCurrency(p.securityDepositAmount)}</td>
                        <td className="text-right">{p.variants?.length ?? 0}</td>
                        <td><ActiveBadge active={p.active} /></td>
                        <td onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                              Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => void handleDelete(p.id)}>
                              ×
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}
      </div>
    </AppShell>
  )
}
