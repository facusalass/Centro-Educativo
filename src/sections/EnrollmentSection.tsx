import { FormEvent, useState } from 'react';
import { ClipboardCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { SectionHeader } from '../components/SectionHeader';
import { api } from '../services/api';
import { isValidEmail, isValidPhone } from '../services/validation';
import type { SolicitudInscripcion } from '../types';

const initialForm: SolicitudInscripcion = {
  nombre_tutor: '',
  nombre_aspirante: '',
  nivel_solicitado: 'Nivel Inicial',
  email_contacto: '',
  telefono: '',
  mensaje: '',
};

export function EnrollmentSection() {
  const [form, setForm] = useState<SolicitudInscripcion>(initialForm);
  const [status, setStatus] = useState('');
  const [statusTone, setStatusTone] = useState<'info' | 'success' | 'error'>('info');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = {
      ...form,
      nombre_tutor: form.nombre_tutor.trim(),
      nombre_aspirante: form.nombre_aspirante.trim(),
      email_contacto: form.email_contacto.trim(),
      telefono: form.telefono.trim(),
      mensaje: form.mensaje.trim(),
    };
    const missingFields = [
      ['nombre del tutor', data.nombre_tutor],
      ['nombre del aspirante', data.nombre_aspirante],
      ['nivel solicitado', data.nivel_solicitado],
      ['email', data.email_contacto],
      ['teléfono', data.telefono],
      ['mensaje', data.mensaje],
    ].filter(([, value]) => !value).map(([label]) => label);

    if (missingFields.length > 0) {
      setStatusTone('error');
      setStatus(`Completá los campos obligatorios: ${missingFields.join(', ')}.`);
      return;
    }
    if (!isValidEmail(data.email_contacto)) {
      setStatusTone('error');
      setStatus('Ingresá un email válido, por ejemplo nombre@dominio.com.');
      return;
    }
    if (!isValidPhone(data.telefono)) {
      setStatusTone('error');
      setStatus('Ingresá un teléfono válido de 7 a 15 dígitos. Podés usar +, espacios, guiones y paréntesis.');
      return;
    }
    if (data.mensaje.length < 10) {
      setStatusTone('error');
      setStatus('El mensaje debe tener al menos 10 caracteres.');
      return;
    }

    setSubmitting(true);
    setStatusTone('info');
    setStatus('Enviando solicitud...');
    try {
      await api.crearSolicitud(data);
      setForm(initialForm);
      setStatusTone('success');
      setStatus('Solicitud recibida. El estado inicial del trámite es "recibida".');
    } catch (error) {
      setStatusTone('error');
      setStatus(error instanceof Error ? error.message : 'No se pudo enviar la solicitud.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section id="inscripcion" className="section section-gray">
      <div className="container split-layout">
        <div>
          <SectionHeader
            eyebrow="Ciclo lectivo 2027"
            title="Solicitud de Inscripción"
            description="Formulario inicial para registrar familias interesadas. Los datos son de prueba y quedan guardados en SQLite para desarrollo."
          />
          <div className="process-card">
            <ClipboardCheck size={32} />
            <div>
              <h3>Estado inicial del trámite</h3>
              <p>Las solicitudes ingresan como recibidas para su posterior revisión administrativa.</p>
            </div>
          </div>
        </div>

        <form className="form-card" onSubmit={handleSubmit} noValidate>
          <label>
            Nombre del tutor
            <input required maxLength={100} autoComplete="name" value={form.nombre_tutor} onChange={(event) => setForm({ ...form, nombre_tutor: event.target.value })} />
          </label>
          <label>
            Nombre del aspirante
            <input required maxLength={100} value={form.nombre_aspirante} onChange={(event) => setForm({ ...form, nombre_aspirante: event.target.value })} />
          </label>
          <label>
            Nivel solicitado
            <select required value={form.nivel_solicitado} onChange={(event) => setForm({ ...form, nivel_solicitado: event.target.value })}>
              <option>Nivel Inicial</option>
              <option>Nivel Primario</option>
              <option>Nivel Secundario</option>
            </select>
          </label>
          <div className="form-row">
            <label>
              Email
              <input required type="email" maxLength={150} autoComplete="email" value={form.email_contacto} onChange={(event) => setForm({ ...form, email_contacto: event.target.value })} />
            </label>
            <label>
              Teléfono
              <input required type="tel" inputMode="tel" maxLength={30} autoComplete="tel" value={form.telefono} onChange={(event) => setForm({ ...form, telefono: event.target.value })} />
            </label>
          </div>
          <label>
            Mensaje
            <textarea required minLength={10} maxLength={1000} rows={4} value={form.mensaje} onChange={(event) => setForm({ ...form, mensaje: event.target.value })} />
          </label>
          <Button type="submit" disabled={submitting}>{submitting ? 'Enviando...' : 'Enviar solicitud'}</Button>
          {status && <span className={`form-status form-status-${statusTone}`} role="status" aria-live="polite">{status}</span>}
        </form>
      </div>
    </section>
  );
}
