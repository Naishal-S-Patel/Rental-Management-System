import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { ControlPanel } from '@/components/ControlPanel'
import { useAuth } from '@/hooks/useAuth'
import { addressApi } from '@/api/addressApi'
import { userApi } from '@/api/userApi'
import { getErrorMessage } from '@/lib/errorMessage'
import type { AddressResponse, AddressRequest } from '@/types/address'
import { Modal } from '@/components/Modal'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function AccountPage() {
  const { user, refreshCurrentUser } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'addresses'>('profile')
  
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [editAddr, setEditAddr] = useState<AddressResponse | null>(null)
  const [showNewAddr, setShowNewAddr] = useState(false)
  const [addrForm, setAddrForm] = useState<AddressRequest>({ line1: '', city: '', state: '', postalCode: '', country: 'India' })
  const [savingAddr, setSavingAddr] = useState(false)

  // Profile form
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

  // Photo Upload States
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Password form
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [changingPw, setChangingPw] = useState(false)

  const photoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    addressApi.list()
      .then(({ data }) => setAddresses(data))
      .catch(() => {})
      .finally(() => setLoadingAddr(false))
  }, [])

  useEffect(() => {
    if (user) {
      setFirstName(user.firstName)
      setLastName(user.lastName)
    }
  }, [user])

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      await userApi.updateProfile({ firstName, lastName })
      await refreshCurrentUser()
      toast.success('Profile updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update profile.'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePhotoUpload = async (file: File) => {
    // Immediate preview for snappy responsive feel
    const localUrl = URL.createObjectURL(file)
    setPhotoPreview(localUrl)
    setUploadingPhoto(true)
    try {
      await userApi.uploadPhoto(file)
      await refreshCurrentUser()
      toast.success('Photo updated successfully.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload photo.'))
      setPhotoPreview(null) // Revert preview on error
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleChangePassword = async () => {
    if (!currentPw || !newPw || !confirmPw) {
      toast.error('All fields are required.')
      return
    }
    if (newPw !== confirmPw) {
      toast.error('Passwords do not match.')
      return
    }
    if (newPw.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    setChangingPw(true)
    try {
      await userApi.changePassword({ currentPassword: currentPw, newPassword: newPw })
      toast.success('Password changed successfully.')
      setCurrentPw('')
      setNewPw('')
      setConfirmPw('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change password.'))
    } finally {
      setChangingPw(false)
    }
  }

  const openNewAddr = () => {
    setEditAddr(null)
    setAddrForm({ line1: '', city: '', state: '', postalCode: '', country: 'India' })
    setShowNewAddr(true)
  }

  const openEditAddr = (addr: AddressResponse) => {
    setEditAddr(addr)
    setAddrForm({ line1: addr.line1, city: addr.city, state: addr.state, postalCode: addr.postalCode, country: addr.country, label: addr.label })
    setShowNewAddr(true)
  }

  const handleSaveAddr = async () => {
    setSavingAddr(true)
    try {
      if (editAddr) {
        const { data } = await addressApi.update(editAddr.id, addrForm)
        setAddresses((prev) => prev.map((a) => a.id === data.id ? data : a))
      } else {
        const { data } = await addressApi.create(addrForm)
        setAddresses((prev) => [...prev, data])
      }
      setShowNewAddr(false)
      toast.success('Address saved.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not save address.'))
    } finally {
      setSavingAddr(false)
    }
  }

  const handleDeleteAddr = async (id: string) => {
    if (!confirm('Delete this address?')) return
    try {
      await addressApi.remove(id)
      setAddresses((prev) => prev.filter((a) => a.id !== id))
      toast.success('Address removed.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not remove address.'))
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      await addressApi.setDefault(id)
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
      toast.success('Default address updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update default address.'))
    }
  }

  // Fallback avatar generator
  const initials = ((user?.firstName ?? '')[0] + (user?.lastName ?? '')[0]).toUpperCase() || '👤'

  return (
    <AppShell requiredRole="CUSTOMER">
      <ControlPanel breadcrumbs={[{ label: 'Account Settings' }]} />

      <div className="o-content" style={{ marginTop: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: '32px', alignItems: 'flex-start' }}>
          
          {/* Left Setting Nav Split Layout (Deliberate Hierarchy) */}
          <aside style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            background: '#fff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: '12px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            {[
              { id: 'profile', label: '👤 Profile Details' },
              { id: 'security', label: '🔒 Security & Password' },
              { id: 'addresses', label: '📍 Saved Addresses' }
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

          {/* Right Content Pane */}
          <div style={{ minWidth: 0 }}>
            
            {/* Tab: Profile Details */}
            {activeTab === 'profile' && (
              <div className="shadow-tinted" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', fontWeight: 800, marginBottom: 20 }}>
                  Profile Information
                </h2>
                
                {/* Photo Upload with live preview & crop spinner state */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                  <div style={{
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    border: '2px solid var(--primary-light)',
                    background: 'var(--primary-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: 'var(--shadow-sm)'
                  }}>
                    {uploadingPhoto && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10
                      }}>
                        <span className="spinner" style={{ width: 20, height: 20 }}></span>
                      </div>
                    )}
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (user?.profileImageFileId || user?.profilePhotoUrl) ? (
                      <img src={`${BASE_URL}/api/files/${user.profileImageFileId || user.profilePhotoUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>{initials}</span>
                    )}
                  </div>

                  <div>
                    <input
                      ref={photoInputRef}
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) void handlePhotoUpload(f) }}
                    />
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}
                      onClick={() => photoInputRef.current?.click()}
                    >
                      Choose Profile Photo
                    </button>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>JPG, PNG or GIF. Max size 2MB.</div>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>First Name</label>
                  <input className="form-input" style={{ borderRadius: '6px' }} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Last Name</label>
                  <input className="form-input" style={{ borderRadius: '6px' }} value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Email Address</label>
                  <input className="form-input" style={{ borderRadius: '6px', background: 'var(--bg-subtle)', color: 'var(--text-muted)' }} value={user?.email ?? ''} disabled />
                  <span className="form-hint">Your email address is managed securely and cannot be changed.</span>
                </div>
                <button
                  className="btn btn-primary"
                  style={{ borderRadius: '6px', padding: '10px 20px', fontWeight: 600 }}
                  disabled={savingProfile}
                  onClick={() => void handleSaveProfile()}
                >
                  {savingProfile ? 'Saving Changes…' : 'Save Changes'}
                </button>
              </div>
            )}

            {/* Tab: Security & Password */}
            {activeTab === 'security' && (
              <div className="shadow-tinted" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', fontWeight: 800, marginBottom: 20 }}>
                  Update Password
                </h2>
                
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Current Password</label>
                  <input type="password" className="form-input" style={{ borderRadius: '6px' }} value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>New Password</label>
                  <input type="password" className="form-input" style={{ borderRadius: '6px' }} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Confirm New Password</label>
                  <input type="password" className="form-input" style={{ borderRadius: '6px' }} value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter new password" />
                </div>
                
                {/* Active styled Change Password button (Form validated inside function instead of disabled) */}
                <button
                  className="btn btn-primary"
                  style={{
                    borderRadius: '6px',
                    padding: '10px 20px',
                    fontWeight: 600,
                    opacity: changingPw ? 0.7 : 1,
                    cursor: changingPw ? 'not-allowed' : 'pointer'
                  }}
                  disabled={changingPw}
                  onClick={() => void handleChangePassword()}
                >
                  {changingPw ? 'Updating…' : 'Update Password'}
                </button>
              </div>
            )}

            {/* Tab: Saved Addresses */}
            {activeTab === 'addresses' && (
              <div className="shadow-tinted" style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                  <h2 style={{ fontFamily: 'Sora, sans-serif', fontSize: '1.4rem', fontWeight: 800, margin: 0 }}>
                    My Saved Addresses
                  </h2>
                  <button className="btn btn-secondary" style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }} onClick={openNewAddr}>
                    + Add New Address
                  </button>
                </div>

                <div>
                  {loadingAddr && <span className="spinner"></span>}
                  {!loadingAddr && addresses.length === 0 && (
                    <div className="empty-state" style={{ padding: '40px 20px', textAlign: 'center' }}>
                      <div style={{ fontSize: '2rem', marginBottom: 8 }}>📍</div>
                      <p style={{ color: 'var(--text-secondary)' }}>You haven't saved any addresses yet.</p>
                    </div>
                  )}
                  {!loadingAddr && addresses.length > 0 && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '16px' }}>
                      {addresses.map((addr) => {
                        return (
                          /* Calm Address Card (No red/pink error borders or bg highlights!) */
                          <div
                            key={addr.id}
                            style={{
                              border: `1.5px solid ${addr.isDefault ? '#0D9488' : 'var(--border)'}`,
                              padding: '16px',
                              background: addr.isDefault ? '#F0FDFA' : '#FAF9F6',
                              borderRadius: '8px',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between',
                              height: '100%',
                              position: 'relative'
                            }}
                          >
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                                  {addr.label || 'Address'}
                                </span>
                                {addr.isDefault && (
                                  <span className="badge badge-info" style={{ backgroundColor: '#0D9488', color: '#fff', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '4px' }}>
                                    Default
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                                {addr.line1}<br />
                                {addr.city}, {addr.state} {addr.postalCode}<br />
                                {addr.country}
                              </div>
                            </div>

                            <div style={{ display: 'flex', gap: 8, marginTop: 16, borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 12 }}>
                              <button
                                className="btn btn-secondary btn-sm"
                                style={{ borderRadius: '4px', fontSize: '0.75rem', padding: '4px 10px' }}
                                onClick={() => openEditAddr(addr)}
                              >
                                Edit
                              </button>
                              {!addr.isDefault && (
                                <button
                                  className="btn btn-secondary btn-sm"
                                  style={{ borderRadius: '4px', fontSize: '0.75rem', padding: '4px 10px' }}
                                  onClick={() => void handleSetDefault(addr.id)}
                                >
                                  Set Default
                                </button>
                              )}
                              <button
                                className="btn btn-danger btn-sm"
                                style={{ borderRadius: '4px', fontSize: '0.75rem', padding: '4px 10px' }}
                                onClick={() => void handleDeleteAddr(addr.id)}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Address Modal */}
      {showNewAddr && (
        <Modal
          title={editAddr ? 'Edit Address' : 'New Address'}
          onClose={() => setShowNewAddr(false)}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setShowNewAddr(false)}>Cancel</button>
              <button className="btn btn-primary" disabled={savingAddr} onClick={() => void handleSaveAddr()}>
                {savingAddr ? 'Saving…' : 'Save Address'}
              </button>
            </>
          }
        >
          {[
            { key: 'label', label: 'Label (optional)', placeholder: 'Home, Work…' },
            { key: 'line1', label: 'Street Address', placeholder: '123 Main St' },
            { key: 'city', label: 'City', placeholder: 'Mumbai' },
            { key: 'state', label: 'State', placeholder: 'Maharashtra' },
            { key: 'postalCode', label: 'ZIP / Postal Code', placeholder: '400001' },
            { key: 'country', label: 'Country', placeholder: 'India' },
          ].map((f) => (
            <div className="form-group" key={f.key}>
              <label className="form-label" style={{ fontWeight: 600 }}>{f.label}</label>
              <input className="form-input" style={{ borderRadius: '6px' }} placeholder={f.placeholder} value={(addrForm as any)[f.key] ?? ''} onChange={(e) => setAddrForm((p) => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
        </Modal>
      )}
    </AppShell>
  )
}
