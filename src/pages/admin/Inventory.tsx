import { useCallback, useEffect, useState } from 'react'
import Layout from '../../components/Layout'
import { supabase } from '../../lib/supabase'
import type { Ingredient } from '../../types/database'

const tabs = ['All', 'Low stock', 'In stock'] as const
const units = ['g', 'kg', 'ml', 'l', 'pc']
const empty = { name: '', unit: 'g', stock: '', min: '' }

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'
const label = 'mb-2 block text-xs font-bold uppercase tracking-widest text-[#32343e]'
const field =
  'h-11 w-full rounded-xl bg-field px-4 text-sm outline-none placeholder:text-[#6b6e7c] focus:ring-2 focus:ring-brand'

export default function Inventory() {
  const [rows, setRows] = useState<Ingredient[]>([])
  const [tab, setTab] = useState<(typeof tabs)[number]>('All')
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('ingredients').select('*').order('name')
    if (error) {
      setError(error.message)
      return
    }
    setRows(
      (data ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        unit: r.unit,
        stock_qty: Number(r.stock_qty),
        min_stock: Number(r.min_stock),
      }))
    )
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load()
  }, [load])

  function openNew() {
    setForm(empty)
    setEditingId(null)
    setError('')
    setShowForm(true)
  }

  function openEdit(r: Ingredient) {
    setForm({ name: r.name, unit: r.unit, stock: String(r.stock_qty), min: String(r.min_stock) })
    setEditingId(r.id)
    setError('')
    setShowForm(true)
  }

  async function save() {
    setError('')
    const name = form.name.trim()
    const stock = Number(form.stock)
    const min = Number(form.min)
    if (!name) return setError('Ingredient name is required.')
    if (form.stock === '' || !(stock >= 0)) return setError('Enter the stock on hand (0 or more).')
    if (form.min === '' || !(min >= 0)) return setError('Enter the minimum stock (0 or more).')

    setBusy(true)
    const payload = { name, unit: form.unit, stock_qty: stock, min_stock: min }
    const { error } =
      editingId === null
        ? await supabase.from('ingredients').insert(payload)
        : await supabase.from('ingredients').update(payload).eq('id', editingId)
    setBusy(false)

    if (error) {
      setError(error.code === '23505' ? 'An ingredient with that name already exists.' : error.message)
      return
    }
    setShowForm(false)
    await load()
  }

  async function remove(r: Ingredient) {
    if (!window.confirm(`Delete "${r.name}"?`)) return
    const { error } = await supabase.from('ingredients').delete().eq('id', r.id)
    if (error) {
      setError(
        error.code === '23503'
          ? `"${r.name}" is used in a menu item's recipe. Remove it from the recipe first.`
          : error.message
      )
      return
    }
    await load()
  }

  const low = rows.filter((r) => r.stock_qty <= r.min_stock)
  const visible =
    tab === 'All' ? rows : tab === 'Low stock' ? low : rows.filter((r) => r.stock_qty > r.min_stock)

  return (
    <Layout>
      <div className="flex flex-col gap-5 p-4 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Inventory</h1>
            <p className="mt-1 text-muted">
              Total {String(rows.length).padStart(2, '0')} ingredients
            </p>
          </div>
          <button
            type="button"
            onClick={openNew}
<<<<<<< HEAD
<<<<<<< HEAD
            className="h-12 w-full rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:scale-[0.97] sm:h-13 sm:w-auto"
=======
            className="h-13 rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97]"
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
=======
            className="h-13 rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97]"
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
          >
            + Add ingredient
          </button>
        </header>

        {showForm && (
          <div className={`${card} flex flex-col gap-4 p-4 sm:p-6`}>
            <h2 className="text-lg font-extrabold">
              {editingId ? 'Edit ingredient' : 'New ingredient'}
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label htmlFor="iname" className={label}>Name</label>
                <input
                  id="iname"
                  className={field}
                  placeholder="e.g. Milk"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="iunit" className={label}>Unit</label>
                <select
                  id="iunit"
                  className={field}
                  value={form.unit}
                  onChange={(e) => setForm({ ...form, unit: e.target.value })}
                >
                  {units.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="istock" className={label}>In stock</label>
                <input
                  id="istock"
                  type="number"
                  min="0"
                  step="any"
                  className={field}
                  placeholder="0"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="imin" className={label}>Minimum stock</label>
                <input
                  id="imin"
                  type="number"
                  min="0"
                  step="any"
                  className={field}
                  placeholder="0"
                  value={form.min}
                  onChange={(e) => setForm({ ...form, min: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={save}
                disabled={busy}
                className="h-13 rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97] disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="h-13 rounded-xl border border-[#d9dee7] px-7 font-semibold transition-all hover:bg-[#f0f2f5] active:bg-[#e3e7ee] active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}

        {low.length > 0 && (
          <div className="rounded-[20px] bg-peach px-6 py-4 text-[#8a2f04]">
            <b>
              {low.length} {low.length === 1 ? 'ingredient is' : 'ingredients are'} at or below
              minimum stock:
            </b>{' '}
            {low.map((r) => r.name).join(', ')}
          </div>
        )}

        <div className="flex gap-6 overflow-x-auto border-b border-[#e3e7ee] sm:gap-8">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
<<<<<<< HEAD
<<<<<<< HEAD
              className={`whitespace-nowrap py-3 font-semibold transition-colors ${
=======
              className={`py-3 font-semibold transition-colors ${
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
=======
              className={`py-3 font-semibold transition-colors ${
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
                tab === t ? 'border-b-[3px] border-brand text-navy' : 'text-muted hover:text-navy'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className={`${card} p-4 sm:p-6`}>
          {visible.length === 0 ? (
            <p className="text-muted">Nothing to show here yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[540px] border-collapse text-left">
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
                {visible.map((r) => {
                  const isLow = r.stock_qty <= r.min_stock
                  return (
                    <tr key={r.id} className="border-b border-[#eef1f5] last:border-0">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-peach text-[13px] font-extrabold text-[#b23b06]">
                            {r.name.slice(0, 2)}
                          </span>
                          <b>{r.name}</b>
                        </div>
                      </td>
                      <td>{r.stock_qty} {r.unit}</td>
                      <td>{r.min_stock} {r.unit}</td>
                      <td>
                        <span
                          className={`rounded-xl px-3 py-1 text-xs font-bold ${
                            isLow ? 'bg-peach text-[#b23b06]' : 'bg-[#e3f5ea] text-[#17663a]'
                          }`}
                        >
                          {isLow ? 'Low stock' : 'OK'}
                        </span>
                      </td>
                      <td className="space-x-4 text-right">
                        <button
                          type="button"
                          onClick={() => openEdit(r)}
                          className="text-xs font-bold tracking-wider text-brand-dark transition-colors hover:text-[#9a3412] active:text-[#7c2d12]"
                        >
                          EDIT
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(r)}
                          className="text-xs font-bold tracking-wider text-red-700 transition-colors hover:text-red-900 active:text-red-950"
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}
