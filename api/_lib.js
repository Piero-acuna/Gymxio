// Utilidades compartidas de las funciones serverless (los archivos con _ no son rutas en Vercel)
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'node:crypto'

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}
export const sha256 = (s) => createHash('sha256').update(s).digest('hex')

/** Cliente con service_role: ignora RLS. Nunca exponer esta clave al navegador. */
export function admin() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new HttpError(500, 'Falta SUPABASE_SERVICE_ROLE_KEY en el servidor.')
  return createClient(url, key, { auth: { persistSession: false } })
}

/** Valida el token del navegador y exige uno de los roles dados. */
export async function requireStaff(req, db, roles) {
  const token = (req.headers.authorization || '').replace(/^Bearer /, '')
  if (!token) throw new HttpError(401, 'Inicia sesión.')
  const { data, error } = await db.auth.getUser(token)
  if (error || !data.user) throw new HttpError(401, 'Sesión no válida.')
  const { data: p } = await db.from('profiles').select('gym_id,role').eq('user_id', data.user.id).maybeSingle()
  if (!p || !roles.includes(p.role)) throw new HttpError(403, 'No tienes permiso para esta acción.')
  return { user: data.user, gymId: p.gym_id, role: p.role }
}

export const clientIp = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || String(req.headers['x-real-ip'] || '') || req.socket?.remoteAddress || 'desconocida'

/** Cuenta un intento; false si ya superó el máximo de la ventana. Si la base falla, no bloquea el servicio. */
export async function hit(db, key, max, windowSec) {
  const { data, error } = await db.rpc('rate_limit_hit', { p_key: key, p_max: max, p_window: windowSec })
  if (error) { console.error('rate_limit_hit:', error.message); return true }
  return data !== false
}
/** Consulta sin contar: true si la clave ya está bloqueada. */
export async function isBlocked(db, key, max, windowSec) {
  const { data, error } = await db.rpc('rate_limit_blocked', { p_key: key, p_max: max, p_window: windowSec })
  if (error) { console.error('rate_limit_blocked:', error.message); return false }
  return data === true
}
/** Cuenta un intento y responde 429 si se pasó del máximo. */
export async function limit(db, key, max, windowSec) {
  if (!(await hit(db, key, max, windowSec))) throw new HttpError(429, 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.')
}

/** Datos de quien opera Gymxio (libro de reclamaciones y textos legales de la plataforma). Se definen en variables de entorno. */
export const provider = () => ({
  name: process.env.PROVIDER_NAME || '', ruc: process.env.PROVIDER_RUC || '', address: process.env.PROVIDER_ADDRESS || '',
  email: process.env.PROVIDER_EMAIL || '', phone: process.env.PROVIDER_PHONE || '',
})

/** Envía un correo de texto con Resend. Devuelve false si no está configurado o falla (nunca lanza). */
export async function sendMail({ to, subject, text }) {
  const key = process.env.RESEND_API_KEY, from = process.env.MAIL_FROM
  if (!key || !from) return false
  try {
    const r = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from, to: [to], subject, text }) })
    return r.ok
  } catch { return false }
}

/** Envuelve una función (req, db) => resultado: solo POST, errores en JSON. */
export const handle = (fn) => async (req, res) => {
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido.')
    res.status(200).json(await fn(req, admin()))
  } catch (e) {
    if (e.status === 429) res.setHeader?.('Retry-After', '60')
    res.status(e.status || 500).json({ error: e.message || 'Error' })
  }
}

export function originOf(req) {
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost'
  const proto = req.headers['x-forwarded-proto'] || (host.startsWith('localhost') ? 'http' : 'https')
  return { origin: `${proto}://${host}`, rpID: host.split(':')[0] }
}
