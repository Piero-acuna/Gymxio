# Gymxio

```
gymxio/
├─ frontend/                  interfaz (estática, sin build por ahora)
│  ├─ index.html
│  ├─ config.js               URL y clave anon de Supabase
│  └─ src/
│     ├─ css/styles.css       paleta y componentes
│     └─ js/
│        ├─ core.js           fechas, planes, estado, utilidades
│        ├─ api/              client.js (Supabase) · data.js (carga y check-in)
│        ├─ auth/             roles.js · session.js (login y arranque)
│        ├─ ui/               shell.js · modal.js · events.js · actions.js
│        ├─ views/            index.js · lists.js · planes.js
│        ├─ features/         biometric.js · qr.js
│        └─ main.js
├─ backend/
│  ├─ supabase/
│  │  ├─ migrations/          schema · security_rls · functions
│  │  └─ functions/           Edge Functions (pendientes)
│  └─ docs/API.md
└─ docs/STACK.md              framework y lenguajes recomendados
```

## Puesta en marcha
1. En Supabase, ejecuta en orden los 3 archivos de `backend/supabase/migrations/` (o `supabase db push` tras `supabase init` dentro de `backend/`).
2. Pega URL y clave `anon` en `frontend/config.js`.
3. `cd frontend && npm run dev` (HTTPS o localhost para cámara y biometría).
4. Pulsa **Crear gimnasio**.
