import Layout from '../../components/Layout'

const tabs = ['All', 'Low stock', 'In stock']

const ingredients = [
  { abbr: 'CB', name: 'Coffee beans', unit: 'g', stock: 1000, min: 200 },
  { abbr: 'Mi', name: 'Milk', unit: 'ml', stock: 2000, min: 500 },
  { abbr: 'BT', name: 'Beef tapa', unit: 'g', stock: 280, min: 300 },
  { abbr: 'Ri', name: 'Rice', unit: 'g', stock: 5000, min: 1000 },
  { abbr: 'Eg', name: 'Egg', unit: 'pc', stock: 10, min: 12 },
]

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'

export default function Inventory() {
  const low = ingredients.filter((i) => i.stock <= i.min)

  return (
    <Layout>
      <div className="flex flex-col gap-5 p-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Inventory</h1>
            <p className="mt-1 text-muted">
              Total {String(ingredients.length).padStart(2, '0')} ingredients
            </p>
          </div>
          <button
            type="button"
            className="h-13 rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy"
          >
            + Add ingredient
          </button>
        </header>

        {low.length > 0 && (
          <div className="rounded-[20px] bg-peach px-6 py-4 text-[#8a2f04]">
            <b>
              {low.length} ingredients are at or below minimum stock:
            </b>{' '}
            {low.map((i) => i.name).join(', ')}
          </div>
        )}

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

        <div className={`${card} p-6`}>
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-muted">
                {['Ingredient', 'In stock', 'Minimum', 'Status', ''].map((h) => (
                  <th key={h} className="border-b border-[#e3e7ee] pb-3 font-semibold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ingredients.map((i) => {
                const isLow = i.stock <= i.min
                return (
                  <tr key={i.name} className="border-b border-[#eef1f5] last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-peach text-[13px] font-extrabold text-[#b23b06]">
                          {i.abbr}
                        </span>
                        <b>{i.name}</b>
                      </div>
                    </td>
                    <td>{i.stock} {i.unit}</td>
                    <td>{i.min} {i.unit}</td>
                    <td>
                      <span
                        className={`rounded-xl px-3 py-1 text-xs font-bold ${
                          isLow ? 'bg-peach text-[#b23b06]' : 'bg-[#e3f5ea] text-[#17663a]'
                        }`}
                      >
                        {isLow ? 'Low stock' : 'OK'}
                      </span>
                    </td>
                    <td className="text-right">
                      <button type="button" className="text-xs font-bold tracking-wider text-brand-dark">
                        EDIT
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  )
}