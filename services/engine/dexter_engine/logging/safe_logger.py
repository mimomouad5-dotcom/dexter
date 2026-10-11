# Component: n32 السجلات الآمنة (No secrets logged)
"""
Safe Logger with automated secrets redaction.
Ensures no API keys, tokens, or authorization headers are written to logs or disk.
"""

import re
import logging
import sys
from typing import Optional

# Regex patterns for sensitive tokens and keys
SENSITIVE_PATTERNS = [
    # Bearer tokens
    (re.compile(r'(Bearer\s+)[A-Za-z0-9_\-\.]{12,}', re.IGNORECASE), r'\1[REDACTED_TOKEN]'),
    # OpenAI / generic API keys
    (re.compile(r'(sk-[A-Za-z0-9_\-]{16,})', re.IGNORECASE), r'[REDACTED_API_KEY]'),
    # Anthropic API keys
    (re.compile(r'(sk-ant-[A-Za-z0-9_\-]{16,})', re.IGNORECASE), r'[REDACTED_API_KEY]'),
    # Generic password / secret query params or json keys
    (re.compile(r'("(?:api_?key|token|secret|password)"\s*:\s*")([^"]+)(")', re.IGNORECASE), r'\1[REDACTED]\3'),
    # 32-byte hex session tokens
    (re.compile(r'([0-9a-fA-F]{64})'), r'[REDACTED_HEX_TOKEN]'),
]

class RedactionFormatter(logging.Formatter):
    """Logging formatter that intercepts log messages and redacts secrets."""
    def format(self, record: logging.LogRecord) -> str:
        original = super().format(record)
        redacted = original
        for pattern, replacement in SENSITIVE_PATTERNS:
            redacted = pattern.sub(replacement, redacted)
        return redacted

def get_safe_logger(name: str = "dexter", level: int = logging.INFO) -> logging.Logger:
    logger = logging.getLogger(name)
    logger.setLevel(level)

    # Avoid duplicate handlers
    if not logger.handlers:
        handler = logging.StreamHandler(sys.stdout)
        handler.setLevel(level)
        formatter = RedactionFormatter(
            fmt="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        handler.setFormatter(formatter)
        logger.addHandler(handler)
        logger.propagate = False

    return logger

def redact_text(text: str) -> str:
    """Utility function to redact secrets from any arbitrary text."""
    redacted = text
    for pattern, replacement in SENSITIVE_PATTERNS:
        redacted = pattern.sub(replacement, redacted)
    return redacted
