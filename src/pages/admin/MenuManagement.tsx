import Layout from '../../components/Layout'

const tabs = ['All', 'Coffee', 'Meals', 'Desserts']

const items = [
  { name: 'Iced Coffee', category: 'Coffee', price: '₱90.00', available: true },
  { name: 'Tapsilog', category: 'Meals', price: '₱120.00', available: true },
  { name: 'Hot Latte', category: 'Coffee', price: '₱110.00', available: true },
  { name: 'Halo-halo', category: 'Desserts', price: '₱95.00', available: true },
  { name: 'Leche Flan', category: 'Desserts', price: '₱60.00', available: false },
]

const ingredients = [
  { abbr: 'CB', name: 'Coffee beans', selected: true },
  { abbr: 'Mi', name: 'Milk', selected: true },
  { abbr: 'BT', name: 'Beef tapa', selected: false },
  { abbr: 'Ri', name: 'Rice', selected: false },
  { abbr: 'Eg', name: 'Egg', selected: false },
]

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'
const label = 'mb-2 block text-xs font-bold uppercase tracking-widest text-[#32343e]'
const field =
  'h-11 w-full rounded-xl bg-field px-4 text-sm outline-none placeholder:text-[#6b6e7c] focus:ring-2 focus:ring-brand'

export default function MenuManagement() {
  return (
    <Layout>
      <div className="grid grid-cols-[1fr_400px] gap-6 p-8">
        <section className="flex flex-col gap-5">
          <header className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">Menu</h1>
              <p className="mt-1 text-muted">Total 05 items</p>
            </div>
            <button
              type="button"
              className="h-13 rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy"
            >
              + Add item
            </button>
          </header>

          <div className="flex gap-8 border-b border-[#e3e7ee]">
            {tabs.map((t, i) => (
              <button
                key={t}
                type="button"
                className={`py-3 font-semibold ${
                  i === 0 ? 'border-b-[3px] border-brand text-navy' : 'text-muted'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className={`${card} px-6 py-2`}>
            {items.map((item) => (
              <div
                key={item.name}
                className="flex items-center gap-4 border-b border-[#eef1f5] py-4 last:border-0"
              >
                <div className="flex-1">
                  <b>{item.name}</b>
                  <div className="mt-1.5">
                    <span className="rounded-xl bg-peach px-3 py-1 text-xs font-bold text-[#b23b06]">
                      {item.category}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-xl px-3 py-1 text-xs font-bold ${
                    item.available
                      ? 'bg-[#e3f5ea] text-[#17663a]'
                      : 'bg-[#e7eaf0] text-[#3f4350]'
                  }`}
                >
                  {item.available ? 'Available' : 'Unavailable'}
                </span>
                <b className="w-20 text-right">{item.price}</b>
                <button type="button" className="text-xs font-bold tracking-wider text-brand-dark">
                  EDIT
                </button>
              </div>
            ))}
          </div>
        </section>

        <aside className={`${card} sticky top-8 flex flex-col gap-3 self-start p-5`}>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">Add New Item</h2>
            <button type="button" className="text-xs font-bold tracking-wider text-brand-dark">
              RESET
            </button>
          </div>

          <div>
            <label htmlFor="name" className={label}>Item name</label>
            <input id="name" className={field} placeholder="e.g. Iced Coffee" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="price" className={label}>Price (₱)</label>
              <input id="price" type="number" className={field} placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="category" className={label}>Category</label>
              <select id="category" className={field}>
                <option>Coffee</option>
                <option>Meals</option>
                <option>Desserts</option>
              </select>
            </div>
          </div>

          <div>
            <span className={label}>Ingredients used</span>
            <div className="flex justify-between">
              {ingredients.map((ing) => (
                <button
                  key={ing.name}
                  type="button"
                  aria-pressed={ing.selected}
                  className="flex flex-col items-center gap-1 text-[11px] text-muted"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-extrabold ${
                      ing.selected
                        ? 'border-2 border-brand bg-peach text-[#b23b06]'
                        : 'border border-[#d9dee7] bg-white text-muted'
                    }`}
                  >
                    {ing.abbr}
                  </span>
                  {ing.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="q1" className={label}>Coffee beans (g)</label>
              <input id="q1" className={field} placeholder="18" />
            </div>
            <div>
              <label htmlFor="q2" className={label}>Milk (ml)</label>
              <input id="q2" className={field} placeholder="120" />
            </div>
          </div>

          <div>
            <label htmlFor="details" className={label}>Details</label>
            <textarea id="details" className={`${field} h-16 py-3`} placeholder="Short description" />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked className="h-5 w-5 accent-brand" />
            Available for ordering
          </label>

          <button
            type="button"
            className="h-13 rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-navy"
          >
            Save changes
          </button>
        </aside>
      </div>
    </Layout>
  )
}