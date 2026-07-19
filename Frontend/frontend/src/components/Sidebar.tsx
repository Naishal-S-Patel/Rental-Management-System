import { NavLink } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/errorMessage'

const customerLinks = [
  { to: '/products', label: 'Browse Products', icon: '🔍' },
  { to: '/cart', label: 'Cart', icon: '🛒' },
  { to: '/orders', label: 'My Orders', icon: '📦' },
  { to: '/account', label: 'Account', icon: '👤' },
]

const adminLinks = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
  { to: '/admin/orders', label: 'Orders', icon: '📦' },
  { to: '/admin/quotations', label: 'Quotations', icon: '📄' },
  { to: '/admin/products', label: 'Products', icon: '🏷️' },
  { to: '/admin/schedule', label: 'Schedule', icon: '📅' },
  { to: '/admin/pricelists', label: 'Pricing', icon: '💰' },
  { to: '/admin/settings', label: 'Configuration', icon: '⚙️' },
]

export function Sidebar() {
  const { user, logout } = useAuth()

  if (!user) return null

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Logout failed'))
    }
  }

  const isAdmin = user.role === 'ADMIN'
  const links = isAdmin ? adminLinks : customerLinks

  return (
    <aside className="app-sidebar" style={{ boxShadow: 'var(--shadow-lg)' }}>
      {/* Header */}
      <div className="sidebar-header" style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div className="sidebar-logo" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8, letterSpacing: '-0.03em' }}>
          <span>◆</span> RentLo
        </div>
        <div className="sidebar-store" style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginTop: 4 }}>
          {isAdmin ? (user.storeName || 'Admin Portal') : 'Customer Portal'}
        </div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav" style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div className="sidebar-section-label" style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 12, marginBottom: 8 }}>
          Navigation
        </div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: '10px 14px',
              borderRadius: 'var(--radius)',
              fontSize: '0.875rem',
              fontWeight: isActive ? 600 : 500,
              color: isActive ? 'var(--primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--primary-light)' : 'transparent',
              textDecoration: 'none',
              transition: 'background 0.15s, color 0.15s'
            })}
          >
            <span style={{ fontSize: '1.1rem' }}>{link.icon}</span>
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer" style={{ padding: '16px 12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ padding: '4px 12px', marginBottom: 8 }}>
          <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            {user.firstName} {user.lastName}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {user.email}
          </div>
        </div>
        <button
          className="btn btn-secondary btn-sm"
          style={{ width: '100%', justifyContent: 'flex-start', gap: 8, padding: '8px 12px', fontSize: '0.8125rem' }}
          onClick={() => void handleLogout()}
        >
          <span>🚪</span> Logout
        </button>
      </div>
    </aside>
  )
}
