import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStorage } from './tokenStorage'
import type { AuthResponse } from '@/types/auth'

const baseURL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

export const api = axios.create({ baseURL })

// Separate instance for the refresh call itself - must NOT go through the interceptors
// below, or a failing refresh would try to refresh itself in an infinite loop.
const refreshClient = axios.create({ baseURL })

/**
 * Set by AuthContext on mount. Called when a refresh attempt fails (refresh token itself
 * expired/revoked) so the app can clear state and redirect to /login through React Router
 * instead of this module doing a raw window.location redirect.
 */
let onAuthFailure: (() => void) | null = null
export function setOnAuthFailure(handler: () => void) {
  onAuthFailure = handler
}

api.interceptors.request.use((config) => {
  const accessToken = tokenStorage.getAccessToken()
  if (accessToken) {
    config.headers.set('Authorization', `Bearer ${accessToken}`)
  }
  return config
})

// Endpoints that can legitimately 401 without it meaning "the access token expired" -
// retrying these through the refresh flow would be wrong.
const NO_REFRESH_PATHS = ['/api/auth/login', '/api/auth/refresh']

interface RetryableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

let refreshPromise: Promise<string> | null = null

async function refreshAccessToken(): Promise<string> {
  const refreshToken = tokenStorage.getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }
  const { data } = await refreshClient.post<AuthResponse>('/api/auth/refresh', { refreshToken })
  tokenStorage.setTokens(data.accessToken, data.refreshToken)
  return data.accessToken
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetryableConfig | undefined
    const status = error.response?.status
    const path = config?.url ?? ''

    const shouldAttemptRefresh =
      status === 401 && config && !config._retried && !NO_REFRESH_PATHS.some((p) => path.includes(p))

    if (!shouldAttemptRefresh) {
      return Promise.reject(error)
    }

    config._retried = true

    try {
      // Dedupe concurrent 401s into a single refresh call.
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newAccessToken = await refreshPromise
      config.headers.set('Authorization', `Bearer ${newAccessToken}`)
      return api(config)
    } catch (refreshError) {
      tokenStorage.clear()
      onAuthFailure?.()
      return Promise.reject(refreshError)
    }
  },
)
