import type { ActividadEscolar, GaleriaImagen, Instalacion, Nivel, Noticia, Opinion, Servicio } from '../types';

export const nivelesFallback: Nivel[] = [
  {
    id: 1,
    nombre: 'Nivel Inicial',
    descripcion: 'Educacion temprana que sienta las bases del aprendizaje a traves del juego y la exploracion.',
    etiqueta: 'Salas de 3, 4 y 5',
  },
  {
    id: 2,
    nombre: 'Nivel Primario',
    descripcion: 'Formacion integral que desarrolla competencias fundamentales y valores esenciales.',
    etiqueta: '1ro a 7mo grado',
  },
  {
    id: 3,
    nombre: 'Nivel Secundario',
    descripcion: 'Preparacion para el futuro con excelencia academica y orientacion vocacional.',
    etiqueta: 'Ciclo basico y orientado',
  },
];

export const serviciosFallback: Servicio[] = [
  { id: 1, nombre: 'Comedor', descripcion: 'Menu escolar planificado para acompanar la jornada extendida.', tipo: 'bienestar', disponible: 1, icono: 'utensils' },
  { id: 2, nombre: 'Enfermeria', descripcion: 'Atencion primaria y seguimiento de situaciones de salud.', tipo: 'salud', disponible: 1, icono: 'heart-pulse' },
  { id: 3, nombre: 'Idiomas', descripcion: 'Ingles y talleres complementarios para todos los niveles.', tipo: 'academico', disponible: 1, icono: 'languages' },
  { id: 4, nombre: 'Deportes', descripcion: 'Actividades deportivas, torneos y vida saludable.', tipo: 'deportivo', disponible: 1, icono: 'trophy' },
  { id: 5, nombre: 'Transporte', descripcion: 'Traslado planificado para familias de Resistencia y alrededores.', tipo: 'logistica', disponible: 1, icono: 'bus' },
];

export const instalacionesFallback: Instalacion[] = [
  {
    id: 1,
    nombre: 'Aulas equipadas',
    descripcion: 'Espacios luminosos con mobiliario flexible y recursos digitales.',
    tipo: 'academica',
    disponible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1698993081947-8a3654303904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    id: 2,
    nombre: 'Laboratorios',
    descripcion: 'Ambientes preparados para ciencias, tecnologia y experiencias practicas.',
    tipo: 'academica',
    disponible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1758270704787-615782711641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    id: 3,
    nombre: 'Gimnasio',
    descripcion: 'Area cubierta para educacion fisica y actividades institucionales.',
    tipo: 'deportiva',
    disponible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1759641801965-a15a53b877b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    id: 4,
    nombre: 'Pileta',
    descripcion: 'Espacio recreativo y deportivo para propuestas acuaticas supervisadas.',
    tipo: 'deportiva',
    disponible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    id: 5,
    nombre: 'Canchas',
    descripcion: 'Sectores exteriores para deportes, recreos y actividades grupales.',
    tipo: 'deportiva',
    disponible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    id: 6,
    nombre: 'Campus educativo',
    descripcion: 'Predio amplio ubicado en las afueras de Resistencia.',
    tipo: 'institucional',
    disponible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1586144131462-fa2a2b6d070c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
];

export const noticiasFallback: Noticia[] = [
  {
    id: 1,
    titulo: 'Proceso de inscripcion 2027 abierto',
    descripcion: 'Ya se encuentra disponible la solicitud de inscripcion para familias interesadas en el ciclo lectivo 2027.',
    contenido: 'Las familias pueden completar el formulario web para iniciar el tramite.',
    fecha_publicacion: '2026-05-01',
    tipo: 'Inscripcion',
    visible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1758270705639-9727f350f026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    id: 2,
    titulo: 'Recorrida por las nuevas instalaciones',
    descripcion: 'Invitamos a conocer los espacios proyectados para aulas, laboratorios, deporte y bienestar estudiantil.',
    contenido: 'La recorrida institucional permite conocer el campus y resolver consultas.',
    fecha_publicacion: '2026-04-15',
    tipo: 'Institucional',
    visible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1774386897531-1f5d7741409c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
  {
    id: 3,
    titulo: 'Presentacion del proyecto pedagogico',
    descripcion: 'La institucion presento su propuesta centrada en excelencia academica, acompanamiento e innovacion educativa.',
    contenido: 'El proyecto articula tecnologia, idiomas, deportes y acompanamiento.',
    fecha_publicacion: '2026-04-10',
    tipo: 'Academica',
    visible: 1,
    imagen_url: 'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
  },
];

export const opinionesFallback: Opinion[] = [
  {
    id: 1,
    autor_anonimo: 'Madre de familia',
    comentario: 'La propuesta institucional transmite organizacion, cercania y una mirada integral sobre cada estudiante.',
    fecha_publicacion: '2026-05-01',
    estado_moderacion: 'visible',
    visible: 1,
  },
  {
    id: 2,
    autor_anonimo: 'Tutor interesado',
    comentario: 'Nos gusto que el proyecto combine formacion academica, deportes, idiomas y acompanamiento personalizado.',
    fecha_publicacion: '2026-04-24',
    estado_moderacion: 'visible',
    visible: 1,
  },
  {
    id: 3,
    autor_anonimo: 'Docente postulante',
    comentario: 'Se percibe un espacio de trabajo serio, colaborativo y con oportunidades de crecimiento profesional.',
    fecha_publicacion: '2026-04-18',
    estado_moderacion: 'visible',
    visible: 1,
  },
];

export const actividadesFallback: ActividadEscolar[] = [
  { id: 1, titulo: 'Jornada de bienvenida familiar', descripcion: 'Encuentro institucional para presentar equipos y modalidad de trabajo.', nivel: 'Todos los niveles', fecha: '2027-03-04', visible: 1 },
  { id: 2, titulo: 'Taller de lectura compartida', descripcion: 'Actividad de promocion lectora para estudiantes de nivel primario.', nivel: 'Primario', fecha: '2027-04-12', visible: 1 },
  { id: 3, titulo: 'Muestra de ciencias y tecnologia', descripcion: 'Presentacion de experiencias de laboratorio y proyectos interdisciplinarios.', nivel: 'Secundario', fecha: '2027-06-18', visible: 1 },
];

export const galeriaFallback: GaleriaImagen[] = instalacionesFallback.slice(0, 5).map((item) => ({
  id: item.id,
  titulo: item.nombre,
  descripcion: item.descripcion,
  url_imagen: item.imagen_url,
  categoria: item.tipo,
  visible: 1,
}));
