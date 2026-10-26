import { useEffect, useState } from 'react';
import { fetchReport, isPersonalReport, type ReportType } from '../services/reports';
import { errorMessage } from '../services/useResource';

type ReportState = { key: string } & (
  | { status: 'loading' }
  | { status: 'empty'; message: string }
  | { status: 'error'; message: string }
  | { status: 'success'; data: unknown; generatedAt: string }
);

export function useReport(type: ReportType, id: string) {
  const [revision, setRevision] = useState(0);
  const key = `${type}:${id}:${revision}`;
  const [state, setState] = useState<ReportState>({ key, status: 'loading' });

  useEffect(() => {
    const controller = new AbortController();
    if (isPersonalReport(type) && !id) {
      setState({
        key,
        status: 'empty',
        message: type === 'alumno' ? 'Seleccioná un alumno.' : 'Seleccioná un docente.',
      });
      return () => controller.abort();
    }
    setState({ key, status: 'loading' });
    void fetchReport(type, id, controller.signal)
      .then((data) => {
        if (!controller.signal.aborted)
          setState({
            key,
            status: 'success',
            data,
            generatedAt: new Date().toLocaleString('es-AR'),
          });
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setState({ key, status: 'error', message: errorMessage(failure) });
      });
    return () => controller.abort();
  }, [type, id, key]);

  // A changed selection invalidates the previous result before effects run.
  const current: ReportState = state.key === key ? state : { key, status: 'loading' };
  return { state: current, reload: () => setRevision((value) => value + 1) };
}
