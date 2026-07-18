import { Link } from 'react-router-dom'

export function NotFoundPage() {
  return (
    <div style={{ minHeight: '100svh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '5rem', fontWeight: 700, color: 'var(--border)', lineHeight: 1 }}>404</div>
        <div style={{ fontSize: '1.125rem', fontWeight: 600, color: 'var(--text-primary)', margin: '16px 0 8px' }}>
          Page not found
        </div>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 24 }}>
          The page you are looking for doesn't exist or has been moved.
        </div>
        <Link to="/login" className="btn btn-primary">
          <i className="fa-solid fa-arrow-left"></i> Back to home
        </Link>
      </div>
    </div>
  )
}
