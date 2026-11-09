import type { Express } from 'express';
import { db } from '../database.js';
import { assert } from './errors.js';
import { audit } from './security.js';
import { displayEstado, generateMonthlyInvoices } from './billing.js';
import { facturaPdfBuffer } from './documents.js';
import { deliverPending, queueEmail } from './notifications.js';

export function ultimoDiaHabilDelMes(year: number, month1to12: number): string {
  const last = new Date(Date.UTC(year, month1to12, 0));
  let d = last;
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d = new Date(d.getTime() - 86400000);
  return d.toISOString().slice(0, 10);
}

export function esUltimoDiaHabil(fechaISO: string): boolean {
  const d = new Date(`${fechaISO}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return false;
  return fechaISO === ultimoDiaHabilDelMes(d.getUTCFullYear(), d.getUTCMonth() + 1);
}

function pendientesDe(items: any[]): string {
  const lineas = items
    .map((it) => ({
      descripcion: String(it.descripcion ?? 'Concepto'),
      saldo: Math.round((Number(it.monto) - Number(it.monto_pagado)) * 100) / 100,
    }))
    .filter((it) => it.saldo > 0)
    .map((it) => `- ${it.descripcion}: $${it.saldo.toFixed(2)}`);
  return lineas.length ? lineas.join('\n') : '- Sin conceptos pendientes.';
}

async function facturasConSaldo(periodo?: string): Promise<any[]> {
  const rows = periodo
    ? await db.all('SELECT * FROM facturas WHERE periodo = ? ORDER BY id', [periodo])
    : await db.all('SELECT * FROM facturas ORDER BY periodo, id');
  return rows
    .filter((r) => Number(r.saldo_pendiente) > 0)
    .map((r) => ({ ...r, estado: displayEstado(r) }));
}

async function enviarLote(
  periodoLog: string,
  tipo: 'fin_de_mes' | 'deuda_dia_20',
  titulo: string,
  cuerpo: (f: any, detalle: string) => string,
  facturas: any[],
) {
  let enviadas = 0;
  let omitidas = 0;
  for (const fac of facturas) {
    const existente = await db.get(
      'SELECT id FROM avisos_facturacion_log WHERE periodo = ? AND tipo_aviso = ? AND factura_id = ?',
      [periodoLog, tipo, fac.id],
    );
    if (existente) {
      omitidas += 1;
      continue;
    }
    const alumno = await db.get('SELECT * FROM alumnos WHERE id = ?', [fac.alumno_id]);
    if (!alumno?.usuario_padre_id) {
      omitidas += 1;
      continue;
    }
    const padre = await db.get("SELECT * FROM usuarios_acceso WHERE id = ? AND estado = 'activo'", [
      alumno.usuario_padre_id,
    ]);
    if (!padre) {
      omitidas += 1;
      continue;
    }
    const items = await db.all('SELECT * FROM factura_items WHERE factura_id = ? ORDER BY id', [
      fac.id,
    ]);
    const detalle = pendientesDe(items);
    const pdf = await facturaPdfBuffer(
      fac,
      items as { descripcion: string; monto: number }[],
      alumno,
    );
    const notifId = await queueEmail({
      usuario_id: padre.id,
      email: padre.email,
      titulo,
      mensaje: cuerpo(fac, detalle),
      archivo_nombre: `${fac.numero_factura}.pdf`,
      archivo_mime: 'application/pdf',
      archivo_contenido: pdf.toString('base64'),
    });
    await db.run(
      'INSERT INTO avisos_facturacion_log (periodo, tipo_aviso, padre_id, factura_id, notificacion_id, fecha_envio) VALUES (?, ?, ?, ?, ?, ?)',
      [periodoLog, tipo, padre.id, fac.id, notifId, new Date().toISOString()],
    );
    enviadas += 1;
  }
  return { enviadas, omitidas };
}

export async function runRecordatorioFinMes(periodo: string) {
  // El job es la última red de seguridad: si administración no generó el
  // período, lo genera ahora (generateMonthlyInvoices es idempotente).
  const generadas = await generateMonthlyInvoices(periodo);
  const facturas = await facturasConSaldo(periodo);
  const resultado = await enviarLote(
    periodo,
    'fin_de_mes',
    `Facturación ${periodo} disponible`,
    (f, detalle) =>
      `La factura ${f.numero_factura} del período ${f.periodo} está disponible. ` +
      `Total: $${Number(f.total).toFixed(2)}. Saldo pendiente: $${Number(f.saldo_pendiente).toFixed(2)}.\n\n` +
      `Detalle:\n${detalle}\n\nSe adjunta la factura en PDF.`,
    facturas,
  );
  return { ...generadas, ...resultado };
}

export async function runAvisoDeudaDia20(periodo: string) {
  // El aviso del día 20 no se limita al período actual: cualquier factura con
  // saldo pendiente debe aparecer, aunque sea de meses anteriores. El log usa
  // el mes de ejecución para poder repetir el aviso una vez por mes.
  const facturas = await facturasConSaldo();
  return enviarLote(
    periodo,
    'deuda_dia_20',
    `Recordatorio de deuda ${periodo}`,
    (f, detalle) =>
      `Te recordamos que la factura ${f.numero_factura} del período ${f.periodo} ` +
      `registra un saldo pendiente de $${Number(f.saldo_pendiente).toFixed(2)}.\n\n` +
      `Detalle:\n${detalle}\n\nRegularizá tu situación a la brevedad. Se adjunta el detalle en PDF.`,
    facturas,
  );
}

const PERIODO_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

function assertCronSecret(req: { headers: Record<string, unknown> }) {
  const secret = process.env.CRON_SECRET;
  assert(
    Boolean(secret),
    503,
    'CRON_SECRET no está configurado: los jobs automáticos no pueden ejecutarse.',
  );
  const authorization = String(req.headers.authorization ?? '');
  assert(authorization === `Bearer ${secret}`, 401, 'Cron no autorizado.');
}

// El query `fecha` permite probar el último día hábil y el día 20 sin depender
// del reloj; el endpoint está protegido por CRON_SECRET.
function fechaDeEjecucion(req: { query: Record<string, unknown> }) {
  const override = typeof req.query.fecha === 'string' ? req.query.fecha.trim() : '';
  const fecha = override || new Date().toISOString().slice(0, 10);
  assert(
    /^\d{4}-\d{2}-\d{2}$/.test(fecha),
    400,
    'Ingresá una fecha válida con formato AAAA-MM-DD.',
  );
  return fecha;
}

export function registerBillingJobsRoutes(app: Express) {
  app.post('/api/jobs/recordatorio-fin-mes', async (req, res) => {
    assert(req.user!.rol === 'admin', 403, 'Solo administración puede ejecutar avisos.');
    const periodo = String(req.body?.periodo ?? new Date().toISOString().slice(0, 7)).trim();
    assert(PERIODO_RE.test(periodo), 400, 'Ingresá un período válido con formato AAAA-MM.');
    const result = await runRecordatorioFinMes(periodo);
    await audit(req.user!.id, 'aviso fin de mes', 'avisos_facturacion_log', undefined, periodo);
    res.status(201).json({ periodo, tipo_aviso: 'fin_de_mes', ...result });
  });
  app.post('/api/jobs/aviso-deuda-dia-20', async (req, res) => {
    assert(req.user!.rol === 'admin', 403, 'Solo administración puede ejecutar avisos.');
    const periodo = String(req.body?.periodo ?? new Date().toISOString().slice(0, 7)).trim();
    assert(PERIODO_RE.test(periodo), 400, 'Ingresá un período válido con formato AAAA-MM.');
    const result = await runAvisoDeudaDia20(periodo);
    await audit(req.user!.id, 'aviso deuda día 20', 'avisos_facturacion_log', undefined, periodo);
    res.status(201).json({ periodo, tipo_aviso: 'deuda_dia_20', ...result });
  });

  // Endpoints para Vercel Cron (o cualquier scheduler externo). Se autentican
  // con CRON_SECRET, no con sesión de usuario, y son idempotentes.
  app.get('/api/jobs/cron/fin-de-mes', async (req, res) => {
    assertCronSecret(req);
    const hoy = fechaDeEjecucion(req);
    if (!esUltimoDiaHabil(hoy)) {
      return res.json({
        skipped: true,
        motivo: 'Hoy no es el último día hábil del mes.',
        fecha: hoy,
      });
    }
    const periodo = hoy.slice(0, 7);
    const result = await runRecordatorioFinMes(periodo);
    await deliverPending().catch(() => {});
    await audit(undefined, 'cron fin de mes', 'avisos_facturacion_log', undefined, periodo);
    res.json({ periodo, tipo_aviso: 'fin_de_mes', ...result });
  });

  app.get('/api/jobs/cron/deuda-dia-20', async (req, res) => {
    assertCronSecret(req);
    const hoy = fechaDeEjecucion(req);
    if (hoy.slice(8, 10) !== '20') {
      return res.json({ skipped: true, motivo: 'Hoy no es el día 20.', fecha: hoy });
    }
    const periodo = hoy.slice(0, 7);
    const result = await runAvisoDeudaDia20(periodo);
    await deliverPending().catch(() => {});
    await audit(undefined, 'cron deuda día 20', 'avisos_facturacion_log', undefined, periodo);
    res.json({ periodo, tipo_aviso: 'deuda_dia_20', ...result });
  });
}
