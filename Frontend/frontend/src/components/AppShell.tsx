import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Sidebar } from './Sidebar'

interface AppShellProps {
  children: ReactNode
  requiredRole?: 'ADMIN' | 'CUSTOMER'
}

export function AppShell({ children, requiredRole }: AppShellProps) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return (
      <div className="loading-overlay" style={{ minHeight: '100svh' }}>
        <span className="spinner"></span>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />
  }

  if (requiredRole && user?.role !== requiredRole) {
    // Redirect to appropriate home for their role
    return <Navigate to={user?.role === 'ADMIN' ? '/admin/dashboard' : '/products'} replace />
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">{children}</main>
    </div>
  )
}
