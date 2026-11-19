export async function postJson(path, body) {
  const r = await fetch(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(r.status === 404 ? 'El servicio no está disponible.' : j.error || 'Error ' + r.status)
  return j
}
