import { describe, it, expect } from 'vitest'
import { addDays, daysBetween, money, setWarnDays, status } from '../src/lib/format'

describe('format', () => {
  it('suma días cruzando de mes', () => expect(addDays('2026-01-31', 1)).toBe('2026-02-01'))
  it('diferencia en días', () => expect(daysBetween('2026-11-02', '2026-11-09')).toBe(7))
  it('formatea dinero', () => expect(money(80)).toBe('S/ 80.00'))
  it('calcula estados de membresía', () => {
    const t = '2026-11-02'
    expect(status({ end_date: '2026-11-01' }, t).key).toBe('bad')
    expect(status({ end_date: '2026-11-09' }, t).key).toBe('warn')
    expect(status({ end_date: '2026-11-10' }, t).key).toBe('ok')
    expect(status({ end_date: t }, t).key).toBe('warn')
  })
  it('respeta los días de aviso configurados', () => {
    setWarnDays(3)
    expect(status({ end_date: '2026-11-07' }, '2026-11-02').key).toBe('ok')
    setWarnDays(7)
  })
})
