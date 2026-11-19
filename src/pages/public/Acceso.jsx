import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'
import { bioPost, supportsBio } from '../../lib/bio'
import PublicShell from './PublicShell'

/** /acceso: el miembro registra su ingreso con la huella o el rostro de su celular. */
export default function Acceso() {
  const [st, setSt] = useState({ s: 'idle', msg: '' })
  async function go() {
    setSt({ s: 'busy', msg: '' })
    try {
      const { options, cid } = await bioPost({ action: 'login-options' })
      const response = await startAuthentication({ optionsJSON: options })
      const r = await bioPost({ action: 'login-verify', cid, response })
      setSt({ s: 'ok', msg: r.name })
    } catch (e) {
      setSt({ s: 'err', msg: e.name === 'NotAllowedError' ? 'Cancelaste la verificación.' : e.message })
    }
  }
  return (
    <PublicShell title="Registrar ingreso" text="Confirma con tu huella o rostro.">
      {st.s === 'ok' ? <p className="text-lg font-semibold text-gx-ok">¡Bienvenido, {st.msg}!</p> : !supportsBio() ? <p className="text-gx-bad">Este celular no admite huella o rostro. Muestra tu QR en recepción.</p> : (
        <>
          <button className="btn btn-p w-full py-3.5 text-base" disabled={st.s === 'busy'} onClick={go}>{st.s === 'busy' ? 'Esperando verificación…' : 'Ingresar con huella o rostro'}</button>
          {st.s === 'err' && <p className="mt-3 text-sm text-gx-bad">{st.msg}</p>}
          <p className="mt-4 text-xs text-gx-mut">Si no funciona, muestra el QR de tu carnet en recepción.</p>
        </>
      )}
    </PublicShell>
  )
}
