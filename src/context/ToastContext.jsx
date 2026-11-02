import { createContext, useCallback, useContext, useRef, useState } from 'react'

const Ctx = createContext(() => {})
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }) {
  const [t, setT] = useState(null)
  const timer = useRef()
  const toast = useCallback((msg, type = 'ok') => {
    setT({ msg, type })
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setT(null), 2800)
  }, [])
  return (
    <Ctx.Provider value={toast}>
      {children}
      {t && <div role="status" className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl border bg-gx-card2 px-5 py-3 text-sm font-semibold ${t.type === 'ok' ? 'border-gx-ok text-gx-ok' : 'border-gx-bad text-gx-bad'}`}>{t.msg}</div>}
    </Ctx.Provider>
  )
}
