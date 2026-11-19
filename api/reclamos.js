// POST /api/reclamos · Libro de Reclamaciones virtual
//   info    (público)  datos del proveedor del libro: un gimnasio (slug) o la plataforma Gymxio
//   create  (público)  registra la hoja, devuelve el número y envía copia al correo si hay proveedor de correo
//   respond (dueño)    responde por escrito y envía la respuesta al correo del consumidor
import { HttpError, clientIp, handle, limit, provider, requireStaff, sendMail } from './_lib.js'
import { validateComplaint } from './_complaint.js'

async function supplier(db, slug) {
  if (!slug) { const p = provider(); return { gymId: null, scope: 'plataforma', name: p.name, tradeName: 'Gymxio', ruc: p.ruc, address: p.address, email: p.email, phone: p.phone } }
  const { data: g } = await db.from('gyms').select('id,name,legal_name,ruc,address,fiscal_address,phone').eq('slug', String(slug)).maybeSingle()
  if (!g) throw new HttpError(404, 'No encontramos ese gimnasio.')
  return { gymId: g.id, scope: 'gimnasio', name: g.legal_name || g.name, tradeName: g.name, ruc: g.ruc || '', address: g.address || g.fiscal_address || '', email: '', phone: g.phone || '' }
}
const ready = (s) => !!(s.name && s.ruc && s.address)
const day = (d) => new Date(d).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
const where = (q, gymId) => (gymId == null ? q.is('gym_id', null) : q.eq('gym_id', gymId))

export const run = async (req, db) => {
  const b = req.body || {}

  if (b.action === 'info') {
    const s = await supplier(db, b.slug)
    return { supplier: { scope: s.scope, name: s.name, tradeName: s.tradeName, ruc: s.ruc, address: s.address, email: s.email, phone: s.phone }, ready: ready(s) }
  }

  if (b.action === 'create') {
    const s = await supplier(db, b.slug)
    if (!ready(s)) throw new HttpError(503, 'El libro de reclamaciones aún no está habilitado: faltan los datos del proveedor.')
    await limit(db, 'claim:' + clientIp(req), 5, 3600) // 5 hojas por hora y por IP
    const v = validateComplaint(b)
    if (!v.ok) throw new HttpError(400, Object.values(v.errors)[0])
    const { data, error } = await db.rpc('create_complaint', { p: v.data, p_gym: s.gymId })
    if (error || !data?.[0]) throw new HttpError(500, 'No se pudo registrar el reclamo. Inténtalo de nuevo.')
    const row = data[0]
    const emailed = await sendMail({
      to: v.data.email,
      subject: `Hoja de Reclamación N° ${row.code} · ${s.name}`,
      text: [`Hoja de Reclamación N° ${row.code}`, `Fecha: ${day(row.created_at)}`, `Proveedor: ${s.name} · RUC ${s.ruc} · ${s.address}`, `Tipo: ${v.data.kind}`,
        `Consumidor: ${v.data.consumer_name} · ${v.data.doc_type} ${v.data.doc_number}`, `Servicio: ${v.data.service_desc}${v.data.amount ? ` · S/ ${v.data.amount}` : ''}`,
        `Detalle: ${v.data.detail}`, `Pedido: ${v.data.request}`, '', `Responderemos por escrito a más tardar el ${day(row.due_date)} (15 días hábiles).`].join('\n'),
    })
    if (emailed) await where(db.from('complaints').update({ copy_sent_at: new Date().toISOString() }).eq('code', row.code), s.gymId)
    return { code: row.code, created_at: row.created_at, due_date: row.due_date, emailed }
  }

  if (b.action === 'respond') {
    const { gymId, user } = await requireStaff(req, db, ['owner'])
    await limit(db, 'staff:' + user.id, 60, 60)
    const text = String(b.response || '').trim().slice(0, 5000)
    if (text.length < 10) throw new HttpError(400, 'Escribe la respuesta (mínimo 10 caracteres).')
    const { data: c } = await db.from('complaints').select('*').eq('id', b.id || 0).eq('gym_id', gymId).maybeSingle()
    if (!c) throw new HttpError(404, 'No encontramos ese reclamo.')
    if (c.status === 'respondido') throw new HttpError(400, 'Este reclamo ya fue respondido.')
    const { data: g } = await db.from('gyms').select('name,legal_name').eq('id', gymId).single()
    const now = new Date().toISOString()
    const emailed = await sendMail({ to: c.email, subject: `Respuesta a tu ${c.kind} N° ${c.code} · ${g.legal_name || g.name}`, text: `Hola ${c.consumer_name},\n\n${text}\n\nHoja de Reclamación N° ${c.code} · ${day(c.created_at)}\n${g.legal_name || g.name}` })
    const { error } = await db.from('complaints').update({ status: 'respondido', response: text, responded_at: now, responded_by: user.id, response_sent_at: emailed ? now : null }).eq('id', c.id)
    if (error) throw new HttpError(500, 'No se pudo guardar la respuesta.')
    return { ok: true, emailed }
  }
  throw new HttpError(400, 'Acción no válida.')
}

export default handle(run)
