// POST /api/device-checkin · lo llama el lector biométrico (o su software) al reconocer una huella o rostro.
// Cabecera x-gym-key (se genera en Panel > Configuración) y cuerpo {"device_user_id": 12}
import { HttpError, clientIp, handle, hit, isBlocked, limit, sha256 } from './_lib.js'

export const run = async (req, db) => {
  const ip = clientIp(req)
  await limit(db, 'dev:' + ip, 300, 60) // tráfico normal de lectores
  if (await isBlocked(db, 'devfail:' + ip, 10, 600)) throw new HttpError(429, 'Demasiados intentos con una clave incorrecta. Espera 10 minutos.')
  const key = req.headers['x-gym-key']
  if (!key) throw new HttpError(401, 'Falta la cabecera x-gym-key.')
  const { data: g } = await db.from('gyms').select('id,biometric_mode').eq('device_key_hash', sha256(String(key))).maybeSingle()
  if (!g) { await hit(db, 'devfail:' + ip, 10, 600); throw new HttpError(401, 'Clave no válida.') }
  if (g.biometric_mode !== 'device') throw new HttpError(403, 'Este gimnasio no usa equipos biométricos.')
  const uid = parseInt(req.body?.device_user_id, 10)
  if (!uid) throw new HttpError(400, 'Falta device_user_id.')
  const { data, error } = await db.rpc('check_in_server', { p_gym: g.id, p_device_uid: uid, p_via: 'bio' })
  if (error) throw new HttpError(422, error.message)
  return { ok: true, name: data }
}

export default handle(run)
