import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { DefaultBadge } from '@/components/StatusBadge'
import { pricelistApi } from '@/api/pricelistApi'
import { productApi } from '@/api/productApi'
import { Modal } from '@/components/Modal'
import { formatCurrency } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { PricelistResponse, DurationUnit } from '@/types/pricelist'
import type { ProductResponse } from '@/types/product'

const DURATION_UNITS: DurationUnit[] = ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']

export function AdminPricelistPage() {
  const [pricelists, setPricelists] = useState<PricelistResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [plModal, setPlModal] = useState(false)
  const [plName, setPlName] = useState('')
  const [plDefault, setPlDefault] = useState(false)
  const [savingPl, setSavingPl] = useState(false)

  // Item modal details
  const [itemModal, setItemModal] = useState(false)
  const [selectedPl, setSelectedPl] = useState('')
  const [itemUnit, setItemUnit] = useState<DurationUnit>('DAY')
  const [itemPrice, setItemPrice] = useState('')
  const [savingItem, setSavingItem] = useState(false)

  // Product selection
  const [products, setProducts] = useState<ProductResponse[]>([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [selectedVariantId, setSelectedVariantId] = useState('')

  const fetchAll = () => {
    pricelistApi.list()
      .then(({ data }) => setPricelists(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAll() }, [])

  const handleCreatePl = async () => {
    setSavingPl(true)
    try {
      await pricelistApi.create({ name: plName, isDefault: plDefault })
      fetchAll()
      setPlModal(false)
      setPlName(''); setPlDefault(false)
      toast.success('Pricelist created.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create pricelist.'))
    } finally {
      setSavingPl(false)
    }
  }

  const handleDeletePl = async (id: string, isDefault: boolean) => {
    if (isDefault) { toast.error('Cannot delete the default pricelist.'); return }
    if (!confirm('Delete this pricelist?')) return
    try {
      await pricelistApi.remove(id)
      fetchAll()
      toast.success('Pricelist deleted.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete pricelist.'))
    }
  }

  const openItemModal = async (plId: string) => {
    setSelectedPl(plId)
    setItemPrice('')
    setSelectedProductId('')
    setSelectedVariantId('')
    setItemModal(true)
    try {
      const { data } = await productApi.list({ mine: true, size: 100 })
      setProducts(data.content)
      if (data.content.length > 0) {
        const firstProduct = data.content[0]
        setSelectedProductId(firstProduct.id)
        if (firstProduct.variants && firstProduct.variants.length > 0) {
          setSelectedVariantId(firstProduct.variants[0].id)
        }
      }
    } catch (err) {
      toast.error('Failed to load products for pricing.')
    }
  }

  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId)
    const prod = products.find((p) => p.id === productId)
    if (prod && prod.variants && prod.variants.length > 0) {
      setSelectedVariantId(prod.variants[0].id)
    } else {
      setSelectedVariantId('')
    }
  }

  const handleAddItem = async () => {
    if (!selectedVariantId) {
      toast.error('Please select a product variant to apply the price rule.')
      return
    }
    setSavingItem(true)
    try {
      await pricelistApi.addItem(selectedPl, {
        productVariantId: selectedVariantId,
        durationUnit: itemUnit,
        unitPrice: Number(itemPrice),
      })
      fetchAll()
      setItemModal(false)
      setItemPrice('')
      setSelectedProductId('')
      setSelectedVariantId('')
      toast.success('Rule added.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add rule.'))
    } finally {
      setSavingItem(false)
    }
  }

  const handleDeleteItem = async (plId: string, itemId: string) => {
    try {
      await pricelistApi.removeItem(plId, itemId)
      fetchAll()
      toast.success('Rule removed.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed.'))
    }
  }

  return (
    <AppShell requiredRole="ADMIN">
      <ControlPanel
        breadcrumbs={[{ label: 'Pricing' }]}
        actions={<button className="btn btn-primary" onClick={() => setPlModal(true)}>+ New Pricelist</button>}
      />

      <div className="o-content">
        {loading && <div className="loading-overlay"><span className="spinner"></span></div>}

        {!loading && pricelists.map((pl) => (
          <div key={pl.id} className="card" style={{ marginBottom: 12 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className="card-title">{pl.name}</span>
                {pl.isDefault && <DefaultBadge />}
                {pl.validFrom && (
                  <span className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>
                    {pl.validFrom} — {pl.validTo ?? 'ongoing'}
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" onClick={() => void openItemModal(pl.id)}>
                  + Add Rule
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => setExpanded(expanded === pl.id ? null : pl.id)}>
                  {expanded === pl.id ? '▲' : '▼'}
                </button>
                {!pl.isDefault && (
                  <button className="btn btn-danger btn-sm" onClick={() => void handleDeletePl(pl.id, pl.isDefault)}>×</button>
                )}
              </div>
            </div>

            {expanded === pl.id && (
              <div>
                {pl.items.length === 0 && (
                  <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No rules. Add one to start pricing products.</div>
                )}
                {pl.items.length > 0 && (
                  <div className="table-wrap" style={{ border: 'none' }}>
                    <table>
                      <thead>
                        <tr>
                          <th>Product / Variant</th>
                          <th>Duration Unit</th>
                          <th className="text-right">Unit Price</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {pl.items.map((item) => (
                          <tr key={item.id}>
                            <td style={{ fontSize: '0.8125rem' }}>
                              {item.productName ?? 'All products'}{item.variantSku ? ` — ${item.variantSku}` : ''}
                            </td>
                            <td><span className="badge badge-neutral">{item.durationUnit}</span></td>
                            <td className="text-right" style={{ fontWeight: 600 }}>{formatCurrency(item.unitPrice)}</td>
                            <td>
                              <button className="btn btn-danger btn-sm" onClick={() => void handleDeleteItem(pl.id, item.id)}>×</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {plModal && (
          <Modal title="New Pricelist" onClose={() => setPlModal(false)}
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => setPlModal(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={savingPl || !plName} onClick={() => void handleCreatePl()}>
                  {savingPl ? 'Creating…' : 'Create'}
                </button>
              </>
            }
          >
            <div className="form-group">
              <label className="form-label">Name <span style={{ color: 'var(--status-danger)' }}>*</span></label>
              <input className="form-input" value={plName} onChange={(e) => setPlName(e.target.value)} placeholder="e.g. Summer 2025, Default" />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={plDefault} onChange={(e) => setPlDefault(e.target.checked)} />
              Set as default pricelist
            </label>
          </Modal>
        )}

        {itemModal && (
          <Modal title={`Add Rule — ${pricelists.find((p) => p.id === selectedPl)?.name ?? ''}`} onClose={() => setItemModal(false)}
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => setItemModal(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={savingItem || !itemPrice || !selectedVariantId} onClick={() => void handleAddItem()}>
                  {savingItem ? 'Adding…' : 'Add Rule'}
                </button>
              </>
            }
          >
            <div className="form-group">
              <label className="form-label">Product</label>
              <select className="form-select" value={selectedProductId} onChange={(e) => handleProductChange(e.target.value)}>
                <option value="">-- select product --</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {selectedProductId && (() => {
              const prod = products.find((p) => p.id === selectedProductId)
              const variants = prod?.variants ?? []
              return (
                <div className="form-group">
                  <label className="form-label">Variant</label>
                  <select className="form-select" value={selectedVariantId} onChange={(e) => setSelectedVariantId(e.target.value)}>
                    <option value="">-- select variant --</option>
                    {variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.sku} ({v.attributeValues.map((av) => `${av.attributeTypeName}: ${av.value}`).join(', ') || 'Base Variant'})
                      </option>
                    ))}
                  </select>
                </div>
              )
            })()}

            <div className="form-group">
              <label className="form-label">Duration Unit</label>
              <select className="form-select" value={itemUnit} onChange={(e) => setItemUnit(e.target.value as DurationUnit)}>
                {DURATION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price (INR)</label>
              <input type="number" className="form-input" value={itemPrice} onChange={(e) => setItemPrice(e.target.value)} min="0" step="0.01" placeholder="0.00" />
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  )
}
