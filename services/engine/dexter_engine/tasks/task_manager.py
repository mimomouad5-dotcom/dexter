# Component: n16 مدير المهام (Task Manager)
"""
Central Task Manager for asynchronous operations (library indexing, PPTX export, etc.).
Supports cooperative cancellation, progress tracking, checkpoints, and SQLite durability.
"""

import time
import json
import uuid
from typing import Dict, Any, Optional
from dexter_engine.storage.db import DatabaseManager
from dexter_engine.logging.safe_logger import get_safe_logger

logger = get_safe_logger("n16_tasks")

class TaskState:
    PENDING = "pending"
    RUNNING = "running"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    FAILED = "failed"

class TaskManager:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager
        # In-memory fast cache for live task tracking and cancellation tokens
        self._active_tasks: Dict[str, Dict[str, Any]] = {}
        self._cancellation_requests: set = set()

    def create_task(self, task_type: str, details: Optional[Dict[str, Any]] = None) -> str:
        task_id = f"task_{uuid.uuid4().hex[:12]}"
        now = time.time()
        record = {
            "id": task_id,
            "type": task_type,
            "state": TaskState.PENDING,
            "progress": 0.0,
            "current_step": 0,
            "total_steps": 0,
            "message": "Task queued",
            "details": details or {},
            "checkpoint": None,
            "error": None,
            "result": None,
            "created_at": now,
            "updated_at": now
        }
        self._active_tasks[task_id] = record

        # Persist to SQLite
        try:
            with self.db.get_connection() as conn:
                conn.execute("""
                    INSERT INTO tasks (id, type, state, progress, checkpoint_json, error)
                    VALUES (?, ?, ?, ?, ?, ?);
                """, (task_id, task_type, TaskState.PENDING, 0.0, json.dumps(details or {}), None))
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to record task in SQLite: {e}")

        logger.info(f"Task created: {task_id} (type: {task_type})")
        return task_id

    def is_cancelled(self, task_id: str) -> bool:
        return task_id in self._cancellation_requests

    def request_cancellation(self, task_id: str) -> bool:
        if task_id not in self._active_tasks:
            # Check DB
            t = self.get_task(task_id)
            if not t:
                return False
        
        self._cancellation_requests.add(task_id)
        if task_id in self._active_tasks:
            self._active_tasks[task_id]["state"] = TaskState.CANCELLED
            self._active_tasks[task_id]["message"] = "Cancellation requested by user"

        try:
            with self.db.get_connection() as conn:
                conn.execute("UPDATE tasks SET state = ? WHERE id = ?;", (TaskState.CANCELLED, task_id))
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to update task cancellation in DB: {e}")

        logger.info(f"Cancellation requested for task {task_id}")
        return True

    def update_progress(
        self,
        task_id: str,
        progress: float,
        current_step: int = 0,
        total_steps: int = 0,
        message: str = "",
        checkpoint: Optional[Dict[str, Any]] = None
    ) -> None:
        if task_id not in self._active_tasks:
            return

        task = self._active_tasks[task_id]
        task["state"] = TaskState.RUNNING
        task["progress"] = min(1.0, max(0.0, round(progress, 3)))
        task["current_step"] = current_step
        task["total_steps"] = total_steps
        task["message"] = message
        task["updated_at"] = time.time()
        if checkpoint:
            task["checkpoint"] = checkpoint

        # Update in SQLite periodically or when step divides by 10
        if current_step % 10 == 0 or progress >= 1.0:
            try:
                with self.db.get_connection() as conn:
                    conn.execute("""
                        UPDATE tasks
                        SET state = ?, progress = ?, checkpoint_json = ?
                        WHERE id = ?;
                    """, (TaskState.RUNNING, task["progress"], json.dumps(checkpoint) if checkpoint else None, task_id))
                    conn.commit()
            except Exception as e:
                logger.error(f"Failed to persist task progress: {e}")

    def complete_task(self, task_id: str, result: Optional[Dict[str, Any]] = None) -> None:
        if task_id in self._active_tasks:
            task = self._active_tasks[task_id]
            task["state"] = TaskState.COMPLETED
            task["progress"] = 1.0
            task["message"] = "Task completed successfully"
            task["result"] = result
            task["updated_at"] = time.time()

        try:
            with self.db.get_connection() as conn:
                conn.execute("""
                    UPDATE tasks
                    SET state = ?, progress = 1.0
                    WHERE id = ?;
                """, (TaskState.COMPLETED, task_id))
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to complete task in DB: {e}")

        logger.info(f"Task completed: {task_id}")

    def fail_task(self, task_id: str, error_message: str) -> None:
        if task_id in self._active_tasks:
            task = self._active_tasks[task_id]
            task["state"] = TaskState.FAILED
            task["error"] = error_message
            task["message"] = f"Task failed: {error_message}"
            task["updated_at"] = time.time()

        try:
            with self.db.get_connection() as conn:
                conn.execute("""
                    UPDATE tasks
                    SET state = ?, error = ?
                    WHERE id = ?;
                """, (TaskState.FAILED, error_message, task_id))
                conn.commit()
        except Exception as e:
            logger.error(f"Failed to record task failure in DB: {e}")

        logger.error(f"Task failed: {task_id} - {error_message}")

    def get_task(self, task_id: str) -> Optional[Dict[str, Any]]:
        if task_id in self._active_tasks:
            return dict(self._active_tasks[task_id])

        # Check DB
        try:
            with self.db.get_connection() as conn:
                cur = conn.cursor()
                cur.execute("SELECT id, type, state, progress, checkpoint_json, error, created_at FROM tasks WHERE id = ?;", (task_id,))
                row = cur.fetchone()
                if row:
                    return {
                        "id": row[0],
                        "type": row[1],
                        "state": row[2],
                        "progress": row[3],
                        "checkpoint": json.loads(row[4]) if row[4] else None,
                        "error": row[5],
                        "created_at": row[6]
                    }
        except Exception as e:
            logger.error(f"Failed to query task from DB: {e}")
        return None
