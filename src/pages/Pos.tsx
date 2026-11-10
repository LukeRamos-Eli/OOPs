import Layout from '../components/Layout'

const categories = ['All', 'Coffee', 'Meals', 'Desserts']

const items = [
  { name: 'Iced Coffee', category: 'Coffee', desc: 'Cold brew over ice', price: '₱90.00' },
  { name: 'Tapsilog', category: 'Meals', desc: 'Beef tapa, garlic rice, egg', price: '₱120.00' },
  { name: 'Hot Latte', category: 'Coffee', desc: 'Espresso with steamed milk', price: '₱110.00' },
  { name: 'Longsilog', category: 'Meals', desc: 'Longganisa, garlic rice, egg', price: '₱130.00' },
  { name: 'Halo-halo', category: 'Desserts', desc: 'Shaved ice dessert', price: '₱95.00' },
  { name: 'Leche Flan', category: 'Desserts', desc: 'Caramel custard', price: '₱60.00' },
]

const cart = [
  { name: 'Iced Coffee', price: '₱90.00', qty: 2 },
  { name: 'Tapsilog', price: '₱120.00', qty: 1 },
]

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'

export default function Pos() {
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
              className="h-13 w-64 rounded-xl bg-field px-4 text-sm outline-none placeholder:text-[#6b6e7c] focus:ring-2 focus:ring-brand"
            />
          </header>

          <div className="flex gap-2">
            {categories.map((c, i) => (
              <button
                key={c}
                type="button"
                className={`h-11 rounded-full border px-5 text-sm font-semibold ${
                  i === 0
                    ? 'border-brand bg-brand text-navy'
                    : 'border-[#d9dee7] bg-white'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            {items.map((item) => (
              <div key={item.name} className={`${card} flex flex-col gap-2 p-4`}>
                <span className="w-fit rounded-xl bg-peach px-3 py-1 text-xs font-bold text-[#b23b06]">
                  {item.category}
                </span>
                <b className="text-base">{item.name}</b>
                <span className="text-xs text-muted">{item.desc}</span>
                <div className="mt-2 flex items-center justify-between">
                  <b className="text-base">{item.price}</b>
                  <button
                    type="button"
                    aria-label={`Add ${item.name}`}
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-brand text-xl font-extrabold text-navy"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <aside className={`${card} sticky top-8 flex h-[calc(100vh-4rem)] flex-col gap-4 overflow-hidden pt-6`}>
          <div className="flex items-center justify-between px-6">
            <h2 className="text-lg font-extrabold">Current order</h2>
            <button type="button" className="text-xs font-bold tracking-wider text-brand-dark">
              CLEAR
            </button>
          </div>

          <div className="flex gap-2 px-6">
            <button type="button" className="h-11 flex-1 rounded-full border border-brand bg-brand text-sm font-semibold text-navy">
              Dine-in
            </button>
            <button type="button" className="h-11 flex-1 rounded-full border border-[#d9dee7] bg-white text-sm font-semibold">
              Takeout
            </button>
          </div>

          <div className="flex flex-col gap-4 px-6">
            {cart.map((line) => (
              <div key={line.name} className="flex items-center gap-3">
                <div className="flex-1">
                  <b>{line.name}</b>
                  <div className="text-muted">{line.price}</div>
                </div>
                <div className="flex items-center gap-3 rounded-full bg-navy p-1 text-white">
                  <button type="button" aria-label="Decrease" className="h-10 w-10 rounded-full bg-[#32343e]">−</button>
                  <b>{line.qty}</b>
                  <button type="button" aria-label="Increase" className="h-10 w-10 rounded-full bg-[#32343e]">+</button>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto flex flex-col gap-4 rounded-t-[20px] bg-field px-6 pb-6 pt-5">
            <div className="flex items-center justify-between">
              <span className="text-muted">Total</span>
              <b className="text-3xl">₱300.00</b>
            </div>
            <button
              type="button"
              className="h-13 rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-navy"
            >
              Charge
            </button>
          </div>
        </aside>
      </div>
    </Layout>
  )
}