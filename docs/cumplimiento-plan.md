# Cumplimiento del plan de trabajo — Grupo 19

El DOCX es la referencia de requisitos del sistema. Se conserva React, Express y PostgreSQL/Supabase. El núcleo nuevo del backend está escrito en TypeScript; las consultas y pantallas aprovechables del proyecto previo se integran sin reescribirlas por completo.

| Requisito | Implementación | Verificación |
|---|---|---|
| RF-01 | Usuarios, BCrypt, JWT en cookie HttpOnly, roles y control por recurso | Sin sesión, token falsificado, permisos y revocación |
| RF-02/03/04 | Alta, edición y baja de niveles, cursos, materias y deportes; protección de referencias | Formularios reales; edición persistente en navegador |
| RF-05 | Día/intervalo normalizado; conflictos de profesor, curso y deportes de un alumno; validación de cambios con alumnos inscriptos | Conflictos y cambio de horario rechazado sin modificar datos |
| RF-06.1–06.7 | Nueve variantes de reportes; tablas, búsqueda, CSV y vista de impresión/PDF | Nueve consultas de integración; reporte en navegador |
| RF-07 | Legajos, DNI, contacto, estado, curso y nivel vinculados | Unicidad y referencias; alta familiar atómica |
| RF-08 | Asignación materia–profesor–curso con horarios | Consultas y autorizaciones docentes |
| RF-09 | Profesor responsable y grupos deportivos por nivel/horario | Referencias y horarios validados |
| RF-10 | Nómina y grilla semanal del docente autenticado | Rechazo de consulta a otro docente; navegador |
| RF-11 | Cadena de validaciones; máximo dos deportes; duplicados por deporte; cupos | Solicitudes concurrentes, duplicados y superposiciones |
| RF-12 | Cuatro recorridos configurables y comedor; inscripción única y capacidad | Quinto recorrido rechazado y último cupo concurrente |
| RF-13 | Familia vinculada por ID del usuario autenticado; matrícula por ciclo; consulta e inscripción a servicios | Aislamiento entre familias, falsificación de parámetros y navegador |
| RF-14 | Observer; bandeja interna, outbox SMTP persistente, reintentos y lease de envío | Entrega SMTP a un receptor local de prueba y fallo/reintento |
| HU2 | Evaluaciones, enlaces HTTPS a entregas, nota, comentarios e historial; notificación familiar y del alumno | Flujo docente → familia en navegador; prueba de integración |
| RNF-01 | Contraseñas migradas a hash, autorización en servidor, origen de escrituras, límite de intentos y headers | Pruebas de acceso y sesión; revisión de secretos |
| RNF-02 | Consultas agrupadas, índices, pool y arranque por versión de esquema | Consultas reales de Supabase; máximo observado 491 ms en la comprobación inicial |
| RNF-03 | Transacciones en una misma conexión; lock de dominio entre instancias; FK e índices únicos | Suite completa ejecutada contra PostgreSQL real aislado |
| RNF-04 | Snapshot consistente, cifrado AES-GCM opcional, restauración transaccional y workflow diario | Recuperación de 30 tablas en otra base PostgreSQL aislada; aproximadamente 2,4 segundos en esa prueba |
| RNF-05 | Portales, formularios etiquetados, estados de error/carga, tablas desplazables y responsive | Navegador escritorio y viewport de 390 px |

## Patrones

- **Observer:** publica eventos en observadores de bandeja familiar y del estudiante; el correo sale de una cola persistida dentro de la transacción de negocio. Un fallo SMTP no revierte una matrícula confirmada.
- **Chain of Responsibility:** validadores deportivos de permiso, pertenencia al nivel, duplicado, límite, horario y capacidad.
- **Decorator:** inscripción base envuelta con los servicios activos para calcular el arancel mensual estimado; administración configura los importes.

## Consideraciones de operación

- La importación histórica recupera cursos que estaban escritos en los legajos pero no existían como entidades. Conserva nivel/año/división; deja turno **A confirmar** y cupo **0** para impedir abrir matrículas con una capacidad inventada. Administración debe completar esos datos.
- Las credenciales demo existentes se conservaron como hashes. La interfaz dejó de publicarlas; no se cargan usuarios ni datos demo al arrancar una base real.
- Configurar SMTP es necesario para enviar correos reales. La bandeja y la cola funcionan aunque el proveedor todavía no esté configurado. Los estudiantes con cuenta vinculada también reciben la publicación de una calificación.
- El workflow de respaldo debe estar en la rama predeterminada y disponer de los secrets `DATABASE_URL` y `BACKUP_KEY`. Hasta configurar y ejecutar ese workflow no se considera activado el respaldo automático.
- El tiempo de recuperación medido corresponde al ensayo local; no demuestra por sí solo un RTO de producción. Hay que ensayar restauración, reconexión y disponibilidad del hosting con sus credenciales y volumen reales.
- La entrega web no incluye una aplicación móvil nativa. El portal es responsive.
- Los archivos entregados se comparten mediante enlaces HTTPS; no se implementó almacenamiento propio de archivos binarios.
- No se incluye cobro electrónico: los aranceles son una estimación de los servicios contratados.
