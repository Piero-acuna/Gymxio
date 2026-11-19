import { useState } from 'react'
import { listStaff, staffApi } from '../../lib/api'
import { useLoad, useRun } from '../../hooks/useAsync'
import Modal from '../../components/ui/Modal'
import Field from '../../components/ui/Field'

const ROLE = { owner: 'Dueño', reception: 'Recepción', trainer: 'Entrenador' }
const TITLE = { new: 'Nueva cuenta de empleado', ed: 'Editar empleado', pw: 'Nueva contraseña' }
const OK = { new: 'Cuenta creada', ed: 'Cambios guardados', pw: 'Contraseña actualizada' }

/** Equipo de trabajo: el dueño crea las cuentas de sus empleados. */
export default function Equipos() {
  const { data, ready, reload } = useLoad(listStaff)
  const run = useRun(reload)
  const [m, setM] = useState(null)

  const submit = (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    const body = { new: { action: 'create', ...v }, ed: { action: 'update', user_id: m.u?.user_id, ...v }, pw: { action: 'reset-password', user_id: m.u?.user_id, password: v.password } }[m.type]
    run(() => staffApi(body), OK[m.type], () => setM(null))
  }
  const remove = (u) => window.confirm(`¿Eliminar la cuenta de ${u.full_name || u.email}? Ya no podrá entrar.`) && run(() => staffApi({ action: 'remove', user_id: u.user_id }), 'Cuenta eliminada')
  const u = m?.u

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-gx-mut">Cada empleado entra con su correo y contraseña en la pantalla de acceso.</p>
        <button className="btn btn-p whitespace-nowrap" onClick={() => setM({ type: 'new' })}>＋ Empleado</button>
      </div>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px]">
          <thead><tr><th className="th">Nombre</th><th className="th">Correo</th><th className="th">Teléfono</th><th className="th">Rol</th><th className="th text-right">Acciones</th></tr></thead>
          <tbody>
            {data.map((x) => (
              <tr key={x.user_id}>
                <td className="td font-semibold">{x.full_name || 'Sin nombre'}</td><td className="td">{x.email}</td><td className="td font-mono">{x.phone}</td><td className="td">{ROLE[x.role]}</td>
                <td className="td space-x-1.5 text-right">
                  {x.role !== 'owner' && <><button className="btn btn-s" onClick={() => setM({ type: 'ed', u: x })}>Editar</button><button className="btn btn-s" onClick={() => setM({ type: 'pw', u: x })}>Contraseña</button><button className="btn btn-s" onClick={() => remove(x)}>Eliminar</button></>}
                </td>
              </tr>
            ))}
            {ready && !data.length && <tr><td colSpan={5} className="td py-8 text-center text-gx-mut">Sin personal.</td></tr>}
          </tbody>
        </table>
      </div>
      {m && (
        <Modal title={TITLE[m.type]} onClose={() => setM(null)}>
          <form onSubmit={submit}>
            {m.type !== 'pw' && <Field label="Nombre completo" name="full_name" defaultValue={u?.full_name || ''} required />}
            {m.type === 'new' && <Field label="Correo" name="email" type="email" required autoComplete="off" />}
            {m.type !== 'ed' && <Field label={m.type === 'new' ? 'Contraseña inicial' : 'Contraseña nueva'} name="password" type="text" minLength={6} required autoComplete="off" />}
            {m.type !== 'pw' && <Field label="Teléfono" name="phone" defaultValue={u?.phone || ''} />}
            {m.type !== 'pw' && <><label className="lbl">Rol</label><select name="role" className="inp" defaultValue={u?.role || 'reception'}><option value="reception">Recepción</option><option value="trainer">Entrenador</option></select></>}
            <div className="mt-5 flex justify-end gap-2.5"><button type="button" className="btn" onClick={() => setM(null)}>Cancelar</button><button className="btn btn-p">Guardar</button></div>
          </form>
        </Modal>
      )}
    </>
  )
}
