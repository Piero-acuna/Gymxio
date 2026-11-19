import { useState } from 'react'
import { rotateDeviceKey, updateGym } from '../../lib/api'
import { useRun } from '../../hooks/useAsync'
import { useToast } from '../../context/ToastContext'
import Field from '../../components/ui/Field'
import QrImage from '../../components/QrImage'

const MODES = [
  ['none', 'Solo QR', 'Los miembros ingresan con el QR de su carnet.'],
  ['phone', 'Celular del miembro', 'Huella o rostro del propio teléfono. Se vincula una vez y luego ingresa desde /acceso.'],
  ['device', 'Equipos biométricos', 'Lectores de huella o rostro instalados en el gimnasio. Cada miembro tiene un ID para registrarlo en el equipo.'],
]

export default function Configuracion({ gym }) {
  const { info, reload } = gym
  const run = useRun(reload)
  const toast = useToast()
  const [mode, setMode] = useState(info.biometric_mode)
  const [key, setKey] = useState('')
  const base = window.location.origin

  const save = (e) => {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(e.target))
    run(() => updateGym(info.id, { name: v.name.trim(), phone: v.phone.trim() || null, address: v.address.trim() || null, warn_days: +v.warn_days }), 'Configuración guardada')
  }
  const saveMode = () => run(() => updateGym(info.id, { biometric_mode: mode }), 'Acceso biométrico guardado')
  const newKey = () => window.confirm('La clave anterior dejará de funcionar. ¿Continuar?') && run(async () => setKey(await rotateDeviceKey()), 'Clave generada')
  const copy = async (t) => { try { await navigator.clipboard.writeText(t); toast('Copiado') } catch { toast('No se pudo copiar', 'bad') } }
  const saved = info.biometric_mode

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form className="card h-fit p-6" onSubmit={save}>
        <h3 className="mb-1 font-semibold">Gimnasio</h3>
        <Field label="Nombre" name="name" required defaultValue={info.name} />
        <Field label="Teléfono" name="phone" defaultValue={info.phone || ''} />
        <Field label="Dirección del local" name="address" defaultValue={info.address || ''} />
        <Field label="Avisar vencimiento con (días)" name="warn_days" type="number" min="1" max="30" required defaultValue={info.warn_days} />
        <button className="btn btn-p mt-5">Guardar</button>
      </form>

      <section className="card p-6">
        <h3 className="mb-3 font-semibold">Acceso biométrico</h3>
        <div className="space-y-2">
          {MODES.map(([k, t, d]) => (
            <label key={k} className={`flex cursor-pointer gap-3 rounded-xl border p-3.5 ${mode === k ? 'border-gx-amb bg-gx-amb/10' : 'border-gx-line'}`}>
              <input type="radio" name="mode" className="mt-1 accent-amber-500" checked={mode === k} onChange={() => setMode(k)} />
              <span><b className="block">{t}</b><span className="text-sm text-gx-mut">{d}</span></span>
            </label>
          ))}
        </div>
        <button className="btn btn-p mt-4" disabled={mode === saved} onClick={saveMode}>Guardar modo</button>
        <p className="mt-2 text-xs text-gx-mut">El QR del carnet funciona siempre, también como respaldo.</p>

        {saved === 'phone' && (
          <div className="mt-5 border-t border-gx-line pt-4 text-center">
            <div className="flex justify-center"><QrImage text={`${base}/acceso`} size={150} alt="Enlace de acceso" /></div>
            <p className="mt-2 text-sm text-gx-mut">Imprime este QR en la entrada: los miembros ya vinculados ingresan desde su celular.</p>
            <button className="btn btn-s mt-2" onClick={() => copy(`${base}/acceso`)}>Copiar enlace</button>
            <p className="mt-3 text-xs text-gx-warn">Ese ingreso no comprueba que la persona esté físicamente en el gimnasio.</p>
          </div>
        )}
        {saved === 'device' && (
          <div className="mt-5 space-y-3 border-t border-gx-line pt-4 text-sm">
            <p className="text-gx-mut">El lector (o su software) debe llamar a esta dirección cada vez que reconozca una huella o rostro:</p>
            <pre className="overflow-x-auto rounded-xl bg-gx-bg p-3 text-xs text-slate-300">{`POST ${base}/api/device-checkin\nx-gym-key: ${key || 'TU_CLAVE'}\n{"device_user_id": 12}`}</pre>
            <div className="flex flex-wrap items-center gap-2">
              <button className="btn btn-s" onClick={newKey}>{info.device_key_hash ? 'Regenerar clave' : 'Generar clave'}</button>
              {key && <button className="btn btn-s" onClick={() => copy(key)}>Copiar clave</button>}
            </div>
            {key && <p className="break-all font-mono text-xs text-gx-amb">{key}</p>}
            <p className="text-xs text-gx-mut">{key ? 'Guárdala ahora: no se vuelve a mostrar.' : info.device_key_hash ? 'Ya hay una clave activa (no se puede volver a ver).' : 'Aún no hay clave.'} El ID de cada miembro aparece en su carnet.</p>
          </div>
        )}
      </section>
    </div>
  )
}
