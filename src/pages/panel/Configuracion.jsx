import { addStaff, listStaff, updateGym } from '../../lib/api'
import { useLoad, useRun } from '../../hooks/useAsync'
import Field from '../../components/ui/Field'

const ROLE = { owner: 'Dueño', reception: 'Recepción', trainer: 'Entrenador' }

export default function Configuracion({ gym }) {
  const { info, reload } = gym
  const run = useRun(reload)
  const staff = useLoad(listStaff)
  const runStaff = useRun(staff.reload)

  const save = (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    run(() => updateGym(info.id, { name: v.name.trim(), phone: v.phone.trim() || null, address: v.address.trim() || null, warn_days: +v.warn_days }), 'Configuración guardada')
  }
  const add = (e) => {
    e.preventDefault()
    const f = e.target, v = Object.fromEntries(new FormData(f))
    runStaff(() => addStaff(v.email.trim(), v.role, v.name), 'Personal agregado', () => f.reset())
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form className="card p-6" onSubmit={save}>
        <h3 className="mb-1 font-semibold">Gimnasio</h3>
        <Field label="Nombre" name="name" required defaultValue={info.name} />
        <Field label="Teléfono" name="phone" defaultValue={info.phone || ''} />
        <Field label="Dirección del local" name="address" defaultValue={info.address || ''} />
        <Field label="Avisar vencimiento con (días)" name="warn_days" type="number" min="1" max="30" required defaultValue={info.warn_days} />
        <button className="btn btn-p mt-5">Guardar</button>
      </form>
      <section className="card h-fit p-6">
        <h3 className="mb-3 font-semibold">Personal</h3>
        {staff.data.map((s) => <div key={s.user_id} className="flex justify-between border-t border-gx-line py-2.5 first:border-t-0"><span>{s.full_name || 'Sin nombre'}</span><span className="text-gx-mut">{ROLE[s.role]}</span></div>)}
        <form onSubmit={add} className="mt-4 border-t border-gx-line pt-2">
          <Field label="Correo de la cuenta" name="email" type="email" required placeholder="persona@correo.com" />
          <Field label="Nombre (opcional)" name="name" />
          <label className="lbl">Rol</label>
          <select name="role" className="inp"><option value="reception">Recepción</option><option value="trainer">Entrenador</option></select>
          <button className="btn mt-4">Agregar al personal</button>
          <p className="mt-3 text-xs text-gx-mut">La persona debe tener ya una cuenta: créala en Supabase (Authentication &gt; Users).</p>
        </form>
      </section>
    </div>
  )
}
