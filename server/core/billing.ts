import type { Express } from 'express';
import { db } from '../database.js';
import { assert, idOf } from './errors.js';
import { audit, requireStudent } from './security.js';
import { objectBody } from './validation.js';
import { monthlyQuote } from './fees.js';

const PERIODO_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function vencimientoForPeriodo(periodo: string): string {
  const [y, m] = periodo.split('-').map(Number);
  const next = new Date(Date.UTC(y, m, 10));
  return next.toISOString().slice(0, 10);
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function displayEstado(factura: any): string {
  if (factura.saldo_pendiente > 0 && factura.fecha_vencimiento) {
    const hoy = new Date().toISOString().slice(0, 10);
    if (factura.fecha_vencimiento < hoy) return 'vencida';
  }
  return factura.estado;
}

type ItemDraft = {
  tipo: 'base' | 'deporte' | 'transporte' | 'comedor';
  referencia_id: number | null;
  descripcion: string;
  monto: number;
};

async function buildItemsForStudent(studentId: number): Promise<ItemDraft[]> {
  const fees = await db.all('SELECT * FROM tarifas');
  const amount = (type: string) => Number(fees.find((f) => f.tipo === type)?.monto ?? NaN);
  const services = await db.all(
    `SELECT i.tipo, i.grupo_deporte_id, i.recorrido_id,
            d.id AS deporte_id, d.nombre AS deporte,
            d.arancel_mensual AS deporte_arancel,
            r.arancel_mensual AS recorrido_arancel
     FROM inscripciones i
     LEFT JOIN grupos_deporte g ON g.id = i.grupo_deporte_id
     LEFT JOIN deportes d ON d.id = g.deporte_id
     LEFT JOIN recorridos_transporte r ON r.id = i.recorrido_id
     WHERE i.alumno_id = ? AND i.estado = 'activo' ORDER BY i.id`,
    [studentId],
  );
  if (!Number.isFinite(amount('base'))) return [];
  const rateOf = (s: any): number | null => {
    const rate =
      s.tipo === 'deporte'
        ? Number(s.deporte_arancel)
        : s.tipo === 'transporte'
          ? Number(s.recorrido_arancel)
          : 0;
    return rate > 0 ? rate : null;
  };
  const items: ItemDraft[] = [
    { tipo: 'base', referencia_id: null, descripcion: 'Cursado lectivo', monto: amount('base') },
  ];
  for (const s of services) {
    if (s.tipo === 'base') continue;
    const flat = amount(s.tipo);
    if (rateOf(s) === null && !Number.isFinite(flat)) return [];
    if (s.tipo === 'deporte')
      items.push({
        tipo: 'deporte',
        referencia_id: Number(s.deporte_id) || Number(s.grupo_deporte_id) || null,
        descripcion: `Deporte: ${s.deporte ?? ''}`.trim(),
        monto: rateOf(s) ?? flat,
      });
    else if (s.tipo === 'transporte')
      items.push({
        tipo: 'transporte',
        referencia_id: Number(s.recorrido_id) || null,
        descripcion: 'Transporte',
        monto: rateOf(s) ?? flat,
      });
    else if (s.tipo === 'comedor')
      items.push({ tipo: 'comedor', referencia_id: null, descripcion: 'Comedor', monto: flat });
    else return [];
  }
  return items.map((it) => ({ ...it, monto: round2(it.monto) }));
}

export async function generateMonthlyInvoices(periodo: string) {
  assert(PERIODO_RE.test(periodo), 400, 'Ingresá un período válido con formato AAAA-MM.');
  const periodoCompacto = periodo.replace('-', '');
  const fecha_emision = new Date().toISOString();
  const fecha_vencimiento = vencimientoForPeriodo(periodo);
  return db.transaction(async () => {
    const maxRow = await db.get(
      'SELECT numero_factura FROM facturas WHERE periodo = ? ORDER BY numero_factura DESC LIMIT 1',
      [periodo],
    );
    let next = maxRow
      ? Number(String(maxRow.numero_factura).slice(-4)) + 1 || 1
      : 1;
    const alumnos = await db.all(
      "SELECT id FROM alumnos WHERE estado = 'activo' ORDER BY id",
    );
    let creadas = 0;
    let omitidas = 0;
    for (const a of alumnos) {
      const existente = await db.get(
        'SELECT id FROM facturas WHERE alumno_id = ? AND periodo = ?',
        [a.id, periodo],
      );
      if (existente) {
        omitidas += 1;
        continue;
      }
      const quote = await monthlyQuote(a.id);
      if (!quote.configurado || !quote.total) {
        omitidas += 1;
        continue;
      }
      const items = await buildItemsForStudent(a.id);
      if (!items.length) {
        omitidas += 1;
        continue;
      }
      const total = round2(items.reduce((n, it) => n + it.monto, 0));
      const numero_factura = `FAC-${periodoCompacto}-${String(next).padStart(4, '0')}`;
      next += 1;
      const facturaId = await db.insert('facturas', {
        numero_factura,
        alumno_id: a.id,
        periodo,
        fecha_emision,
        fecha_vencimiento,
        total,
        saldo_pendiente: total,
        estado: 'pendiente',
      });
      for (const it of items)
        await db.insert('factura_items', {
          factura_id: facturaId,
          tipo: it.tipo,
          referencia_id: it.referencia_id,
          descripcion: it.descripcion,
          monto: it.monto,
          monto_pagado: 0,
          estado: 'pendiente',
        });
      creadas += 1;
    }
    return { creadas, omitidas };
  });
}

export function registerBillingRoutes(app: Express) {
  app.post('/api/facturas/generar-periodo', async (req, res) => {
    assert(req.user!.rol === 'admin', 403, 'Solo administración puede generar facturación.');
    const input = objectBody(req.body);
    const periodo = String(input.periodo ?? '').trim();
    const result = await generateMonthlyInvoices(periodo);
    await audit(req.user!.id, 'generar facturación', 'facturas', undefined, periodo);
    res.status(201).json({ periodo, ...result });
  });

  app.get('/api/facturas', async (req, res) => {
    assert(
      ['admin', 'padre'].includes(req.user!.rol),
      403,
      'Tu perfil no tiene permiso para esta operación.',
    );
    const q = req.query as Record<string, unknown>;
    let alumnoIds: number[] | null = null;
    if (q.alumno_id !== undefined) {
      const alumno = await requireStudent(req, idOf(q.alumno_id));
      alumnoIds = [alumno.id];
    } else if (req.user!.rol === 'padre') {
      const hijos = await db.all('SELECT id FROM alumnos WHERE usuario_padre_id = ?', [
        req.user!.id,
      ]);
      alumnoIds = hijos.map((h) => h.id);
      if (!alumnoIds.length) return res.json([]);
    }
    const clauses: string[] = [];
    const params: unknown[] = [];
    if (alumnoIds) {
      clauses.push(`alumno_id IN (${alumnoIds.map(() => '?').join(', ')})`);
      params.push(...alumnoIds);
    }
    if (typeof q.desde === 'string' && q.desde) {
      clauses.push('fecha_emision >= ?');
      params.push(q.desde);
    }
    if (typeof q.hasta === 'string' && q.hasta) {
      clauses.push('fecha_emision <= ?');
      params.push(q.hasta);
    }
    const rows = await db.all(
      `SELECT * FROM facturas ${clauses.length ? `WHERE ${clauses.join(' AND ')}` : ''} ORDER BY fecha_emision DESC, id DESC`,
      params,
    );
    const withDisplay = rows.map((r) => ({ ...r, estado: displayEstado(r) }));
    if (typeof q.estado === 'string' && q.estado)
      return res.json(withDisplay.filter((r) => r.estado === q.estado));
    res.json(withDisplay);
  });

  app.get('/api/facturas/:id', async (req, res) => {
    assert(
      ['admin', 'padre'].includes(req.user!.rol),
      403,
      'Tu perfil no tiene permiso para esta operación.',
    );
    const factura = await db.get('SELECT * FROM facturas WHERE id = ?', [idOf(req.params.id)]);
    assert(factura, 404, 'Factura no encontrada.');
    await requireStudent(req, factura.alumno_id);
    const [items, comprobantes, recibos] = await Promise.all([
      db.all('SELECT * FROM factura_items WHERE factura_id = ? ORDER BY id', [factura.id]),
      db.all('SELECT * FROM pagos_comprobantes WHERE factura_id = ? ORDER BY id', [factura.id]),
      db.all('SELECT * FROM recibos WHERE factura_id = ? ORDER BY id', [factura.id]),
    ]);
    res.json({ ...factura, estado: displayEstado(factura), items, comprobantes, recibos });
  });

  app.get('/api/pagos/alumno/:alumnoId', async (req, res) => {
    assert(
      ['admin', 'padre'].includes(req.user!.rol),
      403,
      'Tu perfil no tiene permiso para esta operación.',
    );
    const alumno = await requireStudent(req, idOf(req.params.alumnoId));
    const comprobantes = await db.all(
      `SELECT c.* FROM pagos_comprobantes c JOIN facturas f ON f.id = c.factura_id
       WHERE f.alumno_id = ? ORDER BY c.id DESC`,
      [alumno.id],
    );
    const recibos = await db.all('SELECT * FROM recibos WHERE alumno_id = ? ORDER BY id DESC', [
      alumno.id,
    ]);
    res.json({ comprobantes, recibos });
  });
}
