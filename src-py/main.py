from datetime import datetime, timezone
from pathlib import Path
import os
import math
import sqlite3

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "http://127.0.0.1:1420"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path(os.getenv("LYMSENSE_DATA_DIR", Path.home() / ".lymsense"))
DATABASE_PATH = DATA_DIR / "lymsense.db"


class PatientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    gender: str | None = Field(default=None, max_length=20)


def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                gender TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                content TEXT,
                ldex REAL,
                imported_at TEXT NOT NULL,
                FOREIGN KEY (patient_id) REFERENCES patients (id) ON DELETE CASCADE
            )
            """
        )
        columns = {
            row[1] for row in connection.execute("PRAGMA table_info(logs)")
        }
        if "ldex" not in columns:
            connection.execute("ALTER TABLE logs ADD COLUMN ldex REAL")


def patient_from_row(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "gender": row["gender"],
        "logs": [],
        "created_at": row["created_at"],
    }


initialize_database()

@app.get("/")
def home():
    return {"status": "Backend Python activo"}


@app.get("/patients")
def list_patients(search: str = Query(default="", max_length=200)):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT * FROM patients WHERE name LIKE ? COLLATE NOCASE ORDER BY name COLLATE NOCASE",
            (f"%{search.strip()}%",),
        ).fetchall()
    return [patient_from_row(row) for row in rows]


@app.post("/patients", status_code=201)
def create_patient(patient: PatientCreate):
    name = patient.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="El nombre es obligatorio")

    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        cursor = connection.execute(
            "INSERT INTO patients (name, gender, created_at) VALUES (?, ?, ?)",
            (name, patient.gender, created_at),
        )
        row = connection.execute(
            "SELECT * FROM patients WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return patient_from_row(row)


class LogCreate(BaseModel):
    patient_id: int
    filename: str = Field(min_length=1, max_length=255)
    ldex: float


@app.post("/logs", status_code=201)
def create_log(log: LogCreate):
    if not math.isfinite(log.ldex):
        raise HTTPException(status_code=422, detail="lDex debe ser un número válido")

    imported_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        patient = connection.execute(
            "SELECT id FROM patients WHERE id = ?", (log.patient_id,)
        ).fetchone()
        if patient is None:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        cursor = connection.execute(
            """
            INSERT INTO logs (patient_id, filename, content, ldex, imported_at)
            VALUES (?, ?, '', ?, ?)
            """,
            (log.patient_id, log.filename.strip(), log.ldex, imported_at),
        )

    return {
        "id": cursor.lastrowid,
        "patient_id": log.patient_id,
        "filename": log.filename.strip(),
        "ldex": log.ldex,
        "imported_at": imported_at,
    }


@app.get("/logs")
def list_logs():
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, patient_id, patient_name, filename, ldex, imported_at,
                   log_number, total_logs
            FROM (
                SELECT logs.id, logs.patient_id, patients.name AS patient_name,
                       logs.filename, logs.ldex, logs.imported_at,
                       ROW_NUMBER() OVER (
                           PARTITION BY logs.patient_id
                           ORDER BY logs.imported_at ASC, logs.id ASC
                       ) AS log_number,
                       COUNT(*) OVER (
                           PARTITION BY logs.patient_id
                       ) AS total_logs
                FROM logs
                INNER JOIN patients ON patients.id = logs.patient_id
            )
            ORDER BY imported_at DESC, id DESC
            """
        ).fetchall()

    return [dict(row) for row in rows]


@app.delete("/logs/{log_id}", status_code=204)
def delete_log(log_id: int):
    with get_connection() as connection:
        result = connection.execute("DELETE FROM logs WHERE id = ?", (log_id,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")


@app.delete("/patients/{patient_id}", status_code=204)
def delete_patient(patient_id: int):
    with get_connection() as connection:
        result = connection.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

if __name__ == "__main__":
    # Esto mantiene el servidor corriendo en http://127.0.0.1:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)