# Component: n40 SQLite (Meta & Index) & migrations
"""
SQLite Database Storage Manager for Dexter Presentation Studio.
Manages metadata, index, settings, tasks, and migrations with WAL mode.
"""

import os
import sqlite3
import json
import time
from typing import Dict, Any, List, Optional
from dexter_engine.logging.safe_logger import get_safe_logger

logger = get_safe_logger("n40_db")

MIGRATIONS = [
    # Migration 1: Initial schema v1.0
    """
    -- Settings table (key, value_json, updated_at)
    CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value_json TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Projects metadata
    CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        path TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        schema_version TEXT NOT NULL
    );

    -- Library files indexed
    CREATE TABLE IF NOT EXISTS library_files (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT UNIQUE NOT NULL,
        sha256 TEXT NOT NULL,
        size INTEGER NOT NULL,
        type TEXT NOT NULL,
        status TEXT NOT NULL,
        error TEXT,
        source TEXT,
        license TEXT,
        indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_library_sha256 ON library_files(sha256);

    -- Library metadata details
    CREATE TABLE IF NOT EXISTS library_meta (
        file_id INTEGER PRIMARY KEY,
        meta_json TEXT NOT NULL,
        FOREIGN KEY(file_id) REFERENCES library_files(id) ON DELETE CASCADE
    );

    -- Tasks tracking
    CREATE TABLE IF NOT EXISTS tasks (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        state TEXT NOT NULL,
        progress REAL DEFAULT 0.0,
        checkpoint_json TEXT,
        error TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Sources & Claims
    CREATE TABLE IF NOT EXISTS sources (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        title TEXT NOT NULL,
        url TEXT,
        accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        snippet TEXT
    );

    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        slide_id TEXT,
        text TEXT NOT NULL,
        status TEXT NOT NULL, -- 'supported', 'unsupported', 'conflicting'
        source_ids_json TEXT
    );

    -- Assets metadata
    CREATE TABLE IF NOT EXISTS assets (
        id TEXT PRIMARY KEY,
        project_id TEXT,
        path TEXT NOT NULL,
        source TEXT,
        license TEXT,
        author TEXT
    );

    -- Preference events (n30)
    CREATE TABLE IF NOT EXISTS preference_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_type TEXT NOT NULL,
        target_id TEXT NOT NULL,
        weight REAL DEFAULT 1.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Provider config (n18/n7 - NO SECRETS/KEYS HERE)
    CREATE TABLE IF NOT EXISTS provider_config (
        provider_id TEXT PRIMARY KEY,
        enabled INTEGER DEFAULT 0,
        model TEXT,
        allowed_tasks_json TEXT
    );

    -- Consent decision log (n36)
    CREATE TABLE IF NOT EXISTS consent_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        provider_id TEXT NOT NULL,
        task_type TEXT NOT NULL,
        decision TEXT NOT NULL, -- 'granted', 'denied'
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Schema migrations tracker
    CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
]

class DatabaseManager:
    def __init__(self, db_path: str):
        self.db_path = db_path
        os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
        self._init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA foreign_keys = ON;")
        return conn

    def _init_db(self):
        """Applies migrations sequentially in transactions."""
        with self.get_connection() as conn:
            # Check applied migrations
            conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP);")
            cur = conn.cursor()
            cur.execute("SELECT version FROM schema_migrations ORDER BY version ASC;")
            applied = {row[0] for row in cur.fetchall()}

            for idx, script in enumerate(MIGRATIONS, start=1):
                if idx not in applied:
                    logger.info(f"Applying database migration #{idx}...")
                    conn.executescript(script)
                    conn.execute("INSERT INTO schema_migrations (version) VALUES (?);", (idx,))
                    conn.commit()

    # --- Settings API ---
    def get_setting(self, key: str, default: Any = None) -> Any:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT value_json FROM settings WHERE key = ?;", (key,))
            row = cur.fetchone()
            if row:
                return json.loads(row[0])
            return default

    def set_setting(self, key: str, value: Any) -> None:
        with self.get_connection() as conn:
            val_json = json.dumps(value, ensure_ascii=False)
            conn.execute("""
                INSERT INTO settings (key, value_json, updated_at)
                VALUES (?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = CURRENT_TIMESTAMP;
            """, (key, val_json))
            conn.commit()

    def get_all_settings(self) -> Dict[str, Any]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT key, value_json FROM settings;")
            return {row[0]: json.loads(row[1]) for row in cur.fetchall()}

    # --- Projects API ---
    def register_project(self, project_id: str, title: str, path: str, schema_version: str = "1.0.0") -> None:
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO projects (id, title, path, schema_version, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(id) DO UPDATE SET title = excluded.title, path = excluded.path, updated_at = CURRENT_TIMESTAMP;
            """, (project_id, title, path, schema_version))
            conn.commit()

    def list_projects(self) -> List[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT id, title, path, schema_version, created_at, updated_at FROM projects ORDER BY updated_at DESC;")
            return [dict(row) for row in cur.fetchall()]

    # --- Provider Config (No secrets stored) ---
    def set_provider_config(self, provider_id: str, enabled: bool, model: Optional[str], allowed_tasks: List[str]) -> None:
        with self.get_connection() as conn:
            conn.execute("""
                INSERT INTO provider_config (provider_id, enabled, model, allowed_tasks_json)
                VALUES (?, ?, ?, ?)
                ON CONFLICT(provider_id) DO UPDATE SET enabled = excluded.enabled, model = excluded.model, allowed_tasks_json = excluded.allowed_tasks_json;
            """, (provider_id, 1 if enabled else 0, model, json.dumps(allowed_tasks)))
            conn.commit()

    def get_provider_config(self, provider_id: str) -> Optional[Dict[str, Any]]:
        with self.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT provider_id, enabled, model, allowed_tasks_json FROM provider_config WHERE provider_id = ?;", (provider_id,))
            row = cur.fetchone()
            if row:
                return {
                    "provider_id": row[0],
                    "enabled": bool(row[1]),
                    "model": row[2],
                    "allowed_tasks": json.loads(row[3]) if row[3] else []
                }
            return None
