import os
from pathlib import Path
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from backend.config import CORS_ORIGINS, FRONTEND_DIST_DIR, HOST, PORT, ENVIRONMENT
from backend.services.data_loader import get_data_loader
from backend.routers import (
    overview,
    patients,
    admissions,
    beds,
    doctors,
    treatments,
    billing,
    metadata
)

app = FastAPI(
    title="Hospital Operations Intelligence API",
    description="Data-driven operational, clinical, capacity, and financial analytics for hospital management.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Routers
app.include_router(overview.router)
app.include_router(patients.router)
app.include_router(admissions.router)
app.include_router(beds.router)
app.include_router(doctors.router)
app.include_router(treatments.router)
app.include_router(billing.router)
app.include_router(metadata.router)

@app.on_event("startup")
def startup_event():
    print("[Main] Initializing Hospital Operations Intelligence data loader...")
    loader = get_data_loader()
    print(f"[Main] Data ready. Loaded {len(loader.admissions)} admissions, {len(loader.patients)} patients, {len(loader.doctors)} doctors.")

# Serve Frontend SPA static assets if built
frontend_dist = Path(FRONTEND_DIST_DIR)
if frontend_dist.exists() and (frontend_dist / "index.html").exists():
    # Mount assets folder
    assets_dir = frontend_dist / "assets"
    if assets_dir.exists():
        app.mount("/assets", StaticFiles(directory=str(assets_dir)), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_spa(full_path: str):
        # Don't intercept API routes or Docs
        if full_path.startswith("api") or full_path in ("docs", "redoc", "openapi.json"):
            return JSONResponse(status_code=404, content={"detail": "Not Found"})
        
        file_path = frontend_dist / full_path
        if file_path.exists() and file_path.is_file():
            return FileResponse(file_path)
        return FileResponse(frontend_dist / "index.html")
else:
    @app.get("/")
    def root():
        return {
            "message": "Hospital Operations Intelligence Dashboard API is running.",
            "docs": "/docs",
            "health": "/api/health",
            "environment": ENVIRONMENT
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host=HOST, port=PORT, reload=True)
