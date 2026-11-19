export default function Person({ m }) {
  const ini = m.name.split(' ').map((w) => w[0]).join('').slice(0, 2)
  return (
    <div className="flex items-center gap-3">
      {m.photo_url
        ? <img src={m.photo_url} alt="" className="h-9 w-9 flex-none rounded-lg object-cover" />
        : <i className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-gx-card2 text-xs font-bold not-italic text-gx-amb">{ini}</i>}
      <div>{m.name}<div className="font-mono text-xs text-gx-mut">{m.dni}</div></div>
    </div>
  )
}
