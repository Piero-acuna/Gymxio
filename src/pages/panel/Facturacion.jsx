import { updateGym } from '../../lib/api'
import { fmtDate, money } from '../../lib/format'
import { useRun } from '../../hooks/useAsync'
import Field from '../../components/ui/Field'

const csv = (rows) => rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n')

export default function Facturacion({ gym }) {
  const { info, payments, members, reload } = gym
  const run = useRun(reload)
  const name = (id) => members.find((m) => m.id === id)?.name ?? '—'
  const meses = {}
  payments.forEach((p) => { const k = p.paid_on.slice(0, 7); meses[k] = (meses[k] || 0) + Number(p.amount) })

  const save = (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    run(() => updateGym(info.id, { legal_name: v.legal_name.trim() || null, ruc: v.ruc.trim() || null, fiscal_address: v.fiscal_address.trim() || null }), 'Datos fiscales guardados')
  }
  const download = () => {
    const body = csv([['Fecha', 'Miembro', 'Plan', 'Método', 'Monto'], ...payments.map((p) => [p.paid_on, name(p.member_id), p.plan_name, p.method, p.amount])])
    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob(['\ufeff' + body], { type: 'text/csv;charset=utf-8' }))
    a.download = 'pagos-gymxio.csv'
    a.click()
    URL.revokeObjectURL(a.href)
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form className="card p-6" onSubmit={save}>
        <h3 className="mb-1 font-semibold">Datos fiscales</h3>
        <Field label="Razón social" name="legal_name" defaultValue={info.legal_name || ''} />
        <Field label="RUC" name="ruc" inputMode="numeric" pattern="\d{11}" title="11 dígitos" defaultValue={info.ruc || ''} />
        <Field label="Dirección fiscal" name="fiscal_address" defaultValue={info.fiscal_address || ''} />
        <button className="btn btn-p mt-5">Guardar</button>
        <p className="mt-4 text-sm text-gx-mut">La emisión de comprobantes electrónicos (SUNAT) todavía no está incluida.</p>
      </form>
      <section className="card h-fit overflow-hidden">
        <h3 className="flex items-center justify-between border-b border-gx-line px-5 py-4 font-semibold">Ingresos por mes <button className="btn btn-s" onClick={download}>Descargar pagos (CSV)</button></h3>
        {Object.keys(meses).sort().reverse().map((k) => <div key={k} className="flex justify-between border-t border-gx-line px-5 py-3 first:border-t-0"><span className="font-mono text-gx-mut">{fmtDate(k + '-01').slice(3)}</span><b className="font-mono">{money(meses[k])}</b></div>)}
        {!payments.length && <p className="p-7 text-center text-gx-mut">Aún no hay pagos.</p>}
        <p className="border-t border-gx-line px-5 py-3 text-xs text-gx-mut">Se muestran los últimos 90 días.</p>
      </section>
    </div>
  )
}
