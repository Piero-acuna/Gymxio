// Función serverless de Vercel: GET /api/health
export default function handler(req, res) {
  res.status(200).json({ ok: true, app: 'gymxio', time: new Date().toISOString() })
}
