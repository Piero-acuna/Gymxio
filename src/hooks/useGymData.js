import { useCallback, useEffect, useState } from 'react'
import { loadAll } from '../lib/api'
import { useToast } from '../context/ToastContext'

const EMPTY = { plans: [], members: [], payments: [], attendance: [], classes: [] }

export function useGymData() {
  const toast = useToast()
  const [data, setData] = useState(EMPTY)
  const [loading, setLoading] = useState(true)
  const reload = useCallback(async () => {
    try { setData(await loadAll()) } catch (e) { toast(e.message, 'bad') } finally { setLoading(false) }
  }, [toast])
  useEffect(() => { reload() }, [reload])
  return { ...data, loading, reload }
}
