import type { Express } from 'express';
import { db } from '../database.js';
import { assert } from './errors.js';
import { audit } from './security.js';
import { displayEstado, generateMonthlyInvoices } from './billing.js';
import { facturaPdfBuffer } from './documents.js';
import { queueEmail } from './notifications.js';

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

async function facturasConSaldo(periodo: string): Promise<any[]> {
  const rows = await db.all('SELECT * FROM facturas WHERE periodo = ? ORDER BY id', [periodo]);
  return rows.filter((r) => Number(r.saldo_pendiente) > 0).map((r) => ({ ...r, estado: displayEstado(r) }));
}

async function enviarLote(periodo: string, tipo: 'fin_de_mes' | 'deuda_dia_20', titulo: string, cuerpo: (f: any) => string) {
  let enviadas = 0;
  let omitidas = 0;
  for (const fac of await facturasConSaldo(periodo)) {
    const existente = await db.get(
      'SELECT id FROM avisos_facturacion_log WHERE periodo = ? AND tipo_aviso = ? AND factura_id = ?',
      [periodo, tipo, fac.id],
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
    const padre = await db.get("SELECT * FROM usuarios_acceso WHERE id = ? AND estado = 'activo'", [alumno.usuario_padre_id]);
    if (!padre) {
      omitidas += 1;
      continue;
    }
    const items = await db.all('SELECT * FROM factura_items WHERE factura_id = ? ORDER BY id', [fac.id]);
    const pdf = await facturaPdfBuffer(fac, items as { descripcion: string; monto: number }[], alumno);
    const notifId = await queueEmail({
      usuario_id: padre.id,
      email: padre.email,
      titulo,
      mensaje: cuerpo(fac),
      archivo_nombre: `${fac.numero_factura}.pdf`,
      archivo_mime: 'application/pdf',
      archivo_contenido: pdf.toString('base64'),
    });
    await db.run(
      'INSERT INTO avisos_facturacion_log (periodo, tipo_aviso, padre_id, factura_id, notificacion_id, fecha_envio) VALUES (?, ?, ?, ?, ?, ?)',
      [periodo, tipo, padre.id, fac.id, notifId, new Date().toISOString()],
    );
    enviadas += 1;
  }
  return { enviadas, omitidas };
}

export async function runRecordatorioFinMes(periodo: string) {
  await generateMonthlyInvoices(periodo);
  return enviarLote(periodo, 'fin_de_mes', `Facturación ${periodo} disponible`, (f) => `La factura ${f.numero_factura} del período ${periodo} está disponible. Saldo pendiente: $${Number(f.saldo_pendiente).toFixed(2)}. Se adjunta el comprobante en PDF.`);
}

export async function runAvisoDeudaDia20(periodo: string) {
  return enviarLote(periodo, 'deuda_dia_20', `Recordatorio de deuda ${periodo}`, (f) => `Te recordamos que la factura ${f.numero_factura} del período ${periodo} registra un saldo pendiente de $${Number(f.saldo_pendiente).toFixed(2)}. Regularizá tu situación a la brevedad.`);
}

const PERIODO_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

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
}
