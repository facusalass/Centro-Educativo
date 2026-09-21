# Educar para Transformar

Proyecto web institucional para el centro educativo privado **Educar para Transformar**, previsto para iniciar actividades en marzo de 2027 en las afueras de Resistencia, Chaco.

El proyecto esta pensado como entrega clara y explicable para **Metodologia de Sistemas I**: landing institucional, backend funcional, base SQL local, datos de prueba, formularios y panel interno simple.

## Stack

- Frontend: React + TypeScript + Vite.
- Estilos: CSS comun responsive en `src/styles/global.css`.
- Backend: Node.js + Express.
- Base de datos: Postgres persistente en produccion via `DATABASE_URL`; SQLite queda solo como fallback de desarrollo y como origen para la migracion.
- Iconos: `lucide-react`.

## Instalacion

```bash
npm install
```

## Ejecutar backend

```bash
npm run server
```

API:

```txt
http://localhost:3001/api
```

Si existe `DATABASE_URL`, el backend usa Postgres. Si no existe, usa SQLite local en:

```txt
database/educar_transformar.sqlite
```

En Vercel, `DATABASE_URL` es obligatoria para impedir que la aplicacion guarde datos en el sistema de archivos temporal.

## Ejecutar frontend

En otra terminal:

```bash
npm run dev
```

Sitio:

```txt
http://localhost:5173
```

## Rutas frontend

```txt
/       Landing institucional
/login  Login demo por roles
/admin  Panel de gestion interno
```

## Usuarios demo

```txt
admin@educar.com    / admin123
docente@educar.com  / docente123
padre@educar.com    / padre123
alumno@educar.com   / alumno123
personal@educar.com / personal123
```

## Modulos representados

- Alumnos
- Docentes
- Academico: cursos y asignaciones docentes
- Servicios
- Instalaciones
- Comunicacion: noticias, actividades, galeria y contacto
- Solicitud de inscripcion
- Opiniones web
- Postulaciones de empleo
- Acceso basico por roles
- Panel interno simple

## Base de datos

Al iniciar el backend se crean o actualizan automaticamente las tablas y datos demo. En Vercel debe configurarse una base Postgres persistente mediante:

```txt
DATABASE_URL
```

La opcion mas directa es instalar **Neon** desde Vercel Marketplace, crear una base y conectarla al proyecto `centroeducativo-tp` para Production, Preview y Development. La integracion agrega `DATABASE_URL` automaticamente.

Para copiar los datos de la base SQLite actual:

```bash
npx vercel env pull .env.local
npm run db:migrate
```

El importador exige que Postgres este vacio. Si la API ya creo los datos demo y queres reemplazarlos por el contenido exacto de SQLite:

```bash
npm run db:migrate -- --replace
```

Tablas principales:

- niveles_educativos
- alumnos
- docentes
- cursos
- asignaciones_docentes
- instalaciones
- servicios
- alumnos_servicios
- asistencias_diarias
- evaluaciones
- calificaciones_alumnos
- usuarios_acceso
- opiniones_web
- solicitudes_inscripcion
- postulaciones_empleo
- noticias
- actividades_escolares
- galeria_imagenes
- contacto_mensajes

## Endpoints principales

```txt
GET  /api/health
GET  /api/niveles

GET  /api/alumnos
GET  /api/alumnos/:id
POST /api/alumnos
PUT  /api/alumnos/:id
DELETE /api/alumnos/:id

GET  /api/docentes
GET  /api/docentes/:id
POST /api/docentes
PUT  /api/docentes/:id
DELETE /api/docentes/:id

GET  /api/cursos
POST /api/cursos
PUT  /api/cursos/:id
DELETE /api/cursos/:id

GET  /api/asignaciones-docentes
POST /api/asignaciones-docentes
PUT  /api/asignaciones-docentes/:id
DELETE /api/asignaciones-docentes/:id

GET  /api/servicios
POST /api/servicios
PUT  /api/servicios/:id
DELETE /api/servicios/:id

GET  /api/instalaciones
POST /api/instalaciones
PUT  /api/instalaciones/:id
DELETE /api/instalaciones/:id

GET  /api/noticias
GET  /api/noticias/:id
POST /api/noticias
PUT  /api/noticias/:id
DELETE /api/noticias/:id

GET  /api/opiniones
POST /api/opiniones
PUT  /api/opiniones/:id/moderar

GET  /api/solicitudes-inscripcion
POST /api/solicitudes-inscripcion
PUT  /api/solicitudes-inscripcion/:id/estado

GET  /api/postulaciones
POST /api/postulaciones
PUT  /api/postulaciones/:id/estado

GET  /api/usuarios
POST /api/usuarios
PUT  /api/usuarios/:id
POST /api/login-demo

GET  /api/actividades
POST /api/actividades
PUT  /api/actividades/:id
DELETE /api/actividades/:id

GET  /api/galeria
POST /api/galeria
PUT  /api/galeria/:id
DELETE /api/galeria/:id

POST /api/contacto
GET  /api/contacto
```

## Validacion

Comando de build:

```bash
npm run build
```

El backend valida campos obligatorios y formato de email en formularios principales. El frontend muestra mensajes de carga, exito y error en inscripcion, opinion, postulacion y contacto.
