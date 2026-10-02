import random
from pathlib import Path

import pandas as pd
random.seed(42)
# Department information
departments = {
    "D001": ("Cardiology", 8, "MD Cardiology"),
    "D002": ("Neurology", 8, "DM Neurology"),
    "D003": ("Orthopedics", 8, "MS Orthopedics"),
    "D004": ("Pediatrics", 8, "MD Pediatrics"),
    "D005": ("Oncology", 8, "DM Oncology"),
    "D006": ("ENT", 8, "MS ENT"),
    "D007": ("Dermatology", 6, "MD Dermatology"),
    "D008": ("Emergency", 10, "MD Emergency Medicine"),
    "D009": ("ICU", 8, "MD Critical Care"),
    "D010": ("General Medicine", 8, "MD General Medicine")
}

# Male first names
male_first_names = [
    "Arjun", "Rahul", "Karthik", "Vikram", "Suresh",
    "Rohan", "Aditya", "Vivek", "Naveen", "Prakash"
]

# Female first names
female_first_names = [
    "Priya", "Ananya", "Sneha", "Meera", "Kavya",
    "Divya", "Pooja", "Aishwarya", "Neha", "Swathi"
]

# Last names
last_names = [
    "Kumar", "Sharma", "Reddy", "Iyer", "Menon",
    "Patel", "Singh", "Nair", "Rao", "Gupta"
]

# Empty list to store doctor records
doctors = []

doctor_number = 1

# Loop through each department
for dept_id, dept_info in departments.items():

    department_name = dept_info[0]
    doctor_count = dept_info[1]
    qualification = dept_info[2]

    # Generate doctors for this department
    for i in range(doctor_count):

        # Random Gender
        gender = random.choice(["Male", "Female"])

        # Generate Name based on gender
        if gender == "Male":
            first_name = random.choice(male_first_names)
        else:
            first_name = random.choice(female_first_names)

        last_name = random.choice(last_names)

        doctor_name = f"Dr. {first_name} {last_name}"

        # Experience
        experience = random.randint(2, 30)

        # Consultation Fee based on experience
        if experience <= 5:
            fee = random.randint(500, 700)
        elif experience <= 10:
            fee = random.randint(700, 900)
        elif experience <= 20:
            fee = random.randint(900, 1200)
        else:
            fee = random.randint(1200, 1800)

        # Doctor ID
        doctor_id = f"DR{doctor_number:03d}"

        # Add doctor record
        doctors.append({
            "Doctor_ID": doctor_id,
            "Doctor_Name": doctor_name,
            "Gender": gender,
            "Department_ID": dept_id,
            "Experience_Years": experience,
            "Qualification": qualification,
            "Consultation_Fee": fee
        })

        doctor_number += 1

# Create DataFrame
df = pd.DataFrame(doctors)

# Save CSV (path is relative to project root, not cwd)
data_dir = Path(__file__).resolve().parent.parent / "data"
data_dir.mkdir(parents=True, exist_ok=True)
output_path = data_dir / "doctors.csv"
df.to_csv(output_path, index=False)

print("Doctors dataset generated successfully!")
print(df.head())