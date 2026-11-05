El centro educativo “EDUCAR PARA TRANSFORMAR”, es una institución de gestión privada de alta calidad educativa, ubicada en las afuera de la ciudad de Resistencia. Tiene previsto iniciar sus actividades en marzo de 2027 por lo cual requiere iniciar el proceso de automatización de sus actividades de gestión, por lo cual requiere:
 
    - un sistema de gestión
 
El centro educativo cuenta con
 
	- Niveles educativos con jornada extendida
 
	- Inicial
 
	- Primario
 
	- Secundario
 
	- Servicio de Apoyo estudiantil
 
	- Idiomas:
 
	- Inglés
 
	- Portugués
 
	- Francés
 
	- Instalaciones
 
	- Pileta de Natación
 
	- Canchas de fútbol
 
	- Pista de Atletismo
 
	- Gimnasio cubierto
 
	- Comedor
 
	- Deportes
 
	- Atletismo
 
	- Natación
 
	- Fútbol
 
	- Artes Marciales
 
	- Vóleibol
 
	- Danza
 
	- Básquet
 
	- Ajedrez
 
	- Servicio de Micros de traslado
 
	- Laboratorios de computación, física y química.
 
	- Comedor
 
	- Enfermería
 
	
 
Continuando con el proceso de automatización de los procesos, la Dirección del Centro Educativo considera que necesita un sistema de gestión que permita centralizar la información y facilitar la gestión académica, administrativa y extracurricular.
 
## Objetivo general
 
Desarrollar un sistema de gestion via pagina web que permita **gestionar de manera integrada la información académica, deportiva y de servicios de los alumnos**, facilitando el trabajo de docentes, padres y personal administrativo.
 
El sistema deberá garantizar que la información se encuentre actualizada, sea consistente y pueda ser consultada de acuerdo con los permisos correspondientes.
 
En esta etapa del proyecto se desarrollarán tres módulos principales:
 
	- Módulo Alumnos
 
	- Módulo de Profesores
 
	- Módulo Administrador
 
## Módulo Alumnos:
 
Este módulo permitirá consultar y administrar la información relacionada con los alumnos. Cada alumno tendrá, como mínimo:
 
	- Legajo.
 
	- DNI.
 
	- Nombre.
 
	- Apellido.
 
	- Fecha de nacimiento.
 
	- Domicilio.
 
	- Teléfono.
 
	- Correo electrónico.
 
	- Nivel educativo.
 
	- Curso.
 
	- Estado del alumno.
 
## Módulo Profesores:
 
El módulo permitirá administrar la información de los docentes. Cada profesor tendrá:
 
	- Legajo.
 
	- DNI.
 
	- Nombre.
 
	- Apellido.
 
	- Especialidad.
 
	- Correo electrónico.
 
	- Teléfono.
 
	- Estado.
 
El sistema deberá permitir registrar las materias que tiene a su cargo y los cursos/niveles en los que desarrolla sus actividades.
 
## Módulo Administración:
 
El administrador será responsable de configurar y mantener la información general del sistema. Podrá administrar:
 
	- Alumnos.
 
	- Profesores.
 
	- Niveles educativos.
 
	- Cursos.
 
	- Materias.
 
	- Deportes.
 
	- Horarios.
 
	- Inscripciones.
 
	- Servicio de transporte.
 
	- Servicio de comedor.
 
	- Usuarios y permisos.
 
Además, tendrá acceso a todos los reportes definidos por la Dirección.
 
El sistema deberá permitir, además, generar información para la toma de decisiones mediante diferentes reportes que son:
 
	- Por alumno:
 
	- Curso al que pertenece.
 
	- Materias que cursa.
 
	- Profesores de cada materia.
 
	- Deportes en los que participa.
 
	- Horarios de las actividades deportivas.
 
	- Uso del servicio de transporte.
 
	- Uso del servicio de comedor.
 
	- Por docente:
 
	- Cursos a cargo por Nivel
 
	- Horarios de cada curso
 
	- Listado de alumnos por curso. Debe mostrar:
 
	- Nivel educativo.
 
	- Curso.
 
	- Legajo.
 
	- Apellido.
 
	- Nombre.
 
	- Listado de alumnos por materia- Debe mostrar:
 
	- Nivel educativo.
 
	- Curso.
 
	- Materia.
 
	- Profesor a cargo.
 
	- Alumno.
 
	- Legajo.
 
	- Listado de docentes por nivel educativo. Debe mostrar:
 
	- Nivel educativo.
 
	- Profesor.
 
	- Materias a cargo.
 
	- Cursos.
 
	- Listado de alumnos por deporte. Debe mostrar:
 
	- Deporte.
 
	- Alumno.
 
	- Curso.
 
	- Nivel educativo.
 
	- Listado de alumnos por deporte y por nivel.
 
	- Listado de alumnos por deporte, nivel, horario y profesor a cargo.
 
	- Listado de alumnos por recorrido del servicio de transporte.
 
## Reglas de Negocio:
 
	- Cada alumno puede:
 
	- inscribirse a dos deportes simultáneamente.
 
	- Inscribirse al servicio de transporte por recorrido.
 
	- Inscribirse al servicio de comedor
 
	- Los padres pueden acceder a la siguiente información de cada hijo:
 
	- Profesores por materia
 
	- Deportes en que participa
 
	- Inscribir a su hijo al cursado.
 
	- Un alumno pertenece a un curso y puede cursar diferentes materias.
 
	- Una materia puede ser dictada por un profesor a diferentes cursos.
 
	- El sistema deberá controlar que no existan conflictos de horarios entre las actividades deportivas seleccionadas por los estudiantes.
 
	- El servicio de transporte tiene cuatro recorridos.
 
	- Cada alumno debe pertenecer a un único curso.
 
	- Cada curso pertenece a un único nivel educativo.
 
	- Una materia puede ser dictada en diferentes cursos.
 
	- Una materia puede tener diferentes profesores según el curso.
 
	- Cada deporte debe tener un profesor responsable.
 
	- Un deporte puede tener diferentes grupos según nivel y horario.
 
	- Un padre puede tener asociados uno o varios hijos.
 
	- Un padre solamente puede consultar y gestionar información de sus hijos.
 
	- El administrador puede gestionar toda la información del sistema.
 
	- El sistema debe evitar registros duplicados de inscripciones.
 
	- El administrador debe permitir que cada tipo de usuario solo puede acceder a las partes del sistema asociado a su rol.
