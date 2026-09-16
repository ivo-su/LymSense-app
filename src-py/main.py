from datetime import datetime, timezone
from pathlib import Path
import os
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


@app.delete("/patients/{patient_id}", status_code=204)
def delete_patient(patient_id: int):
    with get_connection() as connection:
        result = connection.execute("DELETE FROM patients WHERE id = ?", (patient_id,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

if __name__ == "__main__":
    # Esto mantiene el servidor corriendo en http://127.0.0.1:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)