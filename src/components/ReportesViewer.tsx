import {
  renderAlumnosPorCurso,
  renderAlumnosPorDeporte,
  renderAlumnosPorDeporteNivel,
  renderAlumnosPorDeporteDetalle,
  renderAlumnosPorRecorrido,
  renderAlumnosPorMateria,
  renderDocentesPorNivel,
  renderReporteAlumno,
  renderReporteDocente,
} from './reports/renderers';
import { useState, useEffect } from 'react';
import { Printer, Download, Search, X } from 'lucide-react';
import { Button } from './Button';
import { ErrorBoundary } from './ErrorBoundary';
import { api } from '../services/api';
import type {
  Alumno,
  Docente,
  ReporteAlumno,
  ReporteDocente,
  AlumnosPorDeporte,
  AlumnosPorDeporteNivel,
  AlumnosPorDeporteDetalle,
  AlumnosPorRecorrido,
  AlumnosPorMateria,
  DocentesPorNivel,
  AlumnosPorCurso,
} from '../types';

interface ReportesViewerProps {
  alumnos: Alumno[];
  docentes: Docente[];
}

interface ReportState {
  tipo: string;
  data: unknown;
}

export function ReportesViewer({ alumnos, docentes }: ReportesViewerProps) {
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState<string>('alumnos-por-curso');
  const [idConsulta, setIdConsulta] = useState<string>('');
  const [reportState, setReportState] = useState<ReportState | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [estado, setEstado] = useState<string>('');
  const [fechaGeneracion, setFechaGeneracion] = useState<string>('');
  const [reloadTrigger, setReloadTrigger] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);

  function cargar() {
    setReloadTrigger((prev) => prev + 1);
  }

  useEffect(() => {
    let active = true;

    async function cargarReporte() {
      setLoading(true);
      setEstado('Generando reporte...');
      setFechaGeneracion(new Date().toLocaleString('es-AR'));

      const targetId =
        idConsulta ||
        (tipo === 'alumno'
          ? alumnos[0]?.id
            ? String(alumnos[0].id)
            : ''
          : tipo === 'docente'
            ? docentes[0]?.id
              ? String(docentes[0].id)
              : ''
            : '');

      try {
        let result: unknown = null;
        if (tipo === 'alumnos-por-curso') {
          result = await api.getAlumnosPorCurso();
        } else if (tipo === 'alumnos-por-deporte') {
          result = await api.getAlumnosPorDeporte();
        } else if (tipo === 'alumnos-por-deporte-nivel') {
          result = await api.getAlumnosPorDeporteNivel();
        } else if (tipo === 'alumnos-por-deporte-detalle') {
          result = await api.getAlumnosPorDeporteDetalle();
        } else if (tipo === 'alumnos-por-recorrido') {
          result = await api.getAlumnosPorRecorrido();
        } else if (tipo === 'alumnos-por-materia') {
          result = await api.getAlumnosPorMateria();
        } else if (tipo === 'docentes-por-nivel') {
          result = await api.getDocentesPorNivel();
        } else if (tipo === 'alumno') {
          const id = targetId ? Number(targetId) : undefined;
          if (!id) {
            if (active) {
              setEstado('Selecciona un alumno.');
              setLoading(false);
            }
            return;
          }
          result = await api.getReporteAlumno(id);
        } else if (tipo === 'docente') {
          const id = targetId ? Number(targetId) : undefined;
          if (!id) {
            if (active) {
              setEstado('Selecciona un docente.');
              setLoading(false);
            }
            return;
          }
          result = await api.getReporteDocente(id);
        }

        if (!active) return;
        setReportState({ tipo, data: result });
        setEstado('Reporte actualizado.');
      } catch (error) {
        if (!active) return;
        setEstado(error instanceof Error ? error.message : 'Error al generar el reporte.');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    cargarReporte();

    return () => {
      active = false;
    };
  }, [tipo, idConsulta, reloadTrigger, alumnos, docentes]);

  const isDataMatching = reportState !== null && reportState.tipo === tipo;
  const currentData = isDataMatching ? reportState.data : null;

  const filtered =
    !isDataMatching || currentData === null
      ? null
      : Array.isArray(currentData)
        ? currentData.filter((row) =>
            JSON.stringify(row).toLocaleLowerCase().includes(search.toLocaleLowerCase()),
          )
        : JSON.stringify(currentData).toLocaleLowerCase().includes(search.toLocaleLowerCase())
          ? currentData
          : null;

  function exportCsv() {
    const rows = [...document.querySelectorAll('#printable-report table tr')]
      .map((row) =>
        [...row.querySelectorAll('th,td')]
          .map((cell) => {
            let text = cell.textContent?.trim() || '';
            if (/^[=+@-]/.test(text)) text = "'" + text;
            return '"' + text.replace(/"/g, '""') + '"';
          })
          .join(';'),
      )
      .join('\r\n');
    const url = URL.createObjectURL(
      new Blob(['\uFEFF' + rows], { type: 'text/csv;charset=utf-8' }),
    );
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `reporte-${tipo}.csv`;
    anchor.style.display = 'none';
    // The anchor has to live in the document for every engine to start the
    // download, and the object URL has to outlive the click: revoking it
    // synchronously can cancel the transfer before the browser reads the blob.
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function openPreview() {
    setPreviewOpen(true);
  }

  function confirmPrint() {
    window.print();
  }

  const reportTitles: Record<string, string> = {
    'alumnos-por-curso': 'Nómina de Alumnos por Curso y División',
    'alumnos-por-deporte': 'Nómina de Alumnos por Deporte y Comisiones',
    'alumnos-por-deporte-nivel': 'Nómina de Alumnos por Deporte y Nivel Educativo',
    'alumnos-por-deporte-detalle': 'Nómina de Deportes por Horario y Docente a Cargo',
    'alumnos-por-recorrido': 'Nómina de Alumnos por Recorrido de Transporte',
    'alumnos-por-materia': 'Nómina de Alumnos por Materia y Docente',
    'docentes-por-nivel': 'Planta Docente por Nivel Educativo y Cursos',
    alumno: 'Ficha y Legajo Integral del Alumno',
    docente: 'Carga Horaria y Asignaciones del Docente',
  };

  return (
    <section className="admin-section reportes-section">
      <div className="no-print">
        <h2>Reportes Institucionales</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
          Consultas consolidadas para la toma de decisiones y reportes oficiales del
          establecimiento.
        </p>

        <div
          className="reportes-controls"
          style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}
        >
          <select
            value={tipo}
            onChange={(e) => {
              const newTipo = e.target.value;
              setTipo(newTipo);
              if (newTipo === 'alumno') {
                setIdConsulta(alumnos[0] ? String(alumnos[0].id) : '');
              } else if (newTipo === 'docente') {
                setIdConsulta(docentes[0] ? String(docentes[0].id) : '');
              } else {
                setIdConsulta('');
              }
              setSearch('');
              setPreviewOpen(false);
            }}
          >
            <option value="alumnos-por-curso">1. Alumnos por Curso / Grado</option>
            <option value="alumnos-por-deporte">2. Alumnos por Deporte</option>
            <option value="alumnos-por-deporte-nivel">3. Alumnos por Deporte y Nivel</option>
            <option value="alumnos-por-deporte-detalle">
              4. Alumnos por Deporte, Horario y Profesor
            </option>
            <option value="alumnos-por-recorrido">5. Alumnos por Recorrido de Transporte</option>
            <option value="alumnos-por-materia">6. Alumnos por Materia y Docente</option>
            <option value="docentes-por-nivel">7. Docentes por Nivel Educativo</option>
            <option value="alumno">8. Ficha Integral por Alumno</option>
            <option value="docente">9. Carga Horaria por Docente</option>
          </select>

          {tipo === 'alumno' && (
            <select
              value={idConsulta || (alumnos[0] ? String(alumnos[0].id) : '')}
              onChange={(e) => setIdConsulta(e.target.value)}
            >
              {alumnos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.apellido}, {a.nombre} ({a.nivel} - {a.curso})
                </option>
              ))}
            </select>
          )}

          {tipo === 'docente' && (
            <select
              value={idConsulta || (docentes[0] ? String(docentes[0].id) : '')}
              onChange={(e) => setIdConsulta(e.target.value)}
            >
              {docentes.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.apellido}, {d.nombre} ({d.especialidad})
                </option>
              ))}
            </select>
          )}

          <input
            aria-label="Buscar en el reporte"
            placeholder="Buscar por nivel, curso o apellido…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={exportCsv}
            disabled={!filtered || loading || !isDataMatching}
          >
            <Download size={16} /> Exportar CSV
          </Button>
          <Button type="button" onClick={cargar} disabled={loading}>
            <Search size={16} /> Actualizar Reporte
          </Button>

          {filtered !== null && isDataMatching && !loading && (
            <Button type="button" variant="outline" onClick={openPreview}>
              <Printer size={16} /> Guardar / Descargar PDF
            </Button>
          )}

          <span className="admin-status">{estado}</span>
        </div>
      </div>

      <ErrorBoundary key={tipo} onReset={cargar}>
        {loading || !isDataMatching ? (
          <div
            className="report-loading-container"
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              background: 'var(--white, #fff)',
              borderRadius: '8px',
              border: '1px solid var(--gray-200, #e2e8f0)',
              marginTop: '16px',
            }}
          >
            <p
              style={{
                margin: 0,
                color: 'var(--gray-600, #475569)',
                fontSize: '1rem',
                fontWeight: 500,
              }}
            >
              Generando reporte...
            </p>
          </div>
        ) : filtered !== null ? (
          <div className={previewOpen ? 'report-preview-overlay' : 'report-preview-inline'}>
            {previewOpen && (
              <div className="report-preview-toolbar no-print">
                <div>
                  <strong>Vista previa</strong>
                  <span>{reportTitles[tipo] ?? 'Reporte Institucional'}</span>
                </div>
                <div className="report-preview-actions">
                  <Button type="button" onClick={confirmPrint}>
                    <Printer size={16} /> Imprimir
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setPreviewOpen(false)}>
                    <X size={16} /> Cerrar
                  </Button>
                </div>
              </div>
            )}
            <div id="printable-report" className="report-container">
              <div className="report-header-print">
                <div>
                  <h3 className="report-institution-title">
                    CENTRO EDUCATIVO "EDUCAR PARA TRANSFORMAR"
                  </h3>
                  <p className="report-subtitle">
                    Sistema de Gestión Web Institucional • Resistencia, Chaco
                  </p>
                  <h4 style={{ margin: '8px 0 0 0', color: 'var(--blue-800)', fontSize: '1.1rem' }}>
                    {reportTitles[tipo] ?? 'Reporte Institucional'}
                  </h4>
                </div>
                <div className="report-meta">
                  <div>
                    <strong>Fecha de emisión:</strong> {fechaGeneracion}
                  </div>
                  <div>
                    <strong>Documento:</strong> Oficial Interno
                  </div>
                  <div className="no-print" style={{ marginTop: '8px' }}>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={openPreview}
                      style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                    >
                      <Download size={14} /> Imprimir / PDF
                    </Button>
                  </div>
                </div>
              </div>

              {/* RENDER REPORT TABLES BY TYPE */}
              {tipo === 'alumnos-por-curso' && renderAlumnosPorCurso(filtered as AlumnosPorCurso)}
              {tipo === 'alumnos-por-deporte' &&
                renderAlumnosPorDeporte(filtered as AlumnosPorDeporte)}
              {tipo === 'alumnos-por-deporte-nivel' &&
                renderAlumnosPorDeporteNivel(filtered as AlumnosPorDeporteNivel)}
              {tipo === 'alumnos-por-deporte-detalle' &&
                renderAlumnosPorDeporteDetalle(filtered as AlumnosPorDeporteDetalle)}
              {tipo === 'alumnos-por-recorrido' &&
                renderAlumnosPorRecorrido(filtered as AlumnosPorRecorrido)}
              {tipo === 'alumnos-por-materia' &&
                renderAlumnosPorMateria(filtered as AlumnosPorMateria)}
              {tipo === 'docentes-por-nivel' &&
                renderDocentesPorNivel(filtered as DocentesPorNivel)}
              {tipo === 'alumno' && renderReporteAlumno(filtered as ReporteAlumno)}
              {tipo === 'docente' && renderReporteDocente(filtered as ReporteDocente)}
            </div>
          </div>
        ) : null}
      </ErrorBoundary>
    </section>
  );
}
