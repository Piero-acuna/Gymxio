import { useState } from 'react'
import { createClass, deleteClass, updateClass } from '../lib/api'
import { useRun } from '../hooks/useAsync'
import { useToast } from '../context/ToastContext'
import Modal from '../components/ui/Modal'
import Field from '../components/ui/Field'

const DAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

export default function Clases({ gym, role }) {
  const { classes, info, reload } = gym
  const [edit, setEdit] = useState(null)
  const run = useRun(reload)
  const toast = useToast()
  const owner = role === 'owner'
  const sel = edit?.days ? edit.days.split(' / ') : []

  const save = (e) => {
    e.preventDefault()
    const fd = new FormData(e.target), days = fd.getAll('d')
    if (!days.length) return toast('Elige al menos un día', 'bad')
    const body = { name: fd.get('name').trim(), days: DAYS.filter((d) => days.includes(d)).join(' / '), at_time: fd.get('time'), coach: fd.get('coach').trim(), capacity: +fd.get('capacity') }
    run(() => (edit.id ? updateClass(edit.id, body) : createClass(info.id, { ...body, sort: Math.max(0, ...classes.map((c) => c.sort || 0)) + 1 })), 'Clase guardada', () => setEdit(null))
  }
  const remove = (c) => window.confirm(`¿Eliminar la clase "${c.name}"?`) && run(() => deleteClass(c.id), 'Clase eliminada')

  return (
    <>
      {owner && <div className="mb-4 flex justify-end"><button className="btn btn-p" onClick={() => setEdit({})}>＋ Clase</button></div>}
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead><tr><th className="th">Clase</th><th className="th">Días</th><th className="th">Hora</th><th className="th">Entrenador</th><th className="th text-right">Cupos</th>{owner && <th className="th text-right">Acciones</th>}</tr></thead>
          <tbody>
            {classes.map((c) => (
              <tr key={c.id}>
                <td className="td font-semibold">{c.name}</td><td className="td">{c.days}</td><td className="td font-mono">{c.at_time.slice(0, 5)}</td><td className="td">{c.coach}</td><td className="td text-right font-mono">{c.capacity}</td>
                {owner && <td className="td space-x-1.5 text-right"><button className="btn btn-s" onClick={() => setEdit(c)}>Editar</button><button className="btn btn-s" onClick={() => remove(c)}>Eliminar</button></td>}
              </tr>
            ))}
            {!classes.length && <tr><td colSpan={6} className="td py-8 text-center text-gx-mut">Aún no hay clases.</td></tr>}
          </tbody>
        </table>
      </div>
      {edit && (
        <Modal title={edit.id ? 'Editar clase' : 'Nueva clase'} onClose={() => setEdit(null)}>
          <form onSubmit={save}>
            <Field label="Nombre" name="name" required defaultValue={edit.name} placeholder="Ej. Pilates" />
            <label className="lbl">Días</label>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d) => (
                <label key={d} className="cursor-pointer">
                  <input type="checkbox" name="d" value={d} defaultChecked={sel.includes(d)} className="peer sr-only" />
                  <span className="block rounded-lg border border-gx-line px-3 py-1.5 text-sm peer-checked:border-gx-amb peer-checked:bg-gx-amb peer-checked:font-semibold peer-checked:text-[#1a1206] peer-focus-visible:ring-2 peer-focus-visible:ring-gx-amb">{d}</span>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Field label="Hora" name="time" type="time" required defaultValue={edit.at_time?.slice(0, 5)} /></div>
              <div><Field label="Cupos" name="capacity" type="number" min="1" required defaultValue={edit.capacity ?? 20} /></div>
            </div>
            <Field label="Entrenador" name="coach" defaultValue={edit.coach} />
            <div className="mt-5 flex justify-end gap-2.5"><button type="button" className="btn" onClick={() => setEdit(null)}>Cancelar</button><button className="btn btn-p">Guardar</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
