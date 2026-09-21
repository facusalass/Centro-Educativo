import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { galeriaFallback } from '../services/fallbackData';
import type { GaleriaImagen } from '../types';

export function GallerySection() {
  const [imagenes, setImagenes] = useState<GaleriaImagen[]>(galeriaFallback);

  useEffect(() => {
    api.getGaleria().then(setImagenes).catch(() => setImagenes(galeriaFallback));
  }, []);

  const visibleImages = imagenes.length > 0 ? imagenes : galeriaFallback;
  const carouselImages = [...visibleImages, ...visibleImages];

  return (
    <section id="galeria" className="section gallery-strip">
      <div className="container gallery-strip-header">
        <span className="eyebrow">Galeria</span>
        <h2>Vida institucional proyectada</h2>
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
