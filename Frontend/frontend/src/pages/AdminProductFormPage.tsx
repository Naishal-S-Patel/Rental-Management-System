import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { productApi } from '@/api/productApi'
import { Modal } from '@/components/Modal'
import { getErrorMessage } from '@/lib/errorMessage'
import type { ProductResponse, ProductVariantResponse, AttributeTypeResponse } from '@/types/product'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function AdminProductFormPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()
  const isEdit = !!id

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState('')
  const [basePrice, setBasePrice] = useState('')
  const [depositAmount, setDepositAmount] = useState('')
  const [active, setActive] = useState(true)
  const [product, setProduct] = useState<ProductResponse | null>(null)
  const [attributes, setAttributes] = useState<AttributeTypeResponse[]>([])
  const [tab, setTab] = useState<'basic' | 'images' | 'variants'>('basic')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving] = useState(false)
  const [imgUploading, setImgUploading] = useState(false)
  const imgInputRef = useRef<HTMLInputElement>(null)

  // Variant modal
  const [variantModal, setVariantModal] = useState(false)
  const [variantSku, setVariantSku] = useState('')
  const [variantQty, setVariantQty] = useState('1')
  const [variantAttrs, setVariantAttrs] = useState<Record<string, string>>({})
  const [savingVariant, setSavingVariant] = useState(false)

  useEffect(() => {
    productApi.listAttributes().then(({ data }) => setAttributes(data)).catch(() => {})
    if (isEdit && id) {
      productApi.get(id)
        .then(({ data: p }) => {
          setProduct(p)
          setName(p.name)
          setDescription(p.description)
          setCategory(p.category)
          setBasePrice(String(p.basePrice))
          setDepositAmount(String(p.securityDepositAmount))
          setActive(p.active)
        })
        .catch(() => toast.error('Failed to load product.'))
        .finally(() => setLoading(false))
    }
  }, [id, isEdit])

  const handleSaveBasic = async () => {
    setSaving(true)
    try {
      const body = { name, description, category, basePrice: Number(basePrice), securityDepositAmount: Number(depositAmount), active }
      if (isEdit && id) {
        const { data } = await productApi.update(id, body)
        setProduct(data)
        toast.success('Product updated.')
      } else {
        const { data } = await productApi.create(body)
        setProduct(data)
        navigate(`/admin/products/${data.id}/edit`, { replace: true })
        toast.success('Product created.')
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save product.'))
    } finally {
      setSaving(false)
    }
  }

  const handleImageUpload = async (file: File) => {
    if (!product) return
    setImgUploading(true)
    try {
      const { data } = await productApi.uploadImage(product.id, file)
      setProduct(data)
      toast.success('Image uploaded.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Upload failed.'))
    } finally {
      setImgUploading(false)
    }
  }

  const handleSaveVariant = async () => {
    if (!product) return
    setSavingVariant(true)
    try {
      await productApi.createVariant(product.id, {
        sku: variantSku,
        totalQuantity: Number(variantQty),
        attributeValueIds: Object.values(variantAttrs),
      })
      const { data } = await productApi.get(product.id)
      setProduct(data)
      setVariantModal(false)
      setVariantSku(''); setVariantQty('1'); setVariantAttrs({})
      toast.success('Variant added.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not add variant.'))
    } finally {
      setSavingVariant(false)
    }
  }

  const handleDeleteVariant = async (variantId: string) => {
    if (!product || !confirm('Delete this variant?')) return
    try {
      await productApi.deleteVariant(variantId)
      const { data } = await productApi.get(product.id)
      setProduct(data)
      toast.success('Variant deleted.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not delete variant.'))
    }
  }

  if (loading) return <AppShell requiredRole="ADMIN"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>

  return (
    <AppShell requiredRole="ADMIN">
      <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: 16 }}>
        <Link to="/admin/products">Products</Link> / {isEdit ? product?.name ?? 'Edit' : 'New Product'}
      </div>

      <div className="page-header">
        <h1 className="page-title">{isEdit ? 'Edit Product' : 'New Product'}</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.875rem' }}>
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
            Active
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        {(['basic', 'images', 'variants'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: '8px 16px', border: 'none', borderBottom: `2px solid ${tab === t ? 'var(--primary)' : 'transparent'}`, background: 'none', color: tab === t ? 'var(--primary)' : 'var(--text-secondary)', fontWeight: tab === t ? 600 : 400, cursor: 'pointer', fontSize: '0.875rem', textTransform: 'capitalize' }}>
            {t === 'basic' ? 'Basic Info' : t.charAt(0).toUpperCase() + t.slice(1)}
            {t === 'variants' && !product && <span className="badge badge-neutral" style={{ marginLeft: 6 }}>Save first</span>}
          </button>
        ))}
      </div>

      {/* Basic Tab */}
      {tab === 'basic' && (
        <div className="card">
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Product Name <span style={{ color: 'var(--status-danger)' }}>*</span></label>
                <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Sony A7 III Camera" />
              </div>
              <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                <label className="form-label">Description</label>
                <textarea className="form-textarea" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Product description…" rows={4} />
              </div>
              <div className="form-group">
                <label className="form-label">Category</label>
                <input className="form-input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Electronics, Furniture…" />
              </div>
              <div className="form-group">
                <label className="form-label">Base Price (INR)</label>
                <input type="number" className="form-input" value={basePrice} onChange={(e) => setBasePrice(e.target.value)} min="0" step="0.01" placeholder="0.00" />
              </div>
              <div className="form-group">
                <label className="form-label">Security Deposit (INR)</label>
                <input type="number" className="form-input" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} min="0" step="0.01" placeholder="0.00" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button className="btn btn-primary" disabled={saving || !name} onClick={() => void handleSaveBasic()}>
                {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/admin/products')}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Images Tab */}
      {tab === 'images' && (
        <div className="card">
          <div className="card-body">
            {!product && <div className="alert alert-warning">Save the product first before uploading images.</div>}
            {product && (
              <>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
                  {product.images.map((img) => {
                    const src = img.url || `${BASE_URL}/api/files/${img.fileId}`
                    return (
                      <div key={img.id} style={{ width: 120, height: 90, border: '1px solid var(--border)', overflow: 'hidden', background: 'var(--bg-subtle)' }}>
                        <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    )
                  })}
                  {product.images.length === 0 && (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>No images yet.</div>
                  )}
                </div>
                <input ref={imgInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleImageUpload(f) }} />
                <button className="btn btn-secondary" disabled={imgUploading} onClick={() => imgInputRef.current?.click()}>
                  <i className="fa-solid fa-upload"></i> {imgUploading ? 'Uploading…' : 'Upload Image'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Variants Tab */}
      {tab === 'variants' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Variants</span>
            {product && (
              <button className="btn btn-secondary btn-sm" onClick={() => setVariantModal(true)}>
                <i className="fa-solid fa-plus"></i> Add Variant
              </button>
            )}
          </div>
          <div className="card-body">
            {!product && <div className="alert alert-warning">Save the product first before adding variants.</div>}
            {product && (product.variants?.length ?? 0) === 0 && (
              <div className="empty-state" style={{ padding: 24 }}>
                <p>No variants. Add one or leave empty for a product without variants.</p>
              </div>
            )}
            {product && (product.variants?.length ?? 0) > 0 && (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>SKU</th><th>Attributes</th><th>Stock</th><th>Available</th><th></th></tr></thead>
                  <tbody>
                    {product.variants.map((v) => (
                      <tr key={v.id}>
                        <td style={{ fontWeight: 600 }}>{v.sku}</td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {v.attributeValues.map((av) => `${av.attributeTypeName}: ${av.value}`).join(', ') || '—'}
                        </td>
                        <td>{v.totalQuantity}</td>
                        <td>{v.availableQuantity ?? v.totalQuantity}</td>
                        <td>
                          <button className="btn btn-danger btn-sm" onClick={() => void handleDeleteVariant(v.id)}>
                            <i className="fa-solid fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Variant Modal */}
      {variantModal && (
        <Modal title="Add Variant" onClose={() => setVariantModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setVariantModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={savingVariant || !variantSku} onClick={() => void handleSaveVariant()}>
                {savingVariant ? 'Adding…' : 'Add Variant'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">SKU <span style={{ color: 'var(--status-danger)' }}>*</span></label>
            <input className="form-input" value={variantSku} onChange={(e) => setVariantSku(e.target.value)} placeholder="e.g. CAMERA-BLUE-M" />
          </div>
          <div className="form-group">
            <label className="form-label">Stock Quantity</label>
            <input type="number" className="form-input" value={variantQty} onChange={(e) => setVariantQty(e.target.value)} min="1" />
          </div>
          {attributes.map((attr) => (
            <div className="form-group" key={attr.id}>
              <label className="form-label">{attr.name}</label>
              <select className="form-select" value={variantAttrs[attr.id] ?? ''} onChange={(e) => setVariantAttrs((p) => ({ ...p, [attr.id]: e.target.value }))}>
                <option value="">-- select --</option>
                {attr.values.map((v) => <option key={v.id} value={v.id}>{v.value}</option>)}
              </select>
            </div>
          ))}
        </Modal>
      )}
    </AppShell>
  )
}
