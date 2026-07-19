import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { getErrorMessage } from '@/lib/errorMessage'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px', letterSpacing: '-0.03em' }}>RentLo</div>
          <h1 className="auth-title" style={{ fontSize: '1.125rem', marginBottom: 0 }}>Reset your password</h1>
        </div>

        {sent ? (
          <div>
            <div className="alert alert-success">
              <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i>
              If an account exists for <strong>{email}</strong>, a password reset link has been sent.
            </div>
            <Link to="/login" className="btn btn-secondary btn-block" style={{ marginTop: 12 }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-danger">{error}</div>}
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Enter the email address associated with your account. We'll send a reset link.
            </p>
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email address</label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="you@example.com"
                />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Sending…</> : 'Send reset link'}
              </button>
            </form>
            <div style={{ marginTop: 16, textAlign: 'center', fontSize: '0.8125rem' }}>
              <Link to="/login">Back to sign in</Link>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
