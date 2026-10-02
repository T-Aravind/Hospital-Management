USE hospital_db;

-- =====================================================
-- VIEW 1 : Patient Admission View
-- =====================================================

DROP VIEW IF EXISTS patient_admission_view;

CREATE VIEW patient_admission_view AS

SELECT

    p.Patient_ID,
    p.Patient_Name,
    p.Age,
    p.Gender,
    p.Blood_Group,
    p.City,

    a.Admission_ID,
    a.Disease,
    a.Admission_Type,
    a.Admission_Date,
    a.Admission_Time,
    a.Waiting_Time_Minutes,
    a.Discharge_Date,
    a.Readmission,

    DATEDIFF(a.Discharge_Date, a.Admission_Date) AS Length_of_Stay,

    doc.Doctor_ID,
    doc.Doctor_Name,
    doc.Experience_Years,
    doc.Qualification,

    d.Department_ID,
    d.Department_Name,

    b.Bed_ID,
    b.Ward,
    b.Room_Number,
    b.Bed_Type

FROM Patients p

JOIN Admissions a
ON p.Patient_ID = a.Patient_ID

JOIN Doctors doc
ON a.Doctor_ID = doc.Doctor_ID

JOIN Departments d
ON doc.Department_ID = d.Department_ID

JOIN Beds b
ON a.Bed_ID = b.Bed_ID;



-- =====================================================
-- VIEW 2 : Doctor Performance View
-- =====================================================

DROP VIEW IF EXISTS doctor_performance_view;

CREATE VIEW doctor_performance_view AS

SELECT

    doc.Doctor_ID,
    doc.Doctor_Name,
    d.Department_Name,

    COUNT(DISTINCT a.Admission_ID) AS Total_Patients,

    COUNT(DISTINCT t.Treatment_ID) AS Total_Treatments,

    SUM(
        CASE
            WHEN t.Outcome='Recovered'
            THEN 1
            ELSE 0
        END
    ) AS Successful_Cases,

    SUM(
        CASE
            WHEN t.Surgery='Yes'
            THEN 1
            ELSE 0
        END
    ) AS Total_Surgeries

FROM Doctors doc

JOIN Departments d
ON doc.Department_ID = d.Department_ID

LEFT JOIN Admissions a
ON doc.Doctor_ID = a.Doctor_ID

LEFT JOIN Treatments t
ON a.Admission_ID = t.Admission_ID

GROUP BY

    doc.Doctor_ID,
    doc.Doctor_Name,
    d.Department_Name;



-- =====================================================
-- VIEW 3 : Department Performance View
-- =====================================================

DROP VIEW IF EXISTS department_performance_view;

CREATE VIEW department_performance_view AS

SELECT

    d.Department_ID,
    d.Department_Name,

    COUNT(DISTINCT doc.Doctor_ID) AS Total_Doctors,

    COUNT(DISTINCT a.Patient_ID) AS Total_Patients,

    COUNT(DISTINCT a.Admission_ID) AS Total_Admissions,

    ROUND(SUM(b.Amount_Paid),2) AS Total_Revenue,

    ROUND(AVG(b.Amount_Paid),2) AS Average_Bill

FROM Departments d

LEFT JOIN Doctors doc
ON d.Department_ID = doc.Department_ID

LEFT JOIN Admissions a
ON doc.Doctor_ID = a.Doctor_ID

LEFT JOIN Billing b
ON a.Admission_ID = b.Admission_ID

GROUP BY

    d.Department_ID,
    d.Department_Name;



-- =====================================================
-- VIEW 4 : Billing Summary View
-- =====================================================

DROP VIEW IF EXISTS billing_summary_view;

CREATE VIEW billing_summary_view AS

SELECT

    p.Patient_ID,
    p.Patient_Name,

    COUNT(b.Bill_ID) AS Total_Bills,

    SUM(b.Treatment_Cost) AS Treatment_Cost,

    SUM(b.Medicine_Cost) AS Medicine_Cost,

    SUM(b.Room_Charges) AS Room_Charges,

    SUM(b.Amount_Paid) AS Total_Amount_Paid

FROM Patients p

JOIN Admissions a
ON p.Patient_ID = a.Patient_ID

JOIN Billing b
ON a.Admission_ID = b.Admission_ID

GROUP BY

    p.Patient_ID,
    p.Patient_Name;



-- =====================================================
-- VIEW 5 : Treatment Outcome View
-- =====================================================

DROP VIEW IF EXISTS treatment_outcome_view;

CREATE VIEW treatment_outcome_view AS

SELECT

    Treatment_Name,

    Outcome,

    COUNT(*) AS Total_Cases,

    SUM(
        CASE
            WHEN Surgery='Yes'
            THEN 1
            ELSE 0
        END
    ) AS Surgery_Count

FROM Treatments

GROUP BY

    Treatment_Name,
    Outcome;



-- =====================================================
-- VIEW 6 : Monthly Admissions View
-- =====================================================

DROP VIEW IF EXISTS monthly_admission_view;

CREATE VIEW monthly_admission_view AS

SELECT

    YEAR(Admission_Date) AS Year,

    MONTH(Admission_Date) AS Month,

    COUNT(*) AS Total_Admissions

FROM Admissions

GROUP BY

    YEAR(Admission_Date),
    MONTH(Admission_Date);



-- =====================================================
-- VIEW 7 : Disease Analysis View
-- =====================================================

DROP VIEW IF EXISTS disease_analysis_view;

CREATE VIEW disease_analysis_view AS

SELECT

    Disease,

    COUNT(*) AS Total_Cases

FROM Admissions

GROUP BY Disease

ORDER BY Total_Cases DESC;