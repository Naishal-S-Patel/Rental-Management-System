import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { settingsApi } from '@/api/dashboardApi'
import { getErrorMessage } from '@/lib/errorMessage'
import type { RentalSettingsResponse } from '@/types/dashboard'

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<RentalSettingsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [gracePeriod, setGracePeriod] = useState('0')
  const [lateFeePercent, setLateFeePercent] = useState('0')
  const [maxMultiplier, setMaxMultiplier] = useState('0')
  const [pickupWindow, setPickupWindow] = useState('24')
  const [returnWindow, setReturnWindow] = useState('24')

  useEffect(() => {
    settingsApi.get()
      .then(({ data }) => {
        setSettings(data)
        setGracePeriod(String(data.gracePeriodDays))
        setLateFeePercent(String(data.dailyLateFeePercent))
        setMaxMultiplier(String(data.maxLateFeeMutiplier))
        setPickupWindow(String(data.pickupWindowHours))
        setReturnWindow(String(data.returnWindowHours))
      })
      .catch(() => toast.error('Could not load settings.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update({
        gracePeriodDays: Number(gracePeriod),
        dailyLateFeePercent: Number(lateFeePercent),
        maxLateFeeMutiplier: Number(maxMultiplier),
        pickupWindowHours: Number(pickupWindow),
        returnWindowHours: Number(returnWindow),
      })
      toast.success('Settings saved.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save settings.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AppShell requiredRole="ADMIN"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>

  return (
    <AppShell requiredRole="ADMIN">
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <div className="page-subtitle">Rental business rules for your store</div>
        </div>
      </div>

      <div style={{ maxWidth: 600 }}>
        <div className="card">
          <div className="card-header"><span className="card-title">Late Fee Policy</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Grace Period (days)</label>
                <input type="number" className="form-input" value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} min="0" />
                <span className="form-hint">Days after due date before late fee kicks in.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Daily Late Fee (%)</label>
                <input type="number" className="form-input" value={lateFeePercent} onChange={(e) => setLateFeePercent(e.target.value)} min="0" step="0.01" />
                <span className="form-hint">Percentage of daily rental rate.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Max Late Fee Multiplier</label>
                <input type="number" className="form-input" value={maxMultiplier} onChange={(e) => setMaxMultiplier(e.target.value)} min="0" step="0.1" />
                <span className="form-hint">Maximum total late fee as a multiple of base rate.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginTop: 14 }}>
          <div className="card-header"><span className="card-title">Pickup & Return Windows</span></div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="form-group">
                <label className="form-label">Pickup Window (hours)</label>
                <input type="number" className="form-input" value={pickupWindow} onChange={(e) => setPickupWindow(e.target.value)} min="1" />
                <span className="form-hint">How long the customer has to pickup after the scheduled time.</span>
              </div>
              <div className="form-group">
                <label className="form-label">Return Window (hours)</label>
                <input type="number" className="form-input" value={returnWindow} onChange={(e) => setReturnWindow(e.target.value)} min="1" />
                <span className="form-hint">How long customer has to return after the end date.</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 16 }}>
          <button className="btn btn-primary" disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        </div>
      </div>
    </AppShell>
  )
}
