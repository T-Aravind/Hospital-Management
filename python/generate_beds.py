import random
from pathlib import Path
import pandas as pd

# Generate the same data every time (useful for debugging)
random.seed(42)

# Store all bed records
beds = []

# Bed distribution across departments
bed_distribution = {
    "D001": ("Ward A", 30),
    "D002": ("Ward B", 25),
    "D003": ("Ward C", 35),
    "D004": ("Ward D", 25),
    "D005": ("Ward E", 30),
    "D006": ("Ward F", 20),
    "D007": ("Ward G", 15),
    "D008": ("Emergency Ward", 40),
    "D009": ("ICU", 30),
    "D010": ("Ward H", 50)
}

bed_number = 1

# Loop through every department
for department_id, department_info in bed_distribution.items():

    ward_name = department_info[0]
    total_beds = department_info[1]

    room_number = 101

    # Create beds
    for i in range(total_beds):

        # Bed ID
        bed_id = f"B{bed_number:03d}"

        # Room Number
        if department_id == "D009":          # ICU
            room = f"ICU{room_number}"
        else:
            room = f"R{room_number}"

        # Bed Type
        if department_id == "D009":
            bed_type = "ICU"
        else:
            bed_type = random.choices(
                ["General", "Semi-Private", "Private"],
                weights=[70, 20, 10]
            )[0]

        # Add record
        beds.append({
            "Bed_ID": bed_id,
            "Ward": ward_name,
            "Room_Number": room,
            "Bed_Type": bed_type,
            "Department_ID": department_id
        })

        bed_number += 1

        # Every room has 2 beds (except ICU)
        if department_id != "D009":
            if (i + 1) % 2 == 0:
                room_number += 1
        else:
            room_number += 1

# Create DataFrame
df = pd.DataFrame(beds)

# Save CSV
project_root = Path(__file__).resolve().parent.parent
data_folder = project_root / "data"
data_folder.mkdir(exist_ok=True)

output_file = data_folder / "beds.csv"

df.to_csv(output_file, index=False)

print("Beds dataset generated successfully!")
print(df.head())

print(f"\nTotal Beds Generated : {len(df)}")