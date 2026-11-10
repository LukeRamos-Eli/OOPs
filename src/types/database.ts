export type Category = { id: number; name: string }

export type MenuItem = {
  id: number
  category_id: number | null
  name: string
  description: string | null
  price: number
  is_available: boolean
}

export type OrderType = 'dine_in' | 'takeout'

export type CartLine = { item: MenuItem; qty: number }

export type ReceiptData = {
  orderId: number
  orderType: OrderType
  lines: CartLine[]
  total: number
  tendered: number
  change: number
  date: string
}