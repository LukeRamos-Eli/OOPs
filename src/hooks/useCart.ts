import { useMemo, useState } from 'react'
import type { CartLine, PosItem } from '../types/database'

const overStock = (item: PosItem, qty: number) =>
  !item.can_order || (item.max_servings !== null && qty > item.max_servings)

export function useCart() {
  const [lines, setLines] = useState<CartLine[]>([])

  // Both return false when the stock can't cover the quantity
  const add = (item: PosItem): boolean => {
    const existing = lines.find((l) => l.item.id === item.id)
    const qty = (existing?.qty ?? 0) + 1
    if (overStock(item, qty)) return false
    setLines(
      existing
        ? lines.map((l) => (l.item.id === item.id ? { ...l, qty } : l))
        : [...lines, { item, qty }]
    )
    return true
  }

  const setQty = (id: number, qty: number): boolean => {
    const line = lines.find((l) => l.item.id === id)
    if (!line) return true
    if (qty <= 0) {
      setLines(lines.filter((l) => l.item.id !== id))
      return true
    }
    if (overStock(line.item, qty)) return false
    setLines(lines.map((l) => (l.item.id === id ? { ...l, qty } : l)))
    return true
  }

  const clear = () => setLines([])

  const total = useMemo(
    () => Math.round(lines.reduce((s, l) => s + l.item.price * l.qty, 0) * 100) / 100,
    [lines]
  )

  return { lines, add, setQty, clear, total }
}
