// Component: n11 إدارة خدمة Python (Start/Stop Python)
import { spawn, ChildProcess } from 'child_process';
import crypto from 'crypto';
import net from 'net';
import path from 'path';

export interface PythonServiceStatus {
  running: boolean;
  port: number | null;
  pid: number | null;
  health: 'stopped' | 'starting' | 'healthy' | 'unhealthy' | 'error';
  restartCount: number;
  lastError?: string;
}

export class PythonServiceManager {
  private proc: ChildProcess | null = null;
  private token: string | null = null;
  private port: number | null = null;
  private status: PythonServiceStatus = {
    running: false,
    port: null,
    pid: null,
    health: 'stopped',
    restartCount: 0,
  };

  public getToken(): string | null {
    return this.token;
  }

  public getPort(): number | null {
    return this.port;
  }

  public getStatus(): PythonServiceStatus {
    return { ...this.status };
  }

  private findFreePort(): Promise<number> {
    return new Promise((resolve, reject) => {
      const server = net.createServer();
      server.listen(0, '127.0.0.1', () => {
        const addr = server.address();
        if (addr && typeof addr !== 'string') {
          const port = addr.port;
          server.close(() => resolve(port));
        } else {
          server.close(() => reject(new Error('Failed to bind port')));
        }
      });
      server.on('error', reject);
    });
  }

  public async startService(scriptPath?: string): Promise<boolean> {
    if (this.status.running) {
      return true;
    }

    this.status.health = 'starting';
    this.token = crypto.randomBytes(32).toString('hex');
    this.port = await this.findFreePort();

    const targetScript =
      scriptPath || path.resolve(process.cwd(), 'services/engine/dexter_engine/api/router.py');

    const env = {
      ...process.env,
      DEXTER_SESSION_TOKEN: this.token,
      DEXTER_PORT: String(this.port),
      PYTHONPATH: path.resolve(process.cwd(), 'services/engine'),
    };

    try {
      this.proc = spawn('python3', [targetScript], {
        env,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      this.status.pid = this.proc.pid || null;
      this.status.running = true;
      this.status.port = this.port;

      this.proc.stderr?.on('data', (chunk) => {
        const text = chunk.toString();
        if (text.includes('ERROR') || text.includes('FATAL')) {
          this.status.lastError = text.trim();
        }
      });

      this.proc.on('exit', (code, signal) => {
        this.status.running = false;
        this.status.health = 'stopped';
        this.status.pid = null;
      });

      // Poll /health
      const healthy = await this.pollHealthCheck(this.port, this.token);
      if (healthy) {
        this.status.health = 'healthy';
        return true;
      } else {
        this.status.health = 'unhealthy';
        await this.stopService();
        return false;
      }
    } catch (err) {
      this.status.health = 'error';
      this.status.lastError = (err as Error).message;
      return false;
    }
  }

  private async pollHealthCheck(port: number, token: string, maxAttempts = 25): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/health`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status === 200) {
          const body = (await res.json()) as { status: string };
          if (body.status === 'healthy') {
            return true;
          }
        }
      } catch {
        // waiting for socket to bind
      }
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    return false;
  }

  public async stopService(): Promise<void> {
    const proc = this.proc;
    if (!proc || !this.status.running) {
      this.status.health = 'stopped';
      return;
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        if (!proc.killed) {
          proc.kill('SIGKILL');
        }
        this.status.running = false;
        this.status.health = 'stopped';
        resolve();
      }, 2000);

      proc.once('exit', () => {
        clearTimeout(timeout);
        this.status.running = false;
        this.status.health = 'stopped';
        resolve();
      });

      proc.kill('SIGTERM');
    });
  }
}
