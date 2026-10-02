import mysql.connector
import pandas as pd

# Connect to MySQL
conn = mysql.connector.connect(
    host="localhost",
    user="root",
    password="ntn@123",
    database="hospital_db"
)

cursor = conn.cursor()

print("✅ Connected to MySQL Successfully!")

# Read doctors CSV
df = pd.read_csv("data/doctors.csv")

# SQL Insert Query
query = """
INSERT INTO Doctors
(
Doctor_ID,
Doctor_Name,
Gender,
Department_ID,
Experience_Years,
Qualification,
Consultation_Fee
)
VALUES
(%s,%s,%s,%s,%s,%s,%s)
"""

# Insert every row
for index, row in df.iterrows():

    values = (
        row["Doctor_ID"],
        row["Doctor_Name"],
        row["Gender"],
        row["Department_ID"],
        row["Experience_Years"],
        row["Qualification"],
        row["Consultation_Fee"]
    )

    cursor.execute(query, values)

# Save changes
conn.commit()

print("✅ Doctors imported successfully!")
print("Total Doctors:", len(df))

cursor.close()
conn.close()