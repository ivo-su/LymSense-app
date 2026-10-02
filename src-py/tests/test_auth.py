import importlib.util
import os
import sqlite3
import tempfile
from pathlib import Path

from argon2 import PasswordHasher
from fastapi.testclient import TestClient


def load_app(tmp_path: Path):
    env_dir = tmp_path / "lymsense-auth"
    env_dir.mkdir(exist_ok=True)
    os.environ["LYMSENSE_DATA_DIR"] = str(env_dir)
    spec = importlib.util.spec_from_file_location("lymsense_main", "/Users/ivan/VS code/LymSense-app/src-py/main.py")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module.app


def test_first_signup_creates_session_and_protects_data():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)

        response = client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )

        assert response.status_code == 200, response.text
        data = response.json()
        assert data["user"]["email"] == "alice@example.com"
        assert data["user"]["role"] == "admin"
        assert "lymsense_session" in response.cookies

        protected = client.get("/patients")
        assert protected.status_code == 200, protected.text


def test_second_signup_is_blocked():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)

        client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )

        response = client.post(
            "/auth/signup",
            json={"name": "Bob", "email": "bob@example.com", "password": "secret456"},
        )

        assert response.status_code == 403, response.text


def test_login_and_logout_work_and_require_session():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)

        client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )
        client.post("/auth/logout")

        login = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )
        assert login.status_code == 200, login.text
        assert "lymsense_session" in login.cookies

        protected = client.get("/patients")
        assert protected.status_code == 200, protected.text

        logout = client.post("/auth/logout")
        assert logout.status_code == 200, logout.text

        after_logout = client.get("/patients")
        assert after_logout.status_code == 401, after_logout.text


def test_authorization_header_authenticates_without_cookie():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)

        signup = client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )
        token = signup.json()["token"]

        response = client.get(
            "/patients",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200, response.text


def test_unauthed_access_is_rejected():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)

        response = client.get("/patients")
        assert response.status_code == 401, response.text


def test_admin_can_create_admin_and_regular_accounts():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)
        client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )

        regular = client.post(
            "/admin/users",
            json={
                "name": "Bob",
                "email": "bob@example.com",
                "password": "secret456",
                "role": "user",
            },
        )
        administrator = client.post(
            "/admin/users",
            json={
                "name": "Carol",
                "email": "carol@example.com",
                "password": "secret789",
                "role": "admin",
            },
        )

        assert regular.status_code == 201, regular.text
        assert regular.json()["role"] == "user"
        assert administrator.status_code == 201, administrator.text
        assert administrator.json()["role"] == "admin"
        assert len(client.get("/admin/users").json()) == 3


def test_regular_account_cannot_manage_accounts():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        admin_client = TestClient(app)
        admin_client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )
        admin_client.post(
            "/admin/users",
            json={
                "name": "Bob",
                "email": "bob@example.com",
                "password": "secret456",
                "role": "user",
            },
        )

        regular_client = TestClient(app)
        login = regular_client.post(
            "/auth/login",
            json={"email": "bob@example.com", "password": "secret456"},
        )
        assert login.status_code == 200, login.text
        assert login.json()["user"]["role"] == "user"
        assert regular_client.get("/admin/users").status_code == 403


def test_existing_account_is_promoted_to_admin_during_role_migration():
    with tempfile.TemporaryDirectory() as tmp_dir:
        data_dir = Path(tmp_dir) / "lymsense-auth"
        data_dir.mkdir()
        os.environ["LYMSENSE_DATA_DIR"] = str(data_dir)
        connection = sqlite3.connect(data_dir / "lymsense.db")
        connection.execute(
            """
            CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                email TEXT NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        connection.execute(
            "INSERT INTO users (name, email, password_hash, created_at) VALUES (?, ?, ?, ?)",
            (
                "Alice",
                "alice@example.com",
                PasswordHasher().hash("secret123"),
                "2026-01-01T00:00:00+00:00",
            ),
        )
        connection.commit()
        connection.close()

        app = load_app(Path(tmp_dir))
        client = TestClient(app)
        login = client.post(
            "/auth/login",
            json={"email": "alice@example.com", "password": "secret123"},
        )

        assert login.status_code == 200, login.text
        assert login.json()["user"]["role"] == "admin"
        assert client.get("/admin/users").status_code == 200


def test_admin_can_disable_and_reenable_account_and_disabled_sessions_are_revoked():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        admin_client = TestClient(app)
        admin_client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )
        created = admin_client.post(
            "/admin/users",
            json={
                "name": "Bob",
                "email": "bob@example.com",
                "password": "secret456",
                "role": "user",
            },
        )
        user_id = created.json()["id"]

        user_client = TestClient(app)
        user_client.post(
            "/auth/login",
            json={"email": "bob@example.com", "password": "secret456"},
        )
        disabled = admin_client.patch(
            f"/admin/users/{user_id}/status", json={"is_active": False}
        )

        assert disabled.status_code == 200, disabled.text
        assert disabled.json()["is_active"] is False
        assert user_client.get("/patients").status_code == 401
        assert user_client.post(
            "/auth/login",
            json={"email": "bob@example.com", "password": "secret456"},
        ).status_code == 403

        enabled = admin_client.patch(
            f"/admin/users/{user_id}/status", json={"is_active": True}
        )
        assert enabled.status_code == 200, enabled.text
        assert enabled.json()["is_active"] is True


def test_admin_cannot_remove_self_but_can_remove_another_admin():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)
        signup = client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )
        admin_id = signup.json()["user"]["id"]

        assert client.patch(
            f"/admin/users/{admin_id}/status", json={"is_active": False}
        ).status_code == 400
        assert client.delete(f"/admin/users/{admin_id}").status_code == 400

        other_admin = client.post(
            "/admin/users",
            json={
                "name": "Bob",
                "email": "bob@example.com",
                "password": "secret456",
                "role": "admin",
            },
        ).json()
        other_admin_client = TestClient(app)
        login = other_admin_client.post(
            "/auth/login",
            json={"email": "bob@example.com", "password": "secret456"},
        )
        assert login.status_code == 200, login.text
        assert other_admin_client.patch(
            f"/admin/users/{other_admin['id']}/status", json={"is_active": False}
        ).status_code == 400
        assert other_admin_client.delete(f"/admin/users/{other_admin['id']}").status_code == 400
        assert other_admin_client.delete(f"/admin/users/{admin_id}").status_code == 204


def test_admin_can_delete_another_account():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)
        client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )
        created = client.post(
            "/admin/users",
            json={
                "name": "Bob",
                "email": "bob@example.com",
                "password": "secret456",
                "role": "user",
            },
        )

        deleted = client.delete(f"/admin/users/{created.json()['id']}")
        assert deleted.status_code == 204, deleted.text
        assert [user["email"] for user in client.get("/admin/users").json()] == [
            "alice@example.com"
        ]


def test_user_can_read_and_update_own_doctor_profile():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)
        client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )

        initial = client.get("/account/profile")
        assert initial.status_code == 200, initial.text
        assert initial.json()["name"] == "Alice"
        assert initial.json()["medical_credentials"] is None

        updated = client.patch(
            "/account/profile",
            json={
                "name": "Dr. Alice Jones",
                "email": "alice.jones@example.com",
                "medical_credentials": "MD, PhD",
                "license_number": "LIC-12345",
                "license_jurisdiction": "California",
                "specialty": "Lymphedema care",
                "clinic_name": "Central Clinic",
                "clinic_address": "10 Main Street",
                "phone": "+1 555 0100",
                "contact_email": "clinic@example.com",
            },
        )

        assert updated.status_code == 200, updated.text
        assert updated.json()["medical_credentials"] == "MD, PhD"
        assert updated.json()["license_number"] == "LIC-12345"
        assert updated.json()["clinic_name"] == "Central Clinic"
        assert client.get("/auth/me").json()["user"]["email"] == "alice.jones@example.com"


def test_profile_update_rejects_duplicate_login_email():
    with tempfile.TemporaryDirectory() as tmp_dir:
        app = load_app(Path(tmp_dir))
        client = TestClient(app)
        client.post(
            "/auth/signup",
            json={"name": "Alice", "email": "alice@example.com", "password": "secret123"},
        )
        client.post(
            "/admin/users",
            json={
                "name": "Bob",
                "email": "bob@example.com",
                "password": "secret456",
                "role": "user",
            },
        )

        conflict = client.patch(
            "/account/profile", json={"email": "bob@example.com"}
        )
        assert conflict.status_code == 409, conflict.text
