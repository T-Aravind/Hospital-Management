USE hospital_db;


---------------------------------------------------
-- 1. Department-wise Patient Count
---------------------------------------------------

SELECT
dep.Department_Name,
COUNT(a.Admission_ID) AS Total_Patients

FROM Admissions a

JOIN Doctors d
ON a.Doctor_ID = d.Doctor_ID

JOIN Departments dep
ON d.Department_ID = dep.Department_ID

GROUP BY dep.Department_Name

ORDER BY Total_Patients DESC;



---------------------------------------------------
-- 2. Department-wise Revenue
---------------------------------------------------

SELECT

dep.Department_Name,

ROUND(SUM(b.Amount_Paid),2) AS Total_Revenue

FROM Billing b

JOIN Admissions a
ON b.Admission_ID=a.Admission_ID

JOIN Doctors d
ON a.Doctor_ID=d.Doctor_ID

JOIN Departments dep
ON d.Department_ID=dep.Department_ID

GROUP BY dep.Department_Name

ORDER BY Total_Revenue DESC;



---------------------------------------------------
-- 3. Top 10 Highest Revenue Doctors
---------------------------------------------------

SELECT

d.Doctor_Name,

dep.Department_Name,

ROUND(SUM(b.Amount_Paid),2) AS Revenue


FROM Billing b


JOIN Admissions a
ON b.Admission_ID=a.Admission_ID


JOIN Doctors d
ON a.Doctor_ID=d.Doctor_ID


JOIN Departments dep
ON d.Department_ID=dep.Department_ID


GROUP BY 
d.Doctor_Name,
dep.Department_Name


ORDER BY Revenue DESC

LIMIT 10;



---------------------------------------------------
-- 4. Average Patient Age
---------------------------------------------------

SELECT

ROUND(AVG(Age),2) AS Average_Age

FROM Patients;



---------------------------------------------------
-- 5. Gender Distribution
---------------------------------------------------

SELECT

Gender,

COUNT(*) AS Patient_Count

FROM Patients

GROUP BY Gender;



---------------------------------------------------
-- 6. Blood Group Distribution
---------------------------------------------------

SELECT

Blood_Group,

COUNT(*) AS Patients

FROM Patients

GROUP BY Blood_Group

ORDER BY Patients DESC;



---------------------------------------------------
-- 7. Most Common Treatment
---------------------------------------------------

SELECT

Treatment_Name,

COUNT(*) AS Total_Treatments

FROM Treatments

GROUP BY Treatment_Name

ORDER BY Total_Treatments DESC;



---------------------------------------------------
-- 8. Treatment Success Rate
---------------------------------------------------

SELECT

Outcome,

COUNT(*) AS Cases

FROM Treatments

GROUP BY Outcome;



---------------------------------------------------
-- 9. Average Treatment Cost
---------------------------------------------------

SELECT

ROUND(AVG(Treatment_Cost),2)
AS Average_Treatment_Cost

FROM Billing;



---------------------------------------------------
-- 10. Insurance Usage Analysis
---------------------------------------------------

SELECT

Insurance,

COUNT(*) AS Patients

FROM Billing

GROUP BY Insurance;



---------------------------------------------------
-- 11. Total Hospital Revenue
---------------------------------------------------

SELECT

ROUND(SUM(Amount_Paid),2)
AS Total_Revenue

FROM Billing;



---------------------------------------------------
-- 12. Average Length Of Stay
---------------------------------------------------

SELECT

ROUND(AVG(DATEDIFF(Discharge_Date, Admission_Date)),2)
AS Average_Stay

FROM Admissions;



---------------------------------------------------
-- 13. Readmission Analysis
---------------------------------------------------

SELECT

Readmission,

COUNT(*) AS Cases

FROM Admissions

GROUP BY Readmission;



---------------------------------------------------
-- 14. Average Waiting Time Department Wise
---------------------------------------------------

SELECT

dep.Department_Name,

ROUND(
AVG(a.Waiting_Time_Minutes),2
)
AS Avg_Wait_Time


FROM Admissions a


JOIN Doctors d
ON a.Doctor_ID=d.Doctor_ID


JOIN Departments dep
ON d.Department_ID=dep.Department_ID


GROUP BY dep.Department_Name


ORDER BY Avg_Wait_Time DESC;



---------------------------------------------------
-- 15. Monthly Admission Trend
---------------------------------------------------

SELECT

MONTH(Admission_Date) AS Month,

COUNT(*) AS Admissions


FROM Admissions

GROUP BY MONTH(Admission_Date)

ORDER BY Month;



---------------------------------------------------
-- 16. City-wise Patient Count
---------------------------------------------------

SELECT

City,

COUNT(*) AS Patients


FROM Patients

GROUP BY City

ORDER BY Patients DESC;



---------------------------------------------------
-- 17. Doctor Experience vs Revenue
---------------------------------------------------

SELECT

d.Doctor_Name,

d.Experience_Years,

ROUND(SUM(b.Amount_Paid),2) AS Revenue


FROM Doctors d


JOIN Admissions a
ON d.Doctor_ID=a.Doctor_ID


JOIN Billing b
ON a.Admission_ID=b.Admission_ID


GROUP BY

d.Doctor_Name,
d.Experience_Years


ORDER BY Revenue DESC;



---------------------------------------------------
-- 18. Most Occupied Bed Types
---------------------------------------------------

SELECT

Bed_Type,

COUNT(*) AS Total_Beds

FROM Beds

GROUP BY Bed_Type;



---------------------------------------------------
-- 19. Emergency Department Load
---------------------------------------------------

SELECT

COUNT(*) AS Emergency_Cases

FROM Admissions a

JOIN Doctors d

ON a.Doctor_ID=d.Doctor_ID

JOIN Departments dep

ON d.Department_ID=dep.Department_ID

WHERE dep.Department_Name='Emergency';



---------------------------------------------------
-- 20. Highest Billing Patients
---------------------------------------------------

SELECT

a.Patient_ID,

ROUND(SUM(b.Amount_Paid),2)
AS Total_Paid


FROM Billing b


JOIN Admissions a

ON b.Admission_ID=a.Admission_ID


GROUP BY a.Patient_ID


ORDER BY Total_Paid DESC


LIMIT 10;