import { describe, it, expect } from 'vitest'
import { run } from '../api/bio.js'
import { fakeDb } from './helpers/fakeDb.js'
import { makeAuthenticator } from './helpers/authenticator.js'

const origin = 'http://localhost:5173', rpID = 'localhost'
const req = (body) => ({ method: 'POST', headers: { host: 'localhost:5173', 'x-forwarded-for': '1.2.3.4' }, body })
const ok = { check_in_server: () => ({ data: 'Luis Quispe', error: null }) }
const setup = (mode = 'phone', rpcs = ok) => fakeDb({
  members: [{ id: 7, name: 'Luis Quispe', dni: '12345678', gym_id: 1, enroll_token: 'tok123', has_bio: false, gyms: { biometric_mode: mode } }],
  gyms: [{ id: 1, biometric_mode: mode }],
}, rpcs)

async function enroll(db, a) {
  const { options, cid } = await run(req({ action: 'enroll-options', token: 'tok123' }), db)
  return run(req({ action: 'enroll-verify', cid, response: a.register({ options, origin, rpID }) }), db)
}
async function loginStart(db, a, extra = {}) {
  const { options, cid } = await run(req({ action: 'login-options' }), db)
  return { cid, response: a.login({ options, origin, rpID, ...extra }) }
}
const verify = (db, l) => run(req({ action: 'login-verify', cid: l.cid, response: l.response }), db)

describe('huella o rostro del celular (WebAuthn, autenticador simulado)', () => {
  it('vincula el celular, ingresa y el contador sube en cada ingreso', async () => {
    const db = setup(), a = makeAuthenticator()
    expect(await enroll(db, a)).toEqual({ ok: true, name: 'Luis Quispe' })
    expect(db.tables.member_credentials[0].public_key).toBeTruthy()
    expect(db.tables.members[0].has_bio).toBe(true)
    expect(db.tables.members[0].enroll_token).not.toBe('tok123') // el enlace usado deja de servir

    expect(await verify(db, await loginStart(db, a))).toEqual({ ok: true, name: 'Luis Quispe' })
    expect(db.calls.find((c) => c[0] === 'check_in_server')[1]).toEqual({ p_gym: 1, p_member: 7, p_via: 'bio' })
    expect(db.tables.member_credentials[0].counter).toBe(1)
    await verify(db, await loginStart(db, a))
    expect(db.tables.member_credentials[0].counter).toBe(2)
  })
  it('rechaza una firma hecha con otra clave y no registra el ingreso', async () => {
    const db = setup(), a = makeAuthenticator()
    await enroll(db, a)
    await expect(verify(db, await loginStart(db, a, { key: a.otherKey }))).rejects.toThrow()
    expect(db.calls.some((c) => c[0] === 'check_in_server')).toBe(false)
  })
  it('un desafío solo sirve una vez', async () => {
    const db = setup(), a = makeAuthenticator()
    await enroll(db, a)
    const l = await loginStart(db, a)
    await verify(db, l)
    await expect(verify(db, l)).rejects.toMatchObject({ status: 400 })
  })
  it('un desafío vencido no sirve', async () => {
    const db = setup(), a = makeAuthenticator()
    await enroll(db, a)
    const l = await loginStart(db, a)
    db.tables.webauthn_challenges.forEach((c) => { c.created_at = new Date(Date.now() - 20 * 60e3).toISOString() })
    await expect(verify(db, l)).rejects.toMatchObject({ status: 400 })
  })
  it('un celular no vinculado no entra', async () => {
    const db = setup()
    await expect(verify(db, await loginStart(db, makeAuthenticator()))).rejects.toMatchObject({ status: 404 })
  })
  it('un enlace de vinculación inventado no sirve', async () => {
    await expect(run(req({ action: 'enroll-options', token: 'falso' }), setup())).rejects.toMatchObject({ status: 404 })
  })
  it('respeta el modo del gimnasio', async () => {
    await expect(run(req({ action: 'enroll-options', token: 'tok123' }), setup('none'))).rejects.toMatchObject({ status: 403 })
    const db = setup(), a = makeAuthenticator()
    await enroll(db, a)
    db.tables.gyms[0].biometric_mode = 'device'
    await expect(verify(db, await loginStart(db, a))).rejects.toMatchObject({ status: 403 })
    expect(db.calls.some((c) => c[0] === 'check_in_server')).toBe(false)
  })
  it('una membresía vencida no registra ingreso', async () => {
    const db = setup('phone', { check_in_server: () => ({ data: null, error: { message: 'Membresía vencida. Renueva para registrar el ingreso.' } }) }), a = makeAuthenticator()
    await enroll(db, a)
    await expect(verify(db, await loginStart(db, a))).rejects.toMatchObject({ status: 422, message: /vencida/ })
  })
  it('limita las solicitudes por IP', async () => {
    const db = setup('phone', { rate_limit_hit: () => ({ data: false, error: null }) })
    await expect(run(req({ action: 'login-options' }), db)).rejects.toMatchObject({ status: 429 })
  })
})
