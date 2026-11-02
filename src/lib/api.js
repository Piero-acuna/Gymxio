import { supabase as sb } from './supabase'
import { addDays, todayLima } from './format'

const ok = async (p) => { const { data, error } = await p; if (error) throw error; return data }

export async function loadAll() {
  const t = todayLima()
  const [plans, members, payments, attendance, classes, info] = await Promise.all([
    ok(sb.from('plans').select('*').eq('active', true).order('price')),
    ok(sb.from('members').select('*').order('name')),
    ok(sb.from('payments').select('*').gte('paid_on', addDays(t, -90)).order('paid_on', { ascending: false }).limit(500)),
    ok(sb.from('attendance').select('member_id,day,at').gte('day', addDays(t, -6)).order('at')),
    ok(sb.from('classes').select('*').order('sort')),
    ok(sb.from('gyms').select('*').limit(1).maybeSingle()),
  ])
  return { plans, members, payments, attendance, classes, info }
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
export const listEquipment = () => ok(sb.from('equipment').select('*').order('name'))
export const saveEquipment = (gymId, id, b) => ok(id ? sb.from('equipment').update(b).eq('id', id) : sb.from('equipment').insert({ gym_id: gymId, ...b }))
export const deleteEquipment = (id) => ok(sb.from('equipment').delete().eq('id', id))
export const listStaff = () => ok(sb.from('profiles').select('user_id,full_name,role,phone'))
export const addStaff = (email, role, name) => ok(sb.rpc('add_staff', { p_email: email, p_role: role, p_name: name || null }))
export const listTickets = () => ok(sb.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(20))
export const createTicket = (gymId, b) => ok(sb.from('support_tickets').insert({ gym_id: gymId, ...b }))
