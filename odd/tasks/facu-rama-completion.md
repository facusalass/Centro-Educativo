# Feature: facu-rama-completion

## Objective
Position the workspace on a clean branch derived from `origin/Facu-Rama` (`9d2f821`), preserve the unified work plan documents (`docs/PROJECT DESCRIPTION resumed.md` and `docs/PLAN_DE_TRABAJO_REFINADO.md`), and implement the 3 remaining functional adjustments (`RF-13.4` student portal profile view, `RF-10.2` enrolled students roster in teacher sports groups, and `RF-06.7` student `domicilio` in transport route reports) with automated test coverage.

## Problem & Why
`origin/Facu-Rama` already implements ~98% of the refined work plan (`docs/PROJECT DESCRIPTION resumed.md`), including JWT/BCrypt RBAC security, full CRUD with referential integrity, ACID transactions, parent matriculation, and SMTP/in-app notifications. Closing the 3 remaining functional micro-gaps on a dedicated branch off `origin/Facu-Rama` achieves 100% alignment between specification and code without merge conflicts.

## Authorized Scope & Constraints
- Base branch: `feat/facu-rama-completion` branched from `origin/Facu-Rama` (`9d2f821`).
- Preserve and track `docs/PROJECT DESCRIPTION resumed.md` (primary reference in English) and `docs/PLAN_DE_TRABAJO_REFINADO.md` (Spanish counterpart), aligning `RF-07.1` student status to `Active / Inactive` (`activo / inactivo`) since adjustment #4 was explicitly excluded.
- Implement ONLY adjustments 1, 2, and 3:
  1. **Adjustment 1 (`RF-13.4`):** Render the student's read-only comprehensive academic and service record on the `inicio` tab of `src/pages/PortalPage.tsx` when logged in with role `alumno` (consuming `GET /api/reportes/alumno/:id`).
  2. **Adjustment 2 (`RF-10.2`):** Include the enrolled active students roster (`alumnos`) for each sports group in `GET /api/reportes/docente/:id` (`server/routes/reports.js`) and render it inside the *"Deportes a Cargo"* tab of `src/components/DocenteDashboard.tsx`.
  3. **Adjustment 3 (`RF-06.7`):** Include the student's `domicilio` field in `GET /api/reportes/alumnos-por-recorrido` (`server/routes/reports.js`), TypeScript types (`src/types/index.ts`), and report table renderer (`src/components/reports/renderers.tsx`).
- Do NOT implement adjustment 4 (`egresado`/`suspendido` student states).

## Configuration & Delivery Budget
- **TDD Mode:** `off` (source: repository default / not configured; ordinary functional and integration checks apply).
- **Test & Build Runners:** `npm test` (`node --import tsx --test tests/core.test.ts`) and `npm run build` (`tsc && tsc -p tsconfig.server.json && vite build`).
- **Delivery Strategy:** `ask-on-risk` (default).
- **Forecast Authored Changed Lines:** ~220 lines across code and tests (excluding the documentation files already authored).
- **Running Authored Changed Lines:** 420 code/test lines (`076a0f9`: 167 lines; `49ad302`: 253 lines) + 753 doc lines (`7b1e003`). Single PR slice `9d2f821..49ad302`.
- **Reviewed Boundary:** `9d2f821` (RDD assessment on `antigravity` runtime: `unavailable` — immutable receipt review supports `claude-code`, `opencode`, `codex`).

## Actionable Checklist & Route Declaration
- [x] **T01:** Align `RF-07.1` status values (`Active / Inactive`) in `docs/PROJECT DESCRIPTION resumed.md` and `docs/PLAN_DE_TRABAJO_REFINADO.md`, install `Facu-Rama` dependencies (`npm install`), verify baseline `npm test` and `npm run build`, and commit the refined work plan docs. [commit `7b1e003`]
  - *Route:* Delegated direct (`self` writer — Writer trigger: 2 non-trivial markdown files).
  - *Review Assessment:* `unavailable` (runtime `antigravity` not eligible for immutable receipt review).
- [x] **T02:** Implement Adjustment 2 (`RF-10.2` sports group student roster in teacher report & `DocenteDashboard.tsx`) and Adjustment 3 (`RF-06.7` student `domicilio` in transport route report & `renderers.tsx`) with integration assertions in `tests/core.test.ts`. [commit `076a0f9`]
  - *Route:* Delegated direct (`self` writer — Preparation & Writer triggers: touched `server/routes/reports.js`, `src/types/index.ts`, `src/components/DocenteDashboard.tsx`, `src/components/reports/renderers.tsx`, `tests/core.test.ts`).
  - *Review Assessment:* `unavailable` (runtime `antigravity` not eligible for immutable receipt review).
- [x] **T03:** Implement Adjustment 1 (`RF-13.4` student read-only comprehensive profile view in `src/pages/PortalPage.tsx`) with integration verification in `tests/core.test.ts`, and run full `npm test` + `npm run build`. [commit `49ad302`]
  - *Route:* Delegated direct (`self` writer — Preparation & Writer triggers: touched `src/pages/PortalPage.tsx` and `tests/core.test.ts`).
  - *Review Assessment:* `unavailable` (runtime `antigravity` not eligible for immutable receipt review).

## Acceptance Criteria & Applicable Checks
- `docs/PROJECT DESCRIPTION resumed.md` and `docs/PLAN_DE_TRABAJO_REFINADO.md` committed on `feat/facu-rama-completion` with `RF-07.1` matching `activo/inactivo`.
- `GET /api/reportes/alumnos-por-recorrido` returns `domicilio` for each enrolled student and `renderAlumnosPorRecorrido` displays the `Domicilio` column.
- `GET /api/reportes/docente/:id` returns the active `alumnos` array for each item in `gruposDeporte`, and `DocenteDashboard.tsx` renders the student roster for each sports group.
- Logging in as `alumno` in `PortalPage.tsx` displays the student's read-only comprehensive record (legajo, course, level, subjects with teachers, enrolled sports with schedules, transport route, and dining status).
- `npm test` (21/21 passed) and `npm run build` (0 errors) verified.

## Progress & Verification Evidence
- **T01 [commit `7b1e003`]:** Aligned `RF-07.1` in `docs/PROJECT DESCRIPTION resumed.md` and `docs/PLAN_DE_TRABAJO_REFINADO.md`; ran `npm install` (0 errors), `npm test` (20/20 passed), and `npm run build` (0 errors).
- **T02 [commit `076a0f9`]:** Added `domicilio` to `GET /api/reportes/alumnos-por-recorrido` (`server/routes/reports.js`), `src/types/index.ts`, and `src/components/reports/renderers.tsx` (`RF-06.7`); added `alumnos` roster to `gruposDeporte` in `GET /api/reportes/docente/:id` and rendered the roster table in `src/components/DocenteDashboard.tsx` (`RF-10.2`); added integration assertions in `tests/core.test.ts`.
- **T03 [commit `49ad302`]:** Implemented `AlumnoProfileView` in `src/pages/PortalPage.tsx` (`RF-13.4`) and added RBAC/profile integration test in `tests/core.test.ts`; verified `npm test` (21/21 passed in 5.05s) and `npm run build` (0 errors in 2.28s).
- Next step: Feature complete; ready for user review / push / PR into `Facu-Rama` or `main`.
