# Tests for Component: n14 Local API Router & n32 السجلات الآمنة
import os
import pytest
from fastapi.testclient import TestClient

# Set test environment session token before importing app
TEST_TOKEN = "a1b2c3d4e5f67890123456789012345678901234567890123456789012345678"
os.environ["DEXTER_SESSION_TOKEN"] = TEST_TOKEN

from dexter_engine.logging.safe_logger import redact_text, get_safe_logger
from dexter_engine.api.router import app

client = TestClient(app)

def test_safe_logger_redaction():
    """Verifies that n32 intercepts and redacts sensitive secrets."""
    # 1. Bearer token
    raw_bearer = f"Authorization: Bearer {TEST_TOKEN}"
    redacted = redact_text(raw_bearer)
    assert TEST_TOKEN not in redacted
    assert "[REDACTED" in redacted

    # 2. OpenAI / Provider API keys
    raw_key = "Connecting with API Key: sk-proj-1234567890abcdefghijklmn"
    redacted_key = redact_text(raw_key)
    assert "sk-proj-1234567890" not in redacted_key
    assert "[REDACTED_API_KEY]" in redacted_key

    # 3. JSON secret fields
    raw_json = '{"api_key": "secret_value_12345"}'
    redacted_json = redact_text(raw_json)
    assert "secret_value_12345" not in redacted_json
    assert '[REDACTED]' in redacted_json

def test_health_without_token():
    """Unauthenticated calls must be rejected with 401 Unauthorized."""
    response = client.get("/health")
    assert response.status_code == 401
    assert "detail" in response.json()

def test_health_with_invalid_token():
    """Calls with wrong token must be rejected with 401 Unauthorized."""
    response = client.get("/health", headers={"Authorization": "Bearer wrong-token-123"})
    assert response.status_code == 401

def test_health_with_valid_token():
    """Calls with the active session token must succeed with 200."""
    response = client.get("/health", headers={"Authorization": f"Bearer {TEST_TOKEN}"})
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "dexter-engine"
    assert data["version"] == "0.1.0"
    assert "pid" in data

def test_system_info_endpoint():
    """Verifies system info endpoint returns diagnostic parameters."""
    response = client.get("/system/info", headers={"Authorization": f"Bearer {TEST_TOKEN}"})
    assert response.status_code == 200
    data = response.json()
    assert "python_version" in data
    assert data["security_isolation"] == "localhost_only"
