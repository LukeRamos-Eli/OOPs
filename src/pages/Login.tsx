import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

const label = 'mb-2 block text-xs font-bold uppercase tracking-widest text-[#32343e]'
const field =
  'h-13 w-full rounded-xl bg-field px-4 text-sm text-navy outline-none placeholder:text-[#6b6e7c] focus:ring-2 focus:ring-brand'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) setError(error.message)
    setBusy(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-navy p-6">
      <div className="flex w-full max-w-110 flex-col items-center gap-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-brand text-[22px] font-extrabold text-navy">
            K
          </span>
          <span className="text-2xl font-extrabold text-white">KaPOS</span>
        </div>

        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-white">Log In</h1>
          <p className="mt-2 text-[#c9ccd6]">Please sign in to your account</p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-5 rounded-3xl bg-white p-8"
        >
          <div>
            <label htmlFor="email" className={label}>Email</label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              placeholder="name@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={field}
            />
          </div>

          <div>
            <label htmlFor="password" className={label}>Password</label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                required
                autoComplete="current-password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`${field} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#5e6270" strokeWidth="2" aria-hidden="true">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                  {showPassword && <path d="M3 3l18 18" />}
                </svg>
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="h-5 w-5 accent-brand" />
              Remember me
            </label>
            <button type="button" className="text-xs font-bold tracking-wider text-brand-dark">
              FORGOT PASSWORD
            </button>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-700">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="h-13 w-full rounded-xl bg-brand text-sm font-extrabold uppercase tracking-wider text-navy hover:brightness-95 disabled:opacity-60"
          >
            {busy ? 'Signing in…' : 'Log in'}
          </button>

          <p className="text-center text-[13px] text-muted">
            Accounts are created by your manager.
          </p>
        </form>
      </div>
    </div>
  )
}