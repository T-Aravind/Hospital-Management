from fastapi import APIRouter, Query
from typing import Optional
from backend.services.analytics_service import get_analytics_service

router = APIRouter(tags=["Admissions"])

@router.get("/admissions")
def get_admissions(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    department: Optional[str] = Query(None, description="Department filter"),
    admission_type: Optional[str] = Query(None, description="Admission type filter"),
    readmission: Optional[str] = Query(None, description="Readmission filter (Yes/No)"),
    search: Optional[str] = Query(None, description="Search term for patient, ID, doctor, disease"),
    sort_by: str = Query("Admission_Date", description="Field to sort by"),
    sort_order: str = Query("desc", description="Sort order: asc or desc")
):
    service = get_analytics_service()
    return service.get_admission_analytics(
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
        department=department,
        admission_type=admission_type,
        readmission=readmission,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
