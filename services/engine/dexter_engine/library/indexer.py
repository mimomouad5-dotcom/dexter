# Component: n29 مستورد وفهرسة المكتبة & n40 SQLite & n42 مجلد المكتبة
"""
Batch Library Importer, Classifier, and Indexer with cooperative cancellation and deduplication.
Performs read-only scanning of target folders and writes atomic metadata into SQLite.
"""

import os
import json
import time
from typing import Dict, Any, List, Optional, Tuple
from dexter_engine.storage.db import DatabaseManager
from dexter_engine.logging.safe_logger import get_safe_logger
from dexter_engine.library.magic_classifier import classify_file
from dexter_engine.library.deduplicator import DeduplicationPipeline
from dexter_engine.library.template_extractor import extract_presentation_metadata
from dexter_engine.tasks.task_manager import TaskManager, TaskState

logger = get_safe_logger("n29_indexer")

class LibraryIndexer:
    def __init__(self, db_manager: DatabaseManager, task_manager: Optional[TaskManager] = None):
        self.db = db_manager
        self.task_manager = task_manager

    def scan_directory(
        self,
        folder_path: str,
        task_id: Optional[str] = None,
        source_label: str = "local_library"
    ) -> Dict[str, Any]:
        """
        Scans a directory tree, classifies files, detects duplicates,
        extracts template metadata, and persists to SQLite.
        Supports cooperative cancellation via task_id.
        """
        real_folder = os.path.abspath(folder_path)
        if not os.path.isdir(real_folder):
            raise ValueError(f"Directory does not exist or is not a folder: {real_folder}")

        # 1. Discover all candidate files (excluding hidden files and following no symlinks)
        candidate_paths: List[str] = []
        for root, dirs, files in os.walk(real_folder, followlinks=False):
            # Exclude hidden directories
            dirs[:] = [d for d in dirs if not d.startswith(".")]
            for f in files:
                if not f.startswith("."):
                    candidate_paths.append(os.path.join(root, f))

        total_files = len(candidate_paths)
        logger.info(f"Discovered {total_files} candidate files in {real_folder}")

        # 2. Load existing SHA-256 hashes from SQLite
        existing_hashes: Dict[str, str] = {}
        with self.db.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("SELECT sha256, path FROM library_files WHERE status = 'valid';")
            for row in cur.fetchall():
                existing_hashes[row[0]] = row[1]

        pipeline = DeduplicationPipeline(existing_hashes)

        # 3. Process files iteratively
        processed_count = 0
        duplicate_count = 0
        corrupt_count = 0
        valid_count = 0
        templates_count = 0
        results: List[Dict[str, Any]] = []

        # Batch buffer for DB writes
        batch_records: List[Tuple] = []
        batch_meta: List[Tuple] = []

        try:
            for idx, file_path in enumerate(candidate_paths, start=1):
                # Check for cancellation request
                if task_id and self.task_manager and self.task_manager.is_cancelled(task_id):
                    logger.warning(f"Indexing cancelled by user at file #{idx}: {file_path}")
                    if self.task_manager:
                        self.task_manager.update_progress(
                            task_id,
                            progress=round(idx / total_files, 3) if total_files > 0 else 0.0,
                            current_step=idx,
                            total_steps=total_files,
                            message=f"Cancelled by user at step {idx}/{total_files}"
                        )
                    return {
                        "status": "cancelled",
                        "folder": real_folder,
                        "processed": processed_count,
                        "duplicates": duplicate_count,
                        "valid": valid_count,
                        "corrupt": corrupt_count,
                        "total_found": total_files
                    }

                # Step A: Magic Classification
                classification = classify_file(file_path)
                file_size = classification["size"]
                file_type = classification["type"]
                file_status = classification["status"]
                file_error = classification["error"]

                # Step B: Hashing & Deduplication (only for non-corrupt files with size > 0)
                sha256 = ""
                is_duplicate = False
                original_path = None

                if file_status == "valid" and file_size > 0:
                    sha256, is_duplicate, original_path = pipeline.process_file_hash(file_path, file_size)
                    if is_duplicate:
                        file_status = "duplicate"
                        duplicate_count += 1
                    else:
                        valid_count += 1
                elif file_status == "corrupt":
                    corrupt_count += 1
                    sha256 = f"corrupt_{idx}_{int(time.time())}"

                # Step C: Template & Metadata Extraction (for PPTX presentations)
                meta_details: Dict[str, Any] = {
                    "subtype": classification.get("subtype"),
                    "duplicate_of": original_path if is_duplicate else None
                }

                if file_type == "presentation" and file_status == "valid":
                    ppt_meta = extract_presentation_metadata(file_path)
                    meta_details.update(ppt_meta)
                    if ppt_meta.get("is_template_candidate"):
                        templates_count += 1

                # Save record to DB buffer
                batch_records.append((
                    file_path,
                    sha256,
                    file_size,
                    file_type,
                    file_status,
                    file_error,
                    source_label,
                    "local"
                ))
                batch_meta.append((file_path, json.dumps(meta_details)))
                processed_count += 1

                # Step D: Flush batch to DB every 50 files or on last file
                if len(batch_records) >= 50 or idx == total_files:
                    self._flush_batch_to_db(batch_records, batch_meta)
                    batch_records.clear()
                    batch_meta.clear()

                # Step E: Update Task Progress
                if task_id and self.task_manager:
                    progress_pct = round(idx / total_files, 3) if total_files > 0 else 1.0
                    self.task_manager.update_progress(
                        task_id,
                        progress=progress_pct,
                        current_step=idx,
                        total_steps=total_files,
                        message=f"Scanning: {os.path.basename(file_path)} ({idx}/{total_files})",
                        checkpoint={
                            "processed": processed_count,
                            "duplicates": duplicate_count,
                            "valid": valid_count,
                            "corrupt": corrupt_count,
                            "templates": templates_count
                        }
                    )

            # Mark task completed
            summary_result = {
                "status": "completed",
                "folder": real_folder,
                "total_found": total_files,
                "processed": processed_count,
                "valid": valid_count,
                "duplicates": duplicate_count,
                "corrupt": corrupt_count,
                "templates": templates_count
            }

            if task_id and self.task_manager:
                self.task_manager.complete_task(task_id, result=summary_result)

            logger.info(f"Indexing completed: {processed_count} files processed ({templates_count} templates, {duplicate_count} duplicates)")
            return summary_result

        except Exception as e:
            logger.error(f"Error during library indexing: {e}")
            if task_id and self.task_manager:
                self.task_manager.fail_task(task_id, error_message=str(e))
            raise

    def _flush_batch_to_db(self, records: List[Tuple], meta_records: List[Tuple]) -> None:
        """Atomically inserts or updates library files and their metadata."""
        with self.db.get_connection() as conn:
            for rec in records:
                path, sha256, size, ftype, status, err, source, lic = rec
                conn.execute("""
                    INSERT INTO library_files (path, sha256, size, type, status, error, source, license, indexed_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                    ON CONFLICT(path) DO UPDATE SET
                        sha256 = excluded.sha256,
                        size = excluded.size,
                        type = excluded.type,
                        status = excluded.status,
                        error = excluded.error,
                        indexed_at = CURRENT_TIMESTAMP;
                """, (path, sha256, size, ftype, status, err, source, lic))

            # Fetch file IDs and insert metadata
            for path, meta_json in meta_records:
                cur = conn.cursor()
                cur.execute("SELECT id FROM library_files WHERE path = ?;", (path,))
                row = cur.fetchone()
                if row:
                    file_id = row[0]
                    conn.execute("""
                        INSERT INTO library_meta (file_id, meta_json)
                        VALUES (?, ?)
                        ON CONFLICT(file_id) DO UPDATE SET meta_json = excluded.meta_json;
                    """, (file_id, meta_json))
            conn.commit()

    def query_files(
        self,
        file_type: Optional[str] = None,
        status: Optional[str] = None,
        search_query: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Queries indexed library files with metadata joined."""
        with self.db.get_connection() as conn:
            cur = conn.cursor()
            query = """
                SELECT f.id, f.path, f.sha256, f.size, f.type, f.status, f.error, f.source, f.license, f.indexed_at, m.meta_json
                FROM library_files f
                LEFT JOIN library_meta m ON f.id = m.file_id
                WHERE 1=1
            """
            params: List[Any] = []

            if file_type and file_type != "all":
                query += " AND f.type = ?"
                params.append(file_type)

            if status and status != "all":
                query += " AND f.status = ?"
                params.append(status)

            if search_query:
                query += " AND (f.path LIKE ? OR f.type LIKE ?)"
                params.extend([f"%{search_query}%", f"%{search_query}%"])

            query += " ORDER BY f.indexed_at DESC LIMIT ?;"
            params.append(limit)

            cur.execute(query, params)
            rows = cur.fetchall()
            output: List[Dict[str, Any]] = []
            for r in rows:
                meta = json.loads(r[10]) if r[10] else {}
                output.append({
                    "id": r[0],
                    "path": r[1],
                    "name": os.path.basename(r[1]),
                    "sha256": r[2],
                    "size": r[3],
                    "type": r[4],
                    "status": r[5],
                    "error": r[6],
                    "source": r[7],
                    "license": r[8],
                    "indexed_at": r[9],
                    "meta": meta
                })
            return output

    def get_duplicates(self) -> List[Dict[str, Any]]:
        """Returns groups of duplicate files sharing the same SHA-256 hash."""
        with self.db.get_connection() as conn:
            cur = conn.cursor()
            cur.execute("""
                SELECT sha256, COUNT(*) as cnt
                FROM library_files
                WHERE status IN ('valid', 'duplicate')
                GROUP BY sha256
                HAVING cnt > 1;
            """)
            dup_hashes = [r[0] for r in cur.fetchall()]

            clusters: List[Dict[str, Any]] = []
            for h in dup_hashes:
                cur.execute("SELECT id, path, size, status, indexed_at FROM library_files WHERE sha256 = ? ORDER BY id ASC;", (h,))
                files = [{"id": r[0], "path": r[1], "name": os.path.basename(r[1]), "size": r[2], "status": r[3], "indexed_at": r[4]} for r in cur.fetchall()]
                clusters.append({
                    "sha256": h,
                    "count": len(files),
                    "canonical": files[0] if files else None,
                    "duplicates": files[1:] if len(files) > 1 else []
                })
            return clusters

    def remove_from_index(self, file_id: int) -> bool:
        """Removes a file record from SQLite index only without touching disk file."""
        with self.db.get_connection() as conn:
            conn.execute("DELETE FROM library_files WHERE id = ?;", (file_id,))
            conn.commit()
            return True
