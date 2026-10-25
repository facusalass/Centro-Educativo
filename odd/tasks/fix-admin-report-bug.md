# Feature: fix-admin-report-bug

## Objective
Solucionar el bug de pantalla en blanco al conmutar tipos de reportes en el panel de administración, blindar el visor contra desincronización de estado y renderizado concurrente, y configurar y ejecutar la suite de pruebas de Frontend con TestSprite.

## Scope and Constraints
- Sincronización estricta de estado en `ReportesViewer.tsx`: aislar el renderizado del reporte para que solo se monte cuando la data coincida con el tipo activo (`tipoCargado === tipo`).
- Manejo asíncrono robusto: cancelar respuestas obsoletas en peticiones en vuelo ante conmutación rápida de selector (`active` flag).
- Defensividad en `renderers.tsx`: optional chaining y validaciones de estructura básica (`Array.isArray`).
- ErrorBoundary para aislar errores de render y evitar que caiga el portal administrativo.
- Configurar y ejecutar pruebas de Frontend con TestSprite.

## Tasks
- [x] T01: Corregir desincronización de estado, cancelar peticiones obsoletas y agregar ErrorBoundary en `ReportesViewer.tsx` y `renderers.tsx`
- [x] T02: Verificar build (`npm run build`) y tests funcionales existentes (`npm test`)
- [ ] T03: Configurar y ejecutar la suite de pruebas de Frontend (E2E) con TestSprite

## Evidence & Verification
- T01: Implementado `ErrorBoundary.tsx`, refactorizado `ReportesViewer.tsx` con `reportState: { tipo, data }`, `loading` flag, `active` cancellation en `useEffect`, y defensas con optional chaining en `renderers.tsx`.
- T02: `npm run build` completado exitosamente en 2.08s con 0 errores TypeScript/Vite; `npm test` exitoso con 21/21 pruebas pasadas en 5.05s.
