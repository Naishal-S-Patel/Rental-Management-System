import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errorMessage'

export function OAuth2RedirectPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { exchangeOAuth2Code, user } = useAuth()
  const [error, setError] = useState<string | null>(() => {
    if (searchParams.get('error')) return 'Google sign-in failed. Please try again.'
    if (!searchParams.get('code')) return 'Missing authorization code'
    return null
  })
  const attempted = useRef(false)

  useEffect(() => {
    if (attempted.current) return
    attempted.current = true
    if (searchParams.get('error')) return
    const code = searchParams.get('code')
    if (!code) return
    exchangeOAuth2Code(code).catch((err: unknown) =>
      setError(getErrorMessage(err, 'Could not complete Google sign-in')),
    )
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  // Navigate once user loads
  useEffect(() => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/products', { replace: true })
    }
  }, [user, navigate])

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '24px', letterSpacing: '-0.03em' }}>RentLo</div>
        {error ? (
          <div>
            <div className="alert alert-danger" style={{ marginBottom: 16 }}>{error}</div>
            <a href="/login" className="btn btn-secondary btn-block">Back to sign in</a>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            <span className="spinner" style={{ width: 24, height: 24 }}></span>
            Completing Google sign-in…
          </div>
        )}
      </div>
    </div>
  )
}
