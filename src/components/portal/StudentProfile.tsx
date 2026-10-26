import type { ReporteAlumno, UsuarioAcceso } from '../../types';
import { useReport } from '../../hooks/useReport';
import { Button } from '../Button';

export function StudentProfile({ user }: { user: UsuarioAcceso }) {
  const { state, reload } = useReport('alumno', String(user.referencia_id ?? ''));
  if (state.status !== 'success') {
    return (
      <section className="panel-card">
        <h2>Bienvenido/a, {user.nombre}</h2>
        <p role={state.status === 'error' ? 'alert' : 'status'}>
          {state.status === 'loading'
            ? 'Cargando ficha académica…'
            : state.status === 'empty'
              ? 'Tu cuenta aún no tiene un legajo de alumno vinculado.'
              : state.message}
        </p>
        {state.status === 'error' && <Button onClick={reload}>Reintentar</Button>}
      </section>
    );
  }
  const reporte = state.data as ReporteAlumno;
  const { alumno, curso, materias, deportes, transporte, comedor } = reporte;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
      <section className="panel-card">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '12px',
          }}
        >
          <h2 style={{ margin: 0 }}>
            Mi Legajo Académico — {alumno.apellido}, {alumno.nombre}
          </h2>
          <span className="badge badge-green" style={{ textTransform: 'capitalize' }}>
            {alumno.estado || 'activo'}
          </span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '10px',
            fontSize: '0.92rem',
          }}
        >
          <div>
            <strong>Legajo:</strong> {alumno.legajo || '—'}
          </div>
          <div>
            <strong>DNI:</strong> {alumno.dni || '—'}
          </div>
          <div>
            <strong>Nivel Educativo:</strong> {alumno.nivel || '—'}
          </div>
          <div>
            <strong>Curso y División:</strong>{' '}
            {curso
              ? `${curso.anio} "${curso.division}" (${curso.turno})`
              : `${alumno.curso} "${alumno.division}"`}
          </div>
          <div>
            <strong>Email:</strong> {alumno.email || user.email || '—'}
          </div>
          <div>
            <strong>Domicilio:</strong> {alumno.domicilio || '—'}
          </div>
        </div>
      </section>

      <section className="panel-card">
        <h3 style={{ marginTop: 0, color: 'var(--blue-900)' }}>Materias y Docentes Asignados</h3>
        <div className="report-table-wrapper" style={{ margin: 0 }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>Materia</th>
                <th>Docente</th>
                <th>Día</th>
                <th>Horario</th>
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
                      {m.profesor ? `${m.profesor.apellido}, ${m.profesor.nombre}` : 'Sin asignar'}
                    </td>
                    <td>{m.dia || '—'}</td>
                    <td>{m.horario || '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                    No hay materias registradas para tu curso.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <h3 style={{ marginTop: 0, color: 'var(--blue-900)' }}>
          Actividades Deportivas Inscriptas
        </h3>
        <div className="report-table-wrapper" style={{ margin: 0 }}>
          <table className="report-table">
            <thead>
              <tr>
                <th>Deporte</th>
                <th>Día</th>
                <th>Horario</th>
                <th>Docente responsable</th>
              </tr>
            </thead>
            <tbody>
              {deportes.length > 0 ? (
                deportes.map((d, i) => (
                  <tr key={i}>
                    <td>
                      <strong>{d.deporte?.nombre || 'Deporte'}</strong>
                    </td>
                    <td>{d.dia || d.grupo?.dia || '—'}</td>
                    <td>{d.horario || d.grupo?.horario || '—'}</td>
                    <td>
                      {d.profesor ? `${d.profesor.apellido}, ${d.profesor.nombre}` : 'Sin asignar'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                    Sin inscripciones deportivas activas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel-card">
        <h3 style={{ marginTop: 0, color: 'var(--blue-900)' }}>
          Servicios Complementarios Contratados
        </h3>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '14px',
          }}
        >
          <div
            style={{
              padding: '12px',
              background: '#f8fafc',
              border: '1px solid var(--gray-200)',
              borderRadius: '6px',
            }}
          >
            <strong>Transporte Escolar:</strong>{' '}
            {transporte.length > 0 ? (
              transporte.map((t, i) => (
                <div key={i} style={{ marginTop: '4px' }}>
                  <span className="badge badge-amber">
                    {t.nombre} ({t.zona}) — {t.horario}
                  </span>
                </div>
              ))
            ) : (
              <span style={{ color: 'var(--gray-500)' }}>Sin inscripción activa</span>
            )}
          </div>
          <div
            style={{
              padding: '12px',
              background: '#f8fafc',
              border: '1px solid var(--gray-200)',
              borderRadius: '6px',
            }}
          >
            <strong>Comedor Escolar:</strong>{' '}
            {comedor ? (
              <div style={{ marginTop: '4px' }}>
                <span className="badge badge-green">Inscripto al servicio de comedor</span>
              </div>
            ) : (
              <span style={{ color: 'var(--gray-500)' }}>Sin inscripción activa</span>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
