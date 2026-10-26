import {
  renderAlumnosPorCurso,
  renderAlumnosPorDeporte,
  renderAlumnosPorDeporteNivel,
  renderAlumnosPorDeporteDetalle,
  renderAlumnosPorRecorrido,
  renderAlumnosPorMateria,
  renderDocentesPorNivel,
  renderReporteAlumno,
  renderReporteDocente,
} from './renderers';
import type { ReportType } from '../../services/reports';
import type {
  AlumnosPorCurso,
  AlumnosPorDeporte,
  AlumnosPorDeporteNivel,
  AlumnosPorDeporteDetalle,
  AlumnosPorRecorrido,
  AlumnosPorMateria,
  DocentesPorNivel,
  ReporteAlumno,
  ReporteDocente,
} from '../../types';

// Render inside a child component so the surrounding ErrorBoundary can recover.
export function ReportContent({ type, data }: { type: ReportType; data: unknown }) {
  switch (type) {
    case 'alumnos-por-curso':
      return renderAlumnosPorCurso(data as AlumnosPorCurso);
    case 'alumnos-por-deporte':
      return renderAlumnosPorDeporte(data as AlumnosPorDeporte);
    case 'alumnos-por-deporte-nivel':
      return renderAlumnosPorDeporteNivel(data as AlumnosPorDeporteNivel);
    case 'alumnos-por-deporte-detalle':
      return renderAlumnosPorDeporteDetalle(data as AlumnosPorDeporteDetalle);
    case 'alumnos-por-recorrido':
      return renderAlumnosPorRecorrido(data as AlumnosPorRecorrido);
    case 'alumnos-por-materia':
      return renderAlumnosPorMateria(data as AlumnosPorMateria);
    case 'docentes-por-nivel':
      return renderDocentesPorNivel(data as DocentesPorNivel);
    case 'alumno':
      return renderReporteAlumno(data as ReporteAlumno);
    case 'docente':
      return renderReporteDocente(data as ReporteDocente);
  }
}
