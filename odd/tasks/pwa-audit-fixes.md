# Feature: pwa-audit-fixes

## Header
Fixes de la auditoría PWA (Antigravity Gemini 4 Argon + verificación PI). Rama `feat/pwa-mobile`. Orden: Fase A demo martes, Fase B plata, Fase C cierre. Verificación previa: 11/11 CONFIRMADOS (explorer mw8c6g0v-1-dkzd).

## Specs
- S1 (1.1 SW): "Exclude `/api/*` from Workbox navigation fallback" + "Harden NotFoundPage for standalone/new-tab" + "real browser navigation assertion".
- S2 (2.1 start_url/drawer): "Include Acceso Comunidad / Mi Portal in mobile drawer" + "Evaluate start_url /login" + "Prevent Mi portal full reload".
- S3 (1.3 nav mobile + reload): "mobileTabs for docente/personal" + "Replace reload with re-fetch" + "Persist tab via URLSearchParams".
- S4 (2.2 alumno cuotas): "Remove cuotas for non-padre" + "distinct icon Receipt/Wallet".
- S5 (2.4 print): "printable-area class shared in @media print" (ajuste PI: no duplicar id).
- S6 (2.3 PDF iOS): "append + delayed revoke + catch with Feedback" (patrón ReportesViewer).
- S7 (2.5 comprobantes): "Guard UploadComprobante + reject en_revision backend + full status list + referencia_transferencia + notify parent on validar".
- S8 (2.8 EntityManager): "min 0 + step 0.01 via per-field metadata, keep min 1 only cupo/anio".
- S9 (1.2 ops billing): "toolbar admin YYYY-MM + 3 botones" en ManagementPage + "runRecordatorioFinMes calls generateMonthlyInvoices" + decisión Vercel crons (manual para demo).
- S10 (2.7 offline): "clear setError on success + offline banner + distinguish status 0 vs 401 + replace vs assign".
- S11 (2.6 iOS): "viewport-fit=cover + apple-touch-icon opaque".

## Tasks
- [ ] A1 (S1): denylist /api en workbox + NotFound fallback — route inline — commit: —
- [ ] A2 (S2): drawer Acceso/Mi Portal + start_url /login + PortalShell navigate — route inline — commit: —
- [ ] A3 (S3-part): mobileTabs docente/personal — route inline — commit: —
- [ ] A4 (S4): quitar cuotas a alumno + icono — route inline — commit: —
- [ ] A5 (S5): printable-area print cuotas — route inline — commit: —
- [ ] B1 (S3-part): reload→cargarDatos + ?tab= + feedback — route inline — commit: —
- [ ] B2 (S6): fix descargarPdf iOS — route inline — commit: —
- [ ] B3 (S7-part): guards Upload + lock + lista completa + referencia — route inline — commit: —
- [ ] B4 (S7-part): backend reject en_revision — route inline — commit: —
- [ ] B5 (S8): EntityManager min/step — route inline — commit: —
- [ ] C1 (S9): toolbar admin + job genera facturas — route inline — commit: —
- [ ] C2 (S7-part): notificación padre al validar — route inline — commit: —
- [ ] C3 (S10+S11): offline banner + session + viewport/icons — route inline — commit: —
- [ ] C4 (S1+S9): E2E navegación real SW + regresión — route inline — commit: —

## Log
- L1 (2026-11-08): "Creo que lo mejor en este momento sería que ejecutes el plan que me diste en ese orden por fases y despues pasarte el plan de integracion y diagnostico para revisarlo y ejecutar las acciones pertinentes. Asi que dale para delante."
