"""
SocialQueue: SQLite-backed content queue for social posting pipeline.
Loads posts from content_queue.json and tracks posting status.
"""
import json
import sqlite3
import os
import re
from datetime import datetime
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(__file__), "queue.db")
CONTENT_FILE = os.path.join(os.path.dirname(__file__), "content_queue.json")

GUMROAD_URL = "https://buildexlab.gumroad.com/l/SFCS"
UTM_PARAMS = {
    "twitter": "?utm_source=twitter&utm_medium=organic&utm_campaign=book",
    "linkedin": "?utm_source=linkedin&utm_medium=organic&utm_campaign=book",
}


def inject_utm(text: str, platform: str) -> str:
    """Replace bare Gumroad links with UTM-tagged versions."""
    utm = UTM_PARAMS.get(platform, "")
    # Replace URL with or without existing query string
    pattern = re.escape(GUMROAD_URL) + r"(\?[^\s]*)?"
    replacement = GUMROAD_URL + utm
    return re.sub(pattern, replacement, text)


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with get_conn() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                platform TEXT NOT NULL,
                scheduled_at TEXT NOT NULL,
                hook TEXT NOT NULL,
                body TEXT,
                pillar TEXT,
                cta_type TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                posted_at TEXT,
                error TEXT,
                retry_count INTEGER DEFAULT 0
            )
        """)
        conn.commit()


def load_from_file(content_file: str = CONTENT_FILE):
    """Load posts from JSON file into the queue (skips already-loaded ids)."""
    if not os.path.exists(content_file):
        raise FileNotFoundError(f"Content file not found: {content_file}")

    with open(content_file, "r", encoding="utf-8") as f:
        posts = json.load(f)

    init_db()
    loaded = 0
    skipped = 0
    with get_conn() as conn:
        for p in posts:
            body = p.get("body") or p["hook"]
            body = inject_utm(body, p["platform"])
            try:
                conn.execute(
                    """
                    INSERT INTO posts (id, platform, scheduled_at, hook, body, pillar, cta_type)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        p["id"],
                        p["platform"],
                        p["scheduled_at"],
                        p["hook"],
                        body,
                        p.get("pillar"),
                        p.get("cta_type", "none"),
                    ),
                )
                loaded += 1
            except sqlite3.IntegrityError:
                skipped += 1
        conn.commit()
    return loaded, skipped


def get_due_posts(platform: Optional[str] = None) -> list:
    """Return pending posts whose scheduled_at <= now."""
    init_db()
    now = datetime.utcnow().isoformat()
    with get_conn() as conn:
        if platform:
            rows = conn.execute(
                "SELECT * FROM posts WHERE status='pending' AND scheduled_at <= ? AND platform=? ORDER BY scheduled_at",
                (now, platform),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM posts WHERE status='pending' AND scheduled_at <= ? ORDER BY scheduled_at",
                (now,),
            ).fetchall()
    return [dict(r) for r in rows]


def mark_posted(post_id: str):
    with get_conn() as conn:
        conn.execute(
            "UPDATE posts SET status='posted', posted_at=? WHERE id=?",
            (datetime.utcnow().isoformat(), post_id),
        )
        conn.commit()


def mark_failed(post_id: str, error: str, increment_retry: bool = True):
    with get_conn() as conn:
        conn.execute(
            "UPDATE posts SET status='failed', error=?, retry_count=retry_count+? WHERE id=?",
            (error, 1 if increment_retry else 0, post_id),
        )
        conn.commit()


def reset_failed_for_retry(post_id: str):
    with get_conn() as conn:
        conn.execute(
            "UPDATE posts SET status='pending', error=NULL WHERE id=?",
            (post_id,),
        )
        conn.commit()


def list_posts(status: Optional[str] = None, limit: int = 50) -> list:
    init_db()
    with get_conn() as conn:
        if status:
            rows = conn.execute(
                "SELECT * FROM posts WHERE status=? ORDER BY scheduled_at LIMIT ?",
                (status, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM posts ORDER BY scheduled_at LIMIT ?",
                (limit,),
            ).fetchall()
    return [dict(r) for r in rows]
