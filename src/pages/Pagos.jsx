import { fmtDate, money, todayLima } from '../lib/format'

export default function Pagos({ gym }) {
  const t = todayLima()
  const name = (id) => gym.members.find((m) => m.id === id)?.name ?? '—'
  const mes = gym.payments.filter((p) => p.paid_on.slice(0, 7) === t.slice(0, 7)).reduce((s, p) => s + Number(p.amount), 0)
  return (
    <div className="card overflow-x-auto">
      <h3 className="flex justify-between border-b border-gx-line px-5 py-4 font-semibold">Historial de pagos <span className="text-sm text-gx-mut">Este mes: <b className="font-mono text-gx-amb">{money(mes)}</b></span></h3>
      <table className="w-full min-w-[640px]">
        <thead><tr><th className="th">Fecha</th><th className="th">Miembro</th><th className="th">Plan</th><th className="th">Método</th><th className="th text-right">Monto</th></tr></thead>
        <tbody>{gym.payments.slice(0, 40).map((p) => <tr key={p.id}><td className="td font-mono">{fmtDate(p.paid_on)}</td><td className="td">{name(p.member_id)}</td><td className="td">{p.plan_name}</td><td className="td text-gx-mut">{p.method}</td><td className="td text-right font-mono">{money(p.amount)}</td></tr>)}</tbody>
      </table>
    </div>
  )
}
