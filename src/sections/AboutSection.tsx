import { BookOpen, HeartHandshake, Lightbulb } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';

const pillars = [
  {
    title: 'Excelencia académica',
    description: 'Planificación pedagógica orientada al aprendizaje significativo y al seguimiento de trayectorias.',
    icon: BookOpen,
  },
  {
    title: 'Acompañamiento integral',
    description: 'Bienestar físico, emocional y social como parte central de la experiencia educativa.',
    icon: HeartHandshake,
  },
  {
    title: 'Innovación educativa',
    description: 'Uso responsable de tecnología, laboratorios, idiomas y propuestas interdisciplinarias.',
    icon: Lightbulb,
  },
];

export function AboutSection() {
  return (
    <section id="quienes-somos" className="section section-white">
      <div className="container">
        <SectionHeader
          title="Quiénes Somos"
          description="Somos una institución educativa de gestión privada ubicada en las afueras de Resistencia. Nuestro objetivo es iniciar actividades en marzo de 2027 con una propuesta moderna, ordenada y centrada en el desarrollo integral de cada estudiante."
        />
        <div className="pillars-grid">
          {pillars.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <article className="info-card" key={pillar.title}>
                <div className="card-icon"><Icon size={28} /></div>
                <h3>{pillar.title}</h3>
                <p>{pillar.description}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
