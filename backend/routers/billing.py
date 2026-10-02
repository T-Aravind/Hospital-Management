from fastapi import APIRouter, Query
from typing import Optional
from backend.services.analytics_service import get_analytics_service

router = APIRouter(tags=["Billing"])

@router.get("/billing")
def get_billing(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Page size"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    department: Optional[str] = Query(None, description="Department filter"),
    insurance: Optional[str] = Query(None, description="Insurance filter (Yes/No)"),
    search: Optional[str] = Query(None, description="Search term for Bill ID, patient, doctor, procedure"),
    sort_by: str = Query("Amount_Paid", description="Sort column"),
    sort_order: str = Query("desc", description="Sort order: asc or desc")
):
    service = get_analytics_service()
    return service.get_billing_analytics(
        page=page,
        page_size=page_size,
        start_date=start_date,
        end_date=end_date,
        department=department,
        insurance=insurance,
        search=search,
        sort_by=sort_by,
        sort_order=sort_order
    )
