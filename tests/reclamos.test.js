import { describe, it, expect, beforeEach } from 'vitest'
import { run } from '../api/reclamos.js'
import { run as runDevice } from '../api/device-checkin.js'
import { validateComplaint } from '../api/_complaint.js'
import { sha256 } from '../api/_lib.js'
import { fakeDb } from './helpers/fakeDb.js'

const valida = { kind: 'reclamo', consumer_name: 'Ana Torres', doc_type: 'DNI', doc_number: '12345678', address: 'Av. Perú 456', phone: '999888777', email: 'Ana@Correo.com', service_desc: 'Membresía mensual', amount: '80', detail: 'Me cobraron dos veces el mes', request: 'Devolución del cobro' }
const req = (body, headers = {}) => ({ method: 'POST', headers: { 'x-forwarded-for': '9.9.9.9', ...headers }, body })
const fila = { code: '0001-2026', created_at: '2026-11-09T15:00:00Z', due_date: '2026-11-30' }
const crear = { create_complaint: () => ({ data: [fila], error: null }) }

beforeEach(() => {
  Object.assign(process.env, { PROVIDER_NAME: 'Gymxio SAC', PROVIDER_RUC: '20123456789', PROVIDER_ADDRESS: 'Av. Lima 123', PROVIDER_EMAIL: 'hola@gymxio.pe', PROVIDER_PHONE: '999000111' })
  delete process.env.RESEND_API_KEY
})

describe('validación de la hoja', () => {
  it('acepta una hoja correcta y limpia los datos', () => {
    const v = validateComplaint(valida)
    expect(v.ok).toBe(true)
    expect(v.data.email).toBe('ana@correo.com')
  })
  it('rechaza documento, correo y detalle inválidos', () => {
    const v = validateComplaint({ ...valida, doc_number: '123', email: 'x', detail: 'corto' })
    expect(Object.keys(v.errors).sort()).toEqual(['detail', 'doc_number', 'email'])
  })
  it('un menor debe indicar a su representante', () => {
    expect(validateComplaint({ ...valida, minor: true }).errors.guardian_name).toBeTruthy()
    expect(validateComplaint({ ...valida, minor: true, guardian_name: 'Rosa Torres', guardian_doc: '87654321' }).ok).toBe(true)
  })
  it('acepta carné de extranjería y RUC', () => {
    expect(validateComplaint({ ...valida, doc_type: 'CE', doc_number: '001234567' }).ok).toBe(true)
    expect(validateComplaint({ ...valida, doc_type: 'RUC', doc_number: '20123456789' }).ok).toBe(true)
  })
})

describe('api/reclamos', () => {
  it('info de la plataforma sale de las variables de entorno', async () => {
    const r = await run(req({ action: 'info' }), fakeDb())
    expect(r.ready).toBe(true)
    expect(r.supplier.ruc).toBe('20123456789')
  })
  it('info de un gimnasio usa su razón social y no está listo sin RUC', async () => {
    const db = fakeDb({ gyms: [{ id: 1, slug: 'abc', name: 'Iron Fit', legal_name: 'Iron Fit SAC', ruc: null, address: 'Jr. Cusco 1' }] })
    const r = await run(req({ action: 'info', slug: 'abc' }), db)
    expect(r.supplier.name).toBe('Iron Fit SAC')
    expect(r.ready).toBe(false)
    await expect(run(req({ action: 'info', slug: 'nada' }), db)).rejects.toMatchObject({ status: 404 })
  })
  it('registra la hoja y devuelve el número', async () => {
    const db = fakeDb({}, crear)
    const r = await run(req({ action: 'create', ...valida }), db)
    expect(r).toMatchObject({ code: '0001-2026', due_date: '2026-11-30', emailed: false })
    const llamada = db.calls.find((c) => c[0] === 'create_complaint')[1]
    expect(llamada.p_gym).toBeNull()
    expect(llamada.p.email).toBe('ana@correo.com')
  })
  it('no registra datos inválidos', async () => {
    await expect(run(req({ action: 'create', ...valida, email: 'mal' }), fakeDb({}, crear))).rejects.toMatchObject({ status: 400 })
  })
  it('no abre el libro si faltan los datos del proveedor', async () => {
    delete process.env.PROVIDER_RUC
    await expect(run(req({ action: 'create', ...valida }), fakeDb({}, crear))).rejects.toMatchObject({ status: 503 })
  })
  it('limita las hojas por IP', async () => {
    const db = fakeDb({}, { ...crear, rate_limit_hit: () => ({ data: false, error: null }) })
    await expect(run(req({ action: 'create', ...valida }), db)).rejects.toMatchObject({ status: 429 })
    expect(db.calls.some((c) => c[0] === 'create_complaint')).toBe(false)
  })
  it('si falla el contador de intentos, el libro sigue disponible', async () => {
    const db = fakeDb({}, { ...crear, rate_limit_hit: () => ({ data: null, error: { message: 'caído' } }) })
    expect((await run(req({ action: 'create', ...valida }), db)).code).toBe('0001-2026')
  })
})

describe('responder (solo dueño)', () => {
  const sembrar = (role = 'owner') => fakeDb({
    profiles: [{ user_id: 'u1', gym_id: 1, role }],
    gyms: [{ id: 1, name: 'Iron Fit', legal_name: 'Iron Fit SAC' }],
    complaints: [{ id: 5, gym_id: 1, code: '0001-2026', kind: 'reclamo', email: 'ana@correo.com', consumer_name: 'Ana', status: 'pendiente', created_at: '2026-11-09T15:00:00Z' }, { id: 6, gym_id: 2, code: '0001-2026', status: 'pendiente' }],
  }, { __users: { tok: { id: 'u1' } } })
  const auth = { authorization: 'Bearer tok' }

  it('exige sesión', async () => {
    await expect(run(req({ action: 'respond', id: 5, response: 'Respuesta larga' }), sembrar())).rejects.toMatchObject({ status: 401 })
  })
  it('el dueño responde y queda registrado', async () => {
    const db = sembrar()
    expect(await run(req({ action: 'respond', id: 5, response: 'Devolveremos el cobro duplicado.' }, auth), db)).toEqual({ ok: true, emailed: false })
    expect(db.tables.complaints[0]).toMatchObject({ status: 'respondido', responded_by: 'u1', response_sent_at: null })
    await expect(run(req({ action: 'respond', id: 5, response: 'Otra respuesta distinta' }, auth), db)).rejects.toMatchObject({ status: 400 })
  })
  it('recepción no puede responder', async () => {
    await expect(run(req({ action: 'respond', id: 5, response: 'Respuesta larga' }, auth), sembrar('reception'))).rejects.toMatchObject({ status: 403 })
  })
  it('no se responden hojas de otro gimnasio', async () => {
    await expect(run(req({ action: 'respond', id: 6, response: 'Respuesta larga' }, auth), sembrar())).rejects.toMatchObject({ status: 404 })
  })
})

describe('api/device-checkin', () => {
  const lector = (rpcs = {}) => fakeDb({ gyms: [{ id: 1, biometric_mode: 'device', device_key_hash: sha256('CLAVE') }] }, { check_in_server: () => ({ data: 'Luis', error: null }), ...rpcs })
  const dev = (key, id = 12) => req({ device_user_id: id }, key ? { 'x-gym-key': key } : {})

  it('registra el ingreso con la clave correcta', async () => {
    const db = lector()
    expect(await runDevice(dev('CLAVE'), db)).toEqual({ ok: true, name: 'Luis' })
    expect(db.calls.find((c) => c[0] === 'check_in_server')[1]).toEqual({ p_gym: 1, p_device_uid: 12, p_via: 'bio' })
  })
  it('una clave incorrecta cuenta como intento fallido', async () => {
    const db = lector()
    await expect(runDevice(dev('MALA'), db)).rejects.toMatchObject({ status: 401 })
    expect(db.calls.some((c) => c[0] === 'rate_limit_hit' && c[1].p_key === 'devfail:9.9.9.9')).toBe(true)
  })
  it('tras demasiados fallos bloquea incluso la clave correcta', async () => {
    await expect(runDevice(dev('CLAVE'), lector({ rate_limit_blocked: () => ({ data: true, error: null }) }))).rejects.toMatchObject({ status: 429 })
  })
  it('exige clave y modo equipos', async () => {
    await expect(runDevice(dev(null), lector())).rejects.toMatchObject({ status: 401 })
    const db = lector(); db.tables.gyms[0].biometric_mode = 'phone'
    await expect(runDevice(dev('CLAVE'), db)).rejects.toMatchObject({ status: 403 })
  })
})
