import { describe, it, expect } from 'vitest'

process.env.SUPABASE_URL = 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = 'x'

const call = async (handler, req) => {
  const out = {}
  const res = { status(c) { out.code = c; return res }, json(o) { out.body = o } }
  await handler({ headers: {}, body: {}, ...req }, res)
  return out
}

describe('api', () => {
  it('sha256 coincide con el de Postgres', async () => {
    const { sha256 } = await import('../api/_lib.js')
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
  it('rechaza métodos que no son POST', async () => {
    const h = (await import('../api/bio.js')).default
    expect((await call(h, { method: 'GET' })).code).toBe(405)
  })
  it('staff exige sesión', async () => {
    const h = (await import('../api/staff.js')).default
    expect((await call(h, { method: 'POST', body: { action: 'create' } })).code).toBe(401)
  })
  it('device-checkin exige la clave del gimnasio', async () => {
    const h = (await import('../api/device-checkin.js')).default
    expect((await call(h, { method: 'POST' })).code).toBe(401)
  })
  it('bio rechaza acciones desconocidas', async () => {
    const h = (await import('../api/bio.js')).default
    const r = await call(h, { method: 'POST', body: { action: 'nada' }, headers: { host: 'localhost:5173' } })
    expect(r.code).toBe(400)
  })
})
