// POST /api/bio · huella o rostro del celular (WebAuthn) con verificación de firma en el servidor
import { randomBytes } from 'node:crypto'
import { generateAuthenticationOptions, generateRegistrationOptions, verifyAuthenticationResponse, verifyRegistrationResponse } from '@simplewebauthn/server'
import { HttpError, clientIp, handle, limit, originOf } from './_lib.js'

const b64 = (u8) => Buffer.from(u8).toString('base64url')
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64url'))
const TTL = 5 * 60e3

async function saveChallenge(db, challenge, purpose, memberId = null) {
  const { data, error } = await db.from('webauthn_challenges').insert({ challenge, purpose, member_id: memberId }).select('id').single()
  if (error) throw new HttpError(500, error.message)
  return data.id
}
async function takeChallenge(db, id, purpose) {
  const { data } = await db.from('webauthn_challenges').select('*').eq('id', id || '').eq('purpose', purpose).maybeSingle()
  if (!data || Date.now() - Date.parse(data.created_at) > TTL) throw new HttpError(400, 'La verificación expiró. Inténtalo de nuevo.')
  await db.from('webauthn_challenges').delete().eq('id', id)
  return data
}

/** Borra los desafíos que nunca se usaron (evita que la tabla crezca). */
const purge = (db) => db.from('webauthn_challenges').delete().lt('created_at', new Date(Date.now() - 2 * TTL).toISOString())

export const run = async (req, db) => {
  await limit(db, 'bio:' + clientIp(req), 120, 60) // 120 solicitudes por minuto y por IP (varios celulares comparten el wifi del gimnasio)
  const b = req.body || {}
  const { origin, rpID } = originOf(req)

  // 1) El miembro abre su enlace de vinculación en su celular
  if (b.action === 'enroll-options') {
    await purge(db)
    const { data: m } = await db.from('members').select('id,name,dni,gyms(biometric_mode)').eq('enroll_token', b.token || '').maybeSingle()
    if (!m) throw new HttpError(404, 'Enlace no válido o ya usado. Pide uno nuevo en recepción.')
    if (m.gyms.biometric_mode !== 'phone') throw new HttpError(403, 'Este gimnasio no usa huella o rostro del celular.')
    const options = await generateRegistrationOptions({
      rpName: 'Gymxio', rpID, userName: m.dni, userDisplayName: m.name, userID: new TextEncoder().encode(String(m.id)), attestationType: 'none',
      authenticatorSelection: { residentKey: 'required', userVerification: 'required', authenticatorAttachment: 'platform' },
    })
    return { options, cid: await saveChallenge(db, options.challenge, 'reg', m.id) }
  }
  if (b.action === 'enroll-verify') {
    const c = await takeChallenge(db, b.cid, 'reg')
    const v = await verifyRegistrationResponse({ response: b.response, expectedChallenge: c.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true })
    if (!v.verified) throw new HttpError(400, 'No se pudo verificar la huella o el rostro.')
    const { credential } = v.registrationInfo
    const { data: m } = await db.from('members').select('id,gym_id,name').eq('id', c.member_id).single()
    const { error } = await db.from('member_credentials').upsert({ gym_id: m.gym_id, member_id: m.id, credential_id: credential.id, public_key: b64(credential.publicKey), counter: credential.counter, transports: credential.transports || null }, { onConflict: 'credential_id' })
    if (error) throw new HttpError(500, error.message)
    await db.from('members').update({ has_bio: true, enroll_token: randomBytes(16).toString('hex') }).eq('id', m.id) // el enlace usado deja de servir
    return { ok: true, name: m.name }
  }

  // 2) El miembro ingresa desde su celular
  if (b.action === 'login-options') {
    await purge(db)
    const options = await generateAuthenticationOptions({ rpID, userVerification: 'required' })
    return { options, cid: await saveChallenge(db, options.challenge, 'auth') }
  }
  if (b.action === 'login-verify') {
    const c = await takeChallenge(db, b.cid, 'auth')
    const { data: cred } = await db.from('member_credentials').select('*').eq('credential_id', b.response?.id || '').maybeSingle()
    if (!cred?.public_key) throw new HttpError(404, 'Este celular no está vinculado. Pide tu enlace en recepción.')
    const v = await verifyAuthenticationResponse({
      response: b.response, expectedChallenge: c.challenge, expectedOrigin: origin, expectedRPID: rpID, requireUserVerification: true,
      credential: { id: cred.credential_id, publicKey: unb64(cred.public_key), counter: Number(cred.counter), transports: cred.transports || undefined },
    })
    if (!v.verified) throw new HttpError(401, 'No se pudo verificar la huella o el rostro.')
    await db.from('member_credentials').update({ counter: v.authenticationInfo.newCounter }).eq('id', cred.id)
    const { data: g } = await db.from('gyms').select('biometric_mode').eq('id', cred.gym_id).single()
    if (g.biometric_mode !== 'phone') throw new HttpError(403, 'Este gimnasio no usa huella o rostro del celular.')
    const { data: name, error } = await db.rpc('check_in_server', { p_gym: cred.gym_id, p_member: cred.member_id, p_via: 'bio' })
    if (error) throw new HttpError(422, error.message)
    return { ok: true, name }
  }
  throw new HttpError(400, 'Acción no válida.')
}

export default handle(run)
