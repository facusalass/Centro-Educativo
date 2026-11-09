# Vercel & Supabase (PostgreSQL) Deployment Diagnostic & Integration Plan (`feat/pwa-mobile` -> `main`)

> **Target audience:** Autonomous coding agent (`PI` via `gentle-shell`)  
> **Scope:** Pre-merge and pre-deploy technical audit for merging `feat/pwa-mobile` (`8c52829`) into `main` (`55f3ebe`) and running in production on **Vercel Serverless Functions** + **Supabase (PostgreSQL)**.  
> **Convention:** All proposed engineering remediation steps carry the tag `[accion recomendada sujeta a revision]`.

---

## 1. Git Merge Baseline (`feat/pwa-mobile` -> `main`)

- **Verified status:** `main` and `origin/main` are at commit `55f3ebe` (`0` commits ahead of the branch point). `feat/pwa-mobile` is 13 commits ahead (`f83c163..8c52829`).
- **Merge conflict check:** `git merge-tree` confirms a **100% clean fast-forward merge with zero file conflicts**.
- **PostgreSQL transaction binding:** `transaction` in `server/database.js:168-184` uses `AsyncLocalStorage` (`transactionContext` at `server/database.js:34-36`) to bind a dedicated `pool.connect()` client and `SELECT pg_advisory_xact_lock(1902027)` across nested `db.run`/`db.get`/`db.all`/`db.insert` calls. This is compatible with both Supabase Session Mode (`:5432`) and Supavisor Transaction Mode (`:6543`).

---

## 2. Prioritized Findings & Remediation Plan

### 2.1. `[CRITICAL]` PostgreSQL Transaction Poisoning (`25P02`) in Migration v7 Crashes Cold Start on Supabase

- **Location:** `migrateConstraints` in `server/core/constraints.ts:253-281`
- **Evidence:**
  - Lines `253-255` execute inside an open PostgreSQL `BEGIN` block:
    ```ts
    const cols = await db.all('SELECT name FROM pragma_table_info(?)', ['notificaciones']).catch(() => []);
    ```
  - Line `268` only checks `if (databaseMode === 'postgres')` **after** line `255` has already executed against PostgreSQL.
- **Root Cause:**
  - `pragma_table_info` does not exist in PostgreSQL (`ERROR 42883`).
  - Catching the rejected Promise in JavaScript (`.catch(() => [])`) does **not** clear PostgreSQL's aborted transaction state. PostgreSQL immediately transitions the transaction to `25P02` (`current transaction is aborted, commands ignored until end of transaction block`), causing line `269` (`ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS ...`) to fail and rolling back `initializeDatabase` (`server/database.js:254-276`) on every request.
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Branch on `databaseMode === 'postgres'` BEFORE querying `pragma_table_info` in `server/core/constraints.ts:254-276`:** Execute `ALTER TABLE notificaciones ADD COLUMN IF NOT EXISTS ...` directly when `databaseMode === 'postgres'`, and only run the `pragma_table_info` inspection inside the `else` (SQLite) branch (or use `db.hasColumn` from `server/database.js:140-153`).

---

### 2.2. `[HIGH]` Stale Serverless Cold-Start Version Gate (`>= 5` Instead of `>= 7`)

- **Location:** `initializeDatabase` in `server/database.js:254-265`
- **Evidence:**
  - Line `259` checks:
    ```js
    Number((await get('SELECT MAX(version) AS version FROM schema_migrations'))?.version) >= 5
    ```
  - However, `migrateConstraints` in `server/core/constraints.ts:190-281` defines **Migration v6** (`lines 190-252`) and **Migration v7** (`lines 253-281`).
- **Root Cause:**
  - In production on Vercel (`SEED_DEMO !== 'true'`), any database already at `version = 5` or `version = 6` will short-circuit on line `260` and **never apply Migrations v6 or v7**.
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Update the version gate in `server/database.js:259` from `>= 5` to `>= 7` (or export a `LATEST_MIGRATION_VERSION = 7` constant shared with `server/core/constraints.ts`):** Ensure cold starts always verify that all migrations up to `v7` have been applied.

---

### 2.3. `[HIGH]` Broken PostgreSQL Test Suite (`npm run test:postgres`) Due to Unconditional `sqlite_master` Query

- **Locations:**
  - `tests/core.test.ts:965-970`
  - `scripts/test-postgres.mjs:31-39`
- **Evidence:**
  - `tests/core.test.ts:966` executes `SELECT name FROM sqlite_master WHERE type = ? AND name = ?` unconditionally to verify the 7 new tables created by Migration v5.
  - Because `scripts/test-postgres.mjs` runs `tests/core.test.ts` against an `embedded-postgres` instance, this test throws `42P01: relation "sqlite_master" does not exist` in PostgreSQL mode.
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Make the table-existence query in `tests/core.test.ts:965-970` dual-engine compatible:** Query `information_schema.tables WHERE table_schema = 'public' AND table_name = ?` when `databaseMode === 'postgres'` and `sqlite_master` when `databaseMode === 'sqlite'`, then run `npm run test:postgres` to verify all 49 core tests pass against real PostgreSQL.

---

### 2.4. `[HIGH]` Backup, Restore, and SQLite-to-Postgres Migration Scripts Omit All 7 Part-3 Tables

- **Locations:**
  - `schoolTables` in `scripts/backup-lib.mjs:3-34`
  - `tables` in `scripts/migrate-sqlite-to-postgres.js:20-45`
  - `.github/workflows/respaldo.yml`
- **Root Cause:**
  - Neither `schoolTables` nor `tables` includes `password_resets`, `facturas`, `factura_items`, `pagos_comprobantes`, `pago_comprobante_items`, `recibos`, or `avisos_facturacion_log`.
  - Consequently, encrypted Supabase backups (`npm run db:backup` in `.github/workflows/respaldo.yml`) silently **omit all billing, payment proof, and receipt data**, and `restoreSnapshot` (`scripts/backup-lib.mjs:102`) runs `TRUNCATE ... RESTART IDENTITY CASCADE` on `usuarios_acceso` and `alumnos`, which **wipes all rows in `facturas`, `pagos_comprobantes`, and `recibos`** without restoring them.
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Add the 7 Part-3 tables in FK dependency order (`password_resets`, `facturas`, `factura_items`, `pagos_comprobantes`, `pago_comprobante_items`, `recibos`, `avisos_facturacion_log`) to `schoolTables` in `scripts/backup-lib.mjs:3-34` and `tables` in `scripts/migrate-sqlite-to-postgres.js:20-45`:** Verify round-trip snapshot/restore in `npm run test:postgres`.

---

### 2.5. `[HIGH]` Vercel Serverless SMTP Outbox (`waitUntil`) Bypassed on `POST /api/auth/forgot-password` & `localhost` Reset URL Fallback

- **Locations:**
  - `registerCore` in `server/core/routes.ts:15-26`
  - `installSecurity` in `server/core/security.ts:338-376`
- **Root Cause:**
  1. In `server/core/routes.ts:16-26`, `installSecurity(app)` (`line 16`) is mounted **before** the `app.use` middleware (`lines 17-26`) that registers `res.on('finish', () => waitUntil(deliverPending()))`. Because `POST /api/auth/forgot-password` is registered inside `installSecurity(app)` and sends the response via `res.json(...)` without calling `next()`, the `waitUntil` listener is never attached. On Vercel Serverless (where the 30-second interval in `server/start.js:10-13` does not run), password recovery emails remain stuck in `notificaciones` until another mutation endpoint is called.
  2. In `server/core/security.ts:338`, `resetLinkOrigin` falls back to `'http://localhost:5173'` at module load time if `FRONTEND_URL` is not configured in Vercel.
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Register the `res.on('finish')` `waitUntil(deliverPending())` middleware BEFORE `installSecurity(app)` in `server/core/routes.ts:15-26`:** Ensure `/api/auth/forgot-password` triggers asynchronous SMTP delivery on Vercel before the Lambda freezes.
  - `[accion recomendada sujeta a revision]` **Derive the password reset link origin dynamically per request in `server/core/security.ts:338-370`:** Use `(process.env.FRONTEND_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '')` so reset links work on both production and Vercel Preview URLs even when `FRONTEND_URL` is unset.

---

### 2.6. `[HIGH]` Vercel Serverless `4.5 MB` Request Payload Limit vs `5 MB` Base64 Payment Proofs

- **Locations:**
  - `server/index.js:47-51` (`express.json({ limit: '8mb' })`)
  - `server/core/payments.ts:9-40` (`MAX_FILE_BYTES = 5 * 1024 * 1024`)
  - `UploadComprobante` in `src/components/portal/StudentFeesPanel.tsx:248-268`
- **Root Cause:**
  - Vercel Serverless Functions enforce a non-configurable platform ceiling of **4.5 MB** on HTTP request bodies (`413 FUNCTION_PAYLOAD_TOO_LARGE` returned by Vercel's proxy before Express runs).
  - Because `UploadComprobante` encodes the file as Base64 inside JSON (~33% size overhead), any raw file larger than **~3.2 MB** exceeds `4.5 MB` on the wire and is rejected by Vercel with a non-JSON `413` response (which `src/services/http.ts:38` surfaces as *"El servidor devolvió una respuesta no válida"*).
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Enforce a client-side and server-side size guard compatible with Vercel's `4.5 MB` body limit (or compress/resize camera photos client-side before Base64 encoding) in `src/components/portal/StudentFeesPanel.tsx:248-268` and `src/services/http.ts:31-40`:** Validate file size in the UI before upload, map HTTP `413` in `http.ts` to a clear Spanish error message (*"El archivo supera el tamaño máximo permitido por el servidor"*), and optionally downscale phone camera JPEGs via `<canvas>` when they exceed `3 MB` so real mobile photos never hit Vercel's `4.5 MB` wall.

---

### 2.7. `[HIGH]` `node-cron` Never Executes on Vercel Serverless (`api/index.js`) & Missing Admin Billing Controls

- **Locations:**
  - `api/index.js:1-14`
  - `server/start.js:15-50`
  - `server/core/billing-jobs.ts:69-96`
  - `vercel.json:1-14`
  - `src/pages/ManagementPage.tsx`
- **Root Cause:**
  - On Vercel, requests invoke `api/index.js` (which imports `server/index.js`); `server/start.js` is never executed, and serverless containers freeze immediately after each request.
  - Furthermore, `runRecordatorioFinMes` (`server/core/billing-jobs.ts:69-71`) does not call `generateMonthlyInvoices` (`server/core/billing.ts:105-163`) before querying `facturasConSaldo(periodo)`, and there are no buttons in `/admin` (`ManagementPage.tsx`) to generate a billing period or trigger the two email jobs manually.
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Call `await generateMonthlyInvoices(periodo)` inside `runRecordatorioFinMes` in `server/core/billing-jobs.ts:69-71` and add an Admin UI section in `src/pages/ManagementPage.tsx` / `src/components/management/PaymentProofsQueue.tsx`:** Allow `admin` users on Vercel to select a `YYYY-MM` period and trigger `POST /api/facturas/generar-periodo`, `POST /api/jobs/recordatorio-fin-mes`, and `POST /api/jobs/aviso-deuda-dia-20` directly from the UI without needing `node-cron` or browser DevTools.
  - `[accion recomendada sujeta a revision]` **(Optional) Support Vercel Cron in `vercel.json` + `CRON_SECRET` bearer auth in `server/core/security.ts:166-205` and `server/core/billing-jobs.ts:79-96`:** If automated cloud scheduling is desired on Vercel Hobby (which sends `GET` requests with `Authorization: Bearer <CRON_SECRET>`), allow `GET`/`POST` on `/api/jobs/*` when `Authorization: Bearer ${process.env.CRON_SECRET}` matches.

---

### 2.8. `[MEDIUM]` Workbox Service Worker `navigateFallback` Intercepts `/api/comprobantes/:id/archivo` on Vercel HTTPS

- **Locations:**
  - `vite.config.ts:33-35`
  - `src/components/management/PaymentProofsQueue.tsx:76-78`
- **Root Cause:**
  - On Vercel, HTTPS is enabled by default on all deployments, so `sw.js` immediately registers and claims all clients (`skipWaiting` + `clientsClaim`).
  - Because `vite.config.ts:33-35` sets `workbox: { navigateFallback: '/index.html' }` without `navigateFallbackDenylist`, clicking `<a href="/api/comprobantes/${c.id}/archivo" target="_blank">` is intercepted client-side by the Service Worker before reaching Vercel's `/api/:path*` rewrite in `vercel.json:5-8`, rendering `<NotFoundPage />` instead of the file.
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Add `navigateFallbackDenylist: [/^\/api(?:\/|$)/]` to `workbox` in `vite.config.ts:33-35`:** Prevent the Service Worker from intercepting any `/api/*` top-level navigation.

---

### 2.9. `[MEDIUM]` Supabase RLS on `schema_migrations`, PostgreSQL `REAL` (`float4`) Precision & Connection Pool Sizing

- **Locations:**
  - `migrateCore` in `server/core/migrations.ts:8-10`
  - `migrateConstraints` in `server/core/constraints.ts:27-126`
  - `server/database.js:41-48`
- **Root Cause:**
  1. `schema_migrations` (`server/core/migrations.ts:9`) is the only table in `public` where `ALTER TABLE schema_migrations ENABLE ROW LEVEL SECURITY` is never executed in Postgres mode, triggering a Supabase Security Advisor warning.
  2. In PostgreSQL, `REAL` is a 32-bit `float4` (~6-7 significant decimal digits), whereas in SQLite `REAL` is a 64-bit `float8`. Large ARS amounts with centavos (e.g., `125000.50`) can suffer 32-bit float rounding in Postgres when stored as `REAL`. Using `DOUBLE PRECISION` in Postgres (`float8`, OID `701`) preserves 64-bit precision while still being parsed as a JS `number` by `pg`.
  3. `server/database.js:44` defaults `DATABASE_POOL_SIZE` to `5` per process; across multiple concurrent Vercel Serverless instances, `5` connections per instance can exhaust Supabase pool limits if not configured carefully.
- **Recommended Actions:**
  - `[accion recomendada sujeta a revision]` **Enable RLS on `schema_migrations` when `databaseMode === 'postgres'` in `server/core/constraints.ts:268-272`:** Eliminate the remaining Supabase RLS warning in `public`.
  - `[accion recomendada sujeta a revision]` **Use `DOUBLE PRECISION` (or upgrade `REAL` columns via `ALTER COLUMN ... TYPE DOUBLE PRECISION`) on PostgreSQL in `server/core/constraints.ts`:** Match SQLite's 64-bit floating-point precision in PostgreSQL while keeping `pg` return values as JS `number`.
  - `[accion recomendada sujeta a revision]` **Default `DATABASE_POOL_SIZE` to `2` when `process.env.VERCEL` is set in `server/database.js:44`:** Prevent connection exhaustion against Supabase during serverless concurrency spikes.

---

## 3. Required Vercel Environment Variables Checklist

Before deploying `feat/pwa-mobile` (Preview) or `main` (Production) on Vercel, ensure the following environment variables are configured in the Vercel Project Settings:

| Variable | Required | Value / Notes for Vercel + Supabase |
| :--- | :--- | :--- |
| `DATABASE_URL` | **Yes** | Supabase PostgreSQL URI (`?sslmode=require`). Prefer Supavisor pooler URI. |
| `JWT_SECRET` | **Yes** | Random hex string `>= 32` chars (`security.ts:29` throws on boot in production if missing). |
| `FRONTEND_URL` | **Yes** | Production domain (e.g., `https://<project>.vercel.app`, no trailing slash). |
| `DATABASE_POOL_SIZE` | Recommended | `2` (prevents exhausting Supabase max connections across serverless instances). |
| `SEED_DEMO` | Optional | `false` in Production (set to `true` only once if seeding a blank demo database). |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` | Optional | Required only for real email delivery via `waitUntil(deliverPending())`; otherwise notifications remain accessible in the in-app `Novedades` inbox. |

---

## 4. Verification Commands for `PI` Before Opening / Merging the PR

1. `npm test` — Verify all SQLite unit/integration tests pass.
2. `npm run test:postgres` — Verify `initializeDatabase()` (Migrations v1-v7), all 49 integration tests in `tests/core.test.ts`, and `backup-lib.mjs` snapshot/restore pass against real PostgreSQL (`embedded-postgres`).
3. `npm run build` — Verify `tsc && tsc -p tsconfig.server.json && vite build` succeeds and `dist/sw.js` includes `navigateFallbackDenylist: [/^\/api(?:\/|$)/]`.
4. `npm run test:e2e` — Verify the Playwright browser suite passes end-to-end.
