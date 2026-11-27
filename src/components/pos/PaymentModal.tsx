import { useState } from 'react'
import { peso } from '../../lib/format'

type Props = {
  total: number
  busy: boolean
  error: string
  onConfirm: (tendered: number) => void
  onClose: () => void
}

export default function PaymentModal({ total, busy, error, onConfirm, onClose }: Props) {
  const [value, setValue] = useState('')
  const tendered = Number(value) || 0
  const change = Math.round((tendered - total) * 100) / 100
  const quick = [50, 100, 200, 500, 1000].filter((q) => q >= total)

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cash payment"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
    >
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6">
        <h2 className="text-xl font-extrabold">Cash payment</h2>

        <div className="flex items-center justify-between text-lg">
          <span className="text-muted">Total due</span>
          <b>{peso(total)}</b>
        </div>

        <input
          type="number"
          min="0"
          inputMode="decimal"
          autoFocus
          placeholder="Amount received"
          aria-label="Amount received"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="h-13 w-full rounded-xl bg-field px-4 text-lg outline-none placeholder:text-[#6b6e7c] focus:ring-2 focus:ring-brand"
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setValue(String(total))}
            className="h-11 rounded-full bg-peach px-4 text-sm font-semibold text-[#b23b06]"
          >
            Exact
          </button>
          {quick.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => setValue(String(q))}
              className="h-11 rounded-full bg-peach px-4 text-sm font-semibold text-[#b23b06]"
            >
              {peso(q)}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between text-lg">
          <span className="text-muted">Change</span>
          <b className={change < 0 ? 'text-red-700' : 'text-[#17663a]'}>
            {change < 0 ? '—' : peso(change)}
          </b>
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-13 flex-1 rounded-xl border border-[#d9dee7] font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => onConfirm(tendered)}
            disabled={busy || tendered < total}
            className="h-13 flex-1 rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-navy disabled:opacity-40"
          >
            {busy ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}
