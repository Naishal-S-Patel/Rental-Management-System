import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { settingsApi } from '@/api/dashboardApi'
import { getErrorMessage } from '@/lib/errorMessage'

export function AdminSettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'policy' | 'fulfillment'>('policy')

  const [gracePeriod, setGracePeriod] = useState('0')
  const [lateFeePercent, setLateFeePercent] = useState('0')
  const [maxMultiplier, setMaxMultiplier] = useState('0')
  const [pickupWindow, setPickupWindow] = useState('1')
  const [returnWindow, setReturnWindow] = useState('1')

  useEffect(() => {
    settingsApi.get()
      .then(({ data }) => {
        setGracePeriod(String(data.gracePeriodDays ?? 0))
        setLateFeePercent(String((data.dailyLateFeePercentage ?? 0) * 100))
        setMaxMultiplier(String(data.maxLateFeeMultiplier ?? 0))
        setPickupWindow(String(data.defaultPickupWindowDays ?? 1))
        setReturnWindow(String(data.defaultReturnWindowDays ?? 1))
      })
      .catch(() => toast.error('Could not load settings.'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await settingsApi.update({
        gracePeriodDays: Number(gracePeriod),
        dailyLateFeePercentage: Number(lateFeePercent) / 100,
        maxLateFeeMultiplier: Number(maxMultiplier),
        defaultPickupWindowDays: Number(pickupWindow),
        defaultReturnWindowDays: Number(returnWindow),
      })
      toast.success('Settings saved successfully.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save settings.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <AppShell requiredRole="ADMIN"><div className="loading-overlay"><span className="spinner"></span></div></AppShell>

  return (
    <AppShell requiredRole="ADMIN">
      <ControlPanel
        breadcrumbs={[{ label: 'Configuration' }]}
        actions={
          <button className="btn btn-primary" style={{ borderRadius: '6px', fontWeight: 600 }} disabled={saving} onClick={() => void handleSave()}>
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
        }
      />

      <div className="o-content" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px', alignItems: 'flex-start' }}>
          
          {/* Left Setting Nav Split Layout */}
          <aside style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: '12px',
            padding: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {[
              { id: 'policy', label: '⏰ Late Fee Policy' },
              { id: 'fulfillment', label: '🏪 Pickup & Returns' }
            ].map((tab) => {
              const isSel = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '10px 14px',
                    border: 'none',
                    borderRadius: '6px',
                    background: isSel ? 'var(--primary-light)' : 'transparent',
                    color: isSel ? 'var(--primary)' : 'var(--text-secondary)',
                    fontWeight: isSel ? 700 : 500,
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.12s'
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </aside>

          {/* Right Panel Contents */}
          <div style={{ minWidth: 0 }}>
            
            {/* Tab: Late Fee Policy */}
            {activeTab === 'policy' && (
              <div className="shadow-tinted" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: 24 }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>
                  Late Fee Policy Rules
                </h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: 24 }}>
                  Configure the policies applied to active orders when items are returned past their due dates.
                </p>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Grace Period (days)</label>
                  <input type="number" className="form-input" style={{ borderRadius: '6px' }} value={gracePeriod} onChange={(e) => setGracePeriod(e.target.value)} min="0" />
                  <span className="form-hint">Number of days allowed past return date before late fees start accruing.</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Daily Late Fee (%)</label>
                  <input type="number" className="form-input" style={{ borderRadius: '6px' }} value={lateFeePercent} onChange={(e) => setLateFeePercent(e.target.value)} min="0" step="0.01" />
                  <span className="form-hint">Percentage of the daily item price charged as fine per overdue day.</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Max Fee Multiplier</label>
                  <input type="number" className="form-input" style={{ borderRadius: '6px' }} value={maxMultiplier} onChange={(e) => setMaxMultiplier(e.target.value)} min="0" step="0.1" />
                  <span className="form-hint">Fines will cap once they reach this multiplier times the product daily fee.</span>
                </div>
              </div>
            )}

            {/* Tab: Fulfillment Windows */}
            {activeTab === 'fulfillment' && (
              <div className="shadow-tinted" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: '12px', padding: 24 }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', fontWeight: 800, marginBottom: 4 }}>
                  Fulfillment Time Windows
                </h2>
                <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: 24 }}>
                  Define the default periods within which order pickups and returns are scheduled.
                </p>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Pickup Window (days)</label>
                  <input type="number" className="form-input" style={{ borderRadius: '6px' }} value={pickupWindow} onChange={(e) => setPickupWindow(e.target.value)} min="1" />
                  <span className="form-hint">Allowed days window from reservation to collect rented gear.</span>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Return Window (days)</label>
                  <input type="number" className="form-input" style={{ borderRadius: '6px' }} value={returnWindow} onChange={(e) => setReturnWindow(e.target.value)} min="1" />
                  <span className="form-hint">Standard duration buffer configured for item processing.</span>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </AppShell>
  )
}
