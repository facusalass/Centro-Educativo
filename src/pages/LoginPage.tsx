import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, KeyRound, ShieldCheck } from 'lucide-react';
import { request } from '../services/api';
import { useSession } from '../services/session';
import { Feedback } from '../components/PortalShell';
import { Button } from '../components/Button';
import type { Curso, UsuarioAcceso } from '../types';
export function LoginPage() {
  const { setUser } = useSession();
  const [register, setRegister] = useState(false),
    [pending, setPending] = useState(false),
    [error, setError] = useState('');
  const [email, setEmail] = useState(''),
    [password, setPassword] = useState(''),
    [courses, setCourses] = useState<Curso[]>([]);
  const [form, setForm] = useState({
    nombre_padre: '',
    nombre_hijo: '',
    apellido_hijo: '',
    dni_hijo: '',
    curso_id: '',
  });
  const [catalogError, setCatalogError] = useState('');
  useEffect(() => {
    if (!register) return;
    const controller = new AbortController();
    setCatalogError('');
    request<Curso[]>('/auth/catalogo', { signal: controller.signal })
      .then(setCourses)
      .catch((failure: Error) => {
        if (!controller.signal.aborted) setCatalogError(failure.message);
      });
    return () => controller.abort();
  }, [register]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      const response = await request<{ usuario: UsuarioAcceso }>(
        register ? '/padres/registro' : '/auth/login',
        {
          method: 'POST',
          body: JSON.stringify(
            register
              ? { ...form, curso_id: Number(form.curso_id), email, password }
              : { email, password },
          ),
        },
      );
      setUser(response.usuario);
      setPassword('');
      if (response.usuario.rol === 'admin') window.location.assign('/admin');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="internal-page">
      <header className="internal-header">
        <a className="text-button" href="/">
          <ArrowLeft size={17} /> Volver al sitio
        </a>
        <strong>Educar para Transformar</strong>
      </header>
      <main className="login-layout">
        <section className="login-intro">
          <span className="eyebrow">
            <ShieldCheck size={18} /> Comunidad educativa
          </span>
          <h1>
            Tu escuela,
            <br />
            más cerca.
          </h1>
          <p>
            Ingresá para consultar tus cursos, gestionar inscripciones y seguir las novedades de la
            institución.
          </p>
          <ul className="login-benefits">
            <li>Gestión académica en un solo lugar</li>
            <li>Información de tus hijos y sus actividades</li>
            <li>Calificaciones y comunicaciones</li>
          </ul>
        </section>
        <form className="form-card login-card" onSubmit={submit}>
          <KeyRound size={30} />
          <h2>{register ? 'Crear cuenta familiar' : 'Iniciar sesión'}</h2>
          <Feedback error>{error || catalogError}</Feedback>
          {register && (
            <label>
              Nombre del padre, madre o tutor
              <input
                required
                autoComplete="name"
                value={form.nombre_padre}
                onChange={(e) => setForm({ ...form, nombre_padre: e.target.value })}
              />
            </label>
          )}
          <label>
            Email
            <input
              required
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label>
            Contraseña
            <input
              required
              type="password"
              minLength={register ? 10 : undefined}
              maxLength={72}
              autoComplete={register ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {register && (
            <>
              <small>Usá entre 10 y 72 caracteres.</small>
              <div className="editor-grid">
                <label>
                  Nombre del hijo
                  <input
                    required
                    value={form.nombre_hijo}
                    onChange={(e) => setForm({ ...form, nombre_hijo: e.target.value })}
                  />
                </label>
                <label>
                  Apellido del hijo
                  <input
                    required
                    value={form.apellido_hijo}
                    onChange={(e) => setForm({ ...form, apellido_hijo: e.target.value })}
                  />
                </label>
              </div>
              <label>
                DNI del hijo
                <input
                  required
                  inputMode="numeric"
                  pattern="[0-9]{7,9}"
                  value={form.dni_hijo}
                  onChange={(e) => setForm({ ...form, dni_hijo: e.target.value })}
                />
              </label>
              <label>
                Curso solicitado
                <select
                  required
                  value={form.curso_id}
                  onChange={(e) => setForm({ ...form, curso_id: e.target.value })}
                >
                  <option value="">Seleccionar…</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nivel} · {c.anio} {c.division}
                    </option>
                  ))}
                </select>
              </label>
              <small>
                Registrar al alumno permite gestionar su matrícula. La confirmación del ciclo
                lectivo se realiza desde el portal.
              </small>
            </>
          )}
          <Button disabled={pending} type="submit">
            {pending ? 'Procesando…' : register ? 'Crear cuenta' : 'Ingresar'}
          </Button>
          <button
            className="text-button"
            type="button"
            onClick={() => {
              setRegister(!register);
              setError('');
            }}
          >
            {register ? 'Ya tengo una cuenta' : 'Soy una familia nueva: crear cuenta'}
          </button>
          <small>
            Si necesitás vincular un alumno ya registrado o recuperar el acceso, contactá a
            secretaría.
          </small>
        </form>
      </main>
    </div>
  );
}
