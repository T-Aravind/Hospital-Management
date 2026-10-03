import os
import json
import sqlite3
import random
from pathlib import Path
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np

from backend.config import BASE_DIR, DATA_DIR

REGISTRY_FILE = Path(DATA_DIR) / "hospitals_registry.json"

DEFAULT_HOSPITALS = [
    {
        "id": "hosp_metro",
        "name": "Apollo Metro Multi-Speciality Hospital",
        "code": "AMSH-01",
        "type": "Multi-Speciality Tertiary Care",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "beds_count": 300,
        "departments_count": 10,
        "source_type": "CSV",
        "source_path": str(DATA_DIR),
        "is_active": True,
        "description": "Comprehensive operational, clinical, and emergency intelligence for tertiary medical center."
    },
    {
        "id": "hosp_stjude",
        "name": "St. Jude Super-Specialty Medical Institute",
        "code": "SJMI-02",
        "type": "Specialty Research & Oncology",
        "city": "Bengaluru",
        "state": "Karnataka",
        "beds_count": 180,
        "departments_count": 8,
        "source_type": "GENERATED",
        "source_path": "",
        "is_active": False,
        "description": "High-acuity clinical research center with specialized oncology, pediatrics, and cardiology care."
    },
    {
        "id": "hosp_apex",
        "name": "Apex Trauma & Emergency Healthcare",
        "code": "ATEH-03",
        "type": "Trauma & Critical Care",
        "city": "Hyderabad",
        "state": "Telangana",
        "beds_count": 450,
        "departments_count": 10,
        "source_type": "GENERATED",
        "source_path": "",
        "is_active": False,
        "description": "Emergency triage focus, rapid ambulance turnaround, high-capacity ICU and surgical suites."
    }
]

class HospitalManager:
    _instance = None

    def __init__(self):
        self.registry_file = REGISTRY_FILE
        self.hospitals: List[Dict[str, Any]] = []
        self.active_hospital_id: str = "hosp_metro"
        self._load_registry()

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = HospitalManager()
        return cls._instance

    def _load_registry(self):
        if self.registry_file.exists():
            try:
                with open(self.registry_file, "r", encoding="utf-8") as f:
                    self.hospitals = json.load(f)
            except Exception as e:
                print(f"[HospitalManager] Error loading registry: {e}. Reverting to defaults.")
                self.hospitals = DEFAULT_HOSPITALS
        else:
            self.hospitals = DEFAULT_HOSPITALS
            self._save_registry()

        # Determine active hospital
        active = next((h for h in self.hospitals if h.get("is_active")), None)
        if active:
            self.active_hospital_id = active["id"]
        elif self.hospitals:
            self.active_hospital_id = self.hospitals[0]["id"]
            self.hospitals[0]["is_active"] = True
            self._save_registry()

    def _save_registry(self):
        try:
            self.registry_file.parent.mkdir(parents=True, exist_ok=True)
            with open(self.registry_file, "w", encoding="utf-8") as f:
                json.dump(self.hospitals, f, indent=2)
        except Exception as e:
            print(f"[HospitalManager] Error saving registry: {e}")

    def list_hospitals(self) -> List[Dict[str, Any]]:
        return self.hospitals

    def get_active_hospital(self) -> Dict[str, Any]:
        hospital = next((h for h in self.hospitals if h["id"] == self.active_hospital_id), None)
        if not hospital and self.hospitals:
            hospital = self.hospitals[0]
            self.active_hospital_id = hospital["id"]
        return hospital or DEFAULT_HOSPITALS[0]

    def set_active_hospital(self, hospital_id: str) -> Dict[str, Any]:
        target = next((h for h in self.hospitals if h["id"] == hospital_id), None)
        if not target:
            raise ValueError(f"Hospital with ID '{hospital_id}' not found.")

        for h in self.hospitals:
            h["is_active"] = (h["id"] == hospital_id)
        
        self.active_hospital_id = hospital_id
        self._save_registry()
        return target

    def add_hospital(self, data: Dict[str, Any]) -> Dict[str, Any]:
        hosp_id = data.get("id") or f"hosp_{int(datetime.now().timestamp())}"
        
        new_hosp = {
            "id": hosp_id,
            "name": data.get("name", "New Hospital Facility"),
            "code": data.get("code", f"HF-{random.randint(10,99)}"),
            "type": data.get("type", "General Hospital"),
            "city": data.get("city", "City"),
            "state": data.get("state", "State"),
            "beds_count": int(data.get("beds_count", 200)),
            "departments_count": int(data.get("departments_count", 8)),
            "source_type": data.get("source_type", "GENERATED"),
            "source_path": data.get("source_path", ""),
            "db_config": data.get("db_config", None),
            "is_active": False,
            "description": data.get("description", "Custom hospital operations intelligence instance.")
        }
        
        self.hospitals.append(new_hosp)
        self._save_registry()
        return new_hosp

    def update_hospital_db(self, hospital_id: str, db_config: Dict[str, Any]) -> Dict[str, Any]:
        target = next((h for h in self.hospitals if h["id"] == hospital_id), None)
        if not target:
            raise ValueError(f"Hospital with ID '{hospital_id}' not found.")

        target["source_type"] = db_config.get("db_type", "MYSQL").upper()
        target["db_config"] = db_config
        self._save_registry()
        return target

    def test_db_connection(self, db_config: Dict[str, Any]) -> Dict[str, Any]:
        db_type = db_config.get("db_type", "mysql").lower()
        
        if db_type == "sqlite":
            path = db_config.get("database", db_config.get("path", ":memory:"))
            try:
                conn = sqlite3.connect(path)
                cursor = conn.cursor()
                cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
                tables = [r[0] for r in cursor.fetchall()]
                conn.close()
                return {
                    "success": True,
                    "message": f"Successfully connected to SQLite database ({len(tables)} tables found)",
                    "tables": tables,
                    "db_type": "sqlite"
                }
            except Exception as e:
                return {"success": False, "message": f"SQLite connection failed: {str(e)}"}

        elif db_type in ("mysql", "mariadb"):
            try:
                import mysql.connector
                conn = mysql.connector.connect(
                    host=db_config.get("host", "localhost"),
                    port=int(db_config.get("port", 3306)),
                    user=db_config.get("user", "root"),
                    password=db_config.get("password", ""),
                    database=db_config.get("database", "hospital_db"),
                    connection_timeout=5
                )
                cursor = conn.cursor()
                cursor.execute("SHOW TABLES;")
                tables = [r[0] for r in cursor.fetchall()]
                conn.close()
                return {
                    "success": True,
                    "message": f"Successfully connected to MySQL database '{db_config.get('database')}' ({len(tables)} tables found)",
                    "tables": tables,
                    "db_type": "mysql"
                }
            except Exception as e:
                return {"success": False, "message": f"MySQL connection failed: {str(e)}"}

        elif db_type in ("postgres", "postgresql"):
            try:
                from sqlalchemy import create_engine, inspect
                user = db_config.get("user", "postgres")
                pwd = db_config.get("password", "")
                host = db_config.get("host", "localhost")
                port = db_config.get("port", 5432)
                db = db_config.get("database", "hospital_db")
                uri = f"postgresql://{user}:{pwd}@{host}:{port}/{db}"
                engine = create_engine(uri, connect_args={"connect_timeout": 5})
                with engine.connect() as conn:
                    inspector = inspect(conn)
                    tables = inspector.get_table_names()
                return {
                    "success": True,
                    "message": f"Successfully connected to PostgreSQL database '{db}' ({len(tables)} tables found)",
                    "tables": tables,
                    "db_type": "postgresql"
                }
            except Exception as e:
                return {"success": False, "message": f"PostgreSQL connection failed: {str(e)}"}

        return {"success": False, "message": f"Unsupported database type: {db_type}"}

def get_hospital_manager() -> HospitalManager:
    return HospitalManager.get_instance()
