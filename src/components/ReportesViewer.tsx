import { useState, useEffect } from 'react';
import { Printer, Download, Search, FileText } from 'lucide-react';
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
  const [tipo, setTipo] = useState<string>('alumnos-por-curso');
  const [idConsulta, setIdConsulta] = useState<string>('');
  const [salida, setSalida] = useState<unknown>(null);
  const [estado, setEstado] = useState<string>('');
  const [fechaGeneracion, setFechaGeneracion] = useState<string>('');

  async function cargar() {
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
    'alumno': 'Ficha y Legajo Integral del Alumno',
    'docente': 'Carga Horaria y Asignaciones del Docente',
  };

  return (
    <section className="admin-section reportes-section">
      <div className="no-print">
        <h2>Reportes Institucionales</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: '16px' }}>
          Consultas consolidadas para la toma de decisiones y reportes oficiales del establecimiento.
        </p>

        <div className="reportes-controls" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}>
          <select value={tipo} onChange={(e) => { setTipo(e.target.value); setIdConsulta(''); }}>
            <option value="alumnos-por-curso">1. Alumnos por Curso / Grado</option>
            <option value="alumnos-por-deporte">2. Alumnos por Deporte</option>
            <option value="alumnos-por-deporte-nivel">3. Alumnos por Deporte y Nivel</option>
            <option value="alumnos-por-deporte-detalle">4. Alumnos por Deporte, Horario y Profesor</option>
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

          <Button type="button" onClick={cargar}>
            <Search size={16} /> Actualizar Reporte
          </Button>

          {salida !== null && (
            <Button type="button" variant="outline" onClick={handlePrint}>
              <Printer size={16} /> Guardar / Descargar PDF
            </Button>
          )}

          <span className="admin-status">{estado}</span>
        </div>
      </div>

      {salida !== null && (
        <div id="printable-report" className="report-container">
          <div className="report-header-print">
            <div>
              <h3 className="report-institution-title">CENTRO EDUCATIVO "EDUCAR PARA TRANSFORMAR"</h3>
              <p className="report-subtitle">Sistema de Gestión Web Institucional • Resistencia, Chaco</p>
              <h4 style={{ margin: '8px 0 0 0', color: 'var(--blue-800)', fontSize: '1.1rem' }}>
                {reportTitles[tipo] ?? 'Reporte Institucional'}
              </h4>
            </div>
            <div className="report-meta">
              <div><strong>Fecha de emisión:</strong> {fechaGeneracion}</div>
              <div><strong>Documento:</strong> Oficial Interno</div>
              <div className="no-print" style={{ marginTop: '8px' }}>
                <Button type="button" variant="outline" onClick={handlePrint} style={{ fontSize: '0.78rem', padding: '4px 10px' }}>
                  <Download size={14} /> Imprimir / PDF
                </Button>
              </div>
            </div>
          </div>

          {/* RENDER REPORT TABLES BY TYPE */}
          {tipo === 'alumnos-por-curso' && renderAlumnosPorCurso(salida as AlumnosPorCurso)}
          {tipo === 'alumnos-por-deporte' && renderAlumnosPorDeporte(salida as AlumnosPorDeporte)}
          {tipo === 'alumnos-por-deporte-nivel' && renderAlumnosPorDeporteNivel(salida as AlumnosPorDeporteNivel)}
          {tipo === 'alumnos-por-deporte-detalle' && renderAlumnosPorDeporteDetalle(salida as AlumnosPorDeporteDetalle)}
          {tipo === 'alumnos-por-recorrido' && renderAlumnosPorRecorrido(salida as AlumnosPorRecorrido)}
          {tipo === 'alumnos-por-materia' && renderAlumnosPorMateria(salida as AlumnosPorMateria)}
          {tipo === 'docentes-por-nivel' && renderDocentesPorNivel(salida as DocentesPorNivel)}
          {tipo === 'alumno' && renderReporteAlumno(salida as ReporteAlumno)}
          {tipo === 'docente' && renderReporteDocente(salida as ReporteDocente)}
        </div>
      )}
    </section>
  );
}

// 1. Alumnos por Curso
function renderAlumnosPorCurso(cursos: AlumnosPorCurso) {
  if (!cursos || cursos.length === 0) {
    return <p>No hay cursos con alumnos registrados.</p>;
  }

  return (
    <div>
      {cursos.map((c, i) => (
        <div key={i} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f8fafc', padding: '8px 14px', borderRadius: '6px', borderLeft: '4px solid var(--blue-700)' }}>
            <strong>{c.nivel} — {c.anio} "{c.division}"</strong>
            <span className="badge badge-blue">Turno {c.turno} • {c.alumnos.length} Alumnos</span>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Legajo</th>
                  <th>Apellido y Nombre</th>
                  <th>DNI</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                </tr>
              </thead>
              <tbody>
                {c.alumnos.length > 0 ? (
                  c.alumnos.map((a, idx) => (
                    <tr key={a.id || idx}>
                      <td>{idx + 1}</td>
                      <td><strong>{a.legajo || '—'}</strong></td>
                      <td>{a.apellido}, {a.nombre}</td>
                      <td>{a.dni || '—'}</td>
                      <td>{a.email || '—'}</td>
                      <td>{a.telefono || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Sin alumnos inscriptos en este curso.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// 2. Alumnos por Deporte
function renderAlumnosPorDeporte(deportes: AlumnosPorDeporte) {
  if (!deportes || deportes.length === 0) return <p>No hay deportes registrados.</p>;

  return (
    <div>
      {deportes.map((dep, i) => (
        <div key={i} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 14px', borderRadius: '6px', borderLeft: '4px solid var(--green-600)' }}>
            <strong>Deporte: {dep.deporte}</strong>
            <span className="badge badge-green">
              Docente a cargo: {dep.profesor ? `${dep.profesor.apellido}, ${dep.profesor.nombre}` : 'Sin asignar'}
            </span>
          </div>

          {dep.grupos.map((grp, gi) => (
            <div key={gi} style={{ marginTop: '10px', marginLeft: '12px' }}>
              <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gray-700)', marginBottom: '4px' }}>
                • Grupo {grp.nivel} — {grp.dia} ({grp.horario})
                {grp.profesor && <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: '8px' }}>Prof. {grp.profesor.apellido}</span>}
              </div>

              <div className="report-table-wrapper">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Legajo</th>
                      <th>Alumno</th>
                      <th>Curso / Año</th>
                      <th>Nivel</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grp.alumnos.length > 0 ? (
                      grp.alumnos.map((a, ai) => (
                        <tr key={ai}>
                          <td><strong>{a.legajo}</strong></td>
                          <td>{a.apellido}, {a.nombre}</td>
                          <td>{a.curso || '—'}</td>
                          <td>{a.nivel || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Sin alumnos inscriptos en este grupo.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

// 3. Alumnos por Deporte y Nivel
function renderAlumnosPorDeporteNivel(data: AlumnosPorDeporteNivel) {
  if (!data || data.length === 0) return <p>No hay datos disponibles.</p>;

  return (
    <div className="report-table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Deporte</th>
            <th>Nivel</th>
            <th>Total Inscriptos</th>
            <th>Alumnos Inscriptos</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, i) => (
            <tr key={i}>
              <td><strong>{item.deporte}</strong></td>
              <td><span className="badge badge-blue">{item.nivel}</span></td>
              <td><strong>{item.alumnos.length}</strong></td>
              <td>
                {item.alumnos.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.85rem' }}>
                    {item.alumnos.map((a, ai) => (
                      <li key={ai}>{a.apellido}, {a.nombre} ({a.legajo}) - {a.curso}</li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ color: 'var(--gray-500)' }}>Sin inscriptos</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 4. Alumnos por Deporte, Horario y Docente
function renderAlumnosPorDeporteDetalle(grupos: AlumnosPorDeporteDetalle) {
  if (!grupos || grupos.length === 0) return <p>No hay grupos deportivos configurados.</p>;

  return (
    <div className="report-table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Deporte</th>
            <th>Nivel</th>
            <th>Día y Horario</th>
            <th>Profesor a Cargo</th>
            <th>Inscriptos</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map((g, i) => (
            <tr key={i}>
              <td><strong>{g.deporte || 'Deporte'}</strong></td>
              <td><span className="badge badge-blue">{g.nivel}</span></td>
              <td>{g.dia} ({g.horario})</td>
              <td>{g.profesor ? `${g.profesor.apellido}, ${g.profesor.nombre}` : 'Sin asignar'}</td>
              <td>
                {g.alumnos.length > 0 ? (
                  <span><strong>{g.alumnos.length} alumnos:</strong> {g.alumnos.map((a) => `${a.apellido}, ${a.nombre}`).join('; ')}</span>
                ) : (
                  <span style={{ color: 'var(--gray-500)' }}>0 inscriptos</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 5. Alumnos por Recorrido
function renderAlumnosPorRecorrido(recorridos: AlumnosPorRecorrido) {
  if (!recorridos || recorridos.length === 0) return <p>No hay recorridos configurados.</p>;

  return (
    <div>
      {recorridos.map((r, i) => (
        <div key={i} style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', padding: '8px 14px', borderRadius: '6px', borderLeft: '4px solid var(--amber-500)' }}>
            <strong>Recorrido: {r.recorrido} ({r.zona})</strong>
            <span className="badge badge-amber">Horario: {r.horario} • {r.alumnos.length} Pasajeros</span>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Legajo</th>
                  <th>Alumno</th>
                  <th>Curso / División</th>
                  <th>Nivel</th>
                </tr>
              </thead>
              <tbody>
                {r.alumnos.length > 0 ? (
                  r.alumnos.map((a, ai) => (
                    <tr key={ai}>
                      <td><strong>{a.legajo}</strong></td>
                      <td>{a.apellido}, {a.nombre}</td>
                      <td>{a.curso || '—'}</td>
                      <td>{a.nivel || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>No hay alumnos inscriptos en esta ruta.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// 6. Alumnos por Materia
function renderAlumnosPorMateria(materias: AlumnosPorMateria) {
  if (!materias || materias.length === 0) return <p>No hay materias asignadas.</p>;

  return (
    <div className="report-table-wrapper">
      <table className="report-table">
        <thead>
          <tr>
            <th>Materia</th>
            <th>Nivel / Curso</th>
            <th>Docente Responsable</th>
            <th>Alumnos Matriculados</th>
          </tr>
        </thead>
        <tbody>
          {materias.map((m, i) => (
            <tr key={i}>
              <td><strong>{m.materia}</strong></td>
              <td>{m.nivel} - {m.curso}</td>
              <td>{m.profesor || 'Sin docente'}</td>
              <td>
                <strong>{m.alumnos.length} alumnos:</strong>
                {m.alumnos.length > 0 && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)', display: 'block', marginTop: '4px' }}>
                    {m.alumnos.map((a) => `${a.apellido} (${a.legajo})`).join(', ')}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 7. Docentes por Nivel
function renderDocentesPorNivel(niveles: DocentesPorNivel) {
  if (!niveles || niveles.length === 0) return <p>No hay asignaciones registradas.</p>;

  return (
    <div>
      {niveles.map((n, i) => (
        <div key={i} style={{ marginBottom: '24px' }}>
          <div style={{ background: '#f8fafc', padding: '8px 14px', borderRadius: '6px', borderLeft: '4px solid var(--blue-700)', marginBottom: '8px' }}>
            <strong>Nivel Educativo: {n.nivel}</strong>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Docente</th>
                  <th>Materias Asignadas</th>
                  <th>Cursos a Cargo</th>
                </tr>
              </thead>
              <tbody>
                {n.docentes.length > 0 ? (
                  n.docentes.map((d, di) => (
                    <tr key={di}>
                      <td><strong>{d.profesor || 'Docente'}</strong></td>
                      <td>{d.materias.join(', ') || '—'}</td>
                      <td>{d.cursos.filter(Boolean).join(', ') || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan={3} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>Sin docentes asignados en este nivel.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

// 8. Ficha Integral por Alumno
function renderReporteAlumno(data: ReporteAlumno) {
  if (!data || !data.alumno) return <p>Alumno no encontrado.</p>;

  const { alumno, curso, materias, deportes, transporte, comedor } = data;

  return (
    <div>
      <div className="report-card-summary">
        <h4>Datos del Alumno: {alumno.apellido}, {alumno.nombre}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.88rem' }}>
          <div><strong>Legajo:</strong> {alumno.legajo}</div>
          <div><strong>DNI:</strong> {alumno.dni}</div>
          <div><strong>Nivel:</strong> {alumno.nivel}</div>
          <div><strong>Curso/División:</strong> {curso ? `${curso.anio} "${curso.division}" (${curso.turno})` : `${alumno.curso} ${alumno.division}`}</div>
          <div><strong>Tutor:</strong> {alumno.tutor_nombre || '—'}</div>
          <div><strong>Contacto Tutor:</strong> {alumno.tutor_telefono || alumno.tutor_email || '—'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>1. Materias y Horarios Académicos</strong>
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Día y Horario</th>
                <th>Profesor</th>
              </tr>
            </thead>
            <tbody>
              {materias.length > 0 ? (
                materias.map((m, i) => (
                  <tr key={i}>
                    <td><strong>{m.materia}</strong></td>
                    <td>{m.dia} {m.horario}</td>
                    <td>{m.profesor ? `${m.profesor.apellido}, ${m.profesor.nombre}` : 'Sin asignar'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} style={{ color: 'var(--gray-500)' }}>No tiene materias asignadas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>2. Deportes Inscriptos (Máximo 2)</strong>
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Deporte</th>
                <th>Día y Horario</th>
                <th>Profesor a Cargo</th>
              </tr>
            </thead>
            <tbody>
              {deportes.length > 0 ? (
                deportes.map((d, i) => (
                  <tr key={i}>
                    <td><strong>{d.deporte?.nombre || 'Deporte'}</strong></td>
                    <td>{d.dia} {d.horario}</td>
                    <td>{d.profesor ? `${d.profesor.apellido}, ${d.profesor.nombre}` : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={3} style={{ color: 'var(--gray-500)' }}>No está inscripto en actividades deportivas.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <strong>3. Servicios Complementarios</strong>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <div style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: '6px' }}>
            <strong>Transporte Escolar:</strong>{' '}
            {transporte.length > 0 ? (
              transporte.map((t, i) => <span key={i} className="badge badge-amber">{t.nombre} ({t.horario})</span>)
            ) : (
              <span style={{ color: 'var(--gray-500)' }}>No utiliza transporte escolar</span>
            )}
          </div>
          <div style={{ flex: 1, padding: '12px', background: '#f8fafc', border: '1px solid var(--gray-200)', borderRadius: '6px' }}>
            <strong>Servicio de Comedor:</strong>{' '}
            {comedor ? (
              <span className="badge badge-green">Inscripto al comedor escolar</span>
            ) : (
              <span style={{ color: 'var(--gray-500)' }}>No inscripto</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// 9. Carga Horaria y Asignaciones del Docente
function renderReporteDocente(data: ReporteDocente) {
  if (!data || !data.docente) return <p>Docente no encontrado.</p>;

  const { docente, cursos, materiasACargo, gruposDeporte } = data;

  return (
    <div>
      <div className="report-card-summary">
        <h4>Docente: {docente.apellido}, {docente.nombre}</h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.88rem' }}>
          <div><strong>Legajo:</strong> {docente.legajo || '—'}</div>
          <div><strong>DNI:</strong> {docente.dni || '—'}</div>
          <div><strong>Especialidad:</strong> {docente.especialidad}</div>
          <div><strong>Email:</strong> {docente.email}</div>
          <div><strong>Teléfono:</strong> {docente.telefono || '—'}</div>
          <div><strong>Materias:</strong> {materiasACargo.join(', ') || '—'}</div>
        </div>
      </div>

      <div style={{ marginBottom: '16px' }}>
        <strong>Cursos y Horarios Académicos Asignados</strong>
        <div className="report-table-wrapper">
          <table className="report-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Curso / División</th>
                <th>Turno</th>
                <th>Día y Horario</th>
                <th>Cant. Alumnos</th>
              </tr>
            </thead>
            <tbody>
              {cursos.length > 0 ? (
                cursos.map((c, i) => (
                  <tr key={i}>
                    <td><strong>{c.materia}</strong></td>
                    <td>{c.curso ? `${c.curso.nivel} - ${c.curso.anio} "${c.curso.division}"` : '—'}</td>
                    <td>{c.curso?.turno || '—'}</td>
                    <td>{c.dia} {c.horario}</td>
                    <td><span className="badge badge-blue">{c.alumnos.length} alumnos</span></td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={5} style={{ color: 'var(--gray-500)' }}>Sin cursos académicos asignados.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {gruposDeporte.length > 0 && (
        <div>
          <strong>Grupos Deportivos a Cargo</strong>
          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Deporte</th>
                  <th>Nivel</th>
                  <th>Día y Horario</th>
                </tr>
              </thead>
              <tbody>
                {gruposDeporte.map((g, i) => (
                  <tr key={i}>
                    <td><strong>{g.deporte?.nombre || 'Deporte'}</strong></td>
                    <td>{g.grupo.nivel}</td>
                    <td>{g.grupo.dia} ({g.grupo.horario})</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
