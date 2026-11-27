import { useEffect, useRef, useState } from 'react'
import Layout from '../../components/Layout'
import StateMessage from '../../components/StateMessage'
import { LoadingStatus, TableSkeleton } from '../../components/Skeleton'
import { useAuth } from '../../lib/auth'
import { supabase } from '../../lib/supabase'

type Role = 'admin' | 'cashier'
type Staff = {
  id: string
  email: string
  full_name: string | null
  role: Role
  last_sign_in_at: string | null
  active: boolean
}

const emptyForm = { name: '', email: '', password: '', role: 'cashier' as Role }

const card = 'rounded-[20px] bg-white shadow-[0_4px_24px_rgba(20,20,31,0.06)]'
const label = 'mb-2 block text-xs font-bold uppercase tracking-widest text-[#32343e]'
const field =
  'h-11 w-full rounded-xl bg-field px-4 text-sm outline-none placeholder:text-[#6b6e7c] focus:ring-2 focus:ring-brand'

const signedIn = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString('en-PH', { timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short' })
    : 'Never'

export default function Users() {
  const { session } = useAuth()
  const me = session?.user.id

  const [rows, setRows] = useState<Staff[]>([])
  const [loaded, setLoaded] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const hasLoaded = useRef(false)
  const [tick, setTick] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<Staff | null>(null)
  const [edit, setEdit] = useState({ name: '', password: '' })
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.resolve(supabase.rpc('list_staff')).then(({ data, error }) => {
      if (cancelled) return
      if (error) {
        setError(hasLoaded.current ? 'Staff accounts could not be refreshed.' : 'Staff accounts could not be loaded.')
        setLoaded(true)
        hasLoaded.current = true
        return
      }
      setRows((data ?? []) as Staff[])
      setError('')
      setLoaded(true)
      hasLoaded.current = true
    }).catch(() => {
      if (!cancelled) {
        setError(hasLoaded.current ? 'Staff accounts could not be refreshed.' : 'Staff accounts could not be loaded.')
        setLoaded(true)
        hasLoaded.current = true
      }
    }).finally(() => {
      if (!cancelled) setRefreshing(false)
    })
    return () => {
      cancelled = true
    }
  }, [tick])

  const reload = () => {
    setError('')
    if (rows.length === 0) setLoaded(false)
    setRefreshing(true)
    setTick((t) => t + 1)
  }

  async function create() {
    setError('')
    setNotice('')
    const email = form.email.trim()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return setError('Enter a valid email address.')
    if (form.password.length < 8) return setError('The password must be at least 8 characters.')

    setBusy(true)
    const { error } = await supabase.rpc('create_staff_user', {
      p_email: email,
      p_password: form.password,
      p_full_name: form.name.trim(),
      p_role: form.role,
    })
    setBusy(false)
    if (error) return setError(error.message)

    setNotice(`Account created for ${email}. Share the password with them privately.`)
    setForm(emptyForm)
    setShowForm(false)
    reload()
  }

  async function changeRole(s: Staff, role: Role) {
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const { error } = await supabase.from('profiles').update({ role }).eq('id', s.id)
      if (error) setError('The account role could not be updated.')
      else setNotice(`Updated the role for ${s.email}.`)
    } catch {
      setError('The account role could not be updated.')
    } finally {
      setBusy(false)
      reload() // also resets the dropdown if the change was refused
    }
  }

  async function toggleActive(s: Staff) {
    const action = s.active ? 'Deactivate' : 'Reactivate'
    if (!window.confirm(`${action} ${s.email}?`)) return
    setError('')
    setNotice('')
    setBusy(true)
    try {
      const { error } = await supabase.rpc('set_staff_active', { p_id: s.id, p_active: !s.active })
      if (error) setError(`The account could not be ${s.active ? 'deactivated' : 'reactivated'}.`)
      else setNotice(`${s.email} ${s.active ? 'deactivated' : 'reactivated'}.`)
    } catch {
      setError(`The account could not be ${s.active ? 'deactivated' : 'reactivated'}.`)
    } finally {
      setBusy(false)
      reload()
    }
  }

  function openEdit(s: Staff) {
    setEditing(s)
    setEdit({ name: s.full_name ?? '', password: '' })
    setError('')
    setNotice('')
  }

  async function saveEdit() {
    if (!editing) return
    if (edit.password && edit.password.length < 8) {
      return setError('The new password must be at least 8 characters.')
    }
    setBusy(true)
    setError('')
    const { error: nErr } = await supabase
      .from('profiles')
      .update({ full_name: edit.name.trim() || null })
      .eq('id', editing.id)
    const { error: pErr } =
      !nErr && edit.password
        ? await supabase.rpc('set_staff_password', { p_id: editing.id, p_password: edit.password })
        : { error: null }
    setBusy(false)

    const err = nErr ?? pErr
    if (err) return setError(err.message)
    setNotice(edit.password ? 'Saved. Share the new password privately.' : 'Saved.')
    setEditing(null)
    reload()
  }

  const admins = rows.filter((r) => r.role === 'admin' && r.active).length

  return (
    <Layout>
      <div className="flex flex-col gap-5 p-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold">Users</h1>
            <p className="mt-1 text-muted">
              {loaded ? `${rows.length} accounts · ${admins} active ${admins === 1 ? 'admin' : 'admins'}` : 'Staff accounts'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowForm(true)
              setError('')
              setNotice('')
            }}
            className="h-13 rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97]"
          >
            + Add account
          </button>
        </header>

        {showForm && (
          <div className={`${card} flex flex-col gap-4 p-6`}>
            <h2 className="text-lg font-extrabold">New account</h2>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label htmlFor="uname" className={label}>Name</label>
                <input
                  id="uname"
                  className={field}
                  placeholder="e.g. Maria Santos"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="uemail" className={label}>Email</label>
                <input
                  id="uemail"
                  type="email"
                  className={field}
                  placeholder="name@email.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="upass" className={label}>Password</label>
                <input
                  id="upass"
                  type="text"
                  autoComplete="off"
                  className={field}
                  placeholder="At least 8 characters"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="urole" className={label}>Role</label>
                <select
                  id="urole"
                  className={field}
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
                >
                  <option value="cashier">Cashier</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={create}
                disabled={busy}
                className="h-13 rounded-xl bg-brand px-7 text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97] disabled:opacity-60"
              >
                {busy ? 'Creating…' : 'Create account'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setForm(emptyForm)
                }}
                className="h-13 rounded-xl border border-[#d9dee7] px-7 font-semibold transition-all hover:bg-[#f0f2f5] active:bg-[#e3e7ee] active:scale-[0.97]"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && !editing && (
          <p role="alert" className="text-sm text-red-700">
            {error}
          </p>
        )}
        {notice && (
          <p role="status" className="content-enter text-sm text-[#17663a]">
            {notice}
          </p>
        )}

        <div className={`${card} p-6`}>
          {!loaded ? (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                <TableSkeleton
                  label="Loading staff accounts…"
                  rows={5}
                  columns={5}
                  columnWidths={['1.8fr', '0.8fr', '0.9fr', '1.4fr', '0.8fr']}
                />
              </div>
            </div>
          ) : error && rows.length === 0 ? (
            <StateMessage
              variant="error"
              title="Staff accounts unavailable"
              description="We couldn't retrieve staff accounts. Please try again."
              action={
                <button type="button" onClick={reload} className="text-sm font-bold text-brand-dark">
                  Try again
                </button>
              }
            />
          ) : (
            <>
            {refreshing && <LoadingStatus label="Refreshing staff accounts…" className="mb-4" />}
            {rows.length === 0 ? (
              <StateMessage
                title="No staff accounts yet"
                description="Create an account to give a team member access to KAPOS."
              />
            ) : (
            <div className="content-enter overflow-x-auto">
            <table className="w-full min-w-[700px] border-collapse text-left">
              <thead>
                <tr className="text-muted">
                  {['Account', 'Role', 'Status', 'Last sign-in', ''].map((h) => (
                    <th key={h} className="border-b border-[#e3e7ee] pb-3 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((s) => (
                  <tr key={s.id} className="border-b border-[#eef1f5] last:border-0">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <b>{s.full_name || s.email}</b>
                        {s.id === me && (
                          <span className="rounded-xl bg-peach px-2 py-0.5 text-xs font-bold text-[#b23b06]">You</span>
                        )}
                      </div>
                      {s.full_name && <div className="text-xs text-muted">{s.email}</div>}
                    </td>
                    <td>
                      <select
                        aria-label={`Role for ${s.email}`}
                        value={s.role}
                        disabled={s.id === me || busy}
                        title={s.id === me ? 'You cannot change your own role' : undefined}
                        onChange={(e) => changeRole(s, e.target.value as Role)}
                        className="h-10 rounded-xl bg-field px-3 text-sm disabled:opacity-60"
                      >
                        <option value="cashier">Cashier</option>
                        <option value="admin">Admin</option>
                      </select>
                    </td>
                    <td>
                      <span
                        className={`rounded-xl px-3 py-1 text-xs font-bold ${
                          s.active ? 'bg-[#e3f5ea] text-[#17663a]' : 'bg-[#e7eaf0] text-[#3f4350]'
                        }`}
                      >
                        {s.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="text-muted">{signedIn(s.last_sign_in_at)}</td>
                    <td className="space-x-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="text-xs font-bold tracking-wider text-brand-dark transition-colors hover:text-[#9a3412] active:text-[#7c2d12]"
                      >
                        EDIT
                      </button>
                      {s.id !== me && (
                        <button
                          type="button"
                          onClick={() => toggleActive(s)}
                          disabled={busy}
                          className="text-xs font-bold tracking-wider text-red-700 transition-colors hover:text-red-900 active:text-red-950"
                        >
                          {s.active ? 'DEACTIVATE' : 'REACTIVATE'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
            )}
            </>
          )}
        </div>
      </div>

      {editing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Edit account"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/60 p-4"
        >
          <div className="flex w-full max-w-sm flex-col gap-4 rounded-3xl bg-white p-6">
            <div>
              <h2 className="text-xl font-extrabold">Edit account</h2>
              <p className="text-sm text-muted">{editing.email}</p>
            </div>
            <div>
              <label htmlFor="ename" className={label}>Name</label>
              <input
                id="ename"
                className={field}
                value={edit.name}
                onChange={(e) => setEdit({ ...edit, name: e.target.value })}
              />
            </div>
            <div>
              <label htmlFor="epass" className={label}>New password (optional)</label>
              <input
                id="epass"
                type="text"
                autoComplete="off"
                className={field}
                placeholder="Leave blank to keep the current one"
                value={edit.password}
                onChange={(e) => setEdit({ ...edit, password: e.target.value })}
              />
            </div>
            {error && (
              <p role="alert" className="text-sm text-red-700">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditing(null)}
                disabled={busy}
                className="h-13 flex-1 rounded-xl border border-[#d9dee7] font-semibold transition-all hover:bg-[#f0f2f5] active:bg-[#e3e7ee] active:scale-[0.97]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={busy}
                className="h-13 flex-1 rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-navy transition-all hover:brightness-110 active:brightness-90 active:scale-[0.97] disabled:opacity-60"
              >
                {busy ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}