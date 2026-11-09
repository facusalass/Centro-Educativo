# PWA & Mobile UX Technical Audit Report

> **Target audience:** Autonomous coding agent (`PI` via `gentle-shell`)  
> **Auditor:** Antigravity (Gemini 4 Argon)  
> **Scope:** Read-only deep audit of the PWA configuration, Service Worker lifecycle, standalone mode behavior, mobile navigation, and billing/payment mobile UX.  
> **Note on Proposed Actions:** Every remediation item below is tagged with `[tareas propuestas a critica/revision]` so the implementing agent (`PI`) can critically evaluate, refine, challenge, or adopt the proposed engineering tasks before execution.

---

## 1. Verification of the 3 Previously Reported Issues (and Hidden Technical Nuances)

### 1.1. Service Worker Intercepting `"Ver archivo"` (`/api/comprobantes/:id/archivo`) — CONFIRMED (Critical)

- **Evidence & Exact Locations:**
  - `src/components/management/PaymentProofsQueue.tsx:76-78` renders:
    `<a href={\`/api/comprobantes/${c.id}/archivo\`} target="_blank" rel="noreferrer">Ver archivo</a>`
  - `vite.config.ts:33-35` configures Workbox with:
    `workbox: { navigateFallback: '/index.html' }`
    and **omits** `navigateFallbackDenylist`.
  - Generated `dist/sw.js` registers a `NavigationRoute` bound to `/index.html` with default `allowlist: [/./]` and `denylist: []`, paired with `skipWaiting()` and `clientsClaim()`.
- **Root Cause & Hidden Nuances:**
  1. Opening `<a target="_blank">` triggers a top-level document navigation (`request.mode === 'navigate'`) to `/api/comprobantes/:id/archivo`.
  2. Once the Service Worker is active in the browser, it intercepts this navigation before it reaches Express (`server/index.js`) or Vercel rewrites (`vercel.json`) and serves the precached `/index.html`.
  3. The client-side router in `src/App.tsx:29-50` (`Routes`) evaluates `window.location.pathname` (`/api/comprobantes/:id/archivo`), fails to match `/`, `/login`, or `/admin`, and renders `<NotFoundPage />` (`"Error 404 — Página no encontrada"`).
  4. **Standalone / New-Tab Dead End:** In `src/pages/NotFoundPage.tsx:18`, the `"Volver atrás"` button calls `window.history.back()`. Because `"Ver archivo"` opened in a new tab (`target="_blank"`), `window.history.length === 1`, making the back button a dead no-op.
  5. **Why E2E Tests Missed It:** `tests/browser/facturacion.spec.ts:320-327` never clicked the anchor in the browser; instead, it extracted `href` and called `page.request.get(href!)` via Playwright's Node HTTP client, completely bypassing the browser Service Worker.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Exclude `/api/*` from Workbox navigation fallback in `vite.config.ts:33-35`:** Add `navigateFallbackDenylist: [/^\/api(?:\/|$)/]` inside the `workbox` configuration block so top-level navigations to `/api/...` always hit the network/backend.
- `[tareas propuestas a critica/revision]` **Harden `NotFoundPage.tsx:18` for standalone/new-tab contexts:** If `window.history.length <= 1`, fall back to navigating to `'/'` or `'/login'` instead of calling a no-op `window.history.back()`.
- `[tareas propuestas a critica/revision]` **Add a real browser navigation assertion in `tests/browser/pwa.spec.ts` or `tests/browser/facturacion.spec.ts`:** Verify that navigating a browser tab to `/api/comprobantes/:id/archivo` with an active Service Worker serves the binary asset (`content-type: image/*` or `application/pdf`) rather than the SPA `NotFoundPage`.

---

### 1.2. Missing Operational Controls in `/admin` for `generar-periodo` and Monthly Notices — CONFIRMED (Compounded by 2 Backend/Deployment Gaps)

- **Evidence & Exact Locations:**
  - Backend endpoints exist and are wired:
    - `POST /api/facturas/generar-periodo` (`server/core/billing.ts:160-167`)
    - `POST /api/jobs/recordatorio-fin-mes` (`server/core/billing-jobs.ts:80-87`)
    - `POST /api/jobs/aviso-deuda-dia-20` (`server/core/billing-jobs.ts:88-95`)
    - `POST /api/admin/notificaciones/reintentar` (`server/core/notification-routes.ts:23-25`)
  - Frontend `src/services/api.ts:206-210` defines `api.generarPeriodo`, which is **dead code** (never referenced anywhere in `src/`). No frontend client methods exist for the `/api/jobs/*` endpoints.
  - `src/pages/ManagementPage.tsx:33-41,66-109` has no UI section or action buttons to emit a billing period (`YYYY-MM`) or trigger monthly reminders.
- **Hidden Nuances:**
  1. **Zero Scheduled Execution on Vercel:** `server/start.js:17` guards `node-cron` registration behind `if (!process.env.VERCEL && process.env.NODE_ENV !== 'test')`, `api/index.js` imports `server/index.js` (not `server/start.js`), and `vercel.json:1-15` declares no `"crons"` configuration. In a Vercel deployment, neither cron jobs nor an Admin UI exist to run billing operations.
  2. **`runRecordatorioFinMes` Does Not Generate Missing Invoices (`server/core/billing-jobs.ts:22-25,69-71`):** Unlike what `docs/PLAN_DE_TRABAJO_PWA.md:138` states (*"Ensures period invoices exist and sends end-of-month email"*), `runRecordatorioFinMes` only queries existing rows in `facturas` (`facturasConSaldo`) and **never calls `generateMonthlyInvoices(periodo)`**. Even when `node-cron` runs on a persistent server (`server/start.js:23-33`), if nobody manually invoked `POST /api/facturas/generar-periodo` beforehand, the end-of-month job finds `0` invoices and queues `0` notifications.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Add client methods in `src/services/api.ts` and an operational billing toolbar/panel in `src/pages/ManagementPage.tsx` (or inside `PaymentProofsQueue.tsx`):** Allow `admin` users to select a `YYYY-MM` period (`<input type="month">`), trigger `POST /api/facturas/generar-periodo`, and manually trigger `POST /api/jobs/recordatorio-fin-mes` and `POST /api/jobs/aviso-deuda-dia-20` with clear loading/pending states and result summaries (e.g., created invoices count, skipped count, queued notifications count).
- `[tareas propuestas a critica/revision]` **Ensure `runRecordatorioFinMes` in `server/core/billing-jobs.ts:69-79` guarantees period invoice generation before querying balances:** Call `await generateMonthlyInvoices(db, p)` (which is already idempotent per `(alumno_id, periodo)`) at the start of `runRecordatorioFinMes` so automated or manual end-of-month runs cannot silently email zero families due to ungenerated periods.

---

### 1.3. `window.location.reload()` in `StudentFeesPanel` + Missing Mobile Navigation Bar for `docente` and `personal` at `< 900px` — CONFIRMED (High / Blocker on Mobile)

- **Evidence & Exact Locations — Part A (`reload()`):**
  - `src/components/portal/StudentFeesPanel.tsx:196`:
    `<UploadComprobante facturaId={f.id} onSubido={() => window.location.reload()} />` (called at line `269`).
  - `src/pages/PortalPage.tsx:30`: `const [tab, setTab] = useState('inicio')` is stored solely in ephemeral component state.
  - **Impact:** Uploading a payment proof triggers a full browser reload of `/login`, which flashes `"Comprobando sesión…"`, resets `tab` back to `'inicio'` (`EnrollmentPanel`), resets the selected child (`alumnoId`) back to `hijos[0]` (`StudentFeesPanel.tsx:77`), wipes active status/date filters (`filtro`, `desde`, `hasta`), and displays **zero confirmation feedback** that the upload succeeded.
- **Evidence & Exact Locations — Part B (Mobile Navigation Blackout at `< 900px`):**
  - `src/components/portal/mobile.css:14-17`:
    `@media (max-width: 899px) { .portal-desktop-tabs { display: none; } }` hides the horizontal top navigation bar (`src/pages/PortalPage.tsx:86`) for **every** role.
  - `src/pages/PortalPage.tsx:56-73`: `mobileTabs` is populated **only** when `user.rol === 'padre'` or `user.rol === 'alumno'`. For `docente`, `personal`, and `admin`, `mobileTabs` is `[]`, so `<nav className="portal-mobile-nav">` (`PortalPage.tsx:161`) is not rendered at all.
  - **Impact at `< 900px`:**
    - A `docente` user is trapped on `DocenteDashboard` (`tab === 'inicio'`) and **cannot navigate to `Asistencias`, `Evaluaciones` (creating exams/loading grades), `Novedades`, or `Mi cuenta` (`PasswordForm`)**.
    - A `personal` user sees `"Consultá las evaluaciones y novedades desde las secciones del portal."` (`PortalPage.tsx:120`) while every navigation control is `display: none`.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Replace `window.location.reload()` in `src/components/portal/StudentFeesPanel.tsx:196` with an in-place data re-fetch callback:** Extract the `Promise.all` fetch logic (`StudentFeesPanel.tsx:82-111`) into a reusable `cargarDatos()` callback (or increment a `refreshKey` state), preserve `alumnoId` and filters, reset the `UploadComprobante` form inputs, and display a clear success `<Feedback>` message upon upload completion.
- `[tareas propuestas a critica/revision]` **Persist or sync the active `tab` in `src/pages/PortalPage.tsx:30`:** Synchronize `tab` with ` URLSearchParams` / `window.location.hash` or `sessionStorage` so accidental refreshes in standalone PWA mode do not kick the user back to `inicio`.
- `[tareas propuestas a critica/revision]` **Define `mobileTabs` for `docente` and `personal` (or fallback for all authenticated portal roles) in `src/pages/PortalPage.tsx:56-73`:**
  - For `docente`: include `inicio` (`Mi actividad`), `asistencias` (`Asistencias`), `evaluaciones` (`Evaluaciones`), `novedades` (`Novedades`), and `seguridad` (`Cuenta`) with distinct Lucide icons.
  - For `personal`: include `inicio`, `novedades`, and `seguridad` (and remove `evaluaciones`/`cuotas` from `tabs` in `PortalPage.tsx:47-48` for `personal` since lines `129` and `135` only render `"Tu perfil no tiene ... asignadas"`).

---

## 2. Newly Discovered PWA & Mobile UX Bugs

### 2.1. Standalone PWA `start_url: '/'` Opens the Marketing Brochure Instead of the Portal, and Mobile Header (`<= 760px`) Hides the Login CTA (`BLOCKER`)

- **Locations:**
  - `vite.config.ts:17` (`start_url: '/'`)
  - `src/App.tsx:52-72` (`/` renders the 12-section public landing page even when `educar_session` is active)
  - `src/styles/global.css:2164-2166` (`.header-actions .btn { display: none; }` inside `@media (max-width: 760px)`)
  - `src/components/Header.tsx:5-13,37-65`
  - `src/components/PortalShell.tsx:22-28`
- **Problem:**
  1. Launching the installed PWA from the device home screen opens `'/'` (the institutional marketing landing page) rather than `'/login'` (`PortalPage` / `LoginPage`).
  2. On mobile viewports (`<= 760px`), `.header-actions .btn { display: none; }` hides the `"Acceso Comunidad"` button (`Header.tsx:37-44`), while the mobile hamburger menu (`navItems` in `Header.tsx:5-13,56-65`) only contains landing-page section anchors and `"Panel"` (`/admin`, which rejects non-admin users). A parent, student, or teacher launching the installed PWA on a phone has **no visible link in the header or mobile drawer to enter `/login` (Mi Portal)** and must scroll all the way down to the footer (`Footer.tsx:33`).
  3. Inside `PortalShell.tsx:22-28`, clicking `"< Sitio institucional"` (`href="/"`) exits the portal into the marketing page, and clicking `"Mi portal"` (`href="/login"`) triggers a full MPA navigation that resets `PortalPage`'s `tab` state back to `'inicio'`.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Include a prominent `"Acceso Comunidad"` / `"Mi Portal"` entry inside the mobile navigation drawer in `src/components/Header.tsx:56-65`:** Ensure mobile users on `'/'` at `<= 760px` can always reach `/login` (and `/admin` when `user?.rol === 'admin'`).
- `[tareas propuestas a critica/revision]` **Evaluate setting `start_url: '/login'` in `vite.config.ts:17` (or redirecting standalone launches with an active session to `/login`):** Ensure launching the installed PWA from the home screen takes community users directly into the portal login/dashboard flow, while updating `tests/browser/pwa.spec.ts` if `start_url` assertions exist.
- `[tareas propuestas a critica/revision]` **Prevent `"Mi portal"` (`src/components/PortalShell.tsx:26-28`) from causing a full page reload when already on `/login`:** Use client-side navigation or avoid reloading when `window.location.pathname === '/login'`.

---

### 2.2. `alumno` Role Exposes a `"Cuotas"` Tab in Desktop & Mobile Navigation That Always Fails with HTTP `403` (`HIGH`)

- **Locations:**
  - `src/pages/PortalPage.tsx:47` (`tabs.cuotas = 'Cuotas'` unconditionally for all roles)
  - `src/pages/PortalPage.tsx:65-72` (`mobileTabs` for `user.rol === 'alumno'` includes `{ key: 'cuotas', label: 'Cuotas', icon: GraduationCap }`)
  - `src/pages/PortalPage.tsx:126-127` (mounts `<StudentFeesPanel alumnoIdFijo={user.referencia_id} />` for `alumno`)
  - `server/core/billing.ts:170-174,229-233` & `server/core/security.ts:238-281`
- **Problem:**
  - Per domain security rules (`RF-01.5` / `HU-06`), `GET /api/facturas` and `GET /api/pagos/alumno/:id` only authorize `admin` and `padre` (`403` for `alumno`).
  - When a logged-in `alumno` taps `"Cuotas"` in the mobile bottom bar or desktop tabs, `StudentFeesPanel` immediately fires those requests and renders a red `role="alert"` error (`"Tu perfil no tiene permiso para esta operación."`) above empty state cards.
  - Additionally, in `src/pages/PortalPage.tsx:60-61,68-69`, both `"Cuotas"` and `"Evaluaciones"` use the exact same `GraduationCap` icon in the mobile bottom bar.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Remove `cuotas` from `tabs` and `mobileTabs` for non-`padre` roles in `src/pages/PortalPage.tsx:40-73,123-130`:** Only expose `"Cuotas"` in the portal to `user.rol === 'padre'` (unless business requirements explicitly want read-only student access, which would require authorizing `alumno` on `GET /api/facturas` and `GET /api/pagos/alumno/:id` in `server/core/billing.ts` while hiding `UploadComprobante`).
- `[tareas propuestas a critica/revision]` **Use a distinct Lucide icon (e.g., `Receipt`, `CreditCard`, or `Wallet`) for `"Cuotas"` in `src/pages/PortalPage.tsx:60`:** Differentiate `"Cuotas"` from `"Evaluaciones"` (`GraduationCap`) in the mobile navigation bar.

---

### 2.3. PDF Download (`descargarPdf`) Fails on iOS Safari / Standalone WebKit & Leaks Unhandled Promise Rejections (`HIGH`)

- **Locations:**
  - `src/components/portal/StudentFeesPanel.tsx:49-57` (`descargarPdf`)
  - `src/components/portal/StudentFeesPanel.tsx:195,206` (`onClick={() => void descargarPdf(...)}`)
  - Compare with `src/components/ReportesViewer.tsx:124-130`
- **Problem:**
  1. `descargarPdf` creates an `<a>` element that is never appended to `document.body`, calls `a.click()`, and calls `URL.revokeObjectURL(url)` **synchronously on the very next line (`56`)**. On iOS Safari, standalone WebKit PWAs, and Firefox, revoking the object URL synchronously aborts the blob stream before the browser download manager can read it. (Note: `src/components/ReportesViewer.tsx:124-130` already solved this with `document.body.append(link)` + `setTimeout(() => URL.revokeObjectURL(url), 1000)`).
  2. Both call sites (`lines 195, 206`) invoke `void descargarPdf(...)` with no `try/catch`, turning network/offline/500 errors into unhandled Promise rejections with zero UI feedback.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Fix `descargarPdf` in `src/components/portal/StudentFeesPanel.tsx:49-57` and wrap call sites with error feedback:** Append the temporary `<a>` to `document.body`, remove it after `a.click()`, delay `URL.revokeObjectURL(url)` with `setTimeout(..., 1000)` (matching `ReportesViewer.tsx:124-130`), and catch errors in `StudentFeesPanel` so `setError((e as Error).message)` displays a visible `<Feedback error>` alert if the download fails.

---

### 2.4. `"Imprimir"` Button in `StudentFeesPanel` Prints a 100% Blank White Sheet (`HIGH`)

- **Locations:**
  - `src/components/portal/StudentFeesPanel.tsx:166` (`<button type="button" onClick={() => window.print()}>Imprimir</button>`)
  - `src/styles/global.css:2521-2528`
- **Problem:**
  - `src/styles/global.css:2521-2528` defines a global `@media print` rule that sets `body * { visibility: hidden; }` and only makes `#printable-report, #printable-report * { visibility: visible; }`.
  - `#printable-report` only exists in `src/components/ReportesViewer.tsx:415`. Clicking `"Imprimir"` inside `StudentFeesPanel` hides the entire DOM and outputs a completely blank page.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Assign `id="printable-report"` (or a shared `.printable-area` class included in `@media print` in `src/styles/global.css:2521-2528`) to the billing content wrapper in `src/components/portal/StudentFeesPanel.tsx:140`:** Hide interactive filter/upload controls during print (`@media print`) while keeping the student's invoices, debt breakdown, and receipts visible.

---

### 2.5. Broken Mobile Payment Proof Flow (`UploadComprobante`), Duplicate `en_revision` Submissions & Missing Parent Notifications (`HIGH`)

- **Locations:**
  - `src/components/portal/StudentFeesPanel.tsx:184-198,216-226,234-292` (`UploadComprobante`)
  - `server/core/payments.ts:77-84,123-176`
  - `src/components/management/PaymentProofsQueue.tsx:66-96`
- **Problem:**
  1. **Renders on already-paid invoices & fires N+1 requests:** `<UploadComprobante>` is mounted unconditionally on every invoice in `visibles` (`StudentFeesPanel.tsx:184-198`), including invoices with `estado === 'pagada'`, firing `GET /api/facturas/:id` for every invoice on mount (`line 241`).
  2. **Selectable paid/`en_revision` items & duplicate submissions:** `UploadComprobante` (`lines 277-286`) renders enabled checkboxes for all items, including those already `pagado` (`saldo 0.00`) or `en_revision`. Furthermore, `server/core/payments.ts:77-84` checks `it.estado !== 'pagado'` but **does not reject `it.estado === 'en_revision'`**, allowing a parent to submit two proofs for the same concept; when Admin approves the second proof, `payments.ts:156` throws `400 'El pago supera el concepto.'`.
  3. **No submit button lock (`submitting` state):** In `StudentFeesPanel.tsx:289`, `"Subir comprobante"` stays enabled while reading/encoding up to 5 MB into Base64 and POSTing over mobile networks, inviting double-tap duplicate submissions.
  4. **Incomplete payment history & missing notifications:** `StudentFeesPanel.tsx:216-226` only renders `comprobantes` whose `estado === 'rechazado'` (hiding `en_revision` and `aprobado` items and providing no link to view the uploaded file). In addition, `PUT /api/admin/comprobantes/:id/validar` (`server/core/payments.ts:123-176`) never inserts a notification or queues an email to the parent upon approval or rejection (contrary to `RF-03.6`), and `PaymentProofsQueue.tsx:66-96` omits `c.referencia_transferencia` from the Admin review card.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Guard `UploadComprobante` in `src/components/portal/StudentFeesPanel.tsx:184-198,234-292`:** Only render `UploadComprobante` when `f.saldo_pendiente > 0` and `['pendiente', 'parcial', 'vencida'].includes(f.estado)`; filter or disable items where `it.estado === 'pagado' || it.estado === 'en_revision'` or `it.monto - it.monto_pagado <= 0`; and add a `subiendo` boolean state to disable the button (`"Subiendo…"`) during submission.
- `[tareas propuestas a critica/revision]` **Reject items already `en_revision` in `server/core/payments.ts:77-84`:** Ensure the backend validates that none of the selected `item_ids` are currently in `en_revision` (or `pagado`) before inserting a new `pagos_comprobantes` record.
- `[tareas propuestas a critica/revision]` **Display full `comprobantes` status list in `src/components/portal/StudentFeesPanel.tsx:216-226` and surface `referencia_transferencia` in `src/components/management/PaymentProofsQueue.tsx:66-96`:** Show `en_revision`, `aprobado`, and `rechazado` proofs to the parent (with a link to `/api/comprobantes/:id/archivo`), and show `c.referencia_transferencia` in the Admin validation queue.
- `[tareas propuestas a critica/revision]` **Emit an in-app notification / email outbox entry in `server/core/payments.ts:123-176` when Admin approves or rejects a payment proof:** Notify the parent (`usuario_id`) when their proof transitions to `aprobado` (with receipt number) or `rechazado` (with `motivo_rechazo`).

---

### 2.6. `env(safe-area-inset-bottom)` Inert on iOS Standalone PWAs + Missing `apple-touch-icon` (`MEDIUM`)

- **Locations:**
  - `src/components/portal/mobile.css:30` (`padding-bottom: env(safe-area-inset-bottom, 0px);`)
  - `index.html:4-12`
  - `public/icons/pwa-192.png`, `public/icons/pwa-512.png`, `public/icons/pwa-maskable-512.png`
- **Problem:**
  1. `index.html:5` declares `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` **without `viewport-fit=cover`**. On iOS standalone PWAs, WebKit evaluates `env(safe-area-inset-bottom)` to `0px` unless `viewport-fit=cover` is present, causing `.portal-mobile-nav` buttons to collide with the iPhone Home Indicator bar.
  2. `index.html` lacks `<link rel="apple-touch-icon" href="/icons/pwa-maskable-512.png" />` (or a dedicated opaque 180×180 icon). Because `pwa-192.png` and `pwa-512.png` have transparent rounded corners, iOS fills their transparent corners with solid black on the home screen.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Update `index.html:5-11` with `viewport-fit=cover` and `<link rel="apple-touch-icon">`:** Change the viewport meta tag to `content="width=device-width, initial-scale=1.0, viewport-fit=cover"` and point `apple-touch-icon` to an opaque square icon (such as `/icons/pwa-maskable-512.png`).

---

### 2.7. Misleading Offline Session Drop, Sticky Error State in `Notifications.tsx` & Missing Offline Indicator (`MEDIUM`)

- **Locations:**
  - `src/services/session.tsx:16-38` (`SessionProvider`)
  - `src/components/Notifications.tsx:9-12`
  - `vite.config.ts:31-35`
- **Problem:**
  1. **Offline launch looks like a forced logout:** In `src/services/session.tsx:16-25`, any network failure (`ApiError` with `status === 0`) on `GET /api/auth/me` falls into `.catch(() => setUser(null))`, rendering `<LoginPage />` with no offline warning. If the user is already inside the app and taps `"Cerrar sesión"` while offline (`session.tsx:34-37`), `await api.logout()` throws before `setUser(null)` can run.
  2. **Sticky error alert in `Notifications.tsx`:** In `src/components/Notifications.tsx:9-12`, the 30-second polling function `load()` sets `setError(e.message)` on failure but **never calls `setError('')` before or after a successful fetch**. A single momentary mobile network drop leaves the red error alert permanently pinned on screen even after subsequent 30s polls succeed.
  3. **No network status banner or install prompt helper:** There is no `navigator.onLine` / `online` / `offline` banner in `PortalShell.tsx` and no `beforeinstallprompt` / iOS install hint in the portal.

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Clear `setError('')` on successful poll in `src/components/Notifications.tsx:9-12`:** Reset the error state whenever `api.getNotifications()` resolves so transient mobile connectivity drops self-heal on the next poll.
- `[tareas propuestas a critica/revision]` **Distinguish network errors (`status === 0` / `!navigator.onLine`) from HTTP `401` in `src/services/session.tsx:16-38` and add an offline banner in `src/components/PortalShell.tsx`:** Surface a clear `"Sin conexión a internet"` banner using `online`/`offline` window events instead of silently dropping the user onto `LoginPage` with no explanation, and ensure `logout()` handles offline/network errors gracefully.
- `[tareas propuestas a critica/revision]` **Replace `window.location.assign('/login')` with `window.location.replace('/login')` in `src/services/session.tsx:36` and `src/components/portal/PasswordForm.tsx:19`:** Prevent stacking redundant `/login` entries in the mobile back-button history stack.

---

### 2.8. Admin Numeric Input Validation (`min="1"`, Default `step="1"`) Blocks Editing `0` Fallback Rates in `EntityManager` (`MEDIUM — Impacts Billing Setup During Testing`)

- **Locations:**
  - `src/components/EntityManager.tsx:201` (`min={field.type === 'number' ? 1 : undefined}`)
  - `src/data/entity-definitions.ts:56,147,178` (`tarifas.monto`, `deportes.arancel_mensual`, `recorridos.arancel_mensual`)
  - `server/core/fees.ts:38-46`
- **Problem:**
  - In `server/core/fees.ts:38-46`, `arancel_mensual === 0` on a sport (`deportes`) or transport route (`recorridos`) has domain meaning: *"use the flat fallback rate from `tarifas`"*, and the database schema defaults `arancel_mensual` to `0`.
  - Because `EntityManager.tsx:201` hardcodes `min={1}` (and omits `step="any"` / `step="0.01"`) on every `field.type === 'number'` input, HTML5 form validation blocks an Admin from editing any existing sport/route whose `arancel_mensual` is `0`, resetting a custom rate back to `0`, or entering decimal centavos (`0.50`).

#### Recommended Actions
- `[tareas propuestas a critica/revision]` **Allow `min="0"` and decimal steps on monetary/rate fields in `src/components/EntityManager.tsx:201` (or via per-field metadata in `src/data/entity-definitions.ts`):** Support `0` for `arancel_mensual` fallback rates and `step="0.01"` for currency fields while keeping `min={1}` only for strictly positive integer fields like `cupo` or `anio`.
