from fastapi import APIRouter, Query
from typing import Optional
from backend.services.analytics_service import get_analytics_service

router = APIRouter(prefix="/api", tags=["Doctors"])

@router.get("/doctors")
def get_doctors(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    department: Optional[str] = Query(None, description="Department filter"),
    gender: Optional[str] = Query(None, description="Gender filter"),
    search: Optional[str] = Query(None, description="Search term for name, ID, qualification"),
    sort_by: str = Query("admissions_handled", description="Sort by column"),
    sort_order: str = Query("desc", description="Sort order: asc or desc")
):
    service = get_analytics_service()
    return service.get_doctor_analytics(
        page=page,
        page_size=page_size,
        department=department,
        gender=gender,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
