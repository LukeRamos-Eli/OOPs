import { useCallback, useEffect, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import StateMessage from '../../components/StateMessage'
import { LoadingStatus, Skeleton } from '../../components/Skeleton'
import { supabase } from '../../lib/supabase'
import { peso } from '../../lib/format'
import type { Category } from '../../types/database'
import { imageUrl, uploadMenuImage, deleteMenuImage } from '../../lib/images'

type Row = {
  id: number
  name: string
  description: string | null
  price: number
  is_available: boolean
  category_id: number | null
  image_path: string | null
  categories: { name: string } | null
}
type Ing = { id: number; name: string; unit: string }

const empty = { name: '', price: '', category: '', description: '', available: true }

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'
const label = 'mb-2 block text-xs font-bold uppercase tracking-widest text-[#32343e]'
const field =
  'h-11 w-full rounded-xl bg-field px-4 text-sm outline-none placeholder:text-[#6b6e7c] focus:ring-2 focus:ring-brand'
const msg = (e: unknown) => (e as { message?: string }).message ?? 'Something went wrong'

export default function MenuManagement() {
  const [rows, setRows] = useState<Row[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<Ing[]>([])
  const [servings, setServings] = useState<Record<number, number | null>>({})
  const [tab, setTab] = useState<number | 'all'>('all')
  const [form, setForm] = useState(empty)
  const [recipe, setRecipe] = useState<Record<number, string>>({})
  const [editingId, setEditingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [recipeLoading, setRecipeLoading] = useState(false)
  const [pendingItemId, setPendingItemId] = useState<number | null>(null)
  const hasLoadedSuccessfully = useRef(false)
  const requestId = useRef(0)
  const [photo, setPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [currentPath, setCurrentPath] = useState<string | null>(null)
  const [removePhoto, setRemovePhoto] = useState(false)

  const load = useCallback(async () => {
    const request = ++requestId.current
    if (hasLoadedSuccessfully.current) setRefreshing(true)
    else setLoading(true)
    setError('')
    try {
      const [m, c, i, a] = await Promise.all([
        supabase
          .from('menu_items')
          .select('id, name, description, price, is_available, category_id, image_path, categories(name)')
          .order('name'),
        supabase.from('categories').select('id, name').order('name'),
        supabase.from('ingredients').select('id, name, unit').order('name'),
        supabase.from('menu_availability').select('menu_item_id, max_servings'),
      ])
      if (request !== requestId.current) return
      const err = m.error ?? c.error ?? i.error ?? a.error
      if (err) throw err
      const s: Record<number, number | null> = {}
      for (const r of a.data ?? []) s[r.menu_item_id] = r.max_servings
      setRows((m.data ?? []) as unknown as Row[])
      setCategories(c.data ?? [])
      setIngredients(i.data ?? [])
      setServings(s)
      setError('')
      hasLoadedSuccessfully.current = true
    } catch {
      if (request === requestId.current) {
        setError(
          hasLoadedSuccessfully.current
            ? 'Menu could not be refreshed. Showing previously loaded items.'
            : 'Menu could not be loaded. Please try again.'
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

  function reset() {
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setForm(empty)
    setRecipe({})
    setEditingId(null)
    setPhoto(null)
    setPhotoPreview(null)
    setCurrentPath(null)
    setRemovePhoto(false)
    setError('')
    setRecipeLoading(false)
  }

  async function startEdit(row: Row) {
    setError('')
    setEditingId(row.id)
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setCurrentPath(row.image_path)
    setPhoto(null)
    setPhotoPreview(null)
    setRemovePhoto(false)
    setForm({
      name: row.name,
      price: String(row.price),
      category: row.categories?.name ?? '',
      description: row.description ?? '',
      available: row.is_available,
    })
    setRecipeLoading(true)
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('ingredient_id, qty_used')
        .eq('menu_item_id', row.id)
      if (error) throw error
      const next: Record<number, string> = {}
      for (const r of data ?? []) next[r.ingredient_id] = String(r.qty_used)
      setRecipe(next)
    } catch {
      setError('This item’s recipe could not be loaded. Please try again.')
    } finally {
      setRecipeLoading(false)
    }
  }

  function toggleIngredient(id: number) {
    setRecipe((prev) => {
      const next = { ...prev }
      if (id in next) delete next[id]
      else next[id] = ''
      return next
    })
  }

  function pickPhoto(file: File) {
    setError('')
    if (!file.type.startsWith('image/')) return setError('Please choose an image file.')
    if (file.size > 10 * 1024 * 1024) return setError('That photo is over 10 MB. Choose a smaller one.')
    if (photoPreview) URL.revokeObjectURL(photoPreview)
    setPhoto(file)
    setPhotoPreview(URL.createObjectURL(file))
    setRemovePhoto(false)
  }

  // First click drops a newly picked photo; clicking again removes the saved one
  function dropPhoto() {
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview)
      setPhoto(null)
      setPhotoPreview(null)
    } else {
      setRemovePhoto(true)
    }
  }

  async function save() {
    setError('')
    setNotice('')
    const name = form.name.trim()
    const price = Number(form.price)
    const picked = Object.entries(recipe)
    if (!name) return setError('Item name is required.')
    if (form.price === '' || !(price >= 0)) return setError('Enter a valid price.')
    if (picked.some(([, q]) => !(Number(q) > 0)))
      return setError('Enter an amount greater than 0 for each selected ingredient.')

    setBusy(true)
    let uploaded: string | null = null
    try {
      // Photo: upload a new one, or clear the old one
      let imagePath = currentPath
      let oldPath: string | null = null
      if (photo) {
        uploaded = await uploadMenuImage(photo)
        imagePath = uploaded
        oldPath = currentPath
      } else if (removePhoto) {
        imagePath = null
        oldPath = currentPath
      }

      // Find the category by name, or create it
      let categoryId: number | null = null
      const catName = form.category.trim()
      if (catName) {
        const found = categories.find((c) => c.name.toLowerCase() === catName.toLowerCase())
        if (found) categoryId = found.id
        else {
          const { data, error } = await supabase
            .from('categories')
            .insert({ name: catName })
            .select('id')
            .single()
          if (error) throw error
          categoryId = data.id
        }
      }

      const payload = {
        name,
        description: form.description.trim() || null,
        price,
        is_available: form.available,
        category_id: categoryId,
        image_path: imagePath,
      }

      let id = editingId
      if (id === null) {
        const { data, error } = await supabase.from('menu_items').insert(payload).select('id').single()
        if (error) throw error
        id = data.id as number
      } else {
        const { error } = await supabase.from('menu_items').update(payload).eq('id', id)
        if (error) throw error
      }
      uploaded = null

      // Replace the recipe
      const { error: dErr } = await supabase.from('recipes').delete().eq('menu_item_id', id)
      if (dErr) throw dErr
      if (picked.length > 0) {
        const { error: rErr } = await supabase.from('recipes').insert(
          picked.map(([ing, q]) => ({
            menu_item_id: id,
            ingredient_id: Number(ing),
            qty_used: Number(q),
          }))
        )
        if (rErr) throw rErr
      }

      const savedNotice = editingId === null ? 'Menu item added.' : 'Menu item updated.'
      reset()
      await deleteMenuImage(oldPath) // free the space of the replaced photo
      await load()
      setNotice(savedNotice)
    } catch (e) {
      await deleteMenuImage(uploaded) // don't leave an unused upload behind
      setError(msg(e))
    } finally {
      setBusy(false)
    }
  }

  async function toggleAvailable(row: Row) {
    setError('')
    setNotice('')
    setPendingItemId(row.id)
    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !row.is_available })
        .eq('id', row.id)
      if (error) setError('Availability could not be updated.')
      else {
        await load()
        setNotice(`${row.name} availability updated.`)
      }
    } catch {
      setError('Availability could not be updated.')
    } finally {
      setPendingItemId(null)
    }
  }

  async function remove(row: Row) {
    if (!window.confirm(`Delete "${row.name}"?`)) return
    setError('')
    setNotice('')
    setPendingItemId(row.id)
    try {
      const { error } = await supabase.from('menu_items').delete().eq('id', row.id)
      if (error) {
        setError(
          error.code === '23503'
            ? `"${row.name}" has past orders, so it can't be deleted. Mark it Unavailable instead.`
            : 'The menu item could not be deleted.'
        )
        return
      }
      await deleteMenuImage(row.image_path)
      if (editingId === row.id) reset()
      await load()
      setNotice(`${row.name} deleted.`)
    } catch {
      setError('The menu item could not be deleted.')
    } finally {
      setPendingItemId(null)
    }
  }

  const visible = tab === 'all' ? rows : rows.filter((r) => r.category_id === tab)
  const shownPhoto = photoPreview ?? (removePhoto ? null : imageUrl(currentPath))

  return (
    <Layout>
      <div className="flex flex-col gap-6 p-4 sm:p-6 lg:grid lg:grid-cols-[1fr_380px] lg:p-8 xl:grid-cols-[1fr_400px]">
        <section className="flex flex-col gap-5">
          <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-extrabold">Menu</h1>
              <p className="mt-1 text-muted">Total {String(rows.length).padStart(2, '0')} items</p>
            </div>
            <button
              type="button"
              onClick={() => {
                reset()
                const el = document.getElementById('name')
                el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                el?.focus()
              }}
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
              + Add item
            </button>
          </header>

          <div className="flex gap-6 overflow-x-auto border-b border-[#e3e7ee] sm:gap-8">
            {[{ id: 'all' as const, name: 'All' }, ...categories].map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setTab(c.id)}
<<<<<<< HEAD
<<<<<<< HEAD
                className={`whitespace-nowrap py-3 font-semibold transition-colors ${
=======
                className={`py-3 font-semibold transition-colors ${
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
=======
                className={`py-3 font-semibold transition-colors ${
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
                  tab === c.id ? 'border-b-[3px] border-brand text-navy' : 'text-muted hover:text-navy'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>

<<<<<<< HEAD
          <div className={`${card} px-4 py-2 sm:px-6`}>
            {visible.length === 0 && (
              <p className="py-6 text-muted">No items yet. Use the form to add one.</p>
            )}
            {visible.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center gap-3 border-b border-[#eef1f5] py-4 last:border-0 sm:gap-4"
              >
                <div className="min-w-[140px] flex-1">
=======
          {notice && <p role="status" className="content-enter text-sm text-[#17663a]">{notice}</p>}

          <div className={`${card} px-6 py-2`}>
            {refreshing && <LoadingStatus label="Refreshing menu…" className="py-3" />}
            {loading ? (
              <div className="space-y-4 py-4">
                <LoadingStatus label="Loading menu items…" />
                {Array.from({ length: 5 }, (_, index) => (
                  <div key={index} aria-hidden="true" className="flex items-center gap-4 border-b border-[#eef1f5] py-4">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/3" />
                    </div>
                    <Skeleton className="h-7 w-24" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : error && rows.length === 0 ? (
              <StateMessage
                variant="error"
                title="Menu unavailable"
                description="We couldn't retrieve menu items. Please try again."
                action={
                  <button type="button" onClick={load} className="text-sm font-bold text-brand-dark">
                    Try again
                  </button>
                }
              />
            ) : visible.length === 0 ? (
              <StateMessage
                title={rows.length === 0 ? 'No menu items yet' : 'No items in this category'}
                description={rows.length === 0 ? 'Use the menu form to add your first item.' : 'Choose another category to view its items.'}
              />
            ) : visible.map((row) => (
              <div
                key={row.id}
                className="content-enter flex items-center gap-4 border-b border-[#eef1f5] py-4 last:border-0"
              >
                {row.image_path ? (
                  <img
                    src={imageUrl(row.image_path) ?? ''}
                    alt=""
                    loading="lazy"
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-peach text-sm font-extrabold text-[#b23b06]">
                    {row.name.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1">
>>>>>>> origin/main
                  <b>{row.name}</b>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {row.categories && (
                      <span className="rounded-xl bg-peach px-3 py-1 text-xs font-bold text-[#b23b06]">
                        {row.categories.name}
                      </span>
                    )}
                    {servings[row.id] !== null && servings[row.id] !== undefined && (
                      <span className="text-xs text-muted">Can make {servings[row.id]}</span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAvailable(row)}
                  disabled={pendingItemId === row.id}
                  aria-label={`Toggle availability of ${row.name}`}
<<<<<<< HEAD
<<<<<<< HEAD
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition-all active:scale-95 ${
=======
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition-colors hover:brightness-90 ${
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
=======
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition-colors hover:brightness-90 ${
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
                    row.is_available ? 'bg-[#e3f5ea] text-[#17663a]' : 'bg-[#e7eaf0] text-[#3f4350]'
                  }`}
                >
                  {row.is_available ? 'Available' : 'Unavailable'}
                </button>
                <b className="w-20 text-right">{peso(Number(row.price))}</b>
<<<<<<< HEAD
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="text-xs font-bold tracking-wider text-brand-dark transition-colors hover:text-[#9a3412]"
                  >
                    EDIT
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(row)}
                    className="text-xs font-bold tracking-wider text-red-700 transition-colors hover:text-red-900"
                  >
                    DELETE
                  </button>
                </div>
=======
                <button
                  type="button"
                  onClick={() => startEdit(row)}
<<<<<<< HEAD
                  className="text-xs font-bold tracking-wider text-brand-dark transition-colors hover:text-[#9a3412] active:text-[#7c2d12]"
=======
                  disabled={pendingItemId === row.id}
                  className="text-xs font-bold tracking-wider text-brand-dark"
>>>>>>> origin/main
                >
                  EDIT
                </button>
                <button
                  type="button"
                  onClick={() => remove(row)}
<<<<<<< HEAD
                  className="text-xs font-bold tracking-wider text-red-700 transition-colors hover:text-red-900 active:text-red-950"
=======
                  disabled={pendingItemId === row.id}
                  className="text-xs font-bold tracking-wider text-red-700"
>>>>>>> origin/main
                >
                  DELETE
                </button>
>>>>>>> parent of b9fe2de (Merge branch 'main' into Villarias)
              </div>
            ))}
          </div>
        </section>

        <aside
          className={`${card} flex flex-col gap-3 p-5 lg:sticky lg:top-8 lg:max-h-[calc(100vh-4rem)] lg:self-start lg:overflow-y-auto`}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold">{editingId ? 'Edit Item' : 'Add New Item'}</h2>
            <button
              type="button"
              onClick={reset}
              className="text-xs font-bold tracking-wider text-brand-dark transition-colors hover:text-[#9a3412] active:text-[#7c2d12]"
            >
              RESET
            </button>
          </div>

          <div>
            <label htmlFor="name" className={label}>Item name</label>
            <input
              id="name"
              className={field}
              placeholder="e.g. Iced Coffee"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>

<<<<<<< HEAD
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
=======
          <div>
            <span className={label}>Photo (optional)</span>
            <div className="flex items-center gap-3">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-field text-xs text-muted">
                {shownPhoto ? (
                  <img src={shownPhoto} alt="" className="h-full w-full object-cover" />
                ) : (
                  'No photo'
                )}
              </div>
              <div className="flex flex-col items-start gap-2">
                <label
                  htmlFor="photo"
                  className="cursor-pointer rounded-full border border-[#d9dee7] px-4 py-2 text-sm font-semibold"
                >
                  {shownPhoto ? 'Change photo' : 'Add photo'}
                </label>
                <input
                  id="photo"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    e.target.value = ''
                    if (f) pickPhoto(f)
                  }}
                />
                {shownPhoto && (
                  <button
                    type="button"
                    onClick={dropPhoto}
                    className="text-xs font-bold tracking-wider text-red-700"
                  >
                    REMOVE
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
>>>>>>> origin/main
            <div>
              <label htmlFor="price" className={label}>Price (₱)</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                className={field}
                placeholder="0.00"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="category" className={label}>Category</label>
              <input
                id="category"
                list="categories"
                className={field}
                placeholder="Pick or type new"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
              <datalist id="categories">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </div>
          </div>

          <div>
            <span className={label}>Ingredients used</span>
            {recipeLoading ? (
              <LoadingStatus label="Loading recipe…" />
            ) : ingredients.length === 0 ? (
              <p className="text-sm text-muted">Add ingredients in Inventory first.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {ingredients.map((ing) => {
                  const selected = ing.id in recipe
                  return (
                    <button
                      key={ing.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleIngredient(ing.id)}
                      className="flex w-16 flex-col items-center gap-1 text-[11px] text-muted transition-transform active:scale-90"
                    >
                      <span
                        className={`flex h-10 w-10 items-center justify-center rounded-full text-[13px] font-extrabold transition-all ${
                          selected
                            ? 'border-2 border-brand bg-peach text-[#b23b06]'
                            : 'border border-[#d9dee7] bg-white text-muted hover:border-brand/50 hover:bg-peach/50'
                        }`}
                      >
                        {ing.name.slice(0, 2)}
                      </span>
                      <span className="w-full truncate text-center">{ing.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {Object.keys(recipe).length > 0 && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ingredients
                .filter((ing) => ing.id in recipe)
                .map((ing) => (
                  <div key={ing.id}>
                    <label htmlFor={`q${ing.id}`} className={label}>
                      {ing.name} ({ing.unit})
                    </label>
                    <input
                      id={`q${ing.id}`}
                      type="number"
                      min="0"
                      step="any"
                      className={field}
                      placeholder="Amount per item"
                      value={recipe[ing.id]}
                      onChange={(e) => setRecipe({ ...recipe, [ing.id]: e.target.value })}
                    />
                  </div>
                ))}
            </div>
          )}

          <div>
            <label htmlFor="details" className={label}>Details</label>
            <textarea
              id="details"
              className={`${field} h-16 py-3`}
              placeholder="Short description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.available}
              onChange={(e) => setForm({ ...form, available: e.target.checked })}
              className="h-5 w-5 accent-brand"
            />
            Available for ordering
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={save}
<<<<<<< HEAD
            disabled={busy}
            className="h-13 rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97] disabled:opacity-60"
=======
            disabled={busy || recipeLoading}
            className="h-13 rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-navy disabled:opacity-60"
>>>>>>> origin/main
          >
            {busy ? 'Saving…' : recipeLoading ? 'Loading recipe…' : 'Save changes'}
          </button>
        </aside>
      </div>
    </Layout>
  )
}