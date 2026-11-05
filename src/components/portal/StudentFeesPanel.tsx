import { useEffect, useState } from 'react';
import { request } from '../../services/api';
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

export function StudentFeesPanel({ alumnoIdFijo }: { alumnoIdFijo?: number }) {
  const [hijos, setHijos] = useState<Alumno[]>([]);
  const [alumnoId, setAlumnoId] = useState(alumnoIdFijo ? String(alumnoIdFijo) : '');
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [comprobantes, setComprobantes] = useState<PagoComprobante[]>([]);
  const [recibos, setRecibos] = useState<Recibo[]>([]);
  const [filtro, setFiltro] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (alumnoIdFijo) return;
    request<Alumno[]>('/padres/hijos')
      .then((rows) => {
        setHijos(rows);
        if (rows[0]) setAlumnoId(String(rows[0].id));
      })
      .catch((e: Error) => setError(e.message));
  }, [alumnoIdFijo]);

  useEffect(() => {
    if (!alumnoId) {
      setCargando(false);
      return;
    }
    setCargando(true);
    setError('');
    Promise.all([
      request<Factura[]>(`/facturas?alumno_id=${alumnoId}`),
      request<{ comprobantes: PagoComprobante[]; recibos: Recibo[] }>(
        `/pagos/alumno/${alumnoId}`,
      ),
    ])
      .then(([facs, pagos]) => {
        setFacturas(facs);
        setComprobantes(pagos.comprobantes);
        setRecibos(pagos.recibos);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setCargando(false));
  }, [alumnoId]);

  const visibles = filtro ? facturas.filter((f) => f.estado === filtro) : facturas;
  const pendientes = facturas.filter((f) => ['pendiente', 'parcial', 'en_revision', 'vencida'].includes(f.estado));
  const pagadas = facturas.filter((f) => f.estado === 'pagada');

  return (
    <div>
      <Feedback error>{error}</Feedback>
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
          <section className="panel-card">
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
            </div>
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
              </article>
            ))}
          </section>
          <section className="panel-card">
            <h2>Resumen</h2>
            <p>
              Pendientes: {pendientes.length} · Pagadas: {pagadas.length} · Comprobantes:{' '}
              {comprobantes.length} · Recibos: {recibos.length}
            </p>
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
