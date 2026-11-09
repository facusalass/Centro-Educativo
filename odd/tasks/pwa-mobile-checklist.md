# Checklist de cierre — PWA mobile (revisión 2026-11-06)

Estado de partida: `feat/pwa-mobile` @ `8c52829` (14 commits sobre `main` `55f3ebe`).
Objetivo: cerrar los faltantes detectados en la revisión sin mergear a `main`.

## Bloqueantes

- [x] Dejar `npm run format:check` en verde.
- [x] Corregir la compuerta de migraciones (`LATEST_SCHEMA_VERSION` en `server/database.js`).
- [x] Programar los jobs de facturación en producción: Vercel Cron + `CRON_SECRET`.

## Funcional

- [x] Hacer que el recordatorio de fin de mes genere el período si no existe.
- [x] Incluir deuda de períodos anteriores en el aviso del día 20.
- [x] Detallar los ítems en el cuerpo de los correos.
- [x] Bloquear un segundo comprobante sobre ítems que ya están `en_revision`.
- [x] Quitar la pestaña “Cuotas” del portal del alumno.
- [x] Detallar los ítems en el PDF del recibo.

## Seguridad y rendimiento

- [x] Evitar devolver `archivo_contenido` (base64) en listados de comprobantes/facturas.
- [x] Validar tamaño y tipo de archivo también en el cliente.
- [x] Redactar el token de recuperación de la cola de correo después de enviarlo.
- [x] Cachear solo GET públicos de la API en el Service Worker.

## Instalabilidad y documentación

- [x] Agregar metadatos/icono para instalación en iOS.
- [x] Documentar `CRON_SECRET`, `BILLING_CRON`, cron de Vercel y límites de la PWA.
- [x] Actualizar `odd/tasks/pwa-mobile.md` con el estado final.

## Verificación

- [x] Agregar tests de regresión para las correcciones.
- [x] `npm test`: 51/51.
- [x] `npm run test:postgres`: 47/47 (incluye migración v4 → v7 y backup/restore).
- [x] `npm run build` limpio.
- [x] `npx playwright test`: 35/35.
- [x] `npm run format:check` en verde.
- [x] `vercel build --target preview` compila la Function y empaqueta PDFKit.
- [x] Pushear `feat/pwa-mobile` sin mergear a `main`.

## Pendientes de infraestructura (no de código)

- [ ] Configurar `CRON_SECRET` y `FRONTEND_URL` en Vercel.
- [ ] Resolver el límite de 4,5 MB de Vercel para comprobantes (el archivo base64 de 5 MB no entra).
- [ ] Probar PDFs y cron en un preview real de Vercel.
- [ ] Definir corrección/anulación de facturas y recibos para producción.
- [ ] Revisar paginación de facturas/reportes antes de acumular varios ciclos.
