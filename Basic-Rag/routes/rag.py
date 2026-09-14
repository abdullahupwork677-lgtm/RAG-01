import os
import re
import sqlite3
import uuid
from datetime import datetime, timezone

import httpx
from bs4 import BeautifulSoup
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import ingest
import rag_service
from .auth import get_current_user

router = APIRouter()

# ─── Constants ────────────────────────────────────────────
DOCS_FOLDER = "docs"
ALLOWED_EXTENSIONS = {".pdf", ".txt", ".md", ".docx", ".pptx"}
DB_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "chats.db")
# ──────────────────────────────────────────────────────────


def _user_docs_dir(user_id: str) -> str:
    """Per-user document folder (docs/<user_id>/)."""
    base = os.path.join(os.path.dirname(os.path.dirname(__file__)), DOCS_FOLDER)
    if not user_id:
        return base
    folder = os.path.join(base, user_id)
    os.makedirs(folder, exist_ok=True)
    return folder


# ─── Request / response schemas ───────────────────────────

class AskRequest(BaseModel):
    question: str
    session_id: str | None = None
    sources: list[str] | None = None
    language: str | None = None


class SessionCreateRequest(BaseModel):
    title: str | None = None
    sources: list[str] | None = None


class SessionPatchRequest(BaseModel):
    title: str | None = None
    add_sources: list[str] | None = None
    remove_sources: list[str] | None = None


class SummarizeRequest(BaseModel):
    session_id: str | None = None
    sources: list[str] | None = None
    language: str | None = None


class IngestUrlRequest(BaseModel):
    url: str
    session_id: str | None = None


class IngestYouTubeRequest(BaseModel):
    url: str
    session_id: str | None = None


# ─── SQLite helpers ───────────────────────────────────────

def _db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def _init_db():
    with _db() as conn:
        conn.executescript("""
            CREATE TABLE IF NOT EXISTS sessions (
                id          TEXT PRIMARY KEY,
                title       TEXT NOT NULL,
                sources     TEXT NOT NULL DEFAULT '[]',
                user_id     TEXT,
                created_at  TEXT NOT NULL,
                updated_at  TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS messages (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                session_id  TEXT NOT NULL,
                role        TEXT NOT NULL,
                content     TEXT NOT NULL,
                sources     TEXT,
                created_at  TEXT NOT NULL
            );
        """)
        # Migrate legacy sessions table (add user_id column if missing).
        cols = [r[1] for r in conn.execute("PRAGMA table_info(sessions)").fetchall()]
        if "user_id" not in cols:
            try:
                conn.execute("ALTER TABLE sessions ADD COLUMN user_id TEXT")
            except Exception:
                pass


def _now():
    return datetime.now(timezone.utc).isoformat()


def _uuid():
    return uuid.uuid4().hex[:12]


def _parse_sources_json(raw):
    import json
    if not raw:
        return []
    try:
        return json.loads(raw)
    except Exception:
        return []


def _sources_list(row):
    return _parse_sources_json(row["sources"])


def _msg(m):
    d = {"id": m["id"], "role": m["role"], "content": m["content"], "created_at": m["created_at"]}
    if m["sources"]:
        d["sources"] = _parse_sources_json(m["sources"])
    return d


def _session_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "sources": _sources_list(row),
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def _ensure_session(session_id, user_id=None):
    conn = _db()
    if user_id:
        row = conn.execute(
            "SELECT * FROM sessions WHERE id = ? AND user_id = ?", (session_id, user_id)
        ).fetchone()
    else:
        row = conn.execute("SELECT * FROM sessions WHERE id = ?", (session_id,)).fetchone()
    conn.close()
    if not row:
        raise HTTPException(status_code=404, detail="Session not found")
    return row


def _update_session_sources(session_id, new_sources):
    import json
    with _db() as conn:
        conn.execute(
            "UPDATE sessions SET sources = ?, updated_at = ? WHERE id = ?",
            (json.dumps(new_sources), _now(), session_id),
        )


def _save_message(session_id, role, content, sources=None):
    import json
    sources_json = json.dumps(sources) if sources else None
    with _db() as conn:
        conn.execute(
            "INSERT INTO messages (session_id, role, content, sources, created_at) VALUES (?, ?, ?, ?, ?)",
            (session_id, role, content, sources_json, _now()),
        )
        conn.execute("UPDATE sessions SET updated_at = ? WHERE id = ?", (_now(), session_id))


def _update_session_field(session_id, field, value):
    with _db() as conn:
        conn.execute(
            f"UPDATE sessions SET {field} = ?, updated_at = ? WHERE id = ?",
            (value, _now(), session_id),
        )


def _add_sources(session_id, filenames: list[str], user_id=None):
    import json
    conn = _db()
    if user_id:
        row = conn.execute(
            "SELECT sources FROM sessions WHERE id = ? AND user_id = ?",
            (session_id, user_id),
        ).fetchone()
    else:
        row = conn.execute("SELECT sources FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if not row:
        conn.close()
        return
    current = _parse_sources_json(row["sources"])
    for f in filenames:
        if f not in current:
            current.append(f)
    conn.execute("UPDATE sessions SET sources = ?, updated_at = ? WHERE id = ?",
                 (json.dumps(current), _now(), session_id))
    conn.commit()
    conn.close()


def _remove_source(session_id, filename: str, user_id=None):
    import json
    conn = _db()
    if user_id:
        row = conn.execute(
            "SELECT sources FROM sessions WHERE id = ? AND user_id = ?",
            (session_id, user_id),
        ).fetchone()
    else:
        row = conn.execute("SELECT sources FROM sessions WHERE id = ?", (session_id,)).fetchone()
    if not row:
        conn.close()
        return
    current = _parse_sources_json(row["sources"])
    current = [s for s in current if s != filename]
    conn.execute("UPDATE sessions SET sources = ?, updated_at = ? WHERE id = ?",
                 (json.dumps(current), _now(), session_id))
    conn.commit()
    conn.close()


# initialise DB on import
_init_db()


# ─── Sessions ─────────────────────────────────────────────

@router.post("/sessions")
async def create_session(req: SessionCreateRequest, user: dict = Depends(get_current_user)):
    import json
    sid = _uuid()
    title = req.title or "New Chat"
    sources = json.dumps(req.sources or [])
    now = _now()
    with _db() as conn:
        conn.execute(
            "INSERT INTO sessions (id, title, sources, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)",
            (sid, title, sources, user["id"], now, now),
        )
    return {"id": sid, "title": title, "sources": req.sources or [], "created_at": now, "updated_at": now}


@router.get("/sessions")
async def list_sessions(user: dict = Depends(get_current_user)):
    conn = _db()
    rows = conn.execute(
        "SELECT s.*, COUNT(m.id) as message_count FROM sessions s "
        "LEFT JOIN messages m ON m.session_id = s.id "
        "WHERE s.user_id = ? "
        "GROUP BY s.id ORDER BY s.updated_at DESC",
        (user["id"],),
    ).fetchall()
    conn.close()
    return [
        {**_session_to_dict(r), "message_count": r["message_count"]}
        for r in rows
    ]


@router.get("/sessions/{session_id}")
async def get_session(session_id: str, user: dict = Depends(get_current_user)):
    conn = _db()
    row = conn.execute(
        "SELECT * FROM sessions WHERE id = ? AND user_id = ?", (session_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    messages = conn.execute(
        "SELECT * FROM messages WHERE session_id = ? ORDER BY id", (session_id,)
    ).fetchall()
    conn.close()
    return {**_session_to_dict(row), "messages": [_msg(m) for m in messages]}


@router.patch("/sessions/{session_id}")
async def patch_session(session_id: str, req: SessionPatchRequest, user: dict = Depends(get_current_user)):
    conn = _db()
    row = conn.execute(
        "SELECT sources FROM sessions WHERE id = ? AND user_id = ?", (session_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")

    current = _parse_sources_json(row["sources"])
    for f in (req.remove_sources or []):
        current = [s for s in current if s != f]
    for f in (req.add_sources or []):
        if f not in current:
            current.append(f)

    import json
    now = _now()
    conn.execute(
        "UPDATE sessions SET title = COALESCE(?, title), sources = ?, updated_at = ? WHERE id = ?",
        (req.title, json.dumps(current), now, session_id),
    )
    conn.commit()
    conn.close()
    return {"ok": True, "sources": current, "updated_at": now}


@router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    conn = _db()
    row = conn.execute(
        "SELECT id FROM sessions WHERE id = ? AND user_id = ?", (session_id, user["id"])
    ).fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Session not found")
    conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()
    conn.close()
    return {"ok": True}


# ─── Ask ──────────────────────────────────────────────────

@router.post("/ask")
async def ask(req: AskRequest, user: dict = Depends(get_current_user)):
    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty")

    sources = req.sources
    if req.session_id:
        row = _ensure_session(req.session_id, user["id"])
        sources = _sources_list(row)

    try:
        result = rag_service.ask(req.question.strip(), sources=sources, language=req.language, user_id=user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if req.session_id:
        _save_message(req.session_id, "user", req.question.strip())
        _save_message(req.session_id, "assistant", result["answer"], sources=result["sources"])

    return {
        "answer": result["answer"],
        "sources": result["sources"],
        "model": result.get("model"),
    }


# ─── Summarize ────────────────────────────────────────────

@router.post("/summarize")
async def summarize(req: SummarizeRequest, user: dict = Depends(get_current_user)):
    sources = req.sources
    if req.session_id:
        row = _ensure_session(req.session_id, user["id"])
        sources = _sources_list(row)

    if not sources:
        stats = rag_service.document_stats(user_id=user["id"])
        if not stats:
            raise HTTPException(status_code=400, detail="No documents available. Upload files first.")
        sources = list(stats.keys())

    try:
        result = rag_service.summarize(sources=sources, language=req.language, user_id=user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    if req.session_id:
        _save_message(req.session_id, "user", "Summarize the documents")
        _save_message(req.session_id, "assistant", result["answer"])

    return {"answer": result["answer"], "model": result.get("model")}


# ─── Upload ───────────────────────────────────────────────

@router.post("/upload")
async def upload_document(
    file: UploadFile = File(...),
    session_id: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"File type '{ext}' not supported. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}")

    user_dir = _user_docs_dir(user["id"])
    save_path = os.path.join(user_dir, file.filename)

    content = await file.read()
    with open(save_path, "wb") as f:
        f.write(content)

    try:
        result = ingest.ingest_file(save_path, user_id=user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

    rag_service.reload_collection()

    if session_id:
        _add_sources(session_id, [file.filename], user["id"])

    return {
        "filename": file.filename,
        "size": len(content),
        "chunks": result["chunks"],
        "pages": result["pages"],
        "success": True,
        "message": result.get("message", ""),
    }


# ─── Documents ────────────────────────────────────────────

@router.get("/documents")
async def list_documents(user: dict = Depends(get_current_user)):
    stats = rag_service.document_stats(user_id=user["id"])
    user_dir = _user_docs_dir(user["id"])
    files = []
    for name in os.listdir(user_dir) if os.path.exists(user_dir) else []:
        ext = os.path.splitext(name)[1].lower()
        if ext in ALLOWED_EXTENSIONS:
            path = os.path.join(user_dir, name)
            files.append({
                "name": name,
                "size": os.path.getsize(path),
                "chunks": stats.get(name, 0),
            })
    return {"documents": files, "total_chunks": sum(s["chunks"] for s in files)}


@router.get("/files/{filename:path}")
async def get_user_file(filename: str, user: dict = Depends(get_current_user)):
    """Serve a user's uploaded file (PDFs for the viewer). Ownership is implicit via folder."""
    safe_name = os.path.basename(filename)
    path = os.path.join(_user_docs_dir(user["id"]), safe_name)
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path)


@router.delete("/documents/{filename:path}")
async def delete_document(filename: str, user: dict = Depends(get_current_user)):
    safe_name = os.path.basename(filename)
    file_path = os.path.join(_user_docs_dir(user["id"]), safe_name)
    if os.path.exists(file_path):
        os.remove(file_path)

    try:
        ingest.delete_source(safe_name, user_id=user["id"])
    except Exception:
        pass
    rag_service.reload_collection()

    with _db() as conn:
        rows = conn.execute(
            "SELECT id, sources FROM sessions WHERE user_id = ?", (user["id"],)
        ).fetchall()
        for r in rows:
            current = _parse_sources_json(r["sources"])
            new_val = [s for s in current if s != safe_name]
            if new_val != current:
                import json
                conn.execute("UPDATE sessions SET sources = ?, updated_at = ? WHERE id = ?",
                             (json.dumps(new_val), _now(), r["id"]))
        conn.commit()

    return {"ok": True, "deleted": safe_name}


# ─── URL ingest ───────────────────────────────────────────

def _scrape_url(url: str) -> dict:
    """Fetch a URL and extract its main text content."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; RAGChat/1.0)"}
    resp = httpx.get(url, follow_redirects=True, timeout=20, headers=headers)
    resp.raise_for_status()

    soup = BeautifulSoup(resp.text, "html.parser")

    for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form"]):
        tag.decompose()

    title = soup.title.get_text(strip=True) if soup.title else url.split("?")[0].split("/")[-1] or url
    body = soup.get_text(separator="\n", strip=True)
    body = re.sub(r"\n{3,}", "\n\n", body)
    body = re.sub(r"[^\S\n]{2,}", " ", body)

    if len(body) < 40:
        raise ValueError("Page did not contain enough readable text.")
    return {"title": title[:200], "text": body}


def _safe_filename(title: str, url: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60] or "page"
    rand = uuid.uuid4().hex[:8]
    return f"web_{rand}_{slug}.txt"


@router.post("/ingest-url")
async def ingest_url(req: IngestUrlRequest, user: dict = Depends(get_current_user)):
    try:
        page = _scrape_url(req.url)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch URL: {e}")

    user_dir = _user_docs_dir(user["id"])
    filename = _safe_filename(page["title"], req.url)
    save_path = os.path.join(user_dir, filename)

    with open(save_path, "w", encoding="utf-8") as f:
        f.write(f"# {page['title']}\n\n{page['text']}")

    try:
        result = ingest.ingest_file(save_path, extra_meta={"url": req.url}, user_id=user["id"])
    except Exception as e:
        os.remove(save_path)
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

    rag_service.reload_collection()

    if req.session_id:
        _add_sources(req.session_id, [filename], user["id"])

    return {
        "filename": filename,
        "title": page["title"],
        "url": req.url,
        "chunks": result["chunks"],
        "pages": result["pages"],
        "success": True,
    }


# ─── YouTube ingest ──────────────────────────────────────

YOURL_VIDEO_ID_RE = re.compile(
    r"(?:v=|youtu\.be/|shorts/|embed/|live/)([A-Za-z0-9_-]{11})"
)


def _extract_video_id(url):
    m = YOURL_VIDEO_ID_RE.search(url)
    return m.group(1) if m else None


def _fetch_youtube_transcript(video_id: str) -> list:
    from youtube_transcript_api import YouTubeTranscriptApi

    api = YouTubeTranscriptApi()

    # Preferred languages, in order. We look for any of these in the video's
    # available transcripts (handles "en-IN", "en-GB", auto captions, etc.).
    # As a last resort, pick the first available transcript of any language.
    preferred = ["en", "en-IN", "en-GB", "en-US", "hi"]

    transcript_list = api.list(video_id)
    chosen = None
    for cand in transcript_list:
        lang = getattr(cand, "language_code", None) or getattr(cand, "language", None) or ""
        if lang in preferred:
            chosen = cand
            break
    if chosen is None:
        # Fall back to the first available transcript.
        for cand in transcript_list:
            chosen = cand
            break

    if chosen is None:
        raise RuntimeError("No transcript available for this video.")

    transcript = chosen.fetch()
    fragments = []
    for item in transcript:
        if isinstance(item, dict):
            fragments.append((item.get("text", ""), item.get("start", 0.0)))
        else:
            fragments.append((getattr(item, "text", ""), getattr(item, "start", 0.0)))
    return fragments


def _fmt_ts(seconds: float) -> str:
    m, s = divmod(int(seconds), 60)
    h = 0
    if m >= 60:
        h, m = divmod(m, 60)
    return f"{h}:{m:02d}:{s:02d}" if h else f"{m:02d}:{s:02d}"


def _fetch_video_meta(video_id: str) -> dict:
    """Fetch title, channel, and thumbnail URL for a YouTube video."""
    headers = {"User-Agent": "Mozilla/5.0 (compatible; RAGChat/1.0)"}
    meta = {
        "title": f"YouTube video {video_id}",
        "channel": "",
        "thumbnail": f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg",
    }
    try:
        resp = httpx.get(
            f"https://www.youtube.com/watch?v={video_id}",
            follow_redirects=True,
            timeout=15,
            headers=headers,
        )
        html = resp.text
        soup = BeautifulSoup(html, "html.parser")

        if soup.title:
            title = re.sub(r"\s*-\s*YouTube\s*$", "", soup.title.get_text(strip=True))
            if title:
                meta["title"] = title

        # Channel name from og:title / itemprop or link tags.
        channel_link = soup.find("link", {"itemprop": "name"})
        if channel_link and channel_link.get("content"):
            meta["channel"] = channel_link["content"]

        # Prefer the highest-res thumbnail from meta tags if available.
        for prop in ("og:image", "twitter:image"):
            tag = soup.find("meta", {"property": prop}) or soup.find("meta", {"name": prop})
            if tag and tag.get("content"):
                content = tag["content"]
                if "ytimg.com" in content:
                    meta["thumbnail"] = content
                    break
    except Exception:
        pass
    return meta


@router.post("/ingest-youtube")
async def ingest_youtube(req: IngestYouTubeRequest, user: dict = Depends(get_current_user)):
    video_id = _extract_video_id(req.url)
    if not video_id:
        raise HTTPException(
            status_code=400,
            detail="Could not detect a YouTube video ID in that URL.",
        )

    try:
        fragments = _fetch_youtube_transcript(video_id)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Could not fetch the transcript (auto captions may be unavailable): {e}",
        )

    if not fragments:
        raise HTTPException(
            status_code=400, detail="The video has no transcript available."
        )

    vmeta = _fetch_video_meta(video_id)
    title = vmeta["title"]
    text = "\n".join(f"[{_fmt_ts(start)}] {t.strip()}" for t, start in fragments)

    user_dir = _user_docs_dir(user["id"])
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")[:60] or "video"
    filename = f"yt_{slug}.txt"
    save_path = os.path.join(user_dir, filename)

    with open(save_path, "w", encoding="utf-8") as f:
        f.write(f"# {title}\n\n{text}")

    try:
        result = ingest.ingest_file(save_path, extra_meta={"url": req.url, "kind": "youtube"}, user_id=user["id"])
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ingestion failed: {e}")

    rag_service.reload_collection()

    if req.session_id:
        _add_sources(req.session_id, [filename], user["id"])

    return {
        "filename": filename,
        "title": title,
        "channel": vmeta["channel"],
        "thumbnail": vmeta["thumbnail"],
        "url": req.url,
        "video_id": video_id,
        "chunks": result["chunks"],
        "pages": result["pages"],
        "success": True,
    }
