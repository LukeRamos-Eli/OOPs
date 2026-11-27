import type { ReceiptData } from '../../types/database'
import { peso, formatDateTime } from '../../lib/format'

export default function Receipt({
  data,
  onNewOrder,
}: {
  data: ReceiptData
  onNewOrder: () => void
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Receipt"
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
    >
      <div className="w-full max-w-sm rounded-3xl bg-white p-6 font-mono text-sm">
        <div className="mb-3 text-center">
          <div className="text-lg font-bold">KaPOS</div>
          <div>Official Receipt</div>
          <div className="text-xs text-muted">
            Order #{data.orderId} · {formatDateTime(data.date)}
          </div>
          <div className="text-xs uppercase">
            {data.orderType === 'dine_in' ? 'Dine-in' : 'Takeout'}
          </div>
        </div>

        <div className="space-y-1 border-t border-dashed border-[#c9ccd6] py-2">
          {data.lines.map((l) => (
            <div key={l.item.id} className="flex justify-between">
              <span>
                {l.qty} × {l.item.name}
              </span>
              <span>{peso(l.item.price * l.qty)}</span>
            </div>
          ))}
        </div>

        <div className="space-y-1 border-t border-dashed border-[#c9ccd6] pt-2">
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span>{peso(data.total)}</span>
          </div>
          <div className="flex justify-between">
            <span>Cash</span>
            <span>{peso(data.tendered)}</span>
          </div>
          <div className="flex justify-between">
            <span>Change</span>
            <span>{peso(data.change)}</span>
          </div>
        </div>

        <p className="mt-3 text-center">Thank you!</p>

        <button
          type="button"
          onClick={onNewOrder}
          className="mt-4 h-13 w-full rounded-xl bg-brand font-sans text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97]"
        >
          New order
        </button>
      </div>
    </div>
  )
}
