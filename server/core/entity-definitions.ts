export type Definition = { table: string; fields: string[]; required: string[]; soft?: boolean };
export const entities: Record<string, Definition> = {
  tarifas: { table: 'tarifas', fields: ['tipo', 'monto'], required: ['tipo', 'monto'] },
  niveles: {
    table: 'niveles_educativos',
    fields: ['nombre', 'descripcion', 'etiqueta'],
    required: ['nombre', 'descripcion', 'etiqueta'],
  },
  alumnos: {
    table: 'alumnos',
    fields: [
      'nombre',
      'apellido',
      'legajo',
      'dni',
      'fecha_nacimiento',
      'domicilio',
      'telefono',
      'email',
      'curso_id',
      'usuario_padre_id',
      'estado',
    ],
    required: ['nombre', 'apellido', 'legajo', 'dni', 'curso_id'],
    soft: true,
  },
  docentes: {
    table: 'docentes',
    fields: ['nombre', 'apellido', 'legajo', 'dni', 'email', 'telefono', 'especialidad', 'estado'],
    required: ['nombre', 'apellido', 'legajo', 'dni', 'email', 'especialidad'],
    soft: true,
  },
  cursos: {
    table: 'cursos',
    fields: ['nivel_id', 'anio', 'division', 'turno', 'descripcion', 'cupo'],
    required: ['nivel_id', 'anio', 'division', 'turno'],
  },
  materias: { table: 'materias', fields: ['nombre', 'descripcion'], required: ['nombre'] },
  'asignaciones-docentes': {
    table: 'asignaciones_docentes',
    fields: ['docente_id', 'curso_id', 'materia_id', 'dia', 'horario'],
    required: ['docente_id', 'curso_id', 'materia_id', 'dia', 'horario'],
  },
  deportes: {
    table: 'deportes',
    fields: ['nombre', 'descripcion', 'profesor_id'],
    required: ['nombre', 'profesor_id'],
  },
  'grupos-deporte': {
    table: 'grupos_deporte',
    fields: ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id', 'cupo'],
    required: ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id'],
  },
  recorridos: {
    table: 'recorridos_transporte',
    fields: ['nombre', 'descripcion', 'horario', 'zona', 'cupo'],
    required: ['nombre', 'descripcion', 'horario', 'zona'],
  },
  servicios: {
    table: 'servicios',
    fields: ['nombre', 'descripcion', 'tipo', 'disponible', 'icono'],
    required: ['nombre', 'descripcion'],
  },
  instalaciones: {
    table: 'instalaciones',
    fields: ['nombre', 'descripcion', 'tipo', 'disponible', 'imagen_url'],
    required: ['nombre', 'descripcion'],
  },
  noticias: {
    table: 'noticias',
    fields: [
      'titulo',
      'descripcion',
      'contenido',
      'fecha_publicacion',
      'tipo',
      'visible',
      'imagen_url',
    ],
    required: ['titulo', 'descripcion'],
  },
  actividades: {
    table: 'actividades_escolares',
    fields: ['titulo', 'descripcion', 'nivel', 'fecha', 'visible'],
    required: ['titulo', 'descripcion', 'nivel', 'fecha'],
  },
  galeria: {
    table: 'galeria_imagenes',
    fields: ['titulo', 'descripcion', 'url_imagen', 'categoria', 'visible'],
    required: ['titulo', 'url_imagen'],
  },
  usuarios: {
    table: 'usuarios_acceso',
    fields: ['nombre', 'nombre_usuario', 'email', 'rol', 'estado', 'referencia_id', 'password'],
    required: ['nombre', 'email', 'rol'],
    soft: true,
  },
};
