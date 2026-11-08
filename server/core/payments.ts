import type { Express } from 'express';
import express from 'express';
import { db } from '../database.js';
import { assert, idOf } from './errors.js';
import { audit, requireStudent } from './security.js';
import { objectBody } from './validation.js';
import { round2 } from './billing.js';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'application/pdf']);

function extractBase64(input: string): string {
  const s = String(input ?? '');
  const idx = s.indexOf(',');
  if (s.startsWith('data:') && idx >= 0) return s.slice(idx + 1);
  return s;
}

function validateArchivo(nombre: unknown, mime: unknown, contenido: unknown) {
  assert(typeof nombre === 'string' && nombre.length > 0 && nombre.length <= 255, 400, 'Ingresá un nombre de archivo válido.');
  assert(typeof mime === 'string' && ALLOWED_MIME.has(mime), 400, 'El comprobante debe ser JPG, PNG o PDF.');
  const lower = nombre.toLowerCase();
  if (mime === 'image/jpeg') assert(/\.jpe?g$/.test(lower), 400, 'La extensión no coincide con el tipo JPG.');
  if (mime === 'image/png') assert(/\.png$/.test(lower), 400, 'La extensión no coincide con el tipo PNG.');
  if (mime === 'application/pdf') assert(/\.pdf$/.test(lower), 400, 'La extensión no coincide con el tipo PDF.');
  assert(typeof contenido === 'string' && contenido.length > 0, 400, 'Ingresá el archivo del comprobante.');
  const b64 = extractBase64(contenido);
  assert(/^[A-Za-z0-9+/=\s]+$/.test(b64), 400, 'El archivo no es base64 válido.');
  let size = 0;
  try {
    size = Buffer.from(b64, 'base64').length;
  } catch {
    assert(false, 400, 'El archivo no es base64 válido.');
  }
  assert(size > 0 && size <= MAX_FILE_BYTES, 400, 'El comprobante debe pesar hasta 5 MB.');
  return { b64, size };
}

async function nextReciboNumero(): Promise<string> {
  const ym = new Date().toISOString().slice(0, 7).replace('-', '');
  const prefix = `REC-${ym}-`;
  const row = await db.get('SELECT numero_recibo FROM recibos WHERE numero_recibo LIKE ? ORDER BY numero_recibo DESC LIMIT 1', [`${prefix}%`]);
  const next = row ? Number(String(row.numero_recibo).slice(-4)) + 1 || 1 : 1;
  return `${prefix}${String(next).padStart(4, '0')}`;
}

async function recomputeFactura(facturaId: number) {
  const items = await db.all('SELECT * FROM factura_items WHERE factura_id = ?', [facturaId]);
  const pagado = round2(items.reduce((n, it) => n + Number(it.monto_pagado), 0));
  const factura = await db.get('SELECT * FROM facturas WHERE id = ?', [facturaId]);
  const saldo = round2(Number(factura.total) - pagado);
  let estado = 'pendiente';
  if (saldo <= 0) estado = 'pagada';
  else if (items.some((it) => it.estado === 'en_revision')) estado = 'en_revision';
  else if (pagado > 0) estado = 'parcial';
  await db.run('UPDATE facturas SET saldo_pendiente = ?, estado = ? WHERE id = ?', [saldo, estado, facturaId]);
  return { saldo, estado };
}

export function registerPaymentsRoutes(app: Express) {
  app.post('/api/facturas/:id/comprobantes', express.json({ limit: '8mb' }), async (req, res) => {
    assert(['padre', 'admin'].includes(req.user!.rol), 403, 'Tu perfil no tiene permiso para esta operación.');
    const factura = await db.get('SELECT * FROM facturas WHERE id = ?', [idOf(req.params.id)]);
    assert(factura, 404, 'Factura no encontrada.');
    const alumno = await requireStudent(req, factura.alumno_id);
    assert(req.user!.rol !== 'alumno', 403, 'Tu perfil no tiene permiso para esta operación.');
    const input = objectBody(req.body);
    const itemIds = Array.isArray(input.item_ids) ? input.item_ids.map((v) => idOf(v)) : [];
    assert(itemIds.length > 0, 400, 'Seleccioná al menos un concepto a pagar.');
    const archivo = validateArchivo(input.archivo_nombre, input.archivo_mime, input.archivo_contenido);
    const montoDeclarado = round2(Number(input.monto_declarado));
    assert(Number.isFinite(montoDeclarado) && montoDeclarado > 0, 400, 'Ingresá un monto válido.');
    const referencia = typeof input.referencia_transferencia === 'string' ? input.referencia_transferencia.slice(0, 100) : '';
    const dbItems = await db.all(`SELECT * FROM factura_items WHERE id IN (${itemIds.map(() => '?').join(', ')})`, itemIds);
    assert(dbItems.length === itemIds.length, 400, 'Algún concepto no pertenece a la factura.');
    let imputable = 0;
    for (const it of dbItems) {
      assert(it.factura_id === factura.id, 400, 'Algún concepto no pertenece a la factura.');
      const resto = round2(Number(it.monto) - Number(it.monto_pagado));
      assert(resto > 0, 400, 'Algún concepto ya está pagado.');
      assert(it.estado !== 'pagado', 400, 'Algún concepto ya está pagado.');
      assert(it.estado !== 'en_revision', 400, 'Algún concepto ya tiene un comprobante en revisión.');
      imputable = round2(imputable + resto);
    }
    assert(imputable === montoDeclarado, 400, 'El monto declarado debe igualar la suma de los conceptos.');
    const padreId = req.user!.rol === 'padre' ? req.user!.id : (alumno.usuario_padre_id ?? req.user!.id);
    const result = await db.transaction(async () => {
      const comprobanteId = await db.insert('pagos_comprobantes', {
        factura_id: factura.id,
        padre_id: padreId,
        fecha_presentacion: new Date().toISOString(),
        monto_declarado: montoDeclarado,
        referencia_transferencia: referencia,
        archivo_nombre: String(input.archivo_nombre),
        archivo_mime: String(input.archivo_mime),
        archivo_contenido: archivo.b64,
        estado: 'en_revision',
      });
      for (const it of dbItems) {
        const resto = round2(Number(it.monto) - Number(it.monto_pagado));
        await db.insert('pago_comprobante_items', {
          comprobante_id: comprobanteId,
          factura_item_id: it.id,
          monto_imputado: resto,
        });
        await db.run("UPDATE factura_items SET estado = 'en_revision' WHERE id = ?", [it.id]);
      }
      await db.run("UPDATE facturas SET estado = 'en_revision' WHERE id = ? AND estado <> 'pagada'", [factura.id]);
      return comprobanteId;
    });
    await audit(req.user!.id, 'presentar comprobante', 'pagos_comprobantes', result, String(factura.id));
    res.status(201).json({ id: result, estado: 'en_revision' });
  });

  app.get('/api/admin/comprobantes', async (req, res) => {
    assert(req.user!.rol === 'admin', 403, 'Solo administración puede validar pagos.');
    const q = req.query as Record<string, unknown>;
    const rows = typeof q.estado === 'string' && q.estado
      ? await db.all('SELECT * FROM pagos_comprobantes WHERE estado = ? ORDER BY id DESC', [q.estado])
      : await db.all('SELECT * FROM pagos_comprobantes ORDER BY id DESC');
    res.json(rows);
  });

  app.put('/api/admin/comprobantes/:id/validar', async (req, res) => {
    assert(req.user!.rol === 'admin', 403, 'Solo administración puede validar pagos.');
    const input = objectBody(req.body);
    const accion = String(input.accion ?? '');
    assert(['aprobar', 'rechazar'].includes(accion), 400, 'Acción inválida.');
    const id = idOf(req.params.id);
    if (accion === 'rechazar') {
      assert(typeof input.motivo_rechazo === 'string' && input.motivo_rechazo.trim().length > 0, 400, 'El motivo de rechazo es obligatorio.');
      const motivo = String(input.motivo_rechazo).trim().slice(0, 500);
      await db.transaction(async () => {
        const comp = await db.get('SELECT * FROM pagos_comprobantes WHERE id = ?', [id]);
        assert(comp, 404, 'Comprobante no encontrado.');
        assert(comp.estado === 'en_revision', 400, 'El comprobante ya fue validado.');
        await db.run('UPDATE pagos_comprobantes SET estado = ?, motivo_rechazo = ?, validado_por = ?, fecha_validacion = ? WHERE id = ?', ['rechazado', motivo, req.user!.id, new Date().toISOString(), id]);
        const puente = await db.all('SELECT * FROM pago_comprobante_items WHERE comprobante_id = ?', [id]);
        for (const p of puente) {
          const otros = await db.get('SELECT c.id FROM pagos_comprobantes c JOIN pago_comprobante_items i ON i.comprobante_id = c.id WHERE i.factura_item_id = ? AND c.estado = ? AND c.id <> ? LIMIT 1', [p.factura_item_id, 'en_revision', id]);
          if (!otros) await db.run("UPDATE factura_items SET estado = 'pendiente' WHERE id = ?", [p.factura_item_id]);
        }
        await recomputeFactura(comp.factura_id);
      });
      await audit(req.user!.id, 'rechazar comprobante', 'pagos_comprobantes', id);
      return res.json({ ok: true, estado: 'rechazado' });
    }
    const out = await db.transaction(async () => {
      const comp = await db.get('SELECT * FROM pagos_comprobantes WHERE id = ?', [id]);
      assert(comp, 404, 'Comprobante no encontrado.');
      assert(comp.estado === 'en_revision', 400, 'El comprobante ya fue validado.');
      const puente = await db.all('SELECT * FROM pago_comprobante_items WHERE comprobante_id = ?', [id]);
      assert(puente.length > 0, 400, 'El comprobante no tiene conceptos.');
      for (const p of puente) {
        const it = await db.get('SELECT * FROM factura_items WHERE id = ?', [p.factura_item_id]);
        const nuevo = round2(Number(it.monto_pagado) + Number(p.monto_imputado));
        assert(nuevo <= Number(it.monto) + 1e-9, 400, 'El pago supera el concepto.');
        await db.run('UPDATE factura_items SET monto_pagado = ?, estado = ? WHERE id = ?', [nuevo, nuevo >= Number(it.monto) ? 'pagado' : 'pendiente', it.id]);
      }
      const factura = await db.get('SELECT * FROM facturas WHERE id = ?', [comp.factura_id]);
      const numero_recibo = await nextReciboNumero();
      const reciboId = await db.insert('recibos', {
        numero_recibo,
        comprobante_id: comp.id,
        factura_id: factura.id,
        alumno_id: factura.alumno_id,
        fecha_emision: new Date().toISOString(),
        monto_total: comp.monto_declarado,
        detalle_json: JSON.stringify({ comprobante_id: comp.id, factura_id: factura.id, items: puente }),
      });
      await db.run('UPDATE pagos_comprobantes SET estado = ?, validado_por = ?, fecha_validacion = ? WHERE id = ?', ['aprobado', req.user!.id, new Date().toISOString(), id]);
      const { estado } = await recomputeFactura(factura.id);
      return { reciboId, numero_recibo, estado };
    });
    await audit(req.user!.id, 'aprobar comprobante', 'pagos_comprobantes', id);
    res.json({ ok: true, estado: 'aprobado', ...out });
  });

  app.get('/api/comprobantes/:id/archivo', async (req, res) => {
    assert(['padre', 'admin'].includes(req.user!.rol), 403, 'Tu perfil no tiene permiso para esta operación.');
    const comp = await db.get('SELECT * FROM pagos_comprobantes WHERE id = ?', [idOf(req.params.id)]);
    assert(comp, 404, 'Comprobante no encontrado.');
    const factura = await db.get('SELECT * FROM facturas WHERE id = ?', [comp.factura_id]);
    await requireStudent(req, factura.alumno_id);
    assert(ALLOWED_MIME.has(comp.archivo_mime), 400, 'Tipo de archivo no soportado.');
    const buf = Buffer.from(extractBase64(comp.archivo_contenido), 'base64');
    assert(buf.length > 0 && buf.length <= MAX_FILE_BYTES, 400, 'Archivo inválido.');
    res.type(comp.archivo_mime);
    res.set('Content-Disposition', `inline; filename="${String(comp.archivo_nombre).replace(/"/g, '')}"`);
    res.send(buf);
  });
}
