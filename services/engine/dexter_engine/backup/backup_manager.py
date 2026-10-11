# Component: n31 النسخ الاحتياطي (Backup & Restore)
"""
Backup and Restore Manager for Dexter Presentation Studio.
Creates consistent ZIP packages with SQLite backup API and project bundles.
Strictly excludes API keys and credentials.
"""

import os
import io
import json
import zipfile
import sqlite3
import hashlib
from typing import Dict, Any, List, Optional
from dexter_engine.storage.db import DatabaseManager

class BackupManager:
    @staticmethod
    def create_backup_archive(
        db_manager: DatabaseManager,
        project_bundle_paths: List[str],
        output_zip_path: str,
        app_version: str = "0.1.0"
    ) -> Dict[str, Any]:
        """Creates a consistent backup ZIP archive without secrets."""
        os.makedirs(os.path.dirname(os.path.abspath(output_zip_path)), exist_ok=True)

        # Ensure WAL is checkpointed so database file on disk is complete
        with db_manager.get_connection() as conn:
            conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")

        # Snapshot using SQLite backup API to memory, then write to bytes
        mem_db = sqlite3.connect(":memory:")
        with db_manager.get_connection() as src_conn:
            src_conn.backup(mem_db)

        # Read binary dump from memory db
        temp_dump_file = output_zip_path + ".dump_tmp"
        disk_dump = sqlite3.connect(temp_dump_file)
        mem_db.backup(disk_dump)
        disk_dump.close()
        mem_db.close()

        with open(temp_dump_file, "rb") as f:
            db_bytes = f.read()
        if os.path.exists(temp_dump_file):
            os.remove(temp_dump_file)

        # 2. Collect non-secret settings
        all_settings = db_manager.get_all_settings()

        # 3. Create ZIP package
        with zipfile.ZipFile(output_zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            # Write SQLite snapshot
            zf.writestr("dexter_snapshot.db", db_bytes)

            # Write settings manifest
            zf.writestr("settings.json", json.dumps(all_settings, ensure_ascii=False, indent=2))

            # Write project bundles
            for p_path in project_bundle_paths:
                if os.path.exists(p_path):
                    bundle_name = os.path.basename(os.path.normpath(p_path))
                    for root, _, files in os.walk(p_path):
                        for file in files:
                            full_file_path = os.path.join(root, file)
                            rel_path = os.path.relpath(full_file_path, p_path)
                            arcname = os.path.join("projects", bundle_name, rel_path)
                            zf.write(full_file_path, arcname)

            # Create manifest with SHA-256
            db_hash = hashlib.sha256(db_bytes).hexdigest()
            manifest = {
                "format": "dexter_backup_archive",
                "version": app_version,
                "db_sha256": db_hash,
                "project_count": len(project_bundle_paths),
            }
            zf.writestr("manifest.json", json.dumps(manifest, indent=2))

        # Calculate archive total hash
        archive_hash = hashlib.sha256()
        with open(output_zip_path, "rb") as f:
            while chunk := f.read(65536):
                archive_hash.update(chunk)

        return {
            "backup_file": output_zip_path,
            "archive_sha256": archive_hash.hexdigest(),
            "projects_backed_up": len(project_bundle_paths),
            "size_bytes": os.path.getsize(output_zip_path)
        }

    @staticmethod
    def restore_backup_archive(
        zip_archive_path: str,
        target_db_manager: DatabaseManager,
        target_projects_dir: str
    ) -> Dict[str, Any]:
        """Restores database and project files from backup archive."""
        if not os.path.exists(zip_archive_path):
            raise FileNotFoundError(f"Backup archive not found: {zip_archive_path}")

        os.makedirs(target_projects_dir, exist_ok=True)

        with zipfile.ZipFile(zip_archive_path, "r") as zf:
            # Check manifest
            if "manifest.json" not in zf.namelist():
                raise ValueError("Corrupt backup archive: manifest.json missing")

            manifest = json.loads(zf.read("manifest.json").decode("utf-8"))

            # Verify database integrity
            db_bytes = zf.read("dexter_snapshot.db")
            computed_hash = hashlib.sha256(db_bytes).hexdigest()
            if computed_hash != manifest.get("db_sha256"):
                raise ValueError("Integrity check failed: database checksum mismatch!")

            # Safely close/checkpoint and remove WAL/SHM artifacts before restoration
            db_path = target_db_manager.db_path
            for ext in ["", "-wal", "-shm"]:
                wal_f = db_path + ext
                if os.path.exists(wal_f):
                    try:
                        os.remove(wal_f)
                    except Exception:
                        pass

            # Write restored DB
            with open(db_path, "wb") as f:
                f.write(db_bytes)

            # Re-checkpoint target DB
            with target_db_manager.get_connection() as conn:
                conn.execute("PRAGMA wal_checkpoint(TRUNCATE);")

            # Restore projects
            restored_projects = []
            for name in zf.namelist():
                if name.startswith("projects/") and not name.endswith("/"):
                    rel_name = name[len("projects/"):]
                    dest_path = os.path.join(target_projects_dir, rel_name)
                    os.makedirs(os.path.dirname(dest_path), exist_ok=True)
                    with open(dest_path, "wb") as f:
                        f.write(zf.read(name))
                    bundle_root = rel_name.split("/")[0]
                    if bundle_root not in restored_projects:
                        restored_projects.append(bundle_root)

        return {
            "status": "success",
            "restored_projects": restored_projects,
            "version": manifest.get("version")
        }
