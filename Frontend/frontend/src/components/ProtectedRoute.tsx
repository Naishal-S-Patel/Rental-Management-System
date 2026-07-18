import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { Spinner } from '@/components/Spinner'
import type { Role } from '@/types/auth'

/**
 * Guards a route behind authentication, and optionally behind a set of roles - mirrors
 * SecurityConfig's hasRole(...) rules on the backend. This is a UX convenience only:
 * the backend is the real enforcement point, so don't skip auth checks there just
 * because a route is guarded here.
 */
export function ProtectedRoute({ children, allowedRoles }: { children: ReactNode; allowedRoles?: Role[] }) {
  const { status, user } = useAuth()

  if (status === 'loading') {
    return <Spinner />
  }

  if (status === 'unauthenticated' || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
