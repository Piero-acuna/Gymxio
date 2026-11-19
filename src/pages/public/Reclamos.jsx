import { useEffect, useRef, useState } from 'react'
import { postJson } from '../../lib/http'
import { DOC_TYPES, validateComplaint } from '../../../api/_complaint.js'

const day = (d) => new Date(d).toLocaleDateString('es-PE', { timeZone: 'America/Lima' })
const Row = ({ k, v }) => v ? <div className="flex gap-3 border-t border-gx-line py-1.5 text-sm first:border-t-0"><span className="w-36 flex-none text-gx-mut">{k}</span><span className="min-w-0 break-words">{v}</span></div> : null

/** /reclamos[?g=codigo]: Libro de Reclamaciones virtual (DS 011-2011-PCM). Sin código = libro de la plataforma Gymxio. */
export default function Reclamos() {
  const slug = new URLSearchParams(window.location.search).get('g') || ''
  const form = useRef()
  const [info, setInfo] = useState(null)
  const [err, setErr] = useState('')
  const [errors, setErrors] = useState({})
  const [minor, setMinor] = useState(false)
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)

  useEffect(() => { postJson('/api/reclamos', { action: 'info', slug }).then(setInfo).catch((e) => setErr(e.message)) }, [slug])

  async function submit(e) {
    e.preventDefault()
    const raw = Object.fromEntries(new FormData(form.current))
    raw.minor = minor
    const v = validateComplaint(raw)
    setErrors(v.errors)
    if (!v.ok) return
    setBusy(true); setErr('')
    try { setDone({ ...(await postJson('/api/reclamos', { action: 'create', slug, ...raw })), data: v.data }) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  const s = info?.supplier
  const field = (name, label, props = {}) => (
    <div className="mt-3"><label className="lbl !mt-0">{label}</label><input name={name} className="inp" {...props} />{errors[name] && <p className="mt-1 text-xs text-gx-bad">{errors[name]}</p>}</div>
  )
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-5 flex items-center gap-3 rounded-2xl border border-gx-amb/40 bg-gx-amb/10 p-4">
        <img src="/favicon.svg" alt="" className="h-11 w-11" />
        <div><h1 className="text-lg font-bold tracking-wide">LIBRO DE RECLAMACIONES</h1><p className="text-sm text-gx-mut">{s?.tradeName || 'Gymxio'} · Hoja de Reclamación virtual</p></div>
      </div>

      {err && !done && <p className="card mb-4 border-gx-bad/40 p-4 text-gx-bad">{err}</p>}
      {info && !info.ready && <p className="card p-5 text-gx-mut">Este libro de reclamaciones todavía no está habilitado porque faltan los datos del proveedor. Si necesitas presentar un reclamo, comunícate directamente con el establecimiento.</p>}

      {done ? (
        <div className="card p-6">
          <div id="constancia">
            <h2 className="text-xl font-bold">Hoja de Reclamación N° {done.code}</h2>
            <p className="mb-3 text-sm text-gx-mut">Registrada el {day(done.created_at)}. Guarda o imprime esta constancia.</p>
            <Row k="Proveedor" v={`${s.name} · RUC ${s.ruc}`} /><Row k="Dirección" v={s.address} />
            <Row k="Tipo" v={done.data.kind === 'reclamo' ? 'Reclamo' : 'Queja'} />
            <Row k="Consumidor" v={`${done.data.consumer_name} · ${done.data.doc_type} ${done.data.doc_number}`} />
            <Row k="Domicilio" v={done.data.address} /><Row k="Teléfono / correo" v={`${done.data.phone} · ${done.data.email}`} />
            <Row k="Padre o representante" v={done.data.guardian_name && `${done.data.guardian_name} · ${done.data.guardian_doc}`} />
            <Row k="Servicio contratado" v={done.data.service_desc + (done.data.amount ? ` · S/ ${done.data.amount}` : '')} />
            <Row k="Detalle" v={done.data.detail} /><Row k="Pedido del consumidor" v={done.data.request} />
            <p className="mt-3 text-sm">El proveedor debe responder por escrito a más tardar el <b>{day(done.due_date)}</b> (15 días hábiles).</p>
          </div>
          <p className="mt-3 text-sm text-gx-mut">{done.emailed ? `Enviamos una copia a ${done.data.email}.` : 'No se envió copia por correo; conserva esta constancia.'}</p>
          <div className="mt-4 flex gap-2.5"><button className="btn btn-p" onClick={() => window.print()}>Imprimir constancia</button><button className="btn" onClick={() => setDone(null)}>Nueva hoja</button></div>
        </div>
      ) : info?.ready && (
        <form ref={form} onSubmit={submit} className="card p-6" noValidate>
          <h2 className="mb-1 font-semibold">1. Identificación del proveedor</h2>
          <p className="mb-4 text-sm text-gx-mut">{s.name} · RUC {s.ruc} · {s.address}</p>

          <h2 className="font-semibold">2. Identificación del consumidor</h2>
          {field('consumer_name', 'Nombres y apellidos', { autoComplete: 'name' })}
          <div className="grid grid-cols-[140px_1fr] gap-3">
            <div className="mt-3"><label className="lbl !mt-0">Documento</label><select name="doc_type" className="inp" defaultValue="DNI">{Object.keys(DOC_TYPES).map((k) => <option key={k}>{k}</option>)}</select></div>
            {field('doc_number', 'Número', { inputMode: 'numeric' })}
          </div>
          {errors.doc_type && <p className="mt-1 text-xs text-gx-bad">{errors.doc_type}</p>}
          {field('address', 'Domicilio', { autoComplete: 'street-address' })}
          <div className="grid gap-3 sm:grid-cols-2">{field('phone', 'Teléfono', { type: 'tel', autoComplete: 'tel' })}{field('email', 'Correo electrónico', { type: 'email', autoComplete: 'email' })}</div>
          <label className="mt-3 flex items-center gap-2 text-sm"><input type="checkbox" className="accent-amber-500" checked={minor} onChange={(e) => setMinor(e.target.checked)} /> Soy menor de edad</label>
          {minor && <div className="grid gap-3 sm:grid-cols-2">{field('guardian_name', 'Padre, madre o representante')}{field('guardian_doc', 'Su documento')}</div>}

          <h2 className="mt-6 font-semibold">3. Identificación del bien o servicio contratado</h2>
          {field('service_desc', 'Servicio (ej. membresía mensual)')}
          {field('amount', 'Monto en soles (opcional)', { inputMode: 'decimal' })}

          <h2 className="mt-6 font-semibold">4. Detalle del reclamo o queja</h2>
          <fieldset className="mt-2 flex gap-5 text-sm">
            <label className="flex items-center gap-2"><input type="radio" name="kind" value="reclamo" defaultChecked className="accent-amber-500" /> Reclamo <span className="text-gx-mut">(disconformidad con el servicio)</span></label>
            <label className="flex items-center gap-2"><input type="radio" name="kind" value="queja" className="accent-amber-500" /> Queja <span className="text-gx-mut">(malestar sin relación con el servicio)</span></label>
          </fieldset>
          <div className="mt-3"><label className="lbl !mt-0">Detalle</label><textarea name="detail" rows={4} className="inp" />{errors.detail && <p className="mt-1 text-xs text-gx-bad">{errors.detail}</p>}</div>
          <div className="mt-3"><label className="lbl !mt-0">Pedido del consumidor</label><textarea name="request" rows={2} className="inp" />{errors.request && <p className="mt-1 text-xs text-gx-bad">{errors.request}</p>}</div>

          <p className="mt-4 text-xs text-gx-mut">La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el Indecopi. El proveedor debe responder en un plazo no mayor a 15 días hábiles. Tus datos se usan solo para atender este reclamo y se conservan por dos años; consulta la <a className="text-amber-400" href="/legal#privacidad">Política de Privacidad</a>.</p>
          {Object.keys(errors).length > 0 && <p className="mt-3 text-sm text-gx-bad">Revisa los campos marcados.</p>}
          <button className="btn btn-p mt-4 w-full py-3" disabled={busy}>{busy ? 'Enviando…' : 'Enviar hoja de reclamación'}</button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><a href="/legal#terminos" className="text-gx-mut">Términos</a> · <a href="/legal#privacidad" className="text-gx-mut">Privacidad</a> · <a href="/" className="text-gx-mut">Gymxio</a></p>
    </div>
  )
}
