// Component: n10 IPC Gateway & n11 إدارة خدمة Python
import { spawn, ChildProcess } from 'child_process';
import crypto from 'crypto';
import net from 'net';
import path from 'path';

function getAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, '127.0.0.1', () => {
      const address = srv.address();
      if (address && typeof address !== 'string') {
        const port = address.port;
        srv.close(() => resolve(port));
      } else {
        srv.close(() => reject(new Error('Failed to obtain port')));
      }
    });
    srv.on('error', reject);
  });
}

async function waitForServerReady(port: number, maxAttempts = 30): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const resp = await fetch(`http://127.0.0.1:${port}/health`, { method: 'GET' });
      // 401 or 200 means server is up and listening
      if (resp.status === 401 || resp.status === 200) {
        return true;
      }
    } catch {
      // not yet ready
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  return false;
}

async function runPoC06() {
  console.log('=== [PoC-06] Electron/Node to Python FastAPI IPC Lifecycle Test ===');

  const sessionToken = crypto.randomBytes(32).toString('hex');
  const port = await getAvailablePort();
  console.log(`Generated 32-byte session token: ${sessionToken.substring(0, 8)}... (redacted)`);
  console.log(`Binding ephemeral local port: 127.0.0.1:${port}`);

  const serverScript = path.resolve(process.cwd(), 'poc/06-ipc-python/server.py');
  const pythonProc = spawn('python3', [serverScript], {
    env: {
      ...process.env,
      DEXTER_SESSION_TOKEN: sessionToken,
      DEXTER_PORT: String(port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  pythonProc.stderr?.on('data', (d) => {
    const msg = d.toString();
    if (msg.includes('ERROR') || msg.includes('FATAL')) {
      console.error('Python Stderr:', msg);
    }
  });

  const isReady = await waitForServerReady(port);
  if (!isReady) {
    console.error('FAIL: Python FastAPI service did not become ready in time!');
    pythonProc.kill('SIGKILL');
    process.exit(1);
  }
  console.log('PASS: Python FastAPI service started and listening on 127.0.0.1.');

  // Test 1: Request with valid token
  console.log('\n--- Test 1: Authenticated request with Bearer token ---');
  const authResp = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: {
      Authorization: `Bearer ${sessionToken}`,
    },
  });
  if (authResp.status !== 200) {
    console.error(`FAIL: Expected 200, got ${authResp.status}`);
    pythonProc.kill('SIGKILL');
    process.exit(1);
  }
  const healthData = await authResp.json();
  console.log('Response Payload:', healthData);
  console.log(`PASS: Valid token authorized. Service health: ${healthData.status}, PID: ${healthData.pid}`);

  // Test 2: Request without token (Must be rejected with 401)
  console.log('\n--- Test 2: Unauthenticated request without token ---');
  const noAuthResp = await fetch(`http://127.0.0.1:${port}/health`);
  if (noAuthResp.status !== 401 && noAuthResp.status !== 403) {
    console.error(`FAIL: Security breach! Unauthenticated request returned HTTP ${noAuthResp.status}`);
    pythonProc.kill('SIGKILL');
    process.exit(1);
  }
  console.log(`PASS: Unauthenticated request rejected with HTTP ${noAuthResp.status} as required.`);

  // Test 3: Request with fraudulent token
  console.log('\n--- Test 3: Unauthorized request with invalid token ---');
  const badAuthResp = await fetch(`http://127.0.0.1:${port}/health`, {
    headers: {
      Authorization: 'Bearer fraudulent-wrong-token-12345',
    },
  });
  if (badAuthResp.status !== 401) {
    console.error(`FAIL: Bad token was not rejected with 401! Got ${badAuthResp.status}`);
    pythonProc.kill('SIGKILL');
    process.exit(1);
  }
  console.log('PASS: Fake/invalid token rejected with HTTP 401.');

  // Test 4: Graceful shutdown
  console.log('\n--- Test 4: Graceful shutdown of Python subprocess ---');
  pythonProc.kill('SIGTERM');

  await new Promise<void>((resolve) => {
    pythonProc.on('exit', (code, signal) => {
      console.log(`PASS: Python process terminated cleanly (signal=${signal}, code=${code}).`);
      resolve();
    });
  });

  console.log('=== [PoC-06] RESULT: SUCCESS (Process lifecycle & token auth verified) ===\n');
}

runPoC06();
