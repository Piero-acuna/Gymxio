# api/ (funciones serverless de Vercel)

| Ruta | Quién la llama | Qué hace |
|---|---|---|
| `POST /api/staff` | Dueño (sesión) | Crea cuentas de empleados, cambia rol, restablece contraseña y elimina |
| `POST /api/bio` | Celular del miembro | Vincula y verifica huella o rostro (WebAuthn) y registra el ingreso |
| `POST /api/device-checkin` | Lector biométrico | Registra el ingreso por `device_user_id` con la clave `x-gym-key` |
| `POST /api/reclamos` | Público y dueño | Libro de Reclamaciones: datos del proveedor, registrar hoja (con copia por correo) y responder |
| `GET /api/health` | Monitoreo | Estado |

Variable de servidor obligatoria: `SUPABASE_SERVICE_ROLE_KEY` (nunca con prefijo `VITE_`). Opcionales: `PROVIDER_*` (datos legales) y `RESEND_API_KEY` + `MAIL_FROM` (correo). Todas las rutas con límite de intentos.
Pendientes: `payments-webhook.js` (Yape, Culqi, Niubiz) y `cron-reminders.js` (avisos de vencimiento).
