USE hospital_db;


---------------------------------------------------
-- DATABASE CHECK
---------------------------------------------------

SHOW TABLES;



---------------------------------------------------
-- TABLE RECORD COUNTS
---------------------------------------------------

SELECT COUNT(*) AS Departments
FROM Departments;


SELECT COUNT(*) AS Doctors
FROM Doctors;


SELECT COUNT(*) AS Patients
FROM Patients;


SELECT COUNT(*) AS Beds
FROM Beds;


SELECT COUNT(*) AS Admissions
FROM Admissions;


SELECT COUNT(*) AS Treatments
FROM Treatments;


SELECT COUNT(*) AS Billing
FROM Billing;



---------------------------------------------------
-- SAMPLE DATA VIEW
---------------------------------------------------

SELECT *
FROM Doctors
LIMIT 5;


SELECT *
FROM Patients
LIMIT 5;


SELECT *
FROM Admissions
LIMIT 5;


SELECT *
FROM Treatments
LIMIT 5;


SELECT *
FROM Billing
LIMIT 5;



---------------------------------------------------
-- PATIENT BASIC STATISTICS
---------------------------------------------------

SELECT

MIN(Age) AS Youngest_Patient,

MAX(Age) AS Oldest_Patient,

ROUND(AVG(Age),2) AS Average_Age

FROM Patients;



---------------------------------------------------
-- DOCTOR BASIC STATISTICS
---------------------------------------------------

SELECT

MIN(Experience_Years) AS Minimum_Experience,

MAX(Experience_Years) AS Maximum_Experience,

ROUND(AVG(Experience_Years),2) AS Average_Experience

FROM Doctors;



---------------------------------------------------
-- GENDER COUNT
---------------------------------------------------

SELECT

Gender,

COUNT(*) AS Count

FROM Patients

GROUP BY Gender;



---------------------------------------------------
-- DEPARTMENT LIST
---------------------------------------------------

SELECT *

FROM Departments;



---------------------------------------------------
-- BED TYPE DISTRIBUTION CHECK
---------------------------------------------------

SELECT

Bed_Type,

COUNT(*) AS Total

FROM Beds

GROUP BY Bed_Type;



---------------------------------------------------
-- TREATMENT OUTCOME CHECK
---------------------------------------------------

SELECT

Outcome,

COUNT(*) AS Cases

FROM Treatments

GROUP BY Outcome;



---------------------------------------------------
-- INSURANCE CHECK
---------------------------------------------------

SELECT

Insurance,

COUNT(*) AS Count

FROM Billing

GROUP BY Insurance;