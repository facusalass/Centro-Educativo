import { api } from '../services/api';
import { usePublicList } from '../services/usePublicList';
import type { GaleriaImagen } from '../types';

export function GallerySection() {
  const { items: imagenes, status } = usePublicList<GaleriaImagen>(api.getGaleria);

  const visibleImages = imagenes;
  const carouselImages = [...visibleImages, ...visibleImages];

  return (
    <section id="galeria" className="section gallery-strip">
      <div className="container gallery-strip-header">
        <span className="eyebrow">Galeria</span>
        <h2>Vida institucional proyectada</h2>
        {status}
      </div>

      <div className="gallery-marquee" aria-label="Carrusel horizontal de imagenes institucionales">
        <div className="gallery-track">
          {carouselImages.map((item, index) => (
            <article className="gallery-marquee-card" key={`${item.id}-${index}`}>
              <img src={item.url_imagen} alt={item.titulo} />
              <div>
                <span>{item.categoria}</span>
                <h3>{item.titulo}</h3>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
