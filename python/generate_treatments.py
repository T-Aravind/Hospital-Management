import random
from pathlib import Path

import pandas as pd

random.seed(42)

# -------------------------------------
# Paths
# -------------------------------------

project_root = Path(__file__).resolve().parent.parent
data_folder = project_root / "data"

admissions = pd.read_csv(data_folder / "admissions.csv")
doctors = pd.read_csv(data_folder / "doctors.csv")

# -------------------------------------
# Department Treatments
# -------------------------------------

treatments = {
    "D001": [("ECG", False),
             ("Angioplasty", True),
             ("Bypass Surgery", True)],

    "D002": [("MRI Brain", False),
             ("Stroke Therapy", False),
             ("EEG", False)],

    "D003": [("Fracture Fixation", True),
             ("Knee Replacement", True),
             ("Physiotherapy", False)],

    "D004": [("Vaccination", False),
             ("Nebulization", False),
             ("IV Fluids", False)],

    "D005": [("Chemotherapy", False),
             ("Radiation Therapy", False),
             ("Immunotherapy", False)],

    "D006": [("Ear Surgery", True),
             ("Sinus Surgery", True),
             ("Endoscopy", False)],

    "D007": [("Skin Biopsy", False),
             ("Laser Therapy", False),
             ("Cryotherapy", False)],

    "D008": [("Trauma Care", False),
             ("Wound Suturing", True),
             ("CPR", False)],

    "D009": [("Ventilator Support", False),
             ("Dialysis", False),
             ("Critical Monitoring", False)],

    "D010": [("Insulin Therapy", False),
             ("IV Fluids", False),
             ("Antibiotic Therapy", False)]
}

records = []

# -------------------------------------
# Generate Treatments
# -------------------------------------

for index, admission in admissions.iterrows():

    doctor_id = admission["Doctor_ID"]

    doctor = doctors[doctors["Doctor_ID"] == doctor_id].iloc[0]

    department = doctor["Department_ID"]

    treatment_name, surgery = random.choice(treatments[department])

    outcome = random.choices(
        ["Recovered", "Improved", "Referred", "Deceased"],
        weights=[70, 20, 7, 3]
    )[0]

    records.append({
        "Treatment_ID": f"T{index+1:05d}",
        "Admission_ID": admission["Admission_ID"],
        "Treatment_Name": treatment_name,
        "Surgery": "Yes" if surgery else "No",
        "Outcome": outcome
    })

df = pd.DataFrame(records)

df.to_csv(data_folder / "treatments.csv", index=False)

print(df.head())
print()
print("Treatments Generated:", len(df))