import { useState } from 'react'
import { complaintsApi, listComplaints } from '../../lib/api'
import { useLoad, useRun } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import { daysBetween, fmtDate, todayLima } from '../../lib/format'
import Modal from '../../components/ui/Modal'
import QrImage from '../../components/QrImage'

const Row = ({ k, v }) => v ? <div className="flex gap-3 border-t border-gx-line py-1.5 text-sm first:border-t-0"><span className="w-36 flex-none text-gx-mut">{k}</span><span className="min-w-0 break-words">{v}</span></div> : null

/** Libro de Reclamaciones del gimnasio: enlace público, hojas recibidas y respuestas. */
export default function Reclamos({ gym }) {
  const { info } = gym
  const { data, ready, reload } = useLoad(listComplaints)
  const run = useRun(reload)
  const toast = useToast()
  const [sel, setSel] = useState(null)
  const link = `${window.location.origin}/reclamos?g=${info.slug}`
  const enabled = !!((info.legal_name || info.name) && info.ruc && (info.address || info.fiscal_address))
  const today = todayLima()
  const left = (c) => daysBetween(today, c.due_date)
  const pending = data.filter((c) => c.status === 'pendiente')
  const copy = async () => { try { await navigator.clipboard.writeText(link); toast('Enlace copiado') } catch { toast('No se pudo copiar', 'bad') } }

  const send = (e) => {
    e.preventDefault()
    const response = new FormData(e.target).get('response')
    run(async () => {
      const r = await complaintsApi({ action: 'respond', id: sel.id, response })
      setSel(null)
      return r
    }, (r) => (r.emailed ? 'Respuesta enviada al correo del consumidor' : 'Respuesta guardada. Envíala tú al correo del consumidor.'))
  }

  return (
    <div className="space-y-5">
      <section className="card grid gap-5 p-6 sm:grid-cols-[1fr_auto]">
        <div>
          <h3 className="font-semibold">Tu Libro de Reclamaciones virtual</h3>
          <p className="mt-1 break-all font-mono text-sm text-amber-400">{link}</p>
          <p className="mt-2 text-sm text-gx-mut">Debe estar a la vista de tus clientes: coloca el aviso con este código QR en tu local y el enlace en tu sitio web. La ley también pide tener un libro físico de respaldo para cuando el virtual no funcione. Cada hoja debe responderse por escrito en un máximo de 15 días hábiles.</p>
          {!enabled && <p className="mt-3 rounded-lg border border-gx-bad/40 bg-gx-bad/10 p-3 text-sm text-gx-bad">El formulario está desactivado: completa la razón social, el RUC y la dirección en Facturación.</p>}
          <div className="mt-3 flex gap-2"><button className="btn btn-s" onClick={copy}>Copiar enlace</button><a className="btn btn-s" href={link} target="_blank" rel="noreferrer">Abrir</a></div>
        </div>
        <div className="text-center"><QrImage text={link} size={130} alt="QR del Libro de Reclamaciones" /></div>
      </section>

      <div className="card overflow-x-auto">
        <h3 className="flex justify-between border-b border-gx-line px-5 py-4 font-semibold">Hojas recibidas <span className="text-sm text-gx-mut">{pending.length} pendientes</span></h3>
        <table className="w-full min-w-[640px]">
          <thead><tr><th className="th">N°</th><th className="th">Fecha</th><th className="th">Tipo</th><th className="th">Consumidor</th><th className="th">Estado</th><th className="th text-right"></th></tr></thead>
          <tbody>
            {data.map((c) => (
              <tr key={c.id}>
                <td className="td font-mono">{c.code}</td><td className="td font-mono">{fmtDate(c.created_at.slice(0, 10))}</td><td className="td">{c.kind === 'reclamo' ? 'Reclamo' : 'Queja'}</td><td className="td">{c.consumer_name}</td>
                <td className="td">{c.status === 'respondido' ? <span className="text-gx-ok">Respondido</span> : left(c) < 0 ? <span className="font-semibold text-gx-bad">Vencido hace {-left(c)} d</span> : <span className="text-gx-warn">Vence {fmtDate(c.due_date)}</span>}</td>
                <td className="td text-right"><button className="btn btn-s" onClick={() => setSel(c)}>{c.status === 'pendiente' ? 'Responder' : 'Ver'}</button></td>
              </tr>
            ))}
            {ready && !data.length && <tr><td colSpan={6} className="td py-8 text-center text-gx-mut">Aún no recibes hojas de reclamación.</td></tr>}
          </tbody>
        </table>
      </div>

      {sel && (
        <Modal title={`Hoja N° ${sel.code}`} onClose={() => setSel(null)}>
          <div className="mb-3">
            <Row k="Tipo" v={sel.kind === 'reclamo' ? 'Reclamo' : 'Queja'} /><Row k="Consumidor" v={`${sel.consumer_name} · ${sel.doc_type} ${sel.doc_number}`} />
            <Row k="Contacto" v={`${sel.phone} · ${sel.email}`} /><Row k="Domicilio" v={sel.address} />
            <Row k="Representante" v={sel.guardian_name && `${sel.guardian_name} · ${sel.guardian_doc}`} />
            <Row k="Servicio" v={sel.service_desc + (sel.amount ? ` · S/ ${sel.amount}` : '')} /><Row k="Detalle" v={sel.detail} /><Row k="Pedido" v={sel.request} />
            <Row k="Plazo" v={`Responder hasta el ${fmtDate(sel.due_date)}`} />
          </div>
          {sel.status === 'pendiente' ? (
            <form onSubmit={send}>
              <label className="lbl">Respuesta y acciones adoptadas</label>
              <textarea name="response" rows={5} required minLength={10} className="inp" placeholder="Explica la solución o fundamenta por qué no se acepta el pedido." />
              <p className="mt-2 text-xs text-gx-mut">La respuesta debe ser escrita y llegar al correo del consumidor. Conserva la constancia de envío.</p>
              <div className="mt-4 flex justify-end gap-2.5"><button type="button" className="btn" onClick={() => setSel(null)}>Cancelar</button><button className="btn btn-p">Enviar respuesta</button></div>
            </form>
          ) : (
            <>
              <Row k="Respuesta" v={sel.response} /><Row k="Respondido" v={fmtDate(sel.responded_at.slice(0, 10))} />
              <p className="mt-2 text-sm text-gx-mut">{sel.response_sent_at ? 'Se envió al correo del consumidor.' : 'No se envió automáticamente: envíala al correo del consumidor.'}</p>
              {!sel.response_sent_at && <a className="btn btn-s mt-2 inline-block" href={`mailto:${sel.email}?subject=${encodeURIComponent(`Respuesta a tu ${sel.kind} N° ${sel.code}`)}&body=${encodeURIComponent(sel.response)}`}>Abrir en mi correo</a>}
            </>
          )}
        </Modal>
      )}
    </div>
  )
}
