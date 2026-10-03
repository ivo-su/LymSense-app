from datetime import date, datetime, timedelta, timezone
from pathlib import Path
import hashlib
import math
import os
import secrets
import sqlite3
from typing import Literal

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, FastAPI, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:1420", "http://127.0.0.1:1420"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

DATA_DIR = Path(os.getenv("LYMSENSE_DATA_DIR", Path.home() / ".lymsense"))
DATABASE_PATH = DATA_DIR / "lymsense.db"
SESSION_COOKIE_NAME = "lymsense_session"
SESSION_TTL_SECONDS = 30 * 24 * 60 * 60
password_hasher = PasswordHasher()


class PatientCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    gender: Literal["female", "male", "intersex", "unspecified"]
    date_of_birth: date
    external_id: str | None = Field(default=None, max_length=120)
    affected_side: Literal["right", "left"]
    affected_region: Literal["arm", "leg"]
    comments: str | None = Field(default=None, max_length=2000)


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=255)


class ManagedUserCreate(UserCreate):
    role: Literal["admin", "user"]


class UserStatusUpdate(BaseModel):
    is_active: bool


class UserProfileUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=200)
    email: str | None = Field(default=None, min_length=1, max_length=255)
    medical_credentials: str | None = Field(default=None, max_length=200)
    license_number: str | None = Field(default=None, max_length=120)
    license_jurisdiction: str | None = Field(default=None, max_length=120)
    specialty: str | None = Field(default=None, max_length=160)
    clinic_name: str | None = Field(default=None, max_length=200)
    clinic_address: str | None = Field(default=None, max_length=500)
    phone: str | None = Field(default=None, max_length=60)
    contact_email: str | None = Field(default=None, max_length=255)


class UserLogin(BaseModel):
    email: str = Field(min_length=1, max_length=255)
    password: str = Field(min_length=8, max_length=255)


def get_connection():
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def normalize_email(email: str) -> str:
    return email.strip().lower()


def hash_session_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def set_session_cookie(response: Response, token: str):
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=SESSION_TTL_SECONDS,
        path="/",
    )


def get_current_user(request: Request):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    authorization = request.headers.get("authorization", "")
    if not token and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()

    if not token:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")

    token_hash = hash_session_token(token)
    now = datetime.now(timezone.utc).isoformat()

    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT users.id, users.name, users.email, users.role, users.is_active
            FROM sessions
            INNER JOIN users ON users.id = sessions.user_id
            WHERE sessions.token_hash = ? AND sessions.expires_at > ?
                AND users.is_active = 1
            """,
            (token_hash, now),
        ).fetchone()

    if row is None:
        raise HTTPException(status_code=401, detail="Se requiere autenticación")

    return {
        "id": row["id"],
        "name": row["name"],
        "email": row["email"],
        "role": row["role"],
        "is_active": bool(row["is_active"]),
    }


def initialize_database():
    with get_connection() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'user',
                is_active INTEGER NOT NULL DEFAULT 1,
                created_at TEXT NOT NULL
            )
            """
        )
        user_columns = {row[1] for row in connection.execute("PRAGMA table_info(users)")}
        if "role" not in user_columns:
            connection.execute("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'")
            first_user = connection.execute(
                "SELECT id FROM users ORDER BY id LIMIT 1"
            ).fetchone()
            if first_user is not None:
                connection.execute(
                    "UPDATE users SET role = 'admin' WHERE id = ?",
                    (first_user["id"],),
                )
        if "is_active" not in user_columns:
            connection.execute("ALTER TABLE users ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1")
        profile_columns = {
            "medical_credentials": "TEXT",
            "license_number": "TEXT",
            "license_jurisdiction": "TEXT",
            "specialty": "TEXT",
            "clinic_name": "TEXT",
            "clinic_address": "TEXT",
            "phone": "TEXT",
            "contact_email": "TEXT",
        }
        for column_name, column_type in profile_columns.items():
            if column_name not in user_columns:
                connection.execute(
                    f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"
                )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                token_hash TEXT NOT NULL UNIQUE,
                expires_at TEXT NOT NULL,
                created_at TEXT NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
            )
            """
        )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS patients (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                gender TEXT,
                date_of_birth TEXT,
                age_years INTEGER,
                external_id TEXT,
                affected_side TEXT,
                affected_region TEXT,
                comments TEXT,
                created_at TEXT NOT NULL
            )
            """
        )
        patient_columns = {
            row[1] for row in connection.execute("PRAGMA table_info(patients)")
        }
        patient_profile_columns = {
            "date_of_birth": "TEXT",
            "age_years": "INTEGER",
            "external_id": "TEXT",
            "affected_side": "TEXT",
            "affected_region": "TEXT",
            "comments": "TEXT",
        }
        for column_name, column_type in patient_profile_columns.items():
            if column_name not in patient_columns:
                connection.execute(
                    f"ALTER TABLE patients ADD COLUMN {column_name} {column_type}"
                )
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS logs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                patient_id INTEGER NOT NULL,
                filename TEXT NOT NULL,
                content TEXT,
                ldex REAL,
                z_healthy REAL,
                z_risk REAL,
                reference INTEGER NOT NULL DEFAULT 0,
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
        if "z_healthy" not in columns:
            connection.execute("ALTER TABLE logs ADD COLUMN z_healthy REAL")
        if "z_risk" not in columns:
            connection.execute("ALTER TABLE logs ADD COLUMN z_risk REAL")
        if "reference" not in columns:
            connection.execute("ALTER TABLE logs ADD COLUMN reference INTEGER NOT NULL DEFAULT 0")
        connection.execute("UPDATE logs SET reference = 0 WHERE z_risk IS NULL")


def patient_from_row(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "gender": row["gender"],
        "date_of_birth": row["date_of_birth"],
        "age_years": row["age_years"],
        "external_id": row["external_id"],
        "affected_side": row["affected_side"],
        "affected_region": row["affected_region"],
        "comments": row["comments"],
        "logs": [],
        "created_at": row["created_at"],
        "last_log_at": row["last_log_at"] if "last_log_at" in row.keys() else None,
        "log_count": row["log_count"] if "log_count" in row.keys() else 0,
        "latest_ldex": row["latest_ldex"] if "latest_ldex" in row.keys() else None,
    }


initialize_database()


@app.get("/")
def home():
    return {"status": "Backend Python activo"}


@app.post("/auth/signup")
def signup_user(payload: UserCreate, response: Response):
    name = payload.name.strip()
    email = normalize_email(payload.email)
    if not name:
        raise HTTPException(status_code=422, detail="El nombre es obligatorio")
    if not email:
        raise HTTPException(status_code=422, detail="El email es obligatorio")

    with get_connection() as connection:
        user_count = connection.execute("SELECT COUNT(*) AS total FROM users").fetchone()["total"]
        if user_count > 0:
            raise HTTPException(
                status_code=403,
                detail="Registro cerrado. La aplicación ya tiene una cuenta creada.",
            )

        existing = connection.execute(
            "SELECT id FROM users WHERE email = ?",
            (email,),
        ).fetchone()
        if existing is not None:
            raise HTTPException(status_code=409, detail="Ese email ya está registrado")

        password_hash = password_hasher.hash(payload.password)
        created_at = datetime.now(timezone.utc).isoformat()
        cursor = connection.execute(
            "INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, 'admin', ?)",
            (name, email, password_hash, created_at),
        )
        user_id = cursor.lastrowid

        token = secrets.token_urlsafe(32)
        expires_at = (datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL_SECONDS)).isoformat()
        connection.execute(
            "INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (user_id, hash_session_token(token), expires_at, created_at),
        )

    set_session_cookie(response, token)
    return {
        "token": token,
        "user": {"id": user_id, "name": name, "email": email, "role": "admin"},
        "message": "La cuenta se creó correctamente",
    }


@app.post("/auth/login")
def login_user(payload: UserLogin, response: Response):
    email = normalize_email(payload.email)

    with get_connection() as connection:
        user = connection.execute(
            "SELECT id, name, email, password_hash, role, is_active FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    if user is None:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    try:
        password_hasher.verify(user["password_hash"], payload.password)
    except VerifyMismatchError as exc:
        raise HTTPException(status_code=401, detail="Credenciales inválidas") from exc

    if not user["is_active"]:
        raise HTTPException(status_code=403, detail="Esta cuenta está deshabilitada")

    token = secrets.token_urlsafe(32)
    created_at = datetime.now(timezone.utc).isoformat()
    expires_at = (datetime.now(timezone.utc) + timedelta(seconds=SESSION_TTL_SECONDS)).isoformat()

    with get_connection() as connection:
        connection.execute(
            "DELETE FROM sessions WHERE user_id = ?",
            (user["id"],),
        )
        connection.execute(
            "INSERT INTO sessions (user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?)",
            (user["id"], hash_session_token(token), expires_at, created_at),
        )

    set_session_cookie(response, token)
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "role": user["role"],
            "is_active": bool(user["is_active"]),
        },
        "message": "Inicio de sesión correcto",
    }


@app.get("/auth/me")
def get_authenticated_user(request: Request):
    user = get_current_user(request)
    return {"user": user}


@app.get("/account/profile")
def get_account_profile(user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        row = connection.execute(
            """
            SELECT id, name, email, medical_credentials, license_number,
                   license_jurisdiction, specialty, clinic_name, clinic_address,
                   phone, contact_email
            FROM users WHERE id = ?
            """,
            (user["id"],),
        ).fetchone()
    return dict(row)


@app.patch("/account/profile")
def update_account_profile(
    payload: UserProfileUpdate,
    user: dict = Depends(get_current_user),
):
    updates = payload.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No se enviaron campos para actualizar")

    if "name" in updates:
        if updates["name"] is None or not updates["name"].strip():
            raise HTTPException(status_code=422, detail="El nombre es obligatorio")
        updates["name"] = updates["name"].strip()
    if "email" in updates:
        if updates["email"] is None or not updates["email"].strip():
            raise HTTPException(status_code=422, detail="El email es obligatorio")
        updates["email"] = normalize_email(updates["email"])

    for field_name, value in updates.items():
        if isinstance(value, str):
            updates[field_name] = value.strip() or None

    assignments = ", ".join(f"{field_name} = ?" for field_name in updates)
    try:
        with get_connection() as connection:
            connection.execute(
                f"UPDATE users SET {assignments} WHERE id = ?",
                (*updates.values(), user["id"]),
            )
            row = connection.execute(
                """
                SELECT id, name, email, medical_credentials, license_number,
                       license_jurisdiction, specialty, clinic_name, clinic_address,
                       phone, contact_email
                FROM users WHERE id = ?
                """,
                (user["id"],),
            ).fetchone()
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Ese email ya está registrado") from exc

    return dict(row)


def require_admin(user: dict = Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Se requiere acceso de administrador")
    return user


@app.get("/admin/users")
def list_users(admin: dict = Depends(require_admin)):
    with get_connection() as connection:
        rows = connection.execute(
            "SELECT id, name, email, role, is_active, created_at FROM users ORDER BY name COLLATE NOCASE"
        ).fetchall()
    return [{**dict(row), "is_active": bool(row["is_active"])} for row in rows]


@app.post("/admin/users", status_code=201)
def create_user(payload: ManagedUserCreate, admin: dict = Depends(require_admin)):
    name = payload.name.strip()
    email = normalize_email(payload.email)
    if not name:
        raise HTTPException(status_code=422, detail="El nombre es obligatorio")
    if not email:
        raise HTTPException(status_code=422, detail="El email es obligatorio")

    created_at = datetime.now(timezone.utc).isoformat()
    try:
        with get_connection() as connection:
            cursor = connection.execute(
                """
                INSERT INTO users (name, email, password_hash, role, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (name, email, password_hasher.hash(payload.password), payload.role, created_at),
            )
    except sqlite3.IntegrityError as exc:
        raise HTTPException(status_code=409, detail="Ese email ya está registrado") from exc

    return {
        "id": cursor.lastrowid,
        "name": name,
        "email": email,
        "role": payload.role,
        "is_active": True,
        "created_at": created_at,
    }


@app.patch("/admin/users/{user_id}/status")
def update_user_status(
    user_id: int,
    payload: UserStatusUpdate,
    admin: dict = Depends(require_admin),
):
    if user_id == admin["id"] and not payload.is_active:
        raise HTTPException(status_code=400, detail="No puedes deshabilitar tu propia cuenta")

    with get_connection() as connection:
        target = connection.execute(
            "SELECT id, role, is_active FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        if target is None:
            raise HTTPException(status_code=404, detail="No se encontró la cuenta")

        if not payload.is_active and target["role"] == "admin" and target["is_active"]:
            active_admins = connection.execute(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1"
            ).fetchone()["total"]
            if active_admins <= 1:
                raise HTTPException(status_code=409, detail="Debe existir al menos un administrador activo")

        connection.execute(
            "UPDATE users SET is_active = ? WHERE id = ?",
            (int(payload.is_active), user_id),
        )
        if not payload.is_active:
            connection.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        updated = connection.execute(
            "SELECT id, name, email, role, is_active, created_at FROM users WHERE id = ?",
            (user_id,),
        ).fetchone()

    return {**dict(updated), "is_active": bool(updated["is_active"])}


@app.delete("/admin/users/{user_id}", status_code=204)
def delete_user(user_id: int, admin: dict = Depends(require_admin)):
    if user_id == admin["id"]:
        raise HTTPException(status_code=400, detail="No puedes eliminar tu propia cuenta")

    with get_connection() as connection:
        target = connection.execute(
            "SELECT id, role, is_active FROM users WHERE id = ?", (user_id,)
        ).fetchone()
        if target is None:
            raise HTTPException(status_code=404, detail="No se encontró la cuenta")

        if target["role"] == "admin" and target["is_active"]:
            active_admins = connection.execute(
                "SELECT COUNT(*) AS total FROM users WHERE role = 'admin' AND is_active = 1"
            ).fetchone()["total"]
            if active_admins <= 1:
                raise HTTPException(status_code=409, detail="Debe existir al menos un administrador activo")

        connection.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        connection.execute("DELETE FROM users WHERE id = ?", (user_id,))


@app.post("/auth/logout")
def logout_user(request: Request, response: Response):
    token = request.cookies.get(SESSION_COOKIE_NAME)
    if token:
        token_hash = hash_session_token(token)
        with get_connection() as connection:
            connection.execute("DELETE FROM sessions WHERE token_hash = ?", (token_hash,))

    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/")
    return {"message": "Sesión cerrada correctamente"}


@app.get("/patients")
def list_patients(search: str = Query(default="", max_length=200), user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        rows = connection.execute(
            """
                 SELECT patients.*, MAX(logs.imported_at) AS last_log_at,
                     COUNT(logs.id) AS log_count,
                     (
                         SELECT latest_log.ldex
                         FROM logs AS latest_log
                         WHERE latest_log.patient_id = patients.id
                         ORDER BY latest_log.imported_at DESC, latest_log.id DESC
                         LIMIT 1
                     ) AS latest_ldex
            FROM patients
            LEFT JOIN logs ON logs.patient_id = patients.id
            WHERE patients.name LIKE ? COLLATE NOCASE
            GROUP BY patients.id
            ORDER BY patients.name COLLATE NOCASE
            """,
            (f"%{search.strip()}%",),
        ).fetchall()
    return [patient_from_row(row) for row in rows]


@app.get("/patients/{patient_id}")
def get_patient(patient_id: int, user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        patient = connection.execute(
            """
                 SELECT patients.*, MAX(logs.imported_at) AS last_log_at,
                     COUNT(logs.id) AS log_count,
                     (
                         SELECT latest_log.ldex
                         FROM logs AS latest_log
                         WHERE latest_log.patient_id = patients.id
                         ORDER BY latest_log.imported_at DESC, latest_log.id DESC
                         LIMIT 1
                     ) AS latest_ldex
            FROM patients
            LEFT JOIN logs ON logs.patient_id = patients.id
            WHERE patients.id = ?
            GROUP BY patients.id
            """,
            (patient_id,),
        ).fetchone()
        if patient is None:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        logs = connection.execute(
            """
            SELECT id, patient_id, filename, ldex, z_healthy, z_risk, reference, imported_at,
                   log_number, total_logs
            FROM (
                  SELECT logs.id, logs.patient_id, logs.filename, logs.ldex,
                      logs.z_healthy, logs.z_risk, logs.reference, logs.imported_at,
                       ROW_NUMBER() OVER (
                           PARTITION BY logs.patient_id
                           ORDER BY logs.imported_at ASC, logs.id ASC
                       ) AS log_number,
                       COUNT(*) OVER (
                           PARTITION BY logs.patient_id
                       ) AS total_logs
                FROM logs
                WHERE logs.patient_id = ?
            )
            ORDER BY imported_at ASC, id ASC
            """,
            (patient_id,),
        ).fetchall()

    result = patient_from_row(patient)
    result["logs"] = [dict(log) for log in logs]
    return result


@app.post("/patients", status_code=201)
def create_patient(patient: PatientCreate, user: dict = Depends(get_current_user)):
    name = patient.name.strip()
    if not name:
        raise HTTPException(status_code=422, detail="El nombre es obligatorio")
    if patient.date_of_birth > date.today():
        raise HTTPException(status_code=422, detail="La fecha de nacimiento no puede ser futura")

    created_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        cursor = connection.execute(
            """
            INSERT INTO patients (
                name, gender, date_of_birth, age_years, external_id,
                affected_side, affected_region, comments, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                patient.gender,
                patient.date_of_birth.isoformat(),
                None,
                patient.external_id.strip() or None if patient.external_id else None,
                patient.affected_side,
                patient.affected_region,
                patient.comments.strip() or None if patient.comments else None,
                created_at,
            ),
        )
        row = connection.execute(
            "SELECT * FROM patients WHERE id = ?", (cursor.lastrowid,)
        ).fetchone()
    return patient_from_row(row)


class LogCreate(BaseModel):
    patient_id: int
    filename: str = Field(min_length=1, max_length=255)
    z_healthy: float
    z_risk: float


@app.post("/logs", status_code=201)
def create_log(log: LogCreate, user: dict = Depends(get_current_user)):
    if not math.isfinite(log.z_healthy) or not math.isfinite(log.z_risk):
        raise HTTPException(status_code=422, detail="Las mediciones deben ser números válidos")
    if log.z_risk == 0:
        raise HTTPException(status_code=422, detail="La medición de riesgo no puede ser cero")

    ldex = log.z_healthy / log.z_risk

    imported_at = datetime.now(timezone.utc).isoformat()
    with get_connection() as connection:
        patient = connection.execute(
            "SELECT id FROM patients WHERE id = ?", (log.patient_id,)
        ).fetchone()
        if patient is None:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        cursor = connection.execute(
            """
            INSERT INTO logs (
                patient_id, filename, content, ldex, z_healthy, z_risk, imported_at
            )
            VALUES (?, ?, '', ?, ?, ?, ?)
            """,
            (
                log.patient_id,
                log.filename.strip(),
                ldex,
                log.z_healthy,
                log.z_risk,
                imported_at,
            ),
        )

    return {
        "id": cursor.lastrowid,
        "patient_id": log.patient_id,
        "filename": log.filename.strip(),
        "ldex": ldex,
        "z_healthy": log.z_healthy,
        "z_risk": log.z_risk,
        "imported_at": imported_at,
    }


@app.get("/logs")
def list_logs(user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        rows = connection.execute(
            """
            SELECT id, patient_id, patient_name, filename, ldex, z_healthy, z_risk, reference, imported_at,
                   log_number, total_logs
            FROM (
                SELECT logs.id, logs.patient_id, patients.name AS patient_name,
                       logs.filename, logs.ldex, logs.z_healthy, logs.z_risk, logs.reference, logs.imported_at,
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


@app.patch("/logs/{log_id}/reference")
def set_log_reference(log_id: int, user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        log = connection.execute(
            "SELECT patient_id, z_risk FROM logs WHERE id = ?", (log_id,)
        ).fetchone()
        if log is None:
            raise HTTPException(status_code=404, detail="Registro no encontrado")
        if log["z_risk"] is None:
            raise HTTPException(
                status_code=422,
                detail="Este registro no tiene z_risk y no puede ser referencia",
            )

        connection.execute(
            "UPDATE logs SET reference = 0 WHERE patient_id = ?", (log["patient_id"],)
        )
        connection.execute("UPDATE logs SET reference = 1 WHERE id = ?", (log_id,))
        row = connection.execute(
            "SELECT id, patient_id, reference FROM logs WHERE id = ?", (log_id,)
        ).fetchone()

    return dict(row)


@app.delete("/logs/{log_id}", status_code=204)
def delete_log(log_id: int, user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        result = connection.execute("DELETE FROM logs WHERE id = ?", (log_id,))
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Registro no encontrado")


@app.delete("/patients/{patient_id}", status_code=204)
def delete_patient(patient_id: int, user: dict = Depends(get_current_user)):
    with get_connection() as connection:
        patient = connection.execute(
            "SELECT id FROM patients WHERE id = ?", (patient_id,)
        ).fetchone()
        if patient is None:
            raise HTTPException(status_code=404, detail="Paciente no encontrado")

        connection.execute("DELETE FROM logs WHERE patient_id = ?", (patient_id,))
        result = connection.execute("DELETE FROM patients WHERE id = ?", (patient_id,))

if __name__ == "__main__":
    # Esto mantiene el servidor corriendo en http://127.0.0.1:8000
    uvicorn.run(app, host="127.0.0.1", port=8000)