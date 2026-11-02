import { useAuth } from '../../context/AuthContext'
import { updateProfile } from '../../lib/api'
import { useRun } from '../../hooks/useAsync'
import Field from '../../components/ui/Field'

const ROLE = { owner: 'Dueño', reception: 'Recepción', trainer: 'Entrenador' }

export default function MisDatos() {
  const { profile, session, reloadProfile, updatePassword } = useAuth()
  const run = useRun()
  const saveData = (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    run(() => updateProfile(session.user.id, { full_name: v.full_name.trim() || null, phone: v.phone.trim() || null }), 'Datos guardados', reloadProfile)
  }
  const savePw = (e) => {
    e.preventDefault()
    const f = e.target
    run(() => updatePassword(new FormData(f).get('pw')), 'Contraseña actualizada', () => f.reset())
  }
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form className="card p-6" onSubmit={saveData}>
        <h3 className="mb-1 font-semibold">Mis datos</h3>
        <Field label="Correo" value={session.user.email} readOnly />
        <Field label="Rol" value={ROLE[profile.role]} readOnly />
        <Field label="Nombre completo" name="full_name" defaultValue={profile.full_name || ''} />
        <Field label="Teléfono" name="phone" defaultValue={profile.phone || ''} />
        <button className="btn btn-p mt-5">Guardar</button>
      </form>
      <form className="card h-fit p-6" onSubmit={savePw}>
        <h3 className="mb-1 font-semibold">Cambiar contraseña</h3>
        <Field label="Contraseña nueva" name="pw" type="password" minLength={6} required autoComplete="new-password" />
        <button className="btn mt-5">Actualizar contraseña</button>
      </form>
    </div>
  )
}
