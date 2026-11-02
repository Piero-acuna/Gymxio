import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

/** null si faltan las variables de entorno (la app muestra "Falta configurar"). */
export const supabase = url && key && !url.includes('TU-PROYECTO') ? createClient(url, key) : null
