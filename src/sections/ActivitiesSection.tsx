import { CalendarDays } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { actividadesFallback } from '../services/fallbackData';
import type { ActividadEscolar } from '../types';

function formatDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date));
}

export function ActivitiesSection() {
  const [actividades, setActividades] = useState<ActividadEscolar[]>(actividadesFallback);

  useEffect(() => {
    api.getActividades().then(setActividades).catch(() => setActividades(actividadesFallback));
  }, []);

  return (
    <section id="actividades" className="section section-white">
      <div className="container">
        <SectionHeader
          eyebrow="Comunicacion institucional"
          title="Actividades Escolares"
          description="Eventos y propuestas que articulan vida escolar, familias, niveles educativos y comunidad."
        />
        <div className="activities-grid">
          {actividades.slice(0, 3).map((actividad) => (
            <article className="activity-card" key={actividad.id}>
              <span><CalendarDays size={17} /> {formatDate(actividad.fecha)}</span>
              <h3>{actividad.titulo}</h3>
              <p>{actividad.descripcion}</p>
              <strong>{actividad.nivel}</strong>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
