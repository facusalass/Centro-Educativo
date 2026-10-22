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
import { Printer, Download, Search } from 'lucide-react';
import { Button } from './Button';
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

export function ReportesViewer({ alumnos, docentes }: ReportesViewerProps) {
  const [search, setSearch] = useState('');
  const [tipo, setTipo] = useState<string>('alumnos-por-curso');
  const [idConsulta, setIdConsulta] = useState<string>('');
  const [salida, setSalida] = useState<unknown>(null);
  const [estado, setEstado] = useState<string>('');
  const [fechaGeneracion, setFechaGeneracion] = useState<string>('');

  async function cargar() {
    setSalida(null);
    setEstado('Generando reporte...');
    setFechaGeneracion(new Date().toLocaleString('es-AR'));
    try {
      if (tipo === 'alumnos-por-curso') {
        setSalida(await api.getAlumnosPorCurso());
      } else if (tipo === 'alumnos-por-deporte') {
        setSalida(await api.getAlumnosPorDeporte());
      } else if (tipo === 'alumnos-por-deporte-nivel') {
        setSalida(await api.getAlumnosPorDeporteNivel());
      } else if (tipo === 'alumnos-por-deporte-detalle') {
        setSalida(await api.getAlumnosPorDeporteDetalle());
      } else if (tipo === 'alumnos-por-recorrido') {
        setSalida(await api.getAlumnosPorRecorrido());
      } else if (tipo === 'alumnos-por-materia') {
        setSalida(await api.getAlumnosPorMateria());
      } else if (tipo === 'docentes-por-nivel') {
        setSalida(await api.getDocentesPorNivel());
      } else if (tipo === 'alumno') {
        const id = idConsulta ? Number(idConsulta) : alumnos[0]?.id;
        if (!id) {
          setEstado('Selecciona un alumno.');
          return;
        }
        setSalida(await api.getReporteAlumno(id));
      } else if (tipo === 'docente') {
        const id = idConsulta ? Number(idConsulta) : docentes[0]?.id;
        if (!id) {
          setEstado('Selecciona un docente.');
          return;
        }
        setSalida(await api.getReporteDocente(id));
      }
      setEstado('Reporte actualizado.');
    } catch (error) {
      setEstado(error instanceof Error ? error.message : 'Error al generar el reporte.');
    }
  }

  useEffect(() => {
    // Reset ID default when switching to alumno or docente
    if (tipo === 'alumno' && alumnos.length > 0 && !idConsulta) {
      setIdConsulta(String(alumnos[0].id));
    } else if (tipo === 'docente' && docentes.length > 0 && !idConsulta) {
      setIdConsulta(String(docentes[0].id));
    }
    cargar();
  }, [tipo]);

  const filtered = Array.isArray(salida)
    ? salida.filter((row) =>
        JSON.stringify(row).toLocaleLowerCase().includes(search.toLocaleLowerCase()),
      )
    : salida && JSON.stringify(salida).toLocaleLowerCase().includes(search.toLocaleLowerCase())
      ? salida
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
    anchor.click();
    URL.revokeObjectURL(url);
  }
  function handlePrint() {
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
              setTipo(e.target.value);
              setIdConsulta('');
              setSearch('');
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
          <Button type="button" variant="outline" onClick={exportCsv} disabled={!filtered}>
            <Download size={16} /> Exportar CSV
          </Button>
          <Button type="button" onClick={cargar}>
            <Search size={16} /> Actualizar Reporte
          </Button>

          {filtered !== null && (
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Printer size={16} /> Guardar / Descargar PDF
            </Button>
          )}

          <span className="admin-status">{estado}</span>
        </div>
      </div>

      {filtered !== null && (
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
                  onClick={handlePrint}
                  style={{ fontSize: '0.78rem', padding: '4px 10px' }}
                >
                  <Download size={14} /> Imprimir / PDF
                </Button>
              </div>
            </div>
          </div>

          {/* RENDER REPORT TABLES BY TYPE */}
          {tipo === 'alumnos-por-curso' && renderAlumnosPorCurso(filtered as AlumnosPorCurso)}
          {tipo === 'alumnos-por-deporte' && renderAlumnosPorDeporte(filtered as AlumnosPorDeporte)}
          {tipo === 'alumnos-por-deporte-nivel' &&
            renderAlumnosPorDeporteNivel(filtered as AlumnosPorDeporteNivel)}
          {tipo === 'alumnos-por-deporte-detalle' &&
            renderAlumnosPorDeporteDetalle(filtered as AlumnosPorDeporteDetalle)}
          {tipo === 'alumnos-por-recorrido' &&
            renderAlumnosPorRecorrido(filtered as AlumnosPorRecorrido)}
          {tipo === 'alumnos-por-materia' && renderAlumnosPorMateria(filtered as AlumnosPorMateria)}
          {tipo === 'docentes-por-nivel' && renderDocentesPorNivel(filtered as DocentesPorNivel)}
          {tipo === 'alumno' && renderReporteAlumno(filtered as ReporteAlumno)}
          {tipo === 'docente' && renderReporteDocente(filtered as ReporteDocente)}
        </div>
      )}
    </section>
  );
}
