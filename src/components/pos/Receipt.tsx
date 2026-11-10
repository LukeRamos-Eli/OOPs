import type { ReceiptData } from '../../types/database'
import { peso, formatDateTime } from '../../lib/format'

export default function Receipt({ data, onNewOrder }: { data: ReceiptData; onNewOrder: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 font-mono text-sm">
        <div className="text-center mb-3">
          <div className="text-lg font-bold">KaPOS</div>
          <div>Official Receipt</div>
          <div className="text-xs text-gray-500">
            Order #{data.orderId} · {formatDateTime(data.date)}
          </div>
          <div className="text-xs uppercase">{data.orderType === 'dine_in' ? 'Dine-in' : 'Takeout'}</div>
        </div>

        <div className="border-t border-dashed py-2 space-y-1">
          {data.lines.map((l) => (
            <div key={l.item.id} className="flex justify-between">
              <span>{l.qty} × {l.item.name}</span>
              <span>{peso(l.item.price * l.qty)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed pt-2 space-y-1">
          <div className="flex justify-between font-bold"><span>Total</span><span>{peso(data.total)}</span></div>
          <div className="flex justify-between"><span>Cash</span><span>{peso(data.tendered)}</span></div>
          <div className="flex justify-between"><span>Change</span><span>{peso(data.change)}</span></div>
        </div>

        <p className="text-center mt-3">Thank you!</p>

        <button onClick={onNewOrder} className="mt-4 w-full bg-amber-800 text-white rounded-lg py-2 font-semibold">
          New Order
        </button>
      </div>
    </div>
  )
}