import random
from datetime import datetime, timedelta
from pathlib import Path

import pandas as pd

random.seed(42)

# -----------------------------------
# Project Paths
# -----------------------------------

project_root = Path(__file__).resolve().parent.parent
data_folder = project_root / "data"

patients = pd.read_csv(data_folder / "patients.csv")
doctors = pd.read_csv(data_folder / "doctors.csv")
beds = pd.read_csv(data_folder / "beds.csv")

# -----------------------------------
# Diseases
# -----------------------------------

diseases = {
    "D001": ["Hypertension", "Heart Attack", "Arrhythmia"],
    "D002": ["Stroke", "Migraine", "Epilepsy"],
    "D003": ["Fracture", "Arthritis"],
    "D004": ["Asthma", "Viral Fever"],
    "D005": ["Breast Cancer", "Lung Cancer"],
    "D006": ["Sinusitis", "Ear Infection"],
    "D007": ["Psoriasis", "Eczema"],
    "D008": ["Accident Trauma", "Poisoning"],
    "D009": ["Sepsis", "Multi-organ Failure"],
    "D010": ["Diabetes", "Viral Fever"]
}

records = []

start_date = datetime(2024, 1, 1)
end_date = datetime(2025, 12, 31)

total_days = (end_date - start_date).days

# -----------------------------------
# Generate Admissions
# -----------------------------------

for index, patient in patients.iterrows():

    admission_id = f"A{index+1:05d}"

    doctor = doctors.sample(1).iloc[0]

    department_id = doctor["Department_ID"]

    department_beds = beds[beds["Department_ID"] == department_id]

    bed = department_beds.sample(1).iloc[0]

    disease = random.choice(diseases[department_id])

    admission_type = random.choices(
        ["Emergency", "Inpatient", "Outpatient"],
        weights=[25,45,30]
    )[0]

    random_days = random.randint(0,total_days)

    admission_date = start_date + timedelta(days=random_days)

    hour = random.randint(0,23)
    minute = random.randint(0,59)

    admission_datetime = admission_date.replace(
        hour=hour,
        minute=minute
    )

    if admission_type=="Emergency":
        waiting=random.randint(5,30)
        stay=random.randint(1,3)

    elif admission_type=="Inpatient":
        waiting=random.randint(20,90)
        stay=random.randint(2,10)

    else:
        waiting=random.randint(10,60)
        stay=0

    discharge_date = admission_date + timedelta(days=stay)

    readmission = random.choices(
        ["Yes","No"],
        weights=[10,90]
    )[0]

    records.append({
        "Admission_ID": admission_id,
        "Patient_ID": patient["Patient_ID"],
        "Doctor_ID": doctor["Doctor_ID"],
        "Bed_ID": bed["Bed_ID"],
        "Disease": disease,
        "Admission_Type": admission_type,
        "Admission_Date": admission_date.date(),
        "Admission_Time": admission_datetime.strftime("%H:%M:%S"),
        "Waiting_Time_Minutes": waiting,
        "Discharge_Date": discharge_date.date(),
        "Length_of_Stay": stay,
        "Readmission": readmission
    })

df = pd.DataFrame(records)

df.to_csv(data_folder/"admissions.csv",index=False)

print(df.head())
print()
print("Admissions Generated :",len(df))