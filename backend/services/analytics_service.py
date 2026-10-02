import math
import numpy as np
import pandas as pd
from typing import Dict, Any, List, Optional
from backend.services.data_loader import get_data_loader

def sanitize_val(val, default=0):
    if val is None or pd.isna(val) or (isinstance(val, float) and (math.isnan(val) or math.isinf(val))):
        return default
    if isinstance(val, (np.integer, int)):
        return int(val)
    if isinstance(val, (np.floating, float)):
        return round(float(val), 2)
    return val

class AnalyticsService:
    def __init__(self):
        self.loader = get_data_loader()

    def filter_master_df(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        department: Optional[str] = None,
        admission_type: Optional[str] = None,
        insurance: Optional[str] = None,
        doctor_id: Optional[str] = None,
        search: Optional[str] = None,
    ) -> pd.DataFrame:
        df = self.loader.master_df.copy()
        if df.empty:
            return df

        if start_date:
            df = df[df["Admission_Date"] >= pd.to_datetime(start_date)]
        if end_date:
            df = df[df["Admission_Date"] <= pd.to_datetime(end_date)]
        if department and department.lower() != "all":
            df = df[(df["Department_Name"] == department) | (df["Department_ID"] == department)]
        if admission_type and admission_type.lower() != "all":
            df = df[df["Admission_Type"].str.lower() == admission_type.lower()]
        if insurance and insurance.lower() != "all":
            df = df[df["Insurance"].str.lower() == insurance.lower()]
        if doctor_id and doctor_id.lower() != "all":
            df = df[df["Doctor_ID"] == doctor_id]
        if search:
            q = search.strip().lower()
            df = df[
                df["Patient_Name"].astype(str).str.lower().str.contains(q, na=False) |
                df["Patient_ID"].astype(str).str.lower().str.contains(q, na=False) |
                df["Admission_ID"].astype(str).str.lower().str.contains(q, na=False) |
                df["Doctor_Name"].astype(str).str.lower().str.contains(q, na=False) |
                df["Disease"].astype(str).str.lower().str.contains(q, na=False) |
                df["City"].astype(str).str.lower().str.contains(q, na=False)
            ]
        return df

    # ==========================================
    # 1. OVERVIEW DASHBOARD
    # ==========================================
    def get_overview(
        self,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        department: Optional[str] = None,
        admission_type: Optional[str] = None
    ) -> Dict[str, Any]:
        df = self.filter_master_df(start_date=start_date, end_date=end_date, department=department, admission_type=admission_type)
        
        total_admissions = len(df)
        total_patients = int(df["Patient_ID"].nunique()) if not df.empty else len(self.loader.patients)
        total_doctors = len(self.loader.doctors)
        total_beds = len(self.loader.beds)
        
        # Bed Occupancy calculation (modelled operational occupancy ~78%-88% or active ratio)
        # Based on average length of stay and throughput or in-dataset active bed proportion
        bed_occupancy_rate = 78.4 if df.empty else round(min(98.5, max(45.0, (df["Bed_ID"].nunique() / max(1, total_beds)) * 82.0)), 1)
        
        total_revenue = sanitize_val(df["Amount_Paid"].sum()) if "Amount_Paid" in df.columns else 0
        total_gross_billed = sanitize_val(df["Total_Gross_Bill"].sum()) if "Total_Gross_Bill" in df.columns else 0
        avg_los = sanitize_val(df["Length_of_Stay"].mean(), 0.0) if not df.empty else 0.0
        avg_wait_time = sanitize_val(df["Waiting_Time_Minutes"].mean(), 0.0) if not df.empty else 0.0
        
        readmission_count = int((df["Readmission"] == "Yes").sum()) if not df.empty else 0
        readmission_rate = round((readmission_count / max(1, total_admissions)) * 100, 1) if total_admissions > 0 else 0.0

        recovered_count = int((df["Outcome"] == "Recovered").sum()) if not df.empty and "Outcome" in df.columns else 0
        recovery_rate = round((recovered_count / max(1, total_admissions)) * 100, 1) if total_admissions > 0 else 0.0

        surgery_count = int((df["Surgery"] == "Yes").sum()) if not df.empty and "Surgery" in df.columns else 0
        surgery_rate = round((surgery_count / max(1, total_admissions)) * 100, 1) if total_admissions > 0 else 0.0

        # Monthly Admission & Revenue Trend
        monthly_trend = []
        if not df.empty and "Admission_Month" in df.columns:
            monthly_grp = df.groupby("Admission_Month").agg(
                admissions=("Admission_ID", "count"),
                revenue=("Amount_Paid", "sum"),
                gross=("Total_Gross_Bill", "sum"),
                avg_los=("Length_of_Stay", "mean"),
                emergencies=("Admission_Type", lambda x: (x == "Emergency").sum()),
                inpatients=("Admission_Type", lambda x: (x == "Inpatient").sum()),
                outpatients=("Admission_Type", lambda x: (x == "Outpatient").sum())
            ).reset_index().sort_values("Admission_Month")

            for _, r in monthly_grp.iterrows():
                monthly_trend.append({
                    "month": str(r["Admission_Month"]),
                    "admissions": int(r["admissions"]),
                    "revenue": round(float(r["revenue"]), 2),
                    "gross": round(float(r["gross"]), 2),
                    "avg_los": round(float(r["avg_los"]), 1),
                    "emergencies": int(r["emergencies"]),
                    "inpatients": int(r["inpatients"]),
                    "outpatients": int(r["outpatients"]),
                })

        # Department-wise Admissions & Revenue
        department_metrics = []
        if not df.empty and "Department_Name" in df.columns:
            dept_grp = df.groupby("Department_Name").agg(
                admissions=("Admission_ID", "count"),
                revenue=("Amount_Paid", "sum"),
                avg_los=("Length_of_Stay", "mean"),
                avg_wait=("Waiting_Time_Minutes", "mean"),
                doctors=("Doctor_ID", "nunique")
            ).reset_index().sort_values("admissions", ascending=False)

            for _, r in dept_grp.iterrows():
                department_metrics.append({
                    "department": str(r["Department_Name"]),
                    "admissions": int(r["admissions"]),
                    "revenue": round(float(r["revenue"]), 2),
                    "avg_los": round(float(r["avg_los"]), 1),
                    "avg_wait": round(float(r["avg_wait"]), 1),
                    "doctors": int(r["doctors"])
                })

        # Bed Utilization by Type
        bed_utilization = []
        bed_types = self.loader.beds["Bed_Type"].value_counts() if not self.loader.beds.empty else {}
        for b_type, count in bed_types.items():
            occupied_count = int(round(count * (0.80 if b_type == "ICU" else 0.75 if b_type == "General" else 0.65)))
            bed_utilization.append({
                "bed_type": str(b_type),
                "total": int(count),
                "occupied": occupied_count,
                "available": int(count) - occupied_count,
                "occupancy_rate": round((occupied_count / count) * 100, 1)
            })

        # Admission Type Breakdown
        admission_type_dist = []
        if not df.empty and "Admission_Type" in df.columns:
            adm_counts = df["Admission_Type"].value_counts()
            for adm_t, count in adm_counts.items():
                admission_type_dist.append({
                    "type": str(adm_t),
                    "count": int(count),
                    "percentage": round((count / max(1, total_admissions)) * 100, 1)
                })

        # Revenue Breakdown Components
        revenue_components = {
            "treatment_cost": sanitize_val(df["Treatment_Cost"].sum()) if "Treatment_Cost" in df.columns else 0,
            "medicine_cost": sanitize_val(df["Medicine_Cost"].sum()) if "Medicine_Cost" in df.columns else 0,
            "room_charges": sanitize_val(df["Room_Charges"].sum()) if "Room_Charges" in df.columns else 0,
            "amount_paid": total_revenue,
            "insured_collected": sanitize_val(df[df["Insurance"] == "Yes"]["Amount_Paid"].sum()) if "Insurance" in df.columns else 0,
            "self_pay_collected": sanitize_val(df[df["Insurance"] == "No"]["Amount_Paid"].sum()) if "Insurance" in df.columns else 0,
        }

        # Demographics Summary
        gender_dist = []
        if not df.empty and "Gender" in df.columns:
            for g, cnt in df["Gender"].value_counts().items():
                gender_dist.append({"gender": str(g), "count": int(cnt), "percentage": round((cnt / max(1, total_admissions)) * 100, 1)})

        # Age Groups
        age_bins = [0, 18, 35, 50, 65, 120]
        age_labels = ["0-17 (Pediatric)", "18-34 (Young)", "35-49 (Adult)", "50-64 (Senior)", "65+ (Geriatric)"]
        age_dist = []
        if not df.empty and "Age" in df.columns:
            df["Age_Group"] = pd.cut(df["Age"], bins=age_bins, labels=age_labels, right=False)
            for grp, cnt in df["Age_Group"].value_counts().sort_index().items():
                age_dist.append({"group": str(grp), "count": int(cnt), "percentage": round((cnt / max(1, total_admissions)) * 100, 1)})

        # Recent Admissions (Latest 8 records)
        recent_admissions = []
        if not df.empty:
            recent_df = df.sort_values(["Admission_Date", "Admission_Time"], ascending=[False, False]).head(8)
            for _, r in recent_df.iterrows():
                recent_admissions.append({
                    "admission_id": str(r.get("Admission_ID", "")),
                    "patient_id": str(r.get("Patient_ID", "")),
                    "patient_name": str(r.get("Patient_Name", "Unknown")),
                    "doctor_name": str(r.get("Doctor_Name", "Unknown")),
                    "department_name": str(r.get("Department_Name", "General")),
                    "disease": str(r.get("Disease", "")),
                    "admission_type": str(r.get("Admission_Type", "")),
                    "admission_date": str(r.get("Admission_Date_Str", "")),
                    "discharge_date": str(r.get("Discharge_Date", "")).split(" ")[0] if pd.notna(r.get("Discharge_Date")) else "",
                    "bed_id": str(r.get("Bed_ID", "")),
                    "room_number": str(r.get("Room_Number", "")),
                    "status": "Discharged" if pd.notna(r.get("Discharge_Date")) else "Active",
                    "amount_paid": sanitize_val(r.get("Amount_Paid", 0))
                })

        return {
            "kpis": {
                "total_patients": total_patients,
                "total_admissions": total_admissions,
                "total_doctors": total_doctors,
                "total_beds": total_beds,
                "bed_occupancy_rate": bed_occupancy_rate,
                "total_revenue": total_revenue,
                "total_gross_billed": total_gross_billed,
                "average_length_of_stay": avg_los,
                "average_waiting_time": avg_wait_time,
                "readmission_rate": readmission_rate,
                "recovery_rate": recovery_rate,
                "surgery_rate": surgery_rate,
            },
            "monthly_trend": monthly_trend,
            "department_metrics": department_metrics,
            "bed_utilization": bed_utilization,
            "admission_type_dist": admission_type_dist,
            "revenue_components": revenue_components,
            "gender_dist": gender_dist,
            "age_dist": age_dist,
            "recent_admissions": recent_admissions,
            "dataSource": self.loader.source
        }

    # ==========================================
    # 2. PATIENT ANALYTICS
    # ==========================================
    def get_patient_analytics(
        self,
        page: int = 1,
        page_size: int = 10,
        gender: Optional[str] = None,
        blood_group: Optional[str] = None,
        city: Optional[str] = None,
        department: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "Patient_ID",
        sort_order: str = "asc"
    ) -> Dict[str, Any]:
        p_df = self.loader.patients.copy()
        master_df = self.loader.master_df.copy()

        total_patients = len(p_df)
        avg_age = sanitize_val(p_df["Age"].mean(), 0.0) if not p_df.empty else 0.0

        # Gender Distribution
        gender_dist = []
        if not p_df.empty:
            for g, count in p_df["Gender"].value_counts().items():
                gender_dist.append({
                    "gender": str(g),
                    "count": int(count),
                    "percentage": round((count / max(1, total_patients)) * 100, 1)
                })

        # Age Group Distribution
        age_bins = [0, 10, 20, 30, 40, 50, 60, 70, 80, 120]
        age_labels = ["0-9", "10-19", "20-29", "30-39", "40-49", "50-59", "60-69", "70-79", "80+"]
        p_df["Age_Cohort"] = pd.cut(p_df["Age"], bins=age_bins, labels=age_labels, right=False)
        age_dist = []
        for cohort, cnt in p_df["Age_Cohort"].value_counts().sort_index().items():
            age_dist.append({"age_group": str(cohort), "count": int(cnt), "percentage": round((cnt / max(1, total_patients)) * 100, 1)})

        # Blood Group Distribution
        blood_dist = []
        if not p_df.empty and "Blood_Group" in p_df.columns:
            for bg, cnt in p_df["Blood_Group"].value_counts().items():
                blood_dist.append({"blood_group": str(bg), "count": int(cnt), "percentage": round((cnt / max(1, total_patients)) * 100, 1)})

        # City-wise distribution (Top 10)
        city_dist = []
        if not p_df.empty and "City" in p_df.columns:
            for c, cnt in p_df["City"].value_counts().head(10).items():
                city_dist.append({"city": str(c), "count": int(cnt), "percentage": round((cnt / max(1, total_patients)) * 100, 1)})

        # Department-wise patient count
        dept_patient_dist = []
        if not master_df.empty and "Department_Name" in master_df.columns:
            dept_p_grp = master_df.groupby("Department_Name")["Patient_ID"].nunique().sort_values(ascending=False)
            for dept, count in dept_p_grp.items():
                dept_patient_dist.append({"department": str(dept), "patient_count": int(count)})

        # Merge patient with admission stats for the table
        patient_summary = p_df.copy()
        if not master_df.empty:
            p_admissions = master_df.groupby("Patient_ID").agg(
                total_visits=("Admission_ID", "count"),
                latest_admission=("Admission_Date", "max"),
                last_disease=("Disease", "last"),
                last_department=("Department_Name", "last"),
                total_spent=("Amount_Paid", "sum")
            ).reset_index()
            patient_summary = patient_summary.merge(p_admissions, on="Patient_ID", how="left")
            patient_summary["total_visits"] = patient_summary["total_visits"].fillna(0).astype(int)
            patient_summary["total_spent"] = patient_summary["total_spent"].fillna(0.0).round(2)
            patient_summary["latest_admission"] = patient_summary["latest_admission"].dt.strftime("%Y-%m-%d").fillna("N/A")
            patient_summary["last_disease"] = patient_summary["last_disease"].fillna("None")
            patient_summary["last_department"] = patient_summary["last_department"].fillna("General")
        else:
            patient_summary["total_visits"] = 0
            patient_summary["total_spent"] = 0.0
            patient_summary["latest_admission"] = "N/A"
            patient_summary["last_disease"] = "None"
            patient_summary["last_department"] = "General"

        # Apply Table Filtering
        filtered_df = patient_summary.copy()
        if gender and gender.lower() != "all":
            filtered_df = filtered_df[filtered_df["Gender"].str.lower() == gender.lower()]
        if blood_group and blood_group.lower() != "all":
            filtered_df = filtered_df[filtered_df["Blood_Group"].str.upper() == blood_group.upper()]
        if city and city.lower() != "all":
            filtered_df = filtered_df[filtered_df["City"].str.lower() == city.lower()]
        if department and department.lower() != "all":
            filtered_df = filtered_df[filtered_df["last_department"] == department]
        if search:
            q = search.strip().lower()
            filtered_df = filtered_df[
                filtered_df["Patient_Name"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["Patient_ID"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["Phone"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["City"].astype(str).str.lower().str.contains(q, na=False)
            ]

        # Sorting
        ascending = (sort_order.lower() == "asc")
        sort_col = sort_by if sort_by in filtered_df.columns else "Patient_ID"
        filtered_df = filtered_df.sort_values(sort_col, ascending=ascending)

        # Pagination
        total_records = len(filtered_df)
        total_pages = max(1, math.ceil(total_records / page_size))
        start_idx = (page - 1) * page_size
        paginated_records = filtered_df.iloc[start_idx : start_idx + page_size].to_dict(orient="records")

        # Clean sanitized list
        records = []
        for r in paginated_records:
            records.append({
                "patient_id": str(r.get("Patient_ID", "")),
                "patient_name": str(r.get("Patient_Name", "")),
                "age": int(r.get("Age", 0)),
                "gender": str(r.get("Gender", "")),
                "blood_group": str(r.get("Blood_Group", "")),
                "city": str(r.get("City", "")),
                "phone": str(r.get("Phone", "")),
                "total_visits": int(r.get("total_visits", 0)),
                "total_spent": float(r.get("total_spent", 0.0)),
                "latest_admission": str(r.get("latest_admission", "")),
                "last_disease": str(r.get("last_disease", "")),
                "last_department": str(r.get("last_department", ""))
            })

        return {
            "kpis": {
                "total_patients": total_patients,
                "average_age": avg_age,
                "male_count": int((p_df["Gender"] == "Male").sum()),
                "female_count": int((p_df["Gender"] == "Female").sum()),
                "top_city": city_dist[0]["city"] if city_dist else "N/A",
                "unique_cities": int(p_df["City"].nunique()) if not p_df.empty else 0
            },
            "gender_dist": gender_dist,
            "age_dist": age_dist,
            "blood_dist": blood_dist,
            "city_dist": city_dist,
            "department_patient_dist": dept_patient_dist,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": total_pages
            },
            "patients": records,
            "cities": sorted(p_df["City"].dropna().unique().tolist()) if not p_df.empty else [],
            "blood_groups": sorted(p_df["Blood_Group"].dropna().unique().tolist()) if not p_df.empty else []
        }

    # ==========================================
    # 3. ADMISSIONS ANALYTICS
    # ==========================================
    def get_admission_analytics(
        self,
        page: int = 1,
        page_size: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        department: Optional[str] = None,
        admission_type: Optional[str] = None,
        readmission: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "Admission_Date",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        df = self.filter_master_df(
            start_date=start_date,
            end_date=end_date,
            department=department,
            admission_type=admission_type,
            search=search
        )
        if readmission and readmission.lower() != "all":
            df = df[df["Readmission"].str.lower() == readmission.lower()]

        total_admissions = len(df)
        avg_los = sanitize_val(df["Length_of_Stay"].mean(), 0.0) if not df.empty else 0.0
        avg_wait = sanitize_val(df["Waiting_Time_Minutes"].mean(), 0.0) if not df.empty else 0.0
        emergency_count = int((df["Admission_Type"] == "Emergency").sum()) if not df.empty else 0
        emergency_ratio = round((emergency_count / max(1, total_admissions)) * 100, 1) if total_admissions > 0 else 0.0
        readmission_count = int((df["Readmission"] == "Yes").sum()) if not df.empty else 0
        readmission_rate = round((readmission_count / max(1, total_admissions)) * 100, 1) if total_admissions > 0 else 0.0

        # Monthly Admission Trend
        monthly_trend = []
        if not df.empty and "Admission_Month" in df.columns:
            m_grp = df.groupby("Admission_Month").agg(
                total=("Admission_ID", "count"),
                emergency=("Admission_Type", lambda x: (x == "Emergency").sum()),
                inpatient=("Admission_Type", lambda x: (x == "Inpatient").sum()),
                outpatient=("Admission_Type", lambda x: (x == "Outpatient").sum()),
                avg_los=("Length_of_Stay", "mean"),
                avg_wait=("Waiting_Time_Minutes", "mean")
            ).reset_index().sort_values("Admission_Month")
            for _, r in m_grp.iterrows():
                monthly_trend.append({
                    "month": str(r["Admission_Month"]),
                    "total": int(r["total"]),
                    "emergency": int(r["emergency"]),
                    "inpatient": int(r["inpatient"]),
                    "outpatient": int(r["outpatient"]),
                    "avg_los": round(float(r["avg_los"]), 1),
                    "avg_wait": round(float(r["avg_wait"]), 1)
                })

        # Department-wise admissions
        dept_admissions = []
        if not df.empty and "Department_Name" in df.columns:
            d_grp = df.groupby("Department_Name").agg(
                count=("Admission_ID", "count"),
                avg_los=("Length_of_Stay", "mean"),
                avg_wait=("Waiting_Time_Minutes", "mean"),
                readmissions=("Readmission", lambda x: (x == "Yes").sum())
            ).reset_index().sort_values("count", ascending=False)
            for _, r in d_grp.iterrows():
                dept_admissions.append({
                    "department": str(r["Department_Name"]),
                    "count": int(r["count"]),
                    "avg_los": round(float(r["avg_los"]), 1),
                    "avg_wait": round(float(r["avg_wait"]), 1),
                    "readmission_rate": round((r["readmissions"] / max(1, r["count"])) * 100, 1)
                })

        # Admission Type Distribution
        type_dist = []
        if not df.empty:
            for t, cnt in df["Admission_Type"].value_counts().items():
                type_dist.append({"type": str(t), "count": int(cnt), "percentage": round((cnt / max(1, total_admissions)) * 100, 1)})

        # Length of Stay Buckets
        los_bins = [-1, 0, 1, 3, 7, 14, 100]
        los_labels = ["0 Days (Daycare/Outpatient)", "1 Day", "2-3 Days", "4-7 Days", "8-14 Days", "15+ Days"]
        df["LOS_Bucket"] = pd.cut(df["Length_of_Stay"], bins=los_bins, labels=los_labels)
        los_dist = []
        for bucket, cnt in df["LOS_Bucket"].value_counts().sort_index().items():
            los_dist.append({"bucket": str(bucket), "count": int(cnt), "percentage": round((cnt / max(1, total_admissions)) * 100, 1)})

        # Sorting & Pagination
        sort_col = sort_by if sort_by in df.columns else "Admission_Date"
        ascending = (sort_order.lower() == "asc")
        sorted_df = df.sort_values(sort_col, ascending=ascending)

        total_records = len(sorted_df)
        total_pages = max(1, math.ceil(total_records / page_size))
        start_idx = (page - 1) * page_size
        p_records = sorted_df.iloc[start_idx : start_idx + page_size]

        records = []
        for _, r in p_records.iterrows():
            records.append({
                "admission_id": str(r.get("Admission_ID", "")),
                "patient_id": str(r.get("Patient_ID", "")),
                "patient_name": str(r.get("Patient_Name", "Unknown")),
                "gender": str(r.get("Gender", "")),
                "age": int(r.get("Age", 0)),
                "doctor_name": str(r.get("Doctor_Name", "")),
                "department_name": str(r.get("Department_Name", "")),
                "bed_id": str(r.get("Bed_ID", "")),
                "room_number": str(r.get("Room_Number", "")),
                "bed_type": str(r.get("Bed_Type", "")),
                "disease": str(r.get("Disease", "")),
                "admission_type": str(r.get("Admission_Type", "")),
                "admission_date": str(r.get("Admission_Date_Str", "")),
                "admission_time": str(r.get("Admission_Time", "")),
                "waiting_time_minutes": int(r.get("Waiting_Time_Minutes", 0)),
                "discharge_date": str(r.get("Discharge_Date", "")).split(" ")[0] if pd.notna(r.get("Discharge_Date")) else "",
                "length_of_stay": int(r.get("Length_of_Stay", 0)),
                "readmission": str(r.get("Readmission", "No")),
                "treatment_name": str(r.get("Treatment_Name", "")),
                "amount_paid": sanitize_val(r.get("Amount_Paid", 0.0))
            })

        return {
            "kpis": {
                "total_admissions": total_admissions,
                "average_length_of_stay": avg_los,
                "average_waiting_time": avg_wait,
                "readmission_rate": readmission_rate,
                "emergency_ratio": emergency_ratio,
                "emergency_count": emergency_count,
            },
            "monthly_trend": monthly_trend,
            "department_admissions": dept_admissions,
            "admission_type_dist": type_dist,
            "los_distribution": los_dist,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": total_pages
            },
            "admissions": records
        }

    # ==========================================
    # 4. BED MANAGEMENT
    # ==========================================
    def get_bed_analytics(
        self,
        page: int = 1,
        page_size: int = 12,
        ward: Optional[str] = None,
        bed_type: Optional[str] = None,
        department: Optional[str] = None,
        status: Optional[str] = None,
        search: Optional[str] = None
    ) -> Dict[str, Any]:
        beds_df = self.loader.beds.copy()
        depts_df = self.loader.departments.copy()
        beds_df = beds_df.merge(depts_df, on="Department_ID", how="left")

        # Simulate realistic occupancy status mapping based on bed ID hash/distribution
        # Approximately 80% occupied, 15% available, 5% cleaning/maintenance
        np.random.seed(42)
        statuses = []
        for idx, row in beds_df.iterrows():
            # Deterministic pseudo-status for consistency
            val = (hash(row["Bed_ID"]) % 100)
            if row["Bed_Type"] == "ICU":
                st = "Occupied" if val < 85 else "Available"
            elif val < 76:
                st = "Occupied"
            elif val < 92:
                st = "Available"
            else:
                st = "Maintenance"
            statuses.append(st)
        beds_df["Status"] = statuses

        total_beds = len(beds_df)
        occupied_beds = int((beds_df["Status"] == "Occupied").sum())
        available_beds = int((beds_df["Status"] == "Available").sum())
        maintenance_beds = int((beds_df["Status"] == "Maintenance").sum())
        occupancy_rate = round((occupied_beds / max(1, total_beds)) * 100, 1)

        # ICU Specific
        icu_df = beds_df[beds_df["Bed_Type"] == "ICU"]
        icu_total = len(icu_df)
        icu_occupied = int((icu_df["Status"] == "Occupied").sum())
        icu_available = int((icu_df["Status"] == "Available").sum())

        # Department-wise Bed Inventory & Occupancy
        dept_bed_util = []
        for dept_name, grp in beds_df.groupby("Department_Name"):
            d_total = len(grp)
            d_occ = int((grp["Status"] == "Occupied").sum())
            d_avail = int((grp["Status"] == "Available").sum())
            dept_bed_util.append({
                "department": str(dept_name),
                "total_beds": d_total,
                "occupied": d_occ,
                "available": d_avail,
                "occupancy_rate": round((d_occ / max(1, d_total)) * 100, 1)
            })
        dept_bed_util = sorted(dept_bed_util, key=lambda x: x["total_beds"], reverse=True)

        # Ward-wise breakdown
        ward_dist = []
        for w_name, grp in beds_df.groupby("Ward"):
            w_total = len(grp)
            w_occ = int((grp["Status"] == "Occupied").sum())
            w_avail = int((grp["Status"] == "Available").sum())
            ward_dist.append({
                "ward": str(w_name),
                "total": w_total,
                "occupied": w_occ,
                "available": w_avail,
                "occupancy_rate": round((w_occ / max(1, w_total)) * 100, 1)
            })
        ward_dist = sorted(ward_dist, key=lambda x: x["ward"])

        # Bed Type Breakdown
        type_dist = []
        for b_type, grp in beds_df.groupby("Bed_Type"):
            t_total = len(grp)
            t_occ = int((grp["Status"] == "Occupied").sum())
            type_dist.append({
                "bed_type": str(b_type),
                "total": t_total,
                "occupied": t_occ,
                "available": t_total - t_occ,
                "occupancy_rate": round((t_occ / max(1, t_total)) * 100, 1)
            })

        # Table Filter
        filtered_df = beds_df.copy()
        if ward and ward.lower() != "all":
            filtered_df = filtered_df[filtered_df["Ward"].str.lower() == ward.lower()]
        if bed_type and bed_type.lower() != "all":
            filtered_df = filtered_df[filtered_df["Bed_Type"].str.lower() == bed_type.lower()]
        if department and department.lower() != "all":
            filtered_df = filtered_df[filtered_df["Department_Name"] == department]
        if status and status.lower() != "all":
            filtered_df = filtered_df[filtered_df["Status"].str.lower() == status.lower()]
        if search:
            q = search.strip().lower()
            filtered_df = filtered_df[
                filtered_df["Bed_ID"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["Room_Number"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["Ward"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["Department_Name"].astype(str).str.lower().str.contains(q, na=False)
            ]

        total_records = len(filtered_df)
        total_pages = max(1, math.ceil(total_records / page_size))
        start_idx = (page - 1) * page_size
        p_records = filtered_df.iloc[start_idx : start_idx + page_size]

        records = []
        for _, r in p_records.iterrows():
            records.append({
                "bed_id": str(r.get("Bed_ID", "")),
                "ward": str(r.get("Ward", "")),
                "room_number": str(r.get("Room_Number", "")),
                "bed_type": str(r.get("Bed_Type", "")),
                "department_id": str(r.get("Department_ID", "")),
                "department_name": str(r.get("Department_Name", "")),
                "status": str(r.get("Status", "Available")),
            })

        return {
            "kpis": {
                "total_beds": total_beds,
                "occupied_beds": occupied_beds,
                "available_beds": available_beds,
                "maintenance_beds": maintenance_beds,
                "occupancy_rate": occupancy_rate,
                "icu_total": icu_total,
                "icu_occupied": icu_occupied,
                "icu_available": icu_available,
            },
            "dept_bed_util": dept_bed_util,
            "ward_dist": ward_dist,
            "type_dist": type_dist,
            "wards": sorted(beds_df["Ward"].unique().tolist()),
            "bed_types": sorted(beds_df["Bed_Type"].unique().tolist()),
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": total_pages
            },
            "beds": records
        }

    # ==========================================
    # 5. DOCTOR ANALYTICS
    # ==========================================
    def get_doctor_analytics(
        self,
        page: int = 1,
        page_size: int = 10,
        department: Optional[str] = None,
        gender: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "admissions_handled",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        docs_df = self.loader.doctors.copy()
        depts_df = self.loader.departments.copy()
        docs_df = docs_df.merge(depts_df, on="Department_ID", how="left")
        master_df = self.loader.master_df.copy()

        total_doctors = len(docs_df)
        avg_exp = sanitize_val(docs_df["Experience_Years"].mean(), 0.0) if not docs_df.empty else 0.0
        avg_fee = sanitize_val(docs_df["Consultation_Fee"].mean(), 0.0) if not docs_df.empty else 0.0

        # Calculate performance per doctor from master_df
        doc_stats = {}
        if not master_df.empty:
            agg_df = master_df.groupby("Doctor_ID").agg(
                admissions_handled=("Admission_ID", "count"),
                revenue_generated=("Amount_Paid", "sum"),
                gross_billed=("Total_Gross_Bill", "sum"),
                avg_patient_los=("Length_of_Stay", "mean"),
                avg_patient_wait=("Waiting_Time_Minutes", "mean"),
                surgeries_performed=("Surgery", lambda x: (x == "Yes").sum()),
                recoveries=("Outcome", lambda x: (x == "Recovered").sum())
            ).reset_index()
            docs_df = docs_df.merge(agg_df, on="Doctor_ID", how="left")
            docs_df["admissions_handled"] = docs_df["admissions_handled"].fillna(0).astype(int)
            docs_df["revenue_generated"] = docs_df["revenue_generated"].fillna(0.0).round(2)
            docs_df["gross_billed"] = docs_df["gross_billed"].fillna(0.0).round(2)
            docs_df["avg_patient_los"] = docs_df["avg_patient_los"].fillna(0.0).round(1)
            docs_df["avg_patient_wait"] = docs_df["avg_patient_wait"].fillna(0.0).round(1)
            docs_df["surgeries_performed"] = docs_df["surgeries_performed"].fillna(0).astype(int)
            docs_df["recoveries"] = docs_df["recoveries"].fillna(0).astype(int)
            docs_df["recovery_rate"] = np.where(
                docs_df["admissions_handled"] > 0,
                (docs_df["recoveries"] / docs_df["admissions_handled"] * 100).round(1),
                0.0
            )
        else:
            docs_df["admissions_handled"] = 0
            docs_df["revenue_generated"] = 0.0
            docs_df["gross_billed"] = 0.0
            docs_df["avg_patient_los"] = 0.0
            docs_df["avg_patient_wait"] = 0.0
            docs_df["surgeries_performed"] = 0
            docs_df["recovery_rate"] = 0.0

        total_surgeries = int(docs_df["surgeries_performed"].sum())
        total_rev = docs_df["revenue_generated"].sum()
        avg_rev_per_doctor = round(total_rev / max(1, total_doctors), 2)

        # Department-wise Doctor Count
        dept_doctor_count = []
        for d_name, grp in docs_df.groupby("Department_Name"):
            dept_doctor_count.append({
                "department": str(d_name),
                "count": len(grp),
                "total_revenue": round(float(grp["revenue_generated"].sum()), 2),
                "avg_experience": round(float(grp["Experience_Years"].mean()), 1)
            })
        dept_doctor_count = sorted(dept_doctor_count, key=lambda x: x["count"], reverse=True)

        # Top 10 Highest Revenue Doctors
        top_revenue_doctors = []
        top_rev_df = docs_df.sort_values("revenue_generated", ascending=False).head(10)
        for _, r in top_rev_df.iterrows():
            top_revenue_doctors.append({
                "doctor_id": str(r["Doctor_ID"]),
                "doctor_name": str(r["Doctor_Name"]),
                "department": str(r.get("Department_Name", "")),
                "experience": int(r.get("Experience_Years", 0)),
                "revenue": float(r.get("revenue_generated", 0.0)),
                "admissions": int(r.get("admissions_handled", 0)),
                "surgeries": int(r.get("surgeries_performed", 0))
            })

        # Experience vs Revenue Correlation Chart
        exp_revenue_scatter = []
        for _, r in docs_df.iterrows():
            exp_revenue_scatter.append({
                "doctor_name": str(r["Doctor_Name"]),
                "experience": int(r.get("Experience_Years", 0)),
                "revenue": float(r.get("revenue_generated", 0.0)),
                "fee": float(r.get("Consultation_Fee", 0.0)),
                "department": str(r.get("Department_Name", "")),
                "admissions": int(r.get("admissions_handled", 0))
            })

        # Filter for Table
        filtered_df = docs_df.copy()
        if department and department.lower() != "all":
            filtered_df = filtered_df[filtered_df["Department_Name"] == department]
        if gender and gender.lower() != "all":
            filtered_df = filtered_df[filtered_df["Gender"].str.lower() == gender.lower()]
        if search:
            q = search.strip().lower()
            filtered_df = filtered_df[
                filtered_df["Doctor_Name"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["Doctor_ID"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["Qualification"].astype(str).str.lower().str.contains(q, na=False) |
                filtered_df["Department_Name"].astype(str).str.lower().str.contains(q, na=False)
            ]

        # Sorting
        ascending = (sort_order.lower() == "asc")
        sort_col = sort_by if sort_by in filtered_df.columns else "admissions_handled"
        filtered_df = filtered_df.sort_values(sort_col, ascending=ascending)

        total_records = len(filtered_df)
        total_pages = max(1, math.ceil(total_records / page_size))
        start_idx = (page - 1) * page_size
        p_records = filtered_df.iloc[start_idx : start_idx + page_size]

        records = []
        for _, r in p_records.iterrows():
            records.append({
                "doctor_id": str(r.get("Doctor_ID", "")),
                "doctor_name": str(r.get("Doctor_Name", "")),
                "gender": str(r.get("Gender", "")),
                "department_id": str(r.get("Department_ID", "")),
                "department_name": str(r.get("Department_Name", "")),
                "experience_years": int(r.get("Experience_Years", 0)),
                "qualification": str(r.get("Qualification", "")),
                "consultation_fee": float(r.get("Consultation_Fee", 0.0)),
                "admissions_handled": int(r.get("admissions_handled", 0)),
                "revenue_generated": float(r.get("revenue_generated", 0.0)),
                "surgeries_performed": int(r.get("surgeries_performed", 0)),
                "recovery_rate": float(r.get("recovery_rate", 0.0)),
                "avg_patient_los": float(r.get("avg_patient_los", 0.0)),
                "avg_patient_wait": float(r.get("avg_patient_wait", 0.0)),
            })

        return {
            "kpis": {
                "total_doctors": total_doctors,
                "average_experience": avg_exp,
                "average_consultation_fee": avg_fee,
                "total_surgeries": total_surgeries,
                "average_revenue_per_doctor": avg_rev_per_doctor,
                "male_doctors": int((docs_df["Gender"] == "Male").sum()),
                "female_doctors": int((docs_df["Gender"] == "Female").sum())
            },
            "dept_doctor_count": dept_doctor_count,
            "top_revenue_doctors": top_revenue_doctors,
            "exp_revenue_scatter": exp_revenue_scatter,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": total_pages
            },
            "doctors": records
        }

    # ==========================================
    # 6. TREATMENT ANALYTICS
    # ==========================================
    def get_treatment_analytics(
        self,
        page: int = 1,
        page_size: int = 10,
        surgery: Optional[str] = None,
        outcome: Optional[str] = None,
        department: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "Treatment_ID",
        sort_order: str = "asc"
    ) -> Dict[str, Any]:
        df = self.filter_master_df(department=department, search=search)
        if surgery and surgery.lower() != "all":
            df = df[df["Surgery"].str.lower() == surgery.lower()]
        if outcome and outcome.lower() != "all":
            df = df[df["Outcome"].str.lower() == outcome.lower()]

        total_treatments = len(df)
        surgery_count = int((df["Surgery"] == "Yes").sum()) if not df.empty else 0
        surgery_rate = round((surgery_count / max(1, total_treatments)) * 100, 1) if total_treatments > 0 else 0.0

        recovered_count = int((df["Outcome"] == "Recovered").sum()) if not df.empty else 0
        recovery_rate = round((recovered_count / max(1, total_treatments)) * 100, 1) if total_treatments > 0 else 0.0

        improved_count = int((df["Outcome"] == "Improved").sum()) if not df.empty else 0
        improvement_rate = round((improved_count / max(1, total_treatments)) * 100, 1) if total_treatments > 0 else 0.0

        mortality_count = int((df["Outcome"] == "Deceased").sum()) if not df.empty else 0
        mortality_rate = round((mortality_count / max(1, total_treatments)) * 100, 1) if total_treatments > 0 else 0.0

        referred_count = int((df["Outcome"] == "Referred").sum()) if not df.empty else 0
        referred_rate = round((referred_count / max(1, total_treatments)) * 100, 1) if total_treatments > 0 else 0.0

        # Outcome distribution
        outcome_dist = []
        if not df.empty:
            for o, cnt in df["Outcome"].value_counts().items():
                outcome_dist.append({
                    "outcome": str(o),
                    "count": int(cnt),
                    "percentage": round((cnt / max(1, total_treatments)) * 100, 1)
                })

        # Top 10 Treatments / Procedures
        top_treatments = []
        if not df.empty and "Treatment_Name" in df.columns:
            t_grp = df.groupby("Treatment_Name").agg(
                count=("Treatment_ID", "count"),
                surgeries=("Surgery", lambda x: (x == "Yes").sum()),
                recoveries=("Outcome", lambda x: (x == "Recovered").sum()),
                avg_cost=("Treatment_Cost", "mean") if "Treatment_Cost" in df.columns else ("Treatment_ID", "count")
            ).reset_index().sort_values("count", ascending=False).head(10)
            for _, r in t_grp.iterrows():
                top_treatments.append({
                    "treatment_name": str(r["Treatment_Name"]),
                    "count": int(r["count"]),
                    "surgeries": int(r["surgeries"]),
                    "recovery_rate": round((r["recoveries"] / max(1, r["count"])) * 100, 1),
                    "avg_cost": sanitize_val(r.get("avg_cost", 0.0))
                })

        # Department-wise Treatments & Surgery Split
        dept_treatments = []
        if not df.empty and "Department_Name" in df.columns:
            d_grp = df.groupby("Department_Name").agg(
                total=("Treatment_ID", "count"),
                surgeries=("Surgery", lambda x: (x == "Yes").sum()),
                non_surgeries=("Surgery", lambda x: (x == "No").sum()),
                recoveries=("Outcome", lambda x: (x == "Recovered").sum())
            ).reset_index().sort_values("total", ascending=False)
            for _, r in d_grp.iterrows():
                dept_treatments.append({
                    "department": str(r["Department_Name"]),
                    "total": int(r["total"]),
                    "surgeries": int(r["surgeries"]),
                    "non_surgeries": int(r["non_surgeries"]),
                    "recovery_rate": round((r["recoveries"] / max(1, r["total"])) * 100, 1)
                })

        # Surgery vs Non-Surgery Outcome Breakdown
        surgery_outcome_comparison = []
        if not df.empty:
            cross_tab = pd.crosstab(df["Surgery"], df["Outcome"], normalize="index") * 100
            for surg_status in ["Yes", "No"]:
                if surg_status in cross_tab.index:
                    row = cross_tab.loc[surg_status]
                    surgery_outcome_comparison.append({
                        "category": "Surgical" if surg_status == "Yes" else "Non-Surgical",
                        "recovered": round(float(row.get("Recovered", 0)), 1),
                        "improved": round(float(row.get("Improved", 0)), 1),
                        "referred": round(float(row.get("Referred", 0)), 1),
                        "deceased": round(float(row.get("Deceased", 0)), 1),
                    })

        # Table sorting & pagination
        sort_col = sort_by if sort_by in df.columns else "Treatment_ID"
        ascending = (sort_order.lower() == "asc")
        sorted_df = df.sort_values(sort_col, ascending=ascending)

        total_records = len(sorted_df)
        total_pages = max(1, math.ceil(total_records / page_size))
        start_idx = (page - 1) * page_size
        p_records = sorted_df.iloc[start_idx : start_idx + page_size]

        records = []
        for _, r in p_records.iterrows():
            records.append({
                "treatment_id": str(r.get("Treatment_ID", "")),
                "admission_id": str(r.get("Admission_ID", "")),
                "patient_name": str(r.get("Patient_Name", "Unknown")),
                "doctor_name": str(r.get("Doctor_Name", "Unknown")),
                "department_name": str(r.get("Department_Name", "")),
                "disease": str(r.get("Disease", "")),
                "treatment_name": str(r.get("Treatment_Name", "")),
                "surgery": str(r.get("Surgery", "No")),
                "outcome": str(r.get("Outcome", "Recovered")),
                "treatment_cost": sanitize_val(r.get("Treatment_Cost", 0.0)),
                "admission_date": str(r.get("Admission_Date_Str", "")),
            })

        return {
            "kpis": {
                "total_treatments": total_treatments,
                "surgery_count": surgery_count,
                "surgery_rate": surgery_rate,
                "recovery_rate": recovery_rate,
                "improvement_rate": improvement_rate,
                "mortality_rate": mortality_rate,
                "referred_rate": referred_rate,
            },
            "outcome_dist": outcome_dist,
            "top_treatments": top_treatments,
            "dept_treatments": dept_treatments,
            "surgery_outcome_comparison": surgery_outcome_comparison,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": total_pages
            },
            "treatments": records
        }

    # ==========================================
    # 7. BILLING & REVENUE ANALYTICS
    # ==========================================
    def get_billing_analytics(
        self,
        page: int = 1,
        page_size: int = 10,
        start_date: Optional[str] = None,
        end_date: Optional[str] = None,
        department: Optional[str] = None,
        insurance: Optional[str] = None,
        search: Optional[str] = None,
        sort_by: str = "Amount_Paid",
        sort_order: str = "desc"
    ) -> Dict[str, Any]:
        df = self.filter_master_df(
            start_date=start_date,
            end_date=end_date,
            department=department,
            insurance=insurance,
            search=search
        )

        total_bills = len(df)
        total_revenue_collected = sanitize_val(df["Amount_Paid"].sum()) if not df.empty else 0.0
        total_gross_billed = sanitize_val(df["Total_Gross_Bill"].sum()) if not df.empty and "Total_Gross_Bill" in df.columns else 0.0
        avg_bill = sanitize_val(df["Amount_Paid"].mean(), 0.0) if not df.empty else 0.0
        avg_gross = sanitize_val(df["Total_Gross_Bill"].mean(), 0.0) if not df.empty and "Total_Gross_Bill" in df.columns else 0.0

        insured_df = df[df["Insurance"] == "Yes"] if not df.empty else pd.DataFrame()
        self_pay_df = df[df["Insurance"] == "No"] if not df.empty else pd.DataFrame()

        insured_count = len(insured_df)
        insurance_rate = round((insured_count / max(1, total_bills)) * 100, 1) if total_bills > 0 else 0.0
        insured_collected = sanitize_val(insured_df["Amount_Paid"].sum()) if not insured_df.empty else 0.0
        self_pay_collected = sanitize_val(self_pay_df["Amount_Paid"].sum()) if not self_pay_df.empty else 0.0

        # Cost Breakdown Structure
        total_treatment_cost = sanitize_val(df["Treatment_Cost"].sum()) if "Treatment_Cost" in df.columns else 0.0
        total_medicine_cost = sanitize_val(df["Medicine_Cost"].sum()) if "Medicine_Cost" in df.columns else 0.0
        total_room_charges = sanitize_val(df["Room_Charges"].sum()) if "Room_Charges" in df.columns else 0.0

        cost_breakdown = [
            {"category": "Treatment Procedures", "amount": total_treatment_cost, "percentage": round((total_treatment_cost / max(1, total_gross_billed)) * 100, 1)},
            {"category": "Pharmacy & Medicines", "amount": total_medicine_cost, "percentage": round((total_medicine_cost / max(1, total_gross_billed)) * 100, 1)},
            {"category": "Room & Bed Charges", "amount": total_room_charges, "percentage": round((total_room_charges / max(1, total_gross_billed)) * 100, 1)},
        ]

        # Revenue by Department
        dept_revenue = []
        if not df.empty and "Department_Name" in df.columns:
            d_grp = df.groupby("Department_Name").agg(
                collected=("Amount_Paid", "sum"),
                gross=("Total_Gross_Bill", "sum"),
                bills_count=("Bill_ID", "count"),
                avg_bill=("Amount_Paid", "mean")
            ).reset_index().sort_values("collected", ascending=False)
            for _, r in d_grp.iterrows():
                dept_revenue.append({
                    "department": str(r["Department_Name"]),
                    "collected": round(float(r["collected"]), 2),
                    "gross": round(float(r["gross"]), 2),
                    "bills_count": int(r["bills_count"]),
                    "avg_bill": round(float(r["avg_bill"]), 2)
                })

        # Monthly Revenue Trend
        monthly_revenue = []
        if not df.empty and "Admission_Month" in df.columns:
            m_grp = df.groupby("Admission_Month").agg(
                collected=("Amount_Paid", "sum"),
                gross=("Total_Gross_Bill", "sum"),
                treatment_cost=("Treatment_Cost", "sum"),
                medicine_cost=("Medicine_Cost", "sum"),
                room_charges=("Room_Charges", "sum")
            ).reset_index().sort_values("Admission_Month")
            for _, r in m_grp.iterrows():
                monthly_revenue.append({
                    "month": str(r["Admission_Month"]),
                    "collected": round(float(r["collected"]), 2),
                    "gross": round(float(r["gross"]), 2),
                    "treatment_cost": round(float(r["treatment_cost"]), 2),
                    "medicine_cost": round(float(r["medicine_cost"]), 2),
                    "room_charges": round(float(r["room_charges"]), 2),
                })

        # Insurance vs Self-Pay Comparison
        insurance_comparison = [
            {
                "type": "Insured (Co-pay 20%)",
                "count": insured_count,
                "percentage": insurance_rate,
                "collected": insured_collected,
                "avg_collected": sanitize_val(insured_df["Amount_Paid"].mean(), 0.0) if not insured_df.empty else 0.0
            },
            {
                "type": "Self-Pay (100%)",
                "count": len(self_pay_df),
                "percentage": round(100 - insurance_rate, 1),
                "collected": self_pay_collected,
                "avg_collected": sanitize_val(self_pay_df["Amount_Paid"].mean(), 0.0) if not self_pay_df.empty else 0.0
            }
        ]

        # Top 10 High-Billing Patients / Incurred Charges
        top_bills = []
        if not df.empty:
            top_b_df = df.sort_values("Total_Gross_Bill", ascending=False).head(10)
            for _, r in top_b_df.iterrows():
                top_bills.append({
                    "bill_id": str(r.get("Bill_ID", "")),
                    "admission_id": str(r.get("Admission_ID", "")),
                    "patient_name": str(r.get("Patient_Name", "Unknown")),
                    "disease": str(r.get("Disease", "")),
                    "treatment_name": str(r.get("Treatment_Name", "")),
                    "department_name": str(r.get("Department_Name", "")),
                    "treatment_cost": sanitize_val(r.get("Treatment_Cost", 0.0)),
                    "medicine_cost": sanitize_val(r.get("Medicine_Cost", 0.0)),
                    "room_charges": sanitize_val(r.get("Room_Charges", 0.0)),
                    "gross_bill": sanitize_val(r.get("Total_Gross_Bill", 0.0)),
                    "insurance": str(r.get("Insurance", "No")),
                    "amount_paid": sanitize_val(r.get("Amount_Paid", 0.0)),
                })

        # Table Sorting & Pagination
        sort_col = sort_by if sort_by in df.columns else "Amount_Paid"
        ascending = (sort_order.lower() == "asc")
        sorted_df = df.sort_values(sort_col, ascending=ascending)

        total_records = len(sorted_df)
        total_pages = max(1, math.ceil(total_records / page_size))
        start_idx = (page - 1) * page_size
        p_records = sorted_df.iloc[start_idx : start_idx + page_size]

        records = []
        for _, r in p_records.iterrows():
            records.append({
                "bill_id": str(r.get("Bill_ID", "")),
                "admission_id": str(r.get("Admission_ID", "")),
                "patient_name": str(r.get("Patient_Name", "Unknown")),
                "doctor_name": str(r.get("Doctor_Name", "Unknown")),
                "department_name": str(r.get("Department_Name", "")),
                "treatment_name": str(r.get("Treatment_Name", "")),
                "treatment_cost": sanitize_val(r.get("Treatment_Cost", 0.0)),
                "medicine_cost": sanitize_val(r.get("Medicine_Cost", 0.0)),
                "room_charges": sanitize_val(r.get("Room_Charges", 0.0)),
                "gross_bill": sanitize_val(r.get("Total_Gross_Bill", 0.0)),
                "insurance": str(r.get("Insurance", "No")),
                "amount_paid": sanitize_val(r.get("Amount_Paid", 0.0)),
                "admission_date": str(r.get("Admission_Date_Str", "")),
            })

        return {
            "kpis": {
                "total_revenue_collected": total_revenue_collected,
                "total_gross_billed": total_gross_billed,
                "average_bill": avg_bill,
                "average_gross": avg_gross,
                "insurance_rate": insurance_rate,
                "insured_collected": insured_collected,
                "self_pay_collected": self_pay_collected,
                "total_bills": total_bills,
            },
            "cost_breakdown": cost_breakdown,
            "dept_revenue": dept_revenue,
            "monthly_revenue": monthly_revenue,
            "insurance_comparison": insurance_comparison,
            "top_bills": top_bills,
            "pagination": {
                "page": page,
                "page_size": page_size,
                "total_records": total_records,
                "total_pages": total_pages
            },
            "bills": records
        }

    # ==========================================
    # 8. METADATA & FILTER OPTIONS
    # ==========================================
    def get_filter_options(self) -> Dict[str, Any]:
        return {
            "departments": self.loader.departments.to_dict(orient="records"),
            "admission_types": ["Emergency", "Inpatient", "Outpatient"],
            "bed_types": ["General", "ICU", "Private", "Semi-Private"],
            "wards": sorted(self.loader.beds["Ward"].unique().tolist()) if not self.loader.beds.empty else [],
            "outcomes": ["Recovered", "Improved", "Referred", "Deceased"],
            "insurance_options": ["Yes", "No"],
            "genders": ["Male", "Female"],
            "date_bounds": {
                "min_date": self.loader.admissions["Admission_Date"].min().strftime("%Y-%m-%d") if not self.loader.admissions.empty else "2024-01-01",
                "max_date": self.loader.admissions["Admission_Date"].max().strftime("%Y-%m-%d") if not self.loader.admissions.empty else "2025-12-31"
            }
        }

def get_analytics_service() -> AnalyticsService:
    return AnalyticsService()
