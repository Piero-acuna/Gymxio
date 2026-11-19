import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

/** Cámara para tomar la foto (rostro: facing="user", DNI: facing="environment"). */
export default function CameraCapture({ facing = 'user', onCapture, onClose }) {
  const video = useRef(null)
  const [err, setErr] = useState('')
  useEffect(() => {
    let stream
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } })
        video.current.srcObject = stream
        await video.current.play()
      } catch { setErr('No se pudo abrir la cámara. Revisa el permiso del navegador (hace falta HTTPS o localhost).') }
    })()
    return () => stream?.getTracks().forEach((t) => t.stop())
  }, [facing])
  const snap = () => {
    const v = video.current, cv = document.createElement('canvas')
    cv.width = v.videoWidth; cv.height = v.videoHeight
    cv.getContext('2d').drawImage(v, 0, 0)
    cv.toBlob((b) => b && onCapture(b), 'image/jpeg', 0.9)
  }
  return createPortal(
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4">
      <div className="card w-full max-w-md p-4">
        {err ? <p className="text-gx-bad">{err}</p> : <video ref={video} playsInline muted className="aspect-[4/3] w-full rounded-xl bg-black object-cover" style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }} />}
        <div className="mt-3 flex justify-end gap-2.5"><button type="button" className="btn" onClick={onClose}>Cancelar</button>{!err && <button type="button" className="btn btn-p" onClick={snap}>Capturar</button>}</div>
      </div>
    </div>,
    document.body,
  )
}
