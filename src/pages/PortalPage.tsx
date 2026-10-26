import { useState } from 'react';
import { useSession } from '../services/session';
import { PortalShell, Feedback } from '../components/PortalShell';
import { EnrollmentPanel } from '../components/EnrollmentPanel';
import { Notifications } from '../components/Notifications';
import { DocenteDashboard } from '../components/DocenteDashboard';
import { AcademicPanel } from '../components/AcademicPanel';
import { AsistenciasSection } from '../components/AsistenciasSection';
import { FamilyGrades } from '../components/portal/FamilyGrades';
import { PasswordForm } from '../components/portal/PasswordForm';
import { LoginPage } from './LoginPage';
import { StudentProfile } from '../components/portal/StudentProfile';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function PortalPage() {
  const { user, loading } = useSession();
  const [tab, setTab] = useState('inicio');
  const [profileRevision, setProfileRevision] = useState(0);
  if (loading)
    return (
      <main className="portal-main">
        <Feedback>Comprobando sesión…</Feedback>
      </main>
    );
  if (!user) return <LoginPage />;
  const tabs: Record<string, string> = {
    inicio:
      user.rol === 'padre'
        ? 'Mis hijos e inscripciones'
        : user.rol === 'alumno'
          ? 'Mi legajo y actividades'
          : 'Mi actividad',
    evaluaciones: 'Evaluaciones',
    novedades: 'Novedades',
    seguridad: 'Mi cuenta',
  };
  if (user.rol === 'docente') tabs.asistencias = 'Asistencias';
  return (
    <PortalShell
      title={
        user.rol === 'padre'
          ? 'Portal de familias'
          : user.rol === 'docente'
            ? 'Portal docente'
            : user.rol === 'alumno'
              ? 'Portal estudiantil'
              : 'Mi portal'
      }
    >
      <nav className="portal-tabs" aria-label="Secciones del portal">
        {Object.entries(tabs).map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </nav>
      {tab === 'inicio' &&
        (user.rol === 'padre' ? (
          <EnrollmentPanel />
        ) : user.rol === 'docente' ? (
          <ErrorBoundary
            key={`${user.referencia_id}:${profileRevision}`}
            onReset={() => setProfileRevision((value) => value + 1)}
          >
            <DocenteDashboard usuario={user} />
          </ErrorBoundary>
        ) : user.rol === 'alumno' ? (
          <ErrorBoundary
            key={`${user.referencia_id}:${profileRevision}`}
            onReset={() => setProfileRevision((value) => value + 1)}
          >
            <StudentProfile user={user} />
          </ErrorBoundary>
        ) : user.rol === 'admin' ? (
          <section className="panel-card">
            <h2>Administración</h2>
            <a href="/admin" className="btn btn-primary">
              Abrir gestión institucional
            </a>
          </section>
        ) : (
          <section className="panel-card">
            <h2>Bienvenido/a, {user.nombre}</h2>
            <p>Consultá las evaluaciones y novedades desde las secciones del portal.</p>
          </section>
        ))}
      {tab === 'evaluaciones' &&
        (user.rol === 'padre' ? (
          <FamilyGrades />
        ) : user.rol === 'personal' ? (
          <Feedback>Tu perfil no tiene evaluaciones asignadas.</Feedback>
        ) : (
          <AcademicPanel
            studentId={user.rol === 'alumno' ? (user.referencia_id ?? undefined) : undefined}
          />
        ))}
      {tab === 'novedades' && <Notifications />}
      {tab === 'asistencias' && <AsistenciasSection />}
      {tab === 'seguridad' && <PasswordForm />}
    </PortalShell>
  );
}
