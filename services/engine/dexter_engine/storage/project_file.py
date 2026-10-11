# Component: n41 ملفات المشاريع (JSON)
"""
Project File Manager for Dexter Presentation Studio.
Handles project bundles: <name>.dexter/project.json and assets/ directory.
Implements atomic writes and automatic .bak generation for zero-loss guarantees.
"""

import os
import json
import shutil
from typing import Dict, Any, Optional

class ProjectFileManager:
    @staticmethod
    def initialize_project_bundle(bundle_dir: str, title: str, initial_model: Optional[Dict[str, Any]] = None) -> str:
        """Creates the .dexter bundle directory structure and initial project.json."""
        os.makedirs(bundle_dir, exist_ok=True)
        assets_dir = os.path.join(bundle_dir, "assets")
        os.makedirs(assets_dir, exist_ok=True)

        data = initial_model or {
            "schema_version": "1.0.0",
            "presentation": {
                "title": title,
                "language": "ar",
                "direction": "rtl",
                "aspect_ratio": "16:9",
                "slides": []
            }
        }

        project_json_path = os.path.join(bundle_dir, "project.json")
        ProjectFileManager.save_project_json(project_json_path, data)
        return project_json_path

    @staticmethod
    def save_project_json(file_path: str, data: Dict[str, Any]) -> None:
        """
        Atomically saves project JSON:
        1. Backs up existing file to .bak
        2. Writes new content to .tmp
        3. Atomically replaces file_path with .tmp
        """
        target_dir = os.path.dirname(os.path.abspath(file_path))
        os.makedirs(target_dir, exist_ok=True)

        # 1. Backup if already exists
        bak_path = f"{file_path}.bak"
        if os.path.exists(file_path):
            shutil.copy2(file_path, bak_path)

        # 2. Write to temp file
        tmp_path = f"{file_path}.tmp"
        with open(tmp_path, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)

        # 3. Atomic replace
        os.replace(tmp_path, file_path)

    @staticmethod
    def load_project_json(file_path: str) -> Dict[str, Any]:
        """Loads and parses project JSON with fallback to .bak on corrupted reads."""
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"Project file not found: {file_path}")

        try:
            with open(file_path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception as e:
            bak_path = f"{file_path}.bak"
            if os.path.exists(bak_path):
                with open(bak_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            raise e
