import { useEffect, useMemo, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import { peso } from '../../lib/format'

type Day = { sale_date: string; transactions: number; dine_in: number; takeout: number; revenue: number }
type Item = { item_name: string; category_name: string | null; units_sold: number; revenue: number }
type Report = { from: string; to: string; days: Day[]; items: Item[]; error: string }

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'
const label = 'mb-2 block text-xs font-bold uppercase tracking-widest text-[#32343e]'
const field =
  'h-11 rounded-xl bg-field px-4 text-sm outline-none focus:ring-2 focus:ring-brand'

// en-CA prints dates as YYYY-MM-DD
const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Manila' })
const todayManila = () => dateFmt.format(new Date())

// Calendar-date maths on YYYY-MM-DD strings
function addDays(ymd: string, n: number) {
  const d = new Date(`${ymd}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

function presets(today: string) {
  const monthStart = `${today.slice(0, 8)}01`
  const lastEnd = addDays(monthStart, -1)
  return [
    { id: 'today', label: 'Today', from: today, to: today },
    { id: '7d', label: 'Last 7 days', from: addDays(today, -6), to: today },
    { id: 'month', label: 'This month', from: monthStart, to: today },
    { id: 'last', label: 'Last month', from: `${lastEnd.slice(0, 8)}01`, to: lastEnd },
  ]
}

const fmtDay = (ymd: string) =>
  new Date(`${ymd}T00:00:00Z`).toLocaleDateString('en-PH', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  })

const round2 = (n: number) => Math.round(n * 100) / 100

function csvCell(v: string | number) {
  let s = String(v)
  if (/^[=+\-@]/.test(s)) s = `'${s}` // stops spreadsheets from running text as a formula
  return `"${s.replace(/"/g, '""')}"`
}

export default function Reports() {
  const today = todayManila()
  const [from, setFrom] = useState(() => addDays(today, -6))
  const [to, setTo] = useState(today)
  const [tick, setTick] = useState(0)
  const [report, setReport] = useState<Report | null>(null)

  const span = from && to ? (Date.parse(to) - Date.parse(from)) / 86_400_000 + 1 : 0
  const invalid = !from || !to
    ? 'Pick both dates.'
    : from > to
      ? 'The start date must be on or before the end date.'
      : span > 366
        ? 'Pick a range of one year or less.'
        : ''

  useEffect(() => {
    if (invalid) return
    let cancelled = false
    Promise.all([
      supabase.rpc('report_daily', { p_from: from, p_to: to }),
      supabase.rpc('report_items', { p_from: from, p_to: to }),
    ]).then(([d, i]) => {
      if (cancelled) return
      setReport({
        from,
        to,
        days: ((d.data ?? []) as Day[]).map((r) => ({
          sale_date: r.sale_date,
          transactions: Number(r.transactions),
          dine_in: Number(r.dine_in),
          takeout: Number(r.takeout),
          revenue: Number(r.revenue),
        })),
        items: ((i.data ?? []) as Item[]).map((r) => ({
          item_name: r.item_name,
          category_name: r.category_name,
          units_sold: Number(r.units_sold),
          revenue: Number(r.revenue),
        })),
        error: (d.error ?? i.error)?.message ?? '',
      })
    })
    return () => {
      cancelled = true
    }
  }, [from, to, tick, invalid])

  const ready = !invalid && report !== null && report.from === from && report.to === to

  // One row per day, including days with no sales
  const rows = useMemo(() => {
    if (!report) return []
    const byDate = new Map<string, Day>()
    for (const d of report.days) byDate.set(d.sale_date, d)
    const out: Day[] = []
    for (let d = report.from; d <= report.to; d = addDays(d, 1)) {
      out.push(byDate.get(d) ?? { sale_date: d, transactions: 0, dine_in: 0, takeout: 0, revenue: 0 })
    }
    return out
  }, [report])

  const totals = useMemo(() => {
    const t = { transactions: 0, dine_in: 0, takeout: 0, revenue: 0 }
    for (const r of rows) {
      t.transactions += r.transactions
      t.dine_in += r.dine_in
      t.takeout += r.takeout
      t.revenue += r.revenue
    }
    const units = (report?.items ?? []).reduce((s, i) => s + i.units_sold, 0)
    return { ...t, revenue: round2(t.revenue), units }
  }, [rows, report])

  const activePreset = presets(today).find((p) => p.from === from && p.to === to)?.id

  function exportCsv() {
    if (!report) return
    const lines = [
      `${csvCell('Date')},${csvCell('Transactions')},${csvCell('Dine-in')},${csvCell('Takeout')},${csvCell('Revenue')}`,
      ...rows.map(
        (r) =>
          `${csvCell(r.sale_date)},${r.transactions},${r.dine_in},${r.takeout},${r.revenue.toFixed(2)}`
      ),
      `${csvCell('Total')},${totals.transactions},${totals.dine_in},${totals.takeout},${totals.revenue.toFixed(2)}`,
      '',
      `${csvCell('Item')},${csvCell('Category')},${csvCell('Units sold')},${csvCell('Revenue')}`,
      ...report.items.map(
        (i) =>
          `${csvCell(i.item_name)},${csvCell(i.category_name ?? '')},${i.units_sold},${i.revenue.toFixed(2)}`
      ),
    ]
    const blob = new Blob(['\uFEFF' + lines.join('\r\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `kapos-sales-${report.from}_to_${report.to}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const cards = [
    { label: 'Total revenue', value: ready ? peso(totals.revenue) : '—' },
    { label: 'Transactions', value: ready ? String(totals.transactions) : '—' },
    {
      label: 'Average order',
      value: ready ? (totals.transactions > 0 ? peso(round2(totals.revenue / totals.transactions)) : '—') : '—',
    },
    { label: 'Items sold', value: ready ? String(totals.units) : '—' },
  ]

  return (
    <Layout>
      <div className="flex flex-col gap-5 p-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Reports</h1>
            <p className="mt-1 text-muted">Daily sales report</p>
          </div>
          <button
            type="button"
            onClick={exportCsv}
            disabled={!ready || !!report?.error}
            className="h-13 rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97] disabled:opacity-40"
          >
            Export CSV
          </button>
        </header>

        <div className={`${card} flex flex-wrap items-end gap-4 p-5`}>
          <div className="flex flex-wrap gap-2">
            {presets(today).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setFrom(p.from)
                  setTo(p.to)
                }}
                className={`h-11 rounded-full border px-5 text-sm font-semibold transition-all active:scale-[0.95] ${
                  activePreset === p.id ? 'border-brand bg-brand text-navy' : 'border-[#d9dee7] bg-white hover:bg-[#f0f2f5] active:bg-[#e3e7ee]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-end gap-3">
            <div>
              <label htmlFor="from" className={label}>From</label>
              <input id="from" type="date" max={today} value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="to" className={label}>To</label>
              <input id="to" type="date" max={today} value={to} onChange={(e) => setTo(e.target.value)} className={field} />
            </div>
            <button
              type="button"
              onClick={() => setTick((t) => t + 1)}
              className="mb-3 text-xs font-bold tracking-wider text-brand-dark transition-colors hover:text-[#9a3412] active:text-[#7c2d12]"
            >
              REFRESH
            </button>
          </div>
        </div>

        {invalid && (
          <p role="alert" className="text-sm text-red-700">
            {invalid}
          </p>
        )}
        {report?.error && (
          <p role="alert" className="text-sm text-red-700">
            {report.error}
          </p>
        )}

        <div className="grid grid-cols-4 gap-4">
          {cards.map((c) => (
            <div key={c.label} className={`${card} p-5`}>
              <div className="truncate text-[34px] font-extrabold leading-tight">{c.value}</div>
              <div className="mt-2 text-xs font-bold uppercase tracking-widest text-muted">{c.label}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-[1.4fr_1fr] items-start gap-5">
          <div className={`${card} p-6`}>
            <b className="text-base">Daily sales</b>
            {!ready ? (
              <p className="mt-4 text-muted">{invalid ? '' : 'Loading…'}</p>
            ) : (
              <table className="mt-4 w-full border-collapse text-left">
                <thead>
                  <tr className="text-muted">
                    {['Date', 'Transactions', 'Dine-in', 'Takeout', 'Revenue'].map((h, i) => (
                      <th
                        key={h}
                        className={`border-b border-[#e3e7ee] pb-3 font-semibold ${i > 0 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.sale_date}
                      className={`border-b border-[#eef1f5] ${r.transactions === 0 ? 'text-muted' : ''}`}
                    >
                      <td className="py-3">{fmtDay(r.sale_date)}</td>
                      <td className="text-right">{r.transactions}</td>
                      <td className="text-right">{r.dine_in}</td>
                      <td className="text-right">{r.takeout}</td>
                      <td className="text-right font-semibold">{peso(r.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-extrabold">
                    <td className="pt-4">Total</td>
                    <td className="pt-4 text-right">{totals.transactions}</td>
                    <td className="pt-4 text-right">{totals.dine_in}</td>
                    <td className="pt-4 text-right">{totals.takeout}</td>
                    <td className="pt-4 text-right">{peso(totals.revenue)}</td>
                  </tr>
                </tfoot>
              </table>
            )}
          </div>

          <div className={`${card} p-6`}>
            <b className="text-base">Best sellers</b>
            {ready && (report?.items.length ?? 0) === 0 && (
              <p className="mt-4 text-muted">No sales in this period.</p>
            )}
            {ready && (report?.items.length ?? 0) > 0 && (
              <table className="mt-4 w-full border-collapse text-left">
                <thead>
                  <tr className="text-muted">
                    {['Item', 'Units', 'Revenue'].map((h, i) => (
                      <th
                        key={h}
                        className={`border-b border-[#e3e7ee] pb-3 font-semibold ${i > 0 ? 'text-right' : ''}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report?.items.map((i) => (
                    <tr key={i.item_name} className="border-b border-[#eef1f5]">
                      <td className="py-3">
                        <b>{i.item_name}</b>
                        {i.category_name && (
                          <div className="mt-1">
                            <span className="rounded-xl bg-peach px-3 py-1 text-xs font-bold text-[#b23b06]">
                              {i.category_name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="text-right">{i.units_sold}</td>
                      <td className="text-right font-semibold">{peso(i.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </Layout>
  )
}