// Avisa antes de compilar si faltan las variables de Supabase (en Vercel se definen en Settings > Environment Variables).
const need = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY']
const missing = need.filter((k) => !process.env[k])
if (missing.length) console.warn(`\n⚠ Faltan variables: ${missing.join(', ')}. La app mostrará "Falta configurar" hasta definirlas.\n`)
