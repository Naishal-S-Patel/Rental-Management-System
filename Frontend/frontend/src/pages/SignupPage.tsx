import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errorMessage'
import type { Role } from '@/types/auth'

export function SignupPage() {
  const { signup } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('CUSTOMER')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [storeName, setStoreName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const validate = (): string | null => {
    if (password.length < 8) return 'Password must be at least 8 characters.'
    if (password !== confirmPassword) return 'Passwords do not match.'
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter.'
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter.'
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain at least one special character.'
    if (role === 'ADMIN' && !storeName.trim()) return 'Store name is required for Admin accounts.'
    return null
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    const validationError = validate()
    if (validationError) { setError(validationError); return }
    setLoading(true)
    try {
      await signup({ firstName, lastName, email, password, role, storeName: role === 'ADMIN' ? storeName : undefined })
      toast.success('Account created — check your email to verify it.')
      navigate('/login')
    } catch (err) {
      setError(getErrorMessage(err, 'Could not create account.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: 440 }}>
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px', letterSpacing: '-0.03em' }}>
            ◆ RentLo
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.125rem', marginBottom: 0 }}>
            Create an account
          </h1>
        </div>

        {/* Role toggle */}
        <div className="form-group">
          <label className="form-label">I am a</label>
          <div className="role-toggle">
            <button
              type="button"
              className={`role-toggle-btn${role === 'CUSTOMER' ? ' active' : ''}`}
              onClick={() => setRole('CUSTOMER')}
            >
              Customer
            </button>
            <button
              type="button"
              className={`role-toggle-btn${role === 'ADMIN' ? ' active' : ''}`}
              onClick={() => setRole('ADMIN')}
            >
              Admin (Store Owner)
            </button>
          </div>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={(e) => void handleSubmit(e)}>
          {role === 'ADMIN' && (
            <div className="form-group">
              <label htmlFor="storeName" className="form-label">Store name <span style={{ color: 'var(--status-danger)' }}>*</span></label>
              <input
                id="storeName"
                type="text"
                className="form-input"
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                required={role === 'ADMIN'}
                placeholder="Your store display name"
              />
              <span className="form-hint">Shown to customers on product listings</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div className="form-group">
              <label htmlFor="firstName" className="form-label">First name</label>
              <input id="firstName" type="text" className="form-input" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="John" />
            </div>
            <div className="form-group">
              <label htmlFor="lastName" className="form-label">Last name</label>
              <input id="lastName" type="text" className="form-input" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Doe" />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input id="email" type="email" className="form-input" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input id="password" type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="new-password" placeholder="Min 8 chars, upper, lower, special" />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
            <input id="confirmPassword" type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter password" />
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={loading} style={{ marginTop: '8px' }}>
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Creating account…</> : 'Create account'}
          </button>
        </form>

        <div className="divider"></div>

        <p style={{ fontSize: '0.8125rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
