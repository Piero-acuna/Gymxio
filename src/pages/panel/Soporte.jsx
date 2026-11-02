import { createTicket, listTickets } from '../../lib/api'
import { useLoad, useRun } from '../../hooks/useAsync'
import { fmtDate } from '../../lib/format'
import Field from '../../components/ui/Field'

const EMAIL = import.meta.env.VITE_SUPPORT_EMAIL
const WA = (import.meta.env.VITE_SUPPORT_WHATSAPP || '').replace(/\D/g, '')
const STATE = { abierto: 'Abierto', en_proceso: 'En proceso', resuelto: 'Resuelto' }
const FAQ = [
  ['¿Cómo renuevo una membresía?', 'En Miembros pulsa “Renovar”, elige el plan y el método de pago. Si ya venció, cuenta desde hoy; si no, se suma al vencimiento actual.'],
  ['¿Qué hago si el QR no funciona?', 'Registra el ingreso a mano en Asistencia buscando por nombre o DNI. Si el carnet es antiguo, genera uno nuevo.'],
  ['¿Cómo agrego personal?', 'Crea su cuenta en Supabase y agrégala en Panel > Configuración > Personal con su rol.'],
  ['¿Cómo cambio un precio?', 'En Planes, pulsa “Editar” en el plan. El cambio se aplica a los cobros nuevos, no a los ya registrados.'],
]

export default function Soporte({ gym }) {
  const tickets = useLoad(listTickets)
  const run = useRun(tickets.reload)
  const send = (e) => {
    e.preventDefault()
    const f = e.target, v = Object.fromEntries(new FormData(f))
    run(() => createTicket(gym.info.id, { subject: v.subject.trim(), message: v.message.trim() }), 'Solicitud enviada', () => f.reset())
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="space-y-5">
        <form className="card p-6" onSubmit={send}>
          <h3 className="mb-1 font-semibold">Escríbenos</h3>
          <Field label="Asunto" name="subject" required />
          <label className="lbl">Mensaje</label>
          <textarea name="message" required rows={4} className="inp" />
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button className="btn btn-p">Enviar solicitud</button>
            {EMAIL && <a className="btn" href={`mailto:${EMAIL}`}>{EMAIL}</a>}
            {WA && <a className="btn" href={`https://wa.me/${WA}`} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>
        </form>
        <section className="card p-6">
          <h3 className="mb-2 font-semibold">Mis solicitudes</h3>
          {tickets.data.map((t) => <div key={t.id} className="flex justify-between gap-3 border-t border-gx-line py-2.5 first:border-t-0"><span>{t.subject}</span><span className="whitespace-nowrap text-sm text-gx-mut">{STATE[t.status]} · {fmtDate(t.created_at.slice(0, 10))}</span></div>)}
          {tickets.ready && !tickets.data.length && <p className="text-gx-mut">Todavía no enviaste solicitudes.</p>}
        </section>
      </div>
      <section className="card h-fit p-6">
        <h3 className="mb-2 font-semibold">Preguntas frecuentes</h3>
        {FAQ.map(([q, a]) => <details key={q} className="border-t border-gx-line py-3 first:border-t-0"><summary className="cursor-pointer font-semibold">{q}</summary><p className="mt-2 text-gx-mut">{a}</p></details>)}
      </section>
    </div>
  )
}
