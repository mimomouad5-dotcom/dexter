#!/usr/bin/env python3
# Component: n29 مستورد وفهرسة المكتبة (Classify, Dedupe) & n40 SQLite & n42 مجلد المكتبة
"""
PoC-05: Library Importer & Classifier:
1. Scans directory tree in READ-ONLY mode.
2. Identifies file types using magic bytes signature (PPTX, Images, PDF, Markdown/Text, Unsupported).
3. Detects duplicate files using SHA-256 hash.
4. Safely flags corrupt/truncated files without failing the process.
5. Verifies transactional rollback on simulated mid-operation cancellation.
"""

import os
import sqlite3
import hashlib
import zipfile
import shutil
from typing import Dict, Any, List, Optional

def get_file_magic_type(filepath: str) -> str:
    """Classifies file by magic bytes rather than file extension alone."""
    try:
        with open(filepath, 'rb') as f:
            header = f.read(32)
            if len(header) < 4:
                return "unsupported"
            
            # PNG: \x89PNG\r\n\x1a\n
            if header.startswith(b'\x89PNG\r\n\x1a\n'):
                return "image/png"
            # JPEG: \xff\xd8\xff
            if header.startswith(b'\xff\xd8\xff'):
                return "image/jpeg"
            # PDF: %PDF
            if header.startswith(b'%PDF'):
                return "application/pdf"
            # ZIP-based (PPTX, POTX, etc.): PK\x03\x04
            if header.startswith(b'PK\x03\x04'):
                try:
                    with zipfile.ZipFile(filepath, 'r') as zf:
                        namelist = zf.namelist()
                        if any('ppt/presentation.xml' in name for name in namelist):
                            return "presentation/pptx"
                        return "application/zip"
                except Exception:
                    return "corrupt/zip"

            # Plain text / Markdown test
            try:
                header.decode('utf-8')
                return "text/plain"
            except UnicodeDecodeError:
                return "unsupported"
    except Exception:
        return "error_reading"

def calculate_sha256(filepath: str) -> str:
    h = hashlib.sha256()
    with open(filepath, 'rb') as f:
        while chunk := f.read(65536):
            h.update(chunk)
    return h.hexdigest()

class LibraryIndexer:
    def __init__(self, db_path: str):
        self.db_path = db_path
        self._init_db()

    def _init_db(self):
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS library_files (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                file_path TEXT UNIQUE,
                file_name TEXT,
                file_size INTEGER,
                mime_type TEXT,
                sha256 TEXT,
                is_duplicate INTEGER DEFAULT 0,
                status TEXT, -- 'indexed', 'corrupt', 'unsupported'
                error_msg TEXT
            )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_sha256 ON library_files(sha256)")

    def index_folder(self, folder_path: str, cancel_after_n_files: Optional[int] = None) -> Dict[str, Any]:
        stats = {
            "total_files": 0,
            "indexed": 0,
            "duplicates": 0,
            "corrupt": 0,
            "unsupported": 0,
            "cancelled": False
        }

        # Collect files
        all_files = []
        for root, _, files in os.walk(folder_path):
            for file in sorted(files):
                all_files.append(os.path.join(root, file))

        conn = sqlite3.connect(self.db_path)
        try:
            conn.execute("BEGIN TRANSACTION")
            cursor = conn.cursor()

            processed_count = 0
            for filepath in all_files:
                if cancel_after_n_files is not None and processed_count >= cancel_after_n_files:
                    print(f"[CANCELLATION] Operation aborted at checkpoint (file #{processed_count}). Rolling back transaction...")
                    conn.rollback()
                    stats["cancelled"] = True
                    return stats

                stats["total_files"] += 1
                file_size = os.path.getsize(filepath)
                file_name = os.path.basename(filepath)
                mime = get_file_magic_type(filepath)

                if mime == "corrupt/zip":
                    stats["corrupt"] += 1
                    cursor.execute("""
                        INSERT OR REPLACE INTO library_files 
                        (file_path, file_name, file_size, mime_type, sha256, is_duplicate, status, error_msg)
                        VALUES (?, ?, ?, ?, ?, 0, 'corrupt', 'Corrupted or truncated ZIP/PPTX package')
                    """, (filepath, file_name, file_size, mime, None))
                elif mime == "unsupported":
                    stats["unsupported"] += 1
                    cursor.execute("""
                        INSERT OR REPLACE INTO library_files 
                        (file_path, file_name, file_size, mime_type, sha256, is_duplicate, status, error_msg)
                        VALUES (?, ?, ?, ?, ?, 0, 'unsupported', 'File signature not supported')
                    """, (filepath, file_name, file_size, mime, None))
                else:
                    sha = calculate_sha256(filepath)
                    # Check duplicate
                    cursor.execute("SELECT id FROM library_files WHERE sha256 = ?", (sha,))
                    existing = cursor.fetchone()
                    is_dup = 1 if existing else 0
                    if is_dup:
                        stats["duplicates"] += 1
                    else:
                        stats["indexed"] += 1

                    cursor.execute("""
                        INSERT OR REPLACE INTO library_files 
                        (file_path, file_name, file_size, mime_type, sha256, is_duplicate, status, error_msg)
                        VALUES (?, ?, ?, ?, ?, ?, 'indexed', NULL)
                    """, (filepath, file_name, file_size, mime, sha, is_dup))

                processed_count += 1

            conn.commit()
            print("[COMMIT] Batch transaction committed successfully.")
        except Exception as e:
            conn.rollback()
            raise e
        finally:
            conn.close()

        return stats

def setup_test_library(test_dir: str):
    """Sets up a test directory with diverse file types: valid pptx, corrupt pptx, duplicate, png, txt."""
    if os.path.exists(test_dir):
        shutil.rmtree(test_dir)
    os.makedirs(test_dir, exist_ok=True)

    # 1. Valid mini text file
    with open(os.path.join(test_dir, "notes.txt"), "w", encoding="utf-8") as f:
        f.write("ملاحظات المحاضرة التقديمية")

    # 2. Valid mini PNG
    with open(os.path.join(test_dir, "icon.png"), "wb") as f:
        # Minimal 1x1 valid PNG bytes
        f.write(b'\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x06\x00\x00\x00\x1f\x15c4\x00\x00\x00\nIDATx\x9cc\x00\x01\x00\x00\x05\x00\x01\r\n-\xb4\x00\x00\x00\x00IEND\xaeB`\x82')

    # 3. Duplicate of the text file with a different name
    with open(os.path.join(test_dir, "notes_copy.txt"), "w", encoding="utf-8") as f:
        f.write("ملاحظات المحاضرة التقديمية")

    # 4. Corrupted PPTX (Starts with PK header but truncated/broken)
    with open(os.path.join(test_dir, "corrupt_presentation.pptx"), "wb") as f:
        f.write(b'PK\x03\x04\x14\x00\x00\x00GarbageTruncatedBytes')

    # 5. Unsupported binary
    with open(os.path.join(test_dir, "unknown_binary.bin"), "wb") as f:
        f.write(b'\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\xff\xfe')

def run_poc_indexer():
    print("=== [PoC-05] Library Importer & Deduplication Test ===")
    base_dir = os.path.dirname(os.path.abspath(__file__))
    test_library_dir = os.path.join(base_dir, "test_library_data")
    db_file = os.path.join(base_dir, "test_dexter_library.db")

    if os.path.exists(db_file):
        os.remove(db_file)

    setup_test_library(test_library_dir)
    print(f"Created test library files in: {test_library_dir}")

    # Test A: Cancellation and rollback
    print("\n--- Test A: Transaction rollback on cancellation ---")
    indexer = LibraryIndexer(db_file)
    cancel_stats = indexer.index_folder(test_library_dir, cancel_after_n_files=2)
    assert cancel_stats["cancelled"] is True, "Expected cancellation flag to be true"

    # Verify database was NOT partially written (0 rows due to rollback)
    with sqlite3.connect(db_file) as conn:
        count = conn.execute("SELECT COUNT(*) FROM library_files").fetchone()[0]
        assert count == 0, f"Expected 0 rows after rollback, found {count}!"
        print(f"PASS: Rollback confirmed. Database contains exactly {count} rows after abort.")

    # Test B: Full indexing with Dedupe and Corrupt file handling
    print("\n--- Test B: Full Indexing & Deduplication ---")
    full_stats = indexer.index_folder(test_library_dir)
    print("Indexing Results Summary:")
    print(f"  Total files evaluated: {full_stats['total_files']}")
    print(f"  Successfully indexed unique files: {full_stats['indexed']}")
    print(f"  Duplicates detected (SHA-256): {full_stats['duplicates']}")
    print(f"  Corrupt files safely quarantined: {full_stats['corrupt']}")
    print(f"  Unsupported files identified: {full_stats['unsupported']}")

    assert full_stats["duplicates"] >= 1, "Duplicate file was not detected by SHA-256!"
    assert full_stats["corrupt"] == 1, "Corrupt file was not detected!"
    assert full_stats["unsupported"] == 1, "Unsupported binary file was not detected!"

    with sqlite3.connect(db_file) as conn:
        rows = conn.execute("SELECT file_name, mime_type, is_duplicate, status FROM library_files").fetchall()
        print("\nStored Database Records:")
        for r in rows:
            print(f"  - {r[0]}: type={r[1]}, duplicate={r[2]}, status={r[3]}")

    print("\n=== [PoC-05] RESULT: SUCCESS (Classification, Dedupe, and Rollback verified) ===\n")

if __name__ == "__main__":
    run_poc_indexer()
