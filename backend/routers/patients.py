from fastapi import APIRouter, Query
from typing import Optional
from backend.services.analytics_service import get_analytics_service

router = APIRouter(prefix="/api", tags=["Patients"])

@router.get("/patients")
def get_patients(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    gender: Optional[str] = Query(None, description="Gender filter (Male/Female)"),
    blood_group: Optional[str] = Query(None, description="Blood group filter"),
    city: Optional[str] = Query(None, description="City filter"),
    department: Optional[str] = Query(None, description="Department filter"),
    search: Optional[str] = Query(None, description="Search term for name, ID, phone, city"),
    sort_by: str = Query("Patient_ID", description="Field to sort by"),
    sort_order: str = Query("asc", description="Sort order: asc or desc")
):
    service = get_analytics_service()
    return service.get_patient_analytics(
        page=page,
        page_size=page_size,
        gender=gender,
        blood_group=blood_group,
        city=city,
        department=department,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
