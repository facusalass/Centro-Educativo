import { Communications } from '../components/management/Communications';
import { AuditLog } from '../components/management/AuditLog';
import { useState } from 'react';
import type { Alumno, Docente } from '../types';
import { RefreshCw } from 'lucide-react';
import { useManagementData } from '../hooks/useManagementData';
import { PortalShell, Feedback } from '../components/PortalShell';
import { EntityManager, entityDefinitions } from '../components/EntityManager';
import { ReportesViewer } from '../components/ReportesViewer';
import { AsistenciasSection } from '../components/AsistenciasSection';
import { AcademicPanel } from '../components/AcademicPanel';
import { EnrollmentPanel } from '../components/EnrollmentPanel';
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
            />
          )}
          {tab === 'asistencias' && <AsistenciasSection />}
          {tab === 'evaluaciones' && <AcademicPanel />}
          {tab === 'inscripciones' && <EnrollmentPanel admin />}
          {tab === 'comunicaciones' && <Communications />}
          {tab === 'auditoria' && <AuditLog />}
        </div>
      </div>
    </PortalShell>
  );
}
