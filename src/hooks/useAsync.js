import { useCallback, useEffect, useState } from 'react'
import { useToast } from '../context/ToastContext'

/** Ejecuta una acción, avisa con un toast y recarga. done() corre antes de recargar. */
export function useRun(after) {
  const toast = useToast()
  return useCallback(async (fn, msg, done) => {
    try {
      const r = await fn()
      toast(typeof msg === 'function' ? msg(r) : msg)
      done?.()
      await after?.()
      return true
    } catch (e) {
      toast(e.code === '23505' ? 'Ya existe un registro con esos datos.' : e.message, 'bad')
      return false
    }
  }, [toast, after])
}

/** Carga una lista al montar (fn debe ser estable, por ejemplo una función de lib/api). */
export function useLoad(fn, initial = []) {
  const toast = useToast()
  const [data, setData] = useState(initial)
  const [ready, setReady] = useState(false)
  const reload = useCallback(async () => {
    try { setData(await fn()) } catch (e) { toast(e.message, 'bad') } finally { setReady(true) }
  }, [fn, toast])
  useEffect(() => { reload() }, [reload])
  return { data, ready, reload }
}
