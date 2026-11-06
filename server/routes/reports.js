import { db } from '../database.js';
import { sendDbError } from '../http/helpers.js';
import { finDeDia, round2, displayEstado } from '../core/billing.js';
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
        .map((grupo) => ({
          grupo,
          deporte: data.deportesById.get(grupo.deporte_id) ?? null,
          alumnos: alumnosDeGrupo(data, grupo.id),
        }));

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
              id: alumno.id,
              legajo: alumno.legajo,
              apellido: alumno.apellido,
              nombre: alumno.nombre,
              dni: alumno.dni,
              curso: alumno.curso,
              division: alumno.division,
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
                    domicilio: alumno.domicilio,
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

  // ===== Reportes financieros (RF-06, HU-22 a HU-26) =====
  // Todos los endpoints quedan además cubiertos por el middleware global
  // (SOLO administración) y revalidan el rol dentro de cada handler.
  const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

  function soloAdmin(req, res) {
    if (req.user?.rol !== 'admin') {
      res.status(403).json({ error: 'Tu perfil no tiene permiso para esta operación.' });
      return false;
    }
    return true;
  }

  function rangoFechas(req, res) {
    const desde = typeof req.query.desde === 'string' ? req.query.desde.trim() : '';
    const hasta = typeof req.query.hasta === 'string' ? req.query.hasta.trim() : '';
    if ((desde && !FECHA_RE.test(desde)) || (hasta && !FECHA_RE.test(hasta))) {
      res.status(400).json({ error: 'Ingresá fechas válidas con formato AAAA-MM-DD.' });
      return null;
    }
    return { desde, hasta };
  }

  app.get('/api/reportes/ingresos-periodo', async (req, res) => {
    try {
      if (!soloAdmin(req, res)) return;
      const rango = rangoFechas(req, res);
      if (!rango) return;
      const clauses = [];
      const params = [];
      if (rango.desde) {
        clauses.push('fecha_emision >= ?');
        params.push(rango.desde);
      }
      if (rango.hasta) {
        clauses.push('fecha_emision <= ?');
        params.push(finDeDia(rango.hasta));
      }
      const recibos = await db.all(
        `SELECT monto_total FROM recibos ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''}`,
        params,
      );
      res.json({
        desde: rango.desde || null,
        hasta: rango.hasta || null,
        cantidad: recibos.length,
        total: round2(recibos.reduce((n, r) => n + Number(r.monto_total), 0)),
      });
    } catch (error) {
      sendDbError(res, error);
    }
  });

  async function listarPagosPorEstado(req, res, completos) {
    if (!soloAdmin(req, res)) return null;
    const rango = rangoFechas(req, res);
    if (!rango) return null;
    const ciclo = typeof req.query.ciclo === 'string' ? req.query.ciclo.trim() : '';
    if (ciclo && !/^\d{4}$/.test(ciclo)) {
      res.status(400).json({ error: 'Ingresá un ciclo lectivo válido con formato AAAA.' });
      return null;
    }
    const cursoFiltro = req.query.curso_id !== undefined ? Number(req.query.curso_id) : 0;
    if (Number.isNaN(cursoFiltro) || (cursoFiltro !== 0 && !Number.isInteger(cursoFiltro))) {
      res.status(400).json({ error: 'Ingresá un curso válido.' });
      return null;
    }
    // recibos es la única fuente de ingresos aprobados: nunca se suman comprobantes.
    const [facturas, alumnos, matriculas] = await Promise.all([
      db.all('SELECT * FROM facturas ORDER BY fecha_emision DESC, id DESC'),
      db.all(
        'SELECT id, legajo, apellido, nombre, nivel, curso, division, curso_id FROM alumnos',
      ),
      db.all('SELECT alumno_id, curso_id, ciclo FROM matriculas'),
    ]);
    const alumnosById = new Map(alumnos.map((a) => [Number(a.id), a]));
    const rows = [];
    for (const factura of facturas) {
      const saldo = round2(Number(factura.saldo_pendiente));
      if (completos ? saldo !== 0 : saldo <= 0) continue;
      const emision = String(factura.fecha_emision ?? '');
      if (rango.desde && emision < rango.desde) continue;
      if (rango.hasta && (!emision || emision > finDeDia(rango.hasta))) continue;
      const cicloPeriodo = Number(String(factura.periodo).slice(0, 4)) || null;
      if (ciclo && String(cicloPeriodo) !== ciclo) continue;
      const alumno = alumnosById.get(Number(factura.alumno_id));
      if (!alumno) continue;
      if (cursoFiltro) {
        // El curso puede venir de la matrícula del ciclo del período o del expediente del alumno.
        const porMatricula = matriculas.some(
          (m) =>
            Number(m.alumno_id) === Number(factura.alumno_id) &&
            Number(m.curso_id) === cursoFiltro &&
            cicloPeriodo !== null &&
            Number(m.ciclo) === cicloPeriodo,
        );
        if (!porMatricula && Number(alumno.curso_id) !== cursoFiltro) continue;
      }
      rows.push({
        id: Number(factura.id),
        numero_factura: factura.numero_factura,
        periodo: factura.periodo,
        ciclo: cicloPeriodo,
        alumno: {
          id: Number(alumno.id),
          legajo: alumno.legajo ?? null,
          apellido: alumno.apellido,
          nombre: alumno.nombre,
          nivel: alumno.nivel ?? null,
          curso: alumno.curso ?? null,
          division: alumno.division ?? null,
        },
        fecha_emision: factura.fecha_emision,
        fecha_vencimiento: factura.fecha_vencimiento,
        total: round2(Number(factura.total)),
        saldo_pendiente: saldo,
        // 'vencida' es un estado derivado en lectura, nunca persistido.
        estado: displayEstado(factura),
      });
    }
    return rows;
  }

  app.get('/api/reportes/pagos-completos', async (req, res) => {
    try {
      const rows = await listarPagosPorEstado(req, res, true);
      if (rows) res.json(rows);
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/pagos-incompletos', async (req, res) => {
    try {
      const rows = await listarPagosPorEstado(req, res, false);
      if (rows) res.json(rows);
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/pagos-por-deporte', async (req, res) => {
    try {
      if (!soloAdmin(req, res)) return;
      const rango = rangoFechas(req, res);
      if (!rango) return;
      const q = req.query;
      const filtros = {
        deporte_id: q.deporte_id !== undefined ? Number(q.deporte_id) : 0,
        nivel: typeof q.nivel === 'string' ? q.nivel.trim() : '',
        horario: typeof q.horario === 'string' ? q.horario.trim() : '',
        profesor_id: q.profesor_id !== undefined ? Number(q.profesor_id) : 0,
      };
      if (
        Number.isNaN(filtros.deporte_id) ||
        (filtros.deporte_id && !Number.isInteger(filtros.deporte_id)) ||
        Number.isNaN(filtros.profesor_id) ||
        (filtros.profesor_id && !Number.isInteger(filtros.profesor_id))
      ) {
        return res.status(400).json({ error: 'Ingresá identificadores numéricos válidos.' });
      }
      const [items, inscripciones, grupos, deportes, docentes] = await Promise.all([
        db.all(
          "SELECT fi.monto, fi.monto_pagado, fi.referencia_id, f.alumno_id, f.fecha_emision FROM factura_items fi JOIN facturas f ON f.id = fi.factura_id WHERE fi.tipo = 'deporte'",
        ),
        db.all("SELECT * FROM inscripciones WHERE tipo = 'deporte' AND estado = 'activo'"),
        db.all('SELECT * FROM grupos_deporte'),
        db.all('SELECT * FROM deportes'),
        db.all('SELECT * FROM docentes'),
      ]);
      const gruposById = new Map(grupos.map((g) => [Number(g.id), g]));
      const deportesById = new Map(deportes.map((d) => [Number(d.id), d]));
      const docentesById = new Map(docentes.map((d) => [Number(d.id), d]));
      const inscripcionesPorAlumno = new Map();
      for (const inscripcion of inscripciones) {
        const lista = inscripcionesPorAlumno.get(Number(inscripcion.alumno_id)) ?? [];
        lista.push(inscripcion);
        inscripcionesPorAlumno.set(Number(inscripcion.alumno_id), lista);
      }
      const conFiltroDeGrupo = Boolean(filtros.nivel || filtros.horario || filtros.profesor_id);
      // 1) recolectamos los ítems que pasan el rango y los filtros (con su grupo),
      // 2) recién después agregamos imputado/pagado/alumnos/grupos por deporte.
      const coincidencias = new Map(); // deporte_id -> [{ item, grupo }]
      for (const item of items) {
        const emision = String(item.fecha_emision ?? '');
        if (rango.desde && emision < rango.desde) continue;
        if (rango.hasta && (!emision || emision > finDeDia(rango.hasta))) continue;
        // factura_items.referencia_id puede guardar deporte_id o grupo_deporte_id
        // (billing.ts prioriza el deporte al facturar). Resolvemos la ambigüedad
        // eligiendo el candidato que coincide con una inscripción activa del alumno.
        const referencial = Number(item.referencia_id);
        if (!referencial) continue;
        const grupoDirecto = gruposById.get(referencial) ?? null;
        const deporteDirecto = deportesById.has(referencial) ? referencial : 0;
        const inscripcionesDeportivas = inscripcionesPorAlumno.get(Number(item.alumno_id)) ?? [];
        const grupoDeDeporte = (deporteId) => {
          for (const inscripcion of inscripcionesDeportivas) {
            const grupo = gruposById.get(Number(inscripcion.grupo_deporte_id));
            if (grupo && Number(grupo.deporte_id) === deporteId) return grupo;
          }
          return null;
        };
        let deporteIdItem = 0;
        let grupoCompatible = null;
        if (grupoDirecto && inscripcionesDeportivas.some((i) => Number(i.grupo_deporte_id) === referencial)) {
          deporteIdItem = Number(grupoDirecto.deporte_id);
          grupoCompatible = grupoDirecto;
        } else if (deporteDirecto && grupoDeDeporte(deporteDirecto)) {
          deporteIdItem = deporteDirecto;
          grupoCompatible = grupoDeDeporte(deporteDirecto);
        } else if (grupoDirecto) {
          deporteIdItem = Number(grupoDirecto.deporte_id);
        } else if (deporteDirecto) {
          deporteIdItem = deporteDirecto;
        }
        if (!deporteIdItem) continue;
        if (filtros.deporte_id && deporteIdItem !== filtros.deporte_id) continue;
        if (conFiltroDeGrupo) {
          // Con filtros de nivel/horario/profesor, el pago cuenta solo si el alumno
          // tiene una inscripción activa a una comisión del deporte que coincida.
          let grupoFiltrado = null;
          for (const inscripcion of inscripcionesDeportivas) {
            const grupo = gruposById.get(Number(inscripcion.grupo_deporte_id));
            if (!grupo || Number(grupo.deporte_id) !== deporteIdItem) continue;
            if (filtros.nivel && String(grupo.nivel ?? '') !== filtros.nivel) continue;
            if (filtros.horario && String(grupo.horario ?? '') !== filtros.horario) continue;
            if (filtros.profesor_id && Number(grupo.profesor_id) !== filtros.profesor_id) continue;
            grupoFiltrado = grupo;
            break;
          }
          if (!grupoFiltrado) continue;
          grupoCompatible = grupoFiltrado;
        }
        const grupoActual = grupoCompatible;
        const lista = coincidencias.get(deporteIdItem) ?? [];
        lista.push({ item, grupo: grupoActual });
        coincidencias.set(deporteIdItem, lista);
      }
      const detalle = [...coincidencias.entries()]
        .sort((a, b) =>
          String(deportesById.get(Number(a[0]))?.nombre ?? '').localeCompare(
            String(deportesById.get(Number(b[0]))?.nombre ?? ''),
          ),
        )
        .map(([deporteId, lista]) => {
          const grupoIds = new Set();
          const alumnoIds = new Set();
          let imputado = 0;
          let pagado = 0;
          for (const { item, grupo } of lista) {
            alumnoIds.add(Number(item.alumno_id));
            imputado += Number(item.monto);
            pagado += Number(item.monto_pagado);
            if (grupo) grupoIds.add(Number(grupo.id));
          }
          return {
            deporte_id: Number(deporteId),
            deporte: deportesById.get(Number(deporteId))?.nombre ?? 'Deporte',
            grupos: [...grupoIds].map((idGrupo) => {
              const grupo = gruposById.get(idGrupo);
              const docente = docentesById.get(Number(grupo?.profesor_id));
              return grupo
                ? {
                    nivel: grupo.nivel ?? null,
                    dia: grupo.dia ?? null,
                    horario: grupo.horario ?? null,
                    profesor: docente ? `${docente.apellido}, ${docente.nombre}` : null,
                  }
                : null;
            }).filter(Boolean),
            alumnos: alumnoIds.size,
            imputado: round2(imputado),
            pagado: round2(pagado),
            pendiente: round2(imputado - pagado),
          };
        });
      res.json(detalle);
    } catch (error) {
      sendDbError(res, error);
    }
  });

  app.get('/api/reportes/pagos-por-transporte', async (req, res) => {
    try {
      if (!soloAdmin(req, res)) return;
      const rango = rangoFechas(req, res);
      if (!rango) return;
      const recorridoFiltro =
        req.query.recorrido_id !== undefined ? Number(req.query.recorrido_id) : 0;
      if (
        Number.isNaN(recorridoFiltro) ||
        (recorridoFiltro && !Number.isInteger(recorridoFiltro))
      ) {
        return res.status(400).json({ error: 'Ingresá un recorrido válido.' });
      }
      const [items, recorridos] = await Promise.all([
        db.all(
          "SELECT fi.monto, fi.monto_pagado, fi.referencia_id, f.alumno_id, f.fecha_emision FROM factura_items fi JOIN facturas f ON f.id = fi.factura_id WHERE fi.tipo = 'transporte'",
        ),
        db.all('SELECT * FROM recorridos_transporte'),
      ]);
      const recorridosById = new Map(recorridos.map((r) => [Number(r.id), r]));
      const filas = new Map();
      for (const item of items) {
        const emision = String(item.fecha_emision ?? '');
        if (rango.desde && emision < rango.desde) continue;
        if (rango.hasta && (!emision || emision > finDeDia(rango.hasta))) continue;
        // Para transporte, factura_items.referencia_id es el recorrido (billing.ts).
        const recorridoId = Number(item.referencia_id);
        if (!recorridoId || !recorridosById.has(recorridoId)) continue;
        if (recorridoFiltro && recorridoId !== recorridoFiltro) continue;
        const recorrido = recorridosById.get(recorridoId);
        const fila = filas.get(recorridoId) ?? {
          recorrido: recorrido?.nombre ?? 'Recorrido',
          horario: recorrido?.horario ?? null,
          zona: recorrido?.zona ?? null,
          alumnoIds: new Set(),
          imputado: 0,
          pagado: 0,
        };
        filas.set(recorridoId, fila);
        fila.alumnoIds.add(Number(item.alumno_id));
        fila.imputado += Number(item.monto);
        fila.pagado += Number(item.monto_pagado);
      }
      res.json(
        [...filas.entries()]
          .sort((a, b) => String(a[1].recorrido).localeCompare(String(b[1].recorrido)))
          .map(([recorridoId, fila]) => ({
            recorrido_id: recorridoId,
            recorrido: fila.recorrido,
            horario: fila.horario,
            zona: fila.zona,
            alumnos: fila.alumnoIds.size,
            imputado: round2(fila.imputado),
            pagado: round2(fila.pagado),
            pendiente: round2(fila.imputado - fila.pagado),
          })),
      );
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
