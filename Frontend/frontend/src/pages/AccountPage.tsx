import { useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { AppShell } from '@/components/AppShell'
import { useAuth } from '@/hooks/useAuth'
import { addressApi } from '@/api/addressApi'
import { userApi } from '@/api/userApi'
import { getErrorMessage } from '@/lib/errorMessage'
import type { AddressResponse, AddressRequest } from '@/types/address'
import type { UserResponse } from '@/types/auth'
import { Modal } from '@/components/Modal'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export function AccountPage() {
  const { user, refreshCurrentUser } = useAuth()
  const [addresses, setAddresses] = useState<AddressResponse[]>([])
  const [loadingAddr, setLoadingAddr] = useState(true)
  const [editAddr, setEditAddr] = useState<AddressResponse | null>(null)
  const [showNewAddr, setShowNewAddr] = useState(false)
  const [addrForm, setAddrForm] = useState<AddressRequest>({ street: '', city: '', state: '', zipCode: '', country: 'India' })
  const [savingAddr, setSavingAddr] = useState(false)

  // Profile form
  const [firstName, setFirstName] = useState(user?.firstName ?? '')
  const [lastName, setLastName] = useState(user?.lastName ?? '')
  const [savingProfile, setSavingProfile] = useState(false)

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
    if (user) { setFirstName(user.firstName); setLastName(user.lastName) }
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
    try {
      await userApi.uploadPhoto(file)
      await refreshCurrentUser()
      toast.success('Photo updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not upload photo.'))
    }
  }

  const handleChangePassword = async () => {
    if (newPw !== confirmPw) { toast.error('Passwords do not match.'); return }
    setChangingPw(true)
    try {
      await userApi.changePassword({ currentPassword: currentPw, newPassword: newPw })
      toast.success('Password changed. Please log in again on other devices.')
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not change password.'))
    } finally {
      setChangingPw(false)
    }
  }

  const openNewAddr = () => {
    setEditAddr(null)
    setAddrForm({ street: '', city: '', state: '', zipCode: '', country: 'India' })
    setShowNewAddr(true)
  }

  const openEditAddr = (addr: AddressResponse) => {
    setEditAddr(addr)
    setAddrForm({ street: addr.street, city: addr.city, state: addr.state, zipCode: addr.zipCode, country: addr.country, label: addr.label })
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
      const { data } = await addressApi.setDefault(id)
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a.id === id })))
      toast.success('Default address updated.')
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not update default address.'))
    }
  }

  return (
    <AppShell requiredRole="CUSTOMER">
      <div className="page-header">
        <h1 className="page-title">Account</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'flex-start' }}>
        {/* Profile */}
        <div className="card">
          <div className="card-header"><span className="card-title">Profile</span></div>
          <div className="card-body">
            {/* Photo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <div style={{ width: 64, height: 64, border: '1px solid var(--border)', background: 'var(--bg-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {user?.profilePhotoUrl
                  ? <img src={`${BASE_URL}/api/files/${user.profilePhotoUrl}`} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <i className="fa-solid fa-user" style={{ fontSize: '2rem', color: 'var(--text-muted)' }}></i>
                }
              </div>
              <div>
                <input ref={photoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) void handlePhotoUpload(f) }} />
                <button className="btn btn-secondary btn-sm" onClick={() => photoInputRef.current?.click()}>
                  <i className="fa-solid fa-upload"></i> Change photo
                </button>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">First name</label>
              <input className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Last name</label>
              <input className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
            <div className="form-group">
              <label className="form-label">Email</label>
              <input className="form-input" value={user?.email ?? ''} disabled style={{ background: 'var(--bg-subtle)', color: 'var(--text-muted)' }} />
              <span className="form-hint">Email cannot be changed.</span>
            </div>
            <button className="btn btn-primary" disabled={savingProfile} onClick={() => void handleSaveProfile()}>
              {savingProfile ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        </div>

        {/* Password */}
        <div className="card">
          <div className="card-header"><span className="card-title">Change Password</span></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label">Current password</label>
              <input type="password" className="form-input" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="••••••••" />
            </div>
            <div className="form-group">
              <label className="form-label">New password</label>
              <input type="password" className="form-input" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Min 8 characters" />
            </div>
            <div className="form-group">
              <label className="form-label">Confirm new password</label>
              <input type="password" className="form-input" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} placeholder="Re-enter new password" />
            </div>
            <button className="btn btn-primary" disabled={changingPw || !currentPw || !newPw || !confirmPw} onClick={() => void handleChangePassword()}>
              {changingPw ? 'Saving…' : 'Change Password'}
            </button>
          </div>
        </div>

        {/* Addresses */}
        <div className="card" style={{ gridColumn: '1 / -1' }}>
          <div className="card-header">
            <span className="card-title">Saved Addresses</span>
            <button className="btn btn-secondary btn-sm" onClick={openNewAddr}>
              <i className="fa-solid fa-plus"></i> Add Address
            </button>
          </div>
          <div className="card-body">
            {loadingAddr && <span className="spinner"></span>}
            {!loadingAddr && addresses.length === 0 && (
              <div className="empty-state" style={{ padding: '24px' }}>
                <p>No saved addresses.</p>
              </div>
            )}
            {!loadingAddr && addresses.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {addresses.map((addr) => (
                  <div key={addr.id} style={{ border: `1px solid ${addr.isDefault ? 'var(--primary)' : 'var(--border)'}`, padding: '12px', background: addr.isDefault ? 'var(--primary-light)' : 'var(--bg-surface)' }}>
                    {addr.label && <div style={{ fontWeight: 600, marginBottom: 4, fontSize: '0.875rem' }}>{addr.label}</div>}
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                      {addr.street}<br />{addr.city}, {addr.state} {addr.zipCode}<br />{addr.country}
                    </div>
                    {addr.isDefault && <span className="badge badge-info" style={{ marginTop: 6 }}>Default</span>}
                    <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditAddr(addr)}><i className="fa-solid fa-pen"></i></button>
                      {!addr.isDefault && (
                        <button className="btn btn-secondary btn-sm" onClick={() => void handleSetDefault(addr.id)}>Set Default</button>
                      )}
                      <button className="btn btn-danger btn-sm" onClick={() => void handleDeleteAddr(addr.id)}><i className="fa-solid fa-trash"></i></button>
                    </div>
                  </div>
                ))}
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
            { key: 'street', label: 'Street', placeholder: '123 Main St' },
            { key: 'city', label: 'City', placeholder: 'Mumbai' },
            { key: 'state', label: 'State', placeholder: 'Maharashtra' },
            { key: 'zipCode', label: 'ZIP Code', placeholder: '400001' },
            { key: 'country', label: 'Country', placeholder: 'India' },
          ].map((f) => (
            <div className="form-group" key={f.key}>
              <label className="form-label">{f.label}</label>
              <input className="form-input" placeholder={f.placeholder} value={(addrForm as Record<string, string>)[f.key] ?? ''} onChange={(e) => setAddrForm((p) => ({ ...p, [f.key]: e.target.value }))} />
            </div>
          ))}
        </Modal>
      )}
    </AppShell>
  )
}
