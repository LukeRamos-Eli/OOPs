import type { CSSProperties } from 'react'

export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton rounded-xl ${className}`} />
}

export function LoadingStatus({ label, className = '' }: { label: string; className?: string }) {
  return (
    <div
      role="status"
      aria-label={label}
      className={`flex items-center gap-2 text-sm font-semibold text-muted ${className}`}
    >
      <span aria-hidden="true" className="loading-ring h-4 w-4 shrink-0 rounded-full border-2 border-[#d9dee7] border-t-brand" />
      <span>{label}</span>
    </div>
  )
}

export function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="rounded-[20px] bg-white p-5 shadow-[0_4px_24px_rgba(20,20,31,0.06)]"
    >
      <Skeleton className="h-9 w-2/3" />
      <Skeleton className="mt-3 h-3 w-1/2" />
    </div>
  )
}

export function ProductGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          aria-hidden="true"
          className="flex min-h-44 flex-col gap-3 rounded-[20px] bg-white p-4 shadow-[0_4px_24px_rgba(20,20,31,0.06)]"
        >
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-auto h-5 w-1/4" />
        </div>
      ))}
    </>
  )
}

export function TableSkeleton({
  rows = 5,
  columns = 5,
  label = 'Loading records…',
  columnWidths,
}: {
  rows?: number
  columns?: number
  label?: string
  columnWidths?: string[]
}) {
  const gridStyle: CSSProperties = {
    gridTemplateColumns:
      columnWidths?.join(' ') ??
      Array.from({ length: columns }, (_, column) => (column === 0 ? '1.4fr' : '1fr')).join(' '),
  }

  return (
    <div className="space-y-4">
      <LoadingStatus label={label} />
      <div aria-hidden="true">
        <div
          className="grid gap-4 border-b border-[#e3e7ee] pb-3"
          style={gridStyle}
        >
          {Array.from({ length: columns }, (_, column) => (
            <Skeleton key={column} className={`h-3 ${column === 0 ? 'w-3/4' : 'w-full'}`} />
          ))}
        </div>
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="grid items-center gap-4 border-b border-[#eef1f5] py-4 last:border-0"
            style={gridStyle}
          >
            {Array.from({ length: columns }, (_, column) => (
              <Skeleton
                key={column}
                className={`h-4 ${column === 0 ? 'w-4/5' : column % 2 === 0 ? 'w-full' : 'w-3/4'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function PageSkeleton({ label }: { label: string }) {
  return (
    <div
      aria-busy="true"
      className="flex min-h-screen items-center justify-center bg-page p-6"
    >
      <div className="w-full max-w-sm rounded-[20px] bg-white p-6 shadow-[0_4px_24px_rgba(20,20,31,0.06)]">
        <LoadingStatus label={label} />
        <Skeleton className="mt-5 h-5 w-2/3" />
        <Skeleton className="mt-3 h-3 w-full" />
      </div>
    </div>
  )
}
