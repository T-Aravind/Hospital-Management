import mysql.connector
import pandas as pd

# ==========================
# Connect to MySQL
# ==========================
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="ntn@123",
    database="hospital_db"
)

cursor = conn.cursor()

print("✅ Connected to MySQL\n")


# ==========================
# Clear existing import data
# ==========================
cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
for table in ["Billing", "Treatments", "Admissions", "Beds", "Doctors", "Patients"]:
    cursor.execute(f"TRUNCATE TABLE {table}")
cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
conn.commit()

print("Cleared existing import tables\n")


# ==========================
# Generic Import Function
# ==========================
def import_csv(csv_file, table_name, columns):

    print(f"Importing {table_name}...")

    df = pd.read_csv(csv_file)

    placeholders = ",".join(["%s"] * len(columns))

    query = f"""
    INSERT INTO {table_name}
    ({",".join(columns)})
    VALUES ({placeholders})
    """

    count = 0

    for _, row in df.iterrows():

        values = tuple(row[column] for column in columns)

        cursor.execute(query, values)

        count += 1

    conn.commit()

    print(f"✅ {count} rows imported into {table_name}\n")


# ==========================================
# 1. Doctors
# ==========================================
import_csv(
    "data/doctors.csv",
    "Doctors",
    [
        "Doctor_ID",
        "Doctor_Name",
        "Gender",
        "Department_ID",
        "Experience_Years",
        "Qualification",
        "Consultation_Fee"
    ]
)

# ==========================================
# 2. Patients
# ==========================================
import_csv(
    "data/patients.csv",
    "Patients",
    [
        "Patient_ID",
        "Patient_Name",
        "Age",
        "Gender",
        "Blood_Group",
        "City",
        "Phone"
    ]
)

# ==========================================
# 3. Beds
# ==========================================
import_csv(
    "data/beds.csv",
    "Beds",
    [
        "Bed_ID",
        "Ward",
        "Room_Number",
        "Bed_Type",
        "Department_ID"
    ]
)

# ==========================================
# 4. Admissions
# ==========================================
cursor.execute(
    """
    ALTER TABLE Admissions
    MODIFY Admission_Type ENUM('Emergency', 'Inpatient', 'Outpatient') NOT NULL
    """
)
conn.commit()

import_csv(
    "data/admissions.csv",
    "Admissions",
    [
        "Admission_ID",
        "Patient_ID",
        "Doctor_ID",
        "Bed_ID",
        "Disease",
        "Admission_Type",
        "Admission_Date",
        "Admission_Time",
        "Waiting_Time_Minutes",
        "Discharge_Date",
        "Readmission"
    ]
)

# ==========================================
# 5. Treatments
# ==========================================
import_csv(
    "data/treatments.csv",
    "Treatments",
    [
        "Treatment_ID",
        "Admission_ID",
        "Treatment_Name",
        "Surgery",
        "Outcome"
    ]
)

# ==========================================
# 6. Billing
# ==========================================
cursor.execute("ALTER TABLE Billing MODIFY Bill_ID VARCHAR(10) NOT NULL")
conn.commit()

import_csv(
    "data/billing.csv",
    "Billing",
    [
        "Bill_ID",
        "Admission_ID",
        "Treatment_Cost",
        "Medicine_Cost",
        "Room_Charges",
        "Insurance",
        "Amount_Paid"
    ]
)

# ==========================
# Close Connection
# ==========================
cursor.close()
conn.close()

print("🎉 ALL CSV FILES IMPORTED SUCCESSFULLY!")