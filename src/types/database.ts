export type Category = { id: number; name: string }

export type MenuItem = {
  id: number
  category_id: number | null
  name: string
  description: string | null
  price: number
  is_available: boolean
  image_path: string | null
}

// A menu item as the POS sees it: with its category and what the stock allows
export type PosItem = MenuItem & {
  category: string | null
  max_servings: number | null // null = no recipe, so no stock limit
  can_order: boolean
}

export type Ingredient = {
  id: number
  name: string
  unit: string
  stock_qty: number
  min_stock: number
}

export type OrderType = 'dine_in' | 'takeout'

export type CartLine = { item: PosItem; qty: number }

export type ReceiptData = {
  orderId: number
  orderType: OrderType
  lines: CartLine[]
  total: number
  tendered: number
  change: number
  date: string
}
