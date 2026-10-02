from fastapi import APIRouter, Query
from typing import Optional
from backend.services.analytics_service import get_analytics_service

router = APIRouter(tags=["Beds"])

@router.get("/beds")
def get_beds(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(12, ge=1, le=100, description="Page size"),
    ward: Optional[str] = Query(None, description="Ward filter"),
    bed_type: Optional[str] = Query(None, description="Bed type filter (General/ICU/Private/Semi-Private)"),
    department: Optional[str] = Query(None, description="Department filter"),
    status: Optional[str] = Query(None, description="Status filter (Occupied/Available/Maintenance)"),
    search: Optional[str] = Query(None, description="Search term for Bed ID, Room, Ward, Department")
):
    service = get_analytics_service()
    return service.get_bed_analytics(
        page=page,
        page_size=page_size,
        ward=ward,
        bed_type=bed_type,
        department=department,
        status=status,
        search=search
    )
