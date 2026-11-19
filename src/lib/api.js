import { supabase as sb } from './supabase'
import { addDays, todayLima } from './format'

const ok = async (p) => { const { data, error } = await p; if (error) throw error; return data }
const BUCKET = 'member-files'
// Sin qr_token ni enroll_token: esos secretos solo los entrega member_secrets() a dueño y recepción
const MEMBER_COLS = 'id,gym_id,name,dni,phone,plan_id,plan_name,start_date,end_date,has_bio,created_at,device_user_id,photo_path,dni_front_path,dni_back_path,consent_at'

export async function loadAll() {
  const t = todayLima()
  const [plans, members, payments, attendance, classes, info] = await Promise.all([
    ok(sb.from('plans').select('*').eq('active', true).order('price')),
    ok(sb.from('members').select(MEMBER_COLS).order('name')),
    ok(sb.from('payments').select('*').gte('paid_on', addDays(t, -90)).order('paid_on', { ascending: false }).limit(500)),
    ok(sb.from('attendance').select('member_id,day,at').gte('day', addDays(t, -6)).order('at')),
    ok(sb.from('classes').select('*').order('sort')),
    ok(sb.from('gyms').select('*').limit(1).maybeSingle()),
  ])
  const paths = members.filter((m) => m.photo_path).map((m) => m.photo_path)
  const urls = {}
  if (paths.length) {
    const { data } = await sb.storage.from(BUCKET).createSignedUrls(paths, 3600)
    ;(data || []).forEach((u) => { if (u.signedUrl) urls[u.path] = u.signedUrl })
  }
  return { plans, members: members.map((m) => ({ ...m, photo_url: urls[m.photo_path] || null })), payments, attendance, classes, info }
}
export const registerMember = (v) => ok(sb.rpc('register_member', { p_name: v.name.trim(), p_dni: v.dni, p_phone: v.phone || '', p_plan: +v.plan, p_method: v.method }))
export const renewMember = (id, plan, method) => ok(sb.rpc('renew_member', { p_member: id, p_plan: +plan, p_method: method }))
export const checkIn = (id, via = 'manual', extra = null) => ok(sb.rpc('check_in', { p_member: id, p_via: via, p_extra: extra }))
export const updateMember = (id, v) => ok(sb.from('members').update({ name: v.name.trim(), dni: v.dni, phone: v.phone }).eq('id', id))
export const updatePlanPrice = (id, price) => ok(sb.from('plans').update({ price }).eq('id', id))

// Planes y clases (solo dueño; lo aplica RLS)
export const createPlan = (gymId, b) => ok(sb.from('plans').insert({ gym_id: gymId, ...b }))
export const updatePlan = (id, b) => ok(sb.from('plans').update(b).eq('id', id))
export const createClass = (gymId, b) => ok(sb.from('classes').insert({ gym_id: gymId, ...b }))
export const updateClass = (id, b) => ok(sb.from('classes').update(b).eq('id', id))
export const deleteClass = (id) => ok(sb.from('classes').delete().eq('id', id))
// Panel
export const updateGym = (id, b) => ok(sb.from('gyms').update(b).eq('id', id))
export const updateProfile = (uid, b) => ok(sb.from('profiles').update(b).eq('user_id', uid))
export const listStaff = () => ok(sb.from('profiles').select('user_id,full_name,role,phone,email'))
export const listTickets = () => ok(sb.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(20))
export const createTicket = (gymId, b) => ok(sb.from('support_tickets').insert({ gym_id: gymId, ...b }))

export const rotateDeviceKey = () => ok(sb.rpc('rotate_device_key'))

/** Llama a una función de api/ con la sesión actual (cuentas de empleados). */
async function serverCall(path, body) {
  const { data: { session } } = await sb.auth.getSession()
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + session.access_token }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(r.status === 404 ? 'La API no está disponible: usa npm run dev o despliega en Vercel.' : j.error || 'Error ' + r.status)
  return j
}

// Foto del rostro y DNI (Storage privado). files: { photo, dni_front, dni_back }; Blob = subir, null = quitar
const FILE_COLS = { photo: 'photo_path', dni_front: 'dni_front_path', dni_back: 'dni_back_path' }
export async function saveMemberFiles(gymId, memberId, files) {
  const patch = {}
  for (const [kind, col] of Object.entries(FILE_COLS)) {
    const f = files[kind], path = `${gymId}/${memberId}/${kind}.jpg`
    if (f instanceof Blob) {
      const { error } = await sb.storage.from(BUCKET).upload(path, f, { upsert: true, contentType: 'image/jpeg' })
      if (error) throw error
      patch[col] = path
    } else if (f === null) {
      await sb.storage.from(BUCKET).remove([path])
      patch[col] = null
    }
  }
  if (!Object.keys(patch).length) return
  if (Object.values(patch).some(Boolean)) patch.consent_at = new Date().toISOString()
  await ok(sb.from('members').update(patch).eq('id', memberId))
}
export async function signedUrl(path) {
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(path, 3600)
  if (error) throw error
  return data.signedUrl
}

/** Elimina al miembro (solo dueño) y sus archivos del Storage. Los pagos se conservan en el historial. */
export async function deleteMember(gymId, id) {
  const { data, error } = await sb.from('members').delete().eq('id', id).select('id')
  if (error) throw error
  if (!data.length) throw new Error('No tienes permiso para eliminar miembros.')
  const { error: e2 } = await sb.storage.from(BUCKET).remove(Object.keys(FILE_COLS).map((k) => `${gymId}/${id}/${k}.jpg`))
  if (e2) throw new Error('Miembro eliminado, pero no se pudieron borrar sus archivos: ' + e2.message)
}

export const memberSecrets = async (id) => (await ok(sb.rpc('member_secrets', { p_member: id })))[0]
export const staffApi = (b) => serverCall('/api/staff', b)
export const complaintsApi = (b) => serverCall('/api/reclamos', b)
export const listComplaints = () => ok(sb.from('complaints').select('*').order('created_at', { ascending: false }).limit(200))
