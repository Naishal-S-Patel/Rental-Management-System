import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Legacy page - redirects to role-appropriate home
export function DashboardPage() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/products'} replace />
}
