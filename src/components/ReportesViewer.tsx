import { useState, useEffect, useRef } from 'react';
import { Printer, Download, Search, X } from 'lucide-react';
import { Button } from './Button';
import { ErrorBoundary } from './ErrorBoundary';
import { ReportContent } from './reports/ReportContent';
import { useReport } from '../hooks/useReport';
import { reportDefinitions, type ReportType } from '../services/reports';
import type { Alumno, Docente } from '../types';

interface ReportesViewerProps {
  alumnos: Alumno[];
  docentes: Docente[];
}

export function ReportesViewer({ alumnos, docentes }: ReportesViewerProps) {
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState<ReportType>('alumnos-por-curso');
  const [idConsulta, setIdConsulta] = useState<string>('');
  const [previewOpen, setPreviewOpen] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const [renderErrorKey, setRenderErrorKey] = useState('');
  const targetId =
    tipo === 'alumno'
      ? idConsulta || String(alumnos[0]?.id ?? '')
      : tipo === 'docente'
        ? idConsulta || String(docentes[0]?.id ?? '')
        : '';
  const { state, reload: cargar } = useReport(tipo, targetId);
  const loading = state.status === 'loading';
  const estado =
    state.status === 'success'
      ? 'Reporte actualizado.'
      : state.status === 'loading'
        ? 'Generando reporte...'
        : state.message;
  const fechaGeneracion = state.status === 'success' ? state.generatedAt : '';
  const currentData = state.status === 'success' ? state.data : null;
  const filtered =
    currentData === null
      ? null
      : Array.isArray(currentData)
        ? currentData.filter((row) =>
            JSON.stringify(row).toLocaleLowerCase().includes(search.toLocaleLowerCase()),
          )
        : JSON.stringify(currentData).toLocaleLowerCase().includes(search.toLocaleLowerCase())
          ? currentData
          : null;
  const canExport = state.status === 'success' && filtered !== null && renderErrorKey !== state.key;

  useEffect(() => {
    setPreviewOpen(false);
  }, [state.key]);

  useEffect(() => {
    if (!previewOpen) return;
    const root = previewRef.current;
    if (!root) return;
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const buttons = root.querySelectorAll<HTMLButtonElement>('.report-preview-toolbar button');
    buttons[0]?.focus();
    const close = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setPreviewOpen(false);
      if (event.key === 'Tab') {
        const first = buttons[0],
          last = buttons[buttons.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('keydown', close);
      document.body.style.overflow = previousOverflow;
      if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [previewOpen]);

  function exportCsv() {
    if (!canExport) return;
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
            aria-label="Tipo de reporte"
            value={tipo}
            onChange={(e) => {
              const newTipo = e.target.value as ReportType;
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
              aria-label="Alumno del reporte"
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
              aria-label="Docente del reporte"
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
          <Button type="button" variant="outline" onClick={exportCsv} disabled={!canExport}>
            <Download size={16} /> Exportar CSV
          </Button>
          <Button type="button" onClick={cargar} disabled={loading}>
            <Search size={16} /> Actualizar Reporte
          </Button>

          {canExport && (
            <Button type="button" variant="outline" onClick={openPreview}>
              <Printer size={16} /> Guardar / Descargar PDF
            </Button>
          )}

          <span className="admin-status" role={state.status === 'error' ? 'alert' : 'status'}>
            {estado}
          </span>
        </div>
      </div>

      <ErrorBoundary key={state.key} onReset={cargar} onError={() => setRenderErrorKey(state.key)}>
        {loading ? (
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
          <div
            ref={previewRef}
            className={previewOpen ? 'report-preview-overlay' : 'report-preview-inline'}
            role={previewOpen ? 'dialog' : undefined}
            aria-modal={previewOpen || undefined}
            aria-label={previewOpen ? 'Vista previa del reporte' : undefined}
          >
            {previewOpen && (
              <div className="report-preview-toolbar no-print">
                <div>
                  <strong>Vista previa</strong>
                  <span>{reportDefinitions[tipo]}</span>
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
                    {reportDefinitions[tipo]}
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

              <ReportContent type={tipo} data={filtered} />
            </div>
          </div>
        ) : state.status === 'success' ? (
          <p role="status">No hay resultados para la búsqueda.</p>
        ) : null}
      </ErrorBoundary>
    </section>
  );
}
