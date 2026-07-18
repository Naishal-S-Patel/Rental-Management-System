import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { DefaultBadge } from '@/components/StatusBadge'
import { pricelistApi, rentalPeriodApi } from '@/api/pricelistApi'
import { Modal } from '@/components/Modal'
import { formatCurrency } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { PricelistResponse } from '@/types/pricelist'
import type { RentalPeriodResponse, DurationUnit, PricelistItemRequest } from '@/types/pricelist'

const DURATION_UNITS: DurationUnit[] = ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']

export function AdminPricelistPage() {
  const [pricelists, setPricelists] = useState<PricelistResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  const [plModal, setPlModal] = useState(false)
  const [plName, setPlName] = useState('')
  const [plDefault, setPlDefault] = useState(false)
  const [savingPl, setSavingPl] = useState(false)

  const [itemModal, setItemModal] = useState(false)
  const [selectedPl, setSelectedPl] = useState('')
  const [itemUnit, setItemUnit] = useState<DurationUnit>('DAY')
  const [itemPrice, setItemPrice] = useState('')
  const [savingItem, setSavingItem] = useState(false)

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

  const handleAddItem = async () => {
    setSavingItem(true)
    try {
      await pricelistApi.addItem(selectedPl, { durationUnit: itemUnit, unitPrice: Number(itemPrice) })
      fetchAll()
      setItemModal(false)
      setItemPrice('')
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Pricelists</h1>
          <div className="page-subtitle">Manage pricing rules for your products</div>
        </div>
        <button className="btn btn-primary" onClick={() => setPlModal(true)}>
          <i className="fa-solid fa-plus"></i> New Pricelist
        </button>
      </div>

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
              <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedPl(pl.id); setItemModal(true) }}>
                <i className="fa-solid fa-plus"></i> Add Rule
              </button>
              <button
                className="btn btn-secondary btn-sm"
                style={{ cursor: 'pointer' }}
                onClick={() => setExpanded(expanded === pl.id ? null : pl.id)}
              >
                <i className={`fa-solid ${expanded === pl.id ? 'fa-chevron-up' : 'fa-chevron-down'}`}></i>
              </button>
              {!pl.isDefault && (
                <button className="btn btn-danger btn-sm" onClick={() => void handleDeletePl(pl.id, pl.isDefault)}>
                  <i className="fa-solid fa-trash"></i>
                </button>
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
                        <th>Unit Price</th>
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
                          <td style={{ fontWeight: 600 }}>{formatCurrency(item.unitPrice)}</td>
                          <td>
                            <button className="btn btn-danger btn-sm" onClick={() => void handleDeleteItem(pl.id, item.id)}>
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
              <button className="btn btn-primary" disabled={savingItem || !itemPrice} onClick={() => void handleAddItem()}>
                {savingItem ? 'Adding…' : 'Add Rule'}
              </button>
            </>
          }
        >
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
          <span className="form-hint">Leave product/variant blank to apply to all products as a default rate.</span>
        </Modal>
      )}
    </AppShell>
  )
}
