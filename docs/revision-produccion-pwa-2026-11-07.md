# Revisión de producción — PWA Centro Educativo

Fecha: 2026-11-07  
Rama revisada: `feat/pwa-mobile`  
Base: `main` @ `55f3ebe`  
Alcance: merge a `main`, despliegue en Vercel con PostgreSQL real y datos existentes.  
Los mails reales quedan fuera del alcance funcional, pero se documentan sus riesgos operativos.

## Resultado ejecutivo

La rama **no estaba lista para producción**: la suite de PostgreSQL fallaba al inicializar por un bug real de migración. Se corrigió y ahora pasan las dos bases. Después de las correcciones, la app funciona en SQLite y PostgreSQL, el build de Vercel compila el backend TypeScript y empaqueta `pdfkit` con sus fuentes.

Quedan dos bloqueantes de despliegue que no son errores de código:

1. **Vercel limita el body de una Function a 4,5 MB.** El comprobante viaja en base64 y el límite funcional de 5 MB no entra en ese presupuesto. En Vercel el máximo real ronda los 3,3 MB.
2. **`CRON_SECRET` no está configurado en el proyecto de Vercel.** Los endpoints `/api/jobs/cron/*` responden 503 y los jobs automáticos no corren.

## Verificación ejecutada

| Prueba | Resultado |
| --- | --- |
| `npm test` (SQLite) | 51/51 |
| `npm run test:postgres` (PostgreSQL nativo aislado) | 47/47 |
| `npm run build` | OK |
| `npx playwright test` | 35/35 |
| `npm run format:check` | OK |
| `vercel build --target preview` | OK, función `nodejs22.x` |
| Migración simulada v4 → v7 en PostgreSQL | OK, datos preservados |
| Restauración cifrada de backup PostgreSQL | OK, 30 tablas |

El bundle serverless quedó en ~6,49 MB y las fuentes estándar de PDFKit están incluidas en `.vercel/output/functions/api/index.func`.

## Bugs corregidos durante la revisión

### Crítico — v7 abortaba la transacción en PostgreSQL

`server/core/constraints.ts` ejecutaba `pragma_table_info` (SQLite) también contra PostgreSQL. La consulta fallaba, PostgreSQL marcaba la transacción como abortada y el arranque moría con `25P02 current transaction is aborted`. En producción la app no inicializaba.

Corrección: el pragma se ejecuta solo en SQLite; en PostgreSQL se usa `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`.

Evidencia: `npm run test:postgres` pasó de 0/47 a 47/47.

### Alto — test de migración no era portable

`tests/core.test.ts` consultaba `sqlite_master` también en PostgreSQL. Se cambió a `information_schema.tables` cuando el motor es PostgreSQL.

### Alto — link de recuperación apuntaba a localhost

Si `FRONTEND_URL` no estaba definida, el mail de recuperación generaba `http://localhost:5173/login?token=...`. Ahora usa `FRONTEND_URL`, luego `VERCEL_PROJECT_PRODUCTION_URL`/`VERCEL_URL`, y por último el origen real de la solicitud.

### Medio — adjuntos de mails quedaban para siempre en la base

`notificaciones.archivo_contenido` conservaba cada PDF después de enviado. Ahora se limpia al confirmar el envío; el registro y el estado quedan como historial.

## Riesgos abiertos para producción

### P0 — Subida de comprobantes en Vercel

- Límite de Vercel Functions: **4,5 MB de request body**.
- El archivo se envía como base64: 5 MB binarios → ~6,7 MB de payload.
- Resultado: archivos de más de ~3,3 MB reciben `413 FUNCTION_PAYLOAD_TOO_LARGE` antes de llegar a Express. El mensaje de la app no se muestra porque la Function ni se ejecuta.
- Esto contradice el requisito de aceptar hasta 5 MB.

Opciones:
1. Subida directa a Vercel Blob/S3 desde el cliente y guardar solo la referencia.
2. Despliegue en un servidor Node persistente, donde aplica el límite de 8 MB de Express.
3. Subida por chunks (varias requests de menos de 4,5 MB y reensamblado).
4. Bajar el límite documentado a ~3 MB (no cumple el requisito de 5 MB).

### P0 — Variables de entorno de Vercel

Verificado con `vercel env ls`: el proyecto tiene `DATABASE_URL`, `JWT_SECRET` y `DATABASE_SCHEMA_READY`, pero **no** tiene `CRON_SECRET`, `FRONTEND_URL` ni SMTP.

- Sin `CRON_SECRET`, los cron responden 503 y los avisos no se disparan.
- Sin `FRONTEND_URL`, los links usan el fallback de Vercel/origen; conviene fijarla igual.
- Sin SMTP, los mails quedan en cola (fuera de alcance acordado).

Acciones:
```bash
vercel env add CRON_SECRET production
vercel env add FRONTEND_URL production
```
Y, si se quieren mails reales, cargar `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM`.

### P1 — Cron sin reintentos

Vercel Cron no reintenta una ejecución fallida. El recordatorio de fin de mes solo corre si el día es el último hábil; si esa ejecución falla, no se recupera hasta el mes siguiente. Para producción conviene un job diario idempotente que reintente los períodos pendientes o monitoreo con alerta.

### P1 — Migración v6 y previews

La v6 elimina y recrea las tablas financieras para corregir la FK de `pagos_comprobantes`. Si un entorno ya aplicó v5 con datos, la v6 los pierde. La producción actual está en v4 y la simulación v4 → v7 pasó sin pérdida; el riesgo aplica a previews o bases que hayan corrido una versión intermedia de la rama.

Antes de desplegar: verificar `SELECT MAX(version) FROM schema_migrations` en cada entorno y hacer backup.

### P1 — Respuestas grandes sin paginación

Vercel también limita la **respuesta** a 4,5 MB. `GET /api/facturas` (admin), `GET /api/deuda/alumno/:id`, `GET /api/reportes/pagos-completos` y `pagos-incompletos` cargan todo en memoria y no paginan. Con varios años de facturación pueden superar el límite o degradar performance. Conviene paginar o filtrar por período por defecto.

### P1 — Operación financiera incompleta

No hay endpoint para editar, anular o corregir una factura, ni para revertir un recibo aprobado. Un error de facturación o una aprobación equivocada requiere intervención manual en la base. Para producción real hace falta un flujo de nota de crédito/anulación o, como mínimo, un procedimiento documentado.

### P2 — Facturación y matrícula

`generateMonthlyInvoices` factura a todo alumno con `estado = 'activo'`, sin verificar que tenga matrícula activa del ciclo. Un alumno activo pero no matriculado puede recibir la cuota base. Revisar la regla de negocio antes de facturar masivamente.

### P2 — Fechas de reportes

`pagos-completos`/`pagos-incompletos` filtran por `fecha_emision`, no por `periodo`. Si se genera un período atrasado, la factura cae en el rango de la fecha de generación, no en el período facturado.

### P2 — RLS y rol de base

Las tablas nuevas habilitan RLS. Funciona con el usuario dueño (como en las pruebas), pero si producción usa un rol no dueño sin políticas RLS, las consultas fallan. Verificar el rol de `DATABASE_URL`.

### P2 — Archivos de comprobantes en la base

`pagos_comprobantes.archivo_contenido` guarda el archivo base64 en PostgreSQL. Para muchos comprobantes de varios MB, la base y los backups crecen rápido. A futuro conviene object storage.

### P3 — PDFKit en Vercel

El build incluye las fuentes estándar y el bundle compila. No se ejecutó la Function real en Vercel; antes de producción conviene probar en un preview: descargar factura, recibo y generar un PDF desde el job.

### P3 — Warning de Vercel

`vercel build` emitió `PATH TO REGEXP ERROR` sobre el rewrite con `:path*`, aunque generó la ruta correcta (`/api?path=$1`). Es un warning del CLI, no un fallo de build; monitorear el primer deploy.

## Checklist de despliegue

- [ ] Backup de PostgreSQL y verificación de `MAX(version)` en producción y previews.
- [ ] Configurar `CRON_SECRET` y `FRONTEND_URL` en Vercel.
- [ ] Confirmar `SEED_DEMO=false`.
- [ ] Decidir estrategia para comprobantes >3,3 MB en Vercel.
- [ ] Probar en preview: login, cuotas, PDF, comprobante, aprobación, recibo, reportes.
- [ ] Probar cron manual con `Authorization: Bearer <CRON_SECRET>`.
- [ ] Revisar `pdfkit` en la Function real.
- [ ] Definir política de corrección/anulación de facturas y recibos.
- [ ] Monitorear duración y tamaño de payload de Functions.
