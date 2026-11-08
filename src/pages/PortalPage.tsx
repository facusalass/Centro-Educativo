import { useState } from 'react';
import {
  Bell,
  GraduationCap,
  Home,
  LogOut,
  Receipt,
  Settings,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useSession } from '../services/session';
// Import shared by LoginPage for the mobile-first (>= 360px) shell styles.
import '../components/portal/mobile.css';
import { PortalShell, Feedback } from '../components/PortalShell';
import { EnrollmentPanel } from '../components/EnrollmentPanel';
import { Notifications } from '../components/Notifications';
import { DocenteDashboard } from '../components/DocenteDashboard';
import { AcademicPanel } from '../components/AcademicPanel';
import { AsistenciasSection } from '../components/AsistenciasSection';
import { FamilyGrades } from '../components/portal/FamilyGrades';
import { StudentFeesPanel } from '../components/portal/StudentFeesPanel';
import { PasswordForm } from '../components/portal/PasswordForm';
import { Button } from '../components/Button';
import { LoginPage } from './LoginPage';
import { StudentProfile } from '../components/portal/StudentProfile';
import { ErrorBoundary } from '../components/ErrorBoundary';

export function PortalPage() {
  const { user, loading, logout } = useSession();
  const [tab, setTab] = useState(() => new URLSearchParams(window.location.search).get('tab') ?? 'inicio');
  const cambiarTab = (key: string) => {
    setTab(key);
    const params = new URLSearchParams(window.location.search);
    params.set('tab', key);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };
  const [logoutError, setLogoutError] = useState('');
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
  // Cuotas es solo para padre (HU-06 / RF-01.5): alumno/docente/personal reciben 403.
  if (user.rol === 'padre') tabs.cuotas = 'Cuotas';
  if (user.rol === 'docente') {
    tabs.asistencias = 'Asistencias';
    delete tabs.cuotas;
  }
  // Personal no tiene evaluaciones ni cuotas asignadas: no se exponen como tabs.
  if (user.rol === 'personal') {
    delete tabs.evaluaciones;
  }
  // HU-06: navegación móvil acotada por rol — el padre navega por sus hijos
  // (selector por hijo dentro de "Mis hijos"), el alumno solo se ve a sí mismo;
  // ningún rol administra desde el portal.
  const mobileTabs: { key: string; label: string; icon: LucideIcon }[] =
    user.rol === 'padre'
      ? [
          { key: 'inicio', label: 'Inicio', icon: Home },
          { key: 'cuotas', label: 'Cuotas', icon: Receipt },
          { key: 'evaluaciones', label: 'Evaluaciones', icon: GraduationCap },
          { key: 'novedades', label: 'Novedades', icon: Bell },
          { key: 'seguridad', label: 'Cuenta', icon: Settings },
        ]
      : user.rol === 'alumno'
        ? [
            { key: 'inicio', label: 'Mi perfil', icon: UserRound },
            { key: 'evaluaciones', label: 'Evaluaciones', icon: GraduationCap },
            { key: 'novedades', label: 'Novedades', icon: Bell },
            { key: 'seguridad', label: 'Cuenta', icon: Settings },
          ]
        : user.rol === 'docente'
          ? [
              { key: 'inicio', label: 'Inicio', icon: Home },
              { key: 'asistencias', label: 'Asistencias', icon: UserRound },
              { key: 'evaluaciones', label: 'Evaluaciones', icon: GraduationCap },
              { key: 'novedades', label: 'Novedades', icon: Bell },
              { key: 'seguridad', label: 'Cuenta', icon: Settings },
            ]
          : user.rol === 'personal' || user.rol === 'admin'
            ? [
                { key: 'inicio', label: 'Inicio', icon: Home },
                { key: 'novedades', label: 'Novedades', icon: Bell },
                { key: 'seguridad', label: 'Cuenta', icon: Settings },
              ]
            : [];
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
      <nav className="portal-tabs portal-desktop-tabs" aria-label="Secciones del portal">
        {Object.entries(tabs).map(([key, label]) => (
          <button key={key} className={tab === key ? 'active' : ''} onClick={() => cambiarTab(key)}>
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
      {tab === 'cuotas' &&
        (user.rol === 'padre' ? (
          <StudentFeesPanel />
        ) : user.rol === 'alumno' && user.referencia_id ? (
          <StudentFeesPanel alumnoIdFijo={user.referencia_id} />
        ) : (
          <Feedback>Tu perfil no tiene cuotas asignadas.</Feedback>
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
      {tab === 'seguridad' && (
        <>
          <PasswordForm />
          <section className="panel-card portal-mobile-logout">
            <h2>Sesión</h2>
            <p>Cerrá tu sesión en este dispositivo. Podrás volver a ingresar cuando quieras.</p>
            <Feedback error>{logoutError}</Feedback>
            <Button
              variant="outline"
              onClick={() =>
                logout().catch((e: Error) => setLogoutError(e.message))
              }
            >
              <LogOut size={16} /> Cerrar sesión
            </Button>
          </section>
        </>
      )}
      {mobileTabs.length > 0 && (
        <nav className="portal-mobile-nav" aria-label="Navegación móvil del portal">
          {mobileTabs.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              className={tab === key ? 'active' : ''}
              aria-current={tab === key ? 'page' : undefined}
              onClick={() => cambiarTab(key)}
            >
              <Icon size={20} aria-hidden />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </PortalShell>
  );
}
