export async function bioPost(body) {
  const r = await fetch('/api/bio', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw new Error(j.error || 'Error ' + r.status)
  return j
}
export const supportsBio = () => !!window.PublicKeyCredential
