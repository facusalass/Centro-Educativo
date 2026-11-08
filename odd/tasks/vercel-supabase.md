# Feature: vercel-supabase-deploy

## Header
Deploy Vercel Serverless + Supabase Postgres para `feat/pwa-mobile` → `main`. Base: docs/VERCEL_SUPABASE_DEPLOY_PLAN.md + verificación explorer mw8ek6fw-2-jxf6 (6 CONFIRMADOS, 1 PARCIAL, 1 YA-RESUELTO, 1 mayormente YA-RESUELTO). Cron automático Vercel queda diferido (opcional del propio plan; triggers manuales ya existen en ManagementPage).

## Specs
- V1 (2.1 CRITICAL): "Branch on databaseMode postgres BEFORE pragma_table_info" (25P02 en cold start Supabase fresco).
- V2 (2.2 HIGH): "version gate >= 5 → >= 7" en server/database.js:259.
- V3 (2.3 HIGH): "dual-engine table-existence query" en tests/core.test.ts:965-970 (information_schema vs sqlite_master).
- V4 (2.4 HIGH): "7 tablas Part-3 en FK order" en backup-lib.mjs + migrate-sqlite-to-postgres.js (password_resets, facturas, factura_items, pagos_comprobantes, pago_comprobante_items, recibos, avisos_facturacion_log).
- V5 (2.5 HIGH): "waitUntil middleware BEFORE installSecurity" en routes.ts + "reset link origin dinámico por request" en security.ts.
- V6 (2.6 HIGH-parcial): "client size guard ~3MB + mapear 413 en http.ts" (sin downscale canvas por ahora).
- V7 (2.7 cron): DIFERIDO — vercel.json crons + CRON_SECRET (superficie auth nueva, opcional del plan; UI manual ya cubre demo).
- V8 (2.8): YA-RESUELTO en Fase A (denylist presente).
- V9 (2.9 MEDIUM): "RLS schema_migrations + DOUBLE PRECISION en Postgres + pool 2 con VERCEL".

## Tasks
- [x] V1: pragma branch postgres — inline — commit: 36749db
- [x] V2: version gate >= 8 (v8 DOUBLE PRECISION) — inline — commit: 36749db
- [x] V3: test dual-engine + test:postgres 45/45 — inline — commit: 36749db
- [x] V4: backup + migrate scripts 7 tablas (37 tablas verificadas) — inline — commit: 36749db
- [x] V5: middleware order + origin dinámico — inline — commit: 36749db
- [x] V6: guard 3MB + error 413 — inline — commit: 36749db
- [x] V7: cron DIFERIDO (UI manual cubre; falta CRON_SECRET) — decisión documentada
- [x] V8: YA-RESUELTO en Fase A (e2eb310)
- [x] V9: RLS schema_migrations (v8) + pool 2 con VERCEL — inline — commit: 36749db
- [x] V10: verificación (test 49/49 + test:postgres 45/45 + build + merge-tree limpio) — commit: 36749db

## Log
- L1 (2026-11-08): "Dale seguimos, el archivo del plan de Vercel está en docs/VERCEL_SUPABASE_DEPLOY_PLAN.md, revisalo igual y le mandamos."
