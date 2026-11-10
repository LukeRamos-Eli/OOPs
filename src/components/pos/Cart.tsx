import type { CartLine, OrderType } from '../../types/database'
import { peso } from '../../lib/format'

type Props = {
  lines: CartLine[]
  orderType: OrderType
  total: number
  onOrderType: (t: OrderType) => void
  onQty: (id: number, qty: number) => void
  onRemove: (id: number) => void
  onClear: () => void
  onCharge: () => void
}

export default function Cart({
  lines, orderType, total, onOrderType, onQty, onRemove, onClear, onCharge,
}: Props) {
  const typeBtn = (t: OrderType, label: string) => (
    <button
      onClick={() => onOrderType(t)}
      className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
        orderType === t ? 'bg-amber-800 text-white border-amber-800' : 'bg-white border-amber-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="bg-white rounded-xl shadow p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-amber-900">Current Order</h2>
        {lines.length > 0 && (
          <button onClick={onClear} className="text-sm text-red-600 underline">Clear</button>
        )}
      </div>

      <div className="flex gap-2 mb-3">
        {typeBtn('dine_in', 'Dine-in')}
        {typeBtn('takeout', 'Takeout')}
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 min-h-[120px]">
        {lines.length === 0 && <p className="text-gray-500 text-sm">Tap an item to add it.</p>}
        {lines.map((l) => (
          <div key={l.item.id} className="flex items-center justify-between gap-2">
            <div className="flex-1">
              <div className="font-medium">{l.item.name}</div>
              <div className="text-xs text-gray-500">{peso(l.item.price)} each</div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => onQty(l.item.id, l.qty - 1)} className="w-7 h-7 rounded bg-amber-100">−</button>
              <span className="w-6 text-center">{l.qty}</span>
              <button onClick={() => onQty(l.item.id, l.qty + 1)} className="w-7 h-7 rounded bg-amber-100">+</button>
            </div>
            <div className="w-20 text-right font-medium">{peso(l.item.price * l.qty)}</div>
            <button onClick={() => onRemove(l.item.id)} className="text-red-500" aria-label="Remove">✕</button>
          </div>
        ))}
      </div>

      <div className="border-t mt-3 pt-3">
        <div className="flex justify-between text-xl font-bold">
          <span>Total</span>
          <span>{peso(total)}</span>
        </div>
        <button
          onClick={onCharge}
          disabled={lines.length === 0}
          className="mt-3 w-full bg-green-700 text-white rounded-lg py-3 font-semibold disabled:opacity-40"
        >
          Charge
        </button>
      </div>
    </div>
  )
}