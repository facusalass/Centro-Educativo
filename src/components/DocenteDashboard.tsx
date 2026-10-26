import { useState } from 'react';
import { Clock, GraduationCap, Users } from 'lucide-react';
import { Button } from './Button';
import { useReport } from '../hooks/useReport';
import type { ReporteDocente, UsuarioAcceso } from '../types';
export function DocenteDashboard({ usuario }: { usuario: UsuarioAcceso }) {
  const [vista, setVista] = useState<'horario' | 'cursos' | 'deportes'>('horario');
  const { state, reload } = useReport('docente', String(usuario.referencia_id ?? ''));
  if (state.status !== 'success')
    return (
      <section className="panel-card">
        <p role={state.status === 'error' ? 'alert' : 'status'}>
          {state.status === 'loading' ? 'Cargando…' : state.message}
        </p>
        {state.status === 'error' && <Button onClick={reload}>Reintentar</Button>}
      </section>
    );
  const reporte = state.data as ReporteDocente;
  const dayPrefix = (day: string) =>
    day
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .slice(0, 3);

  const totalAlumnos = reporte.cursos.reduce((sum, c) => sum + c.alumnos.length, 0);
  const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];

  return (
    <div style={{ marginTop: '20px' }}>
      {/* Metric Cards */}
      <div className="admin-stats" style={{ marginBottom: '24px' }}>
        <article>
          <span>Materias a cargo</span>
          <strong>{reporte.materiasACargo.length}</strong>
        </article>
        <article>
          <span>Cursos asignados</span>
          <strong>{reporte.cursos.length}</strong>
        </article>
        <article>
          <span>Total alumnos</span>
          <strong>{totalAlumnos}</strong>
        </article>
        <article>
          <span>Grupos deportivos</span>
          <strong>{reporte.gruposDeporte.length}</strong>
        </article>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Button
          type="button"
          variant={vista === 'horario' ? 'primary' : 'outline'}
          onClick={() => setVista('horario')}
        >
          <Clock size={16} /> Mi Horario Semanal
        </Button>
        <Button
          type="button"
          variant={vista === 'cursos' ? 'primary' : 'outline'}
          onClick={() => setVista('cursos')}
        >
          <GraduationCap size={16} /> Nómina de Cursos y Alumnos
        </Button>
        {reporte.gruposDeporte.length > 0 && (
          <Button
            type="button"
            variant={vista === 'deportes' ? 'primary' : 'outline'}
            onClick={() => setVista('deportes')}
          >
            <Users size={16} /> Deportes a Cargo
          </Button>
        )}
      </div>

      {/* View 1: Horario Semanal */}
      {vista === 'horario' && (
        <div>
          <h3 style={{ color: 'var(--blue-900)', marginBottom: '14px' }}>
            Grilla de Horario Semanal
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '14px',
            }}
          >
            {diasSemana.map((dia) => {
              const pref = dayPrefix(dia);
              const clasesDelDia = reporte.cursos.filter((c) => dayPrefix(c.dia || '') === pref);
              const deportesDelDia = reporte.gruposDeporte.filter(
                (g) => dayPrefix(g.grupo.dia || '') === pref,
              );

              return (
                <div
                  key={dia}
                  style={{
                    background: 'var(--white)',
                    border: '1px solid var(--gray-200)',
                    borderRadius: '8px',
                    padding: '14px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div
                    style={{
                      borderBottom: '2px solid var(--blue-700)',
                      paddingBottom: '6px',
                      marginBottom: '10px',
                    }}
                  >
                    <strong style={{ color: 'var(--blue-900)', fontSize: '1rem' }}>{dia}</strong>
                  </div>

                  {clasesDelDia.length === 0 && deportesDelDia.length === 0 ? (
                    <p style={{ color: 'var(--gray-400)', fontSize: '0.85rem', margin: 0 }}>
                      Sin actividades asignadas
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {clasesDelDia.map((c, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#f0fdf4',
                            border: '1px solid #bbf7d0',
                            borderRadius: '6px',
                            padding: '8px',
                          }}
                        >
                          <span className="badge badge-green" style={{ marginBottom: '4px' }}>
                            {c.horario}
                          </span>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--gray-900)',
                              fontSize: '0.88rem',
                            }}
                          >
                            {c.materia}
                          </div>
                          <div style={{ color: 'var(--gray-600)', fontSize: '0.78rem' }}>
                            {c.curso?.nivel} - {c.curso?.anio} "{c.curso?.division}"
                          </div>
                        </div>
                      ))}
                      {deportesDelDia.map((d, idx) => (
                        <div
                          key={idx}
                          style={{
                            background: '#eff6ff',
                            border: '1px solid #bfdbfe',
                            borderRadius: '6px',
                            padding: '8px',
                          }}
                        >
                          <span className="badge badge-blue" style={{ marginBottom: '4px' }}>
                            {d.grupo.horario}
                          </span>
                          <div
                            style={{
                              fontWeight: 600,
                              color: 'var(--blue-900)',
                              fontSize: '0.88rem',
                            }}
                          >
                            {d.deporte?.nombre ?? 'Deporte'}
                          </div>
                          <div style={{ color: 'var(--gray-600)', fontSize: '0.78rem' }}>
                            Nivel: {d.grupo.nivel}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* View 2: Cursos y Nóminas */}
      {vista === 'cursos' && (
        <div>
          <h3 style={{ color: 'var(--blue-900)', marginBottom: '14px' }}>
            Nómina de Cursos y Alumnos Asignados
          </h3>
          {reporte.cursos.map((c, i) => (
            <div
              key={i}
              style={{
                background: 'var(--white)',
                border: '1px solid var(--gray-200)',
                borderRadius: '8px',
                padding: '18px',
                marginBottom: '20px',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '12px',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                <div>
                  <h4
                    style={{ margin: '0 0 4px 0', color: 'var(--blue-900)', fontSize: '1.05rem' }}
                  >
                    {c.materia} — {c.curso?.nivel} {c.curso?.anio} "{c.curso?.division}"
                  </h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                    Día y horario: {c.dia} {c.horario} • Turno: {c.curso?.turno || '—'}
                  </span>
                </div>
                <span className="badge badge-blue">{c.alumnos.length} Alumnos</span>
              </div>

              <div className="report-table-wrapper" style={{ margin: 0 }}>
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Legajo</th>
                      <th>Apellido y Nombre</th>
                      <th>Nivel</th>
                      <th>Curso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.alumnos.length > 0 ? (
                      c.alumnos.map((a, ai) => (
                        <tr key={ai}>
                          <td>{ai + 1}</td>
                          <td>
                            <strong>{a.legajo}</strong>
                          </td>
                          <td>
                            {a.apellido}, {a.nombre}
                          </td>
                          <td>{a.nivel}</td>
                          <td>{a.curso}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                          Sin alumnos registrados en este curso.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View 3: Grupos Deportivos */}
      {vista === 'deportes' && (
        <div>
          <h3 style={{ color: 'var(--blue-900)', marginBottom: '14px' }}>
            Comisiones y Grupos Deportivos a Cargo
          </h3>
          {reporte.gruposDeporte.map((g, i) => {
            const alumnosGrupo = g.alumnos ?? [];
            return (
              <div
                key={i}
                style={{
                  background: 'var(--white)',
                  border: '1px solid var(--gray-200)',
                  borderRadius: '8px',
                  padding: '18px',
                  marginBottom: '20px',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '12px',
                    flexWrap: 'wrap',
                    gap: '8px',
                  }}
                >
                  <div>
                    <h4
                      style={{ margin: '0 0 4px 0', color: 'var(--blue-900)', fontSize: '1.05rem' }}
                    >
                      {g.deporte?.nombre ?? 'Deporte'} — Nivel {g.grupo.nivel}
                    </h4>
                    <span style={{ fontSize: '0.85rem', color: 'var(--gray-600)' }}>
                      Día y horario: {g.grupo.dia} ({g.grupo.horario})
                    </span>
                  </div>
                  <span className="badge badge-blue">{alumnosGrupo.length} Inscriptos</span>
                </div>

                <div className="report-table-wrapper" style={{ margin: 0 }}>
                  <table className="report-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Legajo</th>
                        <th>Apellido y Nombre</th>
                        <th>DNI</th>
                        <th>Curso / Nivel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alumnosGrupo.length > 0 ? (
                        alumnosGrupo.map((a, ai) => (
                          <tr key={a.id ?? ai}>
                            <td>{ai + 1}</td>
                            <td>
                              <strong>{a.legajo}</strong>
                            </td>
                            <td>
                              {a.apellido}, {a.nombre}
                            </td>
                            <td>{a.dni || '—'}</td>
                            <td>
                              {a.curso}
                              {a.division ? ` "${a.division}"` : ''} ({a.nivel})
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', color: 'var(--gray-500)' }}>
                            Sin alumnos inscriptos en este grupo deportivo.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
