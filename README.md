# Educar para Transformar

Sistema de gestión del centro educativo: sitio institucional y portales de Administración, Docentes y Familias. Se incluyen consultas del estudiante para evaluaciones, entregas y devoluciones.

React + TypeScript + Vite; Express con núcleo de negocio TypeScript; PostgreSQL/Supabase. Todo acceso a datos pasa por la API. Las sesiones usan JWT en cookies HttpOnly y las contraseñas se guardan con BCrypt.

## Desarrollo

Se requiere Node 22 y npm. Crear `.env` a partir de `.env.example`, configurar `DATABASE_URL` y generar un `JWT_SECRET` estable de al menos 32 caracteres. No versionar credenciales.

```powershell
npm ci
npm run db:upgrade
npm run server
```

En otra terminal:

```powershell
npm run dev
```

Abrir `http://localhost:5173`. Vite redirige `/api` al backend del puerto 3001. Después de compilar, `npm start` también sirve la web completa desde `http://localhost:3001`.

## Datos y acceso

Las migraciones son aditivas y versionadas. Antes de migrar una base existente:

```powershell
npm run db:backup
npm run db:upgrade
```

Para una base vacía, definir temporalmente `ADMIN_EMAIL` y `ADMIN_PASSWORD` en el entorno y ejecutar `npm run admin:create`. La contraseña debe tener de 10 a 72 bytes. Quitar después `ADMIN_PASSWORD` del entorno. Desde administración se crean niveles, cursos, docentes, materias y cuentas vinculadas a sus legajos.

Las familias pueden registrarse con un alumno nuevo. Para asociar un alumno ya existente, administración vincula el legajo a la cuenta familiar; no se permite reclamar un DNI registrado desde el formulario público.

`SEED_DEMO=true` es solo para una base de demostración aislada. PostgreSQL es obligatorio en producción. SQLite queda disponible para desarrollo y pruebas; no se usa como alternativa silenciosa si falla Supabase.

Los cursos recuperados de legajos históricos pueden tener turno **A confirmar** y cupo **0**: revisar esos valores desde el panel antes de abrir matrículas.

## Módulos

- Alumnos, docentes, legajos, usuarios y permisos.
- Niveles, cursos, materias, asignaciones y horarios.
- Deportes y grupos por nivel, cupo y profesor.
- Matrícula por ciclo; deportes, cuatro recorridos y comedor.
- Arancel mensual estimado con importes configurables.
- Evaluaciones, enlaces a entregas, calificaciones y devolución histórica.
- Asistencias, notificaciones y auditoría.
- Nueve reportes con búsqueda, CSV e impresión/PDF.
- Noticias, actividades, instalaciones, galería, opiniones moderadas, solicitudes, contacto y postulaciones.

## Correo

Configurar `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM` y, si corresponde, `SMTP_USER` y `SMTP_PASSWORD`. El emisor debe estar habilitado por el proveedor. No se muestran fallos SMTP como inscripciones fallidas: el evento se guarda junto con la inscripción y se reintenta desde la cola.

El servidor persistente procesa la cola cada 30 segundos. En Vercel las escrituras confirmadas invocan el envío con `waitUntil`. Para recuperar pendientes incluso sin tráfico, programar además `npm run mail:deliver` en un worker o scheduler. Administración puede consultar el estado y ejecutar `POST /api/admin/notificaciones/reintentar` con su sesión.

## Pruebas

```powershell
npm run build
npm test
npm run test:postgres
npm run test:e2e
```

- `npm test`: integración con SQLite temporal; no lee `.env` ni toca Supabase.
- `test:postgres`: misma suite con PostgreSQL nativo aislado; comprueba además cifrado y recuperación en otra base vacía. Usa el puerto local 15439 y guarda archivos en `outputs/`.
- `test:e2e`: flujos completos en Edge mediante Playwright, con una base temporal independiente. Usa el puerto 3101. Para otro navegador, modificar `channel` en `playwright.config.ts` o instalar Chromium con Playwright.
- Capturas e informe HTML: `outputs/`. Estos archivos y todos los respaldos están excluidos de Git y Vercel.

## Respaldo y recuperación

`npm run db:backup` guarda un snapshot transaccional de las tablas de la aplicación. Si existe `BACKUP_KEY` —32 bytes en base64— lo cifra con AES-256-GCM. Guardar la clave separada del archivo.

El workflow `.github/workflows/respaldo.yml` programa un respaldo diario a las 05:00 UTC (02:00 en Argentina). Requiere los secrets de GitHub `DATABASE_URL` y `BACKUP_KEY` y estar en la rama predeterminada. Conserva los artefactos cifrados durante 14 días; configurar almacenamiento adicional según la política institucional.

Restaurar en una base nueva, configurada en `DATABASE_URL`:

```powershell
npm run db:restore -- --file=outputs/backups/ARCHIVO.enc
```

La restauración rechaza bases con datos. `--replace` autoriza explícitamente reemplazarlos y debe usarse solo tras respaldar el destino y detener las escrituras. Verificar login, reportes y matrículas antes de habilitar tráfico.

## Vercel

El proyecto conserva su configuración de Vercel y el endpoint `/api`. Configurar por entorno `DATABASE_URL` y `JWT_SECRET`; para correo, las variables SMTP. `FRONTEND_URL` solo es necesario cuando frontend y API usan orígenes distintos.

Las contraseñas históricas se migran a hashes y se vacía el campo demo. El código anterior de login queda incompatible con esa migración: publicar el backend nuevo como parte del mismo cambio. Las cookies de producción requieren HTTPS.

La publicación y la transferencia de credenciales a un nuevo entorno necesitan autorización del titular. El repositorio no contiene las credenciales.

Ver [cumplimiento del plan](docs/cumplimiento-plan.md) para la trazabilidad de requisitos y los puntos de operación pendientes de configuración.
