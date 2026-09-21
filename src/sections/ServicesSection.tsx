import { useEffect, useState } from 'react';
import { IconMap } from '../components/IconMap';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { serviciosFallback } from '../services/fallbackData';
import type { Servicio } from '../types';

const wellbeing = [
  'Salud y bienestar',
  'Orientación personalizada',
  'Talleres culturales',
  'Actividades deportivas',
];

export function ServicesSection() {
  const [servicios, setServicios] = useState<Servicio[]>(serviciosFallback);

  useEffect(() => {
    api.getServicios().then(setServicios).catch(() => setServicios(serviciosFallback));
  }, []);

  return (
    <section id="servicios" className="section section-blue">
      <div className="container">
        <SectionHeader
          light
          eyebrow="Bienestar estudiantil"
          title="Servicios del Colegio"
          description="El desarrollo integral de nuestros estudiantes es una prioridad institucional."
        />
        <div className="services-grid">
          {servicios.map((servicio) => (
            <article className="service-card" key={servicio.id}>
              <div className="service-icon"><IconMap name={servicio.icono} /></div>
              <h3>{servicio.nombre}</h3>
              <p>{servicio.descripcion}</p>
            </article>
          ))}
        </div>
        <div className="wellbeing-row">
          {wellbeing.map((item) => <span key={item}>{item}</span>)}
        </div>
      </div>
    </section>
  );
}
