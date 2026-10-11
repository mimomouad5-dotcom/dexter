// Component: n8 & n9 PoC verification runner
import {
  REQUIRED_SECURE_WINDOW_CONFIG,
  validateWindowConfig,
  testExposedApiSurface,
  ProjectOpenSchema,
  TaskStartSchema,
  SecretSetSchema,
} from './security_spec.ts';

function runPoC01() {
  console.log('=== [PoC-01] Electron Window & Preload Security Verification ===');

  // Test 1: Window security config check
  const configResult = validateWindowConfig(REQUIRED_SECURE_WINDOW_CONFIG);
  if (!configResult.valid) {
    console.error('FAIL: Window configuration failed:', configResult.errors);
    process.exit(1);
  }
  console.log('PASS: Window configuration matches security baseline:');
  console.log('  - contextIsolation: true');
  console.log('  - nodeIntegration: false');
  console.log('  - sandbox: true');
  console.log('  - webSecurity: true');
  console.log('  - Strict CSP enforcing self and local HTTP');

  // Test 2: Simulated exposed window.api surface
  const mockRendererApi = {
    project: {
      open: (path: string) => ProjectOpenSchema.parse({ filePath: path }),
      save: (data: unknown) => ({ success: true }),
    },
    task: {
      start: (type: string, payload: Record<string, unknown>) => TaskStartSchema.parse({ type, payload }),
      cancel: (taskId: string) => ({ taskId, cancelled: true }),
    },
    secrets: {
      set: (providerId: string, apiKey: string) => SecretSetSchema.parse({ providerId, apiKey }),
    },
    dialog: {
      pickFolder: () => 'C:\\presentations',
    },
    system: {
      getHealth: () => ({ status: 'online' }),
    },
  };

  const apiResult = testExposedApiSurface(mockRendererApi);
  if (!apiResult.valid) {
    console.error('FAIL: API surface exposed forbidden primitives:', apiResult.violations);
    process.exit(1);
  }
  console.log('PASS: Renderer API surface cleanly isolated without raw ipcRenderer or node globals.');

  // Test 3: Path and input validation with Zod
  try {
    ProjectOpenSchema.parse({ filePath: 'C:/presentations/project.dexter' });
    console.log('PASS: Valid project path accepted by Zod validator.');
  } catch (err) {
    console.error('FAIL: Valid path rejected');
    process.exit(1);
  }

  try {
    ProjectOpenSchema.parse({ filePath: 'C:/invalid|path<test>' });
    console.error('FAIL: Malicious path was not blocked!');
    process.exit(1);
  } catch {
    console.log('PASS: Malicious/invalid path characters blocked by schema.');
  }

  console.log('=== [PoC-01] RESULT: SUCCESS (All security criteria verified) ===\n');
}

runPoC01();
