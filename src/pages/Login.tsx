import { useEffect, useRef, useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'

// The photo fades into the dark background as it goes left
const fade = 'linear-gradient(90deg, transparent 0%, rgba(0,0,0,.55) 22%, #000 55%)'
const shade =
  'linear-gradient(180deg, rgba(38,40,54,.55) 0%, rgba(38,40,54,0) 30%, rgba(38,40,54,0) 68%, rgba(38,40,54,.65) 100%)'

const fieldBox =
  'group relative flex h-15 flex-col justify-center rounded-2xl border-2 border-transparent bg-[#373947] px-5 pr-14 focus-within:border-brand focus-within:shadow-[0_0_0_4px_rgba(255,118,33,0.18)]'
const fieldLabel = 'text-xs leading-none text-[#a5a8b8] group-focus-within:text-[#ff8a4c]'
const fieldInput =
  'login-input mt-1 w-full bg-transparent text-[15px] font-semibold text-white outline-none placeholder:text-[#8d90a1]'

type LoginProps = {
  onRequestStart: () => void
  onRequestFailed: () => void
  onSuccessAnimationComplete: () => void
}

export default function Login({ onRequestStart, onRequestFailed, onSuccessAnimationComplete }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [phase, setPhase] = useState<'idle' | 'loading' | 'success'>('idle')
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current)
    },
    []
  )

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (phase !== 'idle') return
    setPhase('loading')
    setError('')
    onRequestStart()
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setPhase('idle')
        onRequestFailed()
        return
      }

      setPhase('success')
      const successDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 100 : 650
      successTimer.current = setTimeout(() => {
        successTimer.current = null
        onSuccessAnimationComplete()
      }, successDelay)
    } catch {
      setError('We could not connect. Please check your connection and try again.')
      setPhase('idle')
      onRequestFailed()
    }
  }

  return (
    <div className="min-h-screen bg-[#262836]">
      <div className="relative flex min-h-screen w-full flex-col overflow-hidden bg-[#262836] text-white">
        {/* Photo, right side only */}
        <div
          aria-hidden="true"
          className="absolute inset-y-0 right-0 hidden w-[63%] lg:block"
          style={{ WebkitMaskImage: fade, maskImage: fade }}
        >
          <img
            src="/login-food.jpg"
            alt=""
            className="h-full w-full object-cover object-right brightness-[0.62] saturate-90"
          />
          <div className="absolute inset-0" style={{ background: shade }} />
        </div>

        {/* Top bar */}
        <header className="relative z-10 flex items-center gap-11 px-6 pt-8 sm:px-12 sm:pt-11 lg:px-16">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand text-lg font-extrabold text-navy">
              K
            </span>
            <b className="text-lg">
              KaPOS<span className="text-brand">.</span>
            </b>
          </div>
          <span className="hidden font-semibold text-[#b4b7c6] sm:inline">Home</span>
          <span className="hidden font-semibold text-[#b4b7c6] sm:inline">Help</span>
        </header>

        {/* Form */}
        <main className="relative z-10 flex flex-1 items-center px-6 pb-28 pt-10 sm:px-12 lg:pl-28">
          <form onSubmit={handleSubmit} className="w-full max-w-[30rem]">
            <p className="text-xs font-bold tracking-[0.12em] text-[#b4b7c6]">WELCOME BACK</p>
            <h1 className="mb-3.5 mt-3 text-5xl font-extrabold leading-[1.1] sm:text-6xl">
              Log in<span className="text-brand">.</span>
            </h1>
            <p className="text-[15px] text-[#b4b7c6]">
              Need an account? <span className="font-semibold text-[#ff8a4c]">Ask your manager.</span>
            </p>

            <div className="mt-9 flex flex-col gap-[18px]">
              <div className={fieldBox}>
                <label htmlFor="email" className={fieldLabel}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="name@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldInput}
                />
                <svg
                  className="absolute right-5 top-1/2 -translate-y-1/2"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#c9ccd6"
                  strokeWidth="2"
                  aria-hidden="true"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path d="M3 7l9 6 9-6" />
                </svg>
              </div>

              <div className={fieldBox}>
                <label htmlFor="password" className={fieldLabel}>
                  Password
                </label>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={fieldInput}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#c9ccd6"
                    strokeWidth="2"
                    aria-hidden="true"
                  >
                    <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                    <circle cx="12" cy="12" r="3" />
                    {showPassword && <path d="M3 3l18 18" />}
                  </svg>
                </button>
              </div>
            </div>

            <label className="mt-5 flex w-fit items-center gap-2.5 text-[15px] text-[#b4b7c6]">
              <input type="checkbox" className="h-5 w-5 accent-brand" />
              Remember me
            </label>

            {error && (
              <p role="alert" className="mt-4 text-sm text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={phase !== 'idle'}
              aria-busy={phase === 'loading'}
              className="relative mt-7 flex h-14 w-full items-center justify-center overflow-hidden rounded-full bg-brand text-base font-extrabold text-navy shadow-[0_10px_30px_rgba(255,118,33,0.4)] hover:brightness-95 disabled:opacity-60"
            >
              {phase === 'idle' && <span className="login-button-label">Log in</span>}
              {phase === 'loading' && (
                <span aria-hidden="true" className="login-button-state">
                  <span className="login-spinner h-5 w-5 rounded-full border-[3px] border-navy/20 border-t-navy" />
                </span>
              )}
              {phase === 'success' && (
                <span aria-hidden="true" className="login-button-state">
                  <svg className="login-check h-6 w-6" viewBox="0 0 24 24" fill="none">
                    <path d="m5 12.5 4.5 4.5L19 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}
              <span className="sr-only">
                {phase === 'loading' ? 'Signing in…' : phase === 'success' ? 'Signed in' : 'Log in'}
              </span>
            </button>
          </form>
        </main>
      </div>
    </div>
  )
}