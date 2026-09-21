import { BriefcaseBusiness, GraduationCap, Lightbulb, UsersRound } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { isValidEmail, isValidHttpUrl, isValidPhone } from '../services/validation';
import type { PostulacionEmpleo } from '../types';

const benefits = [
  { title: 'Desarrollo profesional', description: 'Capacitación continua y crecimiento en la carrera educativa.', icon: GraduationCap },
  { title: 'Equipo colaborativo', description: 'Ambiente de trabajo positivo, organizado y participativo.', icon: UsersRound },
  { title: 'Innovación educativa', description: 'Proyecto pedagógico moderno y orientado a la mejora continua.', icon: Lightbulb },
];

const positions = ['Docente de Nivel Inicial', 'Docente de Nivel Primario', 'Profesores de Nivel Secundario', 'Personal Administrativo'];

const initialForm: PostulacionEmpleo = {
  nombre_candidato: '',
  email: '',
  telefono: '',
  puesto_interes: positions[0],
  enlace_cv: '',
  mensaje: '',
};

export function EmploymentSection() {
  const [form, setForm] = useState<PostulacionEmpleo>(initialForm);
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = {
      ...form,
      nombre_candidato: form.nombre_candidato.trim(),
      email: form.email.trim(),
      telefono: form.telefono.trim(),
      enlace_cv: form.enlace_cv.trim(),
      mensaje: form.mensaje.trim(),
    };
    const missingFields = [
      ['nombre', data.nombre_candidato],
      ['email', data.email],
      ['teléfono', data.telefono],
      ['puesto de interés', data.puesto_interes],
      ['enlace al CV', data.enlace_cv],
      ['mensaje', data.mensaje],
    ].filter(([, value]) => !value).map(([label]) => label);

    if (missingFields.length > 0) {
      setStatusTone('error');
      setStatus(`Completá los campos obligatorios: ${missingFields.join(', ')}.`);
      return;
    }
    if (!isValidEmail(data.email)) {
      setStatusTone('error');
      setStatus('Ingresá un email válido, por ejemplo nombre@dominio.com.');
      return;
    }
    if (!isValidPhone(data.telefono)) {
      setStatusTone('error');
      setStatus('Ingresá un teléfono válido de 7 a 15 dígitos. Podés usar +, espacios, guiones y paréntesis.');
      return;
    }
    if (!isValidHttpUrl(data.enlace_cv)) {
      setStatusTone('error');
      setStatus('El enlace al CV debe ser una dirección válida que comience con http:// o https://.');
      return;
    }
    if (data.mensaje.length < 20) {
      setStatusTone('error');
      setStatus('El mensaje de presentación debe tener al menos 20 caracteres.');
      return;
    }

    setSubmitting(true);
    setStatusTone('info');
    setStatus('Enviando postulación...');
    try {
      await api.crearPostulacion(data);
      setForm(initialForm);
      setStatusTone('success');
      setStatus('Postulación recibida correctamente.');
    } catch (error) {
      setStatusTone('error');
      setStatus(error instanceof Error ? error.message : 'No se pudo enviar la postulación.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="empleo" className="section section-white">
      <div className="container">
        <SectionHeader
          eyebrow="Convocatoria"
          title="Trabajá con Nosotros"
          description="Estamos formando el equipo de trabajo para el ciclo lectivo 2027. Buscamos profesionales comprometidos con la excelencia educativa."
        />

        <div className="benefits-grid">
          {benefits.map((benefit) => {
            const Icon = benefit.icon;
            return (
              <article className="info-card" key={benefit.title}>
                <div className="card-icon subtle"><Icon size={28} /></div>
                <h3>{benefit.title}</h3>
                <p>{benefit.description}</p>
              </article>
            );
          })}
        </div>

        <div className="employment-panel">
          <div>
            <h3><BriefcaseBusiness size={26} /> Vacantes disponibles</h3>
            <div className="positions-list">
              {positions.map((position) => (
                <button type="button" key={position} onClick={() => setForm({ ...form, puesto_interes: position })}>
                  {position}
                  <span>Tiempo completo / parcial</span>
                </button>
              ))}
            </div>
          </div>

          <form className="form-card flat-form" onSubmit={handleSubmit} noValidate>
            <label>
              Nombre del candidato
              <input required maxLength={100} autoComplete="name" value={form.nombre_candidato} onChange={(event) => setForm({ ...form, nombre_candidato: event.target.value })} />
            </label>
            <div className="form-row">
              <label>
                Email
                <input required type="email" maxLength={150} autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
              </label>
              <label>
                Teléfono
                <input required type="tel" inputMode="tel" maxLength={30} autoComplete="tel" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
              </label>
            </div>
            <label>
              Puesto de interés
              <select required value={form.puesto_interes} onChange={(event) => setForm({ ...form, puesto_interes: event.target.value })}>
                {positions.map((position) => <option key={position}>{position}</option>)}
              </select>
            </label>
            <label>
              Enlace al CV
              <input required type="url" maxLength={500} value={form.enlace_cv} onChange={(event) => setForm({ ...form, enlace_cv: event.target.value })} placeholder="https://..." />
            </label>
            <label>
              Mensaje
              <textarea required minLength={20} maxLength={1500} rows={4} value={form.mensaje} onChange={(event) => setForm({ ...form, mensaje: event.target.value })} />
            </label>
            <Button type="submit" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar postulación'}</Button>
            {status && <span className={`form-status form-status-${statusTone}`} role="status" aria-live="polite">{status}</span>}
          </form>
        </div>
      </div>
    </section>
  );
}
