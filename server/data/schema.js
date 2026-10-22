export const sqliteSchema = `
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS niveles_educativos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    etiqueta TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT DEFAULT '',
    dni TEXT DEFAULT '',
    fecha_nacimiento TEXT DEFAULT '',
    domicilio TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    email TEXT DEFAULT '',
    nivel TEXT NOT NULL,
    curso TEXT DEFAULT '',
    division TEXT DEFAULT '',
    tutor_nombre TEXT DEFAULT '',
    tutor_email TEXT DEFAULT '',
    tutor_telefono TEXT DEFAULT '',
    usuario_padre_id INTEGER,
    estado TEXT DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT DEFAULT '',
    dni TEXT DEFAULT '',
    email TEXT NOT NULL,
    telefono TEXT DEFAULT '',
    especialidad TEXT NOT NULL,
    estado TEXT DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cursos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nivel TEXT NOT NULL,
    anio TEXT DEFAULT '',
    division TEXT DEFAULT '',
    turno TEXT NOT NULL,
    descripcion TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS asignaciones_docentes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    docente_id INTEGER NOT NULL,
    curso_id INTEGER NOT NULL,
    materia TEXT NOT NULL,
    dia TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    FOREIGN KEY (docente_id) REFERENCES docentes(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
  );

  CREATE TABLE IF NOT EXISTS servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT DEFAULT 'general',
    disponible INTEGER DEFAULT 1,
    icono TEXT DEFAULT 'school'
  );

  CREATE TABLE IF NOT EXISTS instalaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT DEFAULT 'educativa',
    disponible INTEGER DEFAULT 1,
    imagen_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS alumnos_servicios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    servicio_id INTEGER NOT NULL,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (servicio_id) REFERENCES servicios(id)
  );

  CREATE TABLE IF NOT EXISTS asistencias_diarias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    presente INTEGER NOT NULL,
    observacion TEXT,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id)
  );

  CREATE TABLE IF NOT EXISTS evaluaciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    curso_id INTEGER NOT NULL,
    materia TEXT NOT NULL,
    titulo TEXT NOT NULL,
    fecha TEXT NOT NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id)
  );

  CREATE TABLE IF NOT EXISTS calificaciones_alumnos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    evaluacion_id INTEGER NOT NULL,
    calificacion REAL,
    observacion TEXT,
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id)
  );

  CREATE TABLE IF NOT EXISTS usuarios_acceso (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT DEFAULT '',
    nombre_usuario TEXT DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    password_demo TEXT DEFAULT '',
    rol TEXT NOT NULL CHECK (rol IN ('alumno', 'padre', 'docente', 'personal', 'admin')),
    estado TEXT DEFAULT 'activo',
    referencia_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS opiniones_web (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    autor_anonimo TEXT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_publicacion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado_moderacion TEXT DEFAULT 'pendiente',
    visible INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS solicitudes_inscripcion (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_tutor TEXT NOT NULL,
    nombre_aspirante TEXT NOT NULL,
    nivel_solicitado TEXT NOT NULL,
    email_contacto TEXT NOT NULL,
    telefono TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_solicitud TEXT DEFAULT CURRENT_TIMESTAMP,
    estado_tramite TEXT DEFAULT 'recibida'
  );

  CREATE TABLE IF NOT EXISTS postulaciones_empleo (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_candidato TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    puesto_interes TEXT NOT NULL,
    enlace_cv TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'recibida'
  );

  CREATE TABLE IF NOT EXISTS noticias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    contenido TEXT DEFAULT '',
    fecha_publicacion TEXT NOT NULL,
    tipo TEXT NOT NULL,
    visible INTEGER DEFAULT 1,
    imagen_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS actividades_escolares (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    nivel TEXT NOT NULL,
    fecha TEXT NOT NULL,
    visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS galeria_imagenes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    url_imagen TEXT NOT NULL,
    categoria TEXT DEFAULT 'Institucional',
    visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS contacto_mensajes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    asunto TEXT DEFAULT 'Consulta web',
    mensaje TEXT NOT NULL,
    fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'nuevo'
  );

  CREATE TABLE IF NOT EXISTS materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS deportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    profesor_id INTEGER,
    FOREIGN KEY (profesor_id) REFERENCES docentes(id)
  );

  CREATE TABLE IF NOT EXISTS grupos_deporte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    deporte_id INTEGER NOT NULL,
    nivel TEXT NOT NULL,
    dia TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    profesor_id INTEGER,
    FOREIGN KEY (deporte_id) REFERENCES deportes(id),
    FOREIGN KEY (profesor_id) REFERENCES docentes(id)
  );

  CREATE TABLE IF NOT EXISTS recorridos_transporte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    zona TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alumno_id INTEGER NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('deporte', 'transporte', 'comedor')),
    grupo_deporte_id INTEGER,
    recorrido_id INTEGER,
    fecha_inscripcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'activo',
    FOREIGN KEY (alumno_id) REFERENCES alumnos(id),
    FOREIGN KEY (grupo_deporte_id) REFERENCES grupos_deporte(id),
    FOREIGN KEY (recorrido_id) REFERENCES recorridos_transporte(id)
  );
`;

export const postgresSchema = `
  CREATE TABLE IF NOT EXISTS niveles_educativos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    etiqueta TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS alumnos (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT DEFAULT '',
    dni TEXT DEFAULT '',
    fecha_nacimiento TEXT DEFAULT '',
    domicilio TEXT DEFAULT '',
    telefono TEXT DEFAULT '',
    email TEXT DEFAULT '',
    nivel TEXT NOT NULL,
    curso TEXT DEFAULT '',
    division TEXT DEFAULT '',
    tutor_nombre TEXT DEFAULT '',
    tutor_email TEXT DEFAULT '',
    tutor_telefono TEXT DEFAULT '',
    usuario_padre_id INTEGER,
    estado TEXT DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS docentes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    legajo TEXT DEFAULT '',
    dni TEXT DEFAULT '',
    email TEXT NOT NULL,
    telefono TEXT DEFAULT '',
    especialidad TEXT NOT NULL,
    estado TEXT DEFAULT 'activo',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS cursos (
    id SERIAL PRIMARY KEY,
    nivel TEXT NOT NULL,
    anio TEXT DEFAULT '',
    division TEXT DEFAULT '',
    turno TEXT NOT NULL,
    descripcion TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS asignaciones_docentes (
    id SERIAL PRIMARY KEY,
    docente_id INTEGER NOT NULL REFERENCES docentes(id),
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    materia TEXT NOT NULL,
    dia TEXT DEFAULT '',
    horario TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS servicios (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT DEFAULT 'general',
    disponible INTEGER DEFAULT 1,
    icono TEXT DEFAULT 'school'
  );

  CREATE TABLE IF NOT EXISTS instalaciones (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    tipo TEXT DEFAULT 'educativa',
    disponible INTEGER DEFAULT 1,
    imagen_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS alumnos_servicios (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
    servicio_id INTEGER NOT NULL REFERENCES servicios(id),
    activo INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS asistencias_diarias (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
    fecha TEXT NOT NULL,
    presente INTEGER NOT NULL,
    observacion TEXT
  );

  CREATE TABLE IF NOT EXISTS evaluaciones (
    id SERIAL PRIMARY KEY,
    curso_id INTEGER NOT NULL REFERENCES cursos(id),
    materia TEXT NOT NULL,
    titulo TEXT NOT NULL,
    fecha TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS calificaciones_alumnos (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
    evaluacion_id INTEGER NOT NULL REFERENCES evaluaciones(id),
    calificacion REAL,
    observacion TEXT
  );

  CREATE TABLE IF NOT EXISTS usuarios_acceso (
    id SERIAL PRIMARY KEY,
    nombre TEXT DEFAULT '',
    nombre_usuario TEXT DEFAULT '',
    email TEXT NOT NULL UNIQUE,
    password_demo TEXT DEFAULT '',
    rol TEXT NOT NULL CHECK (rol IN ('alumno', 'padre', 'docente', 'personal', 'admin')),
    estado TEXT DEFAULT 'activo',
    referencia_id INTEGER,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS opiniones_web (
    id SERIAL PRIMARY KEY,
    autor_anonimo TEXT NOT NULL,
    comentario TEXT NOT NULL,
    fecha_publicacion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado_moderacion TEXT DEFAULT 'pendiente',
    visible INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS solicitudes_inscripcion (
    id SERIAL PRIMARY KEY,
    nombre_tutor TEXT NOT NULL,
    nombre_aspirante TEXT NOT NULL,
    nivel_solicitado TEXT NOT NULL,
    email_contacto TEXT NOT NULL,
    telefono TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_solicitud TEXT DEFAULT CURRENT_TIMESTAMP,
    estado_tramite TEXT DEFAULT 'recibida'
  );

  CREATE TABLE IF NOT EXISTS postulaciones_empleo (
    id SERIAL PRIMARY KEY,
    nombre_candidato TEXT NOT NULL,
    email TEXT NOT NULL,
    telefono TEXT NOT NULL,
    puesto_interes TEXT NOT NULL,
    enlace_cv TEXT NOT NULL,
    mensaje TEXT NOT NULL,
    fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'recibida'
  );

  CREATE TABLE IF NOT EXISTS noticias (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    contenido TEXT DEFAULT '',
    fecha_publicacion TEXT NOT NULL,
    tipo TEXT NOT NULL,
    visible INTEGER DEFAULT 1,
    imagen_url TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS actividades_escolares (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT NOT NULL,
    nivel TEXT NOT NULL,
    fecha TEXT NOT NULL,
    visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS galeria_imagenes (
    id SERIAL PRIMARY KEY,
    titulo TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    url_imagen TEXT NOT NULL,
    categoria TEXT DEFAULT 'Institucional',
    visible INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS contacto_mensajes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT NOT NULL,
    asunto TEXT DEFAULT 'Consulta web',
    mensaje TEXT NOT NULL,
    fecha_recepcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'nuevo'
  );

  CREATE TABLE IF NOT EXISTS materias (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS deportes (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    profesor_id INTEGER REFERENCES docentes(id)
  );

  CREATE TABLE IF NOT EXISTS grupos_deporte (
    id SERIAL PRIMARY KEY,
    deporte_id INTEGER NOT NULL REFERENCES deportes(id),
    nivel TEXT NOT NULL,
    dia TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    profesor_id INTEGER REFERENCES docentes(id)
  );

  CREATE TABLE IF NOT EXISTS recorridos_transporte (
    id SERIAL PRIMARY KEY,
    nombre TEXT NOT NULL,
    descripcion TEXT DEFAULT '',
    horario TEXT DEFAULT '',
    zona TEXT DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS inscripciones (
    id SERIAL PRIMARY KEY,
    alumno_id INTEGER NOT NULL REFERENCES alumnos(id),
    tipo TEXT NOT NULL CHECK (tipo IN ('deporte', 'transporte', 'comedor')),
    grupo_deporte_id INTEGER REFERENCES grupos_deporte(id),
    recorrido_id INTEGER REFERENCES recorridos_transporte(id),
    fecha_inscripcion TEXT DEFAULT CURRENT_TIMESTAMP,
    estado TEXT DEFAULT 'activo'
  );
`;
