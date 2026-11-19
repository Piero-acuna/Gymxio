// POST /api/staff · el dueño crea y administra las cuentas de su equipo de trabajo
import { HttpError, handle, limit, requireStaff } from './_lib.js'

const ROLES = ['reception', 'trainer']
const needRole = (r) => { if (!ROLES.includes(r)) throw new HttpError(400, 'Rol no válido.') }
const needPass = (p) => { if (!p || p.length < 6) throw new HttpError(400, 'La contraseña debe tener al menos 6 caracteres.') }

export default handle(async (req, db) => {
  const { gymId, user } = await requireStaff(req, db, ['owner'])
  await limit(db, 'staff:' + user.id, 60, 60)
  const b = req.body || {}

  if (b.action === 'create') {
    needRole(b.role); needPass(b.password)
    if (!b.email) throw new HttpError(400, 'El correo es obligatorio.')
    const { data, error } = await db.auth.admin.createUser({ email: b.email.trim(), password: b.password, email_confirm: true })
    if (error) throw new HttpError(400, /already|registered/i.test(error.message) ? 'Ese correo ya tiene una cuenta.' : error.message)
    const { error: e2 } = await db.from('profiles').insert({ user_id: data.user.id, gym_id: gymId, role: b.role, full_name: b.full_name?.trim() || null, phone: b.phone?.trim() || null })
    if (e2) { await db.auth.admin.deleteUser(data.user.id); throw new HttpError(400, e2.message) }
    return { ok: true }
  }

  // Las demás acciones solo aplican a empleados del mismo gimnasio (nunca a uno mismo ni a otro dueño)
  const { data: t } = await db.from('profiles').select('user_id,role,gym_id').eq('user_id', b.user_id || '').maybeSingle()
  if (!t || t.gym_id !== gymId || t.user_id === user.id || t.role === 'owner') throw new HttpError(400, 'No se puede modificar a ese usuario.')

  if (b.action === 'update') {
    needRole(b.role)
    const { error } = await db.from('profiles').update({ role: b.role, full_name: b.full_name?.trim() || null, phone: b.phone?.trim() || null }).eq('user_id', t.user_id)
    if (error) throw new HttpError(400, error.message)
    return { ok: true }
  }
  if (b.action === 'reset-password') {
    needPass(b.password)
    const { error } = await db.auth.admin.updateUserById(t.user_id, { password: b.password })
    if (error) throw new HttpError(400, error.message)
    return { ok: true }
  }
  if (b.action === 'remove') {
    const { error } = await db.auth.admin.deleteUser(t.user_id) // el perfil se borra en cascada
    if (error) throw new HttpError(400, error.message)
    return { ok: true }
  }
  throw new HttpError(400, 'Acción no válida.')
})
