import { MessageSquareQuote, Send } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { opinionesFallback } from '../services/fallbackData';
import type { Opinion } from '../types';

export function TestimonialsSection() {
  const [opiniones, setOpiniones] = useState<Opinion[]>([]);
  const [form, setForm] = useState({ autor_anonimo: '', comentario: '' });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getOpiniones()
      .then((items) => setOpiniones(items.filter(esOpinionPublica)))
      .catch(() => setOpiniones(opinionesFallback.filter(esOpinionPublica)))
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Enviando opinion...');

    try {
      await api.crearOpinion(form);
      setForm({ autor_anonimo: '', comentario: '' });
      setStatus('Gracias. Tu opinion quedo registrada y sera publicada cuando sea moderada.');
    } catch {
      setStatus('No se pudo enviar la opinion. Verifica que el backend este en ejecucion.');
    }
  }

  const opinionesPublicas = opiniones.filter(esOpinionPublica);

  return (
    <section id="opiniones" className="section section-white testimonials-section">
      <div className="container testimonials-layout">
        <div>
          <SectionHeader
            eyebrow="Opiniones de la comunidad"
            title="Testimonios"
            description="Comentarios publicados de familias, docentes y personas interesadas en el proyecto educativo."
          />

          <div className="testimonial-list">
            {loading && <p className="empty-state">Cargando opiniones publicadas...</p>}

            {!loading && opinionesPublicas.length === 0 && (
              <p className="empty-state">Todavia no hay opiniones publicadas.</p>
            )}

            {!loading && opinionesPublicas.slice(0, 4).map((opinion) => (
              <article className="testimonial-card" key={opinion.id}>
                <MessageSquareQuote size={34} />
                <p>"{opinion.comentario}"</p>
                <strong>{opinion.autor_anonimo}</strong>
              </article>
            ))}
          </div>
        </div>

        <form className="form-card testimonial-form" onSubmit={handleSubmit}>
          <h3>Comparti tu experiencia</h3>
          <p>Tu comentario se enviara como pendiente de moderacion antes de publicarse.</p>

          <label>
            Nombre o referencia
            <input
              required
              value={form.autor_anonimo}
              onChange={(event) => setForm({ ...form, autor_anonimo: event.target.value })}
              placeholder="Ej.: Madre de familia"
            />
          </label>

          <label>
            Opinion
            <textarea
              required
              rows={5}
              value={form.comentario}
              onChange={(event) => setForm({ ...form, comentario: event.target.value })}
              placeholder="Escribi un comentario breve"
            />
          </label>

          <Button type="submit"><Send size={18} /> Enviar opinion</Button>
          {status && <span className="form-status">{status}</span>}
        </form>
      </div>
    </section>
  );
}

function esOpinionPublica(opinion: Opinion) {
  return opinion.estado_moderacion === 'visible' && opinion.visible === 1;
}
