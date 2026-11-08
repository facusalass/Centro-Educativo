import { useEffect, useState } from 'react';
import { request, requestBinary } from '../../services/http';
import { Feedback } from '../PortalShell';
import type { Alumno } from '../../types';

export type FacturaItem = {
  id: number;
  factura_id: number;
  tipo: 'base' | 'deporte' | 'transporte' | 'comedor';
  referencia_id: number | null;
  descripcion: string;
  monto: number;
  monto_pagado: number;
  estado: string;
};

export type Factura = {
  id: number;
  numero_factura: string;
  alumno_id: number;
  periodo: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  total: number;
  saldo_pendiente: number;
  estado: string;
};

export type PagoComprobante = {
  id: number;
  factura_id: number;
  fecha_presentacion: string;
  monto_declarado: number;
  estado: string;
  motivo_rechazo: string | null;
};

export type Recibo = {
  id: number;
  numero_recibo: string;
  factura_id: number;
  fecha_emision: string;
  monto_total: number;
};

const fmt = (n: number) =>
  Number(n).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

async function descargarPdf(path: string, nombre: string) {
  const blob = await requestBinary(path);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function StudentFeesPanel({ alumnoIdFijo }: { alumnoIdFijo?: number }) {
  const [hijos, setHijos] = useState<Alumno[]>([]);
  const [alumnoId, setAlumnoId] = useState(alumnoIdFijo ? String(alumnoIdFijo) : '');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [comprobantes, setComprobantes] = useState<PagoComprobante[]>([]);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');
  const [deuda, setDeuda] = useState<{ total_deuda: number; facturas: Factura[] } | null>(null);
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (alumnoIdFijo) return;
    request<Alumno[]>('/padres/hijos')
      .then((rows) => {
        setHijos(rows);
        if (rows[0]) setAlumnoId(String(rows[0].id));
      })
      .catch((e: Error) => setError(e.message));
  }, [alumnoIdFijo]);

  const cargarDatos = () => {
    if (!alumnoId) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError('');
    const params = new URLSearchParams({ alumno_id: alumnoId });
    if (desde) params.set('desde', desde);
    if (hasta) params.set('hasta', hasta);
    const pagosParams = new URLSearchParams();
    if (desde) pagosParams.set('desde', desde);
    if (hasta) pagosParams.set('hasta', hasta);
    const pagosQs = pagosParams.toString();
    Promise.all([
      request<Factura[]>(`/facturas?${params.toString()}`),
      request<{ comprobantes: PagoComprobante[]; recibos: Recibo[] }>(
        `/pagos/alumno/${alumnoId}${pagosQs ? `?${pagosQs}` : ''}`,
      ),
      request<{ total_deuda: number; facturas: Factura[] }>(`/deuda/alumno/${alumnoId}`).catch(() => null),
    ])
      .then(([facs, pagos, debt]) => {
        setFacturas(facs);
        setDeuda(debt);
        setComprobantes(pagos.comprobantes);
        setRecibos(pagos.recibos);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  };

  useEffect(cargarDatos, [alumnoId, desde, hasta, refreshKey]);

  const visibles = filtro ? facturas.filter((f) => f.estado === filtro) : facturas;
  const pendientes = facturas.filter((f) => ['pendiente', 'parcial', 'en_revision', 'vencida'].includes(f.estado));
  const pagadas = facturas.filter((f) => f.estado === 'pagada');

  return (
    <div>
      <Feedback error>{error}</Feedback>
      <Feedback>{mensaje}</Feedback>
      {!alumnoIdFijo && (
        <section className="panel-card">
          <label>
            Hijo
            <select value={alumnoId} onChange={(e) => setAlumnoId(e.target.value)}>
              <option value="">Seleccionar…</option>
              {hijos.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} {c.apellido}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}
      {cargando ? (
        <p className="empty-state">Cargando cuotas…</p>
      ) : !alumnoId ? (
        <p className="empty-state">Seleccioná un alumno para ver sus cuotas.</p>
      ) : (
        <>
          <section className="panel-card printable-area">
            <div className="section-toolbar">
              <div>
                <span className="eyebrow">Cuotas y facturación</span>
                <h2>Facturas ({visibles.length})</h2>
              </div>
              <label>
                Estado
                <select value={filtro} onChange={(e) => setFiltro(e.target.value)}>
                  <option value="">Todas</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="parcial">Parciales</option>
                  <option value="en_revision">En revisión</option>
                  <option value="vencida">Vencidas</option>
                  <option value="pagada">Pagadas</option>
                </select>
              </label>
              <label>
                Desde
                <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
              </label>
              <label>
                Hasta
                <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
              </label>
              <button type="button" onClick={() => window.print()}>Imprimir</button>
            </div>
            {deuda && (
              <div>
                <p>Deuda itemizada: {fmt(deuda.total_deuda)} en {deuda.facturas.length} factura(s).</p>
                {deuda.facturas.map((f) => (
                  <div key={f.id}>
                    <strong>{f.numero_factura} · {f.periodo} — saldo {fmt(f.saldo_pendiente)}</strong>
                    <ul>
                      {(f as unknown as { items?: { id: number; descripcion: string; monto: number; monto_pagado: number }[] }).items?.map((it) => (
                        <li key={it.id}>{it.descripcion} — {fmt(it.monto - it.monto_pagado)} (de {fmt(it.monto)})</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            {!visibles.length && <p className="empty-state">No hay facturas para este filtro.</p>}
            {visibles.map((f) => (
              <article className="notice" key={f.id}>
                <div>
                  <strong>
                    {f.numero_factura} · {f.periodo}
                  </strong>
                  <p>
                    Total {fmt(f.total)} · Saldo {fmt(f.saldo_pendiente)} · {f.estado} ·
                    vence {f.fecha_vencimiento?.slice(0, 10)}
                  </p>
                </div>
                <button type="button" onClick={() => { descargarPdf(`/facturas/${f.id}/pdf`, `${f.numero_factura}.pdf`).catch((e: Error) => setError(e.message)); }}>PDF factura</button>
                {f.saldo_pendiente > 0 && ['pendiente', 'parcial', 'vencida'].includes(f.estado) && (
                  <UploadComprobante facturaId={f.id} onSubido={() => { setMensaje('Comprobante enviado, quedó en revisión.'); setRefreshKey((k) => k + 1); }} />
                )}
              </article>
            ))}
          </section>
          <section className="panel-card">
            <h2>Recibos ({recibos.length})</h2>
            {!recibos.length && <p className="empty-state">Sin recibos en el rango.</p>}
            {recibos.map((r) => (
              <p key={r.id}>
                {r.numero_recibo} · {fmt(r.monto_total)}{' '}
                <button type="button" onClick={() => { descargarPdf(`/recibos/${r.id}/pdf`, `${r.numero_recibo}.pdf`).catch((e: Error) => setError(e.message)); }}>PDF recibo</button>
              </p>
            ))}
          </section>
          <section className="panel-card">
            <h2>Resumen</h2>
            <p>
              Pendientes: {pendientes.length} · Pagadas: {pagadas.length} · Comprobantes:{' '}
              {comprobantes.length} · Recibos: {recibos.length}
            </p>
            {comprobantes.length > 0 && (
              <ul>
                {comprobantes.map((c) => (
                  <li key={c.id}>
                    Comprobante #{c.id} · {c.estado}
                    {c.estado === 'rechazado' ? `: ${c.motivo_rechazo ?? 'sin motivo'}` : ''}{' '}
                    <a href={`/api/comprobantes/${c.id}/archivo`} target="_blank" rel="noreferrer">Ver archivo</a>
                  </li>
                ))}
              </ul>
            )}
            {comprobantes.some((c) => c.estado === 'rechazado') && (
              <ul>
                {comprobantes
                  .filter((c) => c.estado === 'rechazado')
                  .map((c) => (
                    <li key={c.id}>
                      Comprobante #{c.id} rechazado: {c.motivo_rechazo ?? 'sin motivo'}
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function UploadComprobante({ facturaId, onSubido }: { facturaId: number; onSubido: () => void }) {
  // Vercel corta en 4.5 MB por request y el Base64 infla ~33 %: tope cliente de 3 MB.
  const MAX_COMPROBANTE_BYTES = 3 * 1024 * 1024;
  const [items, setItems] = useState<{ id: number; descripcion: string; monto: number; monto_pagado: number }[]>([]);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [referencia, setReferencia] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    request<{ items: { id: number; descripcion: string; monto: number; monto_pagado: number }[] }>(`/facturas/${facturaId}`)
      .then((d) => setItems(d.items))
      .catch(() => {});
  }, [facturaId]);
  const enviar = async () => {
    if (subiendo) return;
    setError('');
    setSubiendo(true);
    try {
      if (!seleccion.length) throw new Error('Seleccioná al menos un concepto.');
      if (!archivo) throw new Error('Elegí el comprobante (JPG/PNG/PDF hasta 5 MB).');
      if (archivo.size > MAX_COMPROBANTE_BYTES) throw new Error('El archivo supera los 3 MB. Probá con una foto más liviana o un PDF.');
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
        r.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        r.readAsDataURL(archivo);
      });
      const elegidos = items.filter((it) => seleccion.includes(it.id));
      const total = Math.round(elegidos.reduce((n, it) => n + (it.monto - it.monto_pagado), 0) * 100) / 100;
      await request(`/facturas/${facturaId}/comprobantes`, {
        method: 'POST',
        body: JSON.stringify({
          item_ids: seleccion,
          archivo_nombre: archivo.name,
          archivo_mime: archivo.type,
          archivo_contenido: b64,
          monto_declarado: total,
          referencia_transferencia: referencia,
        }),
      });
      onSubido();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubiendo(false);
    }
  };
  return (
    <div>
      <Feedback error>{error}</Feedback>
      {items.map((it) => {
        const saldo = it.monto - it.monto_pagado;
        const bloqueado = saldo <= 0;
        return (
          <label key={it.id}>
            <input
              type="checkbox"
              disabled={bloqueado}
              checked={seleccion.includes(it.id)}
              onChange={(e) => setSeleccion(e.target.checked ? [...seleccion, it.id] : seleccion.filter((s) => s !== it.id))}
            />
            {it.descripcion} (saldo {saldo.toFixed(2)}){bloqueado ? ' — pagado' : ''}
          </label>
        );
      })}
      <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={(e) => {
        const elegido = e.target.files?.[0] ?? null;
        if (elegido && elegido.size > MAX_COMPROBANTE_BYTES) {
          setError('El archivo supera los 3 MB. Probá con una foto más liviana o un PDF.');
          setArchivo(null);
          return;
        }
        setArchivo(elegido);
      }} />
      <input placeholder="Referencia de transferencia" value={referencia} onChange={(e) => setReferencia(e.target.value)} />
      <button type="button" disabled={subiendo} onClick={() => void enviar()}>{subiendo ? 'Subiendo…' : 'Subir comprobante'}</button>
    </div>
  );
}
