import { CalendarDays, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { usePublicList } from '../services/usePublicList';
import type { Noticia } from '../types';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function NewsSection() {
  const [selected, setSelected] = useState<Noticia | null>(null);
  const { items: noticias, status } = usePublicList<Noticia>(api.getNoticias);

  return (
    <section id="noticias" className="section section-gray">
      <div className="container">
        <SectionHeader
          title="Noticias y Novedades"
          description="Información institucional para familias, estudiantes y equipo educativo."
        />
        {status}
        {selected && (
          <dialog
            className="news-detail"
            ref={(element) => {
              if (element && !element.open) element.showModal();
            }}
            onCancel={() => setSelected(null)}
            aria-label={selected.titulo}
          >
            <button autoFocus className="text-button" onClick={() => setSelected(null)}>
              Cerrar noticia
            </button>
            <h2>{selected.titulo}</h2>
            <p>{selected.contenido || selected.descripcion}</p>
          </dialog>
        )}
        <div className="news-grid">
          {noticias.map((noticia) => (
            <article className="news-card" key={noticia.id}>
              <img src={noticia.imagen_url} alt={noticia.titulo} />
              <div className="news-content">
                <span className="news-date">
                  <CalendarDays size={16} /> {formatDate(noticia.fecha_publicacion)}
                </span>
                <strong>{noticia.tipo}</strong>
                <h3>{noticia.titulo}</h3>
                <p>{noticia.descripcion}</p>
                <button className="text-button" onClick={() => setSelected(noticia)}>
                  Leer más <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
