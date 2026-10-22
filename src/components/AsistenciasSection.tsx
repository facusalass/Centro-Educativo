import { useState, useEffect } from 'react';
import { Button } from './Button';
import { api } from '../services/api';
import type { Curso, AsistenciaRegistro, Asistencia } from '../types';
export function AsistenciasSection() {
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [nivel, setNivel] = useState('');
  const [anio, setAnio] = useState('');
  const [division, setDivision] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [lista, setLista] = useState<AsistenciaRegistro[]>([]);
  const [estado, setEstado] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    api
      .getCursos()
      .then((data) => {
        setCursos(data);
        if (data[0]) {
          setNivel(data[0].nivel);
          setAnio(data[0].anio);
          setDivision(data[0].division);
        }
      })
      .catch(() => setEstado('No se pudieron cargar los cursos.'));
  }, []);

  const niveles = [...new Set(cursos.map((curso) => curso.nivel))];
  const anios = [...new Set(cursos.filter((curso) => curso.nivel === nivel).map((curso) => curso.anio))];
  const divisiones = [...new Set(cursos.filter((curso) => curso.nivel === nivel && curso.anio === anio).map((curso) => curso.division))];
  useEffect(() => { const choices = cursos.filter((c) => c.nivel === nivel); if (!choices.some((c) => c.anio === anio)) setAnio(choices[0]?.anio ?? ''); }, [nivel, cursos]);
  useEffect(() => { const choices = cursos.filter((c) => c.nivel === nivel && c.anio === anio); if (!choices.some((c) => c.division === division)) setDivision(choices[0]?.division ?? ''); }, [nivel, anio, cursos]);
  useEffect(() => { setLista([]); }, [nivel, anio, division, fecha]);

  async function cargarLista() {
    if (!nivel || !anio || !division) { setEstado('Seleccioná un curso antes de cargar la lista.'); return; }
    setPending(true);
    setEstado('Cargando lista...');
    try {
      setLista(await api.getAsistencias({ fecha, nivel, curso: anio, division }));
      setEstado('Lista cargada.');
    } catch (error) {
      setEstado(error instanceof Error ? error.message : 'Error al cargar la lista.');
    } finally { setPending(false); }
  }

  async function guardar() {
    setPending(true);
    setEstado('Guardando...');
    try {
      const registros = lista.map((item) => ({
        alumno_id: item.alumno.id,
        presente: item.asistencia?.presente === 1,
        observacion: item.asistencia?.observacion ?? '',
      }));
      await api.registrarAsistencias({ fecha, registros });
      await cargarLista();
      setEstado('Asistencia guardada.');
    } catch (error) {
      setEstado(error instanceof Error ? error.message : 'Error al guardar.');
    } finally { setPending(false); }
  }

  function toggle(index: number) {
    setLista((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const presente = item.asistencia?.presente !== 1;
        return {
          ...item,
          asistencia: {
            id: item.asistencia?.id ?? 0,
            alumno_id: item.alumno.id,
            fecha,
            presente: presente ? 1 : 0,
            observacion: item.asistencia?.observacion ?? null,
          } as Asistencia,
        };
      }),
    );
  }

  return (
    <section className="admin-section asistencias-section">
      <h2>Control de asistencias</h2>
      <div className="reportes-controls">
        <input aria-label="Fecha de asistencia" disabled={pending} type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
        <select aria-label="Nivel de asistencia" disabled={pending} value={nivel} onChange={(event) => setNivel(event.target.value)}>
          {niveles.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="Curso de asistencia" disabled={pending} value={anio} onChange={(event) => setAnio(event.target.value)}>
          {anios.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <select aria-label="División de asistencia" disabled={pending} value={division} onChange={(event) => setDivision(event.target.value)}>
          {divisiones.map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <Button type="button" disabled={pending} onClick={cargarLista}>Cargar lista</Button>
        <Button type="button" onClick={guardar} disabled={pending || lista.length === 0}>Guardar</Button>
        <span className="admin-status" role="status">{estado}</span>
      </div>

      {lista.length > 0 && (
        <div className="asistencia-list">
          {lista.map((item, index) => (
            <div className="admin-item" key={item.alumno.id}>
              <div>
                <strong>{item.alumno.apellido}, {item.alumno.nombre}</strong>
                <span>Legajo: {item.alumno.legajo}</span>
              </div>
              <label className="asistencia-toggle">
                <input
                  type="checkbox"
                  checked={item.asistencia?.presente === 1}
                  onChange={() => toggle(index)}
                />
                Presente
              </label>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
