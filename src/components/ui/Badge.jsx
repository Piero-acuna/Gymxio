import { status } from '../../lib/format'

const TONE = {
  ok: 'border-gx-ok/40 bg-gx-ok/10 text-gx-ok',
  warn: 'border-gx-warn/40 bg-gx-warn/10 text-gx-warn',
  bad: 'border-gx-bad/40 bg-gx-bad/10 text-gx-bad',
}
export default function Badge({ member }) {
  const s = status(member)
  return <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold ${TONE[s.key]}`}>{s.label}</span>
}
