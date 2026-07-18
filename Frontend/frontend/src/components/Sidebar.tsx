import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import toast from 'react-hot-toast'
import { getErrorMessage } from '@/lib/errorMessage'

const adminLinks = [
  { to: '/admin/dashboard', icon: 'fa-solid fa-chart-line', label: 'Dashboard' },
  { to: '/admin/orders', icon: 'fa-solid fa-box', label: 'Orders' },
  { to: '/admin/quotations', icon: 'fa-solid fa-file-invoice', label: 'Quotations' },
  { to: '/admin/schedule', icon: 'fa-solid fa-calendar-days', label: 'Schedule' },
  { to: '/admin/products', icon: 'fa-solid fa-tags', label: 'Products' },
  { to: '/admin/pricelists', icon: 'fa-solid fa-list-ol', label: 'Pricelists' },
  { to: '/admin/rental-periods', icon: 'fa-solid fa-clock', label: 'Rental Periods' },
  { to: '/admin/attributes', icon: 'fa-solid fa-sliders', label: 'Attributes' },
  { to: '/admin/settings', icon: 'fa-solid fa-gear', label: 'Settings' },
]

const customerLinks = [
  { to: '/products', icon: 'fa-solid fa-store', label: 'Browse Products' },
  { to: '/cart', icon: 'fa-solid fa-cart-shopping', label: 'Cart' },
  { to: '/orders', icon: 'fa-solid fa-receipt', label: 'My Orders' },
  { to: '/account', icon: 'fa-solid fa-user', label: 'Account' },
]

export function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  const links = user.role === 'ADMIN' ? adminLinks : customerLinks

  const handleLogout = async () => {
    try {
      await logout()
    } catch (err) {
      toast.error(getErrorMessage(err, 'Logout failed'))
    }
  }

  return (
    <aside className="app-sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="sidebar-logo">RentHub</div>
        {user.role === 'ADMIN' && user.storeName && (
          <div className="sidebar-store" title={user.storeName}>
            {user.storeName}
          </div>
        )}
        {user.role === 'ADMIN' && !user.storeName && (
          <div className="sidebar-store">Admin Store</div>
        )}
        {user.role === 'CUSTOMER' && (
          <div className="sidebar-store">Customer Portal</div>
        )}
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              'sidebar-link' + (isActive ? ' active' : '')
            }
          >
            <i className={link.icon}></i>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="sidebar-footer">
        <button
          className="sidebar-link"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
          onClick={() => navigate(user.role === 'ADMIN' ? '/admin/profile' : '/account')}
        >
          <i className="fa-solid fa-circle-user"></i>
          {user.firstName} {user.lastName}
        </button>
        <button
          className="sidebar-link"
          style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', color: 'var(--status-danger)' }}
          onClick={() => void handleLogout()}
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          Logout
        </button>
      </div>
    </aside>
  )
}
