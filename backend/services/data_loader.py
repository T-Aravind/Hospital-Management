import os
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, Optional, Tuple
from backend.config import (
    DATA_DIR,
    USE_MYSQL,
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
)

DEPARTMENTS_DATA = [
    {"Department_ID": "D001", "Department_Name": "Cardiology"},
    {"Department_ID": "D002", "Department_Name": "Neurology"},
    {"Department_ID": "D003", "Department_Name": "Orthopedics"},
    {"Department_ID": "D004", "Department_Name": "Pediatrics"},
    {"Department_ID": "D005", "Department_Name": "Oncology"},
    {"Department_ID": "D006", "Department_Name": "ENT"},
    {"Department_ID": "D007", "Department_Name": "Dermatology"},
    {"Department_ID": "D008", "Department_Name": "Emergency"},
    {"Department_ID": "D009", "Department_Name": "ICU"},
    {"Department_ID": "D010", "Department_Name": "General Medicine"},
]

class DataLoader:
    _instance = None

    def __init__(self):
        self.patients: pd.DataFrame = pd.DataFrame()
        self.doctors: pd.DataFrame = pd.DataFrame()
        self.beds: pd.DataFrame = pd.DataFrame()
        self.admissions: pd.DataFrame = pd.DataFrame()
        self.treatments: pd.DataFrame = pd.DataFrame()
        self.billing: pd.DataFrame = pd.DataFrame()
        self.departments: pd.DataFrame = pd.DataFrame(DEPARTMENTS_DATA)
        self.master_df: pd.DataFrame = pd.DataFrame()
        self.is_loaded = False
        self.source = "CSV"

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DataLoader()
            cls._instance.load_data()
        return cls._instance

    def load_data(self, force_reload: bool = False):
        if self.is_loaded and not force_reload:
            return

        if USE_MYSQL:
            try:
                self._load_from_mysql()
                self.source = "MySQL"
                self._build_master_df()
                self.is_loaded = True
                print(f"[DataLoader] Successfully loaded data from MySQL: {MYSQL_DATABASE}")
                return
            except Exception as e:
                print(f"[DataLoader] MySQL connection failed ({e}). Falling back to CSV files.")

        self._load_from_csv()
        self.source = "CSV"
        self._build_master_df()
        self.is_loaded = True
        print(f"[DataLoader] Successfully loaded data from CSV directory: {DATA_DIR}")

    def _load_from_csv(self):
        data_path = Path(DATA_DIR)
        
        # Load Patients
        patients_file = data_path / "patients.csv"
        self.patients = pd.read_csv(patients_file) if patients_file.exists() else pd.DataFrame(
            columns=["Patient_ID", "Patient_Name", "Age", "Gender", "Blood_Group", "City", "Phone"]
        )

        # Load Doctors
        doctors_file = data_path / "doctors.csv"
        self.doctors = pd.read_csv(doctors_file) if doctors_file.exists() else pd.DataFrame(
            columns=["Doctor_ID", "Doctor_Name", "Gender", "Department_ID", "Experience_Years", "Qualification", "Consultation_Fee"]
        )

        # Load Beds
        beds_file = data_path / "beds.csv"
        self.beds = pd.read_csv(beds_file) if beds_file.exists() else pd.DataFrame(
            columns=["Bed_ID", "Ward", "Room_Number", "Bed_Type", "Department_ID"]
        )

        # Load Admissions
        admissions_file = data_path / "admissions.csv"
        self.admissions = pd.read_csv(admissions_file) if admissions_file.exists() else pd.DataFrame(
            columns=["Admission_ID", "Patient_ID", "Doctor_ID", "Bed_ID", "Disease", "Admission_Type", "Admission_Date", "Admission_Time", "Waiting_Time_Minutes", "Discharge_Date", "Length_of_Stay", "Readmission"]
        )

        # Load Treatments
        treatments_file = data_path / "treatments.csv"
        self.treatments = pd.read_csv(treatments_file) if treatments_file.exists() else pd.DataFrame(
            columns=["Treatment_ID", "Admission_ID", "Treatment_Name", "Surgery", "Outcome"]
        )

        # Load Billing
        billing_file = data_path / "billing.csv"
        self.billing = pd.read_csv(billing_file) if billing_file.exists() else pd.DataFrame(
            columns=["Bill_ID", "Admission_ID", "Treatment_Cost", "Medicine_Cost", "Room_Charges", "Insurance", "Amount_Paid"]
        )

        # Departments DataFrame
        self.departments = pd.DataFrame(DEPARTMENTS_DATA)

        # Clean / Type Casts
        if not self.admissions.empty:
            self.admissions["Admission_Date"] = pd.to_datetime(self.admissions["Admission_Date"], errors="coerce")
            self.admissions["Discharge_Date"] = pd.to_datetime(self.admissions["Discharge_Date"], errors="coerce")
            self.admissions["Length_of_Stay"] = pd.to_numeric(self.admissions["Length_of_Stay"], errors="coerce").fillna(0).astype(int)
            self.admissions["Waiting_Time_Minutes"] = pd.to_numeric(self.admissions["Waiting_Time_Minutes"], errors="coerce").fillna(0).astype(int)

        if not self.billing.empty:
            for col in ["Treatment_Cost", "Medicine_Cost", "Room_Charges", "Amount_Paid"]:
                if col in self.billing.columns:
                    self.billing[col] = pd.to_numeric(self.billing[col], errors="coerce").fillna(0.0)

        if not self.patients.empty:
            self.patients["Age"] = pd.to_numeric(self.patients["Age"], errors="coerce").fillna(0).astype(int)

        if not self.doctors.empty:
            self.doctors["Experience_Years"] = pd.to_numeric(self.doctors["Experience_Years"], errors="coerce").fillna(0).astype(int)
            self.doctors["Consultation_Fee"] = pd.to_numeric(self.doctors["Consultation_Fee"], errors="coerce").fillna(0.0)

    def _load_from_mysql(self):
        import mysql.connector
        conn = mysql.connector.connect(
            host=MYSQL_HOST,
            port=MYSQL_PORT,
            user=MYSQL_USER,
            password=MYSQL_PASSWORD,
            database=MYSQL_DATABASE,
        )
        self.patients = pd.read_sql("SELECT * FROM Patients", conn)
        self.doctors = pd.read_sql("SELECT * FROM Doctors", conn)
        self.beds = pd.read_sql("SELECT * FROM Beds", conn)
        self.admissions = pd.read_sql("SELECT * FROM Admissions", conn)
        self.treatments = pd.read_sql("SELECT * FROM Treatments", conn)
        self.billing = pd.read_sql("SELECT * FROM Billing", conn)
        try:
            self.departments = pd.read_sql("SELECT * FROM Departments", conn)
        except Exception:
            self.departments = pd.DataFrame(DEPARTMENTS_DATA)
        conn.close()

    def _build_master_df(self):
        if self.admissions.empty:
            self.master_df = pd.DataFrame()
            return

        # Start with admissions
        df = self.admissions.copy()

        # Merge Departments with Doctors
        doc_dept = self.doctors.merge(self.departments, on="Department_ID", how="left", suffixes=("", "_dept"))

        # Merge Admissions with Patients
        df = df.merge(
            self.patients,
            on="Patient_ID",
            how="left",
            suffixes=("", "_patient")
        )

        # Merge with Doctors & their Department
        df = df.merge(
            doc_dept,
            on="Doctor_ID",
            how="left",
            suffixes=("", "_doctor")
        )

        # Merge with Beds
        bed_cols = self.beds[["Bed_ID", "Ward", "Room_Number", "Bed_Type"]]
        df = df.merge(
            bed_cols,
            on="Bed_ID",
            how="left",
            suffixes=("", "_bed")
        )

        # Merge with Treatments (1-to-1 relationship per admission in dataset)
        if not self.treatments.empty:
            df = df.merge(
                self.treatments,
                on="Admission_ID",
                how="left",
                suffixes=("", "_treatment")
            )

        # Merge with Billing (1-to-1 relationship per admission in dataset)
        if not self.billing.empty:
            df = df.merge(
                self.billing,
                on="Admission_ID",
                how="left",
                suffixes=("", "_billing")
            )

        # Calculate Total_Gross_Bill = Treatment_Cost + Medicine_Cost + Room_Charges
        if "Treatment_Cost" in df.columns and "Medicine_Cost" in df.columns and "Room_Charges" in df.columns:
            df["Total_Gross_Bill"] = df["Treatment_Cost"] + df["Medicine_Cost"] + df["Room_Charges"]

        # Date string helper column for fast string matching / sorting
        if "Admission_Date" in df.columns:
            df["Admission_Date_Str"] = df["Admission_Date"].dt.strftime("%Y-%m-%d")
            df["Admission_Month"] = df["Admission_Date"].dt.strftime("%Y-%m")
            df["Admission_Year"] = df["Admission_Date"].dt.year

        self.master_df = df

def get_data_loader() -> DataLoader:
    return DataLoader.get_instance()
