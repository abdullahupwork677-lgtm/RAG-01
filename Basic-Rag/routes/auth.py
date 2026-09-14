import hashlib
import hmac
import os
import re
import secrets
import smtplib
import sqlite3
import uuid
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel

router = APIRouter(tags=["Auth"])

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chats.db")
TOKEN_TTL_SECONDS = 60 * 60 * 24 * 30  # 30 days
RESET_TTL_SECONDS = 60 * 60  # 1 hour

bearer = HTTPBearer(auto_error=False)

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


# ─── DB helpers ───────────────────────────────────────────

def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _now():
    return datetime.now(timezone.utc).isoformat()


def _uuid():
    return uuid.uuid4().hex[:12]


def _init_auth_db():
    with _db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id            TEXT PRIMARY KEY,
                email         TEXT NOT NULL UNIQUE,
                name          TEXT NOT NULL DEFAULT '',
                password_hash TEXT NOT NULL,
                created_at    TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS auth_tokens (
                token      TEXT PRIMARY KEY,
                user_id    TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS reset_tokens (
                token      TEXT PRIMARY KEY,
                user_id    TEXT NOT NULL,
                created_at TEXT NOT NULL,
                expires_at TEXT NOT NULL
            );
        """)


# ─── Password hashing (PBKDF2, no extra deps) ──────────────

_PBKDF2_ITERATIONS = 120_000


def _hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt, _PBKDF2_ITERATIONS
    )
    return f"pbkdf2${_PBKDF2_ITERATIONS}${salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored: str) -> bool:
    try:
        scheme, iterations, salt_hex, hash_hex = stored.split("$")
        if scheme != "pbkdf2":
            return False
        digest = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            bytes.fromhex(salt_hex),
            int(iterations),
        )
        return hmac.compare_digest(digest.hex(), hash_hex)
    except Exception:
        return False


def _make_token():
    return secrets.token_urlsafe(32)


def _user_dict(row):
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "created_at": row["created_at"],
    }


def _issue_token(user_id: str) -> str:
    token = _make_token()
    now = datetime.now(timezone.utc)
    with _db() as conn:
        conn.execute(
            "INSERT INTO auth_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
            (token, user_id, _now(), (now + timedelta(seconds=TOKEN_TTL_SECONDS)).isoformat()),
        )
    return token


# ─── Auth dependency ──────────────────────────────────────

def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer),
) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="Not authenticated")
    conn = _db()
    row = conn.execute(
        "SELECT u.* FROM auth_tokens a JOIN users u ON u.id = a.user_id "
        "WHERE a.token = ? AND a.expires_at > ?",
        (credentials.credentials, _now()),
    ).fetchone()
    conn.close()
    if row is None:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return _user_dict(row)


# ─── Schemas ──────────────────────────────────────────────

class RegisterRequest(BaseModel):
    email: str
    name: str = ""
    password: str


class LoginRequest(BaseModel):
    email: str
    password: str


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


# ─── Routes ───────────────────────────────────────────────

@router.post("/register")
async def register(req: RegisterRequest):
    email = req.email.strip().lower()
    name = req.name.strip()
    if not EMAIL_RE.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    if len(req.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    conn = _db()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=409, detail="An account with this email already exists.")

    uid = _uuid()
    conn.execute(
        "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
        (uid, email, name, _hash_password(req.password), _now()),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (uid,)).fetchone()
    conn.close()

    token = _issue_token(uid)
    return {"token": token, "user": _user_dict(row)}


@router.post("/login")
async def login(req: LoginRequest):
    email = req.email.strip().lower()
    conn = _db()
    row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    conn.close()
    if row is None or not _verify_password(req.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    token = _issue_token(row["id"])
    return {"token": token, "user": _user_dict(row)}


@router.post("/logout")
async def logout(user: dict = Depends(get_current_user)):
    conn = _db()
    conn.execute("DELETE FROM auth_tokens WHERE user_id = ?", (user["id"],))
    conn.commit()
    conn.close()
    return {"ok": True}


@router.get("/me")
async def me(user: dict = Depends(get_current_user)):
    return {"user": user}


# ─── Forgot / reset password ─────────────────────────────

def _send_reset_email(email: str, link: str) -> bool:
    host = os.getenv("SMTP_HOST")
    if not host:
        return False
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    from_addr = os.getenv("SMTP_FROM", user or "noreply@localhost")

    msg = EmailMessage()
    msg["Subject"] = "Reset your ChatPDF password"
    msg["From"] = from_addr
    msg["To"] = email
    msg.set_content(
        f"Hi,\n\nClick the link below to reset your ChatPDF password:\n{link}\n\n"
        f"This link expires in 1 hour. If you didn't request this, you can ignore this email.\n"
    )
    try:
        with smtplib.SMTP(host, port, timeout=15) as smtp:
            smtp.starttls()
            if user:
                smtp.login(user, password)
            smtp.send_message(msg)
        return True
    except Exception:
        return False


@router.post("/forgot-password")
async def forgot_password(req: ForgotPasswordRequest):
    email = req.email.strip().lower()
    conn = _db()
    row = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if row is None:
        # Don't leak whether an account exists.
        return {"ok": True, "message": "If that email exists, a reset link has been sent."}

    token = _make_token()
    now = datetime.now(timezone.utc)
    conn.execute(
        "INSERT INTO reset_tokens (token, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)",
        (token, row["id"], _now(), (now + timedelta(seconds=RESET_TTL_SECONDS)).isoformat()),
    )
    conn.commit()
    conn.close()

    reset_link = f"{os.getenv('FRONTEND_URL', 'https://api.turboturismo.com')}/reset-password?token={token}"
    sent = _send_reset_email(email, reset_link)
    return {
        "ok": True,
        "message": "If that email exists, a reset link has been sent.",
        "reset_link": reset_link if not sent else None,
    }


@router.post("/reset-password")
async def reset_password(req: ResetPasswordRequest):
    if len(req.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")

    now = datetime.now(timezone.utc).isoformat()
    conn = _db()
    row = conn.execute(
        "SELECT * FROM reset_tokens WHERE token = ? AND expires_at > ?",
        (req.token.strip(), now),
    ).fetchone()
    if row is None:
        conn.close()
        raise HTTPException(status_code=400, detail="This reset link is invalid or has expired.")

    new_hash = _hash_password(req.new_password)
    conn.execute("UPDATE users SET password_hash = ? WHERE id = ?", (new_hash, row["user_id"]))
    conn.execute("DELETE FROM reset_tokens WHERE token = ?", (req.token.strip(),))
    conn.execute("DELETE FROM auth_tokens WHERE user_id = ?", (row["user_id"],))
    conn.commit()
    conn.close()
    return {"ok": True, "message": "Password updated. You can now log in."}


_init_auth_db()