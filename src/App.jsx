import { useAuth } from './context/AuthContext'
import { supabase } from './lib/supabase'
import AuthPage from './pages/AuthPage'
import Shell from './components/layout/Shell'

const Notice = ({ title, text, action }) => (
  <div className="grid min-h-screen place-items-center p-6">
    <div className="card max-w-md p-7"><h1 className="mb-2 text-xl font-bold">{title}</h1><p className="text-gx-mut">{text}</p>{action && <button className="btn btn-p mt-5" onClick={action}>Salir</button>}</div>
  </div>
)

export default function App() {
  const { session, profile, loading, recovery, signOut } = useAuth()
  if (!supabase) return <Notice title="Falta configurar" text="Copia .env.example a .env.local y completa VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY." />
  if (loading) return <div className="grid min-h-screen place-items-center text-gx-mut">Cargando…</div>
  if (!session || recovery) return <AuthPage />
  if (!profile) return <Notice title="Sin gimnasio asignado" text="Pide al dueño que te agregue como personal." action={signOut} />
  return <Shell />
}
