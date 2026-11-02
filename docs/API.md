# API (funciones RPC)

| Función | Roles | Qué hace |
|---|---|---|
| `create_gym(p_name)` | usuario nuevo | Crea gimnasio, dueño, planes y clases de ejemplo |
| `register_member(...)` | dueño, recepción | Alta de miembro + primer cobro |
| `renew_member(...)` | dueño, recepción | Renueva y cobra; suma desde el vencimiento o desde hoy |
| `check_in(p_member, p_via, p_extra)` | todos | Ingreso por `manual`, `qr` o `bio`; valida vigencia y duplicados |
| `register_credential(...)` | dueño, recepción | Vincula huella o rostro a un miembro |
| `add_staff(...)` | dueño | Asigna recepción o entrenador a un usuario existente |
