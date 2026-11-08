import { useEffect, useState, type ReactNode } from 'react';
import { ArrowLeft, LogOut, ShieldCheck } from 'lucide-react';
import { useSession } from '../services/session';
import { Button } from './Button';
export function Feedback({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return children ? (
    <p
      className={`feedback ${error ? 'feedback-error' : ''}`}
      role={error ? 'alert' : 'status'}
      aria-live="polite"
    >
      {children}
    </p>
  ) : null;
}
export function PortalShell({ title, children }: { title: string; children: ReactNode }) {
  const { user, logout } = useSession();
  const [error, setError] = useState('');
  const [offline, setOffline] = useState(
    typeof navigator === 'undefined' ? false : !navigator.onLine,
  );
  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return (
    <div className="internal-page">
      <header className="internal-header">
        <a className="text-button" href="/">
          <ArrowLeft size={17} /> Sitio institucional
        </a>
        <strong>Educar para Transformar</strong>
        <a
          className="text-button"
          href="/login"
          onClick={(e) => {
            if (window.location.pathname === '/login') e.preventDefault();
          }}
        >
          Mi portal
        </a>
      </header>
      <main className="portal-main">
        <div className="portal-heading">
          <div>
            <span className="eyebrow">
              <ShieldCheck size={15} /> Comunidad educativa
            </span>
            <h1>{title}</h1>
            <p>
              {user?.nombre} · {user?.rol === 'padre' ? 'Padre / Tutor' : user?.rol}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => logout().catch((e: Error) => setError(e.message))}
          >
            <LogOut size={16} /> Cerrar sesión
          </Button>
        </div>
        <Feedback error>{error}</Feedback>
        {offline && <Feedback>Sin conexión a internet. Revisá tu red e intentá de nuevo.</Feedback>}
        {children}
      </main>
    </div>
  );
}
