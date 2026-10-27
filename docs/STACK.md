# Stack recomendado

| Capa | Elección | Por qué |
|---|---|---|
| Interfaz | React + TypeScript + Vite | Mayor ecosistema, soporte y contratación; el panel está tras login, no necesita SSR |
| Diseño | Tailwind CSS + shadcn/ui (Radix) | Tokens de Invenxio (azul marino y ámbar) en `tailwind.config`; componentes accesibles |
| Datos en cliente | TanStack Query + supabase-js | Caché, reintentos y tipos generados de la base |
| Móvil | PWA (vite-plugin-pwa) | Cámara para QR y WebAuthn funcionan sin tienda de apps; Capacitor si luego se necesita |
| Backend | Supabase: Postgres + Auth + RLS + RPC | Sin servidores que mantener; seguridad por gimnasio en la base |
| Lógica extra | Edge Functions en TypeScript | Mismo lenguaje que la interfaz: WebAuthn, pagos, recordatorios |
| Pruebas | Vitest, Playwright, pgTAP | Interfaz, flujos completos y reglas SQL |

Lenguajes: TypeScript y SQL. Next.js solo para una web comercial pública (SEO); el panel puede seguir en Vite.
