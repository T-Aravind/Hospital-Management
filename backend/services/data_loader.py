import os
import json
import sqlite3
import random
import pandas as pd
import numpy as np
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Optional, Tuple, Any

from backend.config import (
    DATA_DIR,
    USE_MYSQL,
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DATABASE,
)
from backend.services.hospital_manager import get_hospital_manager

STANDARD_DEPARTMENTS = [
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
        self.departments: pd.DataFrame = pd.DataFrame(STANDARD_DEPARTMENTS)
        self.master_df: pd.DataFrame = pd.DataFrame()
        self.is_loaded = False
        self.source = "CSV"
        self.current_hospital_id = "hosp_metro"
        self.hospital_manager = get_hospital_manager()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = DataLoader()
            cls._instance.load_data()
        return cls._instance

    def switch_hospital(self, hospital_id: str):
        self.hospital_manager.set_active_hospital(hospital_id)
        self.current_hospital_id = hospital_id
        self.load_data(force_reload=True)

    def load_data(self, force_reload: bool = False):
        if self.is_loaded and not force_reload:
            return

        active_hosp = self.hospital_manager.get_active_hospital()
        self.current_hospital_id = active_hosp.get("id", "hosp_metro")
        source_type = active_hosp.get("source_type", "CSV").upper()
        db_config = active_hosp.get("db_config")

        print(f"[DataLoader] Loading data for active hospital: {active_hosp.get('name')} ({self.current_hospital_id}) - Source: {source_type}")

        # 1. Custom Database Connection
        if source_type in ("MYSQL", "MARIADB", "POSTGRES", "POSTGRESQL", "SQLITE") and db_config:
            try:
                self._load_from_database(db_config)
                self.source = f"{source_type} DB"
                self._build_master_df()
                self.is_loaded = True
                print(f"[DataLoader] Successfully loaded from {source_type} DB")
                return
            except Exception as e:
                print(f"[DataLoader] DB connection failed ({e}). Falling back to file/preset loader.")

        # 2. Check if Hospital has dedicated uploaded folder
        custom_upload_dir = Path(DATA_DIR) / "uploads" / self.current_hospital_id
        if custom_upload_dir.exists() and (custom_upload_dir / "admissions.csv").exists():
            self._load_from_csv(custom_upload_dir)
            self.source = "Custom Uploaded Dataset"
            self._build_master_df()
            self.is_loaded = True
            return

        # 3. Default Dataset for hosp_metro
        if self.current_hospital_id == "hosp_metro":
            self._load_from_csv(Path(DATA_DIR))
            self.source = "CSV"
            self._build_master_df()
            self.is_loaded = True
            return

        # 4. Synthesize realistic operational dataset for other hospital profiles
        self._generate_hospital_dataset(active_hosp)
        self.source = f"Hospital Engine ({active_hosp.get('type', 'Specialty')})"
        self._build_master_df()
        self.is_loaded = True

    def _load_from_csv(self, data_path: Path):
        patients_file = data_path / "patients.csv"
        self.patients = pd.read_csv(patients_file) if patients_file.exists() else pd.DataFrame(
            columns=["Patient_ID", "Patient_Name", "Age", "Gender", "Blood_Group", "City", "Phone"]
        )

        doctors_file = data_path / "doctors.csv"
        self.doctors = pd.read_csv(doctors_file) if doctors_file.exists() else pd.DataFrame(
            columns=["Doctor_ID", "Doctor_Name", "Gender", "Department_ID", "Experience_Years", "Qualification", "Consultation_Fee"]
        )

        beds_file = data_path / "beds.csv"
        self.beds = pd.read_csv(beds_file) if beds_file.exists() else pd.DataFrame(
            columns=["Bed_ID", "Ward", "Room_Number", "Bed_Type", "Department_ID"]
        )

        admissions_file = data_path / "admissions.csv"
        self.admissions = pd.read_csv(admissions_file) if admissions_file.exists() else pd.DataFrame(
            columns=["Admission_ID", "Patient_ID", "Doctor_ID", "Bed_ID", "Disease", "Admission_Type", "Admission_Date", "Admission_Time", "Waiting_Time_Minutes", "Discharge_Date", "Length_of_Stay", "Readmission"]
        )

        treatments_file = data_path / "treatments.csv"
        self.treatments = pd.read_csv(treatments_file) if treatments_file.exists() else pd.DataFrame(
            columns=["Treatment_ID", "Admission_ID", "Treatment_Name", "Surgery", "Outcome"]
        )

        billing_file = data_path / "billing.csv"
        self.billing = pd.read_csv(billing_file) if billing_file.exists() else pd.DataFrame(
            columns=["Bill_ID", "Admission_ID", "Treatment_Cost", "Medicine_Cost", "Room_Charges", "Insurance", "Amount_Paid"]
        )

        self.departments = pd.DataFrame(STANDARD_DEPARTMENTS)
        self._clean_and_cast()

    def _load_from_database(self, db_config: Dict[str, Any]):
        db_type = db_config.get("db_type", "mysql").lower()
        
        if db_type == "sqlite":
            path = db_config.get("database", db_config.get("path"))
            conn = sqlite3.connect(path)
            self._query_all_tables(conn)
            conn.close()
        elif db_type in ("mysql", "mariadb"):
            import mysql.connector
            conn = mysql.connector.connect(
                host=db_config.get("host", "localhost"),
                port=int(db_config.get("port", 3306)),
                user=db_config.get("user", "root"),
                password=db_config.get("password", ""),
                database=db_config.get("database", "hospital_db")
            )
            self._query_all_tables(conn)
            conn.close()
        elif db_type in ("postgres", "postgresql"):
            from sqlalchemy import create_engine
            user = db_config.get("user", "postgres")
            pwd = db_config.get("password", "")
            host = db_config.get("host", "localhost")
            port = db_config.get("port", 5432)
            db = db_config.get("database", "hospital_db")
            engine = create_engine(f"postgresql://{user}:{pwd}@{host}:{port}/{db}")
            with engine.connect() as conn:
                self._query_all_tables(conn)

    def _query_all_tables(self, conn):
        def read_table(name_variants):
            for name in name_variants:
                try:
                    df = pd.read_sql(f"SELECT * FROM {name}", conn)
                    if not df.empty:
                        return df
                except Exception:
                    continue
            return pd.DataFrame()

        self.patients = read_table(["Patients", "patients", "PATIENTS"])
        self.doctors = read_table(["Doctors", "doctors", "DOCTORS"])
        self.beds = read_table(["Beds", "beds", "BEDS"])
        self.admissions = read_table(["Admissions", "admissions", "ADMISSIONS"])
        self.treatments = read_table(["Treatments", "treatments", "TREATMENTS"])
        self.billing = read_table(["Billing", "billing", "BILLING"])
        self.departments = read_table(["Departments", "departments", "DEPARTMENTS"])
        if self.departments.empty:
            self.departments = pd.DataFrame(STANDARD_DEPARTMENTS)
        self._clean_and_cast()

    def _generate_hospital_dataset(self, hospital_info: Dict[str, Any]):
        """Generates realistic hospital operational data tailored to hospital profile."""
        hosp_id = hospital_info.get("id", "hosp_custom")
        hosp_name = hospital_info.get("name", "Specialty Medical Center")
        city = hospital_info.get("city", "Bengaluru")
        total_beds = int(hospital_info.get("beds_count", 200))
        hosp_type = hospital_info.get("type", "General")
        
        is_pediatric_oncology = "St. Jude" in hosp_name or "Oncology" in hosp_type or "Children" in hosp_name
        is_trauma_icu = "Apex" in hosp_name or "Trauma" in hosp_type or "Emergency" in hosp_type

        random.seed(hash(hosp_id) % (2**32))
        np.random.seed(hash(hosp_id) % (2**32))

        # Departments
        if is_pediatric_oncology:
            depts = [
                {"Department_ID": "D001", "Department_Name": "Pediatric Oncology"},
                {"Department_ID": "D002", "Department_Name": "Pediatrics"},
                {"Department_ID": "D003", "Department_Name": "Cardiology"},
                {"Department_ID": "D004", "Department_Name": "Hematology"},
                {"Department_ID": "D005", "Department_Name": "Surgical Oncology"},
                {"Department_ID": "D006", "Department_Name": "ICU"},
                {"Department_ID": "D007", "Department_Name": "Radiology & Diagnostics"},
                {"Department_ID": "D008", "Department_Name": "General Medicine"},
            ]
        elif is_trauma_icu:
            depts = [
                {"Department_ID": "D001", "Department_Name": "Emergency & Trauma"},
                {"Department_ID": "D002", "Department_Name": "Critical Care / ICU"},
                {"Department_ID": "D003", "Department_Name": "Orthopedics & Spine"},
                {"Department_ID": "D004", "Department_Name": "Neurology & Neurosurgery"},
                {"Department_ID": "D005", "Department_Name": "Cardiology"},
                {"Department_ID": "D006", "Department_Name": "General Surgery"},
                {"Department_ID": "D007", "Department_Name": "Anesthesiology"},
                {"Department_ID": "D008", "Department_Name": "Pulmonology"},
                {"Department_ID": "D009", "Department_Name": "Nephrology"},
                {"Department_ID": "D010", "Department_Name": "General Medicine"},
            ]
        else:
            depts = STANDARD_DEPARTMENTS

        self.departments = pd.DataFrame(depts)
        num_records = 6000 if is_pediatric_oncology else (12000 if is_trauma_icu else 8000)

        # Beds
        beds_list = []
        ward_types = ["Ward A (General)", "Ward B (Private)", "Ward C (Semi-Private)", "ICU Floor 2", "Trauma Suite"]
        bed_categories = ["General", "ICU", "Private", "Semi-Private"]
        for b_idx in range(1, total_beds + 1):
            d_choice = depts[b_idx % len(depts)]
            b_type = "ICU" if (is_trauma_icu and b_idx % 4 == 0) else bed_categories[b_idx % len(bed_categories)]
            beds_list.append({
                "Bed_ID": f"BED-{b_idx:04d}",
                "Ward": ward_types[b_idx % len(ward_types)],
                "Room_Number": f"R-{100 + (b_idx // 4)}",
                "Bed_Type": b_type,
                "Department_ID": d_choice["Department_ID"]
            })
        self.beds = pd.DataFrame(beds_list)

        # Doctors
        num_docs = max(25, total_beds // 5)
        first_names = ["Dr. Aarav", "Dr. Vikram", "Dr. Priya", "Dr. Ananya", "Dr. Rajesh", "Dr. Meera", "Dr. Sanjay", "Dr. Sneha", "Dr. Arjun", "Dr. Divya", "Dr. Karthik", "Dr. Shalini"]
        last_names = ["Rao", "Nair", "Iyer", "Sharma", "Menon", "Reddy", "Patel", "Gupta", "Deshmukh", "Verma", "Sundaram", "Kapoor"]
        docs_list = []
        for d_idx in range(1, num_docs + 1):
            d_choice = depts[d_idx % len(depts)]
            gender = "Male" if d_idx % 2 == 0 else "Female"
            docs_list.append({
                "Doctor_ID": f"DOC-{d_idx:03d}",
                "Doctor_Name": f"{random.choice(first_names)} {random.choice(last_names)}",
                "Gender": gender,
                "Department_ID": d_choice["Department_ID"],
                "Experience_Years": random.randint(4, 28),
                "Qualification": random.choice(["MBBS, MD", "MBBS, MS, MCh", "MD, DM (Cardio)", "MD, DNB (Oncology)", "MS (Ortho), FRCS"]),
                "Consultation_Fee": random.choice([800, 1000, 1200, 1500, 2000])
            })
        self.doctors = pd.DataFrame(docs_list)

        # Patients
        p_first = ["Rahul", "Pooja", "Amit", "Kavya", "Suresh", "Lakshmi", "Rohan", "Deepa", "Manoj", "Bhavna", "Sunil", "Anjali", "Varun", "Swati"]
        p_last = ["Kumar", "Sharma", "Prasad", "Shetty", "Pillai", "Choudhury", "Bhat", "Joshi", "Natarajan", "Gowda", "Kulkarni"]
        cities_pool = [city, f"{city} North", f"{city} South", f"{city} Central", "Mysuru", "Coimbatore", "Salem", "Vijayawada", "Kochi"]
        blood_groups = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]

        patients_list = []
        for p_idx in range(1, num_records + 1):
            gender = "Male" if random.random() > 0.48 else "Female"
            if is_pediatric_oncology:
                age = random.randint(1, 21) if random.random() < 0.65 else random.randint(22, 70)
            else:
                age = random.randint(18, 82)
            patients_list.append({
                "Patient_ID": f"PAT-{p_idx:05d}",
                "Patient_Name": f"{random.choice(p_first)} {random.choice(p_last)}",
                "Age": age,
                "Gender": gender,
                "Blood_Group": random.choice(blood_groups),
                "City": random.choice(cities_pool),
                "Phone": f"+91-98{random.randint(10000000, 99999999)}"
            })
        self.patients = pd.DataFrame(patients_list)

        # Admissions, Treatments, Billing
        adm_types = ["Emergency", "Inpatient", "Outpatient"]
        diseases_pool = [
            "Acute Myocardial Infarction", "Arrhythmia", "Ischemic Stroke", "Trauma Fracture",
            "Acute Appendicitis", "Severe Pneumonia", "Chemotherapy Protocol", "Brain Tumor",
            "Joint Reconstruction", "Polytrauma", "Hypertension Crisis", "Sepsis Management"
        ]
        treatments_pool = [
            ("Coronary Angioplasty", True), ("Cardioversion Therapy", False), ("Craniotomy & Clipping", True),
            ("Open Reduction & Internal Fixation", True), ("Laparoscopic Appendectomy", True),
            ("Broad Spectrum Antibiotics", False), ("Targeted Chemotherapy IV", False),
            ("Surgical Tumor Resection", True), ("Emergency Trauma Resuscitation", False),
            ("Dialysis & Hemofiltration", False), ("General Medical Stabilization", False)
        ]
        outcomes_pool = ["Recovered", "Improved", "Referred", "Deceased"]
        outcome_weights = [0.85, 0.10, 0.03, 0.02] if is_pediatric_oncology else ([0.65, 0.20, 0.08, 0.07] if is_trauma_icu else [0.72, 0.18, 0.06, 0.04])

        admissions_list = []
        treatments_list = []
        billing_list = []

        start_date = datetime(2024, 1, 1)
        
        for idx in range(num_records):
            p_id = patients_list[idx]["Patient_ID"]
            d_choice = random.choice(docs_list)
            b_choice = random.choice(beds_list)
            
            # Days offset
            day_offset = random.randint(0, 720)
            adm_date = start_date + timedelta(days=day_offset)
            los = random.randint(1, 14) if not is_trauma_icu else random.randint(2, 21)
            dis_date = adm_date + timedelta(days=los)
            adm_type = "Emergency" if (is_trauma_icu and random.random() < 0.6) else random.choice(adm_types)
            is_readmit = "Yes" if random.random() < 0.09 else "No"
            
            adm_id = f"ADM-{idx+1:06d}"
            admissions_list.append({
                "Admission_ID": adm_id,
                "Patient_ID": p_id,
                "Doctor_ID": d_choice["Doctor_ID"],
                "Bed_ID": b_choice["Bed_ID"],
                "Disease": random.choice(diseases_pool),
                "Admission_Type": adm_type,
                "Admission_Date": adm_date.strftime("%Y-%m-%d"),
                "Admission_Time": f"{random.randint(0,23):02d}:{random.randint(0,59):02d}",
                "Waiting_Time_Minutes": random.randint(10, 75),
                "Discharge_Date": dis_date.strftime("%Y-%m-%d"),
                "Length_of_Stay": los,
                "Readmission": is_readmit
            })

            # Treatment
            t_name, is_surg = random.choice(treatments_pool)
            outcome = np.random.choice(outcomes_pool, p=outcome_weights)
            treatments_list.append({
                "Treatment_ID": f"TRT-{idx+1:06d}",
                "Admission_ID": adm_id,
                "Treatment_Name": t_name,
                "Surgery": "Yes" if is_surg else "No",
                "Outcome": outcome
            })

            # Billing
            t_cost = random.randint(15000, 180000) if is_surg else random.randint(5000, 45000)
            m_cost = random.randint(4000, 45000)
            r_cost = los * (random.randint(2500, 9000) if b_choice["Bed_Type"] == "ICU" else random.randint(1200, 4000))
            ins = "Yes" if random.random() < 0.68 else "No"
            tot = t_cost + m_cost + r_cost
            paid = round(tot * random.uniform(0.75, 1.0), 2)
            
            billing_list.append({
                "Bill_ID": f"BIL-{idx+1:06d}",
                "Admission_ID": adm_id,
                "Treatment_Cost": t_cost,
                "Medicine_Cost": m_cost,
                "Room_Charges": r_cost,
                "Insurance": ins,
                "Amount_Paid": paid
            })

        self.admissions = pd.DataFrame(admissions_list)
        self.treatments = pd.DataFrame(treatments_list)
        self.billing = pd.DataFrame(billing_list)
        self._clean_and_cast()

    def _clean_and_cast(self):
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

    def _build_master_df(self):
        if self.admissions.empty:
            self.master_df = pd.DataFrame()
            return

        df = self.admissions.copy()

        # Merge Doctors + Departments
        doc_dept = self.doctors.merge(self.departments, on="Department_ID", how="left", suffixes=("", "_dept"))

        # Merge Admissions + Patients
        df = df.merge(self.patients, on="Patient_ID", how="left", suffixes=("", "_patient"))

        # Merge + Doctors & Dept
        df = df.merge(doc_dept, on="Doctor_ID", how="left", suffixes=("", "_doctor"))

        # Merge + Beds
        bed_cols = self.beds[["Bed_ID", "Ward", "Room_Number", "Bed_Type"]] if not self.beds.empty else pd.DataFrame(columns=["Bed_ID", "Ward", "Room_Number", "Bed_Type"])
        df = df.merge(bed_cols, on="Bed_ID", how="left", suffixes=("", "_bed"))

        # Merge + Treatments
        if not self.treatments.empty:
            df = df.merge(self.treatments, on="Admission_ID", how="left", suffixes=("", "_treatment"))

        # Merge + Billing
        if not self.billing.empty:
            df = df.merge(self.billing, on="Admission_ID", how="left", suffixes=("", "_billing"))

        if "Treatment_Cost" in df.columns and "Medicine_Cost" in df.columns and "Room_Charges" in df.columns:
            df["Total_Gross_Bill"] = df["Treatment_Cost"] + df["Medicine_Cost"] + df["Room_Charges"]

        if "Admission_Date" in df.columns:
            df["Admission_Date_Str"] = df["Admission_Date"].dt.strftime("%Y-%m-%d")
            df["Admission_Month"] = df["Admission_Date"].dt.strftime("%Y-%m")
            df["Admission_Year"] = df["Admission_Date"].dt.year

        self.master_df = df

def get_data_loader() -> DataLoader:
    return DataLoader.get_instance()
