import { useState } from 'react'
import MisDatos from './MisDatos'
import Equipos from './Equipos'
import Facturacion from './Facturacion'
import Configuracion from './Configuracion'
import Soporte from './Soporte'

const ALL = ['owner', 'reception', 'trainer']
const SECTIONS = [
  ['datos', 'Mis datos', MisDatos, ALL],
  ['equipos', 'Equipos', Equipos, ALL],
  ['facturacion', 'Facturación', Facturacion, ['owner']],
  ['config', 'Configuración', Configuracion, ['owner']],
  ['soporte', 'Soporte', Soporte, ALL],
]

export default function Panel({ gym, role }) {
  const items = SECTIONS.filter((s) => s[3].includes(role))
  const [id, setId] = useState(items[0][0])
  const Section = items.find((s) => s[0] === id)[2]
  return (
    <div className="grid gap-5 lg:grid-cols-[200px_1fr]">
      <nav className="card flex h-fit gap-1 overflow-x-auto p-2 lg:flex-col">
        {items.map(([k, label]) => <button key={k} onClick={() => setId(k)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-left text-sm font-semibold ${id === k ? 'bg-gx-amb text-[#1a1206]' : 'text-gx-mut hover:text-slate-100'}`}>{label}</button>)}
      </nav>
      <div className="min-w-0"><Section gym={gym} role={role} /></div>
    </div>
  )
}
