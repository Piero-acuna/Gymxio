import { useRef, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const P = {
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  lock: '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  eye: '<path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/>',
  arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
  gym: '<path d="M6 7v10M18 7v10M3 10v4M21 10v4M6 12h12"/>',
  book: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
}
const Icon = ({ n, s = 18 }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: P[n] }} />
const Field = ({ label, icon, children }) => (
  <>
    <label className="mb-2 mt-4 block text-[13px] uppercase text-gx-mut">{label}</label>
    <div className="flex items-center gap-2.5 rounded-xl border border-gx-line bg-[#1a2438] px-3.5 text-gx-mut focus-within:border-gx-amb focus-within:ring-2 focus-within:ring-gx-amb/20">
      <Icon n={icon} />{children}
    </div>
  </>
)
const inner = 'min-w-0 flex-1 bg-transparent py-3.5 text-slate-100 outline-none placeholder:text-slate-500'
const COPY = {
  in: ['Iniciar Sesión', 'Accede al panel de tu gimnasio'],
  up: ['Crear gimnasio', 'Configura tu espacio en un minuto'],
  reset: ['Nueva contraseña', 'Elige una contraseña nueva para tu cuenta'],
}

export default function AuthPage() {
  const { signIn, signUp, resetPassword, updatePassword, recovery } = useAuth()
  const toast = useToast()
  const [mode, setMode] = useState(recovery ? 'reset' : 'in')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const form = useRef()
  const m = recovery ? 'reset' : mode

  async function submit(e) {
    e.preventDefault()
    const v = Object.fromEntries(new FormData(form.current))
    setBusy(true)
    try {
      if (m === 'in') await signIn(v.email, v.pw)
      if (m === 'up' && !(await signUp(v.gym.trim(), v.email, v.pw))) { setMode('in'); setNote('Revisa tu correo para confirmar la cuenta y luego entra.') }
      if (m === 'reset') { await updatePassword(v.pw); toast('Contraseña actualizada') }
    } catch (err) { toast(err.message, 'bad') } finally { setBusy(false) }
  }
  async function forgot() {
    const email = (new FormData(form.current).get('email') || '').trim()
    if (!email) return toast('Escribe tu correo primero', 'bad')
    try { await resetPassword(email); toast('Te enviamos un enlace para cambiar tu contraseña') } catch (err) { toast(err.message, 'bad') }
  }
  const pw = (ac) => (
    <>
      <input name="pw" type={show ? 'text' : 'password'} required minLength={6} placeholder="••••••••" autoComplete={ac} className={inner} />
      <button type="button" onClick={() => setShow(!show)} aria-label="Mostrar u ocultar contraseña"><Icon n="eye" /></button>
    </>
  )
  const link = 'font-bold text-amber-400'
  return (
    <div className="fixed inset-0 flex flex-col items-center overflow-auto px-4 pb-6 pt-7" style={{ background: 'radial-gradient(ellipse at 50% 15%,#0b1426 0,#050914 70%)' }}>
      <div className="pointer-events-none fixed inset-0" style={{ backgroundImage: 'linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
      <div className="relative flex flex-col items-center">
        <div className="grid h-[70px] w-[70px] place-items-center rounded-[18px] bg-gx-amb text-[#1a1206] shadow-[0_10px_30px_#f59e0b55]"><Icon n="gym" s={34} /></div>
        <h1 className="mb-1 mt-5 text-3xl font-bold">Gym<span className="text-amber-400">xio</span></h1>
        <p className="mb-8 font-mono text-xs tracking-[.2em] text-slate-500">GESTIÓN DE GIMNASIOS</p>
        <form ref={form} onSubmit={submit} className="w-[min(480px,calc(100vw-32px))] rounded-[22px] border border-gx-line bg-[#0e1729] p-[30px] shadow-2xl">
          <h2 className="text-[22px] font-bold">{COPY[m][0]}</h2>
          <p className="text-gx-mut">{COPY[m][1]}</p>
          {note && <div className="mt-4 rounded-lg border border-gx-amb/40 bg-gx-amb/10 px-3 py-2.5 text-[13px] text-amber-400">{note}</div>}
          {m === 'up' && <Field label="Nombre del gimnasio" icon="gym"><input name="gym" required placeholder="Ej. Iron Fit Lima" autoComplete="organization" className={inner} /></Field>}
          {m !== 'reset' && <Field label="Correo electrónico" icon="mail"><input name="email" type="email" required placeholder="correo@gimnasio.com" autoComplete="username" className={inner} /></Field>}
          <Field label={m === 'reset' ? 'Contraseña nueva' : 'Contraseña'} icon="lock">{pw(m === 'in' ? 'current-password' : 'new-password')}</Field>
          {m === 'in' && <button type="button" onClick={forgot} className="ml-auto mt-3 block text-[13px] text-gx-mut">¿Olvidaste tu contraseña?</button>}
          <button disabled={busy} className="mt-6 flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-gx-amb py-4 text-[17px] font-bold text-[#1a1206] shadow-[0_10px_26px_#f59e0b44] disabled:opacity-60">
            {busy ? 'Un momento…' : COPY[m][0] === 'Nueva contraseña' ? 'Guardar contraseña' : COPY[m][0]} <Icon n="arrow" />
          </button>
          {m !== 'reset' && (
            <div className="mt-5 border-t border-gx-line pt-4 text-center text-sm text-gx-mut">
              {m === 'in' ? <>¿No tienes cuenta? <button type="button" className={link} onClick={() => { setMode('up'); setNote('') }}>Crear gimnasio nuevo</button></> : <>¿Ya tienes cuenta? <button type="button" className={link} onClick={() => { setMode('in'); setNote('') }}>Iniciar sesión</button></>}
            </div>
          )}
        </form>
        <p className="mb-3.5 mt-6 text-center text-sm text-slate-600">Cada gimnasio tiene su propio espacio aislado de datos</p>
        <div className="flex max-w-[480px] flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-slate-400">
          <a href="/legal.html#terminos">Términos y Condiciones</a><a href="/legal.html#cambios">Cambios y Devoluciones</a><a href="/legal.html#privacidad">Política de Privacidad</a>
          <a href="/legal.html#reclamaciones" className="flex items-center gap-2 font-semibold text-slate-200"><Icon n="book" s={16} /> Libro de Reclamaciones</a>
        </div>
        <p className="mt-3.5 text-[13px] text-slate-600">© {new Date().getFullYear()} Gymxio</p>
      </div>
    </div>
  )
}
