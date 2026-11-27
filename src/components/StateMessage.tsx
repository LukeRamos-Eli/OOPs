import type { ReactNode } from 'react'

export default function StateMessage({
  title,
  description,
  variant = 'empty',
  action,
}: {
  title: string
  description: string
  variant?: 'empty' | 'error'
  action?: ReactNode
}) {
  const isError = variant === 'error'
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className="content-enter flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl px-5 py-8 text-center"
    >
      <span
        aria-hidden="true"
        className={`mb-1 flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold ${
          isError ? 'bg-[#fde8e7] text-red-700' : 'bg-field text-muted'
        }`}
      >
        {isError ? '!' : 'i'}
      </span>
      <h2 className="font-bold text-navy">{title}</h2>
      <p className="max-w-md text-sm text-muted">{description}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
