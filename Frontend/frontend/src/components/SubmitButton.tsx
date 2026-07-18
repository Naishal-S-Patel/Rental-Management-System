import type { ButtonHTMLAttributes } from 'react'
import clsx from 'clsx'

export function SubmitButton({
  loading,
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading || props.disabled}
      className={clsx(
        'w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
      {...props}
    >
      {loading ? 'Please wait…' : children}
    </button>
  )
}
