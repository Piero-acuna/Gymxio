# Cambios de esta versión (respecto al zip anterior)

## Agregados (14)
- `api/reclamos.js`: Libro de Reclamaciones (datos del proveedor, registrar hoja, responder, copia por correo).
- `api/_complaint.js`: validación de la hoja, compartida por la página y el servidor.
- `src/pages/public/Reclamos.jsx`: página pública `/reclamos` con el formulario y la constancia imprimible.
- `src/pages/public/Legal.jsx` y `src/legal/content.js`: términos, privacidad y devoluciones en `/legal`.
- `src/pages/panel/Reclamos.jsx`: el dueño ve las hojas, el plazo y responde; incluye el enlace y el QR para el aviso.
- `src/lib/http.js`: llamada JSON para las páginas públicas.
- `supabase/migrations/20260101001000_rate_limits.sql` y `20260101001100_complaints_book.sql` (ya aplicadas en tu Supabase).
- `tests/bio.test.js`, `tests/qr.test.js`, `tests/reclamos.test.js`, `tests/helpers/fakeDb.js`, `tests/helpers/authenticator.js`.

## Modificados (19)
- `api/_lib.js`: límite de intentos, IP del cliente, envío de correo y datos del proveedor.
- `api/bio.js`, `api/device-checkin.js`, `api/staff.js`: límite de intentos (y `run` exportable para pruebas).
- `src/lib/api.js`: llamada común al servidor y lectura de reclamos.
- `src/main.jsx`: rutas públicas `/reclamos` y `/legal`.
- `src/pages/AuthPage.jsx`: enlaces legales y del libro apuntan a las páginas nuevas.
- `src/pages/panel/Panel.jsx`: sección Reclamos (solo dueño).
- `src/components/layout/Shell.jsx`: pie con términos, privacidad y Libro de Reclamaciones.
- `src/index.css`: impresión de la constancia.
- `vercel.json`: ya no excluye `legal.html`.
- `supabase/migrations/20260101000900_restrict_member_secrets.sql`: marcada como aplicada.
- `tests/render.test.jsx`: pruebas de las páginas nuevas.
- `.env.example`, `README.md`, `api/README.md`, `docs/API.md`, `docs/ROADMAP.md`, `docs/CAMBIOS.md`.

## Eliminados (1)
- `public/legal.html`: reemplazado por la página `/legal`.

## Cambios en tu base de Supabase (ya aplicados)
- Migración `restrict_member_secrets`: nadie puede leer `qr_token` ni `enroll_token` con un select directo.
- Migración `rate_limits`: tabla y funciones del límite de intentos.
- Migración `complaints_book`: código público `slug` de cada gimnasio, tabla `complaints`, número correlativo y plazo de 15 días hábiles.
- Todas se probaron dentro de la base y se revirtieron los datos de prueba.
