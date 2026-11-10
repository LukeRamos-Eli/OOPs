import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const nav = [
  { label: 'POS', to: '/pos' },
  { label: 'Transactions' },
  { label: 'Menu' },
  { label: 'Inventory' },
  { label: 'Reports', to: '/admin' },
]

const base = 'block w-full rounded-2xl px-4 py-3.5 text-left font-semibold'
const on = 'bg-brand text-navy'
const off = 'text-[#c9ccd6] hover:bg-white/10'

export default function Layout({ children }: { children: ReactNode }) {
  const { session, role } = useAuth()

  return (
    <div className="flex h-screen bg-page">
      <aside className="flex w-58 shrink-0 flex-col gap-2 bg-navy p-4 text-white">
        <div className="mx-2 mb-6 mt-2 flex items-center gap-3 text-xl font-extrabold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-navy">
            K
          </span>
          KaPOS
        </div>

        {nav.map(({ label, to }) =>
          to ? (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) => `${base} ${isActive ? on : off}`}
            >
              {label}
            </NavLink>
          ) : (
            <button key={label} type="button" className={`${base} ${off}`}>
              {label}
            </button>
          )
        )}

        <div className="mt-auto flex flex-col gap-3 px-2 pt-3">
          <div className="flex items-center gap-3 text-xs text-[#c9ccd6]">
            <span className="h-10 w-10 shrink-0 rounded-full bg-[#9aa8b8]" />
            <div className="min-w-0">
              <p className="truncate font-bold text-white">{session?.user.email}</p>
              <p className="capitalize">{role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => supabase.auth.signOut()}
            className="h-11 rounded-xl border border-white/20 text-sm font-semibold hover:bg-white/10"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}