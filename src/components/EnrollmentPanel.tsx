import { useEffect, useState, type FormEvent } from 'react';
import { request } from '../services/api';
import { useEnrollmentData, useStudentProfile } from '../hooks/useEnrollmentData';
import { Button } from './Button';
import { Feedback } from './PortalShell';
export function EnrollmentPanel({ admin = false }: { admin?: boolean }) {
  const {
    students,
    courses,
    groups,
    sports,
    routes,
    items,
    matriculas,
    error: dataError,
    reload,
  } = useEnrollmentData(admin);
  const [studentId, setStudentId] = useState(''),
    [type, setType] = useState('deporte'),
    [groupId, setGroupId] = useState(''),
    [routeId, setRouteId] = useState(''),
    [courseId, setCourseId] = useState(''),
    [cycle, setCycle] = useState(2027);
  const [error, setError] = useState(''),
    [status, setStatus] = useState(''),
    [pending, setPending] = useState(false),
    [adding, setAdding] = useState(false);
  const [child, setChild] = useState({
    nombre_hijo: '',
    apellido_hijo: '',
    dni_hijo: '',
    curso_id: '',
  });
  const profile = useStudentProfile(studentId, items);
  const report = profile.data?.report.alumno.id === Number(studentId) ? profile.data.report : null;
  const quote = report ? profile.data?.quote : null;
  const load = async () => {
    await reload();
  };
  useEffect(() => {
    if (!students.some((student) => String(student.id) === studentId))
      setStudentId(students[0] ? String(students[0].id) : '');
  }, [students, studentId]);
  useEffect(() => {
    setGroupId('');
    setCourseId('');
  }, [studentId]);
  const act = async (action: () => Promise<unknown>, success: string) => {
    setPending(true);
    setError('');
    setStatus('');
    try {
      await action();
      await load();
      setStatus(success);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  const register = (e: FormEvent) => {
    e.preventDefault();
    void act(
      () =>
        request('/inscripciones', {
          method: 'POST',
          body: JSON.stringify({
            alumno_id: Number(studentId),
            tipo: type,
            grupo_deporte_id: Number(groupId) || null,
            recorrido_id: Number(routeId) || null,
          }),
        }),
      'Inscripción confirmada.',
    );
  };
  const enrollCourse = (e: FormEvent) => {
    e.preventDefault();
    void act(
      () =>
        request('/matriculas', {
          method: 'POST',
          body: JSON.stringify({
            alumno_id: Number(studentId),
            curso_id: Number(courseId),
            ciclo: cycle,
          }),
        }),
      'Matrícula confirmada.',
    );
  };
  const addChild = (e: FormEvent) => {
    e.preventDefault();
    void act(async () => {
      await request('/padres/hijos', {
        method: 'POST',
        body: JSON.stringify({ ...child, curso_id: Number(child.curso_id) }),
      });
      setAdding(false);
      setChild({ nombre_hijo: '', apellido_hijo: '', dni_hijo: '', curso_id: '' });
    }, 'Alumno registrado y vinculado a tu cuenta.');
  };
  const student = students.find((s) => s.id === Number(studentId));
  return (
    <div>
      <section className="panel-card">
        <div className="section-toolbar">
          <div>
            <span className="eyebrow">Académico y servicios</span>
            <h2>{admin ? 'Inscripciones y matrícula' : 'Mis hijos'}</h2>
          </div>
          {!admin && (
            <Button variant="outline" onClick={() => setAdding(!adding)}>
              {adding ? 'Cerrar formulario' : 'Registrar otro hijo'}
            </Button>
          )}
        </div>
        <Feedback error>{error || dataError || profile.error}</Feedback>
        <Feedback>{status}</Feedback>
        {adding && (
          <form className="entity-editor" onSubmit={addChild}>
            <h3>Registrar hijo</h3>
            <div className="editor-grid">
              <label>
                Nombre
                <input
                  required
                  value={child.nombre_hijo}
                  onChange={(e) => setChild({ ...child, nombre_hijo: e.target.value })}
                />
              </label>
              <label>
                Apellido
                <input
                  required
                  value={child.apellido_hijo}
                  onChange={(e) => setChild({ ...child, apellido_hijo: e.target.value })}
                />
              </label>
              <label>
                DNI
                <input
                  required
                  pattern="[0-9]{7,9}"
                  value={child.dni_hijo}
                  onChange={(e) => setChild({ ...child, dni_hijo: e.target.value })}
                />
              </label>
              <label>
                Curso
                <select
                  required
                  value={child.curso_id}
                  onChange={(e) => setChild({ ...child, curso_id: e.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nivel} · {c.anio} {c.division}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <Button type="submit" disabled={pending}>
              Guardar hijo
            </Button>
          </form>
        )}
        <label>
          Alumno
          <select
            aria-label="Alumno"
            value={studentId}
            onChange={(e) => setStudentId(e.target.value)}
          >
            <option value="">Seleccionar…</option>
            {students.map((s) => (
              <option key={s.id} value={s.id}>
                {s.apellido}, {s.nombre} · {s.legajo}
              </option>
            ))}
          </select>
        </label>
        {!students.length && <p className="empty-state">Todavía no hay alumnos vinculados.</p>}
        {report && (
          <div className="student-summary">
            <h3>
              {report.alumno.nombre} {report.alumno.apellido}
            </h3>
            <p>
              {report.alumno.nivel} · {report.alumno.curso} {report.alumno.division} · Legajo{' '}
              {report.alumno.legajo}
            </p>
            <h4>Materias y profesores</h4>
            <div className="report-table-wrapper">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Materia</th>
                    <th>Profesor</th>
                    <th>Horario</th>
                  </tr>
                </thead>
                <tbody>
                  {report.materias.map((m, i) => (
                    <tr key={i}>
                      <td>{m.materia}</td>
                      <td>
                        {m.profesor
                          ? `${m.profesor.apellido}, ${m.profesor.nombre}`
                          : 'Sin asignar'}
                      </td>
                      <td>
                        {m.dia} {m.horario}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!report.materias.length && (
                <p className="empty-state">El curso todavía no tiene materias asignadas.</p>
              )}
            </div>
          </div>
        )}
        {quote && (
          <div className="fee-summary">
            <h3>Arancel mensual estimado</h3>
            {quote.configurado ? (
              <>
                <ul>
                  {quote.conceptos.map((line, i) => (
                    <li key={i}>
                      {line.concepto}:{' '}
                      {line.monto.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                    </li>
                  ))}
                </ul>
                <strong>
                  Total:{' '}
                  {quote.total?.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' })}
                </strong>
              </>
            ) : (
              <p>Los aranceles están pendientes de definición por administración.</p>
            )}
          </div>
        )}
      </section>
      {student && (
        <>
          <div className="portal-grid">
            <section className="panel-card">
              <h2>Inscripción a servicios</h2>
              <p>Elegí una actividad. Se verifican cupos, duplicados y horarios al confirmar.</p>
              <form onSubmit={register}>
                <label>
                  Servicio
                  <select
                    value={type}
                    onChange={(e) => {
                      setType(e.target.value);
                      setGroupId('');
                      setRouteId('');
                    }}
                  >
                    <option value="deporte">Deporte</option>
                    <option value="transporte">Transporte</option>
                    <option value="comedor">Comedor</option>
                  </select>
                </label>
                {type === 'deporte' && (
                  <label>
                    Grupo deportivo
                    <select required value={groupId} onChange={(e) => setGroupId(e.target.value)}>
                      <option value="">Seleccionar…</option>
                      {groups
                        .filter((g) => g.nivel === student.nivel)
                        .map((g) => (
                          <option key={g.id} value={g.id}>
                            {sports.find((s) => s.id === g.deporte_id)?.nombre} · {g.dia}{' '}
                            {g.horario}
                          </option>
                        ))}
                    </select>
                  </label>
                )}
                {type === 'transporte' && (
                  <label>
                    Recorrido
                    <select required value={routeId} onChange={(e) => setRouteId(e.target.value)}>
                      <option value="">Seleccionar…</option>
                      {routes.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.nombre} · {r.horario}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <Button type="submit" disabled={pending}>
                  {pending ? 'Verificando…' : 'Confirmar inscripción'}
                </Button>
              </form>
            </section>
            <section className="panel-card">
              <h2>Matrícula lectiva</h2>
              <form onSubmit={enrollCourse}>
                <label>
                  Ciclo lectivo
                  <input
                    type="number"
                    min="2026"
                    max="2100"
                    required
                    value={cycle}
                    onChange={(e) => setCycle(Number(e.target.value))}
                  />
                </label>
                <label>
                  Curso
                  <select required value={courseId} onChange={(e) => setCourseId(e.target.value)}>
                    <option value="">Seleccionar…</option>
                    {courses
                      .filter((c) => c.nivel === student.nivel)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.anio} {c.division} · {c.turno}
                        </option>
                      ))}
                  </select>
                </label>
                <Button disabled={pending} type="submit">
                  Confirmar matrícula
                </Button>
              </form>
              {matriculas
                .filter((m) => m.alumno_id === student.id)
                .map((m) => (
                  <p className="feedback" key={m.id}>
                    Ciclo {m.ciclo}: {m.anio} {m.division} · {m.estado}
                  </p>
                ))}
            </section>
          </div>
          <section className="panel-card">
            <h2>Servicios activos</h2>
            {!items.some((i) => i.alumno_id === student.id) && (
              <p className="empty-state">El alumno todavía no tiene servicios activos.</p>
            )}
            {items
              .filter((i) => i.alumno_id === student.id)
              .map((i) => (
                <article className="notice" key={i.id}>
                  <div>
                    <strong>
                      {i.tipo === 'deporte'
                        ? i.deporte?.nombre
                        : i.tipo === 'transporte'
                          ? i.recorrido?.nombre
                          : 'Comedor'}
                    </strong>
                    <p>{i.grupo ? `${i.grupo.dia} ${i.grupo.horario}` : i.recorrido?.horario}</p>
                  </div>
                  <Button
                    variant="outline"
                    disabled={pending}
                    onClick={() => {
                      if (window.confirm('¿Cancelar esta inscripción?'))
                        void act(
                          () => request(`/inscripciones/${i.id}`, { method: 'DELETE' }),
                          'Inscripción cancelada.',
                        );
                    }}
                  >
                    Cancelar inscripción
                  </Button>
                </article>
              ))}
          </section>
        </>
      )}
    </div>
  );
}
