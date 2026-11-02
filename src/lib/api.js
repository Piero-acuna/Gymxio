import { supabase as sb } from './supabase'
import { addDays, todayLima } from './format'

const ok = async (p) => { const { data, error } = await p; if (error) throw error; return data }

export async function loadAll() {
  const t = todayLima()
  const [plans, members, payments, attendance, classes] = await Promise.all([
    ok(sb.from('plans').select('*').eq('active', true).order('price')),
    ok(sb.from('members').select('*').order('name')),
    ok(sb.from('payments').select('*').gte('paid_on', addDays(t, -90)).order('paid_on', { ascending: false }).limit(500)),
    ok(sb.from('attendance').select('member_id,day,at').gte('day', addDays(t, -6)).order('at')),
    ok(sb.from('classes').select('*').order('sort')),
  ])
  return { plans, members, payments, attendance, classes }
}
export const registerMember = (v) => ok(sb.rpc('register_member', { p_name: v.name.trim(), p_dni: v.dni, p_phone: v.phone || '', p_plan: +v.plan, p_method: v.method }))
export const renewMember = (id, plan, method) => ok(sb.rpc('renew_member', { p_member: id, p_plan: +plan, p_method: method }))
export const checkIn = (id, via = 'manual', extra = null) => ok(sb.rpc('check_in', { p_member: id, p_via: via, p_extra: extra }))
export const updateMember = (id, v) => ok(sb.from('members').update({ name: v.name.trim(), dni: v.dni, phone: v.phone }).eq('id', id))
export const updatePlanPrice = (id, price) => ok(sb.from('plans').update({ price }).eq('id', id))
