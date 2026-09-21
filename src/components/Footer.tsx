import { Facebook, Instagram, Mail, MapPin, Phone, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <div className="footer-logo-box">
            <img
              className="footer-logo"
              src="https://res.cloudinary.com/drozim7xo/image/upload/v1778197079/81afd62a-58dd-4071-b70f-bb5488ed4937.png"
              alt="Educar para Transformar - Logo"
            />
          </div>
          <p>Institución de gestión privada de alta calidad educativa.</p>
          <p>Apertura: marzo 2027</p>
        </div>
        <div>
          <h3>Contacto</h3>
          <ul className="footer-list">
            <li><MapPin size={18} /> Afueras de Resistencia, Chaco</li>
            <li><Phone size={18} /> (0362) 444-5555</li>
            <li><Mail size={18} /> contacto@educarparatransformar.edu.ar</li>
          </ul>
        </div>
        <div>
          <h3>Enlaces rápidos</h3>
          <ul className="footer-links">
            <li><a href="#quienes-somos">Quiénes Somos</a></li>
            <li><a href="#niveles-educativos">Niveles Educativos</a></li>
            <li><a href="#noticias">Noticias</a></li>
            <li><a href="#empleo">Trabajá con nosotros</a></li>
          </ul>
        </div>
        <div>
          <h3>Comunidad</h3>
          <p>Accesos preparados para docentes, padres, alumnos y personal.</p>
          <a className="footer-cta" href="#acceso-comunidad">Ver accesos</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Educar para Transformar. Todos los derechos reservados.</span>
        <div className="social-links" aria-label="Redes sociales">
          <a href="#" aria-label="Facebook"><Facebook size={18} /></a>
          <a href="#" aria-label="Instagram"><Instagram size={18} /></a>
          <a href="#" aria-label="Youtube"><Youtube size={18} /></a>
        </div>
      </div>
    </footer>
  );
}
