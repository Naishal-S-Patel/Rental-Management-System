import { useState, useEffect, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '@/hooks/useAuth'
import { getErrorMessage } from '@/lib/errorMessage'

export function LoginPage() {
  const { login, user } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Redirect once user is loaded
  useEffect(() => {
    if (user) {
      navigate(user.role === 'ADMIN' ? '/admin/dashboard' : '/products', { replace: true })
    }
  }, [user, navigate])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login({ email, password })
      // navigate happens after user loads in AuthContext effect
    } catch (err) {
      setError(getErrorMessage(err, 'Invalid email or password.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>
            RentHub
          </div>
          <h1 className="auth-title" style={{ fontSize: '1.125rem', marginBottom: 0 }}>
            Sign in to your account
          </h1>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <form onSubmit={(e) => void handleSubmit(e)}>
          <div className="form-group">
            <label htmlFor="email" className="form-label">Email address</label>
            <input
              id="email"
              type="email"
              className="form-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              placeholder="you@example.com"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">Password</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
              placeholder="••••••••"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.8125rem' }}>
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={loading}
          >
            {loading ? <><span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></span> Signing in…</> : 'Sign in'}
          </button>
        </form>

        <div className="divider"></div>

        <p style={{ fontSize: '0.8125rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/signup">Create one</Link>
        </p>
      </div>
    </div>
  )
}
