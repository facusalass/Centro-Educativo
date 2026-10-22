import { Baby, BookOpenCheck, GraduationCap } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { usePublicList } from '../services/usePublicList';
import type { Nivel } from '../types';

const levelIcons = [Baby, BookOpenCheck, GraduationCap];

export function LevelsSection() {
  const { items: niveles, status } = usePublicList<Nivel>(api.getNiveles);

  return (
    <section id="niveles-educativos" className="section section-white section-compact-top">
      <div className="container">
        <SectionHeader
          eyebrow="Trayectoria escolar"
          title="Niveles Educativos"
          description="Una propuesta articulada para acompañar el crecimiento desde las primeras experiencias escolares hasta la preparación para estudios superiores."
        />
        {status}
        <div className="levels-grid">
          {niveles.map((nivel, index) => {
            const Icon = levelIcons[index] ?? GraduationCap;
            return (
              <article className="info-card level-card" key={nivel.id}>
                <div className="card-icon">
                  <Icon size={30} />
                </div>
                <span>{nivel.etiqueta}</span>
                <h3>{nivel.nombre}</h3>
                <p>{nivel.descripcion}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
