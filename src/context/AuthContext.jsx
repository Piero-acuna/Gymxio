import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { supabase } from '../lib/supabase'

const Ctx = createContext(null)
export const useAuth = () => useContext(Ctx)
const PENDING = 'gx_pending'

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(!!supabase)
  const [recovery, setRecovery] = useState(false)
  const loaded = useRef(null)

  const refresh = useCallback(async (s, silent) => {
    if (!s) { loaded.current = null; setProfile(null); return }
    if (loaded.current === s.user.id) return
    if (!silent) setLoading(true)
    try {
      const q = () => supabase.from('profiles').select('role,full_name,gym_id,phone').eq('user_id', s.user.id).maybeSingle()
      let { data, error } = await q()
      if (error) throw error
      const gym = localStorage.getItem(PENDING)
      if (!data && gym) { // primer ingreso tras confirmar el correo: crea el gimnasio
        const r = await supabase.rpc('create_gym', { p_name: gym }); if (r.error) throw r.error
        localStorage.removeItem(PENDING); ;({ data } = await q())
      }
      setProfile(data); loaded.current = data ? s.user.id : null
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [])

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); return refresh(data.session) }).finally(() => setLoading(false))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((ev, s) => {
      if (ev === 'PASSWORD_RECOVERY') setRecovery(true)
      setSession(s)
      setTimeout(() => refresh(s), 0) // evita bloquear el callback de Supabase
    })
    return () => subscription.unsubscribe()
  }, [refresh])

  const api = {
    session, profile, loading, recovery,
    reloadProfile: () => { loaded.current = null; return refresh(session, true) },
    signIn: async (email, password) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error },
    signUp: async (gym, email, password) => {
      localStorage.setItem(PENDING, gym)
      const { data, error } = await supabase.auth.signUp({ email, password }); if (error) throw error
      return !!data.session
    },
    resetPassword: async (email) => { const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin }); if (error) throw error },
    updatePassword: async (password) => { const { error } = await supabase.auth.updateUser({ password }); if (error) throw error; setRecovery(false) },
    signOut: () => supabase.auth.signOut(),
  }
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}
