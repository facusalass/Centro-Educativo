import { Communications } from '../components/management/Communications';
import { PaymentProofsQueue } from '../components/management/PaymentProofsQueue';
import { AuditLog } from '../components/management/AuditLog';
import { useState } from 'react';
import type { Alumno, Curso, Deporte, Docente, GrupoDeporte, RecorridoTransporte } from '../types';
import { RefreshCw } from 'lucide-react';
import { useManagementData } from '../hooks/useManagementData';
import { PortalShell, Feedback } from '../components/PortalShell';
import { EntityManager, entityDefinitions } from '../components/EntityManager';
import { ReportesViewer } from '../components/ReportesViewer';
import { AsistenciasSection } from '../components/AsistenciasSection';
import { AcademicPanel } from '../components/AcademicPanel';
import { EnrollmentPanel } from '../components/EnrollmentPanel';
import { api } from '../services/api';
import { Button } from '../components/Button';
export function ManagementPage() {
  const [tab, setTab] = useState('alumnos');
  const { data, loading, error, reload } = useManagementData();
  const catalog = data?.catalog ?? {};
  const status = data?.status;
  const refresh = () => {
    void reload().catch(() => {});
  };
  const load = async () => {
    await reload();
  };
  const extraTabs = {
    inscripciones: 'Inscripciones y matrícula',
    comprobantes: 'Validación de pagos',
    facturacion: 'Facturación y avisos',
    evaluaciones: 'Evaluaciones',
    asistencias: 'Asistencias',
    reportes: 'Reportes',
    comunicaciones: 'Solicitudes y mensajes',
    auditoria: 'Auditoría',
  };
  return (
    <PortalShell title="Gestión institucional">
      <div className="admin-stats">
        <article>
          <span>Alumnos activos</span>
          <strong>{catalog.alumnos?.filter((a) => a.estado === 'activo').length ?? '—'}</strong>
        </article>
        <article>
          <span>Docentes activos</span>
          <strong>{catalog.docentes?.filter((a) => a.estado === 'activo').length ?? '—'}</strong>
        </article>
        <article>
          <span>Cursos</span>
          <strong>{catalog.cursos?.length ?? '—'}</strong>
        </article>
      </div>
      {status && !status.smtp && (
        <Feedback>
          El correo está pendiente de configurar. Las notificaciones se guardan en la bandeja
          familiar y quedan en cola para su envío.
        </Feedback>
      )}
      <Feedback error>{error}</Feedback>
      <div className="workspace-layout">
        <nav className="workspace-nav" aria-label="Módulos de administración">
          {Object.entries(entityDefinitions).map(([key, value]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
              {value.title}
            </button>
          ))}
          {Object.entries(extraTabs).map(([key, title]) => (
            <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
              {title}
            </button>
          ))}
        </nav>
        <div className="workspace-content">
          <div className="refresh-toolbar">
            <Button variant="outline" disabled={loading} onClick={refresh}>
              <RefreshCw size={16} /> {loading ? 'Cargando…' : 'Actualizar datos'}
            </Button>
          </div>
          {data && entityDefinitions[tab] && (
            <EntityManager
              key={tab}
              definition={entityDefinitions[tab]}
              rows={catalog[tab] || []}
              catalog={catalog}
              reload={load}
            />
          )}
          {data && tab === 'reportes' && (
            <ReportesViewer
              alumnos={(catalog.alumnos || []) as Alumno[]}
              docentes={(catalog.docentes || []) as Docente[]}
              deportes={(catalog.deportes || []) as Deporte[]}
              grupos={(catalog.grupos || []) as GrupoDeporte[]}
              recorridos={(catalog.recorridos || []) as RecorridoTransporte[]}
              cursos={(catalog.cursos || []) as Curso[]}
            />
          )}
          {tab === 'asistencias' && <AsistenciasSection />}
          {tab === 'evaluaciones' && <AcademicPanel />}
          {tab === 'inscripciones' && <EnrollmentPanel admin />}
          {tab === 'comunicaciones' && <Communications />}
          {tab === 'comprobantes' && <PaymentProofsQueue />}
          {tab === 'facturacion' && <FacturacionPanel />}
          {tab === 'auditoria' && <AuditLog />}
        </div>
      </div>
    </PortalShell>
  );
}

function FacturacionPanel() {
  const periodoActual = new Date().toISOString().slice(0, 7);
  const [periodo, setPeriodo] = useState(periodoActual);
  const [resultado, setResultado] = useState('');
  const [error, setError] = useState('');
  const [pendiente, setPendiente] = useState(false);
  const correr = async (accion: 'generar' | 'fin-mes' | 'deuda-20') => {
    setError('');
    setResultado('');
    setPendiente(true);
    try {
      if (accion === 'generar') {
        const r = await api.generarPeriodo(periodo);
        setResultado(`Período ${r.periodo}: ${r.creadas} creadas, ${r.omitidas} omitidas.`);
      } else if (accion === 'fin-mes') {
        const r = await api.ejecutarRecordatorioFinMes(periodo);
        setResultado(`Fin de mes ${r.periodo}: ${r.enviadas} enviadas, ${r.omitidas} omitidas.`);
      } else {
        const r = await api.ejecutarAvisoDeuda(periodo);
        setResultado(`Deuda día 20 ${r.periodo}: ${r.enviadas} enviadas, ${r.omitidas} omitidas.`);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPendiente(false);
    }
  };
  return (
    <section className="panel-card">
      <div className="section-toolbar">
        <div>
          <span className="eyebrow">Facturación</span>
          <h2>Generar período y avisos</h2>
        </div>
        <label>
          Período
          <input type="month" value={periodo} onChange={(e) => setPeriodo(e.target.value)} />
        </label>
      </div>
      <Feedback error>{error}</Feedback>
      <Feedback>{resultado}</Feedback>
      <div className="form-actions">
        <Button disabled={pendiente} onClick={() => void correr('generar')}>
          {pendiente ? 'Procesando…' : 'Generar facturas'}
        </Button>
        <Button variant="outline" disabled={pendiente} onClick={() => void correr('fin-mes')}>
          Enviar recordatorio fin de mes
        </Button>
        <Button variant="outline" disabled={pendiente} onClick={() => void correr('deuda-20')}>
          Enviar aviso deuda día 20
        </Button>
      </div>
    </section>
  );
}
