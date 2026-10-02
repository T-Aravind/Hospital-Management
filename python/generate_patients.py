import random
from pathlib import Path

import pandas as pd

# Generate the same dataset every time
random.seed(42)

# -----------------------------
# Configuration
# -----------------------------
TOTAL_PATIENTS = 15000

# -----------------------------
# Name Lists
# -----------------------------

male_first_names = [
    "Arjun", "Rahul", "Karthik", "Vikram", "Suresh",
    "Rohan", "Aditya", "Vivek", "Naveen", "Prakash",
    "Ashwin", "Harish", "Manoj", "Rakesh", "Ganesh"
]

female_first_names = [
    "Priya", "Ananya", "Sneha", "Meera", "Kavya",
    "Divya", "Pooja", "Aishwarya", "Neha", "Swathi",
    "Deepika", "Nithya", "Harini", "Keerthana", "Lakshmi"
]

last_names = [
    "Kumar", "Sharma", "Reddy", "Iyer", "Menon",
    "Patel", "Singh", "Nair", "Rao", "Gupta",
    "Krishnan", "Babu", "Raj", "Verma", "Mohan"
]

# -----------------------------
# Blood Groups
# -----------------------------

blood_groups = ["O+", "A+", "B+", "AB+", "O-", "A-", "B-", "AB-"]

blood_weights = [35, 25, 20, 8, 5, 3, 3, 1]

# -----------------------------
# Tamil Nadu Cities
# -----------------------------

cities = [
    "Chennai",
    "Coimbatore",
    "Madurai",
    "Trichy",
    "Salem",
    "Vellore",
    "Tirunelveli",
    "Tiruppur",
    "Erode",
    "Kanchipuram",
    "Thanjavur",
    "Dindigul",
    "Hosur",
    "Tiruvallur",
    "Tiruttani"
]

# -----------------------------
# Store Patient Records
# -----------------------------

patients = []

# -----------------------------
# Generate Patients
# -----------------------------

for i in range(1, TOTAL_PATIENTS + 1):

    patient_id = f"P{i:05d}"

    gender = random.choice(["Male", "Female"])

    if gender == "Male":
        first_name = random.choice(male_first_names)
    else:
        first_name = random.choice(female_first_names)

    last_name = random.choice(last_names)

    patient_name = f"{first_name} {last_name}"

    # Realistic Age Distribution
    age_group = random.choices(
        ["Child", "Young", "Adult", "Senior", "Old"],
        weights=[10, 20, 35, 25, 10]
    )[0]

    if age_group == "Child":
        age = random.randint(1, 12)
    elif age_group == "Young":
        age = random.randint(13, 25)
    elif age_group == "Adult":
        age = random.randint(26, 45)
    elif age_group == "Senior":
        age = random.randint(46, 65)
    else:
        age = random.randint(66, 90)

    blood_group = random.choices(
        blood_groups,
        weights=blood_weights
    )[0]

    city = random.choice(cities)

    # Indian Mobile Number
    phone = str(random.choice([9, 8, 7, 6])) + "".join(
        str(random.randint(0, 9)) for _ in range(9)
    )

    patients.append({
        "Patient_ID": patient_id,
        "Patient_Name": patient_name,
        "Age": age,
        "Gender": gender,
        "Blood_Group": blood_group,
        "City": city,
        "Phone": phone
    })

# -----------------------------
# Create DataFrame
# -----------------------------

df = pd.DataFrame(patients)

# -----------------------------
# Save CSV
# -----------------------------

project_root = Path(__file__).resolve().parent.parent

data_folder = project_root / "data"

data_folder.mkdir(exist_ok=True)

output_file = data_folder / "patients.csv"

df.to_csv(output_file, index=False)

print("Patients dataset generated successfully!")
print(df.head())
print(f"\nTotal Patients : {len(df)}")
