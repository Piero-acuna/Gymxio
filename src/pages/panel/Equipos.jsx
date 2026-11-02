import { useState } from 'react'
import { deleteEquipment, listEquipment, saveEquipment } from '../../lib/api'
import { useLoad, useRun } from '../../hooks/useAsync'
import Modal from '../../components/ui/Modal'
import Field from '../../components/ui/Field'

const CATS = ['Cardio', 'Fuerza', 'Peso libre', 'Funcional', 'Otros']
const ST = {
  operativo: ['Operativo', 'border-gx-ok/40 bg-gx-ok/10 text-gx-ok'],
  mantenimiento: ['Mantenimiento', 'border-gx-warn/40 bg-gx-warn/10 text-gx-warn'],
  fuera_servicio: ['Fuera de servicio', 'border-gx-bad/40 bg-gx-bad/10 text-gx-bad'],
}

export default function Equipos({ gym, role }) {
  const { data, ready, reload } = useLoad(listEquipment)
  const run = useRun(reload)
  const [edit, setEdit] = useState(null)
  const canEdit = role !== 'trainer'
  const count = (s) => data.filter((e) => e.status === s).reduce((a, e) => a + e.quantity, 0)

  const save = (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    run(() => saveEquipment(gym.info.id, edit.id, { name: v.name.trim(), category: v.category, quantity: +v.quantity, status: v.status, notes: v.notes.trim() || null }), 'Equipo guardado', () => setEdit(null))
  }
  const remove = (x) => window.confirm(`¿Eliminar "${x.name}"?`) && run(() => deleteEquipment(x.id), 'Equipo eliminado')

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {Object.entries(ST).map(([k, [label, cls]]) => <span key={k} className={`rounded-md border px-3 py-1 text-xs font-semibold ${cls}`}>{label}: {count(k)}</span>)}
        <span className="flex-1" />
        {canEdit && <button className="btn btn-p" onClick={() => setEdit({})}>＋ Equipo</button>}
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead><tr><th className="th">Equipo</th><th className="th">Categoría</th><th className="th text-right">Unidades</th><th className="th">Estado</th><th className="th">Notas</th>{canEdit && <th className="th text-right">Acciones</th>}</tr></thead>
          <tbody>
            {data.map((x) => (
              <tr key={x.id}>
                <td className="td font-semibold">{x.name}</td><td className="td">{x.category}</td><td className="td text-right font-mono">{x.quantity}</td>
                <td className="td"><span className={`rounded-md border px-2.5 py-0.5 text-xs font-semibold ${ST[x.status][1]}`}>{ST[x.status][0]}</span></td>
                <td className="td text-gx-mut">{x.notes}</td>
                {canEdit && <td className="td space-x-1.5 text-right"><button className="btn btn-s" onClick={() => setEdit(x)}>Editar</button><button className="btn btn-s" onClick={() => remove(x)}>Eliminar</button></td>}
              </tr>
            ))}
            {ready && !data.length && <tr><td colSpan={6} className="td py-8 text-center text-gx-mut">Aún no registras equipos.</td></tr>}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit.id ? 'Editar equipo' : 'Nuevo equipo'} onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            <Field label="Nombre" name="name" required defaultValue={edit.name} placeholder="Ej. Caminadora" />
            <label className="lbl">Categoría</label>
            <select name="category" className="inp" defaultValue={edit.category || 'Cardio'}>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
            <Field label="Unidades" name="quantity" type="number" min="0" required defaultValue={edit.quantity ?? 1} />
            <label className="lbl">Estado</label>
            <select name="status" className="inp" defaultValue={edit.status || 'operativo'}>{Object.entries(ST).map(([k, [l]]) => <option key={k} value={k}>{l}</option>)}</select>
            <Field label="Notas" name="notes" defaultValue={edit.notes || ''} placeholder="Opcional" />
            <div className="mt-5 flex justify-end gap-2.5"><button type="button" className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn btn-p">Guardar</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
