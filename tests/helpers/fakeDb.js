/** Base de datos en memoria con la parte de supabase-js que usan las funciones de api/ (para pruebas). */
export function fakeDb(seed = {}, rpcs = {}) {
  const tables = {}
  for (const [k, v] of Object.entries(seed)) tables[k] = v.map((r) => ({ ...r }))
  const calls = []
  let nextId = 100
  const from = (name) => {
    const t = (tables[name] ||= [])
    const st = { op: 'select', filters: [], patch: null, rows: [], conflict: null }
    const run = () => {
      const match = (r) => st.filters.every(([k, op, v]) => (op === 'eq' ? r[k] === v : op === 'lt' ? r[k] < v : op === 'is' ? r[k] == null : true))
      if (st.op === 'insert') { const rows = st.rows.map((r) => ({ id: ++nextId, ...r })); t.push(...rows); return rows }
      if (st.op === 'upsert') {
        return st.rows.map((r) => {
          const i = t.findIndex((x) => x[st.conflict] === r[st.conflict])
          if (i >= 0) { Object.assign(t[i], r); return t[i] }
          const n = { id: ++nextId, ...r }; t.push(n); return n
        })
      }
      const hit = t.filter(match)
      if (st.op === 'update') { hit.forEach((r) => Object.assign(r, st.patch)); return hit }
      if (st.op === 'delete') { hit.forEach((r) => t.splice(t.indexOf(r), 1)); return hit }
      return hit
    }
    const b = {
      select: () => b,
      eq: (k, v) => { st.filters.push([k, 'eq', v]); return b },
      lt: (k, v) => { st.filters.push([k, 'lt', v]); return b },
      is: (k) => { st.filters.push([k, 'is']); return b },
      insert: (r) => { st.op = 'insert'; st.rows = [].concat(r); return b },
      update: (p) => { st.op = 'update'; st.patch = p; return b },
      delete: () => { st.op = 'delete'; return b },
      upsert: (r, o) => { st.op = 'upsert'; st.rows = [].concat(r); st.conflict = o?.onConflict; return b },
      single: async () => { const [r] = run(); return r ? { data: r, error: null } : { data: null, error: { message: 'no rows' } } },
      maybeSingle: async () => ({ data: run()[0] ?? null, error: null }),
      then: (res, rej) => Promise.resolve({ data: run(), error: null }).then(res, rej),
    }
    return b
  }
  const rpc = async (name, args) => { calls.push([name, args]); const f = rpcs[name]; return f ? f(args) : { data: name !== 'rate_limit_blocked', error: null } } // por defecto: se permite y no hay bloqueo
  const auth = { getUser: async (token) => (rpcs.__users?.[token] ? { data: { user: rpcs.__users[token] }, error: null } : { data: {}, error: { message: 'sesión no válida' } }) }
  return { tables, calls, from, rpc, auth }
}
