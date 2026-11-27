import { useMemo, useState } from 'react'
import Layout from '../components/Layout'
import PaymentModal from '../components/pos/PaymentModal'
import Receipt from '../components/pos/Receipt'
import { useMenu } from '../hooks/useMenu'
import { useCart } from '../hooks/useCart'
import { supabase } from '../lib/supabase'
import { peso } from '../lib/format'
import { imageUrl } from '../lib/images'
import type { OrderType, PosItem, ReceiptData } from '../types/database'

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'

function friendlyError(e: unknown) {
  const msg = (e as { message?: string }).message ?? 'Checkout failed'
  if (msg.includes('ingredients_stock_qty_check'))
    return 'Not enough stock for this order. Reduce a quantity or remove an item.'
  if (msg.includes('unavailable')) return 'An item in this order is no longer available.'
  return msg
}

export default function Pos() {
  const { categories, items, loading, error, reload } = useMenu()
  const { lines, add, setQty, clear, total } = useCart()
  const [active, setActive] = useState<number | 'all'>('all')
  const [search, setSearch] = useState('')
  const [orderType, setOrderType] = useState<OrderType>('dine_in')
  const [showPayment, setShowPayment] = useState(false)
  const [busy, setBusy] = useState(false)
  const [payError, setPayError] = useState('')
  const [notice, setNotice] = useState('')
  const [receipt, setReceipt] = useState<ReceiptData | null>(null)

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase()
    return items.filter(
      (i) =>
        (active === 'all' || i.category_id === active) &&
        (!q || i.name.toLowerCase().includes(q))
    )
  }, [items, active, search])

  const warn = (item: PosItem, ok: boolean) =>
    setNotice(ok ? '' : `Only ${item.max_servings ?? 0} available for ${item.name}.`)

  async function checkout(tendered: number) {
    setBusy(true)
    setPayError('')
    let orderId: number | null = null

    try {
      const { data: order, error: oErr } = await supabase
        .from('orders')
        .insert({ order_type: orderType })
        .select('id')
        .single()
      if (oErr) throw oErr
      orderId = order.id as number

      const { error: iErr } = await supabase.from('order_items').insert(
        lines.map((l) => ({ order_id: orderId, menu_item_id: l.item.id, qty: l.qty }))
      )
      if (iErr) throw iErr

      const { data: payment, error: pErr } = await supabase.rpc('complete_order', {
        p_order_id: orderId,
        p_amount_tendered: tendered,
      })
      if (pErr) throw pErr

      setReceipt({
        orderId,
        orderType,
        lines,
        total,
        tendered: Number(payment.amount_tendered),
        change: Number(payment.change_amount),
        date: payment.created_at,
      })
      clear()
      setNotice('')
      setShowPayment(false)
      reload() // stock changed, so refresh availability
    } catch (e) {
      // Don't leave a half-made order open
      if (orderId) await supabase.from('orders').update({ status: 'cancelled' }).eq('id', orderId)
      setPayError(friendlyError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Layout>
      <div className="grid grid-cols-[1fr_380px] gap-6 p-8">
        <section className="flex flex-col gap-5">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">New order</h1>
              <p className="mt-1 text-muted">Tap an item to add it</p>
            </div>
            <input
              type="search"
              placeholder="Search menu"
              aria-label="Search menu"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-13 w-64 rounded-xl bg-field px-4 text-sm outline-none placeholder:text-[#6b6e7c] focus:ring-2 focus:ring-brand"
            />
          </header>

          <div className="flex flex-wrap gap-2">
            {[{ id: 'all' as const, name: 'All' }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setActive(c.id)}
                className={`h-11 rounded-full border px-5 text-sm font-semibold ${
                  active === c.id ? 'border-brand bg-brand text-navy' : 'border-[#d9dee7] bg-white'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

          {loading && <p className="text-muted">Loading menu…</p>}
          {error && <p role="alert" className="text-red-700">{error}</p>}
          {!loading && !error && items.length === 0 && (
            <p className="text-muted">No menu items yet. An admin can add them under Menu.</p>
          )}

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {visible.map((item) => (
              <button
                key={item.id}
                type="button"
                disabled={!item.can_order}
                onClick={() => warn(item, add(item))}
                className={`${card} flex flex-col gap-2 p-4 text-left ${
                  item.can_order ? 'hover:ring-2 hover:ring-brand' : 'opacity-60'
                }`}
              >
                {item.image_path && (
                  <img
                    src={imageUrl(item.image_path) ?? ''}
                    alt=""
                    loading="lazy"
                    className="aspect-[4/3.3] w-full rounded-2xl object-cover"
                  />
                )}
                <div className="flex items-center gap-2">
                  {item.category && (
                    <span className="rounded-xl bg-peach px-3 py-1 text-xs font-bold text-[#b23b06]">
                      {item.category}
                    </span>
                  )}
                  {!item.can_order && (
                    <span className="rounded-xl bg-[#e7eaf0] px-3 py-1 text-xs font-bold text-[#3f4350]">
                      {item.is_available ? 'Out of stock' : 'Unavailable'}
                    </span>
                  )}
                </div>
                <b className="text-base">{item.name}</b>
                <span className="text-xs text-muted">{item.description}</span>
                <div className="mt-2 flex items-center justify-between">
                  <b className="text-base">{peso(item.price)}</b>
                  <span
                    aria-hidden="true"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-navy"
                  >
                    +
                  </span>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside
          className={`${card} sticky top-8 flex h-[calc(100vh-4rem)] flex-col gap-4 overflow-hidden pt-6`}
        >
          <div className="flex items-center justify-between px-6">
            <h2 className="text-lg font-extrabold">Current order</h2>
            <button
              type="button"
              onClick={() => {
                clear()
                setNotice('')
              }}
              className="text-xs font-bold tracking-wider text-brand-dark"
            >
              CLEAR
            </button>
          </div>

          <div className="flex gap-2 px-6">
            {([['dine_in', 'Dine-in'], ['takeout', 'Takeout']] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setOrderType(value)}
                className={`h-11 flex-1 rounded-full border text-sm font-semibold ${
                  orderType === value ? 'border-brand bg-brand text-navy' : 'border-[#d9dee7] bg-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {notice && (
            <p role="status" className="px-6 text-sm text-[#8a2f04]">
              {notice}
            </p>
          )}

          <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-6">
            {lines.length === 0 && <p className="text-muted">The cart is empty.</p>}
            {lines.map((l) => (
              <div key={l.item.id} className="flex items-center gap-3">
                <div className="flex-1">
                  <b>{l.item.name}</b>
                  <div className="text-muted">{peso(l.item.price)}</div>
                </div>
                <div className="flex items-center gap-3 rounded-full bg-navy p-1 text-white">
                  <button
                    type="button"
                    aria-label={`Decrease ${l.item.name}`}
                    onClick={() => setQty(l.item.id, l.qty - 1)}
                    className="h-10 w-10 rounded-full bg-[#32343e]"
                  >
                    −
                  </button>
                  <b>{l.qty}</b>
                  <button
                    type="button"
                    aria-label={`Increase ${l.item.name}`}
                    onClick={() => warn(l.item, setQty(l.item.id, l.qty + 1))}
                    className="h-10 w-10 rounded-full bg-[#32343e]"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4 rounded-t-[20px] bg-field px-6 pb-6 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-muted">Total</span>
              <b className="text-3xl">{peso(total)}</b>
            </div>
            <button
              type="button"
              disabled={lines.length === 0}
              onClick={() => {
                setPayError('')
                setShowPayment(true)
              }}
              className="h-13 rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-navy disabled:opacity-40"
            >
              Charge
            </button>
          </div>
        </aside>
      </div>

      {showPayment && (
        <PaymentModal
          total={total}
          busy={busy}
          error={payError}
          onConfirm={checkout}
          onClose={() => setShowPayment(false)}
        />
      )}
      {receipt && <Receipt data={receipt} onNewOrder={() => setReceipt(null)} />}
    </Layout>
  )
}