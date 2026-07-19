import { NavLink, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'

const menuItems = [
  { to: '/admin/dashboard', label: 'Dashboard' },
  { to: '/admin/orders', label: 'Orders' },
  { to: '/admin/quotations', label: 'Quotations' },
  { to: '/admin/products', label: 'Products' },
  { to: '/admin/schedule', label: 'Schedule' },
  { to: '/admin/pricelists', label: 'Pricing' },
  { to: '/admin/settings', label: 'Configuration' },
]

export function TopAppBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleLogout = async () => {
    try { await logout() } catch { toast.error('Logout failed') }
  }

  const initials = user ? (user.firstName?.[0] ?? '') + (user.lastName?.[0] ?? '') : '?'

  return (
    <nav className="o-navbar">
      <NavLink to="/admin/dashboard" className="o-navbar-brand">
        <span>◆</span> RentLo
      </NavLink>

      <div className="o-navbar-menu">
        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => 'o-navbar-item' + (isActive ? ' active' : '')}
          >
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="o-navbar-right" ref={menuRef}>
        <button className="o-navbar-user" onClick={() => setShowMenu((v) => !v)}>
          <div className="o-navbar-avatar">{initials}</div>
          <span>{user?.firstName}</span>
          <span style={{ fontSize: '0.65rem', opacity: 0.7 }}>▼</span>
        </button>

        {showMenu && (
          <div className="dropdown-menu" style={{ top: '100%', right: 0, position: 'absolute', marginTop: 4 }}>
            <div style={{ padding: '8px 14px', fontSize: '0.8rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)' }}>
              {user?.email}
              {user?.storeName && <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginTop: 2 }}>{user.storeName}</div>}
            </div>
            <button className="dropdown-item" onClick={() => { setShowMenu(false); navigate('/admin/settings') }}>
              <i className="fa-solid fa-gear"></i> Settings
            </button>
            <div className="dropdown-divider"></div>
            <button className="dropdown-item danger" onClick={() => void handleLogout()}>
              <i className="fa-solid fa-right-from-bracket"></i> Log out
            </button>
          </div>
        )}
      </div>
    </nav>
  )
}
