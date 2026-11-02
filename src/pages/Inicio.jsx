import { fmtDate, money, status, todayLima } from '../lib/format'
import Badge from '../components/ui/Badge'
import Person from '../components/ui/Person'

const Kpi = ({ icon, n, label }) => (
  <div className="card flex items-center gap-4 p-5">
    <div className="grid h-11 w-11 place-items-center rounded-xl bg-gx-card2 text-lg">{icon}</div>
    <div><b className="block font-mono text-2xl leading-none">{n}</b><span className="text-sm text-gx-mut">{label}</span></div>
  </div>
)

export default function Inicio({ gym, go, role }) {
  const { members, payments, attendance } = gym
  const t = todayLima()
  const by = (k) => members.filter((m) => status(m).key === k)
  const mes = payments.filter((p) => p.paid_on.slice(0, 7) === t.slice(0, 7)).reduce((s, p) => s + Number(p.amount), 0)
  const pend = [...by('bad'), ...by('warn')].sort((a, b) => ((a.end_date || '') < (b.end_date || '') ? -1 : 1)).slice(0, 6)
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi icon="🏋️" n={members.length} label="Total miembros" />
        <Kpi icon="✅" n={by('ok').length} label="Activos" />
        <Kpi icon="⏳" n={by('warn').length} label="Por vencer" />
        <Kpi icon="✖" n={by('bad').length} label="Vencidos" />
      </div>
      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <section className="card overflow-hidden">
          <h3 className="border-b border-gx-line px-5 py-4 font-semibold">Renovaciones pendientes</h3>
          {pend.length ? pend.map((m) => (
            <div key={m.id} className="flex items-center justify-between gap-3 border-t border-gx-line px-5 py-3 first:border-t-0">
              <Person m={m} />
              <div className="text-right"><Badge member={m} /><div className="mt-1 font-mono text-xs text-gx-mut">{fmtDate(m.end_date)}</div></div>
              {role !== 'trainer' && <button className="btn btn-p btn-s" onClick={() => go('miembros')}>Renovar</button>}
            </div>
          )) : <p className="p-7 text-center text-gx-mut">Nadie tiene la membresía por vencer.</p>}
        </section>
        <section className="card h-fit">
          <h3 className="flex justify-between border-b border-gx-line px-5 py-4 font-semibold">Ingresos del mes <span className="font-mono text-gx-amb">{money(mes)}</span></h3>
          <div className="flex justify-between px-5 py-3"><span className="text-gx-mut">Asistencias hoy</span><b className="font-mono">{attendance.filter((a) => a.day === t).length}</b></div>
        </section>
      </div>
    </div>
  )
}
