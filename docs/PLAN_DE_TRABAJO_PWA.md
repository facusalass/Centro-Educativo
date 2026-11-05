# WORK PLAN & PROJECT SPECIFICATION
## EDUCATIONAL CENTER "EDUCAR PARA TRANSFORMAR" — PART 3: AI-INTEGRATED MOBILE APPLICATION (PWA)

---

## 1. Problem Statement & Project Objectives

### 1.1. Problem Statement
The private educational center "Educar para Transformar", located on the outskirts of Resistencia, operates an integrated client-server web management system (`main` @ `55f3ebe`) that centralizes academic administration, enrollments (`matriculas`), evaluations, attendance (`asistencias`), and service enrollments (`inscripciones` for sports, transportation, and cafeteria) under role-based access control (`admin`, `docente`, `personal`, `padre`, `alumno`).

However, the current fee module (`server/core/fees.ts` and `tarifas`) has key operational gaps relative to Part 3 requirements:
1. **Flat category rates without service differentiation:** The system only estimates a monthly fee using four flat rates (`base`, `deporte`, `transporte`, `comedor`), without allowing the Administrator to define differentiated prices per individual sport (`deportes`) or per transportation route (`recorridos_transporte`).
2. **No monthly invoice generation, debt tracking, or payment validation workflow:** The system does not emit itemized monthly invoices per student, track invoice/item statuses, or maintain itemized debt history.
3. **Lack of a mobile channel for bank transfer payments:** Since cash is not accepted and all payments are made via bank transfer, parents (`padre`) lack an installable mobile application (PWA) to check pending fees, select specific invoice items to pay, and upload one or more bank transfer proofs per invoice. Students (`alumno`) also lack an installable mobile view to check their active enrollments.
4. **Missing automated email reminders and financial reports:** Administration lacks a web validation queue to approve/reject payment proofs and issue official payment receipts, automated email jobs (last business day of the month with invoice attached, and 20th of the month for overdue debt), and the 5 financial reports required by School Administration.

Therefore, the platform must be extended with a **Progressive Web App (PWA)** built inside the same repository, Express REST API backend, and PostgreSQL/SQLite database, serving the **Parent/Tutor (`padre`)** and **Student (`alumno`)** roles, alongside the Administrative web extensions and scheduled email jobs. Development incorporates **Artificial Intelligence** tools, with the team responsible for analyzing, verifying, adapting, validating, and logging all AI-assisted solutions.

### 1.2. Project Objectives

* **General Objective:** Develop and deploy a Progressive Web App (PWA) integrated into the existing web management system and single database to centralize fee management, monthly billing, bank transfer payments, and cafeteria/sports/transportation queries for parents and students, adding automated email notifications, administrative payment validation, and web financial reports using AI as an engineering support tool.
* **Objective 1 — Mobile PWA for Parents and Students:** Deliver an installable, mobile-first interface where `padre` users view pending/paid fees, select invoice items to pay, upload bank transfer proofs, query invoices/receipts by date range, inspect itemized debt history, and view their children's active enrollments; and where `alumno` users consult their own active enrollments in sports, transportation, and cafeteria.
* **Objective 2 — Differentiated Pricing, Automated Billing & Web Financial Reports:** Equip `admin` users in the web portal with differentiated rate configuration (per sport and per transport route), a payment proof approval/rejection queue with automatic receipt issuance, the 5 financial/payment reports, and automated email reminders on the last business day of the month and the 20th of each month.
* **Objective 3 — Transactional Integrity & Single Source of Truth:** Ensure the PWA and web portal share the same Express REST API and relational schema without duplicating data, enforcing ACID transactions on every payment registration/approval and full audit traceability.

---

## 2. Requirements Specification

### 2.1. Functional Requirements (RF)
Each primary requirement acts as an epic grouping verifiable sub-requirements. **Channel** indicates where each capability runs (`PWA`, `Web`, or `Auto`).

| ID | Sub-requirement | Channel | Priority |
| :--- | :--- | :---: | :---: |
| **RF-01** | **Authentication & Role-Based Access in the Mobile App (Module 1)** | | |
| RF-01.1 | Allow an active `padre` or `alumno` to log in to the PWA using their existing platform credentials (`POST /api/auth/login`). | PWA | Mandatory |
| RF-01.2 | Allow an authenticated user to securely log out of the PWA (`POST /api/auth/logout`). | PWA | Mandatory |
| RF-01.3 | Allow a user to recover their password via a temporary reset link/token sent to their registered email (`POST /api/auth/forgot-password`, `POST /api/auth/reset-password`). | PWA | Mandatory |
| RF-01.4 | Allow a logged-in user to change their password after verifying their current password (`PUT /api/auth/password`). | PWA | Mandatory |
| RF-01.5 | Restrict each user in the PWA to their role's functions: `padre` accesses only their linked children's data (`padre_alumno`), and `alumno` accesses read-only views of their own enrollments and account settings. | PWA | Mandatory |
| **RF-02** | **Differentiated Rates & Monthly Billing** | | |
| RF-02.1 | Allow `admin` to set and update the monthly base tuition fee (`tarifas.tipo = 'base'`). | Web | Mandatory |
| RF-02.2 | Allow `admin` to set and update the differentiated monthly rate for each sport (`deportes.arancel_mensual`). | Web | Mandatory |
| RF-02.3 | Allow `admin` to set and update the differentiated monthly rate for each of the 4 transportation routes (`recorridos_transporte.arancel_mensual`). | Web | Mandatory |
| RF-02.4 | Allow `admin` to set and update the monthly rate for the cafeteria service (`tarifas.tipo = 'comedor'`). | Web | Mandatory |
| RF-02.5 | Automatically generate (and allow `admin` to trigger) one monthly invoice (`facturas`) per active student breaking down active items for that period (`base`, up to 2 `deporte` enrollments, active `transporte` route for that month, and `comedor`) with its due date (`fecha_vencimiento`). The "up to 2 `deporte` enrollments" cap is enforced at enrollment time (D3): the server rejects a third active `deporte` inscription, so invoicing inherits the cap naturally. | Auto / Web | Mandatory |
| **RF-03** | **Fee Management, Bank Transfer Proofs & Receipts (Module 2)** | | |
| RF-03.1 | Allow `padre` to view pending invoices/fees per child showing period, due date, total amount, pending balance (`saldo_pendiente`), and status (`pendiente`, `parcial`, `en_revision`, `vencida`). | PWA | Mandatory |
| RF-03.2 | Allow `padre` to view paid invoices/fees per child with approval date and associated payment receipts (`recibos`). | PWA | Mandatory |
| RF-03.3 | Allow `padre` to view the full payment history per child, including proofs in review (`en_revision`), approved (`aprobado`), and rejected (`rechazado`, displaying `motivo_rechazo`). | PWA | Mandatory |
| RF-03.4 | Allow `padre` to select specific pending invoice items (`factura_items`) to pay and upload a bank transfer proof (`pagos_comprobantes`), supporting multiple proofs linked to a single invoice. | PWA | Mandatory |
| RF-03.5 | Allow `admin` in the web portal to inspect pending payment proofs and approve or reject them (requiring a mandatory rejection reason `motivo_rechazo` when rejecting). | Web | Mandatory |
| RF-03.6 | Automatically issue an official numbered payment receipt (`recibos`) when `admin` approves a payment proof, updating the paid items' status, recalculating the invoice balance, and notifying the parent. | Auto | Mandatory |
| **RF-04** | **Per-Student Mobile Queries** | | |
| RF-04.1 | Allow `padre` to list invoices and associated payment receipts/proofs per child within a date range (`desde` – `hasta`), with printable/downloadable invoice and receipt views. | PWA | Mandatory |
| RF-04.2 | Allow `padre` to view the debt history per child broken down by each payment item (`base`, each `deporte`, `transporte` route, `comedor`). | PWA | Mandatory |
| RF-04.3 | Allow `padre` to view each child's active enrollments in sports (with level, day, schedule, and teacher), transport route, and cafeteria; and allow `alumno` to view their own active enrollments. | PWA | Mandatory |
| **RF-05** | **Automated Email Notifications** | | |
| RF-05.1 | Send an email to each `padre` on the last business day of every month with the total amount to pay, itemized breakdown per child, and the attached invoice document. | Auto | Mandatory |
| RF-05.2 | Send an email to each `padre` on the 20th of every month detailing outstanding debt per item whenever the monthly payment is incomplete (`saldo_pendiente > 0`). | Auto | Mandatory |
| **RF-06** | **Web Financial & Payment Reports** | | |
| RF-06.1 | Allow `admin` to generate the revenue report by time period (`desde` – `hasta`). | Web | Mandatory |
| RF-06.2 | Allow `admin` to generate the completed payments report within a time period, broken down by academic year (`ciclo` / `curso`) and student. | Web | Mandatory |
| RF-06.3 | Allow `admin` to generate the incomplete payments report within a time period, broken down by academic year (`ciclo` / `curso`) and student, showing unpaid balance. | Web | Mandatory |
| RF-06.4 | Allow `admin` to generate the student payments report filtered by sport, level, schedule, and assigned teacher (`profesor_id`). | Web | Mandatory |
| RF-06.5 | Allow `admin` to generate the student payments report by transportation route (`recorrido_id`). | Web | Mandatory |

---

### 2.2. Non-Functional Requirements (RNF)

| ID | Category | Specification |
| :--- | :--- | :--- |
| **RNF-01** | Security & RBAC | Reuse existing backend authentication (`JWT` HS256 / `httpOnly` cookie `educar_session` and `bcryptjs` cost 12 in `server/core/security.ts`). Every endpoint must enforce role permissions on the server and verify parent-child ownership (`padre_alumno`) or self-ownership (`alumno`). |
| **RNF-02** | PWA Installability & Responsive Layout | Provide a valid `manifest.webmanifest`, app icons, and a Service Worker (`vite-plugin-pwa`) caching static shell assets and read-only GET responses, with mobile-first responsive UI starting at `360px` width. |
| **RNF-03** | Proof of Payment File Validation | Accept only `JPG`, `PNG`, or `PDF` files up to `5 MB` for bank transfer proofs, validating MIME type and byte size on both client and server, and restricting access strictly to the owning `padre` and `admin`. The upload route must raise the request body limit explicitly (Express defaults reject payloads around 100 KB). |
| **RNF-04** | ACID Transactional Integrity | Operate over the single backend and database (`server/database.js` `transaction` wrapper — there is no `withTransaction` export), executing proof submission, approval/rejection, item status updates, and receipt creation atomically. All monetary arithmetic rounds half-up to 2 decimals at each imputation so `facturas.saldo_pendiente` (recomputed as `total` − `SUM(factura_items.monto_pagado)`) never drifts. |
| **RNF-05** | Idempotent Scheduled Emails | Log every scheduled billing/email execution in `avisos_facturacion_log` keyed by `(periodo, tipo_aviso, factura_id)` so retries never send duplicate emails to the same parent for the same period. |
| **RNF-06** | AI Usage Traceability | Document AI prompts, proposals, human verification, adaptations, and validations in the team's AI logbook. |

### 2.3 Resolved Product Decisions (2026-11-05)

| ID | Decision | Resolution |
| :--- | :--- | :--- |
| D1 | How the RF-05 email jobs fire automatically | In-process `node-cron` scheduler in the Express server (env-configurable, disabled in tests); the manual `POST /api/jobs/*` endpoints remain for admin triggering and are idempotent via `avisos_facturacion_log`. |
| D2 | How a factura reaches `vencida` | Derived at read time (`fecha_vencimiento` in the past AND `saldo_pendiente > 0`); never persisted — the stored `estado` only holds `pendiente`/`parcial`/`en_revision`/`pagada`. |
| D3 | Where the "up to 2 deportes" cap applies | Enforced at enrollment time (server rejects a third active `deporte` inscription); monthly invoicing inherits the cap naturally. |
| D4 | Invoice/receipt document format | Server-side PDF generation with `pdfkit`; the RF-05.1 email attachment and the HU-17/HU-18 download/print views share one generator. |

---

## 3. Data Model & Database Schema Extensions

Building on top of `server/data/schema.js` and the existing migration chain (v1 in `server/core/migrations.ts`, v2–v4 in `server/core/constraints.ts`, gated on `MAX(version)` at `server/database.js:259` — the repository is already at v4) (`usuarios_acceso`, `padres`, `alumnos`, `padre_alumno`, `matriculas`, `cursos`, `niveles`, `deportes`, `grupos_deporte`, `recorridos_transporte`, `inscripciones`, `tarifas`, `notificaciones`), the following schema migration (**Migration v5**) is added:

1. **Differentiated Service Rates (`RF-02.1` – `RF-02.4`):**
   * `ALTER TABLE deportes ADD COLUMN arancel_mensual REAL NOT NULL DEFAULT 0 CHECK (arancel_mensual >= 0)`
   * `ALTER TABLE recorridos_transporte ADD COLUMN arancel_mensual REAL NOT NULL DEFAULT 0 CHECK (arancel_mensual >= 0)`
   * `tarifas` retains global rates for `'base'` and `'comedor'` (and fallback defaults when a sport/route has `0`).
2. **Invoices & Invoice Items (`RF-02.5`, `RF-03.1`, `RF-04.2`):**
   * **`facturas`**: `id`, `numero_factura` (`TEXT UNIQUE`, e.g. `FAC-202611-0001` — allocated as `MAX+1` per period inside the generating transaction; the UNIQUE constraint is the backstop, not the mechanism), `alumno_id` (FK `alumnos`), `periodo` (`TEXT NOT NULL`, format `YYYY-MM`, `UNIQUE(alumno_id, periodo)` — re-runs of `generar-periodo` skip students who already have an invoice for the period), `fecha_emision` (`TEXT`), `fecha_vencimiento` (`TEXT`), `total` (`REAL NOT NULL`), `saldo_pendiente` (`REAL NOT NULL`), `estado` (`TEXT CHECK (estado IN ('pendiente', 'parcial', 'en_revision', 'pagada', 'vencida'))` — note D2: `vencida` is derived at read time (`fecha_vencimiento` in the past AND `saldo_pendiente > 0`) and never persisted; the stored column only holds `pendiente`/`parcial`/`en_revision`/`pagada`).
   * **`factura_items`**: `id`, `factura_id` (FK `facturas`), `tipo` (`TEXT CHECK (tipo IN ('base', 'deporte', 'transporte', 'comedor'))`), `referencia_id` (`INTEGER NULL`), `descripcion` (`TEXT NOT NULL`), `monto` (`REAL NOT NULL`), `monto_pagado` (`REAL NOT NULL DEFAULT 0`), `estado` (`TEXT CHECK (estado IN ('pendiente', 'en_revision', 'pagado'))`).
3. **Bank Transfer Proofs, Item Allocations & Receipts (`RF-03.4` – `RF-03.6`):**
   * **`pagos_comprobantes`**: `id`, `factura_id` (FK `facturas`), `padre_id` (FK `padres`), `fecha_presentacion` (`TEXT`), `monto_declarado` (`REAL NOT NULL`), `referencia_transferencia` (`TEXT`), `archivo_nombre` (`TEXT NOT NULL`), `archivo_mime` (`TEXT NOT NULL`), `archivo_contenido` (`TEXT NOT NULL`), `estado` (`TEXT CHECK (estado IN ('en_revision', 'aprobado', 'rechazado'))`), `motivo_rechazo` (`TEXT NULL`), `validado_por` (`INTEGER NULL` FK `usuarios_acceso`), `fecha_validacion` (`TEXT NULL`).
   * **`pago_comprobante_items`**: `id`, `comprobante_id` (FK `pagos_comprobantes`), `factura_item_id` (FK `factura_items`), `monto_imputado` (`REAL NOT NULL`).
   * **`recibos`**: `id`, `numero_recibo` (`TEXT UNIQUE`, e.g. `REC-202611-0001`), `comprobante_id` (`INTEGER UNIQUE` FK `pagos_comprobantes`), `factura_id` (FK `facturas`), `alumno_id` (FK `alumnos`), `fecha_emision` (`TEXT`), `monto_total` (`REAL NOT NULL`), `detalle_json` (`TEXT NOT NULL`).
4. **Password Recovery & Scheduled Email Idempotency (`RF-01.3`, `RF-05`):**
   * **`password_resets`**: `id`, `usuario_id` (FK `usuarios_acceso`), `token_hash` (`TEXT NOT NULL`), `expira_en` (`TEXT NOT NULL`), `usado` (`INTEGER NOT NULL DEFAULT 0`).
   * **`avisos_facturacion_log`**: `id`, `periodo` (`TEXT NOT NULL`), `tipo_aviso` (`TEXT CHECK (tipo_aviso IN ('fin_de_mes', 'deuda_dia_20'))`), `padre_id` (FK `padres`), `factura_id` (FK `facturas`), `notificacion_id` (`INTEGER NULL` FK `notificaciones`), `fecha_envio` (`TEXT NOT NULL`), `UNIQUE(periodo, tipo_aviso, factura_id)`.

---

## 4. Software Architecture & REST API Contract

### 4.1. Layered Architecture (Existing Monorepo Extension)
* **Presentation Layer (`src/`):** React 19 + TypeScript + Vite 7 + `vite-plugin-pwa`. Extends `src/pages/PortalPage.tsx` with mobile-first billing/payment tabs for `padre` and read-only enrollment/profile tabs for `alumno`. Extends `src/pages/ManagementPage.tsx` and `src/components/ReportesViewer.tsx` for `admin`.
* **Business Logic Layer (`server/`):** Node.js 22 + Express 5 (`server/index.js`, `api/index.js`). Adds `server/core/billing.ts`, `server/core/payments.ts`, and `server/core/billing-jobs.ts`, and extends `server/core/security.ts`, `server/core/fees.ts`, `server/core/notifications.ts`, and `server/routes/reports.js`.
* **Data & Messaging Layer (`server/database.js`):** Dual PostgreSQL (`pg`) / SQLite (`node:sqlite`) driver with the `transaction` ACID wrapper (`db.transaction` in `server/database.js:168` — there is no `withTransaction` export) and `nodemailer` SMTP delivery; the worker currently sends `text`-only mail, so invoice attachment support is new work (T04).

### 4.2. New & Extended REST Endpoints

* **Auth (`server/core/security.ts`):**
  * `POST /api/auth/forgot-password` — Generates one-time reset token and queues recovery email in `notificaciones`.
  * `POST /api/auth/reset-password` — Validates token, updates `password_hash`, increments `session_version`.
* **Rates & Billing (`server/core/billing.ts`):**
  * `PUT /api/tarifas/servicios` (`admin`) — Updates the global `base` and `comedor` rates in `tarifas` only; per-sport (`deportes.arancel_mensual`) and per-route (`recorridos_transporte.arancel_mensual`) rates are managed through the existing Admin entity CRUD — one write path per rate, no duplication.
  * `POST /api/facturas/generar-periodo` (`admin`) — Idempotently generates monthly invoices (`facturas` + `factura_items`) for all active students for `periodo` (`YYYY-MM`) via `UNIQUE(alumno_id, periodo)`.
  * `GET /api/facturas` (`padre` / `admin`) — Filters invoices by `alumno_id`, `estado`, `desde`, `hasta`.
  * `GET /api/facturas/:id` (`padre` / `admin`) — Returns invoice detail with `items`, `comprobantes`, and `recibos`.
  * `GET /api/deuda/alumno/:alumnoId` (`padre` / `admin`) — Returns itemized debt history grouped by payment concept and period.
* **Payments, Proofs & Receipts (`server/core/payments.ts`):**
  * `POST /api/facturas/:id/comprobantes` (`padre`) — Uploads bank transfer proof (`JPG/PNG/PDF <= 5MB`) with selected `item_ids`; marks selected items and proof as `en_revision`.
  * `GET /api/pagos/alumno/:alumnoId` (`padre` / `admin`) — Lists payment proofs and receipts for a student.
  * `GET /api/admin/comprobantes` (`admin`) — Lists payment proofs filtered by `estado`.
  * `PUT /api/admin/comprobantes/:id/validar` (`admin`) — Approves (creates `recibos`, marks items `pagado`, updates `facturas.saldo_pendiente` and `estado` inside the `server/database.js` `transaction` wrapper) or rejects (requires `motivo_rechazo`, reverts items to `pendiente`) a proof and notifies the parent.
  * `GET /api/comprobantes/:id/archivo` (`admin` / owning `padre`) — Serves the stored proof file (JPG/PNG/PDF) for inspection; ownership is re-checked server-side and the MIME type re-validated on serve. Required by RF-03.5 ("inspect pending payment proofs") and by the parent's own proof history (RF-03.3); `403` for anyone else.
* **Scheduled Jobs (`server/core/billing-jobs.ts`):**
  * `POST /api/jobs/recordatorio-fin-mes` (`admin` / Cron) — Ensures period invoices exist and sends end-of-month email with total, itemized breakdown, and invoice attachment (`avisos_facturacion_log`).
  * `POST /api/jobs/aviso-deuda-dia-20` (`admin` / Cron) — Sends 20th-of-month overdue debt email detailing unpaid items to parents with `saldo_pendiente > 0`.
  * Both jobs are scheduled in-process with `node-cron` (D1): the end-of-month reminder runs on the last business day of each month and the debt notice on the 20th; the scheduler is env-configurable and disabled under test, while the HTTP endpoints above remain for manual/admin triggering and are safe to re-run thanks to the `avisos_facturacion_log` idempotency key.
  * Invoice and receipt documents are generated as server-side PDFs with `pdfkit` (D4); the RF-05.1 email attachment and the PWA/Web download views consume the same generator.
* **Financial Reports (`server/routes/reports.js`):** The 9 existing report routes in this file are unauthenticated `app.get` handlers — the 5 new financial reports below MUST be registered behind `admin` session middleware instead of copying that legacy pattern.
  * `GET /api/reportes/ingresos-periodo?desde=&hasta=`
  * `GET /api/reportes/pagos-completos?desde=&hasta=&ciclo=&curso_id=`
  * `GET /api/reportes/pagos-incompletos?desde=&hasta=&ciclo=&curso_id=`
  * `GET /api/reportes/pagos-por-deporte?deporte_id=&nivel=&horario=&profesor_id=&periodo=`
  * `GET /api/reportes/pagos-por-transporte?recorrido_id=&periodo=`

---

## 5. Sprint Backlog & User Stories (`HU-01` – `HU-26`)

### Sprint M1 · PWA Setup, Mobile Auth & Differentiated Rates (`HU-01` – `HU-09`)
* **HU-01 (PWA Installability & Manifest — `RNF-02`):** Configure `vite-plugin-pwa` in `vite.config.ts`, `public/manifest.webmanifest`, icons, Service Worker registration, and `>= 360px` mobile navigation shell.
* **HU-02 (Mobile Login — `RF-01.1`):** Optimize `src/pages/LoginPage.tsx` for mobile viewport; authenticate active `padre` and `alumno` users via `POST /api/auth/login`.
* **HU-03 (Mobile Logout — `RF-01.2`):** Clear session cookie/state via `POST /api/auth/logout` and prevent back-navigation to protected views.
* **HU-04 (Password Recovery via Email — `RF-01.3`):** Add `password_resets` table, `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`, and recovery UI in `src/pages/LoginPage.tsx`.
* **HU-05 (In-App Password Change — `RF-01.4`):** Expose `src/components/portal/PasswordForm.tsx` (`PUT /api/auth/password`) in the mobile account view for `padre` and `alumno`.
* **HU-06 (Role-Scoped Mobile Access — `RF-01.5`):** Enforce `padre` child ownership (`padre_alumno`) and `alumno` read-only self-access across `src/pages/PortalPage.tsx` and all API routes.
* **HU-07 (Base Tuition & Cafeteria Rates — `RF-02.1`, `RF-02.4`):** Manage `base` and `comedor` rates in Admin UI (`monto >= 0`), applying changes to subsequent invoices.
* **HU-08 (Per-Sport Differentiated Rate — `RF-02.2`):** Add `arancel_mensual` to `deportes`, expose in Admin CRUD (`src/components/management/entity-definitions.ts`), and update `server/core/fees.ts` (`monthlyQuote`).
* **HU-09 (Per-Route Differentiated Rate — `RF-02.3`):** Add `arancel_mensual` to `recorridos_transporte`, expose in Admin CRUD, and update `server/core/fees.ts` (`monthlyQuote`).

### Sprint M2 · Monthly Invoicing & Mobile Fee/Enrollment Queries (`HU-10` – `HU-14`)
* **HU-10 (Monthly Invoice Generation — `RF-02.5`):** Create `facturas` and `factura_items` tables; implement `generateMonthlyInvoices(periodo)` in `server/core/billing.ts` and `POST /api/facturas/generar-periodo`.
* **HU-11 (Pending Fees Query — `RF-03.1`):** Implement `GET /api/facturas` and mobile `StudentFeesPanel.tsx` displaying pending/overdue invoices per child with due date, total, balance, and status.
* **HU-12 (Paid Fees Query — `RF-03.2`):** Add "Pagadas" filter in `StudentFeesPanel.tsx` showing payment date and linked receipt.
* **HU-13 (Payment History Query — `RF-03.3`):** Implement `GET /api/pagos/alumno/:alumnoId` and mobile payment history list showing `en_revision`, `aprobado`, and `rechazado` (with `motivo_rechazo`).
* **HU-14 (Sports, Transport & Cafeteria Enrollments Query — `RF-04.3`):** Display active enrollments (sport, level, schedule, teacher, transport route, cafeteria, and differentiated rates) per child for `padre` and self-only read-only view for `alumno` in `src/pages/PortalPage.tsx`.

### Sprint M3 · Bank Transfer Proof Upload, Admin Validation & Official Receipts (`HU-15` – `HU-17`)
* **HU-15 (Select Items & Upload Transfer Proof — `RF-03.4`, `RNF-03`):** Create `pagos_comprobantes` and `pago_comprobante_items`; implement `POST /api/facturas/:id/comprobantes` (`JPG/PNG/PDF <= 5MB`, multiple proofs per invoice) and mobile item-selection + file upload UI.
* **HU-16 (Admin Approve/Reject Payment Proof — `RF-03.5`, `RNF-04`):** Implement `GET /api/admin/comprobantes` and `PUT /api/admin/comprobantes/:id/validar` in `server/core/payments.ts` plus Admin validation queue UI in `src/pages/ManagementPage.tsx`.
* **HU-17 (Automatic Official Receipt Issuance — `RF-03.6`):** Create `recibos` table; issue numbered receipt inside the approval transaction and provide printable/PDF view in PWA and Web.

### Sprint M4 · Date-Range Invoice/Receipt Queries, Itemized Debt & Scheduled Emails (`HU-18` – `HU-21`)
* **HU-18 (List Invoices & Receipts by Date Range — `RF-04.1`):** Support `desde`/`hasta` filters on `GET /api/facturas` and build mobile date-range filter with printable/downloadable invoice and receipt previews.
* **HU-19 (Itemized Debt History — `RF-04.2`):** Implement `GET /api/deuda/alumno/:alumnoId` and mobile itemized debt view broken down by concept (`base`, each `deporte`, `transporte`, `comedor`).
* **HU-20 (End-of-Month Email Reminder with Invoice Attachment — `RF-05.1`, `RNF-05`):** Implement last-business-day calculation, invoice HTML/PDF attachment in `server/core/notifications.ts`, idempotency log in `avisos_facturacion_log`, and `POST /api/jobs/recordatorio-fin-mes`.
* **HU-21 (20th-of-Month Overdue Debt Email — `RF-05.2`, `RNF-05`):** Implement `POST /api/jobs/aviso-deuda-dia-20` sending itemized debt emails only to parents with `saldo_pendiente > 0` and logging in `avisos_facturacion_log`.

### Sprint M5 · Web Financial & Payment Reports (`HU-22` – `HU-26`)
* **HU-22 (Revenue by Time Period Report — `RF-06.1`):** Implement `GET /api/reportes/ingresos-periodo` in `server/routes/reports.js` and render in `src/components/ReportesViewer.tsx` / `src/components/reports/renderers.tsx`.
* **HU-23 (Completed Payments Report by Period, Year & Student — `RF-06.2`):** Implement `GET /api/reportes/pagos-completos` and UI renderer with period, academic year (`ciclo`), and course filters.
* **HU-24 (Incomplete Payments Report by Period, Year & Student — `RF-06.3`):** Implement `GET /api/reportes/pagos-incompletos` and UI renderer showing total billed, paid amount, and pending balance.
* **HU-25 (Student Payments Report by Sport, Level, Schedule & Teacher — `RF-06.4`):** Implement `GET /api/reportes/pagos-por-deporte` and UI renderer with combinable sport, level, schedule, teacher, and period filters.
* **HU-26 (Student Payments Report by Transportation Route — `RF-06.5`):** Implement `GET /api/reportes/pagos-por-transporte` and UI renderer with route and period filters.

### Closure (`C-01`) · End-to-End Verification, Build & AI Logbook
* **C-01:** Add unit/integration coverage in `tests/core.test.ts` (and Playwright E2E in `tests/browser/`) covering all new endpoints, RBAC boundaries, and financial reports; verify `npm test` and `npm run build` pass with zero errors.
