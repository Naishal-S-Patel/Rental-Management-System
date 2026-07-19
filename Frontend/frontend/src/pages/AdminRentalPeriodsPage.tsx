import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { rentalPeriodApi } from '@/api/pricelistApi'
import { Modal } from '@/components/Modal'
import { getErrorMessage } from '@/lib/errorMessage'
import type { RentalPeriodResponse, DurationUnit } from '@/types/pricelist'

const DURATION_UNITS: DurationUnit[] = ['HOUR', 'DAY', 'WEEK', 'MONTH', 'YEAR']

export function AdminRentalPeriodsPage() {
  const [periods, setPeriods] = useState<RentalPeriodResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState<'new' | 'edit' | null>(null)
  const [editing, setEditing] = useState<RentalPeriodResponse | null>(null)
  const [name, setName] = useState('')
  const [durationValue, setDurationValue] = useState('1')
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('DAY')
  const [saving, setSaving] = useState(false)

  const fetchPeriods = () => {
    rentalPeriodApi.list()
      .then(({ data }) => setPeriods(data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchPeriods() }, [])

  const openNew = () => { setEditing(null); setName(''); setDurationValue('1'); setDurationUnit('DAY'); setModal('new') }
  const openEdit = (p: RentalPeriodResponse) => { setEditing(p); setName(p.name); setDurationValue(String(p.durationValue)); setDurationUnit(p.durationUnit); setModal('edit') }

  const handleSave = async () => {
    setSaving(true)
    try {
      const body = { name, durationValue: Number(durationValue), durationUnit }
      if (modal === 'edit' && editing) {
        await rentalPeriodApi.update(editing.id, body)
        toast.success('Period updated.')
      } else {
        await rentalPeriodApi.create(body)
        toast.success('Period created.')
      }
      fetchPeriods()
      setModal(null)
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to save.'))
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rental period?')) return
    try {
      await rentalPeriodApi.remove(id)
      fetchPeriods()
      toast.success('Deleted.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Failed to delete.'))
    }
  }

  return (
    <AppShell requiredRole="ADMIN">
      <ControlPanel
        breadcrumbs={[{ label: 'Configuration', to: '/admin/settings' }, { label: 'Rental Periods' }]}
        actions={
          <button className="btn btn-primary" onClick={openNew}>+ New Period</button>
        }
      />

      <div className="o-content">
        {loading && <div className="loading-overlay"><span className="spinner"></span></div>}

        {!loading && periods.length === 0 && (
          <div className="empty-state mt-3">
            <p>No rental periods yet. Add templates like "Weekend", "1 Week", etc.</p>
          </div>
        )}

        {!loading && periods.length > 0 && (
          <div className="table-wrap mt-3">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="text-right">Duration</th>
                  <th>Unit</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {periods.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600 }}>{p.name}</td>
                    <td className="text-right">{p.durationValue}</td>
                    <td><span className="badge badge-neutral">{p.durationUnit}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => void handleDelete(p.id)}>×</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {modal && (
          <Modal title={modal === 'edit' ? 'Edit Rental Period' : 'New Rental Period'} onClose={() => setModal(null)}
            footer={
              <>
                <button className="btn btn-secondary" onClick={() => setModal(null)}>Cancel</button>
                <button className="btn btn-primary" disabled={saving || !name} onClick={() => void handleSave()}>
                  {saving ? 'Saving…' : 'Save'}
                </button>
              </>
            }
          >
            <div className="form-group">
              <label className="form-label">Name <span style={{ color: 'var(--status-danger)' }}>*</span></label>
              <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Weekend, 1 Week" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div className="form-group">
                <label className="form-label">Duration</label>
                <input type="number" className="form-input" value={durationValue} onChange={(e) => setDurationValue(e.target.value)} min="1" />
              </div>
              <div className="form-group">
                <label className="form-label">Unit</label>
                <select className="form-select" value={durationUnit} onChange={(e) => setDurationUnit(e.target.value as DurationUnit)}>
                  {DURATION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </AppShell>
  )
}
