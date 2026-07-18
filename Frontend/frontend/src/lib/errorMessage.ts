import axios from 'axios'
import type { ErrorResponse } from '@/types/auth'

/** Extracts the backend's ErrorResponse.message (see GlobalExceptionHandler) for toast display. */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    const data = error.response?.data
    if (data?.details?.length) {
      return data.details.join(', ')
    }
    if (data?.message) {
      return data.message
    }
  }
  return fallback
}
