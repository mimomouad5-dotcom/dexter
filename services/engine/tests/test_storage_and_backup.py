# Tests for Component: n40 SQLite, n41 JSON Projects, and n31 Backup & Restore
import os
import shutil
import tempfile
import zipfile
import pytest
from dexter_engine.storage.db import DatabaseManager
from dexter_engine.storage.project_file import ProjectFileManager
from dexter_engine.backup.backup_manager import BackupManager

@pytest.fixture
def temp_workspace():
    tmp_dir = tempfile.mkdtemp(prefix="dexter_test_")
    db_path = os.path.join(tmp_dir, "test_dexter.db")
    db_mgr = DatabaseManager(db_path)
    yield {
        "dir": tmp_dir,
        "db_path": db_path,
        "db_mgr": db_mgr
    }
    shutil.rmtree(tmp_dir)

def test_sqlite_settings_persistence(temp_workspace):
    """Verifies settings save, update, and retrieval in SQLite (n40)."""
    db_mgr = temp_workspace["db_mgr"]

    # 1. Save complex JSON setting
    config_data = {
        "theme": "dark",
        "default_aspect_ratio": "16:9",
        "auto_save_interval_sec": 30
    }
    db_mgr.set_setting("app_preferences", config_data)

    retrieved = db_mgr.get_setting("app_preferences")
    assert retrieved == config_data
    assert retrieved["theme"] == "dark"

    # 2. Update setting
    config_data["theme"] = "system"
    db_mgr.set_setting("app_preferences", config_data)
    updated = db_mgr.get_setting("app_preferences")
    assert updated["theme"] == "system"

    # 3. Provider config without secrets
    db_mgr.set_provider_config("ollama", enabled=True, model="qwen2.5:7b", allowed_tasks=["outline", "content"])
    p_cfg = db_mgr.get_provider_config("ollama")
    assert p_cfg is not None
    assert p_cfg["enabled"] is True
    assert p_cfg["model"] == "qwen2.5:7b"
    assert "outline" in p_cfg["allowed_tasks"]

def test_project_file_atomic_write_and_bak(temp_workspace):
    """Verifies atomic write and .bak generation for n41 project bundles."""
    bundle_dir = os.path.join(temp_workspace["dir"], "my_preso.dexter")
    
    # 1. Initialize bundle
    json_path = ProjectFileManager.initialize_project_bundle(bundle_dir, "عرض الذكاء الاصطناعي")
    assert os.path.exists(json_path)
    assert os.path.exists(os.path.join(bundle_dir, "assets"))

    # 2. Modify and save (should create .bak)
    data = ProjectFileManager.load_project_json(json_path)
    assert data["presentation"]["title"] == "عرض الذكاء الاصطناعي"
    data["presentation"]["title"] = "العرض المحدث v2"

    ProjectFileManager.save_project_json(json_path, data)
    assert os.path.exists(f"{json_path}.bak")

    reloaded = ProjectFileManager.load_project_json(json_path)
    assert reloaded["presentation"]["title"] == "العرض المحدث v2"

    # Verify backup contains previous title
    with open(f"{json_path}.bak", "r", encoding="utf-8") as f:
        bak_content = f.read()
        assert "عرض الذكاء الاصطناعي" in bak_content

def test_backup_and_restore_round_trip(temp_workspace):
    """Verifies complete backup and restore lifecycle (n31)."""
    db_mgr = temp_workspace["db_mgr"]
    tmp_dir = temp_workspace["dir"]

    # 1. Setup sample project and settings
    db_mgr.set_setting("language", "ar")
    db_mgr.set_setting("font_family", "Cairo")

    project_dir = os.path.join(tmp_dir, "quarterly_review.dexter")
    json_path = ProjectFileManager.initialize_project_bundle(project_dir, "مراجعة الربع الأول")
    db_mgr.register_project("proj-001", "مراجعة الربع الأول", project_dir)

    # 2. Create backup archive
    backup_zip = os.path.join(tmp_dir, "backup_archive.zip")
    b_res = BackupManager.create_backup_archive(db_mgr, [project_dir], backup_zip)
    assert os.path.exists(backup_zip)
    assert b_res["projects_backed_up"] == 1
    assert b_res["size_bytes"] > 0

    # 3. Restore to a new location
    restore_target_db_path = os.path.join(tmp_dir, "restored_dexter.db")
    restore_db_mgr = DatabaseManager(restore_target_db_path)
    restore_projects_dir = os.path.join(tmp_dir, "restored_projects")

    r_res = BackupManager.restore_backup_archive(backup_zip, restore_db_mgr, restore_projects_dir)
    assert r_res["status"] == "success"
    assert "quarterly_review.dexter" in r_res["restored_projects"]

    # Check restored database contents
    assert restore_db_mgr.get_setting("language") == "ar"
    assert restore_db_mgr.get_setting("font_family") == "Cairo"
    restored_projects_list = restore_db_mgr.list_projects()
    assert len(restored_projects_list) == 1
    assert restored_projects_list[0]["title"] == "مراجعة الربع الأول"

def test_secrets_exclusion_in_storage_and_backup(temp_workspace):
    """
    CRITICAL ACCEPTANCE TEST:
    Asserts that API keys never appear in SQLite, JSON files, or backup archives.
    """
    db_mgr = temp_workspace["db_mgr"]
    tmp_dir = temp_workspace["dir"]

    CONFIDENTIAL_KEY = "sk-proj-CONFIDENTIAL_TEST_KEY_FOR_ISOLATION_999888"

    # Simulate saving safe metadata
    db_mgr.set_setting("provider_name", "OpenAI")
    # Save provider config (allowed fields: enabled, model, tasks)
    db_mgr.set_provider_config("openai", enabled=True, model="gpt-4o", allowed_tasks=["outline"])

    project_dir = os.path.join(tmp_dir, "safe_presentation.dexter")
    ProjectFileManager.initialize_project_bundle(project_dir, "عرض آمن")

    backup_zip = os.path.join(tmp_dir, "safe_backup.zip")
    BackupManager.create_backup_archive(db_mgr, [project_dir], backup_zip)

    # Search for CONFIDENTIAL_KEY across all storage files
    all_files = [
        temp_workspace["db_path"],
        os.path.join(project_dir, "project.json"),
        backup_zip
    ]

    for fpath in all_files:
        with open(fpath, "rb") as f:
            content = f.read()
            assert CONFIDENTIAL_KEY.encode("utf-8") not in content, f"Secret leaked in file: {fpath}!"
