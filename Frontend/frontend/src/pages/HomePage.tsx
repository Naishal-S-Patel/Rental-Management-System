import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

// Root / redirects to login or role-appropriate dashboard
export function HomePage() {
  const { user } = useAuth()
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/products'} replace />
}
