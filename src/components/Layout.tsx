import { useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { supabase } from '../lib/supabase'

const nav = [
  { label: 'POS', to: '/pos' },
  { label: 'Transactions', to: '/transactions' },
  { label: 'Menu', to: '/admin/menu', adminOnly: true },
  { label: 'Inventory', to: '/admin/inventory', adminOnly: true },
  { label: 'Dashboard', to: '/admin', adminOnly: true },
  { label: 'Reports', to: '/admin/reports', adminOnly: true },
  { label: 'Users', to: '/admin/users', adminOnly: true },
]

const base = 'block w-full rounded-2xl px-4 py-3.5 text-left font-semibold transition-all active:scale-[0.98]'
const on = 'bg-brand text-navy'
const off = 'text-[#c9ccd6] hover:bg-white/10 active:bg-white/15'

export default function Layout({ children }: { children: ReactNode }) {
  const { session, role } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const links = nav.filter((n) => !n.adminOnly || role === 'admin')

  return (
    <div className="flex min-h-screen flex-col bg-page lg:h-screen lg:flex-row">
      <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 text-white shadow-md lg:hidden">
        <div className="flex items-center gap-3 text-lg font-extrabold">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-navy">
            K
          </span>
          KaPOS
        </div>
        <button
          type="button"
          aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((o) => !o)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 text-white transition-all hover:bg-white/10 active:scale-95"
        >
          {menuOpen ? (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </header>

      {menuOpen && (
        <div
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-navy/60 backdrop-blur-xs lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col gap-2 overflow-y-auto bg-navy p-4 text-white transition-transform duration-200 lg:static lg:z-auto lg:w-58 lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="mx-2 mb-6 mt-2 flex items-center gap-3 text-xl font-extrabold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-navy">
            K
          </span>
          KaPOS
        </div>

        {links.map(({ label, to }) =>
          to ? (
            <NavLink
              key={label}
              to={to}
              end
              onClick={() => setMenuOpen(false)}
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
            className="h-11 rounded-xl border border-white/20 text-sm font-semibold transition-all hover:bg-white/10 active:scale-[0.98]"
          >
            Log out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 lg:overflow-y-auto">{children}</main>
    </div>
  )
}