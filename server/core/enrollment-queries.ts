import type { Request } from 'express';
import { db } from '../database.js';
import { byId } from './collections.js';

type RelatedTable = 'alumnos' | 'grupos_deporte' | 'deportes' | 'recorridos_transporte';
type RelatedRecord = { id: number; [key: string]: unknown };

async function relatedRecords(table: RelatedTable, values: unknown[]): Promise<RelatedRecord[]> {
  const ids = [
    ...new Set(
      values.filter((value): value is number => Number.isSafeInteger(value) && Number(value) > 0),
    ),
  ];
  if (!ids.length) return [];
  return db.all(
    `SELECT * FROM ${table} WHERE id IN (${ids.map(() => '?').join(', ')})`,
    ids,
  ) as Promise<RelatedRecord[]>;
}

export async function listEnrollments(req: Request) {
  const parentFilter = req.user!.rol === 'admin' ? '' : 'AND a.usuario_padre_id = ?';
  const params = req.user!.rol === 'admin' ? [] : [req.user!.id];
  const rows = await db.all(
    `SELECT i.* FROM inscripciones i JOIN alumnos a ON a.id = i.alumno_id
    WHERE i.estado = 'activo' ${parentFilter} ORDER BY i.id DESC`,
    params,
  );
  if (!rows.length) return [];

  // Load only referenced records. Maps keep the assembly linear, without
  // scanning entire school tables once for every enrollment.
  const [students, groups, routes] = await Promise.all([
    relatedRecords(
      'alumnos',
      rows.map((row) => row.alumno_id),
    ),
    relatedRecords(
      'grupos_deporte',
      rows.map((row) => row.grupo_deporte_id),
    ),
    relatedRecords(
      'recorridos_transporte',
      rows.map((row) => row.recorrido_id),
    ),
  ]);
  const sports = await relatedRecords(
    'deportes',
    groups.map((group) => group.deporte_id),
  );
  const studentsById = byId(students);
  const groupsById = byId(groups);
  const routesById = byId(routes);
  const sportsById = byId(sports);
  return rows.map((row) => {
    const group = groupsById.get(row.grupo_deporte_id);
    return {
      ...row,
      alumno: studentsById.get(row.alumno_id) ?? null,
      grupo: group ?? null,
      deporte: sportsById.get(Number(group?.deporte_id)) ?? null,
      recorrido: routesById.get(row.recorrido_id) ?? null,
    };
  });
}
