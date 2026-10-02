import random
from pathlib import Path

import pandas as pd

random.seed(42)

# ------------------------------------
# Paths
# ------------------------------------

project_root = Path(__file__).resolve().parent.parent
data_folder = project_root / "data"

admissions = pd.read_csv(data_folder / "admissions.csv")
treatments = pd.read_csv(data_folder / "treatments.csv")

# ------------------------------------
# Treatment Costs
# ------------------------------------

treatment_costs = {
    "ECG": 800,
    "Angioplasty": 250000,
    "Bypass Surgery": 450000,
    "MRI Brain": 6000,
    "Stroke Therapy": 12000,
    "EEG": 3500,
    "Fracture Fixation": 80000,
    "Knee Replacement": 180000,
    "Physiotherapy": 2000,
    "Vaccination": 1500,
    "Nebulization": 1200,
    "IV Fluids": 1000,
    "Chemotherapy": 40000,
    "Radiation Therapy": 35000,
    "Immunotherapy": 60000,
    "Ear Surgery": 70000,
    "Sinus Surgery": 65000,
    "Endoscopy": 5000,
    "Skin Biopsy": 4000,
    "Laser Therapy": 8000,
    "Cryotherapy": 5000,
    "Trauma Care": 15000,
    "Wound Suturing": 6000,
    "CPR": 10000,
    "Ventilator Support": 15000,
    "Dialysis": 8000,
    "Critical Monitoring": 12000,
    "Insulin Therapy": 3000,
    "Antibiotic Therapy": 2500
}

records = []

for index, admission in admissions.iterrows():

    treatment = treatments.iloc[index]

    treatment_cost = treatment_costs[treatment["Treatment_Name"]]

    medicine_cost = random.randint(500, 20000)

    room_charge_per_day = random.choice([2000,3000,4000,5000])

    room_charges = room_charge_per_day * admission["Length_of_Stay"]

    insurance = random.choices(
        ["Yes","No"],
        weights=[65,35]
    )[0]

    total_bill = treatment_cost + medicine_cost + room_charges

    if insurance == "Yes":
        amount_paid = total_bill * 0.20
    else:
        amount_paid = total_bill

    records.append({
        "Bill_ID": f"BILL{index+1:05d}",
        "Admission_ID": admission["Admission_ID"],
        "Treatment_Cost": treatment_cost,
        "Medicine_Cost": medicine_cost,
        "Room_Charges": room_charges,
        "Insurance": insurance,
        "Amount_Paid": round(amount_paid,2)
    })

df = pd.DataFrame(records)

df.to_csv(data_folder/"billing.csv",index=False)

print(df.head())
print()
print("Billing Generated :",len(df))