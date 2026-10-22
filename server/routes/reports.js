import { db } from '../database.js';
import { sendDbError } from '../http/helpers.js';
export function registerReports(app) {
  async function loadReportData() {
    const [alumnos, docentes, cursos, asignaciones, deportes, grupos, recorridos, inscripciones] =
      await Promise.all([
        db.all('SELECT * FROM alumnos ORDER BY nivel, curso, apellido, nombre'),
        db.all('SELECT * FROM docentes ORDER BY apellido, nombre'),
        db.all('SELECT * FROM cursos ORDER BY nivel, anio, division'),
        db.all('SELECT * FROM asignaciones_docentes'),
        db.all('SELECT * FROM deportes ORDER BY nombre'),
        db.all('SELECT * FROM grupos_deporte'),
        db.all('SELECT * FROM recorridos_transporte ORDER BY id'),
        db.all("SELECT * FROM inscripciones WHERE estado = 'activo'"),
      ]);

    const byId = (rows) => new Map(rows.map((r) => [r.id, r]));

    return {
      alumnos,
      docentes,
      cursos,
      asignaciones,
      deportes,
      grupos,
      recorridos,
      inscripciones,
      alumnosById: byId(alumnos),
      docentesById: byId(docentes),
      cursosById: byId(cursos),
      deportesById: byId(deportes),
      gruposById: byId(grupos),
      recorridosById: byId(recorridos),
    };
  }

  function findCursoDeAlumno(data, alumno) {
    return (
      data.cursos.find(
        (curso) =>
          curso.nivel === alumno.nivel &&
          curso.anio === alumno.curso &&
          curso.division === alumno.division,
      ) ?? null
    );
  }

  app.get('/api/reportes/alumno/:id', async (req, res) => {
    try {
      const data = await loadReportData();
      const alumno = data.alumnosById.get(Number(req.params.id));
      if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });

      const curso = findCursoDeAlumno(data, alumno);

      const materias = data.asignaciones
        .filter((asignacion) => asignacion.curso_id === curso?.id)
        .map((asignacion) => ({
          materia: asignacion.materia,
          dia: asignacion.dia,
          horario: asignacion.horario,
          profesor: data.docentesById.get(asignacion.docente_id) ?? null,
        }));

      const inscripcionesAlumno = data.inscripciones.filter((i) => i.alumno_id === alumno.id);

      const deportes = inscripcionesAlumno
        .filter((i) => i.tipo === 'deporte')
        .map((i) => {
          const grupo = data.gruposById.get(i.grupo_deporte_id);
          return {
            deporte: grupo ? (data.deportesById.get(grupo.deporte_id) ?? null) : null,
            grupo,
            dia: grupo?.dia,
            horario: grupo?.horario,
            profesor: grupo ? (data.docentesById.get(grupo.profesor_id) ?? null) : null,
          };
        });

      const transporte = inscripcionesAlumno
        .filter((i) => i.tipo === 'transporte')
        .map((i) => data.recorridosById.get(i.recorrido_id) ?? null);

      const comedor = inscripcionesAlumno.some((i) => i.tipo === 'comedor');

      res.json({ alumno, curso, materias, deportes, transporte, comedor });
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/docente/:id', async (req, res) => {
    try {
      const data = await loadReportData();
      const docente = data.docentesById.get(Number(req.params.id));
      if (!docente) return res.status(404).json({ error: 'Docente no encontrado.' });

      const asignaciones = data.asignaciones.filter((a) => a.docente_id === docente.id);

      const cursos = asignaciones.map((asignacion) => {
        const curso = data.cursosById.get(asignacion.curso_id);
        const alumnosDelCurso = data.alumnos.filter(
          (alumno) =>
            alumno.nivel === curso?.nivel &&
            alumno.curso === curso?.anio &&
            alumno.division === curso?.division,
        );
        return {
          curso,
          materia: asignacion.materia,
          dia: asignacion.dia,
          horario: asignacion.horario,
          alumnos: alumnosDelCurso.map((alumno) => ({
            legajo: alumno.legajo,
            apellido: alumno.apellido,
            nombre: alumno.nombre,
            nivel: alumno.nivel,
            curso: alumno.curso,
          })),
        };
      });

      const materiasACargo = [...new Set(asignaciones.map((a) => a.materia))];

      const gruposDeporte = data.grupos
        .filter((grupo) => grupo.profesor_id === docente.id)
        .map((grupo) => ({ grupo, deporte: data.deportesById.get(grupo.deporte_id) ?? null }));

      res.json({ docente, cursos, materiasACargo, gruposDeporte });
    } catch (error) {
      sendDbError(res, error);
    }
  });

  function alumnosDeGrupo(data, grupoId) {
    return data.inscripciones
      .filter((i) => i.tipo === 'deporte' && i.grupo_deporte_id === grupoId)
      .map((i) => {
        const alumno = data.alumnosById.get(i.alumno_id);
        return alumno
          ? {
              legajo: alumno.legajo,
              apellido: alumno.apellido,
              nombre: alumno.nombre,
              curso: alumno.curso,
              nivel: alumno.nivel,
            }
          : null;
      })
      .filter(Boolean);
  }

  app.get('/api/reportes/alumnos-por-deporte', async (_req, res) => {
    try {
      const data = await loadReportData();
      res.json(
        data.deportes.map((deporte) => ({
          deporte: deporte.nombre,
          profesor: data.docentesById.get(deporte.profesor_id) ?? null,
          grupos: data.grupos
            .filter((grupo) => grupo.deporte_id === deporte.id)
            .map((grupo) => ({
              nivel: grupo.nivel,
              dia: grupo.dia,
              horario: grupo.horario,
              profesor: data.docentesById.get(grupo.profesor_id) ?? null,
              alumnos: alumnosDeGrupo(data, grupo.id),
            })),
        })),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/alumnos-por-deporte-nivel', async (_req, res) => {
    try {
      const data = await loadReportData();
      const resultado = [];

      for (const deporte of data.deportes) {
        const grupos = data.grupos.filter((grupo) => grupo.deporte_id === deporte.id);
        const niveles = [...new Set(grupos.map((g) => g.nivel))];
        for (const nivel of niveles) {
          const alumnos = data.inscripciones
            .filter((i) => {
              const grupo = data.gruposById.get(i.grupo_deporte_id);
              return (
                i.tipo === 'deporte' && grupo?.deporte_id === deporte.id && grupo?.nivel === nivel
              );
            })
            .map((i) => {
              const alumno = data.alumnosById.get(i.alumno_id);
              return alumno
                ? {
                    legajo: alumno.legajo,
                    apellido: alumno.apellido,
                    nombre: alumno.nombre,
                    curso: alumno.curso,
                  }
                : null;
            })
            .filter(Boolean);

          resultado.push({ deporte: deporte.nombre, nivel, alumnos });
        }
      }

      res.json(resultado);
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/alumnos-por-deporte-detalle', async (_req, res) => {
    try {
      const data = await loadReportData();
      res.json(
        data.grupos.map((grupo) => ({
          deporte: data.deportesById.get(grupo.deporte_id)?.nombre ?? null,
          nivel: grupo.nivel,
          dia: grupo.dia,
          horario: grupo.horario,
          profesor: data.docentesById.get(grupo.profesor_id) ?? null,
          alumnos: alumnosDeGrupo(data, grupo.id),
        })),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/alumnos-por-recorrido', async (_req, res) => {
    try {
      const data = await loadReportData();
      res.json(
        data.recorridos.map((recorrido) => ({
          recorrido: recorrido.nombre,
          horario: recorrido.horario,
          zona: recorrido.zona,
          alumnos: data.inscripciones
            .filter((i) => i.tipo === 'transporte' && i.recorrido_id === recorrido.id)
            .map((i) => {
              const alumno = data.alumnosById.get(i.alumno_id);
              return alumno
                ? {
                    legajo: alumno.legajo,
                    apellido: alumno.apellido,
                    nombre: alumno.nombre,
                    curso: alumno.curso,
                    nivel: alumno.nivel,
                  }
                : null;
            })
            .filter(Boolean),
        })),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/alumnos-por-materia', async (_req, res) => {
    try {
      const data = await loadReportData();
      res.json(
        data.asignaciones.map((asignacion) => {
          const curso = data.cursosById.get(asignacion.curso_id);
          const docente = data.docentesById.get(asignacion.docente_id);
          const alumnos = data.alumnos
            .filter(
              (alumno) =>
                alumno.nivel === curso?.nivel &&
                alumno.curso === curso?.anio &&
                alumno.division === curso?.division,
            )
            .map((alumno) => ({
              legajo: alumno.legajo,
              apellido: alumno.apellido,
              nombre: alumno.nombre,
            }));

          return {
            nivel: curso?.nivel ?? null,
            curso: curso ? `${curso.anio} ${curso.division}` : null,
            materia: asignacion.materia,
            profesor: docente ? `${docente.apellido}, ${docente.nombre}` : null,
            alumnos,
          };
        }),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/docentes-por-nivel', async (_req, res) => {
    try {
      const data = await loadReportData();
      const niveles = [...new Set(data.cursos.map((curso) => curso.nivel))];

      res.json(
        niveles.map((nivel) => {
          const cursosDelNivel = data.cursos.filter((curso) => curso.nivel === nivel);
          const cursoIds = cursosDelNivel.map((curso) => curso.id);
          const asignacionesDelNivel = data.asignaciones.filter((a) =>
            cursoIds.includes(a.curso_id),
          );
          const docenteIds = [...new Set(asignacionesDelNivel.map((a) => a.docente_id))];

          return {
            nivel,
            docentes: docenteIds.map((docenteId) => {
              const docente = data.docentesById.get(docenteId);
              const asignacionesDocente = asignacionesDelNivel.filter(
                (a) => a.docente_id === docenteId,
              );
              return {
                profesor: docente ? `${docente.apellido}, ${docente.nombre}` : null,
                materias: [...new Set(asignacionesDocente.map((a) => a.materia))],
                cursos: asignacionesDocente.map((a) => {
                  const curso = data.cursosById.get(a.curso_id);
                  return curso ? `${curso.anio} ${curso.division}` : null;
                }),
              };
            }),
          };
        }),
      );
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/alumnos-por-curso', async (_req, res) => {
    try {
      const data = await loadReportData();
      const resultado = data.cursos.map((curso) => {
        const alumnosDelCurso = data.alumnos.filter(
          (alumno) =>
            alumno.nivel === curso.nivel &&
            alumno.curso === curso.anio &&
            alumno.division === curso.division,
        );
        return {
          nivel: curso.nivel,
          anio: curso.anio,
          division: curso.division,
          turno: curso.turno,
          alumnos: alumnosDelCurso.map((alumno) => ({
            id: alumno.id,
            legajo: alumno.legajo,
            apellido: alumno.apellido,
            nombre: alumno.nombre,
            dni: alumno.dni,
            email: alumno.email,
            telefono: alumno.telefono,
          })),
        };
      });
      res.json(resultado);
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/asistencias/alumno/:id', async (req, res) => {
    try {
      const alumno = await db.get('SELECT * FROM alumnos WHERE id = ?', [req.params.id]);
      if (!alumno) return res.status(404).json({ error: 'Alumno no encontrado.' });

      const registros = await db.all(
        'SELECT * FROM asistencias_diarias WHERE alumno_id = ? ORDER BY fecha DESC',
        [req.params.id],
      );
      const presentes = registros.filter((registro) => Number(registro.presente) === 1).length;
      const total = registros.length;

      res.json({
        alumno,
        registros,
        resumen: {
          presentes,
          ausentes: total - presentes,
          total,
          porcentaje: total > 0 ? Math.round((presentes / total) * 100) : 0,
        },
      });
    } catch (error) {
      sendDbError(res, error);
    }
  });
}
