import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

export function Navbar() {
  const { user, status, logout } = useAuth()

  return (
    <header className="border-b border-slate-200 bg-white">
      <nav className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <Link to="/" className="font-semibold text-slate-900">
          Hackathon Starter
        </Link>
        <div className="flex items-center gap-4 text-sm">
          {status === 'authenticated' && user ? (
            <>
              <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">
                Dashboard
              </Link>
              <span className="text-slate-400">{user.email}</span>
              <button
                onClick={() => void logout()}
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-slate-600 hover:text-slate-900">
                Log in
              </Link>
              <Link
                to="/signup"
                className="rounded-md bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-700"
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  )
}
