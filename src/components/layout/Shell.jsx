import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useGymData } from '../../hooks/useGymData'
import { status } from '../../lib/format'
import Inicio from '../../pages/Inicio'
import Miembros from '../../pages/Miembros'
import Asistencia from '../../pages/Asistencia'
import Pagos from '../../pages/Pagos'
import Planes from '../../pages/Planes'
import Clases from '../../pages/Clases'

const TABS = [['inicio', 'Inicio', Inicio], ['miembros', 'Miembros', Miembros], ['asistencia', 'Asistencia', Asistencia], ['pagos', 'Pagos', Pagos], ['planes', 'Planes', Planes], ['clases', 'Clases', Clases]]
const ACCESS = { owner: TABS.map((t) => t[0]), reception: ['inicio', 'miembros', 'asistencia', 'pagos', 'clases'], trainer: ['asistencia', 'clases'] }
const ROLE = { owner: 'Dueño', reception: 'Recepción', trainer: 'Entrenador' }

export default function Shell() {
  const { profile, session, signOut } = useAuth()
  const gym = useGymData()
  const tabs = TABS.filter((t) => ACCESS[profile.role].includes(t[0]))
  const [tab, setTab] = useState(tabs[0][0])
  const Page = (tabs.find((t) => t[0] === tab) || tabs[0])[2]
  const alerts = gym.members.filter((m) => status(m).key !== 'ok').length
  const name = (profile.full_name || session.user.email).split('@')[0]
  return (
    <>
      <header className="flex items-center gap-3 border-b border-gx-line bg-gx-bar px-4 py-3 sm:px-6">
        <img src="/favicon.svg" alt="" className="h-9 w-9" />
        <span className="font-bold">Gymxio</span>
        <span className="rounded-lg border border-gx-amb/40 bg-gx-amb/10 px-2.5 py-1 text-xs font-semibold text-gx-amb">{ROLE[profile.role]}</span>
        <span className="flex-1" />
        {alerts > 0 && <span className="rounded-lg border border-gx-amb/40 bg-gx-amb/10 px-2.5 py-1 text-xs font-semibold text-gx-amb">⚠ {alerts} alertas</span>}
        <span className="grid h-8 w-8 place-items-center rounded-full bg-gx-amb font-bold text-[#1a1206]">{name[0].toUpperCase()}</span>
        <span className="hidden text-gx-mut sm:inline">{name}</span>
        <button className="btn btn-s" onClick={signOut}>Salir</button>
      </header>
      <main className="mx-auto max-w-6xl p-4 sm:p-6">
        <nav className="card mb-6 flex w-max max-w-full gap-1 overflow-x-auto p-2">
          {tabs.map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)} className={`whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-semibold ${tab === id ? 'bg-gx-amb text-[#1a1206] shadow-lg shadow-amber-500/25' : 'text-gx-mut hover:text-slate-100'}`}>{label}</button>
          ))}
        </nav>
        {gym.loading ? <p className="text-gx-mut">Cargando datos…</p> : <Page gym={gym} go={setTab} role={profile.role} />}
      </main>
    </>
  )
}
