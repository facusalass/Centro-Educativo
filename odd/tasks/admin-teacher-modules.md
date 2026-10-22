# Feature: admin-teacher-modules

## Objective
Completar y pulir el Módulo Administrador y el Módulo Docente para lograr una demostración End-to-End funcional ante el docente evaluador, incluyendo reportes tabulares, descarga a PDF, completitud CRUD y visualización de carga horaria.

## Scope and Constraints
- Módulo Administrador: 9 reportes en tablas HTML estilizadas con exportación a PDF, formulario de asignaciones docentes, formulario de creación de usuarios, acciones de eliminación de entidades.
- Módulo Docente: visualización de carga horaria semanal y nómina de alumnos por curso/materia en formato de tabla.
- Persistencia dual: compatibilidad total con SQLite local y PostgreSQL (Supabase) en Vercel.
- Mantener autenticación demo existente para priorizar impacto visual y reglas de negocio.

## Tasks
- [x] T01: Agregar endpoint y servicio para reporte Alumnos por Curso (`GET /api/reportes/alumnos-por-curso`) [commit 80afbe7]
- [x] T02: Refactorizar `ReportesSection` en `AdminPanel.tsx` con tablas formateadas para los 9 reportes institucionales [commit e893b2b]
- [x] T03: Implementar funcionalidad de descarga y exportación de reportes a PDF [commit e893b2b]
- [x] T04: Implementar formulario y gestión de Asignaciones Docentes en `AdminPanel.tsx` y servicio API [commit cb29dac]
- [x] T05: Implementar formulario de alta de Usuarios y acciones de eliminación de entidades en `AdminPanel.tsx` [commit cb29dac]
- [x] T06: Mejorar Dashboard de Docente en `LoginDemoPage.tsx` con grilla de horario semanal y tablas de cursos [commit b674a03]
- [x] T07: Verificación integral de build, paridad local/Vercel y documentación operativa de Supabase [commit 95f4e12]

## Evidence & Verification
- T01: Endpoint verificado con status 200 y JSON estructurado por nivel/curso (commit 80afbe7).
- T02: Los 9 reportes visualizados en UI mediante tablas HTML semánticas y legibles (commit e893b2b).
- T03: Botón de exportación a PDF implementado vía CSS `@media print` institucional y window.print() (commit e893b2b).
- T04: Asignaciones docentes creadas, listadas y eliminables desde UI y API (commit cb29dac).
- T05: Nuevos usuarios creados con roles demo y eliminación operativa de entidades (commit cb29dac).
- T06: Vista de docente con métricas, grilla horaria semanal Lun-Vie y nóminas tabulares (commit b674a03).
- T07: `npm run build` exitoso sin errores en 2.2s; compatibilidad dual SQLite/Postgres y script de sincronización `npm run db:migrate` documentado.
