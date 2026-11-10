import { useEffect, useState } from 'react';
import { request, requestBinary } from '../../services/http';
import { Feedback } from '../PortalShell';
import type { Alumno } from '../../types';
import { Download, Wallet, ReceiptText, Upload } from 'lucide-react';
import './fees.css';

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

const estadoTexto = (estado: string) =>
  ({
    pendiente: 'Pendiente',
    parcial: 'Pago parcial',
    en_revision: 'En revisión',
    vencida: 'Vencida',
    pagada: 'Pagada',
    aprobado: 'Aprobado',
    rechazado: 'Rechazado',
  })[estado] ?? estado;
const periodoTexto = (periodo: string) => {
  const [anio, mes] = periodo.split('-').map(Number);
  return new Date(anio, mes - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
};
const fechaTexto = (fecha: string) => {
  const [anio, mes, dia] = fecha.slice(0, 10).split('-').map(Number);
  return new Date(anio, mes - 1, dia).toLocaleDateString('es-AR');
};

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
      request<{ total_deuda: number; facturas: Factura[] }>(`/deuda/alumno/${alumnoId}`).catch(
        () => null,
      ),
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
  const pendientes = facturas.filter((f) =>
    ['pendiente', 'parcial', 'en_revision', 'vencida'].includes(f.estado),
  );
  const pagadas = facturas.filter((f) => f.estado === 'pagada');

  return (
    <div className="fees-panel">
      <Feedback error>{error}</Feedback>
      <Feedback>{mensaje}</Feedback>
      {!alumnoIdFijo && (
        <section className="panel-card fees-student">
          <label>
            Hijo
            <select
              aria-label="Hijo"
              value={alumnoId}
              onChange={(e) => setAlumnoId(e.target.value)}
            >
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
          <section className="fees-overview" aria-label="Estado de cuenta">
            <div className="fees-balance">
              <span>
                <Wallet size={19} aria-hidden="true" /> Estado de cuenta
              </span>
              <h2>{deuda ? 'Saldo pendiente total' : 'Saldo pendiente del período'}</h2>
              <strong>
                {fmt(
                  deuda?.total_deuda ?? facturas.reduce((n, f) => n + Number(f.saldo_pendiente), 0),
                )}
              </strong>
              <p>
                {deuda?.total_deuda === 0
                  ? 'Estás al día. Gracias por acompañarnos.'
                  : 'Elegí una factura para informar tu pago.'}
              </p>
            </div>
            <div className="fees-counts">
              <span>
                <strong>{pendientes.length}</strong> Con saldo
              </span>
              <span>
                <strong>{pagadas.length}</strong> Pagadas
              </span>
            </div>
          </section>
          <section className="panel-card printable-area">
            <div className="section-toolbar">
              <div>
                <span className="eyebrow">Cuotas y facturación</span>
                <h2>Facturas ({visibles.length})</h2>
              </div>
              <button
                className="fees-button fees-print"
                type="button"
                onClick={() => window.print()}
              >
                Imprimir
              </button>
            </div>
            <div className="fees-filters">
              <label>
                Estado
                <select
                  aria-label="Estado"
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                >
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
              {(filtro || desde || hasta) && (
                <button
                  className="fees-button"
                  type="button"
                  onClick={() => {
                    setFiltro('');
                    setDesde('');
                    setHasta('');
                  }}
                >
                  Limpiar filtros
                </button>
              )}
            </div>
            {deuda && (
              <details className="fees-debt">
                <summary>Ver desglose de deuda</summary>
                <p className="fees-muted">
                  Deuda itemizada: {fmt(deuda.total_deuda)} en {deuda.facturas.length} factura(s).
                </p>
                {deuda.facturas.map((f) => (
                  <div key={f.id}>
                    <strong>
                      {f.numero_factura} · {f.periodo} — saldo {fmt(f.saldo_pendiente)}
                    </strong>
                    <ul>
                      {(
                        f as unknown as {
                          items?: {
                            id: number;
                            descripcion: string;
                            monto: number;
                            monto_pagado: number;
                          }[];
                        }
                      ).items?.map((it) => (
                        <li key={it.id}>
                          {it.descripcion} — {fmt(it.monto - it.monto_pagado)} (de {fmt(it.monto)})
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </details>
            )}
            {!visibles.length && <p className="empty-state">No hay facturas para este filtro.</p>}
            {visibles.map((f) => (
              <article className="notice fee-invoice" key={`${alumnoId}-${f.id}`}>
                <div className="fee-invoice-heading">
                  <h3>{periodoTexto(f.periodo)}</h3>
                  <span className={`fee-status fee-status-${f.estado}`}>
                    {estadoTexto(f.estado)}
                  </span>
                </div>
                <p className="fee-invoice-number">
                  {f.numero_factura} · {f.periodo}
                </p>
                <div className="fee-invoice-amounts">
                  <div>
                    <span>{f.saldo_pendiente > 0 ? 'Saldo a pagar' : 'Saldo pendiente'}</span>
                    <strong>{fmt(f.saldo_pendiente)}</strong>
                  </div>
                  <div>
                    <span>Total facturado</span>
                    <b>{fmt(f.total)}</b>
                  </div>
                </div>
                <p className="fee-due">
                  Vencimiento:{' '}
                  {f.fecha_vencimiento ? fechaTexto(f.fecha_vencimiento) : 'Sin definir'}
                </p>
                {f.estado === 'en_revision' && (
                  <p className="fee-review">
                    Estamos revisando tu comprobante. Te avisaremos cuando se valide.
                  </p>
                )}
                <button
                  className="fees-button"
                  type="button"
                  onClick={() => {
                    descargarPdf(`/facturas/${f.id}/pdf`, `${f.numero_factura}.pdf`).catch(
                      (e: Error) => setError(e.message),
                    );
                  }}
                >
                  <Download size={16} aria-hidden="true" /> PDF factura
                </button>
                {f.saldo_pendiente > 0 &&
                  ['pendiente', 'parcial', 'vencida'].includes(f.estado) && (
                    <UploadComprobante
                      facturaId={f.id}
                      onSubido={() => {
                        setMensaje('Comprobante enviado, quedó en revisión.');
                        setRefreshKey((k) => k + 1);
                      }}
                    />
                  )}
              </article>
            ))}
          </section>
          <section className="panel-card fees-records">
            <span className="eyebrow">
              <ReceiptText size={16} aria-hidden="true" /> Pagos confirmados
            </span>
            <h2>Recibos ({recibos.length})</h2>
            {!recibos.length && <p className="empty-state">Sin recibos en el rango.</p>}
            {recibos.map((r) => (
              <div className="fee-record" key={r.id}>
                <div>
                  <strong>{fmt(r.monto_total)}</strong>
                  <span>{r.numero_recibo}</span>
                  <small>{fechaTexto(r.fecha_emision)}</small>
                </div>
                <button
                  className="fees-button"
                  type="button"
                  onClick={() => {
                    descargarPdf(`/recibos/${r.id}/pdf`, `${r.numero_recibo}.pdf`).catch(
                      (e: Error) => setError(e.message),
                    );
                  }}
                >
                  <Download size={16} aria-hidden="true" /> PDF recibo
                </button>
              </div>
            ))}
          </section>
          <section className="panel-card">
            <h2>Comprobantes: {comprobantes.length}</h2>
            <p className="fees-muted">Seguí el estado de los pagos que informaste.</p>
            {!comprobantes.length && (
              <p className="empty-state">Todavía no enviaste comprobantes.</p>
            )}
            {comprobantes.length > 0 && (
              <ul className="fee-proof-list">
                {comprobantes.map((c) => (
                  <li className="fee-proof" key={c.id}>
                    <div className="fee-invoice-heading">
                      <strong>Comprobante #{c.id}</strong>
                      <span className={`fee-status fee-status-${c.estado}`}>
                        {estadoTexto(c.estado)}
                      </span>
                    </div>
                    <p>
                      {fmt(c.monto_declarado)} · {fechaTexto(c.fecha_presentacion)}
                    </p>
                    {c.estado === 'rechazado' && (
                      <p className="fee-rejection">
                        {c.motivo_rechazo ?? 'Consultá con administración el motivo del rechazo.'}
                      </p>
                    )}
                    <a href={`/api/comprobantes/${c.id}/archivo`} target="_blank" rel="noreferrer">
                      Ver archivo
                    </a>
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
  const [items, setItems] = useState<
    { id: number; descripcion: string; monto: number; monto_pagado: number; estado: string }[]
  >([]);
  const [seleccion, setSeleccion] = useState<number[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [referencia, setReferencia] = useState('');
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');
  const [cargandoItems, setCargandoItems] = useState(true);
  useEffect(() => {
    request<{
      items: {
        id: number;
        descripcion: string;
        monto: number;
        monto_pagado: number;
        estado: string;
      }[];
    }>(`/facturas/${facturaId}`)
      .then((d) =>
        setItems(
          d.items.filter((it) => it.estado === 'pendiente' && it.monto - it.monto_pagado > 0),
        ),
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargandoItems(false));
  }, [facturaId]);
  const enviar = async () => {
    if (subiendo) return;
    setError('');
    setSubiendo(true);
    try {
      if (!seleccion.length) throw new Error('Seleccioná al menos un concepto.');
      if (!archivo) throw new Error('Elegí el comprobante (JPG/PNG/PDF hasta 3 MB).');
      const tiposPermitidos = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!tiposPermitidos.includes(archivo.type))
        throw new Error('El comprobante debe ser JPG, PNG o PDF.');
      if (archivo.size > MAX_COMPROBANTE_BYTES)
        throw new Error('El archivo supera los 3 MB. Probá con una foto más liviana o un PDF.');
      const b64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
        r.onerror = () => reject(new Error('No se pudo leer el archivo.'));
        r.readAsDataURL(archivo);
      });
      const elegidos = items.filter((it) => seleccion.includes(it.id));
      const total =
        Math.round(elegidos.reduce((n, it) => n + (it.monto - it.monto_pagado), 0) * 100) / 100;
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
    <details className="fee-upload">
      <summary>
        <Upload size={17} aria-hidden="true" /> Informar un pago
      </summary>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void enviar();
        }}
      >
        <p className="fees-muted">
          Seleccioná los conceptos que pagaste y adjuntá tu transferencia. Administración la
          revisará.
        </p>
        <Feedback error>{error}</Feedback>
        {cargandoItems ? (
          <p role="status">Cargando conceptos…</p>
        ) : (
          !items.length && <p className="empty-state">No hay conceptos pendientes de pago.</p>
        )}
        <fieldset className="fee-concepts" disabled={subiendo}>
          <legend>1. ¿Qué conceptos pagaste?</legend>
          {items.map((it) => {
            const saldo = it.monto - it.monto_pagado;
            const bloqueado = saldo <= 0;
            return (
              <label className="fee-concept" key={it.id}>
                <input
                  type="checkbox"
                  disabled={bloqueado}
                  checked={seleccion.includes(it.id)}
                  onChange={(e) =>
                    setSeleccion(
                      e.target.checked
                        ? [...seleccion, it.id]
                        : seleccion.filter((s) => s !== it.id),
                    )
                  }
                />
                <span>
                  {it.descripcion}
                  <strong>{fmt(saldo)}</strong>
                </span>
              </label>
            );
          })}
        </fieldset>
        <div className="fee-selected-total">
          <span>Total seleccionado</span>
          <strong>
            {fmt(
              items
                .filter((it) => seleccion.includes(it.id))
                .reduce((n, it) => n + (it.monto - it.monto_pagado), 0),
            )}
          </strong>
        </div>
        <label>
          2. Adjuntá el comprobante
          <span className="fees-muted">JPG, PNG o PDF · Hasta 3 MB</span>
          <input
            type="file"
            aria-label="Archivo del comprobante"
            disabled={subiendo}
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={(e) => {
              const elegido = e.target.files?.[0] ?? null;
              if (elegido && elegido.size > MAX_COMPROBANTE_BYTES) {
                setError('El archivo supera los 3 MB. Probá con una foto más liviana o un PDF.');
                setArchivo(null);
                return;
              }
              setError('');
              setArchivo(elegido);
            }}
          />
        </label>
        <label>
          Referencia de transferencia (opcional)
          <input
            placeholder="Referencia de transferencia"
            disabled={subiendo}
            value={referencia}
            onChange={(e) => setReferencia(e.target.value)}
          />
        </label>
        <button
          className="fees-button fees-button-primary"
          type="submit"
          disabled={subiendo || cargandoItems || !items.length}
        >
          {subiendo ? 'Subiendo…' : 'Subir comprobante'}
        </button>
      </form>
    </details>
  );
}
