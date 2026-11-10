import { useState } from 'react'
import type { Category, MenuItem } from '../../types/database'
import { peso } from '../../lib/format'

type Props = {
  categories: Category[]
  items: MenuItem[]
  onAdd: (item: MenuItem) => void
}

export default function MenuGrid({ categories, items, onAdd }: Props) {
  const [active, setActive] = useState<number | 'all'>('all')
  const visible = active === 'all' ? items : items.filter((i) => i.category_id === active)

  const tab = (isActive: boolean) =>
    `px-4 py-2 rounded-full text-sm font-medium border ${
      isActive ? 'bg-amber-800 text-white border-amber-800' : 'bg-white text-amber-900 border-amber-300'
    }`

  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-4">
        <button onClick={() => setActive('all')} className={tab(active === 'all')}>All</button>
        {categories.map((c) => (
          <button key={c.id} onClick={() => setActive(c.id)} className={tab(active === c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <p className="text-gray-500">No available items.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
          {visible.map((item) => (
            <button
              key={item.id}
              onClick={() => onAdd(item)}
              className="bg-white rounded-xl shadow p-4 text-left hover:ring-2 hover:ring-amber-500 active:scale-95 transition"
            >
              <div className="font-semibold text-amber-900">{item.name}</div>
              {item.description && (
                <div className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</div>
              )}
              <div className="mt-2 font-bold">{peso(item.price)}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}