import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
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

  const fetchProducts = () => {
    setLoading(true)
    setError('')
    productApi.list({ search: search || undefined, page, size: 20 })
      .then(({ data }) => { setProducts(data.content); setTotalPages(data.totalPages) })
      .catch((err) => setError(getErrorMessage(err, 'Failed to load products.')))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchProducts() }, [search, page])

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
      <div className="page-header">
        <div>
          <h1 className="page-title">Products</h1>
          <div className="page-subtitle">Manage your store catalog</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/admin/products/new')}>
          <i className="fa-solid fa-plus"></i> Add Product
        </button>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, alignItems: 'center' }}>
        <div className="search-bar" style={{ maxWidth: 300 }}>
          <input type="text" placeholder="Search products…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { setSearch(searchInput); setPage(0) } }} />
          <button onClick={() => { setSearch(searchInput); setPage(0) }}><i className="fa-solid fa-magnifying-glass"></i></button>
        </div>
      </div>

      {loading && <div className="loading-overlay"><span className="spinner"></span></div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {!loading && products.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-tags"></i>
          <p>No products yet. Add your first product to get started.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate('/admin/products/new')}>
            Add Product
          </button>
        </div>
      )}

      {!loading && products.length > 0 && (
        <>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Image</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Base Price</th>
                  <th>Deposit</th>
                  <th>Variants</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => {
                  const imgUrl = p.images?.[0]?.url || (p.images?.[0]?.fileId ? `${BASE_URL}/api/files/${p.images[0].fileId}` : null)
                  return (
                    <tr key={p.id}>
                      <td style={{ width: 52, padding: '6px 12px' }}>
                        {imgUrl
                          ? <img src={imgUrl} alt={p.name} style={{ width: 40, height: 32, objectFit: 'cover', border: '1px solid var(--border)' }} />
                          : <div style={{ width: 40, height: 32, background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}><i className="fa-solid fa-image"></i></div>
                        }
                      </td>
                      <td style={{ fontWeight: 600 }}>{p.name}</td>
                      <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{p.category}</td>
                      <td>{formatCurrency(p.basePrice)}</td>
                      <td>{formatCurrency(p.securityDepositAmount)}</td>
                      <td>{p.variants?.length ?? 0}</td>
                      <td><ActiveBadge active={p.active} /></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/admin/products/${p.id}/edit`)}>
                            <i className="fa-solid fa-pen"></i>
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => void handleDelete(p.id)}>
                            <i className="fa-solid fa-trash"></i>
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
    </AppShell>
  )
}
