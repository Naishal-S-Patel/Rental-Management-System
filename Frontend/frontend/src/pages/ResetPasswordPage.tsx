import { useState, type FormEvent } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { getErrorMessage } from '@/lib/errorMessage'

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(getErrorMessage(err, 'Could not reset password. The link may have expired.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '4px', letterSpacing: '-0.03em' }}>RentLo</div>
          <h1 className="auth-title" style={{ fontSize: '1.125rem', marginBottom: 0 }}>Set new password</h1>
        </div>

        {done ? (
          <div className="alert alert-success">
            <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i>
            Password updated. Redirecting to sign in…
          </div>
        ) : (
          <>
            {error && <div className="alert alert-danger">{error}</div>}
            {!token && (
              <div className="alert alert-warning">No reset token found. Please use the link from your email.</div>
            )}
            <form onSubmit={(e) => void handleSubmit(e)}>
              <div className="form-group">
                <label htmlFor="newPassword" className="form-label">New password</label>
                <input id="newPassword" type="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} placeholder="Min 8 characters" />
              </div>
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm new password</label>
                <input id="confirmPassword" type="password" className="form-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required placeholder="Re-enter password" />
              </div>
              <button type="submit" className="btn btn-primary btn-block" disabled={loading || !token}>
                {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Saving…</> : 'Set new password'}
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
