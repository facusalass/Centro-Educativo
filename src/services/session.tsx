import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { UsuarioAcceso } from '../types';
import { request } from './api';
type Session = { user: UsuarioAcceso | null; loading: boolean; setUser: (user: UsuarioAcceso | null) => void; logout: () => Promise<void> };
const Context = createContext<Session | null>(null);
export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UsuarioAcceso | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    request<{ usuario: UsuarioAcceso }>('/auth/me').then((r) => setUser(r.usuario)).catch(() => setUser(null)).finally(() => setLoading(false));
    const expire = () => setUser(null);
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);
  const logout = async () => { await request('/auth/logout', { method: 'POST' }); setUser(null); window.location.assign('/login'); };
  return <Context.Provider value={{ user, loading, setUser, logout }}>{children}</Context.Provider>;
}
export function useSession() {
  const session = useContext(Context);
  if (!session) throw new Error('Falta el proveedor de sesión.');
  return session;
}
