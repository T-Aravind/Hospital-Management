from fastapi import APIRouter
from backend.services.analytics_service import get_analytics_service

router = APIRouter(tags=["Metadata"])

@router.get("/metadata")
def get_metadata():
    service = get_analytics_service()
    return service.get_filter_options()

@router.get("/health")
def health_check():
    service = get_analytics_service()
    return {
        "status": "healthy",
        "service": "Hospital Operations Intelligence API",
        "version": "1.0.0",
        "data_source": service.loader.source,
        "records_loaded": {
            "patients": len(service.loader.patients),
            "doctors": len(service.loader.doctors),
            "beds": len(service.loader.beds),
            "admissions": len(service.loader.admissions),
            "treatments": len(service.loader.treatments),
            "billing": len(service.loader.billing)
        }
    }
