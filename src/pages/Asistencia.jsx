import { useState } from 'react'
import { checkIn } from '../lib/api'
import { todayLima } from '../lib/format'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import Person from '../components/ui/Person'

const hora = (at) => new Date(at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' })

export default function Asistencia({ gym }) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const t = todayLima()
  const found = q ? gym.members.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.dni.includes(q)).slice(0, 6) : []
  const hoy = gym.attendance.filter((a) => a.day === t).reverse()
  const go = async (m) => { try { await checkIn(m.id); toast('Ingreso registrado: ' + m.name); await gym.reload() } catch (e) { toast(e.message, 'bad') } }
  const name = (id) => gym.members.find((m) => m.id === id)?.name ?? '—'
  return (
    <>
      <input className="inp mb-2" placeholder="Busca por nombre o DNI para registrar el ingreso…" aria-label="Buscar miembro" value={q} onChange={(e) => setQ(e.target.value)} />
      <p className="mb-4 text-sm text-gx-mut">Escáner QR y huella o rostro: pendientes de portar (la versión completa está en <code>frontend-legacy/</code>).</p>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card overflow-hidden"><h3 className="border-b border-gx-line px-5 py-4 font-semibold">Registrar ingreso</h3>
          {found.length ? found.map((m) => <div key={m.id} className="flex items-center justify-between gap-3 border-t border-gx-line px-5 py-3 first:border-t-0"><Person m={m} /><Badge member={m} /><button className="btn btn-p btn-s" onClick={() => go(m)}>Ingresar</button></div>) : <p className="p-7 text-center text-gx-mut">Escribe un nombre o DNI.</p>}
        </section>
        <section className="card overflow-hidden"><h3 className="flex justify-between border-b border-gx-line px-5 py-4 font-semibold">Hoy <span className="font-mono text-gx-mut">{hoy.length}</span></h3>
          {hoy.length ? hoy.map((a, i) => <div key={i} className="flex justify-between border-t border-gx-line px-5 py-3 first:border-t-0"><span>{name(a.member_id)}</span><span className="font-mono text-gx-mut">{hora(a.at)}</span></div>) : <p className="p-7 text-center text-gx-mut">Aún no hay ingresos hoy.</p>}
        </section>
      </div>
    </>
  )
}
