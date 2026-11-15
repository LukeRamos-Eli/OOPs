import Layout from '../../components/Layout'

const ranges = ['Today', 'This week', 'This month']

const stats = [
  { value: '₱0,000', label: 'Total sales' },
  { value: '00', label: 'Transactions' },
  { value: 'Iced Coffee', label: 'Best seller' },
  { value: '02', label: 'Low-stock items' },
]

const sellers = [
  { name: 'Iced Coffee', category: 'Coffee' },
  { name: 'Tapsilog', category: 'Meals' },
  { name: 'Hot Latte', category: 'Coffee' },
]

const hours = ['10AM', '11AM', '12PM', '01PM', '02PM', '03PM', '04PM']

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'
const curve =
  'M0 170C40 160 60 120 100 130S160 90 200 120S260 140 300 90S380 60 420 110S500 130 540 70S590 50 620 30'

export default function Dashboard() {
  return (
    <Layout>
      <div className="flex min-h-full flex-col gap-5 p-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Dashboard</h1>
            <p className="mt-1 text-muted">Today&apos;s overview</p>
          </div>
          <div className="flex gap-2">
            {ranges.map((r, i) => (
              <button
                key={r}
                type="button"
                className={`h-11 rounded-full border px-5 text-sm font-semibold ${
                  i === 0 ? 'border-brand bg-brand text-navy' : 'border-[#d9dee7] bg-white'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </header>

        <div className="grid grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className={`${card} p-5`}>
              <div className="text-[34px] font-extrabold leading-tight">{s.value}</div>
              <div className="mt-2 text-xs font-bold uppercase tracking-widest text-muted">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        <div className="grid flex-1 grid-cols-[1.7fr_1fr] gap-5">
          <div className={`${card} flex flex-col p-6`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-muted">Total revenue</div>
                <b className="text-2xl">₱0,000.00</b>
              </div>
              <button type="button" className="text-xs font-bold tracking-wider text-brand-dark">
                SEE DETAILS
              </button>
            </div>

            <svg
              role="img"
              aria-label="Placeholder revenue chart"
              viewBox="0 0 620 220"
              className="mt-2 w-full flex-1"
            >
              <defs>
                <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#ff7621" stopOpacity="0.25" />
                  <stop offset="1" stopColor="#ff7621" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path d={`${curve}L620 220L0 220Z`} fill="url(#rev)" />
              <path d={curve} fill="none" stroke="#ff7621" strokeWidth="3" />
              <line x1="300" y1="90" x2="300" y2="220" stroke="#ff7621" strokeDasharray="4 4" />
              <circle cx="300" cy="90" r="6" fill="#fff" stroke="#ff7621" strokeWidth="3" />
              <rect x="262" y="40" width="76" height="32" rx="8" fill="#14141f" />
              <text x="300" y="61" fill="#fff" fontSize="13" fontWeight="700" textAnchor="middle">
                ₱0,000
              </text>
            </svg>

            <div className="flex justify-between text-xs text-muted">
              {hours.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </div>
          </div>

          <div className={`${card} p-6`}>
            <div className="flex items-center justify-between">
              <b className="text-base">Best sellers</b>
              <button type="button" className="text-xs font-bold tracking-wider text-brand-dark">
                SEE ALL
              </button>
            </div>
            {sellers.map((s) => (
              <div key={s.name} className="mt-5 flex items-center gap-3">
                <div className="flex-1">
                  <b>{s.name}</b>
                  <div className="mt-1">
                    <span className="rounded-xl bg-peach px-3 py-1 text-xs font-bold text-[#b23b06]">
                      {s.category}
                    </span>
                  </div>
                </div>
                <b>00 sold</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}