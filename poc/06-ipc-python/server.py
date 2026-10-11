#!/usr/bin/env python3
# Component: n14 Local API Router (FastAPI + Auth Token) & n11 إدارة خدمة Python
import os
import sys
import uvicorn
from fastapi import FastAPI, Depends, HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

app = FastAPI(title="Dexter Local Engine PoC", version="0.1.0")
security = HTTPBearer()

EXPECTED_TOKEN = os.environ.get("DEXTER_SESSION_TOKEN")
if not EXPECTED_TOKEN:
    sys.stderr.write("FATAL: DEXTER_SESSION_TOKEN environment variable not set!\n")
    sys.exit(1)

def verify_token(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.scheme != "Bearer" or credentials.credentials != EXPECTED_TOKEN:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing session bearer token"
        )
    return credentials.credentials

@app.get("/health")
def get_health(token: str = Depends(verify_token)):
    return {
        "status": "healthy",
        "service": "dexter-engine",
        "version": "0.1.0",
        "pid": os.getpid(),
        "arch": sys.platform
    }

if __name__ == "__main__":
    port = int(os.environ.get("DEXTER_PORT", 8765))
    uvicorn.run(app, host="127.0.0.1", port=port, log_level="warning")
