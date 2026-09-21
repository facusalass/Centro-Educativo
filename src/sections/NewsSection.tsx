import { CalendarDays, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { noticiasFallback } from '../services/fallbackData';
import type { Noticia } from '../types';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
}

export function NewsSection() {
  const [noticias, setNoticias] = useState<Noticia[]>(noticiasFallback);

  useEffect(() => {
    api.getNoticias().then(setNoticias).catch(() => setNoticias(noticiasFallback));
  }, []);

  return (
    <section id="noticias" className="section section-gray">
      <div className="container">
        <SectionHeader
          title="Noticias y Novedades"
          description="Información institucional para familias, estudiantes y equipo educativo."
        />
        <div className="news-grid">
          {noticias.map((noticia) => (
            <article className="news-card" key={noticia.id}>
              <img src={noticia.imagen_url} alt={noticia.titulo} />
              <div className="news-content">
                <span className="news-date"><CalendarDays size={16} /> {formatDate(noticia.fecha_publicacion)}</span>
                <strong>{noticia.tipo}</strong>
                <h3>{noticia.titulo}</h3>
                <p>{noticia.descripcion}</p>
                <button className="text-button">Leer más <ArrowRight size={16} /></button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
