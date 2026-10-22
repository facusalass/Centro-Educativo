export function createDemoSeeder({ tableIsEmpty, insertMany, insert, get, run }) {
  async function seedDatabase() {
    await seedNiveles();
    await seedServicios();
    await seedInstalaciones();
    await seedNoticias();
    await seedOpiniones();
    await seedDocentes();
    await seedMaterias();
    await seedDeportes();
    await seedGruposDeporte();
    await seedRecorridos();
    await seedCursos();
    await seedAlumnos();
    await seedAsignaciones();
    await seedUsuarios();
    await seedActividades();
    await seedGaleria();
    await seedInscripciones();
    await ensureDemoParentChild();
  }

  async function ensureDemoParentChild() {
    const parent = await get('SELECT id, email FROM usuarios_acceso WHERE email = ?', [
      'padre@educar.com',
    ]);
    if (!parent) return;

    const studentAccount = await get(
      "SELECT referencia_id FROM usuarios_acceso WHERE email = 'alumno@educar.com' AND rol = 'alumno'",
    );
    const sharedChild = studentAccount?.referencia_id
      ? await get('SELECT * FROM alumnos WHERE id = ?', [studentAccount.referencia_id])
      : null;
    const linkedChild =
      sharedChild ??
      (await get('SELECT * FROM alumnos WHERE usuario_padre_id = ? OR tutor_email = ? LIMIT 1', [
        parent.id,
        parent.email,
      ]));

    if (linkedChild) {
      if (studentAccount?.referencia_id === linkedChild.id) {
        await run('UPDATE usuarios_acceso SET nombre = ? WHERE email = ? AND rol = ?', [
          `${linkedChild.nombre} ${linkedChild.apellido}`,
          'alumno@educar.com',
          'alumno',
        ]);
      }
      await run(
        'UPDATE alumnos SET usuario_padre_id = ?, tutor_nombre = ?, tutor_email = ? WHERE id = ?',
        [parent.id, parent.email, parent.email, linkedChild.id],
      );
      await run(
        "UPDATE alumnos SET usuario_padre_id = NULL, tutor_email = '' WHERE usuario_padre_id = ? AND id <> ?",
        [parent.id, linkedChild.id],
      );
      await ensureDemoChildEnrollment(linkedChild.id);
      return;
    }

    const childId = await insert('alumnos', {
      nombre: 'Mateo',
      apellido: 'Fernandez',
      legajo: 'A-2027-004',
      dni: '51222333',
      fecha_nacimiento: '2017-06-18',
      domicilio: 'Av. Alberdi 456',
      telefono: '3624011004',
      email: 'mateo.fernandez@educar.com',
      nivel: 'Primario',
      curso: '3ro',
      division: 'A',
      tutor_nombre: parent.email,
      tutor_email: parent.email,
      tutor_telefono: '3624011005',
      usuario_padre_id: parent.id,
      estado: 'activo',
    });
    await ensureDemoChildEnrollment(childId);
  }

  async function ensureDemoChildEnrollment(childId) {
    const child = await get('SELECT nivel FROM alumnos WHERE id = ?', [childId]);
    const existingSport = await get(
      "SELECT id FROM inscripciones WHERE alumno_id = ? AND tipo = 'deporte' LIMIT 1",
      [childId],
    );
    const group = await get('SELECT id FROM grupos_deporte WHERE nivel = ? ORDER BY id LIMIT 1', [
      child?.nivel,
    ]);
    if (group && !existingSport) {
      await insert('inscripciones', {
        alumno_id: childId,
        tipo: 'deporte',
        grupo_deporte_id: group.id,
        recorrido_id: null,
      });
    }
  }

  async function seedNiveles() {
    if (!(await tableIsEmpty('niveles_educativos'))) return;
    await insertMany(
      'niveles_educativos',
      ['nombre', 'descripcion', 'etiqueta'],
      [
        [
          'Nivel Inicial',
          'Educacion temprana basada en el juego, la exploracion y el desarrollo socioemocional.',
          'Salas de 3, 4 y 5',
        ],
        [
          'Nivel Primario',
          'Formacion integral para construir habitos de estudio, pensamiento critico y valores comunitarios.',
          '1ro a 7mo grado',
        ],
        [
          'Nivel Secundario',
          'Preparacion academica con orientacion vocacional, tecnologia e idiomas.',
          'Ciclo basico y orientado',
        ],
      ],
    );
  }

  async function seedServicios() {
    if (!(await tableIsEmpty('servicios'))) return;
    await insertMany(
      'servicios',
      ['nombre', 'descripcion', 'tipo', 'disponible', 'icono'],
      [
        [
          'Comedor',
          'Menu escolar planificado para acompanar la jornada extendida.',
          'bienestar',
          1,
          'utensils',
        ],
        [
          'Enfermeria',
          'Atencion primaria y seguimiento de situaciones de salud dentro de la institucion.',
          'salud',
          1,
          'heart-pulse',
        ],
        [
          'Idiomas',
          'Ingles y talleres complementarios para todos los niveles.',
          'academico',
          1,
          'languages',
        ],
        [
          'Deportes',
          'Actividades deportivas, torneos y acompanamiento fisico saludable.',
          'deportivo',
          1,
          'trophy',
        ],
        [
          'Transporte',
          'Servicio de traslado planificado para familias de Resistencia y alrededores.',
          'logistica',
          1,
          'bus',
        ],
      ],
    );
  }

  async function seedInstalaciones() {
    if (!(await tableIsEmpty('instalaciones'))) return;
    await insertMany(
      'instalaciones',
      ['nombre', 'descripcion', 'tipo', 'disponible', 'imagen_url'],
      [
        [
          'Aulas equipadas',
          'Espacios luminosos con mobiliario flexible y recursos digitales.',
          'academica',
          1,
          'https://images.unsplash.com/photo-1698993081947-8a3654303904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
        ],
        [
          'Laboratorios',
          'Ambientes preparados para ciencias, tecnologia y experiencias practicas.',
          'academica',
          1,
          'https://images.unsplash.com/photo-1758270704787-615782711641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
        ],
        [
          'Gimnasio',
          'Area cubierta para educacion fisica, encuentros y actividades institucionales.',
          'deportiva',
          1,
          'https://images.unsplash.com/photo-1759641801965-a15a53b877b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
        ],
        [
          'Pileta',
          'Espacio recreativo y deportivo para propuestas acuaticas supervisadas.',
          'deportiva',
          1,
          'https://images.unsplash.com/photo-1572331165267-854da2b10ccc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
        ],
        [
          'Canchas',
          'Sectores exteriores para deportes, recreos y actividades grupales.',
          'deportiva',
          1,
          'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
        ],
      ],
    );
  }

  async function seedNoticias() {
    if (!(await tableIsEmpty('noticias'))) return;
    await insertMany(
      'noticias',
      ['titulo', 'descripcion', 'contenido', 'fecha_publicacion', 'tipo', 'visible', 'imagen_url'],
      [
        [
          'Proceso de inscripcion 2027 abierto',
          'Ya se encuentra disponible la solicitud de inscripcion para familias interesadas.',
          'Las familias pueden completar el formulario web y esperar el contacto administrativo para avanzar con la entrevista inicial.',
          '2026-05-01',
          'Inscripcion',
          1,
          'https://images.unsplash.com/photo-1758270705639-9727f350f026?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
        ],
        [
          'Recorrida por las nuevas instalaciones',
          'Invitamos a conocer los espacios proyectados para aulas, laboratorios y deporte.',
          'La recorrida institucional permite presentar el campus educativo y responder consultas de las familias.',
          '2026-04-15',
          'Institucional',
          1,
          'https://images.unsplash.com/photo-1774386897531-1f5d7741409c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
        ],
        [
          'Presentacion del proyecto pedagogico',
          'La institucion presento su propuesta centrada en excelencia academica e innovacion.',
          'El proyecto articula acompanamiento, tecnologia, idiomas, deportes y actividades escolares.',
          '2026-04-10',
          'Academica',
          1,
          'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
        ],
      ],
    );
  }

  async function seedOpiniones() {
    if (!(await tableIsEmpty('opiniones_web'))) return;
    await insertMany(
      'opiniones_web',
      ['autor_anonimo', 'comentario', 'estado_moderacion', 'visible'],
      [
        [
          'Madre de familia',
          'La propuesta institucional transmite organizacion, cercania y una mirada integral sobre cada estudiante.',
          'visible',
          1,
        ],
        [
          'Tutor interesado',
          'Nos gusto que el proyecto combine formacion academica, deportes, idiomas y acompanamiento personalizado.',
          'visible',
          1,
        ],
        [
          'Docente postulante',
          'Se percibe un espacio de trabajo serio, colaborativo y con oportunidades de crecimiento profesional.',
          'pendiente',
          0,
        ],
      ],
    );
  }

  async function seedDocentes() {
    if (!(await tableIsEmpty('docentes'))) return;
    await insertMany(
      'docentes',
      ['nombre', 'apellido', 'legajo', 'dni', 'email', 'telefono', 'especialidad', 'estado'],
      [
        [
          'Laura',
          'Benitez',
          'D-0001',
          '30111222',
          'laura.benitez@educar.com',
          '3624001001',
          'Nivel Inicial',
          'activo',
        ],
        [
          'Martin',
          'Aguirre',
          'D-0002',
          '28999888',
          'martin.aguirre@educar.com',
          '3624001002',
          'Nivel Primario',
          'activo',
        ],
        [
          'Carolina',
          'Molina',
          'D-0003',
          '32777444',
          'carolina.molina@educar.com',
          '3624001003',
          'Ciencias',
          'activo',
        ],
      ],
    );
  }

  async function seedMaterias() {
    if (!(await tableIsEmpty('materias'))) return;
    await insertMany(
      'materias',
      ['nombre', 'descripcion'],
      [
        ['Matematica', 'Razonamiento logico, algebra y geometria.'],
        ['Lengua y Literatura', 'Comprension lectora y produccion de textos.'],
        ['Ciencias Naturales', 'Biologia, fisica y quimica.'],
        ['Ciencias Sociales', 'Historia, geografia y formacion ciudadana.'],
        ['Ingles', 'Idioma extranjero.'],
        ['Educacion Fisica', 'Actividad fisica y deportes.'],
        ['Ambiente natural y social', 'Exploracion del entorno para nivel inicial.'],
      ],
    );
  }

  async function seedDeportes() {
    if (!(await tableIsEmpty('deportes'))) return;
    await insertMany(
      'deportes',
      ['nombre', 'descripcion', 'profesor_id'],
      [
        ['Futbol', 'Entrenamiento y competencias de futbol.', 3],
        ['Voley', 'Iniciacion y tecnica de voley.', 2],
        ['Natacion', 'Natacion recreativa y deportiva en pileta cubierta.', 1],
        ['Atletismo', 'Pruebas de pista y campo.', 3],
      ],
    );
  }

  async function seedGruposDeporte() {
    if (!(await tableIsEmpty('grupos_deporte'))) return;
    await insertMany(
      'grupos_deporte',
      ['deporte_id', 'nivel', 'dia', 'horario', 'profesor_id'],
      [
        [1, 'Primario', 'Lunes', '10:00 - 11:30', 3],
        [1, 'Secundario', 'Martes', '14:00 - 15:30', 3],
        [2, 'Secundario', 'Miercoles', '15:00 - 16:30', 2],
        [3, 'Inicial', 'Jueves', '09:00 - 10:00', 1],
        [4, 'Secundario', 'Viernes', '14:00 - 15:30', 3],
      ],
    );
  }

  async function seedRecorridos() {
    if (!(await tableIsEmpty('recorridos_transporte'))) return;
    await insertMany(
      'recorridos_transporte',
      ['nombre', 'descripcion', 'horario', 'zona'],
      [
        ['Recorrido 1 - Norte', 'Barrios de la zona norte de Resistencia.', '07:00', 'Norte'],
        ['Recorrido 2 - Sur', 'Barrios de la zona sur de Resistencia.', '07:10', 'Sur'],
        ['Recorrido 3 - Este', 'Barrios de la zona este de Resistencia.', '07:20', 'Este'],
        ['Recorrido 4 - Oeste', 'Barrios de la zona oeste y alrededores.', '07:30', 'Oeste'],
      ],
    );
  }

  async function seedInscripciones() {
    if (!(await tableIsEmpty('inscripciones'))) return;
    await insertMany(
      'inscripciones',
      ['alumno_id', 'tipo', 'grupo_deporte_id', 'recorrido_id'],
      [
        [2, 'deporte', 1, null],
        [2, 'transporte', null, 1],
        [3, 'deporte', 2, null],
        [3, 'deporte', 3, null],
        [1, 'comedor', null, null],
      ],
    );
  }

  async function seedCursos() {
    if (!(await tableIsEmpty('cursos'))) return;
    await insertMany(
      'cursos',
      ['nivel', 'anio', 'division', 'turno', 'descripcion'],
      [
        ['Inicial', 'Sala de 5', 'A', 'Manana', 'Grupo de preparacion para primer grado.'],
        [
          'Primario',
          '4to',
          'A',
          'Manana',
          'Curso de nivel primario con jornada extendida opcional.',
        ],
        ['Secundario', '1ro', 'A', 'Tarde', 'Primer ano del ciclo basico secundario.'],
      ],
    );
  }

  async function seedAlumnos() {
    if (!(await tableIsEmpty('alumnos'))) return;
    await insertMany(
      'alumnos',
      [
        'nombre',
        'apellido',
        'legajo',
        'dni',
        'fecha_nacimiento',
        'domicilio',
        'telefono',
        'email',
        'nivel',
        'curso',
        'division',
        'tutor_nombre',
        'tutor_email',
        'tutor_telefono',
        'estado',
      ],
      [
        [
          'Sofia',
          'Ramirez',
          'A-2027-001',
          '53111222',
          '2021-08-12',
          'Av. Sarmiento 1234',
          '3624011101',
          'sofia.ramirez@educar.com',
          'Inicial',
          'Sala de 5',
          'A',
          'Mariana Ramirez',
          'mariana.demo@educar.com',
          '3624011001',
          'activo',
        ],
        [
          'Tomas',
          'Pereyra',
          'A-2027-002',
          '50122333',
          '2016-03-25',
          'Calle San Martin 456',
          '3624011102',
          'tomas.pereyra@educar.com',
          'Primario',
          '4to',
          'A',
          'Lucas Pereyra',
          'lucas.demo@educar.com',
          '3624011002',
          'activo',
        ],
        [
          'Valentina',
          'Gomez',
          'A-2027-003',
          '48133444',
          '2013-10-05',
          'Av. 9 de Julio 789',
          '3624011103',
          'valentina.gomez@educar.com',
          'Secundario',
          '1ro',
          'A',
          'Paula Gomez',
          'paula.demo@educar.com',
          '3624011003',
          'activo',
        ],
      ],
    );
  }

  async function seedAsignaciones() {
    if (!(await tableIsEmpty('asignaciones_docentes'))) return;
    await insertMany(
      'asignaciones_docentes',
      ['docente_id', 'curso_id', 'materia', 'dia', 'horario'],
      [
        [1, 1, 'Ambiente natural y social', 'Lunes', '08:00 - 10:00'],
        [2, 2, 'Matematica', 'Martes', '09:00 - 11:00'],
        [3, 3, 'Ciencias Naturales', 'Miercoles', '14:00 - 16:00'],
      ],
    );
  }

  async function seedUsuarios() {
    await insertMany(
      'usuarios_acceso',
      ['nombre', 'nombre_usuario', 'email', 'password_demo', 'rol', 'estado', 'referencia_id'],
      [
        [
          'Administrador Demo',
          'admin_educar',
          'admin@educar.com',
          'admin123',
          'admin',
          'activo',
          null,
        ],
        [
          'Docente Demo',
          'docente_educar',
          'docente@educar.com',
          'docente123',
          'docente',
          'activo',
          1,
        ],
        ['Padre Demo', 'padre_educar', 'padre@educar.com', 'padre123', 'padre', 'activo', null],
        [
          'Mariana Ramirez',
          'padre_mariana',
          'mariana.demo@educar.com',
          'padre123',
          'padre',
          'activo',
          null,
        ],
        [
          'Lucas Pereyra',
          'padre_lucas',
          'lucas.demo@educar.com',
          'padre123',
          'padre',
          'activo',
          null,
        ],
        [
          'Paula Gomez',
          'padre_paula',
          'paula.demo@educar.com',
          'padre123',
          'padre',
          'activo',
          null,
        ],
        ['Alumno Demo', 'alumno_educar', 'alumno@educar.com', 'alumno123', 'alumno', 'activo', 1],
        [
          'Personal Demo',
          'personal_educar',
          'personal@educar.com',
          'personal123',
          'personal',
          'activo',
          null,
        ],
      ],
      { ignoreConflict: 'email' },
    );
  }

  async function seedActividades() {
    if (!(await tableIsEmpty('actividades_escolares'))) return;
    await insertMany(
      'actividades_escolares',
      ['titulo', 'descripcion', 'nivel', 'fecha', 'visible'],
      [
        [
          'Jornada de bienvenida familiar',
          'Encuentro institucional para presentar equipos, espacios y modalidad de trabajo.',
          'Todos los niveles',
          '2027-03-04',
          1,
        ],
        [
          'Taller de lectura compartida',
          'Actividad de promocion lectora para estudiantes de nivel primario.',
          'Primario',
          '2027-04-12',
          1,
        ],
        [
          'Muestra de ciencias y tecnologia',
          'Presentacion de experiencias de laboratorio y proyectos interdisciplinarios.',
          'Secundario',
          '2027-06-18',
          1,
        ],
      ],
    );
  }

  async function seedGaleria() {
    if (!(await tableIsEmpty('galeria_imagenes'))) return;
    await insertMany(
      'galeria_imagenes',
      ['titulo', 'descripcion', 'url_imagen', 'categoria', 'visible'],
      [
        [
          'Aulas equipadas',
          'Espacios flexibles para el aprendizaje.',
          'https://images.unsplash.com/photo-1698993081947-8a3654303904?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
          'Instalaciones',
          1,
        ],
        [
          'Laboratorio escolar',
          'Practicas de ciencias y tecnologia.',
          'https://images.unsplash.com/photo-1758270704787-615782711641?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
          'Academico',
          1,
        ],
        [
          'Actividad deportiva',
          'Propuestas fisicas y recreativas.',
          'https://images.unsplash.com/photo-1717689410618-89631f1ad3a3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
          'Deportes',
          1,
        ],
        [
          'Campus educativo',
          'Predio amplio en las afueras de Resistencia.',
          'https://images.unsplash.com/photo-1586144131462-fa2a2b6d070c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=900',
          'Institucional',
          1,
        ],
      ],
    );
  }

  return seedDatabase;
}
