import { useState, type FormEvent } from 'react';
import { request } from '../../services/api';
import { Feedback } from '../PortalShell';
import { Button } from '../Button';
export function PasswordForm() {
  const [actual, setActual] = useState(''),
    [password, setPassword] = useState(''),
    [error, setError] = useState(''),
    [pending, setPending] = useState(false);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await request('/auth/password', {
        method: 'PUT',
        body: JSON.stringify({ actual, password }),
      });
      window.location.assign('/login');
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setPending(false);
    }
  };
  return (
    <section className="panel-card">
      <h2>Cambiar contraseña</h2>
      <p>Al guardar, volvé a ingresar con tu nueva contraseña.</p>
      <Feedback error>{error}</Feedback>
      <form onSubmit={submit}>
        <label>
          Contraseña actual
          <input
            type="password"
            required
            autoComplete="current-password"
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
        </label>
        <label>
          Nueva contraseña
          <input
            type="password"
            minLength={10}
            maxLength={72}
            required
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <Button type="submit" disabled={pending}>
          Guardar contraseña
        </Button>
      </form>
    </section>
  );
}
