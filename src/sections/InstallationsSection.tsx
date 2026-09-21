import { useEffect, useState } from 'react';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { instalacionesFallback } from '../services/fallbackData';
import type { Instalacion } from '../types';

export function InstallationsSection() {
  const [instalaciones, setInstalaciones] = useState<Instalacion[]>(instalacionesFallback);

  useEffect(() => {
    api.getInstalaciones().then(setInstalaciones).catch(() => setInstalaciones(instalacionesFallback));
  }, []);

  return (
    <section id="instalaciones" className="section section-gray">
      <div className="container">
        <SectionHeader
          title="Nuestras Instalaciones"
          description="Espacios modernos diseñados para el aprendizaje, la práctica, el deporte y la convivencia escolar."
        />
        <div className="installations-grid">
          {instalaciones.map((instalacion) => (
            <article className="gallery-card" key={instalacion.id}>
              <img src={instalacion.imagen_url} alt={instalacion.nombre} />
              <div>
                <h3>{instalacion.nombre}</h3>
                <p>{instalacion.descripcion}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
