import os
import shutil
from pathlib import Path
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Body
from pydantic import BaseModel

from backend.config import DATA_DIR
from backend.services.hospital_manager import get_hospital_manager
from backend.services.data_loader import get_data_loader

router = APIRouter(prefix="/hospitals", tags=["Hospital & Database Management"])

class HospitalCreateRequest(BaseModel):
    name: str
    code: Optional[str] = None
    type: Optional[str] = "Multi-Speciality"
    city: Optional[str] = "City"
    state: Optional[str] = "State"
    beds_count: Optional[int] = 250
    departments_count: Optional[int] = 10
    description: Optional[str] = ""

class DBConnectRequest(BaseModel):
    db_type: str = "mysql"
    host: str = "localhost"
    port: int = 3306
    user: str = "root"
    password: str = ""
    database: str = "hospital_db"
    ssl: Optional[bool] = False

class SwitchHospitalRequest(BaseModel):
    hospital_id: str

@router.get("")
def list_hospitals():
    mgr = get_hospital_manager()
    loader = get_data_loader()
    hospitals = mgr.list_hospitals()
    
    # Enrich with live record count for active hospital
    res = []
    for h in hospitals:
        h_copy = dict(h)
        if h["id"] == loader.current_hospital_id:
            h_copy["live_records"] = len(loader.admissions)
            h_copy["live_beds"] = len(loader.beds)
            h_copy["live_doctors"] = len(loader.doctors)
        res.append(h_copy)
    return res

@router.get("/active")
def get_active_hospital():
    mgr = get_hospital_manager()
    loader = get_data_loader()
    active = mgr.get_active_hospital()
    return {
        "hospital": active,
        "source": loader.source,
        "record_counts": {
            "admissions": len(loader.admissions),
            "patients": len(loader.patients),
            "doctors": len(loader.doctors),
            "beds": len(loader.beds),
            "departments": len(loader.departments)
        }
    }

@router.post("/switch")
def switch_hospital(payload: SwitchHospitalRequest):
    mgr = get_hospital_manager()
    loader = get_data_loader()
    try:
        mgr.set_active_hospital(payload.hospital_id)
        loader.switch_hospital(payload.hospital_id)
        return {
            "success": True,
            "message": f"Switched active hospital to '{payload.hospital_id}'",
            "active_hospital": mgr.get_active_hospital(),
            "record_counts": {
                "admissions": len(loader.admissions),
                "patients": len(loader.patients),
                "doctors": len(loader.doctors),
                "beds": len(loader.beds)
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("")
def create_hospital(payload: HospitalCreateRequest):
    mgr = get_hospital_manager()
    try:
        new_hosp = mgr.add_hospital(payload.dict())
        return {
            "success": True,
            "message": f"Hospital profile '{new_hosp['name']}' created successfully.",
            "hospital": new_hosp
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/test-db")
def test_db_connection(payload: DBConnectRequest):
    mgr = get_hospital_manager()
    result = mgr.test_db_connection(payload.dict())
    return result

@router.post("/{hospital_id}/connect-db")
def connect_hospital_db(hospital_id: str, payload: DBConnectRequest):
    mgr = get_hospital_manager()
    loader = get_data_loader()
    
    # Test first
    test_res = mgr.test_db_connection(payload.dict())
    if not test_res.get("success"):
        raise HTTPException(status_code=400, detail=f"Database connection failed: {test_res.get('message')}")
    
    # Update hospital DB config
    updated = mgr.update_hospital_db(hospital_id, payload.dict())
    
    # If active hospital, reload data immediately
    if hospital_id == loader.current_hospital_id:
        loader.load_data(force_reload=True)

    return {
        "success": True,
        "message": f"Successfully connected and saved database configuration for {updated['name']}.",
        "hospital": updated,
        "tables_detected": test_res.get("tables", [])
    }

@router.post("/{hospital_id}/upload-data")
async def upload_hospital_data(
    hospital_id: str,
    admissions: Optional[UploadFile] = File(None),
    patients: Optional[UploadFile] = File(None),
    doctors: Optional[UploadFile] = File(None),
    beds: Optional[UploadFile] = File(None),
    treatments: Optional[UploadFile] = File(None),
    billing: Optional[UploadFile] = File(None)
):
    upload_dir = Path(DATA_DIR) / "uploads" / hospital_id
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    uploaded_files = []
    file_map = {
        "admissions.csv": admissions,
        "patients.csv": patients,
        "doctors.csv": doctors,
        "beds.csv": beds,
        "treatments.csv": treatments,
        "billing.csv": billing,
    }

    for filename, upload_file in file_map.items():
        if upload_file:
            dest = upload_dir / filename
            with open(dest, "wb") as buffer:
                shutil.copyfileobj(upload_file.file, buffer)
            uploaded_files.append(filename)

    if not uploaded_files:
        raise HTTPException(status_code=400, detail="No valid CSV files provided for upload.")

    # Force reload data loader for this hospital
    loader = get_data_loader()
    if hospital_id == loader.current_hospital_id:
        loader.load_data(force_reload=True)

    return {
        "success": True,
        "message": f"Successfully uploaded {len(uploaded_files)} dataset file(s) for hospital '{hospital_id}'.",
        "uploaded_files": uploaded_files
    }
