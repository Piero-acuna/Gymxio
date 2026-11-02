export default function Clases({ gym }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[640px]">
        <thead><tr><th className="th">Clase</th><th className="th">Días</th><th className="th">Hora</th><th className="th">Entrenador</th><th className="th text-right">Cupos</th></tr></thead>
        <tbody>{gym.classes.map((c) => <tr key={c.id}><td className="td font-semibold">{c.name}</td><td className="td">{c.days}</td><td className="td font-mono">{c.at_time.slice(0, 5)}</td><td className="td">{c.coach}</td><td className="td text-right font-mono">{c.capacity}</td></tr>)}</tbody>
      </table>
    </div>
  )
}
