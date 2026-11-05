The educational center "EDUCAR PARA TRANSFORMAR" is a high-quality, private educational institution located on the outskirts of the city of Resistencia. It is scheduled to begin operations in March 2027, which is why it needs to initiate the automation process for its management activities. Therefore, it requires:

    - A management system
	- A mobile app

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

PART-3 – AI-INTEGRATED MOBILE APPLICATION

# **General Objective**

**Develop a mobile application that enables the integrated management of fee payments, cafeteria, sports, and transportation, using Artificial Intelligence as a support tool for development and integration with an existing web application and database.**

The system must ensure that information is up to date, consistent, and available according to each user's permissions.

The system must be expanded through a **mobile application** that centralizes and facilitates the management of:

* tuition/fees;
* cafeteria;
* sports;
* transportation.

The new application must integrate with existing information, preventing data duplication and inconsistencies.

Students must use **Artificial Intelligence tools during the development process**, but they will be responsible for analyzing, verifying, adapting, and validating the solutions proposed by the AI.

AI does not replace the developer's analysis or responsibility. Any generated code, design, or solution must be understood and justified by the team.

# **Initial Condition**

Each team will work on top of the previously developed system.

The mobile application must **reuse and integrate with existing services and data**.

# **Requirements:**

* Send an email reminder on the last business day of the month with the total amount each parent must pay, detailing the breakdown of that amount. Attach the invoice.
* Send an email on the 20th of each month to each parent detailing any outstanding debt if the full payment has not been made.
* From the Mobile Application:
* Per student:
* List of invoices and associated payment receipts within a date range.
* Debt history, broken down by each payment item.




* From the Web Application:
* List of revenue by time period.
* List of completed payments within a time period, broken down by academic year and corresponding student.
* List of incomplete payments within a time period, broken down by academic year and corresponding student.
* List of student payments by sport, level, schedule, and assigned teacher/coach.
* List of student payments by transportation route.



# **Module 1 – Authentication**

The user must be able to:

* log in;
* log out;
* recover or change password, if existing infrastructure permits;
* access only the functionalities corresponding to their role.

# **Module 2 – Fee Management**

The application must allow users to view:

* pending fees;
* paid fees;
* due dates;
* amounts;
* fee status;
* payment history.

# **Business Rules:**

* Administrators are the only users permitted to define the rates for tuition/fees, sports, transportation, and cafeteria services.
* Parents can select the items to pay. The system must issue a payment receipt.
* Each route and sport has differentiated pricing.
* Cash payments are not accepted.
* Payments are made via bank transfer.
* Parents must upload the proof of payment associated with the corresponding invoice. Note that an invoice may have more than one proof of payment linked to it.
* The transportation service is optional and may vary from month to month.
* Each student can:
* enroll in up to two sports simultaneously;
* enroll in the transportation service by route;
* enroll in the cafeteria service.


* Parents can access the following information for each child:
* Enrollment in sports, transportation service, and cafeteria.