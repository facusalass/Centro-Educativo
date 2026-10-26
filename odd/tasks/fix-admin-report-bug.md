# Feature: fix-admin-report-bug

## Objective
Solucionar el bug de pantalla en blanco al conmutar tipos de reportes en el panel de administración, blindar el visor contra desincronización de estado y renderizado concurrente, y configurar y ejecutar la suite de pruebas de Frontend con TestSprite. Extensión de esta sesión: resolver los 3 casos que quedaron fallidos/bloqueados (TC003, TC007, TC014) cerrando los defectos reales de producto y moviendo la cobertura durable a la suite Playwright del repo.

## Scope and Constraints
- Sincronización estricta de estado en `ReportesViewer.tsx`: aislar el renderizado del reporte para que solo se monte cuando la data coincida con el tipo activo (`tipoCargado === tipo`).
- Manejo asíncrono robusto: cancelar respuestas obsoletas en peticiones en vuelo ante conmutación rápida de selector (`active` flag).
- Defensividad en `renderers.tsx`: optional chaining y validaciones de estructura básica (`Array.isArray`).
- ErrorBoundary para aislar errores de render y evitar que caiga el portal administrativo.
- Configurar y ejecutar pruebas de Frontend con TestSprite.
- Los scripts `.py` generados por TestSprite **no se editan** (son artefactos regenerables y contienen un `raise AssertionError` inyectado por el generador). La cobertura durable vive en `tests/browser/portal.spec.ts`.

## Specs

- **S1 (TC007 — filtro de catálogo).** "TC007 (Fallo funcional de UI): El test buscó un `<select>` o dropdown de filtros en el catálogo de entidades (`src/components/EntityManager.tsx`). Actualmente solo existe un `<input>` de búsqueda por texto. Debemos agregar el selector de filtro por estado/categoría en la tabla o ajustar la interfaz."
- **S2 (TC003 — export CSV headless).** "TC003 (Falla de automatización headless): La descarga de CSV vía Blob en `ReportesViewer.tsx` funciona en navegador normal, pero en Playwright headless el test expira esperando el evento de descarga del sistema operativo. Requiere configurar el listener de descarga (`expect_download`) en `testsprite_tests/TC003_Load_a_report_and_export_it_as_CSV.py`."
- **S3 (TC014 — print/preview headless).** "TC014 (Falla de automatización headless): `window.print()` en Chromium headless no abre una ventana de diálogo de impresión nativa, provocando timeout en el assert. Requiere mockear o interceptar la invocación de `window.print` en el test."
- **S4 (alcance de artefactos).** Decisión: "Dejarlos intactos y cubrir en Playwright TS (recomendado)". Los `.py` quedan como están; el fix y su verificación van a `tests/browser/portal.spec.ts` ejecutado con `npm run test:e2e`.
- **S5 (diseño del filtro).** Decisión: "Facet select derivado por entidad (recomendado)". Un único `<select>` cuya faceta se deriva de la definición de la entidad (`estado` en alumnos/docentes/usuarios, `nivel` en grupos/noticias, `rol` en usuarios), con opciones pobladas desde los valores reales presentes en `rows` (no desde `field.options`), opción "Todos", combinado por AND con el buscador de texto, y contador que refleje filtrados/total.
- **S6 (diseño del preview).** Decisión: "Vista previa in-app (recomendado)". `previewOpen` envuelve el **mismo** nodo `#printable-report` en un overlay: sin clonar DOM, sin ids duplicados y sin tocar el `@media print` de `src/styles/global.css`. El modal muestra "Vista previa", el título del reporte y los botones "Imprimir" y "Cerrar"; `window.print()` se invoca solo al confirmar.
- **S7 (export CSV determinista).** El anchor de descarga se inserta en el DOM antes del `click()` y el `URL.revokeObjectURL` se difiere, para que la descarga no se cancele ni dependa del motor.
- **S8 (harness E2E ejecutable).** El shell SPA debe servirse con `res.sendFile('index.html', { root: staticDir })`. La forma con ruta absoluta la rechaza `send` como dotfile cuando la ruta contiene un segmento oculto (un worktree bajo `.gemini/`), y eso convierte todo deep link (`/login`, `/admin`) en 404, dejando la suite E2E inutilizable. No es parte de los tres casos: es un prerrequisito de verificación detectado en el baseline.

## Tasks
- [x] T01: Corregir desincronización de estado, cancelar peticiones obsoletas y agregar ErrorBoundary en `ReportesViewer.tsx` y `renderers.tsx` [commit 27505e0]
- [x] T02: Verificar build (`npm run build`) y tests funcionales existentes (`npm test`) [commit 27505e0]
- [x] T03: Configurar y ejecutar la suite de pruebas de Frontend (E2E) con TestSprite [commit 138e20b]
- [x] T04: Harden de `exportCsv` en `ReportesViewer.tsx` (S2, S7) + test de descarga real con `expect_download` en `tests/browser/reportes-export.spec.ts` [commit 8577606]
- [x] T05: Filtro facet derivado por entidad en `EntityManager.tsx` (S1, S5) + test de filtro, conteo y reset en `tests/browser/reportes-export.spec.ts` [commit b02dd76]
- [x] T06: Vista previa in-app envolviendo `#printable-report` (S3, S6) + test con stub de `window.print` en `tests/browser/reportes-export.spec.ts` [commit 8577606]
- [x] T07: Documentar la resolución de TC003/TC007/TC014 y dónde vive la cobertura durable (S4) [commit e60e948]
- [x] T08: Servir el shell con `{ root: staticDir }` en `server/index.js` para que el E2E sea ejecutable en cualquier ruta (S8) [commit 3496066]

## Evidence & Verification
- T01: Implementado `ErrorBoundary.tsx`, refactorizado `ReportesViewer.tsx` con `reportState: { tipo, data }`, `loading` flag, `active` cancellation en `useEffect`, y defensas con optional chaining en `renderers.tsx`.
- T02: `npm run build` completado exitosamente en 2.08s con 0 errores TypeScript/Vite; `npm test` exitoso con 21/21 pruebas pasadas en 5.05s.
- T03: TestSprite Frontend suite ejecutada con 15 casos de prueba (12 pasados, 80% éxito). Verificado específicamente TC006: conmutación entre tipos de reportes sin pantallas blancas ni caídas de interfaz. Reporte generado en `testsprite_tests/testsprite-mcp-test-report.md`.
- Baseline de esta sesión (árbol limpio en `97fcf11`): ver `## Log` L3.
- T08: `npm run build` OK, `npm test` 21/21 y `npm run test:e2e` **5 de 6 fallando** en el árbol limpio, todos con `{"error":"Not Found"}` en `/login`. Causa raíz aislada con servidor propio: `send` 404-ea cualquier ruta absoluta con segmento oculto, y el worktree vive bajo `.gemini/antigravity/`. Probado en aislamiento: `sendFile(absoluto)` → 404, `sendFile('index.html', { root })` → 200. Tras el cambio, los 6 tests preexistentes pasan (sin regresiones).
- T04: descarga real verificada con `page.waitForEvent('download')`: nombre `reporte-alumnos-por-curso.csv`, BOM `U+FEFF`, separador `;` y encabezado `"#";"Legajo";"Apellido y Nombre";"DNI";"Email";"Teléfono"`.
- T05: en `Grupos deportivos` el facet derivado es `Nivel` (3 valores distintos); filtrar `Secundario` deja 3 de 5 filas, todas con `Secundario`, y combinado con la búsqueda `Miercoles` queda 1.
- T06: al abrir la vista previa `window.print` no se invoca (0 llamadas); al confirmar `Imprimir` se invoca exactamente 1 vez; `Cerrar` desmonta el overlay.
- Verificación final: `npx prettier --check` limpio en los 5 archivos tocados, `npm run build` OK, `npm test` 21/21, `npm run test:e2e` **9/9 en 17.4s** (6 preexistentes + 3 nuevos).

## Log

- **L1 (pedido original de esta sesión, verbatim):**
  > Objetivo de esta sesión: Resolver los 3 tests que quedaron en estado fallido/bloqueado en `testsprite_tests/testsprite-mcp-test-report.md`:
  >
  > 1. **TC007 (Fallo funcional de UI):** El test buscó un `<select>` o dropdown de filtros en el catálogo de entidades (`src/components/EntityManager.tsx`). Actualmente solo existe un `<input>` de búsqueda por texto. Debemos agregar el selector de filtro por estado/categoría en la tabla o ajustar la interfaz.
  > 2. **TC003 (Falla de automatización headless):** La descarga de CSV vía Blob en `ReportesViewer.tsx` funciona en navegador normal, pero en Playwright headless el test expira esperando el evento de descarga del sistema operativo. Requiere configurar el listener de descarga (`expect_download`) en `testsprite_tests/TC003_Load_a_report_and_export_it_as_CSV.py`.
  > 3. **TC014 (Falla de automatización headless):** `window.print()` en Chromium headless no abre una ventana de diálogo de impresión nativa, provocando timeout en el assert. Requiere mockear o interceptar la invocación de `window.print` en el test.
  >
  > Por favor, revisá primero el código y proponé la solución para estos tres casos antes de ejecutar.
- **L2 (decisiones del usuario, verbatim):** "Facet select derivado por entidad (recomendado)" · "Vista previa in-app (recomendado)" · "Dejarlos intactos y cubrir en Playwright TS (recomendado)".
- **L3 (evidencia de arranque):** La sesión se inició parada en el clon principal (`feat/facu-rama-completion`, `f90f34a`), donde no existen `testsprite_tests/` ni este documento. El trabajo real vive en el worktree `C:/Users/lucas/.gemini/antigravity/worktrees/Centro-Educativo/fix_admin_report_bug` @ `97fcf11`, árbol limpio. Hallazgos: (a) los tres `.py` son artefactos generados y TC003/TC014 contienen un `raise AssertionError("Test blocked during agent run: ...")` inyectado, por lo que no pueden pasar por construcción; (b) Python Playwright no está instalado en la máquina, así que no son ejecutables localmente; (c) el repo ya tiene suite durable en `tests/browser/portal.spec.ts` con `playwright.config.ts` (canal `msedge`, server aislado en `127.0.0.1:3101`, sirve `dist`). Se agregó `playwright.config.ts`-aware flow: `npm run build` antes de `npm run test:e2e`.
- **L4 (bloqueante de verificación y decisión tomada):** El baseline E2E estaba rojo en limpio (5/6) por un 404 en `/login`, ajeno a los tres casos. Se aisló la causa con un servidor propio y una app Express mínima: `send` rechaza con 404 las rutas absolutas que contienen un segmento oculto, y este worktree cuelga de `.gemini/`. Se aplicó la forma canónica `res.sendFile('index.html', { root: staticDir })` (T08), que además corrige el caso real de una instalación servida desde una ruta con punto. Es la cuarta unidad de trabajo, no pedida como tal, incluida como prerrequisito de verificación y en commit propio.
