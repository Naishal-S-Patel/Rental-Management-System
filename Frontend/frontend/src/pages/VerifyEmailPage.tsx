import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { getErrorMessage } from '@/lib/errorMessage'

type Status = 'verifying' | 'success' | 'error'

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<Status>(() => (token ? 'verifying' : 'error'))
  const [message, setMessage] = useState(() => (token ? '' : 'Missing verification token'))

  useEffect(() => {
    if (!token) return
    authApi
      .verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((error: unknown) => {
        setStatus('error')
        setMessage(getErrorMessage(error, 'This verification link is invalid or has expired'))
      })
  }, [token])

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px', letterSpacing: '-0.03em' }}>RentLo</div>
        <h1 className="auth-title" style={{ fontSize: '1.125rem' }}>Email Verification</h1>

        {status === 'verifying' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span className="spinner"></span>
            Verifying your email…
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              <i className="fa-solid fa-circle-check" style={{ marginRight: 8 }}></i>
              Your email is verified successfully.
            </div>
            <Link to="/login" className="btn btn-primary btn-block">
              Sign in to your account
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>
              <i className="fa-solid fa-circle-xmark" style={{ marginRight: 8 }}></i>
              {message}
            </div>
            <Link to="/login" className="btn btn-secondary btn-block">
              Back to sign in
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
