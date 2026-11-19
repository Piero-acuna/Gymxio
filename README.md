# Gymxio

Gestión de gimnasios. Misma base que Invenxio: Vite + React + Tailwind + Supabase, desplegable en Vercel.

```
gymxio/
├─ api/                funciones serverless de Vercel: staff (cuentas de empleados), bio (huella o rostro del celular), device-checkin (lectores), reclamos (Libro de Reclamaciones), health
├─ public/             favicon, manifest PWA, legal.html
├─ scripts/            check-env.js (avisa si faltan variables antes de compilar)
├─ src/
│  ├─ main.jsx · App.jsx · index.css
│  ├─ lib/             supabase.js · api.js (consultas y RPC) · format.js (fechas, dinero, estados)
│  ├─ context/         AuthContext (sesión, perfil, rol) · ToastContext
│  ├─ hooks/           useGymData.js
│  ├─ components/      layout/Shell.jsx · ui/ · Carnet · QrImage · QrScanner
│  └─ pages/           AuthPage · Inicio · Miembros · Asistencia · Pagos · Planes · Clases
│     ├─ panel/        Panel · MisDatos · Equipos (empleados) · Facturacion · Configuracion · Reclamos · Soporte
│     └─ public/       Enroll (/enroll) · Acceso (/acceso): celular del miembro · Reclamos (/reclamos) · Legal (/legal)
├─ supabase/migrations/   schema · security_rls · functions · panel · team_biometrics · member_files · member_delete · hardening · performance_hardening · restrict_member_secrets · rate_limits · complaints_book
├─ tests/              Vitest (formato, estados y render)
├─ docs/               STACK.md · API.md · ROADMAP.md (qué falta)
├─ .github/workflows/  CI: lint, pruebas y compilación
├─ frontend-legacy/    versión anterior sin build, con QR y biometría funcionando (referencia)
├─ .env.example        copiar a .env.local
└─ eslint · postcss · tailwind · vite · vercel (config)
```

## Puesta en marcha
1. Ejecuta en orden los 12 archivos de `supabase/migrations/` en el SQL Editor de Supabase.
2. `cp .env.example .env.local` y completa `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` (esta última solo la usa el servidor; nunca la subas con prefijo `VITE_`).
3. `npm install` y `npm run dev` (http://localhost:5173).
4. Pulsa **Crear gimnasio nuevo**.
5. Vercel: importa el repo, agrega las dos variables y despliega (`vercel.json` ya resuelve las rutas).

## Panel (botón ▦ Panel)
- **Mis datos:** nombre, teléfono y contraseña.
- **Equipos** (dueño): crea las cuentas de los empleados (recepción o entrenador) con correo y contraseña, y permite editarlas, restablecer la contraseña y eliminarlas.
- **Facturación** (dueño): razón social, RUC, dirección fiscal, ingresos por mes y CSV de pagos. Sin comprobantes electrónicos todavía.
- **Configuración** (dueño): datos del gimnasio, días de aviso y **acceso biométrico**: solo QR, celular del miembro o equipos biométricos.
- **Soporte:** solicitudes, preguntas frecuentes y contacto (`VITE_SUPPORT_EMAIL`, `VITE_SUPPORT_WHATSAPP`).

## Nuevo miembro, carnet y biometría
Al registrar un miembro se abre su **carnet** con un QR (también desde el botón *Carnet*). Según el modo elegido:
- **Celular:** el carnet muestra un QR de un solo uso; el miembro lo escanea con su celular y vincula su huella o rostro (`/enroll`). Luego ingresa desde `/acceso`. El servidor verifica la firma (WebAuthn).
- **Equipos:** el carnet muestra el **ID** del miembro para registrar su huella en el lector. El lector avisa con `POST /api/device-checkin` y la clave generada en Configuración.
- **Solo QR:** en Asistencia, *Escanear QR* usa la cámara.

## Foto del rostro y DNI
En *Nuevo miembro* y *Editar* se sube el rostro y el DNI (frente y reverso) con la cámara o desde archivos. El rostro aparece en la lista, en Asistencia y en el carnet. Es una foto de identificación; no hay reconocimiento facial.
- **Privacidad:** bucket privado `member-files`, enlaces temporales de 1 hora. Dueño y recepción ven todo; el entrenador solo ve el rostro.
- **Imágenes:** se convierten a JPEG reducido en el navegador, lo que elimina datos EXIF como la ubicación.
- **Consentimiento:** al subir archivos se exige marcar la autorización y se guarda la fecha (`consent_at`). Revisa con tu asesor legal el aviso de privacidad (Ley 29733).
- **Eliminar miembro** (solo el dueño): borra sus tres archivos del Storage y su asistencia. Sus pagos se conservan en el historial con el nombre que tenía.

## Libro de Reclamaciones y textos legales
- **Libro del gimnasio:** cada gimnasio tiene su enlace público `/reclamos?g=CODIGO` (con QR en Panel > Reclamos) para poner a la vista de sus clientes. Numeración correlativa por año, plazo de 15 días hábiles, respuesta escrita desde el panel y copia por correo.
- **Libro de la plataforma:** `/reclamos` sin código, para quien opera Gymxio. Se lee en Supabase (`complaints` con `gym_id` nulo).
- **Textos legales:** `/legal` (términos, privacidad y devoluciones). Los datos de quien opera el servicio salen de `PROVIDER_*`; mientras falten se resaltan en ámbar.
- **Correo:** con `RESEND_API_KEY` y `MAIL_FROM` se envía la copia de la hoja y la respuesta; sin eso se muestra la constancia en pantalla.
- **Límite de intentos:** `/api/bio` 120 por minuto por IP; `/api/device-checkin` 300 por minuto y bloqueo de 10 minutos tras 10 claves incorrectas; hojas de reclamación 5 por hora por IP; `/api/staff` 60 por minuto por usuario. Si el contador falla, el servicio sigue.

## Comandos
`npm run dev` · `npm run build` · `npm run lint` · `npm test`

## Pendiente
Gráfico de asistencia semanal, pagos en línea (Yape, Culqi, Niubiz), recordatorios de vencimiento, Libro de Reclamaciones y verificar que el ingreso desde `/acceso` ocurra dentro del gimnasio.
