import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'

export type Role = 'admin' | 'cashier'
type AuthState = { session: Session | null; role: Role | null; loading: boolean }

const AuthContext = createContext<AuthState>({ session: null, role: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s)
      if (!s) {
        setRole(null)
        setLoading(false)
        return
      }
      setLoading(true)
      // setTimeout avoids calling Supabase inside its own auth callback
      setTimeout(async () => {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', s.user.id)
          .single()
        setRole((data?.role as Role) ?? null)
        setLoading(false)
      }, 0)
    })
    return () => sub.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ session, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext)