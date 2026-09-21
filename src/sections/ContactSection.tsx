import { FormEvent, useState } from 'react';
import { Mail, MapPin, Phone, Send } from 'lucide-react';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import type { ContactoMensaje } from '../types';

const initialForm: ContactoMensaje = {
  nombre: '',
  email: '',
  asunto: 'Consulta institucional',
  mensaje: '',
};

export function ContactSection() {
  const [form, setForm] = useState<ContactoMensaje>(initialForm);
  const [status, setStatus] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('Enviando consulta...');
    try {
      await api.enviarContacto(form);
      setForm(initialForm);
      setStatus('Consulta recibida correctamente.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'No se pudo enviar la consulta.');
    }
  }

  return (
    <section id="contacto" className="section section-blue contact-section">
      <div className="container contact-layout">
        <div>
          <SectionHeader
            light
            eyebrow="Contacto"
            title="Estamos cerca de las familias"
            description="Canales institucionales preparados para consultas sobre inscripcion, servicios y postulaciones."
          />
          <div className="contact-cards">
            <article>
              <MapPin size={28} />
              <h3>Ubicacion</h3>
              <p>Afueras de Resistencia, Chaco</p>
            </article>
            <article>
              <Phone size={28} />
              <h3>Telefono</h3>
              <p>(0362) 444-5555</p>
            </article>
            <article>
              <Mail size={28} />
              <h3>Email</h3>
              <p>contacto@educarparatransformar.edu.ar</p>
            </article>
          </div>
        </div>

        <form className="form-card contact-form" onSubmit={handleSubmit}>
          <h3>Enviar consulta</h3>
          <label>
            Nombre
            <input required value={form.nombre} onChange={(event) => setForm({ ...form, nombre: event.target.value })} />
          </label>
          <label>
            Email
            <input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          </label>
          <label>
            Asunto
            <input required value={form.asunto} onChange={(event) => setForm({ ...form, asunto: event.target.value })} />
          </label>
          <label>
            Mensaje
            <textarea required rows={4} value={form.mensaje} onChange={(event) => setForm({ ...form, mensaje: event.target.value })} />
          </label>
          <Button type="submit"><Send size={18} /> Enviar consulta</Button>
          {status && <span className="form-status">{status}</span>}
        </form>
      </div>
    </section>
  );
}
