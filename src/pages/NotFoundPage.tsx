import { ArrowLeft, Home, SearchX } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="internal-page not-found-page">
      <main className="not-found-card">
        <SearchX size={58} aria-hidden="true" />
        <span className="eyebrow">Error 404</span>
        <h1>Página no encontrada</h1>
        <p>La dirección ingresada no existe o fue modificada. Podés volver al sitio institucional y continuar navegando.</p>
        <div className="not-found-actions">
          <a className="btn btn-primary" href="/"><Home size={18} /> Ir al inicio</a>
          <button className="btn btn-outline" type="button" onClick={() => window.history.back()}>
            <ArrowLeft size={18} /> Volver atrás
          </button>
        </div>
      </main>
    </div>
  );
}
