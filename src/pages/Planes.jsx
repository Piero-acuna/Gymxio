import { updatePlanPrice } from '../lib/api'
import { money, status } from '../lib/format'
import { useToast } from '../context/ToastContext'

export default function Planes({ gym, role }) {
  const toast = useToast()
  const edit = async (p) => {
    const n = window.prompt('Nuevo precio (S/)', p.price)
    if (n === null) return
    const price = parseFloat(n)
    if (!(price >= 0)) return toast('Precio no válido', 'bad')
    try { await updatePlanPrice(p.id, price); toast('Precio actualizado'); await gym.reload() } catch (e) { toast(e.message, 'bad') }
  }
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-4">
      {gym.plans.map((p) => (
        <div key={p.id} className="card p-5">
          <h3 className="font-semibold">{p.name}</h3>
          <b className="mb-0.5 mt-2 block font-mono text-3xl text-gx-amb">{money(p.price)}</b>
          <span className="text-gx-mut">{p.days === 1 ? '1 día' : p.days + ' días'}</span>
          <p className="my-3.5 text-gx-mut">{gym.members.filter((m) => m.plan_id === p.id && status(m).key !== 'bad').length} miembros vigentes</p>
          {role === 'owner' && <button className="btn btn-s" onClick={() => edit(p)}>Cambiar precio</button>}
        </div>
      ))}
    </div>
  )
}
