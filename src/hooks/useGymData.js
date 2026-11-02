import { useCallback, useEffect, useState } from 'react'
import { loadAll } from '../lib/api'
import { setWarnDays } from '../lib/format'
import { useToast } from '../context/ToastContext'

const EMPTY = { plans: [], members: [], payments: [], attendance: [], classes: [], info: null }

export function useGymData() {
  const toast = useToast()
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    try { const d = await loadAll(); setWarnDays(d.info?.warn_days ?? 7); setData(d) } catch (e) { toast(e.message, 'bad') } finally { setLoading(false) }
  }, [toast])
  useEffect(() => { reload() }, [reload])
  return { ...data, loading, reload }
}
