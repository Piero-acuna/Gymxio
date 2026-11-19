# Qué falta (revisión de la app)

## Hecho
Índices y permisos de la base, secretos del carnet ocultos (`member_secrets`), pantalla de error, CI, límite de intentos en las rutas públicas, Libro de Reclamaciones (gimnasio y plataforma), textos legales redactados con base en la normativa peruana, y pruebas automáticas del flujo de huella (autenticador simulado), del QR (incluso con fotogramas de video) y de los reclamos.

## Antes de abrirlo a clientes reales
1. **Revisión legal** de `src/legal/content.js` por un abogado, y decidir los plazos comerciales (tope de responsabilidad, aviso de cambios, devoluciones).
2. **Completar las variables** `PROVIDER_*` en Vercel y probar `/reclamos` y `/legal` con datos reales.
3. **Correo:** configurar Resend (`RESEND_API_KEY`, `MAIL_FROM`) para enviar la copia de la hoja y la respuesta. Sin eso, el dueño debe enviarlas a mano.
4. **Pruebas en dispositivos reales:** cámara, huella o rostro de celulares y lector biométrico (en este entorno no hay cámara ni biometría).
5. **Libro físico de respaldo** y aviso impreso con el QR en cada local.
6. **Activar** la protección contra contraseñas filtradas (Supabase > Authentication).
7. Ver si corresponde **inscribir el banco de datos** y designar responsable ante la Autoridad Nacional de Protección de Datos Personales.

## Para que sea más completo
- **Cobros en línea y recordatorios:** Yape, Culqi o Niubiz; avisos de vencimiento por WhatsApp o correo.
- **Membresías:** congelar, transferir, descuentos y promociones, pase de prueba, mora.
- **Finanzas:** gastos y utilidad, anular pagos, cierre de caja, comprobantes SUNAT.
- **Clases:** reservas con cupos y lista de espera.
- **Seguimiento del miembro:** medidas, rutinas y objetivos.
- **Reportes:** asistencia por hora y día, retención, gráfico semanal en Inicio.
- **Operación:** sucursales, casilleros, horarios y feriados, registro de quién hizo cada cambio.
- **Ingreso desde `/acceso`:** comprobar que la persona esté dentro del gimnasio.
- **Libro de la plataforma:** pantalla para que quien opera Gymxio responda sus hojas (hoy se hace en Supabase).
- **Móvil:** uso sin conexión e íconos PNG para instalarla en iPhone.
