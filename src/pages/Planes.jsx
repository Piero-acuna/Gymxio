import { useState } from 'react'
import { createPlan, updatePlan } from '../lib/api'
import { money, status } from '../lib/format'
import { useRun } from '../hooks/useAsync'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'

export default function Planes({ gym, role }) {
  const { plans, members, info, reload } = gym
  const [edit, setEdit] = useState(null)
  const run = useRun(reload)
  const owner = role === 'owner'

  const save = (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    const body = { name: v.name.trim(), days: +v.days, price: +v.price }
    run(() => (edit.id ? updatePlan(edit.id, body) : createPlan(info.id, body)), 'Plan guardado', () => setEdit(null))
  }
  const archive = (p) => window.confirm(`¿Archivar el plan "${p.name}"? Los miembros actuales conservan su membresía.`) && run(() => updatePlan(p.id, { active: false }), 'Plan archivado')

  return (
    <>
      {owner && <div className="mb-4 flex justify-end"><button className="btn btn-p" onClick={() => setEdit({})}>＋ Plan</button></div>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
        {plans.map((p) => (
          <div key={p.id} className="card p-5">
            <h3 className="font-semibold">{p.name}</h3>
            <b className="mb-0.5 mt-2 block font-mono text-3xl text-gx-amb">{money(p.price)}</b>
            <span className="text-gx-mut">{p.days === 1 ? '1 día' : p.days + ' días'}</span>
            <p className="my-3.5 text-gx-mut">{members.filter((m) => m.plan_id === p.id && status(m).key !== 'bad').length} miembros vigentes</p>
            {owner && <div className="flex gap-2"><button className="btn btn-s" onClick={() => setEdit(p)}>Editar</button><button className="btn btn-s" onClick={() => archive(p)}>Archivar</button></div>}
          </div>
        ))}
        {!plans.length && <p className="text-gx-mut">Aún no hay planes. {owner && 'Crea el primero con “＋ Plan”.'}</p>}
      </div>
      {edit && (
        <Modal title={edit.id ? 'Editar plan' : 'Nuevo plan'} onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            <Field label="Nombre" name="name" required defaultValue={edit.name} placeholder="Ej. Quincenal" />
            <Field label="Duración (días)" name="days" type="number" min="1" max="3650" required defaultValue={edit.days} />
            <Field label="Precio (S/)" name="price" type="number" min="0" step="0.01" required defaultValue={edit.price} />
            <div className="mt-5 flex justify-end gap-2.5"><button type="button" className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn btn-p">Guardar</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
