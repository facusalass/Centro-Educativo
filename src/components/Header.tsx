import { Menu, X } from 'lucide-react';
import { useState } from 'react';
import { Button } from './Button';

const navItems = [
  { href: '#quienes-somos', label: 'Quiénes Somos' },
  { href: '#niveles-educativos', label: 'Niveles' },
  { href: '#servicios', label: 'Servicios' },
  { href: '#actividades', label: 'Actividades' },
  { href: '#noticias', label: 'Noticias' },
  { href: '#empleo', label: 'Empleo' },
  { href: '/admin', label: 'Panel' },
];

export function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="site-header">
      <div className="container header-inner">
        <a className="brand" href="#inicio" aria-label="Educar para Transformar">
          <img
            src="https://res.cloudinary.com/drozim7xo/image/upload/v1778197079/81afd62a-58dd-4071-b70f-bb5488ed4937.png"
            alt="Educar para Transformar"
          />
        </a>

        <nav className="desktop-nav" aria-label="Navegación principal">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="header-actions">
          <Button variant="primary" onClick={() => document.getElementById('acceso-comunidad')?.scrollIntoView({ behavior: 'smooth' })}>
            Acceso Comunidad
          </Button>
          <button className="icon-button mobile-only" onClick={() => setOpen((value) => !value)} aria-label="Abrir menú">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="mobile-nav" aria-label="Navegación móvil">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <a href="#inscripcion" onClick={() => setOpen(false)}>
            Solicitud de Inscripción
          </a>
        </nav>
      )}
    </header>
  );
}
