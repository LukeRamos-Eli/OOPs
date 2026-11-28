import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { peso } from '../../lib/format'

type Range = 'today' | '7d' | 'month'
type OrderRow = { total: number; completed_at: string }
type ItemRow = {
  qty: number
  menu_items: { name: string; categories: { name: string } | null } | null
}
type LowRow = { id: number; name: string; unit: string; stock_qty: number; min_stock: number }
type Bucket = { label: string; full: string; value: number }
type Data = {
  range: Range
  orders: OrderRow[]
  items: ItemRow[]
  low: LowRow[]
  buckets: Bucket[]
  error: string
}

const ranges: { id: Range; label: string; sub: string }[] = [
  { id: 'today', label: 'Today', sub: "Today's overview" },
  { id: '7d', label: 'Last 7 days', sub: 'Last 7 days' },
  { id: 'month', label: 'This month', sub: 'This month so far' },
]

const TZ = 'Asia/Manila'
const DAY = 86_400_000
const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'

const partsFmt = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
})

// Date and hour as they are in Manila, whatever time zone the computer is set to
function manila(d: Date) {
  const p: Record<string, string> = {}
  for (const part of partsFmt.formatToParts(d)) p[part.type] = part.value
  return { ymd: `${p.year}-${p.month}-${p.day}`, hour: Number(p.hour) }
}

function startOf(range: Range, now: Date) {
  const today = manila(now).ymd
  if (range === 'today') return new Date(`${today}T00:00:00+08:00`)
  if (range === '7d') {
    const first = manila(new Date(now.getTime() - 6 * DAY)).ymd
    return new Date(`${first}T00:00:00+08:00`)
  }
  return new Date(`${today.slice(0, 8)}01T00:00:00+08:00`)
}

function buildBuckets(range: Range, orders: OrderRow[], now: Date): Bucket[] {
  const rows = orders.map((o) => ({ total: o.total, ...manila(new Date(o.completed_at)) }))

  if (range === 'today') {
    const byHour = new Map<number, number>()
    for (const r of rows) byHour.set(r.hour, (byHour.get(r.hour) ?? 0) + r.total)
    const hours = [...byHour.keys()]
    const from = Math.min(8, ...hours)
    const to = Math.max(18, ...hours)
    return Array.from({ length: to - from + 1 }, (_, k) => {
      const h = from + k
      const label = `${h % 12 || 12}${h < 12 ? 'AM' : 'PM'}`
      return { label, full: label, value: byHour.get(h) ?? 0 }
    })
  }

  const byDay = new Map<string, number>()
  for (const r of rows) byDay.set(r.ymd, (byDay.get(r.ymd) ?? 0) + r.total)
  const today = manila(now).ymd
  const out: Bucket[] = []
  for (let t = startOf(range, now).getTime(); ; t += DAY) {
    const d = new Date(t)
    const day = manila(d).ymd
    if (day > today) break
    out.push({
      label:
        range === '7d'
          ? d.toLocaleDateString('en-US', { weekday: 'short', timeZone: TZ })
          : String(Number(day.slice(8))),
      full: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: TZ }),
      value: byDay.get(day) ?? 0,
    })
  }
  return out
}

async function fetchDashboard(range: Range): Promise<Data> {
  const now = new Date()
  const start = startOf(range, now).toISOString()

  const [o, i, l] = await Promise.all([
    supabase
      .from('orders')
      .select('total, completed_at')
      .eq('status', 'completed')
      .gte('completed_at', start),
    supabase
      .from('order_items')
      .select('qty, menu_items(name, categories(name)), orders!inner(status, completed_at)')
      .eq('orders.status', 'completed')
      .gte('orders.completed_at', start),
    supabase.from('low_stock').select('id, name, unit, stock_qty, min_stock').order('name'),
  ])

  const orders = ((o.data ?? []) as unknown as OrderRow[]).map((r) => ({
    total: Number(r.total),
    completed_at: r.completed_at,
  }))
  const low = ((l.data ?? []) as unknown as LowRow[]).map((r) => ({
    ...r,
    stock_qty: Number(r.stock_qty),
    min_stock: Number(r.min_stock),
  }))

  return {
    range,
    orders,
    items: (i.data ?? []) as unknown as ItemRow[],
    low,
    buckets: buildBuckets(range, orders, now),
    error: (o.error ?? i.error ?? l.error)?.message ?? '',
  }
}

function Chart({ buckets }: { buckets: Bucket[] }) {
  const [hover, setHover] = useState<number | null>(null)
  const n = buckets.length
  const max = Math.max(...buckets.map((b) => b.value), 0)
  const x = (i: number) => (n === 1 ? 310 : 12 + (i / (n - 1)) * 596)
  const y = (v: number) => 200 - (max === 0 ? 0 : (v / max) * 140)
  const line = `M${buckets.map((b, i) => `${x(i)} ${y(b.value)}`).join('L')}`
  const slot = n === 1 ? 620 : 596 / (n - 1)
  const m = Math.min(n, 7)
  const labels = Array.from(
    { length: m },
    (_, k) => buckets[Math.round((k * (n - 1)) / Math.max(m - 1, 1))].label
  )
  const h = hover === null ? null : buckets[hover]

  return (
    <>
      <svg
        role="img"
        aria-label="Revenue chart"
        viewBox="0 0 620 220"
        className="mt-2 min-h-52 w-full flex-1"
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff7621" stopOpacity="0.25" />
            <stop offset="1" stopColor="#ff7621" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={`${line}L${x(n - 1)} 220L${x(0)} 220Z`} fill="url(#rev)" />
        <path
          d={line}
          fill="none"
          stroke="#ff7621"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {max === 0 && (
          <text x="310" y="110" textAnchor="middle" fill="#5e6270" fontSize="14">
            No sales in this period
          </text>
        )}
        {buckets.map((_, i) => (
          <g key={i} onMouseEnter={() => setHover(i)}>
            <rect x={x(i) - slot / 2} y="0" width={slot} height="220" fill="transparent" />
          </g>
        ))}
        {hover !== null && h && (
          <>
            <line x1={x(hover)} y1={y(h.value)} x2={x(hover)} y2="220" stroke="#ff7621" strokeDasharray="4 4" />
            <circle cx={x(hover)} cy={y(h.value)} r="6" fill="#fff" stroke="#ff7621" strokeWidth="3" />
            <rect
              x={Math.min(Math.max(x(hover) - 55, 0), 510)}
              y={Math.max(y(h.value) - 56, 2)}
              width="110"
              height="42"
              rx="8"
              fill="#14141f"
            />
            <text
              x={Math.min(Math.max(x(hover), 55), 565)}
              y={Math.max(y(h.value) - 56, 2) + 16}
              fill="#c9ccd6"
              fontSize="11"
              textAnchor="middle"
            >
              {h.full}
            </text>
            <text
              x={Math.min(Math.max(x(hover), 55), 565)}
              y={Math.max(y(h.value) - 56, 2) + 33}
              fill="#fff"
              fontSize="13"
              fontWeight="700"
              textAnchor="middle"
            >
              {peso(h.value)}
            </text>
          </>
        )}
      </svg>
      <div className="flex justify-between text-xs text-muted">
        {labels.map((l, k) => (
          <span key={k}>{l}</span>
        ))}
      </div>
    </>
  )
}

export default function Dashboard() {
  const [range, setRange] = useState<Range>('today')
  const [tick, setTick] = useState(0)
  const [data, setData] = useState<Data | null>(null)

  useEffect(() => {
    let cancelled = false
    fetchDashboard(range).then((d) => {
      if (!cancelled) setData(d)
    })
    return () => {
      cancelled = true
    }
  }, [range, tick])

  const ready = data !== null && data.range === range

  const stats = useMemo(() => {
    const orders = data?.orders ?? []
    const sold = new Map<string, { units: number; category: string | null }>()
    for (const r of data?.items ?? []) {
      const name = r.menu_items?.name
      if (!name) continue
      const cur = sold.get(name) ?? { units: 0, category: r.menu_items?.categories?.name ?? null }
      cur.units += r.qty
      sold.set(name, cur)
    }
    return {
      sales: orders.reduce((s, o) => s + o.total, 0),
      count: orders.length,
      best: [...sold.entries()].sort((a, b) => b[1].units - a[1].units).slice(0, 3),
    }
  }, [data])

  const low = data?.low ?? []
  const cards = [
    { label: 'Total sales', value: ready ? peso(stats.sales) : '—' },
    { label: 'Transactions', value: ready ? String(stats.count) : '—' },
    { label: 'Best seller', value: ready ? (stats.best[0]?.[0] ?? '—') : '—' },
    { label: 'Low-stock items', value: ready ? String(low.length) : '—' },
  ]

  return (
    <Layout>
      <div className="flex min-h-full flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Dashboard</h1>
            <p className="mt-1 text-muted">{ranges.find((r) => r.id === range)?.sub}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {ranges.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={`h-11 rounded-full border px-4 text-sm font-semibold transition-all active:scale-[0.96] sm:px-5 ${
                  range === r.id ? 'border-brand bg-brand text-navy' : 'border-[#d9dee7] bg-white hover:bg-[#f0f2f5]'
                }`}
              >
                {r.label}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setTick((t) => t + 1)}
              className="ml-auto text-xs font-bold tracking-wider text-brand-dark transition-colors hover:text-[#9a3412] sm:ml-2"
            >
              REFRESH
            </button>
          </div>
        </header>

        {data?.error && (
          <p role="alert" className="text-sm text-red-700">
            {data.error}
          </p>
        )}

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {cards.map((c) => (
            <div key={c.label} className={`${card} p-4 sm:p-5`}>
              <div className="truncate text-2xl font-extrabold leading-tight sm:text-[34px]">{c.value}</div>
              <div className="mt-2 text-xs font-bold uppercase tracking-widest text-muted">
                {c.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-1 gap-5 lg:grid-cols-[1.7fr_1fr]">
          <div className={`${card} flex flex-col p-6`}>
            <div className="text-muted">Total revenue</div>
            <b className="text-2xl">{ready ? peso(stats.sales) : '—'}</b>
            {ready && data ? <Chart key={range} buckets={data.buckets} /> : <p className="mt-6 text-muted">Loading…</p>}
          </div>

          <div className="flex flex-col gap-5">
            <div className={`${card} p-6`}>
              <b className="text-base">Best sellers</b>
              {ready && stats.best.length === 0 && (
                <p className="mt-4 text-muted">No sales in this period yet.</p>
              )}
              {stats.best.map(([name, s]) => (
                <div key={name} className="mt-5 flex items-center gap-3">
                  <div className="flex-1">
                    <b>{name}</b>
                    {s.category && (
                      <div className="mt-1">
                        <span className="rounded-xl bg-peach px-3 py-1 text-xs font-bold text-[#b23b06]">
                          {s.category}
                        </span>
                      </div>
                    )}
                  </div>
                  <b>{s.units} sold</b>
                </div>
              ))}
            </div>

            <div className={`${card} p-6`}>
              <div className="flex items-center justify-between">
                <b className="text-base">Low stock</b>
                <Link to="/admin/inventory" className="text-xs font-bold tracking-wider text-brand-dark">
                  VIEW ALL
                </Link>
              </div>
              {ready && low.length === 0 && (
                <p className="mt-4 text-muted">Everything is above its minimum.</p>
              )}
              {low.slice(0, 5).map((r) => (
                <div key={r.id} className="mt-4 flex items-center justify-between gap-3">
                  <b>{r.name}</b>
                  <span className="rounded-xl bg-peach px-3 py-1 text-xs font-bold text-[#b23b06]">
                    {r.stock_qty} / {r.min_stock} {r.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}