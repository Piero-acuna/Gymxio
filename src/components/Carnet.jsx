import { useEffect, useState } from 'react'
import { memberSecrets } from '../lib/api'
import { fmtDate } from '../lib/format'
import { useToast } from '../context/ToastContext'
import Modal from './ui/Modal'
import QrImage from './QrImage'

/** Carnet con QR y, según la configuración del gimnasio, ID para el lector o enlace para vincular el celular. */
export default function Carnet({ member: m, mode, onClose }) {
  const toast = useToast()
  const [sec, setSec] = useState(null)
  useEffect(() => {
    let on = true
    memberSecrets(m.id).then((s) => on && setSec(s)).catch((e) => toast(e.message, 'bad'))
    return () => { on = false }
  }, [m.id, toast])
  const link = sec ? `${window.location.origin}/enroll#${sec.enroll_token}` : ''
  const copy = async () => {
    try { await navigator.clipboard.writeText(link); toast('Enlace copiado') } catch { toast('No se pudo copiar el enlace', 'bad') }
  }
  return (
    <Modal title="Carnet del miembro" onClose={onClose}>
      <div className="space-y-4 text-center">
        <div id="carnet" className="space-y-3">
          {m.photo_url && <img src={m.photo_url} alt={m.name} className="mx-auto h-20 w-20 rounded-full object-cover" />}
          <div><b className="text-lg">{m.name}</b><div className="font-mono text-sm text-gx-mut">DNI {m.dni} · vence {fmtDate(m.end_date)}</div></div>
          <div className="flex justify-center">{sec ? <QrImage text={`GYMXIO:${m.id}:${sec.qr_token}`} size={190} /> : <div className="h-[206px] w-[206px] rounded-xl bg-gx-card2" />}</div>
          <p className="text-xs text-gx-mut">Presenta este QR en recepción para ingresar.</p>
          {mode === 'device' && (
            <div className="rounded-xl border border-gx-line p-3">
              <div className="text-xs text-gx-mut">ID para el lector biométrico</div>
              <b className="font-mono text-3xl text-gx-amb">{m.device_user_id}</b>
              <div className="text-xs text-gx-mut">Registra su huella o rostro en el equipo con este ID.</div>
            </div>
          )}
        </div>
        {mode === 'phone' && sec && (
          <div className="rounded-xl border border-gx-line p-3">
            <div className="mb-2 text-sm font-semibold">{m.has_bio ? '✓ Celular vinculado' : 'Vincular huella o rostro del celular'}</div>
            <div className="flex justify-center"><QrImage text={link} size={140} alt="Enlace para vincular el celular" /></div>
            <p className="mt-2 text-xs text-gx-mut">El miembro escanea este código con su celular y sigue los pasos. Sirve una sola vez.</p>
            <button className="btn btn-s mt-2" onClick={copy}>Copiar enlace</button>
          </div>
        )}
        <div className="flex justify-end gap-2.5"><button className="btn" onClick={() => window.print()}>Imprimir carnet</button><button className="btn btn-p" onClick={onClose}>Listo</button></div>
      </div>
    </Modal>
  )
}
