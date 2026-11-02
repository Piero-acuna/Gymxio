# Gymxio

Gestión de gimnasios. Misma base que Invenxio: Vite + React + Tailwind + Supabase, desplegable en Vercel.

```
gymxio/
├─ api/                funciones serverless de Vercel (health; webauthn, pagos y recordatorios pendientes)
├─ public/             favicon, manifest PWA, legal.html
├─ scripts/            check-env.js (avisa si faltan variables antes de compilar)
├─ src/
│  ├─ main.jsx · App.jsx · index.css
│  ├─ lib/             supabase.js · api.js (consultas y RPC) · format.js (fechas, dinero, estados)
│  ├─ context/         AuthContext (sesión, perfil, rol) · ToastContext
│  ├─ hooks/           useGymData.js
│  ├─ components/      layout/Shell.jsx · ui/ (Modal, Badge, Person)
│  └─ pages/           AuthPage · Inicio · Miembros · Asistencia · Pagos · Planes · Clases
│     └─ panel/        Panel · MisDatos · Equipos · Facturacion · Configuracion · Soporte
├─ supabase/migrations/   schema · security_rls · functions · panel
├─ tests/              Vitest (formato, estados y render)
├─ docs/               STACK.md · API.md
├─ frontend-legacy/    versión anterior sin build, con QR y biometría funcionando (referencia)
├─ .env.example        copiar a .env.local
└─ eslint · postcss · tailwind · vite · vercel (config)
```

## Puesta en marcha
1. Ejecuta en orden los 4 archivos de `supabase/migrations/` en el SQL Editor de Supabase.
2. `cp .env.example .env.local` y completa `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
3. `npm install` y `npm run dev` (http://localhost:5173).
4. Pulsa **Crear gimnasio nuevo**.
5. Vercel: importa el repo, agrega las dos variables y despliega (`vercel.json` ya resuelve las rutas).

## Panel (botón ▦ Panel)
- **Mis datos:** nombre, teléfono y contraseña.
- **Equipos:** inventario con unidades y estado (operativo, mantenimiento, fuera de servicio).
- **Facturación** (dueño): razón social, RUC, dirección fiscal, ingresos por mes y CSV de pagos. Sin comprobantes electrónicos todavía.
- **Configuración** (dueño): datos del gimnasio, días de aviso de vencimiento y alta de personal.
- **Soporte:** solicitudes guardadas en la base, preguntas frecuentes y contacto (`VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_WHATSAPP`).

## Comandos
`npm run dev` · `npm run build` · `npm run lint` · `npm test`

## Pendiente de portar a React
Escáner QR, carnet, huella o rostro (están en `frontend-legacy/src/js/features/`), gráfico de asistencia semanal y verificación de firma WebAuthn en `api/`.
