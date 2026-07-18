import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { productApi } from '@/api/productApi'
import { Modal } from '@/components/Modal'
import { getErrorMessage } from '@/lib/errorMessage'
import type { AttributeTypeResponse } from '@/types/product'

export function AdminAttributesPage() {
  const [attrs, setAttrs] = useState<AttributeTypeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)

  // Create type
  const [typeModal, setTypeModal] = useState(false)
  const [typeName, setTypeName] = useState('')
  const [savingType, setSavingType] = useState(false)

  // Add value
  const [valueModal, setValueModal] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState('')
  const [valueText, setValueText] = useState('')
  const [savingValue, setSavingValue] = useState(false)

  const fetchAttrs = () => {
    productApi.listAttributes()
      .then(({ data }) => setAttrs(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchAttrs() }, [])

  const handleCreateType = async () => {
    setSavingType(true)
    try {
      await productApi.createAttributeType({ name: typeName })
      fetchAttrs()
      setTypeModal(false)
      setTypeName('')
      toast.success('Attribute type created.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to create attribute type.'))
    } finally {
      setSavingType(false)
    }
  }

  const handleAddValue = async () => {
    setSavingValue(true)
    try {
      await productApi.createAttributeValue(selectedTypeId, { value: valueText })
      fetchAttrs()
      setValueModal(false)
      setValueText('')
      toast.success('Value added.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to add value.'))
    } finally {
      setSavingValue(false)
    }
  }

  return (
    <AppShell requiredRole="ADMIN">
      <div className="page-header">
        <div>
          <h1 className="page-title">Attributes</h1>
          <div className="page-subtitle">Manage attribute types and values for your products</div>
        </div>
        <button className="btn btn-primary" onClick={() => setTypeModal(true)}>
          <i className="fa-solid fa-plus"></i> New Attribute Type
        </button>
      </div>

      {loading && <div className="loading-overlay"><span className="spinner"></span></div>}

      {!loading && attrs.length === 0 && (
        <div className="empty-state">
          <i className="fa-solid fa-sliders"></i>
          <p>No attribute types yet. Create one to add variants to your products.</p>
        </div>
      )}

      {!loading && attrs.length > 0 && (
        <div className="card">
          <div className="table-wrap" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Attribute Type</th>
                  <th>Values</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {attrs.map((attr) => (
                  <tr key={attr.id}>
                    <td style={{ fontWeight: 600 }}>{attr.name}</td>
                    <td>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {attr.values.map((v) => (
                          <span key={v.id} className="badge badge-neutral">{v.value}</span>
                        ))}
                        {attr.values.length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>No values</span>}
                      </div>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => { setSelectedTypeId(attr.id); setValueModal(true) }}>
                        <i className="fa-solid fa-plus"></i> Add Value
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {typeModal && (
        <Modal title="New Attribute Type" onClose={() => setTypeModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setTypeModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={savingType || !typeName} onClick={() => void handleCreateType()}>
                {savingType ? 'Creating…' : 'Create'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Type Name <span style={{ color: 'var(--status-danger)' }}>*</span></label>
            <input className="form-input" value={typeName} onChange={(e) => setTypeName(e.target.value)} placeholder="e.g. Color, Size, Brand" />
          </div>
        </Modal>
      )}

      {valueModal && (
        <Modal title={`Add Value — ${attrs.find((a) => a.id === selectedTypeId)?.name ?? ''}`} onClose={() => setValueModal(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setValueModal(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={savingValue || !valueText} onClick={() => void handleAddValue()}>
                {savingValue ? 'Adding…' : 'Add Value'}
              </button>
            </>
          }
        >
          <div className="form-group">
            <label className="form-label">Value <span style={{ color: 'var(--status-danger)' }}>*</span></label>
            <input className="form-input" value={valueText} onChange={(e) => setValueText(e.target.value)} placeholder="e.g. Red, Large, Sony" />
          </div>
        </Modal>
      )}
    </AppShell>
  )
}
