import { useEffect, useMemo, useRef, useState } from 'react'
import { toJpeg } from '../lib/image'
import { useToast } from '../context/ToastContext'
import CameraCapture from './CameraCapture'

/** value: Blob (nueva), null (quitar) o undefined (sin cambios, se muestra url). */
export default function PhotoSlot({ label, facing, max, value, url, onChange }) {
  const toast = useToast()
  const file = useRef(null)
  const [cam, setCam] = useState(false)
  const blobUrl = useMemo(() => (value instanceof Blob ? URL.createObjectURL(value) : null), [value])
  useEffect(() => () => blobUrl && URL.revokeObjectURL(blobUrl), [blobUrl])
  const src = value === null ? null : blobUrl || url || null
  const take = async (f) => { try { onChange(await toJpeg(f, max)) } catch (e) { toast(e.message, 'bad') } }
  return (
    <div className="text-center">
      <div className="mb-1 text-xs font-semibold text-gx-mut">{label}</div>
      <div className="mx-auto grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-lg border border-dashed border-gx-line bg-gx-bg text-xs text-gx-mut">
        {src ? <a href={src} target="_blank" rel="noreferrer"><img src={src} alt={label} className="h-full w-full object-cover" /></a> : 'Sin foto'}
      </div>
      <div className="mt-1.5 flex flex-wrap justify-center gap-1">
        <button type="button" className="btn btn-s" onClick={() => setCam(true)}>Cámara</button>
        <button type="button" className="btn btn-s" onClick={() => file.current.click()}>Subir</button>
        {src && <button type="button" className="btn btn-s" onClick={() => onChange(null)}>Quitar</button>}
      </div>
      <input ref={file} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files[0]; e.target.value = ''; if (f) take(f) }} />
      {cam && <CameraCapture facing={facing} onClose={() => setCam(false)} onCapture={(b) => { setCam(false); take(b) }} />}
    </div>
  )
}
