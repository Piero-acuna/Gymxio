import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// Sirve api/*.js en desarrollo igual que Vercel (lee SUPABASE_SERVICE_ROLE_KEY de .env.local)
const devApi = (env) => ({
  name: 'dev-api',
  configureServer(server) {
    Object.assign(process.env, env)
    server.middlewares.use(async (req, res, next) => {
      const m = req.url?.match(/^\/api\/([\w-]+)/)
      if (!m) return next()
      const send = (code, o) => { res.statusCode = code; res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(o)) }
      try {
        const mod = await server.ssrLoadModule(`/api/${m[1]}.js`).catch(() => null)
        if (!mod) return send(404, { error: 'Función no encontrada.' })
        let raw = ''
        for await (const c of req) raw += c
        try { req.body = raw ? JSON.parse(raw) : {} } catch { req.body = {} }
        res.status = (c) => { res.statusCode = c; return res }
        res.json = (o) => send(res.statusCode || 200, o)
        await mod.default(req, res)
      } catch (e) { send(500, { error: e.message }) }
    })
  },
})

export default defineConfig(({ mode }) => ({
  plugins: [react(), devApi(loadEnv(mode, process.cwd(), ''))],
  server: { port: 5173 },
  test: { environment: 'node', include: ['tests/**/*.test.{js,jsx}'] },
}))
