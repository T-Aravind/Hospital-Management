from fastapi import APIRouter, Query
from typing import Optional
from backend.services.analytics_service import get_analytics_service

router = APIRouter(prefix="/api", tags=["Treatments"])

@router.get("/treatments")
def get_treatments(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    surgery: Optional[str] = Query(None, description="Surgery filter (Yes/No)"),
    outcome: Optional[str] = Query(None, description="Outcome filter (Recovered/Improved/Referred/Deceased)"),
    department: Optional[str] = Query(None, description="Department filter"),
    search: Optional[str] = Query(None, description="Search term for procedure, patient, doctor, disease"),
    sort_by: str = Query("Treatment_ID", description="Sort column"),
    sort_order: str = Query("asc", description="Sort order: asc or desc")
):
    service = get_analytics_service()
    return service.get_treatment_analytics(
        page=page,
        page_size=page_size,
        surgery=surgery,
        outcome=outcome,
        department=department,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
