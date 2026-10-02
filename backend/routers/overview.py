from fastapi import APIRouter, Query
from typing import Optional
from backend.services.analytics_service import get_analytics_service

router = APIRouter(prefix="/api", tags=["Overview"])

@router.get("/overview")
def get_overview(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    department: Optional[str] = Query(None, description="Department name or ID"),
    admission_type: Optional[str] = Query(None, description="Admission type filter"),
):
    service = get_analytics_service()
    return service.get_overview(
        start_date=start_date,
        end_date=end_date,
        department=department,
        admission_type=admission_type
    )
