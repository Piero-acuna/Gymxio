// Validación compartida del Libro de Reclamaciones (la usan la página pública y api/reclamos.js)
export const DOC_TYPES = { DNI: /^\d{8}$/, CE: /^[A-Za-z0-9]{9,12}$/, PAS: /^[A-Za-z0-9]{6,12}$/, RUC: /^\d{11}$/ }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Devuelve { ok, errors: { campo: mensaje }, data } con los campos limpios. */
export function validateComplaint(b) {
  const t = (k) => String(b[k] ?? '').trim().slice(0, k === 'detail' || k === 'request' ? 3000 : 300)
  const e = {}
  if (!['reclamo', 'queja'].includes(b.kind)) e.kind = 'Elige si es un reclamo o una queja.'
  if (t('consumer_name').length < 3) e.consumer_name = 'Escribe tu nombre completo.'
  if (!DOC_TYPES[b.doc_type]) e.doc_type = 'Elige el tipo de documento.'
  else if (!DOC_TYPES[b.doc_type].test(t('doc_number'))) e.doc_number = 'El número de documento no es válido.'
  if (t('address').length < 5) e.address = 'Escribe tu domicilio.'
  if (t('phone').replace(/\D/g, '').length < 6) e.phone = 'Escribe un teléfono válido.'
  if (!EMAIL.test(t('email'))) e.email = 'Escribe un correo válido.'
  if (b.minor && (t('guardian_name').length < 3 || t('guardian_doc').length < 6)) e.guardian_name = 'Indica el nombre y el documento de tu padre, madre o representante.'
  if (t('service_desc').length < 3) e.service_desc = 'Indica el servicio contratado.'
  if (t('amount') && !(Number(t('amount')) >= 0)) e.amount = 'El monto no es válido.'
  if (t('detail').length < 10) e.detail = 'Cuéntanos qué ocurrió (mínimo 10 caracteres).'
  if (t('request').length < 5) e.request = 'Indica qué solicitas.'
  const data = {
    kind: b.kind, consumer_name: t('consumer_name'), doc_type: b.doc_type, doc_number: t('doc_number').toUpperCase(), address: t('address'), phone: t('phone'),
    email: t('email').toLowerCase(), guardian_name: b.minor ? t('guardian_name') : '', guardian_doc: b.minor ? t('guardian_doc') : '',
    service_desc: t('service_desc'), amount: t('amount'), detail: t('detail'), request: t('request'),
  }
  return { ok: !Object.keys(e).length, errors: e, data }
}
