import { GraduationCap, ShieldCheck, UserRound, UsersRound } from 'lucide-react';
import { SectionHeader } from '../components/SectionHeader';

const accessItems = [
  {
    title: 'Docentes y personal',
    description: 'Portal preparado para cursos, asignaciones, servicios, instalaciones y avisos.',
    icon: ShieldCheck,
    href: '/login',
  },
  {
    title: 'Padres y tutores',
    description: 'Seguimiento de novedades, actividades y comunicaciones institucionales.',
    icon: UsersRound,
    href: '/login',
  },
  {
    title: 'Alumnos',
    description: 'Acceso demo a noticias, actividades y datos basicos de la institucion.',
    icon: GraduationCap,
    href: '/login',
  },
  {
    title: 'Administracion',
    description: 'Panel general para visualizar y cargar datos principales del TP.',
    icon: UserRound,
    href: '/admin',
  },
];

export function AccessSection() {
  return (
    <section id="acceso-comunidad" className="section section-white">
      <div className="container">
        <SectionHeader
          title="Acceso a la Comunidad Educativa"
          description="Login demo simple para roles alumno, padre, docente, personal y admin. No usa autenticacion avanzada."
        />
        <div className="access-grid">
          {accessItems.map((item) => {
            const Icon = item.icon;
            return (
              <article className="access-card" key={item.title}>
                <div className="access-icon"><Icon size={30} /></div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
                <a className="btn btn-outline" href={item.href}>Ingresar</a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
