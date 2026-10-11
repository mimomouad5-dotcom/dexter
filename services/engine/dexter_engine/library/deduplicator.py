# Component: n29 مستورد وفهرسة المكتبة (3-Stage Deduplication Engine)
"""
High-performance 3-Stage File Deduplication:
Stage 1: Size grouping (files of unique size cannot be duplicates).
Stage 2: Quick Hash (First 4KB + Last 4KB) for size collisions.
Stage 3: Full SHA-256 streaming (64KB chunks) for quick-hash collisions.
"""

import os
import hashlib
from typing import Dict, List, Tuple, Set, Optional

CHUNK_SIZE = 65536  # 64 KB
SAMPLE_SIZE = 4096  # 4 KB

def calculate_full_sha256(file_path: str) -> str:
    """Computes full SHA-256 hash using chunked streaming."""
    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        while chunk := f.read(CHUNK_SIZE):
            hasher.update(chunk)
    return hasher.hexdigest()

def calculate_quick_sample_hash(file_path: str, size: int) -> str:
    """
    Computes a fast fingerprint of the first 4KB and last 4KB of the file.
    If file size <= 8KB, computes full hash directly.
    """
    if size <= (SAMPLE_SIZE * 2):
        return calculate_full_sha256(file_path)

    hasher = hashlib.sha256()
    with open(file_path, "rb") as f:
        # Read head
        hasher.update(f.read(SAMPLE_SIZE))
        # Read tail
        f.seek(-SAMPLE_SIZE, os.SEEK_END)
        hasher.update(f.read(SAMPLE_SIZE))
    return hasher.hexdigest()

class DeduplicationPipeline:
    """
    Coordinates multi-file deduplication in batches.
    Maintains index of known hashes to identify duplicates in constant time.
    """

    def __init__(self, existing_hashes: Optional[Dict[str, str]] = None):
        """
        existing_hashes: map of sha256 -> canonical_file_path from DB
        """
        self.existing_hashes: Dict[str, str] = existing_hashes or {}

    def process_file_hash(self, file_path: str, size: int) -> Tuple[str, bool, Optional[str]]:
        """
        Returns:
            (sha256_hash, is_duplicate, original_path_if_duplicate)
        """
        sha = calculate_full_sha256(file_path)
        if sha in self.existing_hashes:
            original = self.existing_hashes[sha]
            if original == file_path:
                return sha, False, None
            return sha, True, original
        else:
            self.existing_hashes[sha] = file_path
            return sha, False, None
