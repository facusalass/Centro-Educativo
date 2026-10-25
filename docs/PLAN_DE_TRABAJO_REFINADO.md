# **DESCRIPCIÓN DEL PROYECTO Y PLAN DE TRABAJO — SISTEMA INTEGRAL DE GESTIÓN "EDUCAR PARA TRANSFORMAR"**

---

## **1. Planteamiento del Problema y Contexto del Proyecto**

### **1.1 Contexto Institucional**

El centro educativo privado **"Educar para Transformar"**, una institución educativa de alta calidad ubicada en las afueras de la ciudad de Resistencia (Chaco, Argentina), iniciará sus actividades académicas y administrativas en **marzo de 2027**. La institución ofrece una propuesta pedagógica con **jornada extendida (horario de jornada completa)** en tres niveles educativos obligatorios:

* **Nivel Inicial (Jardín de Infantes)**
* **Nivel Primario**
* **Nivel Secundario**

El plan de estudios integra formación intensiva en **tres idiomas** (**inglés, portugués y francés**), un **Servicio de Orientación y Apoyo Estudiantil** continuo, y un amplio programa deportivo extracurricular compuesto por **ocho disciplinas deportivas**:

1. **Atletismo**
2. **Natación**
3. **Fútbol**
4. **Artes Marciales**
5. **Vóley**
6. **Danza**
7. **Básquet**
8. **Ajedrez**

Para sostener este modelo educativo integral, el campus cuenta con instalaciones e infraestructura diseñadas específicamente:

* **Infraestructura Deportiva:** Piscina climatizada, canchas de fútbol, pista de atletismo y gimnasio cubierto.
* **Infraestructura Académica:** Laboratorios especializados de Informática, Física y Química.
* **Instalaciones de Apoyo y Bienestar:** Comedor escolar (*Cafetería / Comedor*), enfermería y un **Servicio de Transporte Escolar (Micros / Combi)** organizado en **cuatro (4) rutas predefinidas**.

### **1.2 Diagnóstico del Problema y Continuidad con el Trabajo Previo**

En la primera etapa de digitalización institucional, se desarrolló y desplegó el **Sitio Web Institucional Público** de *"Educar para Transformar"* (alojado en Vercel y gestionado mediante GitHub) con el objetivo de comunicar a la comunidad los niveles educativos, las instalaciones, los talleres, la identidad institucional y los canales públicos de admisión y contacto.

Sin embargo, ante la inminente apertura en **marzo de 2027**, la institución se encuentra en pleno proceso de organización administrativa y académica y carece de una herramienta informática integrada que centralice las operaciones transaccionales internas y el control de gestión. Mantener una administración manual o basada en planillas aisladas expondría al Centro Educativo a severos riesgos operativos:

1. **Fragmentación e Inconsistencia de Datos:** Dificultad para mantener actualizados y sincronizados los legajos de alumnos y docentes (número de legajo, DNI, datos de contacto, asignaciones académicas y estados de actividad) entre la Dirección, la Secretaría y el cuerpo docente.
2. **Imposibilidad de Aplicar Reglas de Negocio Críticas de Forma Automática:** La verificación manual no permite garantizar en tiempo real reglas institucionales estrictas, tales como asegurar que cada alumno pertenezca a un único curso y nivel educativo, limitar la participación extracurricular a un **máximo de dos (2) deportes simultáneos por alumno**, prevenir **superposiciones horarias** entre las actividades deportivas seleccionadas y bloquear **inscripciones duplicadas** en cursos, deportes, rutas de transporte o comedor.
3. **Falta de Información Oportuna para la Toma de Decisiones:** Demoras y errores de consolidación manual al elaborar las nóminas cruzadas y los reportes operativos requeridos por la Dirección para la asignación de recursos, planificación docente y logística de servicios.
4. **Ausencia de Canales de Autogestión y Comunicación con las Familias:** Falta de un canal digital ágil y seguro para que los padres o tutores consulten los docentes y actividades de sus hijos, realicen inscripciones académicas y de servicios en línea, y reciban confirmaciones inmediatas ante novedades o cambios.

### **1.3 Solución Propuesta y Alcance del Sistema**

Continuando con el proceso de automatización institucional, la Dirección considera indispensable implementar un **Sistema Web Integral de Gestión** que unifique la información académica, deportiva y de servicios complementarios en una única base de datos centralizada, garantizando su actualización, consistencia transaccional y un control de acceso estricto basado en roles (**Administrador, Docente, Padre/Tutor y Alumno**).

En esta etapa del proyecto, el sistema se estructura en torno a **tres módulos principales** definidos por la institución, complementados con capacidades de autogestión para las familias:

* **Módulo de Alumnos:** Centraliza la gestión y consulta de los legajos estudiantiles (Legajo, DNI, nombre, apellido, fecha de nacimiento, dirección, teléfono, correo electrónico, nivel educativo, curso y estado), las inscripciones académicas, la participación en deportes extracurriculares, el uso de servicios complementarios (rutas de transporte y comedor) y las interfaces de consulta para alumnos y padres/tutores.
* **Módulo de Docentes:** Administra los legajos del personal docente (Legajo, DNI, nombre, apellido, especialidad, correo electrónico, teléfono y estado), la asignación de materias en distintos cursos y niveles educativos, la supervisión de grupos deportivos y la autogestión de consultas por parte de cada docente autenticado sobre sus propios cursos, materias, nóminas y horarios.
* **Módulo de Administración:** Permite a la Dirección y Secretaría configurar y mantener las entidades maestras del sistema (niveles educativos, cursos, materias, deportes, horarios, rutas de transporte, servicio de comedor, usuarios y permisos por rol), supervisar inscripciones y generar los **nueve (9) reportes institucionales de gestión** para el soporte a la toma de decisiones.

### **1.4 Objetivos del Proyecto**

* **Objetivo General:** Desarrollar y desplegar un sistema de gestión web que permita la administración integrada de la información académica, deportiva y de servicios de los estudiantes, facilitando el trabajo del personal administrativo, los docentes y los padres/tutores, y asegurando que la información se mantenga actualizada, consistente y accesible según los permisos de cada usuario.
* **Objetivo Específico 1 — Implementación Funcional Integral:** Desarrollar los módulos de Administración, Docentes, Alumnos, Inscripciones y Servicios, Notificaciones y Reportes, cubriendo la totalidad de los flujos operativos obligatorios y los 9 reportes ejecutivos definidos por la Dirección.
* **Objetivo Específico 2 — Integridad Transaccional y Cumplimiento de Reglas de Negocio:** Garantizar la validación automática del 100% de las reglas institucionales críticas: pertenencia de cada alumno a un único curso y nivel educativo, límite máximo de dos deportes simultáneos, detección automática de superposiciones horarias, restricción del transporte a cuatro rutas predefinidas y prevención de inscripciones duplicadas.
* **Objetivo Específico 3 — Seguridad, Rendimiento y Disponibilidad:** Asegurar un control de acceso estricto basado en roles (restringiendo a los docentes a sus cursos asignados y a los padres/tutores exclusivamente a la información de sus propios hijos), tiempos de respuesta inferiores a 1,5 segundos en operaciones transaccionales estándar y disponibilidad continua durante todo el ciclo lectivo.

---

## **2. Especificación de Requisitos (Funcionales y No Funcionales)**

Aplicando los criterios de ingeniería de requisitos (**precisión, atomicidad, verificabilidad, no ambigüedad, priorización y trazabilidad bidireccional hacia las reglas de negocio**), se especifican a continuación los Requisitos Funcionales (`RF`) y los Requisitos No Funcionales (`RNF`) del sistema.

### **2.1 Requisitos Funcionales (`RF`)**

#### **A. Módulo de Administración y Seguridad**

* **RF-01 — Gestión de Accesos, Autenticación y Permisos por Rol (RBAC)** *(Prioridad: Obligatoria)*
  * **RF-01.1:** El sistema debe permitir al Administrador crear, consultar, modificar y dar de baja lógica cuentas de usuario, asignando a cada cuenta uno o más roles del sistema (`Administrador`, `Docente`, `Padre/Tutor`, `Alumno`).
  * **RF-01.2:** El sistema debe autenticar a los usuarios mediante correo electrónico/nombre de usuario y contraseña, validando sus credenciales y emitiendo un token de sesión firmado (JWT) con la identidad y los permisos activos del usuario.
  * **RF-01.3:** El sistema debe permitir al Administrador asociar una cuenta de usuario `Padre/Tutor` con uno o varios registros de `Alumno` (vínculo parental), garantizando que el tutor únicamente pueda consultar y gestionar datos de los hijos explícitamente asociados a su cuenta.
  * **RF-01.4:** El sistema debe aplicar control de acceso basado en roles (RBAC) tanto en las vistas del cliente como en los endpoints del backend, rechazando cualquier petición no autorizada con código HTTP `401/403`.

* **RF-02 — Alta de Entidades Académicas y Extracurriculares de Referencia** *(Prioridad: Obligatoria)*
  * **RF-02.1:** El sistema debe permitir al Administrador registrar **Niveles Educativos** (*Inicial*, *Primario*, *Secundario*) con su respectivo código, denominación y parámetros de jornada extendida.
  * **RF-02.2:** El sistema debe permitir al Administrador registrar **Cursos / Grados**, exigiendo que cada curso quede estrictamente asociado a un único Nivel Educativo, un cupo máximo de alumnos y un ciclo lectivo.
  * **RF-02.3:** El sistema debe permitir al Administrador registrar **Materias** (incluyendo asignaturas curriculares e idiomas: Inglés, Portugués y Francés) y vincularlas con los cursos en los que se dictan.
  * **RF-02.4:** El sistema debe permitir al Administrador registrar **Deportes** (Atletismo, Natación, Fútbol, Artes Marciales, Vóley, Danza, Básquet y Ajedrez) junto con sus parámetros operativos base.

* **RF-03 — Baja / Desactivación de Entidades Académicas y Extracurriculares de Referencia** *(Prioridad: Obligatoria)*
  * **RF-03.1:** El sistema debe permitir al Administrador dar de baja lógica o eliminar Niveles Educativos, Cursos, Materias y Deportes registrados.
  * **RF-03.2:** Antes de ejecutar cualquier baja o eliminación, el sistema debe verificar la integridad referencial (comprobando si existen alumnos inscriptos activos, docentes asignados u horarios vigentes) y bloquear bajas destructivas que generen registros huérfanos.

* **RF-04 — Modificación de Entidades Académicas y Extracurriculares de Referencia** *(Prioridad: Obligatoria)*
  * **RF-04.1:** El sistema debe permitir al Administrador editar y actualizar los atributos de Niveles Educativos, Cursos, Materias y Deportes existentes.
  * **RF-04.2:** El sistema debe validar que las modificaciones sobre entidades de referencia no vulneren restricciones de inscripciones activas ni generen inconsistencias horarias.

* **RF-05 — Gestión de Horarios Académicos y Deportivos y Control de Superposiciones** *(Prioridad: Obligatoria)*
  * **RF-05.1:** El sistema debe permitir al Administrador definir y actualizar los horarios (día de la semana, hora de inicio, hora de fin e instalación/aula) tanto para las materias académicas de cada curso como para los grupos de actividades deportivas.
  * **RF-05.2:** Al configurar horarios o procesar inscripciones, el sistema debe ejecutar automáticamente una validación de intersección de intervalos temporales (`Inicio_A < Fin_B AND Inicio_B < Fin_A` en el mismo día) para impedir superposiciones horarias en un mismo curso, en un mismo docente o entre las actividades deportivas seleccionadas por un mismo alumno.

* **RF-06 — Generación de Reportes Institucionales de Gestión** *(Prioridad: Obligatoria)*
  El sistema debe permitir al Administrador generar, filtrar en pantalla y exportar (PDF/CSV) los **nueve (9) reportes de gestión** definidos por la Dirección para el soporte a la toma de decisiones:
  * **RF-06.1 — Reporte por Alumno:** Muestra para un alumno seleccionado el curso al que pertenece, las materias que cursa, los docentes asignados a cada materia, las actividades deportivas en las que participa, los horarios de dichas actividades deportivas, la utilización del servicio de transporte (y ruta asignada) y la utilización del servicio de comedor.
  * **RF-06.2 — Reporte por Docente:** Muestra para un docente seleccionado los cursos asignados por nivel educativo y los horarios correspondientes a cada curso/materia.
  * **RF-06.3 — Listado de Alumnos por Curso:** Muestra Nivel Educativo, Curso, Legajo, Apellido y Nombre de cada alumno.
  * **RF-06.4 — Listado de Alumnos por Materia:** Muestra Nivel Educativo, Curso, Materia, Docente asignado, Alumno (Apellido y Nombre) y Legajo.
  * **RF-06.5 — Listado de Docentes por Nivel Educativo:** Muestra Nivel Educativo, Docente, Materias asignadas y Cursos en los que dicta clases.
  * **RF-06.6 — Listado de Alumnos por Deporte en sus tres (3) variantes analíticas requeridas:**
    * **RF-06.6a (Listado General de Alumnos por Deporte):** Muestra Deporte, Alumno, Curso y Nivel Educativo.
    * **RF-06.6b (Listado de Alumnos por Deporte y Nivel Educativo):** Filtra y agrupa la nómina de alumnos inscriptos por Deporte y Nivel Educativo (*Inicial*, *Primario*, *Secundario*).
    * **RF-06.6c (Listado de Alumnos por Deporte, Nivel, Horario y Docente a Cargo):** Muestra Deporte, Nivel Educativo, Horario del grupo, Docente responsable a cargo y la nómina de Alumnos inscriptos.
  * **RF-06.7 — Listado de Alumnos por Ruta del Servicio de Transporte:** Muestra cada una de las 4 rutas del servicio de transporte y la nómina completa de alumnos inscriptos en cada ruta (Legajo, Apellido y Nombre, Nivel Educativo, Curso y domicilio registrado).

#### **B. Módulo Académico (Módulo de Alumnos y Módulo de Docentes)**

* **RF-07 — Gestión de Legajos de Alumnos y Docentes** *(Prioridad: Obligatoria)*
  * **RF-07.1 (Alta y Mantenimiento de Legajo de Alumno):** El sistema debe permitir al Administrador registrar, modificar y gestionar el estado lógico de los legajos de Alumnos, almacenando como mínimo los **once (11) campos obligatorios**:
    1. Número de Legajo — identificador institucional único
    2. DNI (Documento Nacional de Identidad) — único
    3. Nombre
    4. Apellido
    5. Fecha de nacimiento
    6. Dirección
    7. Teléfono
    8. Correo electrónico
    9. Nivel educativo
    10. Curso
    11. Estado del alumno (Activo, Inactivo)
  * **RF-07.2 (Restricción de Curso y Nivel Único por Alumno):** El sistema debe validar obligatoriamente que cada alumno pertenezca a **exactamente un (1) Curso** y, a través de este, a **un único Nivel Educativo** vigente, determinando a partir de dicho curso el conjunto de materias que cursa.
  * **RF-07.3 (Alta y Mantenimiento de Legajo de Docente):** El sistema debe permitir al Administrador registrar, modificar y gestionar el estado lógico de los legajos de Docentes, almacenando como mínimo los **ocho (8) campos obligatorios**:
    1. Número de Legajo — identificador institucional único
    2. DNI (Documento Nacional de Identidad) — único
    3. Nombre
    4. Apellido
    5. Especialidad
    6. Correo electrónico
    7. Teléfono
    8. Estado (Activo / Inactivo)
  * **RF-07.4 (Consulta Multicriterio de Legajos):** El sistema debe permitir buscar y consultar legajos de alumnos y docentes por Número de Legajo, DNI, Apellido, Nivel Educativo, Curso o Estado.

* **RF-08 — Asignación Académica de Docentes a Materias y Cursos** *(Prioridad: Obligatoria)*
  * **RF-08.1:** El sistema debe permitir al Administrador registrar las materias asignadas a un docente y los cursos y niveles educativos donde dicta clases, admitiendo que un mismo docente enseñe múltiples materias en diferentes cursos.
  * **RF-08.2:** El sistema debe permitir que una misma materia se dicte en diferentes cursos y que cuente con distintos docentes asignados según el curso.
  * **RF-08.3:** El sistema debe permitir modificar o dar de baja asignaciones docente-materia-curso verificando que no se generen superposiciones horarias para el mismo docente.

* **RF-09 — Asignación de Docentes Responsables de Deportes y Configuración de Grupos** *(Prioridad: Obligatoria)*
  * **RF-09.1:** El sistema debe exigir que cada disciplina deportiva tenga asignado al menos un **Docente a cargo**.
  * **RF-09.2:** El sistema debe permitir configurar diferentes **Grupos Deportivos** para un mismo deporte en función del **Nivel Educativo**, el **Horario (días y franja horaria)**, el **Docente a cargo** y el **Cupo máximo**.

* **RF-10 — Consulta de Actividad por Parte del Docente Autenticado** *(Prioridad: Obligatoria)*
  * **RF-10.1:** El sistema debe permitir a cada Docente autenticado consultar sus propios cursos asignados por nivel, materias, horarios de dictado y listados de alumnos de sus cursos/materias.
  * **RF-10.2:** Si el docente se desempeña como responsable de un deporte, el sistema debe permitirle consultar sus grupos deportivos asignados, horarios y nómina de alumnos inscriptos, restringiendo estrictamente el acceso a su propia información.

#### **C. Módulo de Inscripciones y Servicios Complementarios**

* **RF-11 — Control de Inscripciones y Bajas en Actividades Deportivas** *(Prioridad: Obligatoria)*
  * **RF-11.1 (Límite Máximo de 2 Deportes Simultáneos):** El sistema debe permitir inscribir a un alumno (por parte del Administrador o del Padre/Tutor autorizado) en grupos deportivos extracurriculares, aplicando un límite estricto de **hasta dos (2) deportes activos en simultáneo por alumno**.
  * **RF-11.2 (Validación de Nivel Educativo y Cupo):** El sistema debe verificar que el grupo deportivo seleccionado corresponda al **Nivel Educativo** del alumno y cuente con cupo disponible.
  * **RF-11.3 (Prevención Automática de Conflictos Horarios):** Antes de confirmar la inscripción a un segundo deporte, el sistema debe verificar y evitar cualquier **conflicto o superposición de horarios** entre las actividades deportivas seleccionadas por el estudiante.
  * **RF-11.4 (Prevención de Duplicados y Gestión de Bajas):** El sistema debe impedir el registro de inscripciones activas duplicadas de un mismo alumno en el mismo deporte y permitir registrar la baja lógica de una inscripción deportiva, liberando de inmediato el cupo del grupo y del alumno.

* **RF-12 — Gestión de Servicios Complementarios (Transporte Escolar y Comedor)** *(Prioridad: Obligatoria)*
  * **RF-12.1 (Configuración de 4 Rutas de Transporte y Comedor):** El sistema debe permitir al Administrador configurar y mantener las **cuatro (4) rutas oficiales** del servicio de transporte escolar (código de ruta, descripción/recorrido, horarios y capacidad), así como los parámetros del servicio de **Comedor / Cafetería**.
  * **RF-12.2 (Inscripción al Servicio de Transporte):** El sistema debe permitir inscribir a un alumno en el servicio de transporte exigiendo obligatoriamente la selección de **una (1) ruta específica entre las cuatro (4) rutas predefinidas**, impidiendo inscripciones activas duplicadas de transporte para el mismo estudiante.
  * **RF-12.3 (Inscripción al Servicio de Comedor y Bajas de Servicios):** El sistema debe permitir inscribir a un alumno en el servicio de comedor evitando registros duplicados, así como modificar la ruta asignada o gestionar la baja de cualquiera de los servicios complementarios en cualquier momento.

#### **D. Módulo de Padres / Tutores y Alumnos**

* **RF-13 — Autogestión de Padres / Tutores y Consulta Estudiantil** *(Prioridad: Obligatoria)*
  * **RF-13.1 (Asociación Múltiple y Aislamiento Estricto por Hijo):** Un Padre/Tutor autenticado que tenga uno o varios hijos asociados debe poder seleccionar a cada uno de sus hijos y consultar o gestionar exclusivamente la información correspondiente a ellos, bloqueándose cualquier acceso a datos de otros alumnos de la institución.
  * **RF-13.2 (Consulta Académica y Extracurricular):** Para cada hijo asociado, el Padre/Tutor debe poder visualizar el curso y nivel asignado, la nómina de **docentes por materia**, los **deportes en los que participa con sus respectivos horarios** y el estado de sus servicios de transporte y comedor.
  * **RF-13.3 (Inscripción Online a la Escolaridad y Servicios):** El Padre/Tutor debe poder realizar en línea la **inscripción de su hijo a la escolaridad (ciclo lectivo/curso)**, así como autogestionar altas y bajas en **actividades deportivas** (bajo todas las validaciones de `RF-11`), **servicio de transporte** (seleccionando 1 de las 4 rutas) y **servicio de comedor** (`RF-12`).
  * **RF-13.4 (Consulta de Perfil por el Alumno):** Un usuario con rol Alumno debe poder visualizar en modo de solo lectura su propio legajo académico, curso, materias, docentes asignados, deportes inscriptos, horarios y servicios contratados.

* **RF-14 — Notificaciones Automáticas a Padres / Tutores (Valor Agregado)** *(Prioridad: Deseable / Valor Agregado)*
  * **RF-14.1:** Ante el registro de eventos transaccionales relevantes sobre un alumno —tales como confirmación de inscripción o baja en escolaridad, deportes, ruta de transporte o comedor, o cambios de horario en una actividad en la que participa—, el sistema debe enviar automáticamente una notificación por **Correo Electrónico (SMTP)** al Padre/Tutor asociado y registrar el aviso en la bandeja interna del portal.

---

### **2.2 Matriz Resumen de Trazabilidad Funcional**

| ID | Módulo | Requisito Funcional | Sub-requisitos Clave | Prioridad |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Administración y Seguridad | Gestión de Accesos, Autenticación y Permisos (RBAC) | `RF-01.1` ABM Usuarios y roles; `RF-01.2` Login JWT; `RF-01.3` Vínculo Padre-Hijos (`1:N`); `RF-01.4` Control RBAC en vistas y API | **Obligatoria** |
| **RF-02** | Administración y Seguridad | Alta de Entidades Académicas y Extracurriculares | `RF-02.1` Niveles; `RF-02.2` Cursos; `RF-02.3` Materias (incl. 3 idiomas); `RF-02.4` Deportes (8 disciplinas) | **Obligatoria** |
| **RF-03** | Administración y Seguridad | Baja / Desactivación de Entidades de Referencia | `RF-03.1` Baja lógica/física; `RF-03.2` Validación de integridad referencial contra registros huérfanos | **Obligatoria** |
| **RF-04** | Administración y Seguridad | Modificación de Entidades de Referencia | `RF-04.1` Edición de Niveles, Cursos, Materias y Deportes; `RF-04.2` Validación de consistencia | **Obligatoria** |
| **RF-05** | Administración y Seguridad | Gestión de Horarios y Control de Conflictos | `RF-05.1` Definición de horarios académicos y deportivos; `RF-05.2` Detección automática de superposiciones | **Obligatoria** |
| **RF-06** | Administración y Seguridad | Generación de Reportes Institucionales (9 Reportes) | `RF-06.1` Por Alumno; `RF-06.2` Por Docente; `RF-06.3` Alumnos por Curso; `RF-06.4` Alumnos por Materia; `RF-06.5` Docentes por Nivel; `RF-06.6a/b/c` Alumnos por Deporte (3 variantes); `RF-06.7` Alumnos por Ruta de Transporte | **Obligatoria** |
| **RF-07** | Académico (Alumnos y Docentes) | Gestión de Legajos de Alumnos y Docentes | `RF-07.1` ABM Alumno (11 campos obligatorios); `RF-07.2` Curso y Nivel único por alumno; `RF-07.3` ABM Docente (8 campos obligatorios); `RF-07.4` Búsqueda por Legajo/DNI/filtros | **Obligatoria** |
| **RF-08** | Académico (Alumnos y Docentes) | Asignación Académica de Docentes | `RF-08.1` Múltiples materias y cursos por docente; `RF-08.2` Distintos docentes por materia según curso; `RF-08.3` Modificación/baja y control horario | **Obligatoria** |
| **RF-09** | Académico (Alumnos y Docentes) | Docentes Responsables de Deportes y Grupos | `RF-09.1` Docente obligatorio a cargo por deporte; `RF-09.2` Grupos deportivos por nivel, horario, docente y cupo | **Obligatoria** |
| **RF-10** | Académico (Alumnos y Docentes) | Consulta de Actividad por Docente Autenticado | `RF-10.1` Consulta de cursos, materias, horarios y nóminas propias; `RF-10.2` Consulta de grupos deportivos propios | **Obligatoria** |
| **RF-11** | Inscripciones y Servicios | Control de Inscripciones y Bajas en Deportes | `RF-11.1` Límite máximo de 2 deportes activos; `RF-11.2` Validación de nivel y cupo; `RF-11.3` Prevención de solapamiento horario; `RF-11.4` Sin duplicados y baja lógica | **Obligatoria** |
| **RF-12** | Inscripciones y Servicios | Gestión de Servicios Complementarios (Transporte y Comedor) | `RF-12.1` Configuración de 4 rutas de transporte y comedor; `RF-12.2` Inscripción a 1 ruta; `RF-12.3` Inscripción a comedor, sin duplicados y bajas | **Obligatoria** |
| **RF-13** | Padres / Tutores y Alumnos | Autogestión de Padres / Tutores y Consulta Estudiantil | `RF-13.1` Aislamiento estricto por hijo(s); `RF-13.2` Consulta de docentes por materia y deportes; `RF-13.3` Inscripción online a escolaridad, deportes, transporte y comedor; `RF-13.4` Consulta del Alumno | **Obligatoria** |
| **RF-14** | Padres / Tutores y Alumnos | Notificaciones Automáticas a Padres (Valor Agregado) | `RF-14.1` Envío de alertas por email (SMTP) y bandeja interna ante altas, bajas o cambios de horario | **Deseable (Valor Agregado)** |

---

### **2.3 Requisitos No Funcionales (`RNF`)**

| ID | Categoría | Especificación del Requisito No Funcional | Métrica de Verificación / Criterio de Aceptación |
| :--- | :--- | :--- | :--- |
| **RNF-01** | **Seguridad y Control de Acceso RBAC** | Las contraseñas deben almacenarse encriptadas mediante algoritmos de hashing seguro (**BCrypt**, factor de costo mínimo 10); las sesiones deben gestionarse mediante **tokens JWT** firmados sobre **HTTPS (TLS 1.2/1.3)**. El control de acceso debe validarse en la capa de lógica de negocio (API) y reforzarse mediante **Row-Level Security (RLS)** en PostgreSQL para asegurar que cada rol (`Administrador`, `Docente`, `Padre/Tutor`, `Alumno`) acceda exclusivamente a sus módulos autorizados y que cada padre solo consulte/gestione datos de sus propios hijos. | El 100% de las peticiones no autenticadas o con intento de acceso cruzado entre roles o hacia hijos ajenos son rechazadas con código HTTP `401` o `403`; cero contraseñas en texto plano. |
| **RNF-02** | **Rendimiento y Tiempo de Respuesta** | Las operaciones transaccionales y de validación frecuentes (inicio de sesión, consulta de legajos, verificación de conflicto horario, control de inscripción en deportes/servicios) deben resolverse en **menos de 1,5 segundos**, y la generación de reportes complejos multicriterio (`RF-06.1` a `RF-06.7`) debe completarse en un **máximo de 3,0 segundos** bajo carga operativa normal. | Percentil 95 (`p95`) de tiempo de respuesta `< 1,5 s` en endpoints transaccionales y `<= 3,0 s` en consultas de reportes bajo pruebas de concurrencia. |
| **RNF-03** | **Integridad Transaccional y Concurrencia ACID** | La persistencia en la base de datos relacional debe garantizar las propiedades **ACID** apoyándose en el control de concurrencia **MVCC** de PostgreSQL y restricciones `UNIQUE` compuestas para evitar bloqueos mutuos (*deadlocks*), sobrecupos o registros duplicados concurrentes en la inscripción académica, el tope de 2 deportes por alumno y las 4 rutas del transporte escolar. | Cero inscripciones duplicadas, cero alumnos con `> 2` deportes activos y cero solapamientos horarios ante ejecuciones concurrentes. |
| **RNF-04** | **Disponibilidad y Respaldo Automatizado (Backups)** | La plataforma debe mantener una disponibilidad operativa mínima del **99,5% durante el ciclo lectivo** (especialmente en períodos críticos de matriculación en marzo) y contar con **copias de seguridad (backups) diarias automatizadas** de la base de datos centralizada. | Disponibilidad `>= 99,5%`; Tiempo Objetivo de Recuperación (**RTO**) `< 2 horas` y Punto Objetivo de Recuperación (**RPO**) `< 24 horas`. |
| **RNF-05** | **Usabilidad y Diseño Web Responsivo** | La plataforma debe ofrecer una interfaz web responsiva accesible desde cualquier navegador estándar moderno (Chrome, Firefox, Edge, Safari), adaptándose fluidamente a resoluciones de escritorio, tablets y teléfonos móviles, permitiendo a padres/tutores y directivos completar flujos principales en **no más de 4 pasos guiados**. | El 100% de los flujos críticos de inscripción y consulta se completan en `<= 4` pasos/clics con correcta adaptación visual entre `360px` y `1920px`. |
| **RNF-06** | **Continuidad Organizacional y Tecnológica** | El sistema de gestión debe preservar la continuidad tecnológica con el ecosistema ya adoptado por la institución para su Sitio Web Público: control de versiones en **GitHub**, despliegue en **Vercel**, frontend en **React + TypeScript + Vite**, backend REST API en **Node.js + Express + TypeScript** y base de datos **PostgreSQL (Supabase)** con soporte de migraciones SQL reproducibles en entorno local. | Estándares unificados de repositorio, despliegue continuo (CI/CD) en Vercel y 100% de reproducibilidad del esquema SQL entre entornos local y nube. |

---

## **3. Clasificación del Sistema de Información**

De acuerdo con la taxonomía clásica de los Sistemas de Información (**Laudon & Laudon**; **Kendall & Kendall**), el sistema proyectado para *"Educar para Transformar"* se clasifica como un **Sistema de Información para la Gestión (MIS, *Management Information System*) sustentado sobre una base operativa de Procesamiento de Transacciones (TPS, *Transaction Processing System*)**:

### **3.1 Componente Operativo: Sistema de Procesamiento de Transacciones (TPS)**

En su base operativa diaria, el sistema actúa como un **TPS** encargado de registrar, validar y persistir en tiempo real las transacciones estructuradas y rutinarias del centro educativo:

* Altas, bajas y modificaciones de legajos de Alumnos y Docentes (`RF-07`) y de entidades académicas de referencia (`RF-02`, `RF-03`, `RF-04`).
* Procesamiento transaccional de inscripciones a la escolaridad, inscripciones y bajas en grupos deportivos, asignación a una de las 4 rutas de transporte escolar y adhesión al servicio de comedor (`RF-11`, `RF-12`, `RF-13`).
* Ejecución determinista de reglas de negocio dentro de transacciones ACID: control de pertenencia a un único curso y nivel, verificación del límite máximo de 2 deportes simultáneos, validación matemática de no superposición horaria (`RF-05`) y bloqueo de inscripciones duplicadas (`RNF-03`).

### **3.2 Componente Táctico-Directivo: Sistema de Información para la Gestión (MIS)**

Construido directamente sobre el repositorio transaccional único del TPS, el sistema opera como un **MIS** orientado a los niveles de mando medio y Dirección institucional:

* Consolida y transforma los datos operativos en **nueve (9) reportes estructurados de gestión (`RF-06.1` a `RF-06.7`)** sin necesidad de mantener bases de datos paralelas.
* Proporciona a la Dirección visibilidad inmediata sobre la matrícula por curso y materia (`RF-06.3`, `RF-06.4`), la distribución de carga horaria docente por nivel educativo (`RF-06.2`, `RF-06.5`), la participación estudiantil en las 8 disciplinas deportivas segmentada por nivel, horario y docente a cargo (`RF-06.6a/b/c`), y la ocupación logística de las 4 rutas del transporte escolar (`RF-06.7`) y del comedor.

### **3.3 Alcance Organizacional y Modalidad Tecnológica**

* **Alcance Organizacional — Sistema Integrado e Interfuncional:** Supera los silos departamentales integrando en una única plataforma cuatro áreas clave: **Dirección y Administración**, **Cuerpo Docente**, ** Coordinación de Deportes y Servicios Complementarios (Transporte y Comedor)** y **Familias (Padres/Tutores y Alumnos)**.
* **Modalidad Tecnológica — Sistema Web Centralizado Cliente-Servidor con RBAC:** Se despliega bajo una arquitectura web de fuente única de verdad (*Single Source of Truth*) accesible mediante navegadores estándar sobre HTTPS, segmentando dinámicamente las vistas y operaciones según el rol autenticado.

---

## **4. Arquitectura de la Información y Arquitectura de la Aplicación de Software**

### **4.1 Arquitectura de la Información**

La arquitectura de la información define cómo se estructuran, relacionan y gobiernan los datos institucionales con independencia de la tecnología subyacente.

#### **4.1.1 Dominios de Datos (Entidades Principales)**

1. **Dominio de Seguridad e Identidad:** `Rol`, `Permiso`, `Usuario`, `Usuario_Rol`.
2. **Dominio de Personas:** `Alumno` (con sus 11 atributos obligatorios), `Docente` (con sus 8 atributos obligatorios), `Padre_Tutor` y la entidad asociativa `Padre_Alumno`.
3. **Dominio de Estructura Académica:** `Nivel_Educativo` (*Inicial*, *Primario*, *Secundario*), `Curso` (*Grado/División*), `Materia` y `Horario_Academico`.
4. **Dominio de Actividad Extracurricular:** `Deporte` (las 8 disciplinas institucionales) y `Grupo_Deportivo` (definido por deporte, nivel educativo, horario, docente responsable a cargo y cupo).
5. **Dominio de Servicios Complementarios:** `Ruta_Transporte` (las 4 rutas predefinidas) y `Servicio_Comedor`.
6. **Dominio Transaccional / Asociativo:** `Inscripcion_Escolar`, `Curso_Materia_Docente`, `Inscripcion_Deporte`, `Inscripcion_Transporte`, `Inscripcion_Comedor` y `Registro_Notificacion`.
7. **Dominio del Portal Institucional Público (Continuidad):** Contenidos institucionales públicos, niveles, instalaciones y canales de contacto integrados al ecosistema web.

#### **4.1.2 Relaciones Clave y Reglas de Negocio Estructurales (18 Reglas Institucionales)**

El modelo relacional materializa las **dieciocho (18) reglas de negocio** del centro educativo mediante claves primarias, claves foráneas, restricciones `UNIQUE` compuestas y validaciones transaccionales:

1. **Unicidad de Curso por Alumno (`1:N` entre `Curso` y `Alumno`):** Cada alumno debe pertenecer obligatoriamente a **un único curso** en el ciclo lectivo activo (`Alumno.curso_id NOT NULL`).
2. **Unicidad de Nivel Educativo por Curso (`1:N` entre `Nivel_Educativo` y `Curso`):** Cada curso pertenece a **un único nivel educativo** (*Inicial*, *Primario* o *Secundario*), lo cual determina de forma unívoca el nivel educativo del alumno.
3. **Múltiples Materias por Alumno según su Curso:** Un alumno pertenece a un curso y cursa múltiples materias definidas por el plan de estudios de dicho curso.
4. **Presencia de una Materia en Diferentes Cursos (`N:M` entre `Curso` y `Materia`):** Una misma materia (por ejemplo, Matemática, Inglés, Portugués o Francés) puede dictarse en diferentes cursos.
5. **Diferentes Docentes para una Misma Materia según el Curso:** La entidad asociativa `Curso_Materia_Docente` permite que una misma materia tenga diferentes docentes asignados dependiendo del curso.
6. **Un Docente en Múltiples Materias y Cursos:** Una materia puede ser dictada por un mismo docente en diferentes cursos, y un mismo docente puede dictar múltiples materias en distintos cursos y niveles educativos.
7. **Límite Máximo de Dos (2) Deportes Simultáneos por Alumno:** En `Inscripcion_Deporte`, cada alumno puede inscribirse en **hasta dos (2) deportes activos simultáneamente** (`COUNT(inscripciones activas por alumno) <= 2`).
8. **Prevención de Conflictos Horarios entre Deportes:** El sistema verifica y evita automáticamente cualquier superposición horaria entre los grupos deportivos seleccionados por un mismo estudiante.
9. **Docente Responsable Obligatorio por Deporte:** Cada deporte y cada `Grupo_Deportivo` debe tener obligatoriamente un **Docente a cargo** asignado.
10. **Grupos Deportivos por Nivel y Horario (`1:N` entre `Deporte` y `Grupo_Deportivo`):** Un mismo deporte puede contar con diferentes grupos organizados según Nivel Educativo, Horario y Docente a cargo.
11. **Servicio de Transporte Compuesto por Cuatro (4) Rutas:** El catálogo `Ruta_Transporte` estructura el servicio exactamente en las **cuatro (4) rutas predefinidas** por la institución.
12. **Inscripción a Transporte en una Ruta Específica:** Cada alumno que utiliza el servicio de transporte (`Inscripcion_Transporte`) debe quedar inscripto en **una (1) ruta específica** de las cuatro disponibles.
13. **Inscripción al Servicio de Comedor:** Cada alumno puede inscribirse en el servicio de comedor escolar (`Inscripcion_Comedor`) con trazabilidad de vigencia.
14. **Prevención de Registros de Inscripción Duplicados:** Restricciones `UNIQUE` compuestas sobre `(alumno_id, ciclo_lectivo)` en escolaridad, `(alumno_id, deporte_id)` en deportes activos, `(alumno_id)` en transporte activo y `(alumno_id)` en comedor activo impiden cualquier inscripción duplicada.
15. **Asociación de un Padre/Tutor con Uno o Varios Hijos (`N:M` / `1:N` mediante `Padre_Alumno`):** Un padre o tutor puede estar asociado a **uno o más hijos** matriculados en el establecimiento.
16. **Aislamiento Estricto de Consulta y Gestión Parental:** Un padre o tutor **solo puede consultar y gestionar** información (docentes por materia, actividades deportivas, inscripción escolar y servicios) correspondiente a sus propios hijos asociados.
17. **Alcance Total del Rol Administrador:** El Administrador puede configurar, consultar y gestionar toda la información maestra y transaccional del sistema, además de acceder a la totalidad de los reportes definidos por la Dirección.
18. **Segregación Estricta de Accesos según Permisos por Rol:** El sistema garantiza que cada rol de usuario (`Administrador`, `Docente`, `Padre/Tutor`, `Alumno`) acceda únicamente a las áreas, vistas y operaciones asociadas a sus permisos asignados.

#### **4.1.3 Principios de Gobierno de la Información**

* **Fuente Única de Verdad (*Single Source of Truth*):** Todas las consultas (portal de administración, autogestión docente, portal de padres/tutores, vista estudiantil y los 9 reportes ejecutivos) leen y escriben sobre el mismo repositorio relacional central, eliminando duplicidades o desfasajes de datos.
* **Acceso Segmentado por Rol y Propiedad (*Principio de Menor Privilegio*):** La información se expone mediante vistas y servicios filtrados por perfil (el Administrador visualiza toda la institución; el Docente visualiza únicamente sus cursos, materias y grupos deportivos; el Padre/Tutor visualiza y gestiona exclusivamente a sus hijos).
* **Trazabilidad y Baja Lógica:** Las entidades maestras y las inscripciones mantienen historial auditable mediante estados lógicos (`ACTIVO`, `INACTIVO`, `BAJA`) y marcas de auditoría (`created_at`, `updated_at`, `usuario_responsable`), preservando la integridad histórica.

#### **4.1.4 Continuidad del Ecosistema (Sitio Público, Sistema Web de Gestión y Futura App Móvil)**

La arquitectura de la información articula de manera continua tres puntos de contacto institucionales:
1. **Sitio Web Institucional Público (Etapa Previa Desarrollada):** Difunde la propuesta educativa, niveles, idiomas, deportes, instalaciones y canales de admisión.
2. **Sistema Web Integral de Gestión Autenticado (Alcance Central de esta Etapa):** Provee los paneles operativos diferenciados para Administración, Docentes, Padres/Tutores y Alumnos.
3. **Preparación para Futura Aplicación Móvil:** Al exponer toda la lógica de negocio y el acceso a datos a través de una API REST desacoplada (`HTTP/JSON`), una futura aplicación móvil para familias podrá consumir exactamente los mismos endpoints sin duplicar reglas de negocio ni modificar la base de datos.

---

### **4.2 Arquitectura de la Aplicación de Software**

#### **4.2.1 Tabla Ejecutiva de Síntesis Arquitectónica**

| Elemento Arquitectónico | Descripción en el Proyecto "Educar para Transformar" |
| :--- | :--- |
| **Estilo Arquitectónico** | **Arquitectura en Capas de 3 Niveles (*3-Tier Layered Architecture*: Presentación, Lógica de Negocio y Datos)** bajo un esquema **Cliente-Servidor Web** con **API REST** desacoplada. |
| **Capa de Presentación (Cliente)** | Aplicación Web de Página Única (**SPA**) construida con **React + TypeScript + Vite**, con diseño responsivo y vistas diferenciadas por rol (Administrador, Docente, Padre/Tutor, Alumno), integrada al ecosistema desplegado en **Vercel**. |
| **Capa de Lógica de Negocio (Backend)** | **API REST** sin estado (*stateless*) desarrollada con **Node.js + Express + TypeScript**, estructurada internamente en Rutas → Controladores → Servicios de Dominio → Repositorios de Datos. |
| **Capa de Persistencia de Datos** | Base de datos relacional centralizada **PostgreSQL** gestionada en **Supabase** (con soporte de migraciones SQL locales), garantizando transacciones **ACID**, control de concurrencia **MVCC**, integridad referencial y políticas **RLS**. |
| **Mecanismos de Seguridad** | Autenticación **JWT**, hashing de contraseñas con **BCrypt**, cifrado en tránsito **HTTPS**, middleware de autorización RBAC en Express y políticas de seguridad a nivel de fila (**RLS**) en PostgreSQL. |
| **Integraciones Externas** | Servicio de mensajería **SMTP / Nodemailer** para notificaciones automáticas por correo electrónico a los padres (`RF-14`) y **GitHub + Vercel** para control de versiones e integración/despliegue continuo (`RNF-06`). |

#### **4.2.2 Aplicación de Principios de Diseño de Software**

* **Separación de Responsabilidades (*Separation of Concerns* en Capas):** El sistema se organiza en tres capas independientes (presentación, lógica de negocio y datos), de modo que un cambio en la interfaz de usuario no afecte las reglas de negocio, ni una optimización en el motor de base de datos obligue a reescribir la lógica de aplicación.
* **Fuente Única de Verdad y Centralización Transaccional ACID:** Todos los módulos del frontend consumen información a través de un único backend que accede a un único repositorio central de datos. Esta centralización permite garantizar las propiedades **ACID** exigidas por `RNF-03`: al no existir múltiples puntos de escritura independientes, se previenen sobrecupos, condiciones de carrera y registros duplicados en la inscripción escolar, los cupos deportivos (máximo 2 por alumno) y las 4 rutas de transporte.
* **Seguridad por Diseño (*Security by Design*):** El control de acceso basado en roles no se resuelve únicamente ocultando botones en la interfaz; se aplica transversalmente en la capa de lógica de negocio y en la base de datos (`RNF-01`), validando en cada operación que el usuario autenticado posea permiso para el recurso solicitado (incluyendo la restricción estricta de que cada padre/tutor acceda exclusivamente a los datos de sus propios hijos).
* **Alta Disponibilidad y Resiliencia:** La arquitectura contempla un backend desacoplado del cliente y un repositorio de datos con copias de seguridad diarias automatizadas (`RNF-04`), asegurando la continuidad operativa durante todo el ciclo lectivo.
* **Arquitectura Desacoplada (Frontend / Backend mediante API REST):** Al exponer toda la lógica del sistema a través de una API REST centralizada, la interfaz web interactúa de manera limpia y modular con la capa de negocio, facilitando el mantenimiento y asegurando el cumplimiento uniforme de `RNF-05` (flujos intuitivos en un máximo de 4 pasos guiados).

#### **4.2.3 Componentes Funcionales por Capa**

1. **Capa de Presentación (Portal Web de Gestión Institucional — React + TypeScript):**
   * *Módulo de Portal Público Institucional:* Vistas informativas públicas ya desarrolladas (niveles, instalaciones, idiomas, deportes y contacto).
   * *Panel de Administración:* Configuración académica de referencia, gestión de legajos de alumnos y docentes, asignación docente, gestión de horarios, control de inscripciones en deportes, transporte y comedor, administración de usuarios/roles y generación interactiva/exportación de los 9 reportes de gestión (`RF-01` a `RF-09`, `RF-11`, `RF-12`).
   * *Panel Docente:* Consulta autenticada de cursos asignados por nivel, materias, horarios de clase, grupos deportivos a cargo y nóminas de alumnos (`RF-10`).
   * *Portal de Autogestión para Padres / Tutores:* Selector de hijo asociado, consulta de docentes por materia y actividades deportivas de sus hijos, inscripción online al ciclo lectivo/curso, autogestión de altas y bajas en deportes, transporte (4 rutas) y comedor, y bandeja de notificaciones (`RF-13`, `RF-14`).
   * *Portal del Alumno:* Consulta en modo lectura de su legajo académico, curso, materias, docentes, horarios y actividades inscriptas (`RF-13.4`).

2. **Capa de Lógica de Negocio (Backend / API REST — Node.js + Express + TypeScript):**
   * *Módulo de Autenticación y Seguridad:* Gestiona el inicio de sesión, la emisión y validación de tokens JWT, el hashing de contraseñas con BCrypt y el control de acceso basado en roles (RBAC), restringiendo estrictamente a cada padre/tutor a la información de sus propios hijos (`RF-01`, `RNF-01`).
   * *Módulo Académico y de Legajos:* Administra la información de referencia del colegio (niveles educativos, cursos, materias) y los legajos completos de alumnos (11 campos) y docentes (8 campos), incluyendo las asignaciones de docentes a materias y cursos (`RF-02`, `RF-03`, `RF-04`, `RF-07`, `RF-08`, `RF-10`).
   * *Módulo de Horarios y Control de Conflictos:* Define los horarios de las actividades académicas y deportivas y valida automáticamente la ausencia de superposiciones horarias (`RF-05`, `RF-09`).
   * *Módulo de Inscripciones y Servicios Complementarios:* Gestiona de forma transaccional las inscripciones a deportes (validando el límite de dos deportes simultáneos, nivel educativo, cupo y ausencia de solapamiento horario), la inscripción académica al curso, el servicio de transporte (selección obligatoria de una de las cuatro rutas) y el servicio de comedor, impidiendo duplicados (`RF-11`, `RF-12`, `RF-13`).
   * *Módulo de Reportes:* Genera en tiempo real los 9 reportes de gestión a partir de los datos operativos (por alumno, por docente, alumnos por curso, alumnos por materia, docentes por nivel, alumnos por deporte en sus 3 variantes y alumnos por ruta de transporte) sin mantener bases de datos paralelas (`RF-06`).
   * *Módulo de Notificaciones:* Dispara alertas automáticas a los padres ante eventos relevantes (confirmaciones o bajas de inscripción, cambios de horario) mediante **correo electrónico automatizado (servicio SMTP)** y bandeja interna de avisos en el portal (`RF-14`).

3. **Capa de Datos (PostgreSQL en Supabase):**
   * *Motor de Base de Datos Relacional:* Repositorio único y centralizado que persiste toda la información del sistema, haciendo cumplir la integridad referencial exigida por las reglas de negocio (un alumno–un curso, un curso–un nivel, prohibición de inscripciones duplicadas) y las propiedades ACID para operaciones concurrentes (`RNF-03`).
   * *Subsistema de Respaldo (Backup):* Ejecuta copias de seguridad diarias automatizadas de la base de datos centralizada con capacidad de restauración (`RNF-04`).

#### **4.2.4 Restricciones Arquitectónicas**

* El acceso de escritura y validación transaccional sobre la base de datos debe realizarse exclusivamente a través de la capa de lógica de negocio (API REST); el cliente web frontend no puede mutar datos directamente salteando las validaciones de dominio.
* Toda operación de escritura sobre inscripción académica, cupos deportivos o rutas de transporte debe ejecutarse dentro de una transacción **ACID** para evitar sobrecupos o registros duplicados ante accesos simultáneos (`RNF-03`).
* El control de acceso basado en roles y la verificación de vínculo parental (`padre_id -> alumno_id`) deben validarse obligatoriamente en el backend para cada operación, sin delegarse únicamente a la interfaz cliente (`RNF-01`).
* Las contraseñas deben almacenarse encriptadas con **BCrypt**; bajo ninguna circunstancia pueden persistirse ni transmitirse en texto plano (`RNF-01`).
* Las operaciones transaccionales frecuentes (verificación de conflicto horario, control de inscripción, consulta de legajos) deben resolverse en menos de 1,5 segundos en condiciones normales de operación (`RNF-02`).
* Un alumno no puede poseer más de dos inscripciones deportivas activas simultáneas, ni inscripciones activas duplicadas en un mismo servicio (transporte, comedor o escolaridad).
* El servicio de transporte únicamente admite inscripciones en una de las cuatro rutas predefinidas.

#### **4.2.5 Conectores Arquitectónicos**

* **API REST (`HTTP/JSON`):** Conecta al portal web (y a una futura aplicación móvil) con el backend, constituyendo el punto único de acceso a la lógica de negocio y, a través de ella, a los datos.
* **Protocolo `HTTPS` (TLS):** Protocolo de transporte seguro empleado en todas las comunicaciones entre clientes y el backend, garantizando la confidencialidad e integridad de los datos en tránsito (`RNF-01`).
* **Tokens `JWT` (`Bearer Authentication`):** Mecanismo de autenticación y autorización sin estado que viaja en el encabezado de cada petición desde el cliente hacia el backend, permitiendo validar la identidad y el rol del usuario.
* **Driver Relacional / ORM sobre TLS (`Prisma` / `pg`):** Conecta la capa de lógica de negocio con el motor PostgreSQL en Supabase, siendo el único canal autorizado para ejecutar transacciones sobre el repositorio centralizado.
* **Conector de Mensajería `SMTP` (`Nodemailer`):** Conecta el Módulo de Notificaciones con el servidor de correo electrónico para el envío de alertas automáticas a las casillas de los padres/tutores (`RF-14`).

---

### **4.3 Tecnologías Seleccionadas**

#### **4.3.1 Tabla Ejecutiva del Stack Tecnológico**

| Capa / Dominio | Tecnologías Seleccionadas | Responsabilidad y Justificación en el Proyecto |
| :--- | :--- | :--- |
| **Frontend (Capa de Presentación)** | **React 18+, TypeScript, Vite, React Router, Tailwind CSS / CSS Modules** | Construcción del Portal Web de Gestión Institucional responsivo (`RNF-05`). Garantiza continuidad tecnológica directa con el Sitio Web Público ya desarrollado (`RNF-06`), permitiendo reutilizar componentes visuales (tablas, formularios, grillas horarias) entre los paneles de Administrador, Docente, Padre/Tutor y Alumno. |
| **Backend (Capa de Lógica de Negocio)** | **Node.js, Express, TypeScript, `jsonwebtoken` (JWT), `bcrypt`, `nodemailer`, `zod`** | Implementación de la API REST en capas, centralizando las 18 reglas de negocio, el algoritmo de detección de conflictos horarios (`RF-05`), el middleware de seguridad RBAC y aislamiento parental (`RF-01`, `RNF-01`), el motor de los 9 reportes (`RF-06`) y las notificaciones SMTP (`RF-14`). |
| **Gestor de Base de Datos (Capa de Datos)** | **PostgreSQL (alojado en Supabase + migraciones SQL locales)** | Asegura de forma nativa la integridad referencial estricta (`Alumno–Curso–Nivel`), restricciones `UNIQUE` contra inscripciones duplicadas, transacciones **ACID** y control de concurrencia **MVCC** (`RNF-03`), además de **Row-Level Security (RLS)** (`RNF-01`) y backups diarios automatizados (`RNF-04`). |
| **Infraestructura, DevOps y Control de Versiones** | **GitHub (Git), Vercel** | Gestión colaborativa de código fuente, trazabilidad de cambios mediante ramas y commits convencionales, y despliegue continuo automatizado (CI/CD) integrado al flujo de trabajo ya existente en Vercel (`RNF-06`). |

#### **4.3.2 Justificación Detallada por Capa**

##### **1. Frontend: React + TypeScript + Vite (Desplegado en Vercel)**
Para la capa de presentación se selecciona **React** junto con **TypeScript** y **Vite** para desarrollar el Portal Web de Gestión Institucional. Esta elección mantiene plena coherencia con el stack tecnológico utilizado en la primera etapa para el Sitio Web Institucional Público (`RNF-06`). React permite construir una interfaz basada en componentes reutilizables (tablas con filtros multicriterio, formularios validados para los 11 campos de alumnos y 8 de docentes, selectores de horarios y visores de reportes), adaptando las vistas según el rol autenticado (**Panel de Administración, Panel Docente, Portal de Autogestión de Padres/Tutores y Portal del Alumno**). Asimismo, **React Router** gestiona las rutas protegidas por rol y la **Context API** administra el estado de sesión, facilitando el diseño web responsivo exigido por `RNF-05`.

##### **2. Backend: Node.js + Express + TypeScript (API REST)**
Para la capa de lógica de negocio se selecciona **Node.js** con el framework **Express**, utilizando **TypeScript** como lenguaje de desarrollo unificado con el frontend. Esta elección se fundamenta en tres pilares:
* **Arquitectura Limpia en Capas:** Express permite estructurar de forma ordenada la API REST (*Rutas → Controladores → Servicios → Repositorios*), alineándose con el principio de separación de responsabilidades definido en la Sección 4.2.
* **Tipado Estático y Validación de Esquemas:** TypeScript y **Zod** reducen errores en tiempo de desarrollo y garantizan que los contratos de datos se cumplan rigurosamente a medida que escalan los seis módulos del backend (Autenticación, Académico, Horarios, Inscripciones y Servicios, Notificaciones y Reportes).
* **Ecosistema Maduro para Requisitos No Funcionales:** Dispone de librerías probadas en la industria como **`jsonwebtoken`** para la emisión y verificación de tokens JWT (`RNF-01`), **`bcrypt`** para el hashing seguro de contraseñas (`RNF-01`), **`nodemailer`** para el despacho de alertas por correo electrónico (`RF-14`) y clientes transaccionales para ejecutar bloques ACID seguros contra PostgreSQL (`RNF-03`).

##### **3. Sistema Gestor de Base de Datos: PostgreSQL sobre Supabase (con Soporte de Desarrollo Local)**
Como motor de base de datos se selecciona **PostgreSQL** gestionado a través de la plataforma **Supabase**, manteniendo compatibilidad total con entornos locales de desarrollo mediante migraciones SQL estándar. Esta decisión se fundamenta en que PostgreSQL garantiza de manera nativa:
* **Integridad Referencial Estricta y Restricciones de Unicidad:** Asegura estructuralmente las relaciones obligatorias (`Alumno (1) — (1) Curso — (1) Nivel Educativo`), el catálogo cerrado de las 4 rutas de transporte (`RF-12.1`) y la imposibilidad de registrar inscripciones duplicadas en cursos, deportes, transporte o comedor.
* **Soporte Transaccional ACID y Control de Concurrencia MVCC (`RNF-03`):** Previene condiciones de carrera (*race conditions*) y sobrecupos cuando múltiples padres o administradores intentan inscribir alumnos simultáneamente en grupos deportivos (respetando el tope máximo de 2 deportes por alumno y la ausencia de solapamientos horarios) o en rutas de transporte.
* **Seguridad a Nivel de Fila (RLS) y Backups Automatizados (`RNF-01`, `RNF-04`):** Complementa la seguridad del backend mediante políticas RLS nativas en PostgreSQL y provee respaldos diarios automatizados en la nube con alta disponibilidad durante todo el año escolar.

##### **4. Infraestructura y Continuidad Operativa: GitHub + Vercel**
El código fuente y el historial de versiones se centralizan en **GitHub**, mientras que el despliegue web se automatiza en **Vercel** (`RNF-06`). Esta infraestructura proporciona certificados **HTTPS** automáticos (`RNF-01`), alta disponibilidad global (`RNF-04`) y una transición transparente entre el portal institucional público y el nuevo sistema integral de gestión académica, deportiva y de servicios.
