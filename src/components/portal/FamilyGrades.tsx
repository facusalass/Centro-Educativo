import { useEffect, useState } from 'react';
import { request } from '../../services/api';
import { Feedback } from '../PortalShell';
import { AcademicPanel } from '../AcademicPanel';
import type { Alumno } from '../../types';
export function FamilyGrades() {
  const [children, setChildren] = useState<Alumno[]>([]),
    [id, setId] = useState(''),
    [error, setError] = useState('');
  useEffect(() => {
    request<Alumno[]>('/padres/hijos')
      .then((rows) => {
        setChildren(rows);
        setId(rows[0] ? String(rows[0].id) : '');
      })
      .catch((e: Error) => setError(e.message));
  }, []);
  return (
    <>
      <Feedback error>{error}</Feedback>
      <section className="panel-card">
        <label>
          Hijo
          <select value={id} onChange={(e) => setId(e.target.value)}>
            <option value="">Seleccionar…</option>
            {children.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre} {c.apellido}
              </option>
            ))}
          </select>
        </label>
      </section>
      {id && <AcademicPanel key={id} studentId={Number(id)} />}
    </>
  );
}
