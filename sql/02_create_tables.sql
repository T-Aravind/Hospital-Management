Use hospital_db;
Create Table Departments(
    Department_ID VARCHAR(5) PRIMARY KEY,
    Department_Name VARCHAR(50) NOT NULL
);

CREATE TABLE Doctors (
    Doctor_ID VARCHAR(6) PRIMARY KEY,
    Doctor_Name VARCHAR(100) NOT NULL,
    Gender ENUM('Male','Female'),
    Department_ID VARCHAR(5),
    Experience_Years INT,
    Qualification VARCHAR(50),
    Consultation_Fee DECIMAL(10,2),

    FOREIGN KEY (Department_ID)
        REFERENCES Departments(Department_ID)
);
CREATE TABLE Patients (
    Patient_ID VARCHAR(8) PRIMARY KEY,
    Patient_Name VARCHAR(100) NOT NULL,
    Age INT,
    Gender ENUM('Male','Female'),
    Blood_Group VARCHAR(5),
    City VARCHAR(50),
    Phone VARCHAR(15)
);
CREATE TABLE Beds (
    Bed_ID VARCHAR(6) PRIMARY KEY,
    Ward VARCHAR(30),
    Room_Number VARCHAR(10),
    Bed_Type ENUM('General','ICU','Private','Semi-Private'),
    Department_ID VARCHAR(5),

    FOREIGN KEY (Department_ID)
        REFERENCES Departments(Department_ID)
);
CREATE TABLE Admissions (
    Admission_ID VARCHAR(8) PRIMARY KEY,

    Patient_ID VARCHAR(8) NOT NULL,
    Doctor_ID VARCHAR(6) NOT NULL,
    Bed_ID VARCHAR(6) NOT NULL,

    Disease VARCHAR(100) NOT NULL,

    Admission_Type ENUM('Emergency','Inpatient','Outpatient') NOT NULL,

    Admission_Date DATE NOT NULL,
    Admission_Time TIME NOT NULL,

    Waiting_Time_Minutes INT,

    Discharge_Date DATE,

    Readmission ENUM('Yes','No'),

    FOREIGN KEY (Patient_ID)
        REFERENCES Patients(Patient_ID),

    FOREIGN KEY (Doctor_ID)
        REFERENCES Doctors(Doctor_ID),

    FOREIGN KEY (Bed_ID)
        REFERENCES Beds(Bed_ID)
);
CREATE TABLE Treatments (
    Treatment_ID VARCHAR(8) PRIMARY KEY,

    Admission_ID VARCHAR(8) NOT NULL,

    Treatment_Name VARCHAR(100) NOT NULL,

    Surgery ENUM('Yes','No'),

    Outcome VARCHAR(30),

    FOREIGN KEY (Admission_ID)
        REFERENCES Admissions(Admission_ID)
);
CREATE TABLE Billing (

    Bill_ID VARCHAR(10) PRIMARY KEY,

    Admission_ID VARCHAR(8) NOT NULL,

    Treatment_Cost DECIMAL(10,2),

    Medicine_Cost DECIMAL(10,2),

    Room_Charges DECIMAL(10,2),

    Insurance ENUM('Yes','No'),

    Amount_Paid DECIMAL(10,2),

    FOREIGN KEY (Admission_ID)
        REFERENCES Admissions(Admission_ID)
);