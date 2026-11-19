import { useEffect, useState } from 'react'
import { postJson } from '../../lib/http'
import { DOCS, VIGENCIA } from '../../legal/content'

const MISSING = '[dato por configurar]'
const fill = (t, p) => t.replaceAll('{{nombre}}', p.name || MISSING).replaceAll('{{ruc}}', p.ruc || MISSING).replaceAll('{{direccion}}', p.address || MISSING)
  .replaceAll('{{correo}}', p.email || MISSING).replaceAll('{{telefono}}', p.phone || MISSING).replaceAll('{{fecha}}', VIGENCIA)
const Text = ({ t }) => t.split(MISSING).flatMap((part, i, a) => (i < a.length - 1 ? [part, <mark key={i} className="rounded bg-gx-amb/20 px-1 text-amber-300">{MISSING}</mark>] : [part]))

/** /legal: términos, privacidad y devoluciones. Los datos del proveedor vienen del servidor (variables PROVIDER_*). */
export default function Legal() {
  const [p, setP] = useState({})
  useEffect(() => { postJson('/api/reclamos', { action: 'info' }).then((r) => setP(r.supplier)).catch(() => {}) }, [])
  return (
    <div className="mx-auto max-w-3xl px-5 py-8">
      <a href="/" className="text-sm text-amber-400">← Volver a Gymxio</a>
      <nav className="card my-5 flex flex-wrap gap-2 p-3 text-sm">
        {DOCS.map((d) => <a key={d.id} href={`#${d.id}`} className="rounded-lg px-3 py-1.5 text-gx-mut hover:text-slate-100">{d.title}</a>)}
        <a href="/reclamos" className="rounded-lg px-3 py-1.5 font-semibold text-slate-100">Libro de Reclamaciones</a>
      </nav>
      {DOCS.map((d) => (
        <section key={d.id} id={d.id} className="mb-12 scroll-mt-6">
          <h1 className="mb-1 text-2xl font-bold">{d.title}</h1>
          <p className="mb-5 text-sm text-gx-mut">Vigente desde el {VIGENCIA}</p>
          {d.sections.map(([h, ...ps]) => (
            <div key={h} className="mb-4"><h2 className="mb-1 font-semibold">{h}</h2>{ps.map((t, i) => <p key={i} className="leading-relaxed text-slate-300"><Text t={fill(t, p)} /></p>)}</div>
          ))}
        </section>
      ))}
    </div>
  )
}
