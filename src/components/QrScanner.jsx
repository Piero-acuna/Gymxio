import { useEffect, useRef, useState } from 'react'
import jsQR from 'jsqr'
import Modal from './ui/Modal'

/** Lee el QR del carnet con la cámara (BarcodeDetector si existe, jsQR si no). */
export default function QrScanner({ onCode, onClose }) {
  const video = useRef(null)
  const cb = useRef(onCode)
  const [err, setErr] = useState('')
  useEffect(() => { cb.current = onCode })
  useEffect(() => {
    let stream, stop = false
    ;(async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        const v = video.current
        v.srcObject = stream
        await v.play()
        const cv = document.createElement('canvas'), cx = cv.getContext('2d', { willReadFrequently: true })
        const det = 'BarcodeDetector' in window ? new window.BarcodeDetector({ formats: ['qr_code'] }) : null
        const tick = async () => {
          if (stop) return
          let val = null
          try {
            if (v.videoWidth) {
              cv.width = v.videoWidth; cv.height = v.videoHeight; cx.drawImage(v, 0, 0)
              if (det) val = (await det.detect(cv))[0]?.rawValue
              else { const i = cx.getImageData(0, 0, cv.width, cv.height); val = jsQR(i.data, i.width, i.height)?.data }
            }
          } catch { /* se reintenta en el siguiente cuadro */ }
          if (val?.startsWith('GYMXIO:')) { stop = true; cb.current(val); return }
          setTimeout(tick, 250)
        }
        tick()
      } catch { setErr('No se pudo abrir la cámara. Revisa el permiso del navegador (hace falta HTTPS o localhost).') }
    })()
    return () => { stop = true; stream?.getTracks().forEach((t) => t.stop()) }
  }, [])
  return (
    <Modal title="Escanear carnet" onClose={onClose}>
      {err ? <p className="text-gx-bad">{err}</p> : <video ref={video} playsInline muted className="aspect-[4/3] w-full rounded-xl bg-black object-cover" />}
      <p className="mt-2 text-center text-sm text-gx-mut">Apunta al QR del miembro.</p>
      <div className="mt-3 flex justify-end"><button className="btn" onClick={onClose}>Cancelar</button></div>
    </Modal>
  )
}
