import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Detect data directory location (either at project root /data or backend/data)
DEFAULT_DATA_DIR = str(BASE_DIR / "data")
if not os.path.exists(DEFAULT_DATA_DIR):
    DEFAULT_DATA_DIR = str(Path(__file__).resolve().parent / "data")

DATA_DIR = os.getenv("DATA_DIR", DEFAULT_DATA_DIR)
FRONTEND_DIST_DIR = str(BASE_DIR / "frontend" / "dist")

# Host / Port
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# Database configuration (Optional for future MySQL integration)
USE_MYSQL = os.getenv("USE_MYSQL", "false").lower() in ("true", "1", "yes")
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE", "hospital_db")

# CORS Origins
CORS_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"
]
