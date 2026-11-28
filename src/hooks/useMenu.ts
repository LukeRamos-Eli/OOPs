import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, PosItem } from '../types/database'

export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<PosItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const hasLoadedSuccessfully = useRef(false)
  const requestId = useRef(0)

  const load = useCallback(async () => {
    const request = ++requestId.current
    if (hasLoadedSuccessfully.current) setRefreshing(true)
    else setLoading(true)
    setError('')

    try {
      const [c, m, a] = await Promise.all([
        supabase.from('categories').select('id, name').order('name'),
        supabase
          .from('menu_items')
          .select('id, category_id, name, description, price, is_available, image_path, categories(name)')
          .order('name'),
        supabase.from('menu_availability').select('menu_item_id, max_servings, can_order'),
      ])
      if (request !== requestId.current) return

      const err = c.error ?? m.error ?? a.error
      if (err) {
        setError(
          hasLoadedSuccessfully.current
            ? 'Menu availability could not be refreshed.'
            : 'Menu items could not be loaded. Please try again.'
        )
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
            image_path: row.image_path ?? null,
            category: cat?.name ?? null,
            max_servings: s?.max_servings ?? null,
            can_order: s?.can_order ?? row.is_available,
          }
        })
      )
      setError('')
      hasLoadedSuccessfully.current = true
    } catch {
      if (request === requestId.current) {
        setError(
          hasLoadedSuccessfully.current
            ? 'Menu availability could not be refreshed.'
            : 'Menu items could not be loaded. Please try again.'
        )
      }
    } finally {
      if (request === requestId.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
    return () => {
      requestId.current += 1
    }
  }, [load])

  return { categories, items, loading, refreshing, error, reload: load }
}
