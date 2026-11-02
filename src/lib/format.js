const noon = (s) => Date.parse(s + 'T12:00:00Z')

export const todayLima = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/Lima' })
export const addDays = (s, n) => { const d = new Date(noon(s)); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10) }
export const daysBetween = (a, b) => Math.round((noon(b) - noon(a)) / 864e5)
export const money = (n) => 'S/ ' + Number(n).toFixed(2)
export const fmtDate = (s) => (s ? s.split('-').reverse().join('/') : '—')

/** Estado de la membresía: vencido, por vencer (7 días o menos) o activo. */
export function status(m, today = todayLima()) {
  const left = m.end_date ? daysBetween(today, m.end_date) : -1
  if (left < 0) return { key: 'bad', label: 'Vencido' }
  return left <= 7 ? { key: 'warn', label: 'Por vencer' } : { key: 'ok', label: 'Activo' }
}
