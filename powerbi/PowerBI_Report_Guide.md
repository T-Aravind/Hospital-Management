# Power BI Dashboard Implementation & Reporting Guide
## Hospital Operations Intelligence Dashboard

---

## 1. Overview

This guide details how to build and configure the **Hospital Operations Intelligence Dashboard** in **Microsoft Power BI Desktop**. The dashboard visualizes operational efficiency, bed capacity, physician productivity, emergency triage times, clinical outcomes, and financial performance across the hospital network.

---

## 2. Data Ingestion Options

You can connect Power BI using either of the following methods:

### Option A: Direct MySQL Database Connection (Recommended)
1. Open **Power BI Desktop**.
2. Click **Get Data** -> **MySQL Database**.
3. **Server:** `localhost`
4. **Database:** `hospital_db`
5. Select either:
   - **All 7 Base Tables:** `Departments`, `Doctors`, `Patients`, `Beds`, `Admissions`, `Treatments`, `Billing`
   - **OR Pre-built SQL Views:** `patient_admission_view`, `doctor_performance_view`, `department_performance_view`, `billing_summary_view`, `treatment_outcome_view`, `monthly_admission_view`, `disease_analysis_view`.

### Option B: Local CSV Import
1. Click **Get Data** -> **Text/CSV**.
2. Navigate to the `/data/` folder and import:
   - `admissions.csv`
   - `beds.csv`
   - `billing.csv`
   - `doctors.csv`
   - `patients.csv`
   - `treatments.csv`

---

## 3. Data Modeling & Relationship Diagram (Star Schema)

In the **Model View**, configure the relationships with **Single Direction** cross-filter (1-to-Many `1:*`):

```
       [Departments] (1)
        /          \
      (1)           (1)
       |             |
       v             v
   [Doctors]       [Beds]
       \             /
      (1)           (1)
        \           /
         v         v
       [Admissions] <------- (1) [Patients]
         /        \
       (1)        (1)
        |          |
        v          v
   [Treatments]  [Billing]
```

### Relationship Key Pairs:
- `Departments[Department_ID]` (1) ---> `Doctors[Department_ID]` (*)
- `Departments[Department_ID]` (1) ---> `Beds[Department_ID]` (*)
- `Patients[Patient_ID]` (1) ---------> `Admissions[Patient_ID]` (*)
- `Doctors[Doctor_ID]` (1) -----------> `Admissions[Doctor_ID]` (*)
- `Beds[Bed_ID]` (1) -----------------> `Admissions[Bed_ID]` (*)
- `Admissions[Admission_ID]` (1) -----> `Treatments[Admission_ID]` (1)
- `Admissions[Admission_ID]` (1) -----> `Billing[Admission_ID]` (1)

---

## 4. Calculated Columns & Date Hierarchy

Create the following calculated columns in the `Admissions` table:

```dax
-- Year
Admission Year = YEAR('Admissions'[Admission_Date])

-- Month Name
Admission Month = FORMAT('Admissions'[Admission_Date], "MMM")

-- Month Number (for sorting)
Month Number = MONTH('Admissions'[Admission_Date])

-- Day of Week
Day of Week = FORMAT('Admissions'[Admission_Date], "dddd")

-- Length of Stay (Calculated Days)
Length of Stay Days = DATEDIFF('Admissions'[Admission_Date], 'Admissions'[Discharge_Date], DAY)
```

---

## 5. Report Pages & Visual Wireframe Specifications

### 📊 Page 1: Executive Overview & Operational KPIs
- **Header:** Hospital Operations Executive Intelligence | Timeframe: 2024–2025
- **Top KPI Cards (Row 1):**
  - **Card 1:** Total Admissions (`[Total Admissions]` -> 15,000)
  - **Card 2:** Total Revenue (`[Total Revenue Collected]` -> Formatted in INR `₹`)
  - **Card 3:** Average Length of Stay (`[Average Length of Stay (Days)]` -> ~3.1 Days)
  - **Card 4:** Average Wait Time (`[Average Waiting Time (Mins)]` -> ~35.4 Mins)
  - **Card 5:** Readmission Rate (`[Readmission Rate %]` -> ~10.0%)
- **Visualizations (Row 2 & 3):**
  - **Combo Line & Clustered Column Chart:** Monthly Trend of Admissions vs Total Revenue (X: `Admission Month`, Y: `Total Admissions`, Line Y: `Total Revenue Collected`).
  - **Donut Chart:** Admission Triage Breakdown (`Admission_Type`: Emergency vs Inpatient vs Outpatient).
  - **Clustered Bar Chart:** Department Admissions & Revenue Comparison (Y: `Department_Name`, X: `Total Admissions` & `Total Revenue Collected`).
- **Slicers:** `Admission Year` (2024, 2025), `Department_Name`, `Admission_Type`.

---

### 👨‍⚕️ Page 2: Department & Doctor Performance
- **Top KPI Cards:**
  - Active Doctors (`[Total Active Doctors]` -> 80)
  - Average Experience (`[Average Doctor Experience]` -> ~15.8 Yrs)
  - Total Surgeries (`[Total Surgeries]`)
  - Revenue Per Doctor (`[Revenue Per Doctor]`)
- **Visualizations:**
  - **Horizontal Bar Chart:** Top 10 Doctors by Revenue (Y: `Doctor_Name`, X: `[Total Revenue Collected]`, Tooltip: `Experience_Years`, `Qualification`).
  - **Scatter Chart:** Doctor Seniority vs Revenue Generated (X: `Experience_Years`, Y: `[Total Revenue Collected]`, Size: `[Total Admissions]`, Legend: `Department_Name`).
  - **Matrix Table:** Specialty Breakdown (Rows: `Department_Name` -> `Doctor_Name`, Values: `Total Admissions`, `Total Surgeries`, `Average Wait Time`, `Revenue`).
- **Slicers:** `Department_Name`, `Gender`, `Qualification`.

---

### 🛏️ Page 3: Bed & Inpatient Capacity Management
- **Top KPI Cards:**
  - Total Bed Inventory (`[Total Bed Capacity]` -> 300)
  - ICU Beds (`[Total ICU Beds]` -> 30)
  - General Beds (`[Total General Beds]` -> ~210)
  - Private & Semi-Private Beds (`[Total Private Beds]` + `[Total Semi-Private Beds]`)
- **Visualizations:**
  - **Stacked Column Chart:** Bed Distribution by Ward & Bed Type (X: `Ward`, Y: `Total Beds`, Legend: `Bed_Type`).
  - **Bar Chart:** Average Length of Stay by Medical Condition / Disease (Y: `Disease`, X: `[Average Length of Stay (Days)]`).
  - **Histogram / Column Chart:** Length of Stay Distribution (0 Days [Outpatient], 1-3 Days [Emergency], 4-10 Days [Inpatient]).
- **Slicers:** `Ward`, `Bed_Type`, `Admission_Type`.

---

### 💳 Page 4: Financial & Billing Intelligence
- **Top KPI Cards:**
  - Total Billed Amount (`[Total Gross Billed]`)
  - Total Collected (`[Total Revenue Collected]`)
  - Insurance Adoption (`[Insurance Penetration Rate %]` -> ~65%)
  - Average Bill per Case (`[Average Bill Per Admission]`)
- **Visualizations:**
  - **100% Stacked Bar Chart:** Revenue Component Share (Treatment Cost vs Medicine Cost vs Room Charges).
  - **Donut Chart:** Insurance vs Self-Pay Revenue (`Insurance` Yes vs No).
  - **Table / Matrix:** Top 10 High-Revenue Medical Treatments (Rows: `Treatment_Name`, Values: `Cases`, `Average Cost`, `Total Paid`).
  - **Line Chart:** Monthly Insurance Settlement vs Out-of-Pocket Collections.
- **Slicers:** `Insurance` (Yes/No), `Department_Name`, `Quarter`.

---

### 🩺 Page 5: Clinical Outcomes & Patient Demographics
- **Top KPI Cards:**
  - Treatment Recovery Rate (`[Treatment Recovery Rate %]` -> ~70%)
  - Improvement Rate (`[Improvement Rate %]` -> ~20%)
  - Surgery Rate (`[Surgery Rate %]`)
  - Average Patient Age (`[Average Patient Age]`)
- **Visualizations:**
  - **Donut / Funnel Chart:** Clinical Outcomes (`Outcome`: Recovered, Improved, Referred, Deceased).
  - **Filled Map / Treemap:** Patient Geographic Distribution across Tamil Nadu (Location: `City`, Values: `Total Patients`).
  - **Clustered Bar Chart:** Disease Frequency & Surgery Ratio (Y: `Disease`, X: `Total Cases`, Color: `Surgery`).
  - **Column Chart:** Blood Group Distribution (X: `Blood_Group`, Y: `Total Patients`).
- **Slicers:** `Outcome`, `Blood_Group`, `City`, `Gender`.

---

## 6. Color Palette & Styling Tokens

| Element | Color Hex | Usage |
| :--- | :--- | :--- |
| **Primary Theme** | `#1E3A8A` | Headers, Primary KPI Cards, Active Filters |
| **Accent Teal** | `#0D9488` | Admissions, Success/Recovery visuals, Buttons |
| **Warning / Emergency** | `#E11D48` | Emergency cases, ICU occupancy, Mortality flags |
| **Amber / Inpatient** | `#D97706` | Inpatient stays, Wait time warnings |
| **Background** | `#F8FAFC` | Page canvas background |
| **Card Surface** | `#FFFFFF` | Visual container card background with subtle shadow |
