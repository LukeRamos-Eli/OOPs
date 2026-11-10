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
  const change = tendered - total
  const quick = [100, 200, 500, 1000].filter((q) => q >= total)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <h2 className="text-xl font-bold text-amber-900">Cash Payment</h2>

        <div className="flex justify-between text-lg">
          <span>Total due</span>
          <span className="font-bold">{peso(total)}</span>
        </div>

        <input
          type="number"
          inputMode="decimal"
          min="0"
          placeholder="Amount received"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
          className="w-full border rounded-lg px-3 py-2 text-lg"
        />

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setValue(String(total))} className="px-3 py-1 rounded bg-amber-100">Exact</button>
          {quick.map((q) => (
            <button key={q} onClick={() => setValue(String(q))} className="px-3 py-1 rounded bg-amber-100">
              {peso(q)}
            </button>
          ))}
        </div>

        <div className="flex justify-between text-lg">
          <span>Change</span>
          <span className={`font-bold ${change < 0 ? 'text-red-600' : 'text-green-700'}`}>
            {change < 0 ? '—' : peso(change)}
          </span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button onClick={onClose} disabled={busy} className="flex-1 py-2 rounded-lg border">Cancel</button>
          <button
            onClick={() => onConfirm(tendered)}
            disabled={busy || tendered < total}
            className="flex-1 py-2 rounded-lg bg-green-700 text-white font-semibold disabled:opacity-40"
          >
            {busy ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  )
}