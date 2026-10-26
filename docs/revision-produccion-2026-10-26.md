# Revisión para preparar el merge a main

Esta revisión parte de `4a5d6d7` de Facu-Rama e incorpora los cambios de Lucas. El merge y la publicación en Production quedan pendientes: un resultado favorable de pruebas no sustituye la configuración del entorno ni el cierre de las cuentas demo.

## Correcciones

- Cada resultado de reportes se asocia a tipo, persona y revisión. Cambiar de selección o recargar invalida inmediatamente el resultado anterior y cancela su petición. Una consulta fallida no habilita exportar la ficha de otra persona.
- Carga, error, ausencia de selección y éxito tienen estados separados. Las peticiones fallidas terminan y permiten reintentar.
- Los renderizadores se ejecutan en un componente hijo del ErrorBoundary. Un error queda contenido; el usuario puede recuperar el panel sin recargar toda la aplicación. El mensaje público no muestra detalles técnicos.
- Se separan transporte de reportes, hook de carga, renderizado y ficha del estudiante. Los portales del alumno y docente cancelan peticiones y permiten recuperar errores.
- La grilla del docente compara los días sin depender de las tildes; miércoles incluye registros guardados como `Miercoles`.
- La vista previa admite Escape, mantiene el foco de teclado dentro del diálogo y lo devuelve al cerrar.
- Login, cambio de contraseña y validación de entidades rechazan cuerpos ausentes o incorrectos con errores de cliente. No se convierten contraseñas numéricas en texto.
- Un fallo de base al autenticar se trata como error del servidor, sin invalidar una sesión válida.
- Las respuestas API usan `Cache-Control: no-store`.
- `body-parser` se actualiza a 2.4.0. Se fija Zod corregido mediante un override de `@vercel/cli-config`, porque esa dependencia lo fijaba a una versión vulnerable. Mantener el override hasta que el proveedor incorpore la corrección.
- CI incluye auditoría de dependencias de producción. Git normaliza texto a LF para evitar diferencias de formato al descargar desde Windows.
- Los informes de TestSprite y documentos de trabajo quedan fuera del paquete de Vercel.

## Cobertura agregada

Las pruebas usan bases desechables, SMTP local de prueba y respuestas HTTP interceptadas cuando se simulan fallos. No realizan escrituras de prueba sobre Supabase.

- Reportes: errores HTTP, respuesta con estructura incorrecta, excepción de renderizado, recuperación, selección de alumno/docente y respuesta tardía fuera de orden.
- Exportación e impresión: descarga CSV real, neutralización de fórmulas, nueve tipos de reportes y generación de un PDF real.
- Sesión y permisos: aislamiento por familia/alumno/docente, origen de escrituras, sesión revocada, cambio de contraseña, cuenta familiar sin elevación de privilegios y límite de intentos.
- Entrada HTTP: JSON inválido, cuerpos ausentes y límite de 256 KB.
- Modo producción: rechazo sin PostgreSQL o clave JWT válida, cookie Secure/HttpOnly/SameSite, emisor/audiencia/expiración del JWT e inicialización compartida con reintento tras fallo.
- Portales: alumno y docente recuperan consultas fallidas; vistas móviles de alumno, docente, familia y administración.
- Se conservan los casos de concurrencia, cupos, horarios, asistencia atómica, calificaciones y restauración cifrada sobre PostgreSQL aislado.

## Pendientes de operación antes de publicar

Verificación local completa, 26/10/2026:

| Control | Resultado |
|---|---|
| Instalación limpia con lockfile | Correcta, desde caché verificada |
| Formato y compilación frontend/backend | Correctos |
| Integración SQLite + pruebas de modo producción | 31/31 |
| Integración PostgreSQL aislado | 27/27 |
| Restauración cifrada PostgreSQL | 30 tablas, aproximadamente 2,9 segundos en este ensayo |
| Navegador Edge/Chromium | 26/26 |
| Auditoría npm completa | 0 vulnerabilidades conocidas |

Los ensayos incluyen fallos simulados y los recorridos normales. El tiempo de restauración es una medición aislada, no un compromiso de recuperación del hosting real.

1. En la consulta de configuración del 26/10, Vercel Production tiene `DATABASE_URL` pero **no `JWT_SECRET`**. La clave debe configurarse antes de mergear si main dispara un despliegue automático. No se transfirieron secretos ni se alteró Production durante esta revisión.
2. Una consulta de solo lectura a Supabase confirmó esquema 4, ausencia de contraseñas en texto plano y **cinco cuentas activas que conservan las claves demo conocidas**. Deben cambiarse o desactivarse antes de abrir el sistema a usuarios reales. Conservar una cuenta administrativa operativa.
3. La contraseña de la conexión fue incluida anteriormente en el contexto del chat: corresponde rotarla y actualizar las conexiones local/Preview/Production antes de una apertura real. No se publica ningún secreto en este documento.
4. Correo y programación de respaldos siguen siendo configuración operativa pendiente, aceptada anteriormente para la demostración. El respaldo/restauración y el envío a SMTP de prueba están implementados y verificados; no se afirma que su operación automática externa esté activada.

La instalación limpia encontró un error TLS del cliente npm de este equipo al descargar TypeScript. Se descargó el mismo archivo oficial por HTTPS usando el cliente de Windows, se verificó SHA-512 contra el lockfile y se instaló con `npm ci --offline`. La verificación TLS no se deshabilitó.
