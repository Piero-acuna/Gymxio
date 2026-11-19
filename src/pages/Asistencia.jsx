import { useState } from 'react'
import { checkIn } from '../lib/api'
import { todayLima } from '../lib/format'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import Person from '../components/ui/Person'
import QrScanner from '../components/QrScanner'

const hora = (at) => new Date(at).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'America/Lima' })
const HINT = {
  phone: 'Los miembros también pueden ingresar con la huella o el rostro de su celular desde /acceso.',
  device: 'Los equipos biométricos del gimnasio registran el ingreso automáticamente.',
  none: 'Este gimnasio usa solo QR y búsqueda manual.',
}

export default function Asistencia({ gym }) {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [scan, setScan] = useState(false)
  const t = todayLima()
  const found = q ? gym.members.filter((m) => m.name.toLowerCase().includes(q.toLowerCase()) || m.dni.includes(q)).slice(0, 6) : []
  const hoy = gym.attendance.filter((a) => a.day === t).reverse()
  const name = (id) => gym.members.find((m) => m.id === id)?.name ?? '—'
  const go = async (id, via = 'manual', extra = null) => {
    try { const n = await checkIn(id, via, extra); toast('Ingreso registrado: ' + n); await gym.reload() } catch (e) { toast(e.message, 'bad') }
  }
  return (
    <>
      <div className="mb-2 flex flex-wrap gap-2.5">
        <button className="btn btn-p" onClick={() => setScan(true)}>Escanear QR</button>
        <input className="inp min-w-[220px] flex-1" placeholder="O busca por nombre o DNI…" aria-label="Buscar miembro" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <p className="mb-4 text-sm text-gx-mut">{HINT[gym.info?.biometric_mode] || HINT.none}</p>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card overflow-hidden"><h3 className="border-b border-gx-line px-5 py-4 font-semibold">Registrar ingreso</h3>
          {found.length ? found.map((m) => <div key={m.id} className="flex items-center justify-between gap-3 border-t border-gx-line px-5 py-3 first:border-t-0"><Person m={m} /><Badge member={m} /><button className="btn btn-p btn-s" onClick={() => go(m.id)}>Ingresar</button></div>) : <p className="p-7 text-center text-gx-mut">Escribe un nombre o DNI.</p>}
        </section>
        <section className="card overflow-hidden"><h3 className="flex justify-between border-b border-gx-line px-5 py-4 font-semibold">Hoy <span className="font-mono text-gx-mut">{hoy.length}</span></h3>
          {hoy.length ? hoy.map((a, i) => <div key={i} className="flex justify-between border-t border-gx-line px-5 py-3 first:border-t-0"><span>{name(a.member_id)}</span><span className="font-mono text-gx-mut">{hora(a.at)}</span></div>) : <p className="p-7 text-center text-gx-mut">Aún no hay ingresos hoy.</p>}
        </section>
      </div>
      {scan && <QrScanner onClose={() => setScan(false)} onCode={(code) => { setScan(false); go(null, 'qr', code) }} />}
    </>
  )
}
