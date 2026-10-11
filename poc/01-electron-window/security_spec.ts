// Component: n8 Electron Main Process & n9 Preload محدود
import { z } from 'zod';

export interface SafeWindowConfig {
  contextIsolation: boolean;
  nodeIntegration: boolean;
  sandbox: boolean;
  webSecurity: boolean;
  allowRunningInsecureContent: boolean;
  csp: string;
}

export const REQUIRED_SECURE_WINDOW_CONFIG: SafeWindowConfig = {
  contextIsolation: true,
  nodeIntegration: false,
  sandbox: true,
  webSecurity: true,
  allowRunningInsecureContent: false,
  csp: "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' http://127.0.0.1:*; font-src 'self' data:;",
};

// Zod schemas for n9 Preload ContextBridge validation
export const ProjectOpenSchema = z.object({
  filePath: z.string().min(1).regex(/^([a-zA-Z]:[/\\]|[/])[^<>:"|?*]+$/, 'Invalid file path characters'),
});

export const TaskStartSchema = z.object({
  type: z.enum(['outline', 'content', 'research', 'import-library', 'export-pptx']),
  payload: z.record(z.string(), z.unknown()),
});

export const SecretSetSchema = z.object({
  providerId: z.string().min(1),
  apiKey: z.string().min(8),
});

export function validateWindowConfig(config: SafeWindowConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!config.contextIsolation) errors.push('contextIsolation MUST be true');
  if (config.nodeIntegration) errors.push('nodeIntegration MUST be false');
  if (!config.sandbox) errors.push('sandbox MUST be true');
  if (!config.webSecurity) errors.push('webSecurity MUST be true');
  if (config.allowRunningInsecureContent) errors.push('allowRunningInsecureContent MUST be false');
  if (!config.csp.includes("default-src 'self'")) errors.push("CSP must restrict default-src to 'self'");
  if (config.csp.includes("'unsafe-eval'")) errors.push("CSP must NOT allow 'unsafe-eval'");

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function testExposedApiSurface(exposedApi: Record<string, unknown>): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  const forbiddenGlobals = ['ipcRenderer', 'require', 'process', '__dirname', 'Buffer', 'child_process', 'fs', 'net'];

  for (const forbidden of forbiddenGlobals) {
    if (forbidden in exposedApi) {
      violations.push(`Forbidden global exposed to renderer: ${forbidden}`);
    }
  }

  // Ensure only whitelisted namespaces exist
  const allowedNamespaces = ['project', 'task', 'secrets', 'dialog', 'system'];
  for (const key of Object.keys(exposedApi)) {
    if (!allowedNamespaces.includes(key)) {
      violations.push(`Unauthorized API namespace exposed: ${key}`);
    }
  }

  return {
    valid: violations.length === 0,
    violations,
  };
}
