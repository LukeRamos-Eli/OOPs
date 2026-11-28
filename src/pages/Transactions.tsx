import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import RefreshButton from '../components/RefreshButton'
import StateMessage from '../components/StateMessage'
import { TableSkeleton } from '../components/Skeleton'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'
import { peso } from '../lib/format'

type Status = 'completed' | 'cancelled' | 'all'
type One<T> = T | T[] | null
type Raw = {
  id: number
  order_type: 'dine_in' | 'takeout'
  status: string
  created_at: string
  completed_at: string | null
  profiles: One<{ full_name: string | null }>
  order_items: { qty: number; unit_price: number; menu_items: One<{ name: string }> }[]
  payments: One<{ amount_tendered: number; change_amount: number }>
}
type Line = { name: string; qty: number; price: number }
type Order = {
  id: number
  type: 'dine_in' | 'takeout'
  status: string
  at: string
  cashier: string
  lines: Line[]
  total: number
  tendered: number | null
  change: number | null
}
const NO_ORDERS: Order[] = []
type Result = { key: string; orders: Order[]; error: string }

const SELECT =
  'id, order_type, status, created_at, completed_at, profiles(full_name), order_items(qty, unit_price, menu_items(name)), payments(amount_tendered, change_amount)'

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'
const label = 'mb-2 block text-xs font-bold uppercase tracking-widest text-[#32343e]'
const field = 'h-11 rounded-xl bg-field px-4 text-sm outline-none focus:ring-2 focus:ring-brand'

const statuses: { id: Status; label: string }[] = [
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'all', label: 'All' },
]

// en-CA prints dates as YYYY-MM-DD
const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' })
const todayManila = () => dateFmt.format(new Date())

function addDays(ymd: string, n: number) {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

const when = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })

const one = <T,>(v: One<T>): T | null => (Array.isArray(v) ? (v[0] ?? null) : v)
const round2 = (n: number) => Math.round(n * 100) / 100
const typeLabel = (t: string) => (t === 'dine_in' ? 'Dine-in' : 'Takeout')

function toOrder(r: Raw): Order {
  const lines = r.order_items.map((i) => ({
    name: one(i.menu_items)?.name ?? 'Removed item',
    qty: i.qty,
    price: Number(i.unit_price),
  }))
  const pay = one(r.payments)
  return {
    id: r.id,
    type: r.order_type,
    status: r.status,
    at: r.completed_at ?? r.created_at,
    cashier: one(r.profiles)?.full_name ?? '—',
    lines,
    total: round2(lines.reduce((s, l) => s + l.price * l.qty, 0)),
    tendered: pay ? Number(pay.amount_tendered) : null,
    change: pay ? Number(pay.change_amount) : null,
  }
}

const statusTag = (s: string) =>
  s === 'completed' ? 'bg-[#e3f5ea] text-[#17663a]' : 'bg-[#e7eaf0] text-[#3f4350]'

export default function Transactions() {
  const { role } = useAuth()
  const isAdmin = role === 'admin'
  const today = todayManila()

  const [from, setFrom] = useState(today)
  const [to, setTo] = useState(today)
  const [status, setStatus] = useState<Status>('completed')
  const [limit, setLimit] = useState(100)
  const [tick, setTick] = useState(0)
  const [search, setSearch] = useState('')
  const [result, setResult] = useState<Result | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<Order | null>(null)

  const invalid = !from || !to ? 'Pick both dates.' : from > to ? 'The start date must be on or before the end date.' : ''
  const key = `${from}|${to}|${status}|${limit}`

  useEffect(() => {
    if (invalid) return
    let cancelled = false
    const start = new Date(`${from}T00:00:00+08:00`).toISOString()
    const end = new Date(`${addDays(to, 1)}T00:00:00+08:00`).toISOString()

    let q = supabase
      .from('orders')
      .select(SELECT)
      .gte('created_at', start)
      .lt('created_at', end)
      .order('created_at', { ascending: false })
      .limit(limit)
    q = status === 'all' ? q.in('status', ['completed', 'cancelled']) : q.eq('status', status)

    Promise.resolve(q).then(({ data, error }) => {
      if (!cancelled) {
        setResult((current) => ({
          key,
          orders: error && current?.key === key
            ? current.orders
            : ((data ?? []) as unknown as Raw[]).map(toOrder),
          error: error?.message ?? '',
        }))
      }
    }).catch(() => {
      if (!cancelled) {
        setResult((current) => ({
          key,
          orders: current?.key === key ? current.orders : [],
          error: 'Transactions could not be loaded. Please try again.',
        }))
      }
    }).finally(() => {
      if (!cancelled) setRefreshing(false)
    })
    return () => {
      cancelled = true
    }
  }, [from, to, status, limit, tick, key, invalid])

  const ready = !invalid && result?.key === key
  const orders = ready ? result.orders : NO_ORDERS
  const hasMore = ready && orders.length === limit

  const shown = useMemo(() => {
    const q = search.trim().replace(/^#/, '')
    return q ? orders.filter((o) => String(o.id).includes(q)) : orders
  }, [orders, search])

  const done = shown.filter((o) => o.status === 'completed')
  const doneTotal = round2(done.reduce((s, o) => s + o.total, 0))

  const presets = [
    { id: 'today', label: 'Today', from: today, to: today },
    { id: '7d', label: 'Last 7 days', from: addDays(today, -6), to: today },
    { id: 'month', label: 'This month', from: `${today.slice(0, 8)}01`, to: today },
  ]
  const activePreset = presets.find((p) => p.from === from && p.to === to)?.id

  function changeRange(f: string, t: string) {
    setFrom(f)
    setTo(t)
    setLimit(100)
  }

  return (
    <Layout>
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Transactions</h1>
            <p className="mt-1 text-muted">{isAdmin ? 'All orders' : 'Your orders'}</p>
          </div>
          <RefreshButton
            refreshing={refreshing}
            onClick={() => {
              setRefreshing(true)
              setTick((t) => t + 1)
            }}
          />
        </header>

        <div className={`${card} flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:flex-wrap lg:items-end`}>
          <div className="flex flex-wrap gap-2">
            {presets.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => changeRange(p.from, p.to)}
                className={`h-11 rounded-full border px-4 text-sm font-semibold transition-all active:scale-[0.95] sm:px-5 ${
                  activePreset === p.id ? 'border-brand bg-brand text-navy' : 'border-[#d9dee7] bg-white hover:bg-[#f0f2f5] active:bg-[#e3e7ee]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-end gap-3 lg:ml-auto">
            <div className="min-w-[130px] flex-1 sm:flex-initial">
              <label htmlFor="tfrom" className={label}>From</label>
              <input id="tfrom" type="date" max={today} value={from} onChange={(e) => changeRange(e.target.value, to)} className={`${field} w-full sm:w-auto`} />
            </div>
            <div className="min-w-[130px] flex-1 sm:flex-initial">
              <label htmlFor="tto" className={label}>To</label>
              <input id="tto" type="date" max={today} value={to} onChange={(e) => changeRange(from, e.target.value)} className={`${field} w-full sm:w-auto`} />
            </div>
            <div className="w-28">
              <label htmlFor="tsearch" className={label}>Order #</label>
              <input
                id="tsearch"
                inputMode="numeric"
                placeholder="e.g. 12"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`${field} w-full placeholder:text-[#6b6e7c]`}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-[#e3e7ee] pb-2 sm:flex-row sm:items-center sm:justify-between sm:pb-0">
          <div className="flex gap-6 overflow-x-auto sm:gap-8">
            {statuses.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => {
                  setStatus(s.id)
                  setLimit(100)
                }}
                className={`whitespace-nowrap py-3 font-semibold transition-colors ${
                  status === s.id ? 'border-b-[3px] border-brand text-navy' : 'text-muted hover:text-navy'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
          {ready && (
            <p className="text-sm text-muted">
              {done.length} completed · {peso(doneTotal)}
              {hasMore && ' (rows shown so far)'}
            </p>
          )}
        </div>

        {invalid && (
          <p role="alert" className="text-sm text-red-700">
            {invalid}
          </p>
        )}
        {ready && result.error && orders.length > 0 && (
          <p role="alert" className="text-sm text-red-700">
            Could not refresh transactions. Showing the most recently loaded results.
          </p>
        )}
        <div className={`${card} p-4 sm:p-6`}>
          {!ready ? (
            invalid ? null : (
              <div className="overflow-x-auto">
                <div className="min-w-[720px]">
                  <TableSkeleton
                    label="Loading transactions…"
                    rows={5}
                    columns={isAdmin ? 8 : 7}
                    columnWidths={
                      isAdmin
                        ? ['0.6fr', '1.4fr', '0.8fr', '1fr', '1.8fr', '0.9fr', '0.9fr', '0.5fr']
                        : ['0.6fr', '1.4fr', '0.8fr', '2fr', '0.9fr', '0.9fr', '0.5fr']
                    }
                  />
                </div>
              </div>
            )
          ) : result?.error && orders.length === 0 ? (
            <StateMessage
              variant="error"
              title="Transactions unavailable"
              description="We couldn't retrieve these transactions. Please refresh and try again."
            />
          ) : shown.length === 0 ? (
            <StateMessage
              title={search.trim() ? 'No matching transactions' : 'No transactions found'}
              description={
                search.trim()
                  ? 'Try another order number or clear your search.'
                  : 'There are no transactions for the selected dates and status.'
              }
            />
          ) : (
            <div className="content-enter overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-left">
              <thead>
                <tr className="text-muted">
                  {['Order', 'Date & time', 'Type', ...(isAdmin ? ['Cashier'] : []), 'Items', 'Total', 'Status', ''].map(
                    (h, i) => (
                      <th
                        key={`${h}${i}`}
                        className={`border-b border-[#e3e7ee] pb-3 font-semibold ${h === 'Total' ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {shown.map((o) => (
                  <tr key={o.id} className="border-b border-[#eef1f5] last:border-0">
                    <td className="py-3 font-bold">#{o.id}</td>
                    <td>{when(o.at)}</td>
                    <td>{typeLabel(o.type)}</td>
                    {isAdmin && <td>{o.cashier}</td>}
                    <td className="max-w-56 truncate pr-4 text-muted">
                      {o.lines.map((l) => `${l.qty} × ${l.name}`).join(', ') || '—'}
                    </td>
                    <td className="text-right font-semibold">{peso(o.total)}</td>
                    <td className="pl-4">
                      <span className={`rounded-xl px-3 py-1 text-xs font-bold ${statusTag(o.status)}`}>
                        {o.status === 'completed' ? 'Completed' : 'Cancelled'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button
                        type="button"
                        onClick={() => setSelected(o)}
                        aria-label={`View order ${o.id}`}
                        className="text-xs font-bold tracking-wider text-brand-dark transition-colors hover:text-[#9a3412] active:text-[#7c2d12]"
                      >
                        VIEW
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          )}
          {hasMore && (
            <button
              type="button"
              onClick={() => setLimit((l) => l + 100)}
              className="mt-5 h-11 rounded-full border border-[#d9dee7] px-6 text-sm font-semibold transition-all hover:bg-[#f0f2f5] active:bg-[#e3e7ee] active:scale-[0.97]"
            >
              Load more
            </button>
          )}
        </div>
      </div>

      {selected && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Order ${selected.id}`}
          onClick={() => setSelected(null)}
          className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="modal-panel w-full max-w-sm rounded-3xl bg-white p-6 font-mono text-sm"
          >
            <div className="mb-3 text-center">
              <div className="text-lg font-bold">KaPOS</div>
              <div>Order #{selected.id}</div>
              <div className="text-xs text-muted">{when(selected.at)}</div>
              <div className="text-xs uppercase">
                {typeLabel(selected.type)} · {selected.status === 'completed' ? 'Completed' : 'Cancelled'}
              </div>
              <div className="text-xs text-muted">Cashier: {selected.cashier}</div>
            </div>

            <div className="space-y-1 border-t border-dashed border-[#c9ccd6] py-2">
              {selected.lines.length === 0 && <div className="text-muted">No items</div>}
              {selected.lines.map((l, i) => (
                <div key={i} className="flex justify-between">
                  <span>
                    {l.qty} × {l.name}
                  </span>
                  <span>{peso(l.price * l.qty)}</span>
                </div>
              ))}
            </div>

            <div className="space-y-1 border-t border-dashed border-[#c9ccd6] pt-2">
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>{peso(selected.total)}</span>
              </div>
              {selected.tendered !== null && (
                <>
                  <div className="flex justify-between">
                    <span>Cash</span>
                    <span>{peso(selected.tendered)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Change</span>
                    <span>{peso(selected.change ?? 0)}</span>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-4 h-13 w-full rounded-xl bg-brand font-sans text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97]"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}