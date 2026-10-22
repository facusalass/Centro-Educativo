export type Field = {
  key: string;
  label: string;
  type?: string;
  required?: boolean;
  source?: string;
  options?: string[];
  initial?: string | number;
};
export type Entity = {
  path: string;
  title: string;
  fields: Field[];
  columns: string[];
  soft?: boolean;
};
const f = (key: string, label: string, required = true, type = 'text'): Field => ({
  key,
  label,
  required,
  type,
});
const ref = (key: string, label: string, source: string, required = true): Field => ({
  key,
  label,
  source,
  required,
});
const state: Field = {
  key: 'estado',
  label: 'Estado',
  options: ['activo', 'inactivo'],
  initial: 'activo',
};
const days: Field = {
  key: 'dia',
  label: 'Día',
  options: ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  required: true,
};
const schedule = f('horario', 'Horario (HH:MM - HH:MM)');
const cupo: Field = { ...f('cupo', 'Cupo', true, 'number'), initial: 40 };
const visible: Field = { key: 'visible', label: 'Publicada', options: ['1', '0'], initial: 1 };
export const entityDefinitions: Record<string, Entity> = {
  tarifas: {
    path: 'tarifas',
    title: 'Aranceles mensuales',
    columns: ['tipo', 'monto'],
    fields: [
      {
        key: 'tipo',
        label: 'Concepto',
        options: ['base', 'deporte', 'transporte', 'comedor'],
        required: true,
      },
      f('monto', 'Importe mensual en pesos', true, 'number'),
    ],
  },
  alumnos: {
    path: 'alumnos',
    title: 'Alumnos',
    soft: true,
    columns: ['apellido', 'nombre', 'legajo', 'dni', 'curso_id', 'estado'],
    fields: [
      f('nombre', 'Nombre'),
      f('apellido', 'Apellido'),
      f('legajo', 'Legajo'),
      f('dni', 'DNI'),
      f('fecha_nacimiento', 'Fecha de nacimiento', false, 'date'),
      ref('curso_id', 'Curso', 'cursos'),
      ref('usuario_padre_id', 'Padre / Tutor', 'padres', false),
      f('email', 'Email', false, 'email'),
      f('telefono', 'Teléfono', false),
      f('domicilio', 'Domicilio', false),
      state,
    ],
  },
  docentes: {
    path: 'docentes',
    title: 'Docentes',
    soft: true,
    columns: ['apellido', 'nombre', 'legajo', 'especialidad', 'email', 'estado'],
    fields: [
      f('nombre', 'Nombre'),
      f('apellido', 'Apellido'),
      f('legajo', 'Legajo'),
      f('dni', 'DNI'),
      f('email', 'Email', true, 'email'),
      f('telefono', 'Teléfono', false),
      f('especialidad', 'Especialidad'),
      state,
    ],
  },
  niveles: {
    path: 'niveles',
    title: 'Niveles',
    columns: ['nombre', 'etiqueta', 'descripcion'],
    fields: [
      f('nombre', 'Nombre'),
      f('etiqueta', 'Salas / Años'),
      f('descripcion', 'Descripción', true, 'textarea'),
    ],
  },
  cursos: {
    path: 'cursos',
    title: 'Cursos',
    columns: ['nivel_id', 'anio', 'division', 'turno', 'cupo'],
    fields: [
      ref('nivel_id', 'Nivel', 'niveles'),
      f('anio', 'Año / Sala'),
      f('division', 'División'),
      {
        key: 'turno',
        label: 'Turno',
        options: ['A confirmar', 'Mañana', 'Tarde', 'Jornada extendida'],
        required: true,
      },
      cupo,
      f('descripcion', 'Descripción', false, 'textarea'),
    ],
  },
  materias: {
    path: 'materias',
    title: 'Materias',
    columns: ['nombre', 'descripcion'],
    fields: [f('nombre', 'Nombre'), f('descripcion', 'Descripción', false, 'textarea')],
  },
  asignaciones: {
    path: 'asignaciones-docentes',
    title: 'Asignaciones docentes',
    columns: ['docente_id', 'curso_id', 'materia_id', 'dia', 'horario'],
    fields: [
      ref('docente_id', 'Docente', 'docentes'),
      ref('curso_id', 'Curso', 'cursos'),
      ref('materia_id', 'Materia', 'materias'),
      days,
      schedule,
    ],
  },
  deportes: {
    path: 'deportes',
    title: 'Deportes',
    columns: ['nombre', 'profesor_id', 'descripcion'],
    fields: [
      f('nombre', 'Nombre'),
      ref('profesor_id', 'Profesor responsable', 'docentes'),
      f('descripcion', 'Descripción', false, 'textarea'),
    ],
  },
  grupos: {
    path: 'grupos-deporte',
    title: 'Grupos deportivos',
    columns: ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id', 'cupo'],
    fields: [
      ref('deporte_id', 'Deporte', 'deportes'),
      {
        key: 'nivel',
        label: 'Nivel',
        options: ['Inicial', 'Primario', 'Secundario'],
        required: true,
      },
      days,
      schedule,
      ref('profesor_id', 'Profesor', 'docentes'),
      cupo,
    ],
  },
  recorridos: {
    path: 'recorridos',
    title: 'Transporte',
    columns: ['nombre', 'zona', 'horario', 'cupo'],
    fields: [
      f('nombre', 'Nombre'),
      f('zona', 'Zona'),
      f('horario', 'Horario de salida', true, 'time'),
      cupo,
      f('descripcion', 'Descripción', true, 'textarea'),
    ],
  },
  usuarios: {
    path: 'usuarios',
    title: 'Usuarios y permisos',
    soft: true,
    columns: ['nombre', 'email', 'rol', 'referencia_id', 'estado'],
    fields: [
      f('nombre', 'Nombre'),
      f('email', 'Email', true, 'email'),
      {
        key: 'rol',
        label: 'Rol',
        options: ['admin', 'docente', 'padre', 'alumno', 'personal'],
        required: true,
      },
      ref('referencia_id', 'Legajo asociado (docente / alumno)', 'referencias', false),
      f('password', 'Contraseña (10 a 72 caracteres)', false, 'password'),
      state,
    ],
  },
  servicios: {
    path: 'servicios',
    title: 'Servicios',
    columns: ['nombre', 'tipo', 'disponible'],
    fields: [
      f('nombre', 'Nombre'),
      f('tipo', 'Tipo'),
      f('descripcion', 'Descripción', true, 'textarea'),
      { key: 'disponible', label: 'Disponible', options: ['1', '0'], initial: 1 },
    ],
  },
  instalaciones: {
    path: 'instalaciones',
    title: 'Instalaciones',
    columns: ['nombre', 'tipo', 'disponible'],
    fields: [
      f('nombre', 'Nombre'),
      f('tipo', 'Tipo'),
      f('descripcion', 'Descripción', true, 'textarea'),
      f('imagen_url', 'URL de imagen', false, 'url'),
      { key: 'disponible', label: 'Disponible', options: ['1', '0'], initial: 1 },
    ],
  },
  noticias: {
    path: 'noticias',
    title: 'Noticias',
    columns: ['titulo', 'tipo', 'fecha_publicacion', 'visible'],
    fields: [
      f('titulo', 'Título'),
      f('descripcion', 'Resumen', true, 'textarea'),
      f('contenido', 'Contenido', false, 'textarea'),
      {
        ...f('fecha_publicacion', 'Fecha', true, 'date'),
        initial: new Date().toISOString().slice(0, 10),
      },
      { ...f('tipo', 'Tipo'), initial: 'Institucional' },
      f('imagen_url', 'URL de imagen', false, 'url'),
      visible,
    ],
  },
  actividades: {
    path: 'actividades',
    title: 'Actividades',
    columns: ['titulo', 'nivel', 'fecha', 'visible'],
    fields: [
      f('titulo', 'Título'),
      f('descripcion', 'Descripción', true, 'textarea'),
      f('nivel', 'Nivel'),
      f('fecha', 'Fecha', true, 'date'),
      visible,
    ],
  },
  galeria: {
    path: 'galeria',
    title: 'Galería',
    columns: ['titulo', 'categoria', 'visible'],
    fields: [
      f('titulo', 'Título'),
      f('descripcion', 'Descripción', false, 'textarea'),
      f('url_imagen', 'URL de imagen', true, 'url'),
      f('categoria', 'Categoría'),
      visible,
    ],
  },
};
