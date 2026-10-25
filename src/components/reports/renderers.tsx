import type {
  ReporteAlumno,
  ReporteDocente,
  AlumnosPorDeporte,
  AlumnosPorDeporteNivel,
  AlumnosPorDeporteDetalle,
  AlumnosPorRecorrido,
  AlumnosPorMateria,
  DocentesPorNivel,
  AlumnosPorCurso,
} from '../../types';
// 1. Alumnos por Curso
export function renderAlumnosPorCurso(cursos: AlumnosPorCurso) {
  if (!cursos || cursos.length === 0) {
    return <p>No hay cursos con alumnos registrados.</p>;
  }

  return (
    <div>
      {cursos.map((c, i) => (
        <div key={i} style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f8fafc',
              padding: '8px 14px',
              borderRadius: '6px',
              borderLeft: '4px solid var(--blue-700)',
            }}
          >
            <strong>
              {c.nivel} — {c.anio} "{c.division}"
            </strong>
            <span className="badge badge-blue">
              Turno {c.turno} • {c.alumnos.length} Alumnos
            </span>
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
                      <td>
                        <strong>{a.legajo || '—'}</strong>
                      </td>
                      <td>
                        {a.apellido}, {a.nombre}
                      </td>
                      <td>{a.dni || '—'}</td>
                      <td>{a.email || '—'}</td>
                      <td>{a.telefono || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                      Sin alumnos inscriptos en este curso.
                    </td>
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
export function renderAlumnosPorDeporte(deportes: AlumnosPorDeporte) {
  if (!deportes || deportes.length === 0) return <p>No hay deportes registrados.</p>;

  return (
    <div>
      {deportes.map((dep, i) => (
        <div key={i} style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '8px 14px',
              borderRadius: '6px',
              borderLeft: '4px solid var(--green-600)',
            }}
          >
            <strong>Deporte: {dep.deporte}</strong>
            <span className="badge badge-green">
              Docente a cargo:{' '}
              {dep.profesor ? `${dep.profesor.apellido}, ${dep.profesor.nombre}` : 'Sin asignar'}
            </span>
          </div>

          {dep.grupos.map((grp, gi) => (
            <div key={gi} style={{ marginTop: '10px', marginLeft: '12px' }}>
              <div
                style={{
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  color: 'var(--gray-700)',
                  marginBottom: '4px',
                }}
              >
                • Grupo {grp.nivel} — {grp.dia} ({grp.horario})
                {grp.profesor && (
                  <span style={{ fontWeight: 400, color: 'var(--gray-500)', marginLeft: '8px' }}>
                    Prof. {grp.profesor.apellido}
                  </span>
                )}
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
                          <td>
                            <strong>{a.legajo}</strong>
                          </td>
                          <td>
                            {a.apellido}, {a.nombre}
                          </td>
                          <td>{a.curso || '—'}</td>
                          <td>{a.nivel || '—'}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                          Sin alumnos inscriptos en este grupo.
                        </td>
                      </tr>
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
export function renderAlumnosPorDeporteNivel(data: AlumnosPorDeporteNivel) {
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
              <td>
                <strong>{item.deporte}</strong>
              </td>
              <td>
                <span className="badge badge-blue">{item.nivel}</span>
              </td>
              <td>
                <strong>{item.alumnos.length}</strong>
              </td>
              <td>
                {item.alumnos.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.85rem' }}>
                    {item.alumnos.map((a, ai) => (
                      <li key={ai}>
                        {a.apellido}, {a.nombre} ({a.legajo}) - {a.curso}
                      </li>
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
export function renderAlumnosPorDeporteDetalle(grupos: AlumnosPorDeporteDetalle) {
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
              <td>
                <strong>{g.deporte || 'Deporte'}</strong>
              </td>
              <td>
                <span className="badge badge-blue">{g.nivel}</span>
              </td>
              <td>
                {g.dia} ({g.horario})
              </td>
              <td>{g.profesor ? `${g.profesor.apellido}, ${g.profesor.nombre}` : 'Sin asignar'}</td>
              <td>
                {g.alumnos.length > 0 ? (
                  <span>
                    <strong>{g.alumnos.length} alumnos:</strong>{' '}
                    {g.alumnos.map((a) => `${a.apellido}, ${a.nombre}`).join('; ')}
                  </span>
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
export function renderAlumnosPorRecorrido(recorridos: AlumnosPorRecorrido) {
  if (!recorridos || recorridos.length === 0) return <p>No hay recorridos configurados.</p>;

  return (
    <div>
      {recorridos.map((r, i) => (
        <div key={i} style={{ marginBottom: '24px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#f8fafc',
              padding: '8px 14px',
              borderRadius: '6px',
              borderLeft: '4px solid var(--amber-500)',
            }}
          >
            <strong>
              Recorrido: {r.recorrido} ({r.zona})
            </strong>
            <span className="badge badge-amber">
              Horario: {r.horario} • {r.alumnos.length} Pasajeros
            </span>
          </div>

          <div className="report-table-wrapper">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Legajo</th>
                  <th>Alumno</th>
                  <th>Curso / División</th>
                  <th>Nivel</th>
                  <th>Domicilio</th>
                </tr>
              </thead>
              <tbody>
                {r.alumnos.length > 0 ? (
                  r.alumnos.map((a, ai) => (
                    <tr key={ai}>
                      <td>
                        <strong>{a.legajo}</strong>
                      </td>
                      <td>
                        {a.apellido}, {a.nombre}
                      </td>
                      <td>{a.curso || '—'}</td>
                      <td>{a.nivel || '—'}</td>
                      <td>{a.domicilio || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                      No hay alumnos inscriptos en esta ruta.
                    </td>
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

// 6. Alumnos por Materia
export function renderAlumnosPorMateria(materias: AlumnosPorMateria) {
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
              <td>
                <strong>{m.materia}</strong>
              </td>
              <td>
                {m.nivel} - {m.curso}
              </td>
              <td>{m.profesor || 'Sin docente'}</td>
              <td>
                <strong>{m.alumnos.length} alumnos:</strong>
                {m.alumnos.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.85rem',
                      color: 'var(--gray-600)',
                      display: 'block',
                      marginTop: '4px',
                    }}
                  >
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
export function renderDocentesPorNivel(niveles: DocentesPorNivel) {
  if (!niveles || niveles.length === 0) return <p>No hay asignaciones registradas.</p>;

  return (
    <div>
      {niveles.map((n, i) => (
        <div key={i} style={{ marginBottom: '24px' }}>
          <div
            style={{
              background: '#f8fafc',
              padding: '8px 14px',
              borderRadius: '6px',
              borderLeft: '4px solid var(--blue-700)',
              marginBottom: '8px',
            }}
          >
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
                      <td>
                        <strong>{d.profesor || 'Docente'}</strong>
                      </td>
                      <td>{d.materias.join(', ') || '—'}</td>
                      <td>{d.cursos.filter(Boolean).join(', ') || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                      Sin docentes asignados en este nivel.
                    </td>
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

// 8. Ficha Integral por Alumno
export function renderReporteAlumno(data: ReporteAlumno) {
  if (!data || !data.alumno) return <p>Alumno no encontrado.</p>;

  const { alumno, curso, materias, deportes, transporte, comedor } = data;

  return (
    <div>
      <div className="report-card-summary">
        <h4>
          Datos del Alumno: {alumno.apellido}, {alumno.nombre}
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px',
            fontSize: '0.88rem',
          }}
        >
          <div>
            <strong>Legajo:</strong> {alumno.legajo}
          </div>
          <div>
            <strong>DNI:</strong> {alumno.dni}
          </div>
          <div>
            <strong>Nivel:</strong> {alumno.nivel}
          </div>
          <div>
            <strong>Curso/División:</strong>{' '}
            {curso
              ? `${curso.anio} "${curso.division}" (${curso.turno})`
              : `${alumno.curso} ${alumno.division}`}
          </div>
          <div>
            <strong>Tutor:</strong> {alumno.tutor_nombre || '—'}
          </div>
          <div>
            <strong>Contacto Tutor:</strong> {alumno.tutor_telefono || alumno.tutor_email || '—'}
          </div>
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
                    <td>
                      <strong>{m.materia}</strong>
                    </td>
                    <td>
                      {m.dia} {m.horario}
                    </td>
                    <td>
                      {m.profesor ? `${m.profesor.apellido}, ${m.profesor.nombre}` : 'Sin asignar'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ color: 'var(--gray-500)' }}>
                    No tiene materias asignadas.
                  </td>
                </tr>
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
                    <td>
                      <strong>{d.deporte?.nombre || 'Deporte'}</strong>
                    </td>
                    <td>
                      {d.dia} {d.horario}
                    </td>
                    <td>{d.profesor ? `${d.profesor.apellido}, ${d.profesor.nombre}` : '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} style={{ color: 'var(--gray-500)' }}>
                    No está inscripto en actividades deportivas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <strong>3. Servicios Complementarios</strong>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <div
            style={{
              flex: 1,
              padding: '12px',
              background: '#f8fafc',
              border: '1px solid var(--gray-200)',
              borderRadius: '6px',
            }}
          >
            <strong>Transporte Escolar:</strong>{' '}
            {transporte.length > 0 ? (
              transporte.map((t, i) => (
                <span key={i} className="badge badge-amber">
                  {t.nombre} ({t.horario})
                </span>
              ))
            ) : (
              <span style={{ color: 'var(--gray-500)' }}>No utiliza transporte escolar</span>
            )}
          </div>
          <div
            style={{
              flex: 1,
              padding: '12px',
              background: '#f8fafc',
              border: '1px solid var(--gray-200)',
              borderRadius: '6px',
            }}
          >
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
export function renderReporteDocente(data: ReporteDocente) {
  if (!data || !data.docente) return <p>Docente no encontrado.</p>;

  const { docente, cursos, materiasACargo, gruposDeporte } = data;

  return (
    <div>
      <div className="report-card-summary">
        <h4>
          Docente: {docente.apellido}, {docente.nombre}
        </h4>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '8px',
            fontSize: '0.88rem',
          }}
        >
          <div>
            <strong>Legajo:</strong> {docente.legajo || '—'}
          </div>
          <div>
            <strong>DNI:</strong> {docente.dni || '—'}
          </div>
          <div>
            <strong>Especialidad:</strong> {docente.especialidad}
          </div>
          <div>
            <strong>Email:</strong> {docente.email}
          </div>
          <div>
            <strong>Teléfono:</strong> {docente.telefono || '—'}
          </div>
          <div>
            <strong>Materias:</strong> {materiasACargo.join(', ') || '—'}
          </div>
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
                    <td>
                      <strong>{c.materia}</strong>
                    </td>
                    <td>
                      {c.curso ? `${c.curso.nivel} - ${c.curso.anio} "${c.curso.division}"` : '—'}
                    </td>
                    <td>{c.curso?.turno || '—'}</td>
                    <td>
                      {c.dia} {c.horario}
                    </td>
                    <td>
                      <span className="badge badge-blue">{c.alumnos.length} alumnos</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ color: 'var(--gray-500)' }}>
                    Sin cursos académicos asignados.
                  </td>
                </tr>
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
                    <td>
                      <strong>{g.deporte?.nombre || 'Deporte'}</strong>
                    </td>
                    <td>{g.grupo.nivel}</td>
                    <td>
                      {g.grupo.dia} ({g.grupo.horario})
                    </td>
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
