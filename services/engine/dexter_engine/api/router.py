# Component: n14 Local API Router (FastAPI + Auth Token)
"""
Local API Router for Dexter Engine.
Listens exclusively on 127.0.0.1 and enforces cryptographic Bearer Session Token authentication.
"""

import os
import sys
import time
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, Depends, HTTPException, Security, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse

from dexter_engine.logging.safe_logger import get_safe_logger, redact_text

logger = get_safe_logger("n14_router")

START_TIME = time.time()
EXPECTED_TOKEN = os.environ.get("DEXTER_SESSION_TOKEN", "")

app = FastAPI(
    title="Dexter Presentation Studio — Local Engine",
    description="Component n14 Local API Router on 127.0.0.1",
    version="0.1.0"
)

security = HTTPBearer(auto_error=False)

def verify_session_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    """Verifies that the caller provided the active session token."""
    if not EXPECTED_TOKEN:
        logger.error("DEXTER_SESSION_TOKEN environment variable not set on engine startup!")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Engine token unconfigured"
        )

    if not credentials or credentials.scheme.lower() != "bearer":
        logger.warning("Unauthenticated request blocked (Missing Bearer header)")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or malformed Authorization header"
        )

    if credentials.credentials != EXPECTED_TOKEN:
        logger.warning(f"Unauthorized request blocked with invalid token: {credentials.credentials[:6]}...")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token"
        )

    return credentials.credentials

@app.middleware("http")
async def safe_logging_middleware(request: Request, call_next):
    client_ip = request.client.host if request.client else "unknown"
    # Reject non-localhost bindings
    if client_ip not in ("127.0.0.1", "localhost", "::1", "testclient"):
        logger.error(f"Remote connection attempt rejected from {client_ip}")
        return JSONResponse(status_code=403, content={"detail": "Access restricted to localhost only"})

    start = time.time()
    response = await call_next(request)
    duration_ms = round((time.time() - start) * 1000, 2)
    logger.info(f"{request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
    return response

@app.get("/health")
def get_health(token: str = Depends(verify_session_token)) -> Dict[str, Any]:
    """Health status check called by n11 Service Manager."""
    return {
        "status": "healthy",
        "service": "dexter-engine",
        "version": "0.1.0",
        "pid": os.getpid(),
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "engine_architecture": sys.platform
    }

@app.get("/system/info")
def get_system_info(token: str = Depends(verify_session_token)) -> Dict[str, Any]:
    """Returns runtime system specifications and diagnostic parameters."""
    return {
        "python_version": sys.version,
        "platform": sys.platform,
        "cwd": os.getcwd(),
        "security_isolation": "localhost_only",
        "phase": "Phase 2: Storage & Settings"
    }

# --- Phase 2 Endpoints: Storage, Settings & Backup ---
from pydantic import BaseModel
from dexter_engine.storage.db import DatabaseManager
from dexter_engine.storage.project_file import ProjectFileManager
from dexter_engine.backup.backup_manager import BackupManager

DEFAULT_DB_PATH = os.environ.get("DEXTER_DB_PATH", os.path.expanduser("~/.dexter/dexter.db"))
db_manager = DatabaseManager(DEFAULT_DB_PATH)

class SettingPayload(BaseModel):
    key: str
    value: Any

class ProjectCreatePayload(BaseModel):
    id: str
    title: str
    bundle_path: str
    schema_version: str = "1.0.0"

class BackupRequest(BaseModel):
    project_paths: List[str]
    output_zip_path: str

class RestoreRequest(BaseModel):
    zip_archive_path: str
    target_projects_dir: str

@app.get("/settings")
def get_all_settings(token: str = Depends(verify_session_token)):
    return db_manager.get_all_settings()

@app.get("/settings/{key}")
def get_setting(key: str, token: str = Depends(verify_session_token)):
    val = db_manager.get_setting(key)
    if val is None:
        raise HTTPException(status_code=404, detail=f"Setting '{key}' not found")
    return {"key": key, "value": val}

@app.post("/settings")
def set_setting(payload: SettingPayload, token: str = Depends(verify_session_token)):
    db_manager.set_setting(payload.key, payload.value)
    return {"status": "saved", "key": payload.key}

@app.get("/projects")
def list_projects(token: str = Depends(verify_session_token)):
    return db_manager.list_projects()

@app.post("/projects")
def create_project(payload: ProjectCreatePayload, token: str = Depends(verify_session_token)):
    # Initialize bundle on disk
    json_path = ProjectFileManager.initialize_project_bundle(payload.bundle_path, payload.title)
    db_manager.register_project(payload.id, payload.title, payload.bundle_path, payload.schema_version)
    return {"status": "created", "project_id": payload.id, "project_json": json_path}

@app.post("/backup")
def create_backup(payload: BackupRequest, token: str = Depends(verify_session_token)):
    result = BackupManager.create_backup_archive(db_manager, payload.project_paths, payload.output_zip_path)
    return result

@app.post("/restore")
def restore_backup(payload: RestoreRequest, token: str = Depends(verify_session_token)):
    result = BackupManager.restore_backup_archive(payload.zip_archive_path, db_manager, payload.target_projects_dir)
    return result

# --- Phase 5 Endpoint: PowerPoint Export (n27, n28, n46) ---
from dexter_engine.model.presentation import UnifiedPresentationModel
from dexter_engine.export.pptx_writer import PPTXWriter

class ExportPPTXRequest(BaseModel):
    model: UnifiedPresentationModel
    output_path: str

@app.post("/export/pptx")
def export_pptx(payload: ExportPPTXRequest, token: str = Depends(verify_session_token)):
    res = PPTXWriter.export_presentation(payload.model, payload.output_path)
    verify_res = PPTXWriter.verify_round_trip(payload.output_path)
    return {
        **res,
        "round_trip_verification": verify_res
    }

# --- Phase 6 Endpoints: Library & Templates (n29, n42, n6, n16) ---
from fastapi import BackgroundTasks
from dexter_engine.tasks.task_manager import TaskManager
from dexter_engine.library.indexer import LibraryIndexer

task_manager = TaskManager(db_manager)
indexer = LibraryIndexer(db_manager, task_manager)

class ScanRequest(BaseModel):
    folder_path: str
    source_label: str = "local_library"

@app.post("/library/scan")
def start_library_scan(
    payload: ScanRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_session_token)
):
    """Starts asynchronous library indexing task with cooperative cancellation."""
    if not os.path.exists(payload.folder_path):
        raise HTTPException(status_code=400, detail=f"Target path does not exist: {payload.folder_path}")

    task_id = task_manager.create_task("library_scan", {"folder_path": payload.folder_path})

    def run_indexer():
        try:
            indexer.scan_directory(payload.folder_path, task_id=task_id, source_label=payload.source_label)
        except Exception as e:
            logger.error(f"Background indexing task failed: {e}")

    background_tasks.add_task(run_indexer)
    return {
        "status": "started",
        "task_id": task_id,
        "folder_path": payload.folder_path
    }

@app.get("/tasks/{task_id}")
def get_task_status(task_id: str, token: str = Depends(verify_session_token)):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found")
    return task

@app.post("/tasks/{task_id}/cancel")
def cancel_task(task_id: str, token: str = Depends(verify_session_token)):
    success = task_manager.request_cancellation(task_id)
    if not success:
        raise HTTPException(status_code=404, detail=f"Task {task_id} not found or cannot be cancelled")
    return {"status": "cancelling", "task_id": task_id}

@app.get("/library/files")
def query_library_files(
    type: Optional[str] = "all",
    status: Optional[str] = "all",
    q: Optional[str] = None,
    limit: int = 100,
    token: str = Depends(verify_session_token)
):
    return indexer.query_files(file_type=type, status=status, search_query=q, limit=limit)

@app.get("/library/duplicates")
def get_duplicate_files(token: str = Depends(verify_session_token)):
    return indexer.get_duplicates()

@app.delete("/library/files/{file_id}")
def remove_library_file(file_id: int, token: str = Depends(verify_session_token)):
    success = indexer.remove_from_index(file_id)
    return {"status": "removed", "file_id": file_id, "success": success}

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("DEXTER_PORT", 8765))
    logger.info(f"Starting n14 Local API Router on 127.0.0.1:{port}...")
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")
