import { useEffect, useState } from 'react'
import QRCode from 'qrcode'

export default function QrImage({ text, size = 200, alt = 'Código QR' }) {
  const [src, setSrc] = useState('')
  useEffect(() => {
    let on = true
    QRCode.toDataURL(text, { margin: 1, width: size * 2, errorCorrectionLevel: 'M' }).then((u) => on && setSrc(u))
    return () => { on = false }
  }, [text, size])
  return src ? <img src={src} alt={alt} width={size} height={size} className="rounded-xl bg-white p-2" /> : <div style={{ width: size, height: size }} />
}
