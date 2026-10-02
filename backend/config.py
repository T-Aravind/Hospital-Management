import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent.parent

# Detect data directory location across various execution environments (Local, Docker, Vercel Serverless)
possible_data_dirs = [
    BASE_DIR / "data",
    Path.cwd() / "data",
    Path("/var/task/data"),
    Path(__file__).resolve().parent / "data",
    Path.cwd().parent / "data"
]

DEFAULT_DATA_DIR = str(BASE_DIR / "data")
for p in possible_data_dirs:
    if p.exists() and (p / "admissions.csv").exists():
        DEFAULT_DATA_DIR = str(p.resolve())
        break

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
    "https://*.vercel.app",
    "*"
]
