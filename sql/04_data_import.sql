-- =====================================================
-- HOSPITAL OPERATIONS INTELLIGENCE DATABASE
-- Script 04: Data Import (CSV to MySQL)
-- =====================================================

USE hospital_db;

-- -----------------------------------------------------
-- Option A: Using LOAD DATA LOCAL INFILE
-- Note: Ensure local_infile is enabled in MySQL server and client.
-- SET GLOBAL local_infile = 1;
-- -----------------------------------------------------

-- 1. Disable Foreign Key Checks for bulk insertion
SET FOREIGN_KEY_CHECKS = 0;

-- 2. Clear existing transactional & master data (if re-importing)
TRUNCATE TABLE Billing;
TRUNCATE TABLE Treatments;
TRUNCATE TABLE Admissions;
TRUNCATE TABLE Beds;
TRUNCATE TABLE Doctors;
TRUNCATE TABLE Patients;

-- -----------------------------------------------------
-- 1. Import Doctors
-- -----------------------------------------------------
LOAD DATA LOCAL INFILE 'data/doctors.csv'
INTO TABLE Doctors
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Doctor_ID, Doctor_Name, Gender, Department_ID, Experience_Years, Qualification, Consultation_Fee);

-- -----------------------------------------------------
-- 2. Import Patients
-- -----------------------------------------------------
LOAD DATA LOCAL INFILE 'data/patients.csv'
INTO TABLE Patients
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Patient_ID, Patient_Name, Age, Gender, Blood_Group, City, Phone);

-- -----------------------------------------------------
-- 3. Import Beds
-- -----------------------------------------------------
LOAD DATA LOCAL INFILE 'data/beds.csv'
INTO TABLE Beds
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Bed_ID, Ward, Room_Number, Bed_Type, Department_ID);

-- -----------------------------------------------------
-- 4. Import Admissions
-- Note: CSV contains Length_of_Stay which is mapped to @dummy_stay
-- -----------------------------------------------------
LOAD DATA LOCAL INFILE 'data/admissions.csv'
INTO TABLE Admissions
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Admission_ID, Patient_ID, Doctor_ID, Bed_ID, Disease, Admission_Type, Admission_Date, Admission_Time, Waiting_Time_Minutes, Discharge_Date, @dummy_stay, Readmission);

-- -----------------------------------------------------
-- 5. Import Treatments
-- -----------------------------------------------------
LOAD DATA LOCAL INFILE 'data/treatments.csv'
INTO TABLE Treatments
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Treatment_ID, Admission_ID, Treatment_Name, Surgery, Outcome);

-- -----------------------------------------------------
-- 6. Import Billing
-- -----------------------------------------------------
LOAD DATA LOCAL INFILE 'data/billing.csv'
INTO TABLE Billing
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 1 ROWS
(Bill_ID, Admission_ID, Treatment_Cost, Medicine_Cost, Room_Charges, Insurance, Amount_Paid);

-- 3. Re-enable Foreign Key Checks
SET FOREIGN_KEY_CHECKS = 1;

-- -----------------------------------------------------
-- Verification Counts
-- -----------------------------------------------------
SELECT 'Departments' AS Table_Name, COUNT(*) AS Total_Records FROM Departments
UNION ALL
SELECT 'Doctors', COUNT(*) FROM Doctors
UNION ALL
SELECT 'Patients', COUNT(*) FROM Patients
UNION ALL
SELECT 'Beds', COUNT(*) FROM Beds
UNION ALL
SELECT 'Admissions', COUNT(*) FROM Admissions
UNION ALL
SELECT 'Treatments', COUNT(*) FROM Treatments
UNION ALL
SELECT 'Billing', COUNT(*) FROM Billing;
