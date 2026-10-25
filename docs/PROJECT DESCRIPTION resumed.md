# **PROJECT DESCRIPTION AND WORK PLAN — "EDUCAR PARA TRANSFORMAR" INTEGRATED MANAGEMENT SYSTEM**

---

## **1. Problem Statement and Project Context**

### **1.1 Institutional Context**

The private educational center **"Educar para Transformar"**, a high-quality educational institution located on the outskirts of the city of Resistencia (Chaco, Argentina), will commence academic and administrative operations in **March 2027**. The institution offers an educational proposal with an **extended school day schedule (full-day format)** across three mandatory educational levels:

* **Early Childhood / Kindergarten (*Nivel Inicial*)**
* **Primary / Elementary School (*Nivel Primario*)**
* **Secondary / High School (*Nivel Secundario*)**

The curriculum integrates intensive instruction in **three languages** (**English, Portuguese, and French**), continuous **Student Support Services** (*Servicio de Orientación y Apoyo Estudiantil*), and an extensive extracurricular sports program comprising **eight sports disciplines**:

1. **Athletics (Track and Field)**
2. **Swimming**
3. **Soccer**
4. **Martial Arts**
5. **Volleyball**
6. **Dance**
7. **Basketball**
8. **Chess**

To sustain this comprehensive educational model, the campus features purpose-built infrastructure and facilities:

* **Sports Infrastructure:** Heated swimming pool, soccer fields, athletics track, and indoor gymnasium.
* **Academic Infrastructure:** Specialized Computer, Physics, and Chemistry laboratories.
* **Support and Welfare Facilities:** Dining hall / cafeteria (*Comedor*), infirmary / nurse's office (*Enfermería*), and a dedicated **Shuttle / Bus Transportation Service** (*Servicio de Transporte Escolar*) organized into **four (4) predefined routes**.

### **1.2 Problem Diagnosis and Continuity with Prior Work**

In the first stage of institutional digitalization, the **Public Institutional Website** of *"Educar para Transformar"* was developed and deployed (hosted on Vercel and managed via GitHub) to communicate the school's educational levels, facilities, workshops, institutional identity, and public admissions/contact channels to the community.

However, facing the imminent **March 2027 opening**, the institution is in the midst of administrative and academic organization and lacks an integrated software platform to centralize internal transactional operations and management oversight. Relying on fragmented spreadsheets or manual paper-based workflows would expose the Educational Center to severe operational risks:

1. **Data Fragmentation and Inconsistency:** Difficulty keeping student and faculty records (file numbers/*legajos*, DNI, contact data, academic assignments, and active statuses) synchronized across the Principal's Office (*Dirección*), Secretariat, and Teaching Staff.
2. **Inability to Enforce Complex Business Rules Automatically:** Manual verification cannot reliably enforce strict institutional rules in real time, such as ensuring each student belongs to a single class/grade and educational level, limiting extracurricular participation to a **maximum of two (2) simultaneous sports per student**, preventing **schedule overlaps** between selected sports activities, and blocking **duplicate enrollments** across academic courses, sports, transportation routes, or the dining hall.
3. **Lack of Timely Management Reporting:** Delays and manual aggregation errors when compiling cross-referenced rosters and operational reports required by the School Administration (*Dirección*) for resource allocation, faculty scheduling, and service planning.
4. **Absence of Self-Service and Family Communication Channels:** Lack of an agile, secure digital channel for parents/guardians to consult their children's teachers and activities, complete online academic and service enrollments, and receive immediate confirmation of changes.

### **1.3 Proposed Solution and System Scope**

Continuing with the institutional automation workflow, the School Administration requires the development of a **Web-Based Integrated Management System** that unifies academic, extracurricular sports, and complementary service information under a single centralized database, guaranteeing data timeliness, transactional consistency, and strict role-based access control (**Administrator, Teacher, Parent/Guardian, and Student**).

In this stage of the project, the system is structured around **three main core modules** mandated by the institution, complemented by dedicated self-service capabilities for families:

* **Student Module (*Módulo de Alumnos*):** Centralizes student personal records (*Legajo*, DNI, full name, birth date, address, contact data, educational level, class/grade, and status), academic enrollments, extracurricular sports participation, complementary services (transportation routes and dining hall), and student/guardian inquiry interfaces.
* **Teacher Module (*Módulo de Docentes*):** Manages faculty personal and professional records (*Legajo*, DNI, full name, specialty, contact data, and status), assignments to multiple subjects across different classes/grades and educational levels, supervision of sports groups, and authenticated teacher self-consultation of assigned courses, subjects, rosters, and schedules.
* **Administration Module (*Módulo de Administración*):** Enables the School Administration to configure and maintain master institutional entities (educational levels, classes/grades, subjects, sports, schedules, transportation routes, dining hall service, users, and role permissions), oversee enrollments, and generate all **nine (9) institutional management reports** for decision-making support.

### **1.4 Project Objectives**

* **General Objective:** Develop and deploy a web-based integrated management system that centralizes and streamlines students' academic, extracurricular sports, and complementary service information, facilitating the daily operations of administrative staff, teachers, and parents/guardians while enforcing institutional business rules and role-based permissions.
* **Specific Objective 1 — Functional Completeness:** Implement the Administration, Teacher, Student, Enrollment & Services, Notification, and Reporting modules covering all mandatory institutional workflows and the 9 executive reports defined by the School Administration.
* **Specific Objective 2 — Transactional Integrity and Rule Enforcement:** Guarantee 100% automated validation of critical business rules—specifically the single class/level assignment per student, the maximum limit of two simultaneous sports, automatic schedule conflict detection, restriction to four predefined transportation routes, and prevention of duplicate enrollments.
* **Specific Objective 3 — Security, Performance, and Availability:** Ensure strict Role-Based Access Control (restricting teachers to their assigned courses and parents/guardians exclusively to their own children), response times under 1.5 seconds for standard transactional operations, and continuous platform availability throughout the academic year.

---

## **2. Requirements Specification (Functional and Non-Functional)**

Applying software engineering requirements standards (**clarity, atomicity, verifiability, non-ambiguity, priority classification, and bidirectional traceability to business rules**), the system's Functional Requirements (`RF`) and Non-Functional Requirements (`RNF`) are specified below.

### **2.1 Functional Requirements (`RF`)**

#### **A. Administration and Security Module**

* **RF-01 — Access Control, Authentication, and User Management (RBAC)** *(Priority: Mandatory)*
  * **RF-01.1:** The system must allow the Administrator to create, query, modify, and logically deactivate user accounts, assigning each account one or more system roles (`Administrator`, `Teacher`, `Parent/Guardian`, `Student`).
  * **RF-01.2:** The system must authenticate users via email/username and password, validating credentials and issuing a signed session token (JWT) containing the user's identity and active permissions.
  * **RF-01.3:** The system must allow the Administrator to link a `Parent/Guardian` user account to one or more `Student` records (parent-child association), enforcing that a guardian can only view and manage records of students explicitly linked to their account.
  * **RF-01.4:** The system must enforce Role-Based Access Control (RBAC) across both client views and backend API endpoints, denying unauthorized requests with an HTTP `401/403` status.

* **RF-02 — Registration of Reference Academic and Extracurricular Entities** *(Priority: Mandatory)*
  * **RF-02.1:** The system must allow the Administrator to register **Educational Levels** (*Inicial*, *Primario*, *Secundario*) with their respective code, name, and shift/extended schedule parameters.
  * **RF-02.2:** The system must allow the Administrator to register **Classes / Grades (*Cursos*)**, requiring each class to be strictly associated with a single Educational Level, maximum student capacity, and academic year.
  * **RF-02.3:** The system must allow the Administrator to register **Subjects (*Materias*)** (including core curriculum subjects and languages: English, Portuguese, French) and link them to the classes/grades where they are taught.
  * **RF-02.4:** The system must allow the Administrator to register **Sports (*Deportes*)** (Athletics, Swimming, Soccer, Martial Arts, Volleyball, Dance, Basketball, Chess) along with their base operational parameters.

* **RF-03 — Deactivation / Deletion of Reference Academic and Extracurricular Entities** *(Priority: Mandatory)*
  * **RF-03.1:** The system must allow the Administrator to logically deactivate or delete registered Educational Levels, Classes/Grades, Subjects, and Sports.
  * **RF-03.2:** Before executing any deletion or deactivation, the system must verify referential integrity (checking for active enrolled students, assigned teachers, or active schedules) and block destructive operations that would leave orphan records.

* **RF-04 — Modification of Reference Academic and Extracurricular Entities** *(Priority: Mandatory)*
  * **RF-04.1:** The system must allow the Administrator to edit and update the attributes of existing Educational Levels, Classes/Grades, Subjects, and Sports.
  * **RF-04.2:** The system must validate that updates to reference entities do not violate active enrollment constraints or create schedule inconsistencies.

* **RF-05 — Academic and Sports Schedule Management and Conflict Control** *(Priority: Mandatory)*
  * **RF-05.1:** The system must allow the Administrator to define and update timetables (day of the week, start time, end time, and facility/classroom) for academic subjects per class/grade and for extracurricular sports groups.
  * **RF-05.2:** When configuring schedules or processing enrollments, the system must automatically execute a time-interval intersection check (`Start_A < End_B AND Start_B < End_A` on the same day) to prevent schedule overlaps for the same class/grade, the same teacher, or the same student across sports activities.

* **RF-06 — Institutional Management Report Generation** *(Priority: Mandatory)*
  The system must allow the Administrator to generate, filter on screen, and export (PDF/CSV) the **nine (9) management reports** required by the School Administration for decision-making:
  * **RF-06.1 — Report by Student:** Displays for a selected student their assigned class/grade, enrolled subjects, assigned teacher for each subject, sports activities in which they participate, schedules for those sports activities, transportation service utilization (and assigned route), and dining hall/cafeteria service utilization.
  * **RF-06.2 — Report by Teacher:** Displays for a selected teacher their assigned classes/grades organized by educational level and the corresponding class/subject schedules.
  * **RF-06.3 — Student Roster by Class / Grade (*Listado de alumnos por curso*):** Displays Educational Level, Class/Grade, Student ID / File Number (*Legajo*), Last Name, and First Name.
  * **RF-06.4 — Student Roster by Subject (*Listado de alumnos por materia*):** Displays Educational Level, Class/Grade, Subject, Assigned Teacher, Student Full Name, and Student ID / File Number (*Legajo*).
  * **RF-06.5 — Teacher Roster by Educational Level (*Listado de docentes por nivel*):** Displays Educational Level, Teacher Full Name, Assigned Subjects, and Classes/Grades where they teach.
  * **RF-06.6 — Student Roster by Sport (*Listado de alumnos por deporte*) in its three (3) required analytical variants:**
    * **RF-06.6a (General Roster by Sport):** Displays Sport, Student Full Name, Class/Grade, and Educational Level.
    * **RF-06.6b (Roster by Sport and Educational Level):** Filters and groups enrolled students by Sport and Educational Level (*Inicial*, *Primario*, *Secundario*).
    * **RF-06.6c (Roster by Sport, Educational Level, Schedule, and Supervising Teacher):** Displays Sport, Educational Level, Group Schedule, Supervising Teacher in charge, and the enrolled Students.
  * **RF-06.7 — Student Roster by Transportation Service Route (*Listado de alumnos por ruta del servicio de transporte*):** Displays each of the 4 transportation routes and the complete roster of students enrolled in each route (Student ID/*Legajo*, Full Name, Educational Level, Class/Grade, and registered address/pickup data).

#### **B. Academic Module (Student Module and Teacher Module)**

* **RF-07 — Student and Teacher Record Management (*Gestión de Legajos*)** *(Priority: Mandatory)*
  * **RF-07.1 (Student Record Registration & Maintenance):** The system must allow the Administrator to register, modify, and logically deactivate Student records, capturing at a minimum all **eleven (11) mandatory attributes**:
    1. File Number / Student ID (*Legajo*) — unique institutional identifier
    2. National Identity Document (*DNI*) — unique identity number
    3. First Name (*Nombre*)
    4. Last Name (*Apellido*)
    5. Date of Birth (*Fecha de nacimiento*)
    6. Address (*Dirección*)
    7. Phone Number (*Teléfono*)
    8. Email Address (*Correo electrónico*)
    9. Educational Level (*Nivel educativo*)
    10. Class / Grade (*Curso*)
    11. Student Status (*Estado del alumno*: Active, Inactive)
  * **RF-07.2 (Single Class & Level Constraint):** The system must enforce that each student belongs to **exactly one (1) Class/Grade** and, through it, to **exactly one (1) Educational Level** in the active academic cycle, automatically deriving the student's curriculum subjects from their assigned class/grade.
  * **RF-07.3 (Teacher Record Registration & Maintenance):** The system must allow the Administrator to register, modify, and logically deactivate Teacher records, capturing at a minimum all **eight (8) mandatory attributes**:
    1. File Number / Employee ID (*Legajo*) — unique institutional identifier
    2. National Identity Document (*DNI*) — unique identity number
    3. First Name (*Nombre*)
    4. Last Name (*Apellido*)
    5. Specialty / Subject Area (*Especialidad*)
    6. Email Address (*Correo electrónico*)
    7. Phone Number (*Teléfono*)
    8. Status (*Estado*: Active / Inactive)
  * **RF-07.4 (Multi-Criteria Search):** The system must allow querying Student and Teacher records by File Number (*Legajo*), DNI, Last Name, Educational Level, Class/Grade, or Status.

* **RF-08 — Teacher Academic Assignment to Subjects and Classes** *(Priority: Mandatory)*
  * **RF-08.1:** The system must allow the Administrator to assign a teacher to one or multiple subjects across one or multiple classes/grades and educational levels.
  * **RF-08.2:** The system must allow the same subject to be taught across different classes/grades and to have different assigned teachers depending on the specific class/grade.
  * **RF-08.3:** The system must allow modifying or deactivating teacher-subject-class assignments while validating that the teacher does not incur an internal schedule overlap between two simultaneous classes.

* **RF-09 — Assignment of Sports Supervising Teachers and Sports Groups** *(Priority: Mandatory)*
  * **RF-09.1:** The system must require every sport discipline to have at least one assigned **Supervising Teacher (*Docente a cargo*)**.
  * **RF-09.2:** The system must allow configuring multiple **Sports Groups (*Grupos Deportivos*)** for the same sport, segmented by **Educational Level**, **Schedule (days and time slots)**, **Supervising Teacher**, and **Maximum Group Quota**.

* **RF-10 — Authenticated Teacher Activity Inquiry** *(Priority: Mandatory)*
  * **RF-10.1:** The system must allow an authenticated Teacher to consult their own assigned academic classes/grades per level, subjects, teaching schedules, and student rosters per class/subject.
  * **RF-10.2:** If the teacher is assigned as a supervising teacher for a sport, the system must allow them to view their assigned sports groups, schedules, and enrolled student rosters, strictly restricting visibility to their own assignments.

#### **C. Enrollments and Services Module**

* **RF-11 — Extracurricular Sports Enrollment and Cancellation Control** *(Priority: Mandatory)*
  * **RF-11.1 (Maximum 2 Sports Rule):** The system must allow enrolling a student (by the Administrator or by an authorized Parent/Guardian) in extracurricular sports groups, strictly enforcing a **maximum limit of two (2) active simultaneous sports enrollments per student**.
  * **RF-11.2 (Educational Level & Quota Validation):** The system must verify that the selected sports group matches the student's **Educational Level** and has available quota.
  * **RF-11.3 (Automatic Schedule Conflict Prevention):** Before confirming the second sport enrollment, the system must verify and prevent any **schedule overlap** between the newly selected sports group and the student's existing active sports enrollment(s).
  * **RF-11.4 (Duplicate Prevention & Cancellation):** The system must prevent duplicate active enrollments of the same student in the same sport and allow logical cancellation (*baja*) of an active sports enrollment, immediately freeing the student's sport slot and group quota.

* **RF-12 — Complementary Services Management (Transportation and Dining Hall)** *(Priority: Mandatory)*
  * **RF-12.1 (Four Predefined Transportation Routes):** The system must allow the Administrator to configure and maintain the **four (4) official routes** of the school transportation service (route code, name/zone description, schedule, and vehicle capacity) as well as the **Dining Hall / Cafeteria (*Comedor*)** service parameters.
  * **RF-12.2 (Transportation Enrollment):** The system must allow enrolling a student in the transportation service by requiring the selection of **exactly one (1) of the four (4) predefined routes**, preventing duplicate active transportation enrollments for the same student.
  * **RF-12.3 (Dining Hall Enrollment & Service Cancellations):** The system must allow enrolling a student in the dining hall/cafeteria service without duplicate active records, and allow modifying the assigned route or canceling (*baja*) either complementary service at any time.

#### **D. Parents / Guardians and Students Module**

* **RF-13 — Parent/Guardian Self-Service and Student Inquiry** *(Priority: Mandatory)*
  * **RF-13.1 (Multi-Child Association & Strict Isolation):** An authenticated Parent/Guardian associated with one or more children must be able to select each linked child and access exclusively that child's information, being strictly blocked from querying or modifying any unlinked student.
  * **RF-13.2 (Academic & Extracurricular Inquiry):** For each linked child, the Parent/Guardian must be able to view the assigned class/grade, educational level, complete list of **teachers by subject**, enrolled **sports activities and their schedules**, and active complementary services (transportation route and dining hall).
  * **RF-13.3 (Online Academic and Service Enrollment):** The Parent/Guardian must be able to execute their child's **online academic enrollment (*inscripción a la escolaridad/curso*)** for the school term, as well as self-manage enrollments and cancellations in **sports** (subject to all `RF-11` validations), **transportation service** (selecting 1 of the 4 routes), and **dining hall service** (`RF-12`).
  * **RF-13.4 (Student Read-Only Inquiry):** An authenticated Student user must be able to consult their own academic profile, class schedule, teachers by subject, enrolled sports, and complementary services in read-only mode.

* **RF-14 — Automated Parent Notifications (Value-Added Feature)** *(Priority: Desirable / Value-Added)*
  * **RF-14.1:** Upon recording a relevant transactional event involving a student—specifically confirmation or cancellation of academic enrollment, sports enrollment, transportation route assignment, dining hall enrollment, or schedule modification of an activity in which the student participates—the system must automatically dispatch an alert via **Email (SMTP)** to the associated Parent/Guardian and record the notification in the portal's internal inbox.

---

### **2.2 Functional Traceability Summary Table**

| ID | Module | Functional Requirement | Key Sub-Requirements | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **RF-01** | Administration & Security | Access Control, Authentication, and User Management (RBAC) | `RF-01.1` User CRUD & roles; `RF-01.2` JWT auth; `RF-01.3` Parent-Student link (`1:N`); `RF-01.4` API & view RBAC enforcement | **Mandatory** |
| **RF-02** | Administration & Security | Registration of Reference Academic & Extracurricular Entities | `RF-02.1` Levels; `RF-02.2` Classes/Grades; `RF-02.3` Subjects (incl. 3 languages); `RF-02.4` Sports (8 disciplines) | **Mandatory** |
| **RF-03** | Administration & Security | Deactivation / Deletion of Reference Entities | `RF-03.1` Logical deactivation/deletion; `RF-03.2` Referential integrity guard against orphan records | **Mandatory** |
| **RF-04** | Administration & Security | Modification of Reference Entities | `RF-04.1` Attribute updates for Levels, Classes, Subjects, Sports; `RF-04.2` Consistency validation | **Mandatory** |
| **RF-05** | Administration & Security | Schedule Management and Conflict Control | `RF-05.1` Academic & sports timetable definition; `RF-05.2` Automatic time-overlap detection | **Mandatory** |
| **RF-06** | Administration & Security | Institutional Management Report Generation (9 Reports) | `RF-06.1` By Student; `RF-06.2` By Teacher; `RF-06.3` Students by Class; `RF-06.4` Students by Subject; `RF-06.5` Teachers by Level; `RF-06.6a/b/c` Students by Sport (3 variants); `RF-06.7` Students by Bus Route | **Mandatory** |
| **RF-07** | Academic (Students & Teachers) | Student and Teacher Record Management (*Legajos*) | `RF-07.1` Student CRUD (11 mandatory fields); `RF-07.2` Single Class & Level constraint; `RF-07.3` Teacher CRUD (8 mandatory fields); `RF-07.4` Search by Legajo/DNI/filters | **Mandatory** |
| **RF-08** | Academic (Students & Teachers) | Teacher Academic Assignment | `RF-08.1` Multi-subject/multi-class assignment; `RF-08.2` Different teachers per subject by class; `RF-08.3` Update/deactivation & schedule check | **Mandatory** |
| **RF-09** | Academic (Students & Teachers) | Sports Supervising Teachers and Groups Management | `RF-09.1` Mandatory supervising teacher per sport; `RF-09.2` Sports groups by level, schedule, teacher, and quota | **Mandatory** |
| **RF-10** | Academic (Students & Teachers) | Authenticated Teacher Activity Inquiry | `RF-10.1` Own classes, subjects, schedules & rosters; `RF-10.2` Own supervised sports groups & rosters | **Mandatory** |
| **RF-11** | Enrollments & Services | Sports Enrollment and Cancellation Control | `RF-11.1` Max 2 active sports limit; `RF-11.2` Level & quota check; `RF-11.3` Schedule conflict prevention; `RF-11.4` No duplicates & logical cancellation | **Mandatory** |
| **RF-12** | Enrollments & Services | Complementary Services Management (Transportation & Dining) | `RF-12.1` 4 predefined bus routes & dining config; `RF-12.2` Single route enrollment; `RF-12.3` Dining enrollment, no duplicates & cancellations | **Mandatory** |
| **RF-13** | Parents / Guardians & Students | Guardian Self-Service and Student Inquiry | `RF-13.1` Multi-child strict isolation; `RF-13.2` View teachers by subject & sports; `RF-13.3` Online academic, sport, bus & dining enrollment; `RF-13.4` Student self-inquiry | **Mandatory** |
| **RF-14** | Parents / Guardians & Students | Automated Parent Notifications (Value-Added) | `RF-14.1` Real-time SMTP email & internal portal alerts on enrollments, cancellations, or schedule changes | **Desirable (Value-Added)** |

---

### **2.3 Non-Functional Requirements (`RNF`)**

| ID | Category | Non-Functional Requirement Specification | Verification Metric / Acceptance Criterion |
| :--- | :--- | :--- | :--- |
| **RNF-01** | **Security and RBAC Access Control** | All passwords must be hashed using **BCrypt** (minimum cost factor 10); sessions must be managed via signed **JWT tokens** transmitted exclusively over **HTTPS (TLS 1.2/1.3)**. Access control must be enforced at the backend API layer and reinforced via **PostgreSQL Row-Level Security (RLS)** so each role (`Administrator`, `Teacher`, `Parent/Guardian`, `Student`) accesses only authorized endpoints and parents only access their linked children's records. | 100% of unauthenticated or unauthorized cross-role/cross-child API requests return HTTP `401` or `403`; zero plain-text passwords in database. |
| **RNF-02** | **Performance and Response Time** | Standard transactional and validation operations (login, student/teacher lookup, schedule conflict check, sports/service enrollment verification) must complete in **under 1.5 seconds**, and complex multi-criteria management reports (`RF-06.1` to `RF-06.7`) must render in **under 3.0 seconds** under normal concurrent institutional load. | 95th percentile (`p95`) API response time `< 1.5s` for transactional endpoints and `<= 3.0s` for report queries under concurrent load testing. |
| **RNF-03** | **Transactional Integrity and ACID Concurrency** | All database write operations involving academic enrollment, the 2-sport limit per student, sports group quotas, and the 4 transportation routes must execute inside **atomic ACID transactions** supported by PostgreSQL **MVCC (Multi-Version Concurrency Control)** and unique composite constraints to prevent race conditions, overbooking, or duplicate enrollments. | Zero duplicate enrollments, zero students with `> 2` active sports, and zero schedule overlaps under concurrent enrollment simulation. |
| **RNF-04** | **Availability and Automated Backups** | The platform must maintain an operational availability of at least **99.5% during the academic year** (especially during peak March enrollment periods) and execute **automated daily database backups** with point-in-time recovery capabilities. | Uptime `>= 99.5%`; Recovery Time Objective (**RTO**) `< 2 hours` and Recovery Point Objective (**RPO**) `< 24 hours`. |
| **RNF-05** | **Usability and Responsive Web Design** | The web interface must implement a responsive design compatible with modern desktop, tablet, and mobile browsers (Chrome, Firefox, Edge, Safari), enabling parents/guardians and administrators to complete core workflows (enrollment, service selection, report generation) intuitively in **no more than 4 guided steps**. | 100% of core user workflows completable in `<= 4` clicks/steps with clean viewport adaptation from `360px` (mobile) to `1920px` (desktop). |
| **RNF-06** | **Organizational and Technological Continuity** | The management system must preserve technological and operational continuity with the institution's existing ecosystem: version control on **GitHub**, frontend deployment on **Vercel**, **React + TypeScript + Vite** frontend stack, **Node.js + Express + TypeScript** backend REST API, and **PostgreSQL (Supabase)** with reproducible SQL migrations for local development. | Unified repository standards, CI/CD automated deployment on Vercel, and 100% reproducible schema setup across local and cloud PostgreSQL environments. |

---

## **3. Information System Classification**

According to classical Information Systems taxonomy (**Laudon & Laudon**; **Kendall & Kendall**), the *"Educar para Transformar"* platform is classified as a **hybrid Management Information System (MIS) built upon an operational Transaction Processing System (TPS) foundation**:

### **3.1 Operational Foundation: Transaction Processing System (TPS)**

At the operational level, the system acts as a **TPS** that captures, validates, and persists the daily structured transactions of the educational center in real time:

* Registration and maintenance of Student and Teacher master records (*Legajos*, `RF-07`).
* Processing of academic course enrollments, extracurricular sports enrollments/cancellations, transportation route assignments, and dining hall subscriptions (`RF-11`, `RF-12`, `RF-13`).
* Automated execution of deterministic operational business rules within ACID transactions: verifying single class/level membership, checking the maximum cap of two active sports per student, computing schedule overlap validations (`RF-05`), and blocking duplicate records (`RNF-03`).

### **3.2 Tactical and Administrative Level: Management Information System (MIS)**

Built directly over the operational TPS database (without requiring a separate data warehouse), the system functions as an **MIS** designed to support middle and senior institutional management (*Dirección y Administración*):

* Transforms raw transactional data into structured, cross-referenced **management reports (`RF-06.1` through `RF-06.7`)**.
* Enables the School Administration to monitor class occupancy, verify faculty workload distribution across educational levels (`RF-06.2`, `RF-06.5`), audit student participation across the 8 sports disciplines by level, schedule, and supervising teacher (`RF-06.6a/b/c`), and optimize logistics across the 4 school bus routes (`RF-06.7`) and dining hall service.

### **3.3 Functional Scope and Technological Modality**

* **Organizational Scope — Integrated Enterprise-Wide Cross-Functional System:** Rather than isolated departmental silos, the platform integrates four institutional areas into a single cohesive workflow: **Administration/Secretariat**, **Academic/Faculty**, **Extracurricular & Complementary Services (Sports, Transportation, Dining)**, and **Families (Parents/Guardians & Students)**.
* **Technological Architecture — Centralized Web Client-Server System with RBAC:** Deployed as a single-source-of-truth web platform accessed via standard browsers over HTTPS, dynamically segmenting views and operations according to the user's authenticated role.

---

## **4. Information Architecture and Software Application Architecture**

### **4.1 Information Architecture**

Information architecture establishes how institutional data is structured, related, and governed independently of implementation details.

#### **4.1.1 Core Data Domains (Entities)**

1. **Security and Identity Domain:** `Role` (*Rol*), `Permission` (*Permiso*), `User` (*Usuario*), `User_Role` (*Usuario_Rol*).
2. **People Domain:** `Student` (*Alumno* — 11 core attributes), `Teacher` (*Docente* — 8 core attributes), `Parent_Guardian` (*Padre/Tutor*), and the associative link `Parent_Student` (*Padre_Alumno*).
3. **Academic Structure Domain:** `Educational_Level` (*Nivel Educativo*: Inicial, Primario, Secundario), `Class_Grade` (*Curso/Grado*), `Subject` (*Materia*), `Academic_Schedule` (*Horario Académico*).
4. **Extracurricular Sports Domain:** `Sport` (*Deporte* — 8 disciplines), `Sports_Group` (*Grupo Deportivo* defined by sport, educational level, schedule, supervising teacher, and quota).
5. **Complementary Services Domain:** `Transportation_Route` (*Ruta de Transporte* — 4 predefined routes), `Dining_Service` (*Servicio de Comedor*).
6. **Transactional / Associative Domain:** `Academic_Enrollment` (*Inscripción Escolar/Curso*), `Course_Subject_Teacher` (*Curso_Materia_Docente*), `Sport_Enrollment` (*Inscripción Deportiva*), `Transportation_Enrollment` (*Inscripción Transporte*), `Dining_Enrollment` (*Inscripción Comedor*), `Notification_Log` (*Registro de Notificaciones*).
7. **Public Institutional Portal Domain (Continuity):** Institutional content, admissions inquiries, and public communication channels linked to the management ecosystem.

#### **4.1.2 Key Relationships and Structural Business Rules (18 Institutional Rules)**

The relational data model enforces all **eighteen (18) institutional business rules** through primary keys, foreign keys, unique composite constraints, and transactional triggers:

1. **Single Class per Student (`1:N` between `Class_Grade` and `Student`):** Each student must belong to **exactly one (1) class/grade** in the active school year (`Student.class_id NOT NULL`).
2. **Single Educational Level per Class (`1:N` between `Educational_Level` and `Class_Grade`):** Each class/grade belongs to **exactly one (1) educational level** (*Inicial*, *Primario*, or *Secundario*), which transitively determines the student's unique educational level.
3. **Multiple Subjects per Student via Class Curriculum:** A student belongs to one class/grade and takes multiple subjects defined by that class/grade's curriculum.
4. **Subject Reusability Across Classes (`N:M` between `Class_Grade` and `Subject`):** A subject (e.g., Mathematics, English, Portuguese, French) can be taught across different classes/grades and educational levels.
5. **Different Teachers per Subject Depending on the Class:** The ternary/associative entity `Course_Subject_Teacher` allows the same subject to be assigned to different teachers depending on the specific class/grade.
6. **One Teacher Across Multiple Subjects and Classes:** A single teacher can be assigned to teach multiple subjects across multiple classes/grades and educational levels.
7. **Maximum of Two (2) Simultaneous Sports per Student:** In `Sport_Enrollment`, a student can hold at most **two (2) active sports enrollments** simultaneously (`COUNT(active enrollments per student) <= 2`).
8. **Prevention of Sports Schedule Conflicts:** When enrolling a student in a second sport, the system validates that the `Sports_Group` timetable does not overlap with the student's existing active sport schedule on the same day.
9. **Mandatory Supervising Teacher per Sport:** Every sport and `Sports_Group` must have an assigned **Supervising Teacher (*Docente a cargo*)**.
10. **Sports Groups Segmented by Level and Schedule (`1:N` between `Sport` and `Sports_Group`):** A single sport can have multiple distinct groups organized by Educational Level, Schedule, and Supervising Teacher.
11. **Transportation Service Structured into Four (4) Routes:** The `Transportation_Route` catalog restricts active operational routes to the **four (4) official predefined routes**.
12. **Single Route Selection for Transportation Enrollment:** A student enrolling in the transportation service (`Transportation_Enrollment`) must be assigned to **one (1) specific route** among the 4 available routes.
13. **Dining Hall Service Enrollment:** Each student may enroll in the cafeteria/dining service (`Dining_Enrollment`) with active status tracking.
14. **Prevention of Duplicate Enrollments:** Composite `UNIQUE` constraints on `(student_id, academic_year)` for schooling, `(student_id, sport_id)` for active sports, `(student_id)` for active transportation, and `(student_id)` for active dining hall strictly block duplicate enrollment records.
15. **Parent-to-Children Association (`N:M` / `1:N` via `Parent_Student`):** A parent/guardian can be associated with **one or more children** enrolled in the institution.
16. **Strict Parent Data Isolation:** A parent/guardian may **only consult and manage** information (teachers by subject, sports activities, academic enrollment, and complementary services) belonging to their own linked children.
17. **Comprehensive Administrator Authority:** The `Administrator` role has full authorization to configure, query, and manage all reference, academic, service, and user entities across the system, plus all 9 management reports.
18. **Strict Role-Based Permission Enforcement:** Every user role (`Administrator`, `Teacher`, `Parent/Guardian`, `Student`) can access exclusively the interfaces, endpoints, and records associated with their assigned permissions.

#### **4.1.3 Information Governance Principles**

* **Single Source of Truth (SSOT):** All actors (Administration, Teachers, Parents/Guardians, Students) and all 9 management reports query and mutate the same centralized relational repository, eliminating data silos and synchronization lags.
* **Role-Segmented Access (Principle of Least Privilege):** Data visibility is filtered both by role and by ownership relationship (a Teacher sees only their assigned courses/sports; a Parent sees only their linked children; an Administrator oversees the full institution).
* **Traceability and Logical Deletion (*Baja Lógica*):** Master records (`Student`, `Teacher`, `Class_Grade`, `Subject`, `Sport`) and enrollments preserve historical auditability through status flags (`ACTIVE`, `INACTIVE`, `CANCELLED`) and timestamps (`created_at`, `updated_at`, `created_by`) rather than destructive physical deletions.

#### **4.1.4 Ecosystem Continuity (Public Website, Web Management Portal, and Future Mobile App)**

The information architecture guarantees seamless continuity across three institutional touchpoints:
1. **Public Institutional Website (Already Developed):** Serves public institutional information, facilities, levels, and admission contact forms.
2. **Authenticated Web Management System (Core Scope of this Project):** Provides role-specific dashboards for Administration, Teachers, Parents/Guardians, and Students.
3. **Future Mobile Application Readiness:** Because all business rules and data access are exposed through a stateless REST API (`JSON/HTTPS`), a future mobile app for families can consume the exact same backend endpoints without re-engineering the database or validation logic.

---

### **4.2 Software Application Architecture**

#### **4.2.1 Executive Architectural Synthesis Table**

| Architectural Element | Description in the "Educar para Transformar" Project |
| :--- | :--- |
| **Architectural Style** | **3-Tier Layered Architecture (Presentation, Business Logic, Data)** over a **Client-Server Web** model with a decoupled **RESTful API**. |
| **Presentation Layer (Client)** | Single-Page Application (**SPA**) built with **React + TypeScript + Vite**, offering responsive role-based views (Administration, Teacher, Parent/Guardian, Student) and continuing the Public Institutional Website hosted on **Vercel**. |
| **Business Logic Layer (Backend)** | Stateless **REST API** built with **Node.js + Express + TypeScript**, structured internally into Routes → Controllers → Domain Services → Data Repositories/ORM. |
| **Data Persistence Layer** | Centralized **PostgreSQL** relational database managed on **Supabase** (with local PostgreSQL/Docker migration parity), enforcing ACID transactions, MVCC concurrency, referential integrity, and Row-Level Security (RLS). |
| **Security Mechanism** | **JWT** stateless authentication, **BCrypt** password hashing, **HTTPS** transport encryption, Express RBAC middleware, and PostgreSQL RLS policies. |
| **External Integrations** | **SMTP / Nodemailer** email delivery service for automated parent notifications (`RF-14`) and **GitHub + Vercel** for version control and continuous deployment (`RNF-06`). |

#### **4.2.2 Application of Software Design Principles**

* **Separation of Concerns (3-Tier Layering):** Presentation, business validation, and database persistence are strictly decoupled. UI modifications in React do not affect domain rules, and database optimization does not break client contracts.
* **Single Source of Truth and ACID Transactional Centralization:** Every enrollment and configuration write passes through the centralized backend service layer and executes inside PostgreSQL ACID transactions (`RNF-03`), preventing race conditions, overbooking of sports groups, exceeding the 2-sport cap, or duplicate service registrations.
* **Security by Design (Defense in Depth):** RBAC and parent-child ownership checks are enforced on every REST API request via backend middleware and database-level constraints (`RNF-01`), never relying solely on frontend route hiding.
* **High Availability and Resilience:** Stateless backend services combined with managed PostgreSQL automated daily backups ensure fault isolation and rapid recovery (`RNF-04`).
* **Decoupled Frontend/Backend via REST Contract:** The frontend communicates exclusively via standardized HTTP/JSON REST endpoints, facilitating maintainability, automated testing, and responsive multi-device usability (`RNF-05`).

#### **4.2.3 Functional Components by Layer**

1. **Presentation Layer (Institutional Web Portal — React + TypeScript):**
   * *Public Institutional Portal Module:* Existing institutional landing pages (levels, facilities, sports, languages, contact).
   * *Administration Dashboard:* Full CRUD management of students, teachers, levels, classes, subjects, sports, schedules, transportation routes, dining hall, users/roles, and interactive generation/export of the 9 management reports (`RF-01` to `RF-09`, `RF-11`, `RF-12`).
   * *Teacher Portal:* Authenticated workspace displaying assigned classes/grades by level, subjects, schedules, and student rosters (`RF-10`).
   * *Parent/Guardian Self-Service Portal:* Child selector (for families with multiple children), inquiry of teachers by subject and sports schedules, online academic term enrollment, self-service enrollment/cancellation in sports, transportation (4 routes), and dining hall, plus notification inbox (`RF-13`, `RF-14`).
   * *Student Portal:* Read-only consultation of personal academic record, class schedule, teachers, and enrolled activities (`RF-13.4`).

2. **Business Logic Layer (Backend REST API — Node.js + Express + TypeScript):**
   * *Authentication & Security Module:* Handles login, BCrypt verification, JWT issuance/validation, role guards, and parent-child ownership verification (`RF-01`, `RNF-01`).
   * *Academic & Personnel Module:* Manages Educational Levels, Classes/Grades, Subjects, Student records (11 fields), Teacher records (8 fields), and Teacher-Subject-Class assignments (`RF-02`, `RF-03`, `RF-04`, `RF-07`, `RF-08`, `RF-10`).
   * *Schedule & Conflict Engine Module:* Manages academic and sports timetables and runs deterministic interval-overlap detection (`RF-05`, `RF-09`).
   * *Enrollments & Complementary Services Module:* Orchestrates ACID transactions for academic enrollment, sports enrollment (enforcing `<= 2` active sports, matching level, no schedule overlap, no duplicates), transportation enrollment (4 predefined routes), and dining hall subscription (`RF-11`, `RF-12`, `RF-13`).
   * *Reporting Engine Module:* Executes optimized relational joins and aggregations to produce all 9 institutional reports (`RF-06.1` to `RF-06.7`) in real time (`RNF-02`).
   * *Notification Module:* Dispatches asynchronous transactional emails via SMTP/Nodemailer and persists internal portal alerts (`RF-14`).

3. **Data Layer (PostgreSQL on Supabase):**
   * *Relational Database Engine:* Central PostgreSQL schema enforcing primary/foreign keys, `UNIQUE` constraints, check constraints, and ACID transactions (`RNF-03`).
   * *Automated Backup & Recovery Subsystem:* Daily snapshots and point-in-time recovery (`RNF-04`).

#### **4.2.4 Architectural Constraints**

* **No Direct Client-to-Database Mutation:** The frontend client must never bypass the business logic layer for transactional writes; all validations (2-sport limit, schedule overlap, duplicate checks) must execute within backend ACID transactions.
* **Mandatory Transactional Wrapping:** Every enrollment or modification affecting quotas or schedules must run inside a `BEGIN ... COMMIT/ROLLBACK` transaction block (`RNF-03`).
* **Cross-Cutting Backend Authorization:** Every private REST endpoint must validate both the JWT role and resource ownership (specifically `parent_id -> student_id` for guardians and `teacher_id` for faculty) before returning or mutating data (`RNF-01`).
* **Encrypted Credentials:** Passwords must be stored exclusively as BCrypt hashes (`RNF-01`).
* **Domain Integrity Constraints:** A student cannot be saved without a single valid Class/Grade and Educational Level; active sports per student cannot exceed 2; transportation routes are strictly bounded to the 4 institutional routes.

#### **4.2.5 Architectural Connectors**

* **REST API over HTTPS (`JSON/HTTP`):** Primary communication connector between the React SPA (and future mobile client) and the Node.js/Express backend over TLS encryption.
* **JWT Bearer Token Connector:** Stateless security header (`Authorization: Bearer <token>`) carrying signed identity and role claims on every API request.
* **Relational Database Connector (ORM / SQL Pool over TLS):** Type-safe data access connector (Prisma / `pg` connection pool) linking the backend services to PostgreSQL on Supabase.
* **SMTP Connector (Nodemailer):** Asynchronous messaging connector linking the Notification Module to the institutional email server for parent alerts (`RF-14`).

---

### **4.3 Selected Technologies**

#### **4.3.1 Executive Technology Stack Table**

| Layer / Domain | Selected Technologies | Responsibility and Justification in the Project |
| :--- | :--- | :--- |
| **Frontend (Presentation Layer)** | **React 18+, TypeScript, Vite, React Router, Tailwind CSS / CSS Modules** | Builds the responsive Institutional Web Portal and role-based dashboards (`RNF-05`). Ensures 100% technological continuity with the already built Public Institutional Website (`RNF-06`), offering reusable UI components and compile-time type safety. |
| **Backend (Business Logic Layer)** | **Node.js, Express, TypeScript, JSON Web Tokens (`jsonwebtoken`), `bcrypt`, `nodemailer`, `zod`** | Implements the layered REST API, centralizing the 18 business rules, schedule conflict algorithms (`RF-05`), RBAC + parent-child isolation middleware (`RF-01`, `RNF-01`), report aggregation (`RF-06`), and SMTP email notifications (`RF-14`). |
| **Database Management System (Data Layer)** | **PostgreSQL (hosted on Supabase + local SQL migrations)** | Guarantees strict relational referential integrity, composite `UNIQUE` constraints against duplicates, **ACID transactions**, and **MVCC** concurrency control (`RNF-03`), alongside **Row-Level Security (RLS)** (`RNF-01`) and automated daily backups (`RNF-04`). |
| **Infrastructure, DevOps & Version Control** | **GitHub (Git), Vercel** | Provides collaborative source code management, branch protection, pull-request traceability, and automated continuous deployment (CI/CD) connected directly to the institution's existing Vercel hosting workflow (`RNF-06`). |

#### **4.3.2 Detailed Justification by Layer**

##### **1. Frontend: React + TypeScript + Vite (Deployed on Vercel)**
For the presentation layer, **React** with **TypeScript** and **Vite** is selected. This choice preserves direct continuity with the technology stack already adopted for the *"Educar para Transformar"* Public Institutional Website (`RNF-06`). React's component-based architecture allows sharing UI primitives (data tables, search filters, modal forms, schedule grids, and report viewers) across the four role-segmented workspaces (**Administrator, Teacher, Parent/Guardian, and Student**). **React Router** manages protected client-side routing according to the user's JWT role, while **TypeScript** guarantees end-to-end contract alignment between frontend forms (such as the 11 student fields and 8 teacher fields in `RF-07`) and backend API responses.

##### **2. Backend: Node.js + Express + TypeScript REST API**
For the business logic layer, **Node.js** with the **Express** framework and **TypeScript** is adopted to expose a clean, modular **REST API** structured into *Routes → Controllers → Services → Repositories*. Unifying the entire full-stack codebase under TypeScript reduces cognitive overhead for the development team and enables shared validation schemas (via **Zod**) between client and server. Its mature ecosystem directly fulfills the system's non-functional and functional requirements:
* **`bcrypt` & `jsonwebtoken`:** Provide industry-standard password hashing and stateless JWT authentication (`RF-01`, `RNF-01`).
* **Transactional Domain Services:** Encapsulate complex multi-step validations—such as verifying that a student has fewer than 2 active sports, belongs to the target educational level, and has zero schedule conflicts before committing a sports enrollment (`RF-05`, `RF-11`).
* **`nodemailer` (SMTP):** Drives the value-added automated notification engine (`RF-14`) to alert parents upon enrollment confirmations or schedule changes.

##### **3. Database Management System: PostgreSQL on Supabase (with Local Development Support)**
**PostgreSQL**, managed in the cloud through **Supabase** and supported locally via standard SQL migration scripts, is selected as the centralized relational database engine. Unlike NoSQL alternatives, PostgreSQL natively enforces the strict relational constraints demanded by the school's domain:
* **Referential Integrity & Composite Unique Constraints:** Guarantees that every `Student` belongs to exactly one `Class_Grade` and one `Educational_Level` (`RF-07.2`), that transportation routes are restricted to the 4 official routes (`RF-12.1`), and that duplicate enrollments are rejected at the database engine level.
* **ACID Transactions & MVCC Concurrency (`RNF-03`):** Prevents race conditions and overbooking when multiple parents or administrators simultaneously enroll students in sports groups or transportation routes.
* **Row-Level Security (RLS) & Automated Backups (`RNF-01`, `RNF-04`):** Reinforces access isolation per role and provides automated daily cloud backups with point-in-time recovery.

##### **4. Infrastructure and Continuity: GitHub + Vercel**
Version control is centralized on **GitHub** using structured feature branches and conventional commits, while **Vercel** hosts the web application with automated preview and production deployments on every merge (`RNF-06`). This infrastructure guarantees high availability (`RNF-04`), zero-configuration HTTPS (`RNF-01`), and seamless integration between the existing public institutional portal and the new authenticated management system.
