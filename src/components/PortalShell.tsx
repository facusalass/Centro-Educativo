import { useState, type ReactNode } from 'react';
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
  return (
    <div className="internal-page">
      <header className="internal-header">
        <a className="text-button" href="/">
          <ArrowLeft size={17} /> Sitio institucional
        </a>
        <strong>Educar para Transformar</strong>
        <a className="text-button" href="/login">
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
        {children}
      </main>
    </div>
  );
}
