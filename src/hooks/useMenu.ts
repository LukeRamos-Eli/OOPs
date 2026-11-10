import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Category, MenuItem } from '../types/database'

export function useMenu() {
  const [categories, setCategories] = useState<Category[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const [c, m] = await Promise.all([
        supabase.from('categories').select('*').order('name'),
        supabase.from('menu_items').select('*').eq('is_available', true).order('name'),
      ])
      const err = c.error ?? m.error
      if (err) setError(err.message)
      else {
        setCategories(c.data ?? [])
        setItems(m.data ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  return { categories, items, loading, error }
}