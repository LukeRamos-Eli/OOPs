import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, PosItem } from '../types/database'

export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<PosItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const [c, m, a] = await Promise.all([
      supabase.from('categories').select('id, name').order('name'),
      supabase
        .from('menu_items')
        .select('id, category_id, name, description, price, is_available, categories(name)')
        .order('name'),
      supabase.from('menu_availability').select('menu_item_id, max_servings, can_order'),
    ])

    const err = c.error ?? m.error ?? a.error
    if (err) {
      setError(err.message)
      setLoading(false)
      return
    }

    const stock = new Map<number, { max_servings: number | null; can_order: boolean }>()
    for (const r of a.data ?? []) stock.set(r.menu_item_id, r)

    setCategories(c.data ?? [])
    setItems(
      (m.data ?? []).map((row) => {
        const s = stock.get(row.id)
        const cat = row.categories as unknown as { name: string } | null
        return {
          id: row.id,
          category_id: row.category_id,
          name: row.name,
          description: row.description,
          price: Number(row.price),
          is_available: row.is_available,
          category: cat?.name ?? null,
          max_servings: s?.max_servings ?? null,
          can_order: s?.can_order ?? row.is_available,
        }
      })
    )
    setError('')
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return { categories, items, loading, error, reload: load }
}
