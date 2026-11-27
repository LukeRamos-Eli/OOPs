export default function RefreshButton({
  refreshing,
  onClick,
  className = '',
}: {
  refreshing: boolean
  onClick: () => void
  className?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={refreshing}
      aria-busy={refreshing}
      aria-label={refreshing ? 'Refreshing data' : 'Refresh data'}
      className={`refresh-button inline-flex min-h-9 items-center justify-center gap-2 rounded-full px-3 text-xs font-bold tracking-wider text-brand-dark focus-visible:outline-2 focus-visible:outline-brand disabled:cursor-wait disabled:opacity-70 ${className}`}
    >
      {refreshing && (
        <span
          aria-hidden="true"
          className="loading-ring h-4 w-4 shrink-0 rounded-full border-2 border-[#d9dee7] border-t-brand"
        />
      )}
      <span>{refreshing ? 'Refreshing…' : 'REFRESH'}</span>
    </button>
  )
}
