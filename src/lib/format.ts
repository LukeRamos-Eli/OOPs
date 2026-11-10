export const peso = (n: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(n)

export const formatDateTime = (d: Date | string) =>
  new Date(d).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })