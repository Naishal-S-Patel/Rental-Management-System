// Currency and date formatters — always display server-computed values, no arithmetic on money
export function formatCurrency(amount: number, currency = 'INR'): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr))
}

export function formatDateTime(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr))
}

export function formatDateInput(dateStr: string): string {
  // Format date as YYYY-MM-DD for input[type=date]
  return new Date(dateStr).toISOString().split('T')[0]
}

export function todayInputDate(): string {
  return new Date().toISOString().split('T')[0]
}
