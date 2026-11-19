# API (funciones RPC)

| Función | Roles | Qué hace |
|---|---|---|
| `create_gym(p_name)` | usuario nuevo | Crea gimnasio, dueño, planes y clases de ejemplo |
| `register_member(...)` | dueño, recepción | Alta de miembro + primer cobro |
| `renew_member(...)` | dueño, recepción | Renueva y cobra; suma desde el vencimiento o desde hoy |
| `check_in(p_member, p_via, p_extra)` | todos | Ingreso por `manual`, `qr` o `bio`; valida vigencia y duplicados |
| `register_credential(...)` | dueño, recepción | Vincula huella o rostro a un miembro |
| `add_staff(...)` | dueño | Asigna recepción o entrenador a un usuario existente |

| `rotate_device_key()` | dueño | Genera la clave de integración de lectores (se muestra una vez; se guarda su hash) |
| `check_in_server(...)` | solo servidor | Ingreso por celular o lector (usada por `api/bio.js` y `api/device-checkin.js`) |

| `rate_limit_hit(...)` · `rate_limit_blocked(...)` | solo servidor | Límite de intentos por clave y ventana de tiempo |
| `create_complaint(...)` | solo servidor | Registra una hoja con número correlativo por libro y año, y vencimiento a 15 días hábiles |
| `member_secrets(p_member)` | dueño, recepción | Entrega el QR secreto y el token de vinculación del carnet |
