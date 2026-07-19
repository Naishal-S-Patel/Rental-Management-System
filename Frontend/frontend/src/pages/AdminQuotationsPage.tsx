import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { QuotationStatusBadge } from '@/components/StatusBadge'
import { Pagination } from '@/components/Pagination'
import { quotationApi } from '@/api/quotationApi'
import { userApi } from '@/api/userApi'
import { productApi } from '@/api/productApi'
import { Modal } from '@/components/Modal'
import { formatCurrency, formatDate } from '@/lib/formatters'
import { getErrorMessage } from '@/lib/errorMessage'
import type { QuotationResponse, QuotationStatus, QuotationTemplateResponse } from '@/types/quotation'
import type { UserResponse } from '@/types/auth'
import type { ProductResponse } from '@/types/product'

const STATUS_TABS: { label: string; value: QuotationStatus | '' }[] = [
  { label: 'All', value: '' },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Sent', value: 'SENT' },
  { label: 'Confirmed', value: 'CONFIRMED' },
  { label: 'Rejected', value: 'REJECTED' },
]

export function AdminQuotationsPage() {
  const navigate = useNavigate()
  const [quotations, setQuotations] = useState<QuotationResponse[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [page, setPage] = useState(0)
  const [statusFilter, setStatusFilter] = useState<QuotationStatus | ''>('')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Creation State
  const [createModal, setCreateModal] = useState(false)
  const [savingQuotation, setSavingQuotation] = useState(false)
  const [customers, setCustomers] = useState<UserResponse[]>([])
  const [templates, setTemplates] = useState<QuotationTemplateResponse[]>([])
  const [products, setProducts] = useState<ProductResponse[]>([])

  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [selectedTemplateId, setSelectedTemplateId] = useState('')
  const [validUntilDate, setValidUntilDate] = useState('')
  const [lines, setLines] = useState<{
    productId: string
    productVariantId: string
    quantity: number
    startDate: string
    endDate: string
  }[]>([])

  const fetchQuotations = () => {
    setLoading(true)
    quotationApi.list({ status: statusFilter || undefined, page, size: 20 })
      .then(({ data }) => { setQuotations(data.content); setTotalPages(data.totalPages) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchQuotations() }, [statusFilter, page])

  const handleConfirm = async (id: string) => {
    setActionLoading(id)
    try {
      const { data: order } = await quotationApi.confirm(id)
      toast.success('Quotation confirmed — order created.')
      navigate(`/admin/orders/${order.id}`)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to confirm.'))
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (id: string) => {
    if (!confirm('Reject this quotation?')) return
    setActionLoading(id)
    try {
      await quotationApi.reject(id)
      toast.success('Quotation rejected.')
      fetchQuotations()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to reject.'))
    } finally {
      setActionLoading(null)
    }
  }

  const openCreateModal = async () => {
    setCreateModal(true)
    setSelectedCustomerId('')
    setSelectedTemplateId('')
    setValidUntilDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    setLines([{
      productId: '',
      productVariantId: '',
      quantity: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }])
    
    try {
      const [custRes, tempRes, prodRes] = await Promise.all([
        userApi.listCustomers(),
        quotationApi.listTemplates(),
        productApi.list({ mine: true, size: 100 })
      ])
      setCustomers(custRes.data)
      setTemplates(tempRes.data)
      setProducts(prodRes.data.content)
    } catch {
      toast.error('Failed to load customers or products.')
    }
  }

  const addLine = () => {
    setLines([...lines, {
      productId: '',
      productVariantId: '',
      quantity: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    }])
  }

  const removeLine = (idx: number) => {
    setLines(lines.filter((_, i) => i !== idx))
  }

  const handleLineChange = (idx: number, field: string, value: any) => {
    const updated = [...lines]
    updated[idx] = { ...updated[idx], [field]: value }
    
    if (field === 'productId') {
      const prod = products.find(p => p.id === value)
      if (prod && prod.variants && prod.variants.length > 0) {
        updated[idx].productVariantId = prod.variants[0].id
      } else {
        updated[idx].productVariantId = ''
      }
    }
    setLines(updated)
  }

  const handleCreateQuotation = async () => {
    if (!selectedCustomerId) {
      toast.error('Please select a customer.')
      return
    }
    if (lines.some(l => !l.productVariantId)) {
      toast.error('Please select a product variant for all lines.')
      return
    }
    setSavingQuotation(true)
    try {
      await quotationApi.create({
        customerId: selectedCustomerId,
        quotationTemplateId: selectedTemplateId ? Number(selectedTemplateId) : undefined,
        validUntil: validUntilDate,
        lines: lines.map(l => ({
          productVariantId: l.productVariantId,
          quantity: l.quantity,
          startDate: l.startDate,
          endDate: l.endDate
        }))
      })
      toast.success('Quotation created successfully.')
      setCreateModal(false)
      fetchQuotations()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create quotation.'))
    } finally {
      setSavingQuotation(false)
    }
  }

  return (
    <AppShell requiredRole="ADMIN">
      <ControlPanel
        breadcrumbs={[{ label: 'Quotations' }]}
        actions={
          <button className="btn btn-primary" onClick={() => void openCreateModal()}>
            + New Quotation
          </button>
        }
      />

      <div className="o-content">
        {/* Status tabs */}
        <div className="o-notebook-tabs mt-3">
          {STATUS_TABS.map((t) => (
            <button key={t.value}
              className={`o-notebook-tab ${statusFilter === t.value ? 'active' : ''}`}
              onClick={() => { setStatusFilter(t.value); setPage(0) }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <div className="loading-overlay"><span className="spinner"></span></div>}

        {!loading && quotations.length === 0 && (
          <div className="empty-state">
            <p>No quotations found.</p>
          </div>
        )}

        {!loading && quotations.length > 0 && (
          <>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Quotation #</th>
                    <th>Customer</th>
                    <th>Valid Until</th>
                    <th>Status</th>
                    <th className="text-right">Total</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {quotations.map((q) => (
                    <tr key={q.id}>
                      <td style={{ fontWeight: 600 }}>#{q.id.slice(0, 8)}</td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{q.customerName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.customerEmail}</div>
                      </td>
                      <td>{formatDate(q.validUntil)}</td>
                      <td><QuotationStatusBadge status={q.status} /></td>
                      <td className="text-right" style={{ fontWeight: 600 }}>{formatCurrency(q.subtotalAmount)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {(q.status === 'DRAFT' || q.status === 'SENT') && (
                            <>
                              <button className="btn btn-primary btn-sm" disabled={actionLoading === q.id} onClick={() => void handleConfirm(q.id)}>
                                Confirm
                              </button>
                              <button className="btn btn-danger btn-sm" disabled={actionLoading === q.id} onClick={() => void handleReject(q.id)}>
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        )}

        {createModal && (
          <Modal
            title="Create New Quotation"
            onClose={() => setCreateModal(false)}
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => setCreateModal(false)}>Cancel</button>
                <button className="btn btn-primary" disabled={savingQuotation} onClick={() => void handleCreateQuotation()}>
                  {savingQuotation ? 'Creating…' : 'Create'}
                </button>
              </>
            }
          >
            <div className="form-group">
              <label className="form-label">Customer <span className="text-danger">*</span></label>
              <select className="form-select" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)}>
                <option value="">-- select customer --</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName} ({c.email})</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Quotation Template</label>
              <select className="form-select" value={selectedTemplateId} onChange={e => setSelectedTemplateId(e.target.value)}>
                <option value="">-- none --</option>
                {templates.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Valid Until <span className="text-danger">*</span></label>
              <input type="date" className="form-input" value={validUntilDate} onChange={e => setValidUntilDate(e.target.value)} />
            </div>

            <hr style={{ margin: '16px 0', borderColor: 'var(--border)' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h4 style={{ margin: 0, fontWeight: 600 }}>Quotation Items</h4>
              <button className="btn btn-secondary btn-sm" onClick={addLine}>+ Add Item</button>
            </div>

            {lines.map((line, idx) => {
              const prod = products.find(p => p.id === line.productId)
              const variants = prod?.variants ?? []

              return (
                <div key={idx} className="card" style={{ padding: 12, marginBottom: 12, border: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    {lines.length > 1 && (
                      <button className="btn btn-danger btn-sm" onClick={() => removeLine(idx)}>Remove</button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Product</label>
                    <select className="form-select" value={line.productId} onChange={e => handleLineChange(idx, 'productId', e.target.value)}>
                      <option value="">-- select product --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  {line.productId && (
                    <div className="form-group">
                      <label className="form-label">Variant</label>
                      <select className="form-select" value={line.productVariantId} onChange={e => handleLineChange(idx, 'productVariantId', e.target.value)}>
                        <option value="">-- select variant --</option>
                        {variants.map(v => (
                          <option key={v.id} value={v.id}>
                            {v.sku} ({v.attributeValues.map(av => `${av.attributeTypeName}: ${av.value}`).join(', ') || 'Base Variant'})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <div className="form-group">
                      <label className="form-label">Qty</label>
                      <input type="number" className="form-input" min={1} value={line.quantity} onChange={e => handleLineChange(idx, 'quantity', Number(e.target.value))} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Start Date</label>
                      <input type="date" className="form-input" value={line.startDate} onChange={e => handleLineChange(idx, 'startDate', e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Date</label>
                      <input type="date" className="form-input" value={line.endDate} onChange={e => handleLineChange(idx, 'endDate', e.target.value)} />
                    </div>
                  </div>
                </div>
              )
            })}
          </Modal>
        )}
      </div>
    </AppShell>
  )
}
