import { ArrowRight, CalendarDays, GraduationCap, MapPin, Sparkles } from 'lucide-react';

const heroStats = [
  { value: '3', label: 'niveles educativos' },
  { value: '2027', label: 'inicio lectivo' },
  { value: '5+', label: 'servicios integrales' },
];

export function HeroSection() {
  return (
    <section id="inicio" className="hero-section">
      <div className="hero-overlay" />
      <div className="container hero-layout">
        <div className="hero-content">
          <span className="hero-badge"><Sparkles size={18} /> Apertura marzo 2027</span>
          <h1>Educacion privada para transformar el futuro</h1>
          <p>Una propuesta integral, moderna y cercana para nivel inicial, primario y secundario en las afueras de Resistencia.</p>
          <div className="hero-actions">
            <a className="btn btn-secondary" href="#inscripcion">
              Solicitud de Inscripcion <ArrowRight size={18} />
            </a>
            <a className="btn btn-outline-light" href="#quienes-somos">Conocer el proyecto</a>
          </div>
          <div className="hero-stats" aria-label="Datos destacados">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <aside className="hero-highlight" aria-label="Resumen institucional">
          <div className="hero-highlight-icon"><GraduationCap size={30} /></div>
          <h2>Campus educativo integral</h2>
          <p>Espacios modernos, acompanamiento personalizado, bienestar estudiantil y actividades para toda la comunidad educativa.</p>
          <ul>
            <li><MapPin size={17} /> Afueras de Resistencia, Chaco</li>
            <li><CalendarDays size={17} /> Inscripciones 2027 abiertas</li>
          </ul>
        </aside>
      </div>
    </section>
  );
}
