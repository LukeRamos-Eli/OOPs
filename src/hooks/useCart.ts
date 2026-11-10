import { useMemo, useState } from 'react'
import type { CartLine, MenuItem } from '../types/database'

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])

  const add = (item: MenuItem) =>
    setLines((prev) => {
      const found = prev.find((l) => l.item.id === item.id)
      return found
        ? prev.map((l) => (l.item.id === item.id ? { ...l, qty: l.qty + 1 } : l))
        : [...prev, { item, qty: 1 }]
    })

  const setQty = (id: number, qty: number) =>
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.item.id !== id)
        : prev.map((l) => (l.item.id === id ? { ...l, qty } : l))
    )

  const remove = (id: number) => setLines((prev) => prev.filter((l) => l.item.id !== id))
  const clear = () => setLines([])

  const total = useMemo(
    () => Math.round(lines.reduce((s, l) => s + l.item.price * l.qty, 0) * 100) / 100,
    [lines]
  )

  return { lines, add, setQty, remove, clear, total }
}