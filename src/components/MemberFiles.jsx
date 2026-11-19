import { useEffect, useState } from 'react'
import { signedUrl } from '../lib/api'
import PhotoSlot from './PhotoSlot'

/** Rostro y DNI del miembro dentro del formulario. files: { photo, dni_front, dni_back } */
export default function MemberFiles({ member, files, onChange }) {
  const [urls, setUrls] = useState({})
  useEffect(() => {
    let on = true
    ;(async () => {
      const u = {}
      for (const k of ['dni_front', 'dni_back']) {
        const p = member?.[k + '_path']
        if (p) { try { u[k] = await signedUrl(p) } catch { /* sin permiso o archivo ausente */ } }
      }
      if (on) setUrls(u)
    })()
    return () => { on = false }
  }, [member])
  const has = Object.values(files).some((f) => f instanceof Blob)
  const set = (k) => (v) => onChange({ ...files, [k]: v })
  return (
    <div className="mt-4 border-t border-gx-line pt-3">
      <div className="grid grid-cols-3 gap-2">
        <PhotoSlot label="Rostro" facing="user" max={720} value={files.photo} url={member?.photo_url} onChange={set('photo')} />
        <PhotoSlot label="DNI (frente)" facing="environment" max={1400} value={files.dni_front} url={urls.dni_front} onChange={set('dni_front')} />
        <PhotoSlot label="DNI (reverso)" facing="environment" max={1400} value={files.dni_back} url={urls.dni_back} onChange={set('dni_back')} />
      </div>
      <label className="mt-3 flex gap-2 text-xs text-gx-mut">
        <input type="checkbox" required={has} className="mt-0.5 accent-amber-500" />
        El miembro autoriza guardar su foto y/o DNI para identificarlo en el gimnasio.
      </label>
    </div>
  )
}
