import { useMemo, useState } from 'react'
import { checkIn, registerMember, renewMember, updateMember } from '../lib/api'
import { fmtDate, status } from '../lib/format'
import { useToast } from '../context/ToastContext'
import Badge from '../components/ui/Badge'
import Modal from '../components/ui/Modal'
import Person from '../components/ui/Person'

const FILTERS = ['Todos', 'Activo', 'Por vencer', 'Vencido']
const METHODS = ['Efectivo', 'Yape', 'Tarjeta']
const Plans = ({ plans, def }) => <select name="plan" className="inp" defaultValue={def}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
const Method = () => <><label className="lbl">Método de pago</label><select name="method" className="inp">{METHODS.map((x) => <option key={x}>{x}</option>)}</select></>

export default function Miembros({ gym }) {
  const toast = useToast()
  const { members, plans, reload } = gym
  const [q, setQ] = useState('')
  const [f, setF] = useState('Todos')
  const [modal, setModal] = useState(null)
  const rows = useMemo(() => members.filter((m) => (f === 'Todos' || status(m).label === f) && (m.name.toLowerCase().includes(q.toLowerCase()) || m.dni.includes(q))), [members, q, f])

  const run = async (fn, msg) => {
    try { const r = await fn(); toast(typeof msg === 'function' ? msg(r) : msg); setModal(null); await reload() } catch (e) { toast(e.message, 'bad') }
  }
  const submit = (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target)), m = modal.m
    if (modal.type === 'new') run(() => registerMember(v), 'Miembro registrado')
    if (modal.type === 'ed') run(() => updateMember(m.id, v), 'Cambios guardados')
    if (modal.type === 'ren') run(() => renewMember(m.id, v.plan, v.method), (d) => 'Renovado hasta ' + fmtDate(d))
  }
  const m = modal?.m
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-2.5">
        <input className="inp min-w-[220px] flex-1" placeholder="Nombre o DNI…" aria-label="Buscar" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="card flex gap-1 rounded-xl p-1">
          {FILTERS.map((x) => <button key={x} onClick={() => setF(x)} className={`rounded-lg px-3 py-1.5 text-[13px] ${f === x ? 'bg-gx-amb font-semibold text-[#1a1206]' : 'text-gx-mut'}`}>{x}</button>)}
        </div>
        <button className="btn btn-p" onClick={() => setModal({ type: 'new' })}>＋ Miembro</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse">
          <thead><tr><th className="th">Miembro</th><th className="th">Plan</th><th className="th">Vence</th><th className="th">Estado</th><th className="th text-right">Acciones</th></tr></thead>
          <tbody>
            {rows.length ? rows.map((x) => (
              <tr key={x.id}>
                <td className="td"><Person m={x} /></td><td className="td">{x.plan_name}</td><td className="td font-mono">{fmtDate(x.end_date)}</td><td className="td"><Badge member={x} /></td>
                <td className="td space-x-1.5 text-right">
                  <button className="btn btn-s" onClick={() => run(() => checkIn(x.id), 'Ingreso registrado: ' + x.name)}>Ingreso</button>
                  <button className="btn btn-p btn-s" onClick={() => setModal({ type: 'ren', m: x })}>Renovar</button>
                  <button className="btn btn-s" onClick={() => setModal({ type: 'ed', m: x })}>Editar</button>
                </td>
              </tr>
            )) : <tr><td colSpan={5} className="td py-8 text-center text-gx-mut">Sin resultados. Prueba con otro nombre o registra un miembro nuevo.</td></tr>}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={{ new: 'Nuevo miembro', ed: 'Editar miembro', ren: 'Renovar a ' + (m?.name || '') }[modal.type]} onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            {modal.type !== 'ren' && <>
              <label className="lbl">Nombre completo</label><input name="name" required className="inp" defaultValue={m?.name} />
              <label className="lbl">DNI</label><input name="dni" required pattern="\d{8}" title="8 dígitos" inputMode="numeric" className="inp" defaultValue={m?.dni} />
              <label className="lbl">Teléfono</label><input name="phone" className="inp" defaultValue={m?.phone || ''} />
            </>}
            {modal.type === 'ren' && <p className="text-sm text-gx-mut">Vence el <b className="font-mono">{fmtDate(m.end_date)}</b>. Si ya venció, cuenta desde hoy.</p>}
            {modal.type !== 'ed' && <><label className="lbl">Plan</label><Plans plans={plans} def={m?.plan_id} /><Method /></>}
            <div className="mt-5 flex justify-end gap-2.5"><button type="button" className="btn" onClick={() => setModal(null)}>Cancelar</button><button className="btn btn-p">{modal.type === 'ed' ? 'Guardar cambios' : 'Cobrar y guardar'}</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
