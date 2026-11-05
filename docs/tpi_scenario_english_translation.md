The educational center "EDUCAR PARA TRANSFORMAR" is a high-quality, private educational institution located on the outskirts of the city of Resistencia. It is scheduled to begin operations in March 2027, which is why it needs to initiate the automation process for its management activities. Therefore, it requires:

    - A management system

The educational center features:

	- Educational levels with extended school hours (full-day schedule)

	- Early Childhood / Kindergarten (Inicial)

	- Primary / Elementary School (Primario)

	- Secondary / High School (Secundario)

	- Student Support Services

	- Languages:

	- English

	- Portuguese

	- French

	- Facilities:

	- Swimming Pool

	- Soccer Fields

	- Athletics / Track and Field Track

	- Indoor Gymnasium

	- Cafeteria / Dining Hall

	- Sports:

	- Athletics / Track and Field

	- Swimming

	- Soccer

	- Martial Arts

	- Volleyball

	- Dance

	- Basketball

	- Chess

	- Shuttle / Bus Transportation Service

	- Computer, Physics, and Chemistry Laboratories

	- Dining Hall / Cafeteria

	- Infirmary / Nurse's Office

Continuing with the process automation workflow, the School Administration considers it necessary to implement a management system that centralizes information and streamlines academic, administrative, and extracurricular management.

## General Objective

Develop a web-based management system that enables **integrated management of students' academic, sports, and service information**, facilitating the work of teachers, parents, and administrative staff.

The system must ensure that information is kept up to date, consistent, and accessible according to corresponding user permissions.

In this stage of the project, three main modules will be developed:

	- Student Module

	- Teacher Module

	- Administration Module

## Student Module:

This module will allow users to query and manage student-related information. Each student record will contain, at a minimum:

	- File Number / Student ID (Legajo).

	- National ID (DNI).

	- First Name.

	- Last Name.

	- Date of Birth.

	- Address.

	- Phone Number.

	- Email Address.

	- Educational Level.

	- Class / Grade (Curso).

	- Student Status.

## Teacher Module:

This module will manage faculty/teacher information. Each teacher record will contain:

	- File Number / Employee ID (Legajo).

	- National ID (DNI).

	- First Name.

	- Last Name.

	- Specialty / Subject Area.

	- Email Address.

	- Phone Number.

	- Status.

The system must allow the registration of the subjects assigned to the teacher and the classes/levels where they teach.

## Administration Module:

The administrator will be responsible for configuring and maintaining general system data. They will be able to manage:

	- Students.

	- Teachers.

	- Educational Levels.

	- Classes / Grades.

	- Subjects.

	- Sports.

	- Schedules / Timetables.

	- Enrollments.

	- Transportation Service.

	- Cafeteria / Dining Service.

	- Users and Permissions.

Additionally, the administrator will have access to all reports defined by the School Administration.

The system must also enable decision-making support by generating the following reports:

	- By Student:

		- Assigned class/grade.

		- Enrolled subjects.

		- Teachers for each subject.

		- Sports activities in which they participate.

		- Schedules for sports activities.

		- Utilization of the transportation service.

		- Utilization of the dining/cafeteria service.

	- By Teacher:

		- Assigned classes/grades per educational level.

		- Class schedules.

	- Student roster by class/grade, which must display:

		- Educational level.

		- Class / Grade.

		- Student ID / File number.

		- Last name.

		- First name.

	- Student roster by subject, which must display:

		- Educational level.

		- Class / Grade.

		- Subject.

		- Assigned teacher.

		- Student.

		- Student ID / File number.

	- Teacher roster by educational level, which must display:

		- Educational level.

		- Teacher.

		- Assigned subjects.

		- Classes / Grades.

	- Student roster by sport, which must display:

		- Sport.

		- Student.

		- Class / Grade.

		- Educational level.

	- Student roster by sport and level.

	- Student roster by sport, level, schedule, and supervising teacher.

	- Student roster by transportation service route.

## Business Rules:

	- Each student can:

		- Enroll in up to two sports simultaneously.

		- Enroll in the transportation service for a specific route.

		- Enroll in the cafeteria/dining service.

	- Parents can access the following information for each of their children:

		- Teachers by subject.

		- Enrolled sports activities.

		- Enroll their child in the academic term/classes.

	- A student belongs to one class/grade and may take multiple subjects.

	- A subject can be taught by one teacher across different classes.

	- The system must verify and prevent scheduling conflicts between the sports activities selected by students.

	- The transportation service consists of four routes.

	- Each student must belong to exactly one class/grade.

	- Each class belongs to a single educational level.

	- A subject can be taught across different classes.

	- A subject can have different teachers depending on the class.

	- Each sport must have an assigned teacher in charge.

	- A sport can have different groups based on level and schedule.

	- A parent can be associated with one or more children.

	- A parent may only consult and manage information regarding their own children.

	- The administrator can manage all information across the system.

	- The system must prevent duplicate enrollment records.

	- The administrator must ensure that each user role can only access system areas associated with their assigned permissions.