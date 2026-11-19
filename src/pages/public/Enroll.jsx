import { useState } from 'react'
import { startRegistration } from '@simplewebauthn/browser'
import { bioPost, supportsBio } from '../../lib/bio'
import PublicShell from './PublicShell'

/** /enroll#TOKEN: el miembro vincula la huella o el rostro de su celular. */
export default function Enroll() {
  const token = window.location.hash.slice(1)
  const [st, setSt] = useState({ s: 'idle', msg: '' })
  async function go() {
    setSt({ s: 'busy', msg: '' })
    try {
      const { options, cid } = await bioPost({ action: 'enroll-options', token })
      const response = await startRegistration({ optionsJSON: options })
      const r = await bioPost({ action: 'enroll-verify', cid, response })
      setSt({ s: 'ok', msg: r.name })
    } catch (e) {
      setSt({ s: 'err', msg: e.name === 'NotAllowedError' ? 'Cancelaste la verificación. Puedes intentarlo de nuevo.' : e.message })
    }
  }
  return (
    <PublicShell title="Vincula tu celular" text="Usarás tu huella o rostro para ingresar al gimnasio.">
      {st.s === 'ok' ? <p className="font-semibold text-gx-ok">¡Listo, {st.msg}! Tu celular quedó vinculado.</p> : !token ? <p className="text-gx-bad">Falta el enlace. Pide uno en recepción.</p> : !supportsBio() ? <p className="text-gx-bad">Este celular o navegador no admite huella o rostro. Usa tu QR en recepción.</p> : (
        <>
          <button className="btn btn-p w-full py-3.5 text-base" disabled={st.s === 'busy'} onClick={go}>{st.s === 'busy' ? 'Esperando verificación…' : 'Vincular huella o rostro'}</button>
          {st.s === 'err' && <p className="mt-3 text-sm text-gx-bad">{st.msg}</p>}
        </>
      )}
    </PublicShell>
  )
}
