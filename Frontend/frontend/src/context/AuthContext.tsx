import { createContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { authApi } from '@/api/authApi'
import { userApi } from '@/api/userApi'
import { setOnAuthFailure } from '@/lib/api'
import { tokenStorage } from '@/lib/tokenStorage'
import type { LoginRequest, SignupRequest, UserResponse } from '@/types/auth'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

interface AuthContextValue {
  user: UserResponse | null
  status: AuthStatus
  login: (body: LoginRequest) => Promise<void>
  signup: (body: SignupRequest) => Promise<void>
  logout: () => Promise<void>
  logoutAllDevices: () => Promise<void>
  exchangeOAuth2Code: (code: string) => Promise<void>
  refreshCurrentUser: () => Promise<void>
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null)
  // Computed from render-time state (not set synchronously in the effect below) so the
  // "no token" case doesn't trigger react-hooks/set-state-in-effect - only the async
  // resolution of loadCurrentUser() sets state from inside the effect.
  const [status, setStatus] = useState<AuthStatus>(() =>
    tokenStorage.getAccessToken() ? 'loading' : 'unauthenticated',
  )
  const navigate = useNavigate()

  const loadCurrentUser = async () => {
    const { data } = await userApi.getMe()
    setUser(data)
    setStatus('authenticated')
  }

  useEffect(() => {
    setOnAuthFailure(() => {
      setUser(null)
      setStatus('unauthenticated')
      navigate('/login')
    })

    if (!tokenStorage.getAccessToken()) {
      return
    }

    // loadCurrentUser is a shared async helper (also used by login/exchangeOAuth2Code, not
    // effect-only) whose setState calls all happen after an `await` - the lint rule can't see
    // through that function boundary to verify it, but this is the standard fetch-on-mount
    // effect pattern, not a real synchronous-setState-in-effect bug.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadCurrentUser().catch(() => {
      tokenStorage.clear()
      setStatus('unauthenticated')
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const login = async (body: LoginRequest) => {
    const { data } = await authApi.login(body)
    tokenStorage.setTokens(data.accessToken, data.refreshToken)
    await loadCurrentUser()
    // Role-based redirect happens via AppShell/LoginPage watching user state
  }

  const signup = async (body: SignupRequest) => {
    await authApi.signup(body)
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } finally {
      tokenStorage.clear()
      setUser(null)
      setStatus('unauthenticated')
      navigate('/login')
    }
  }

  const logoutAllDevices = async () => {
    try {
      await authApi.logoutAllDevices()
    } finally {
      tokenStorage.clear()
      setUser(null)
      setStatus('unauthenticated')
      navigate('/login')
    }
  }

  const exchangeOAuth2Code = async (code: string) => {
    const { data } = await authApi.exchangeOAuth2Code(code)
    tokenStorage.setTokens(data.accessToken, data.refreshToken)
    await loadCurrentUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        login,
        signup,
        logout,
        logoutAllDevices,
        exchangeOAuth2Code,
        refreshCurrentUser: loadCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
