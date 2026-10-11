// Integration Test for Phase 1 Desktop & Engine
import { DesktopAppCore } from './electron/main.ts';
import { validateSafePath } from './electron/ipc/pathGuard.ts';

async function testPhase1() {
  console.log('=== [Phase 1 Integration Test] Desktop Skeleton & Python IPC ===');

  const app = new DesktopAppCore();

  // Test 1: Window security parameters
  console.log('--- Test 1: Electron BrowserWindow Security Options ---');
  const winOpts = app.getSecureWindowOptions();
  if (
    !winOpts.webPreferences.contextIsolation ||
    winOpts.webPreferences.nodeIntegration ||
    !winOpts.webPreferences.sandbox ||
    !winOpts.webPreferences.webSecurity
  ) {
    console.error('FAIL: BrowserWindow security configuration violation!');
    process.exit(1);
  }
  console.log('PASS: Secure Window options confirmed (contextIsolation=true, nodeIntegration=false, sandbox=true).');

  // Test 2: Path Guard validation
  console.log('\n--- Test 2: IPC Gateway Path Guard (n10) ---');
  const safeRes = validateSafePath('/valid/path/to/project.dexter');
  if (!safeRes.valid) {
    console.error('FAIL: Safe path rejected:', safeRes.error);
    process.exit(1);
  }

  const traversalRes = validateSafePath('/valid/path/../../etc/passwd');
  if (traversalRes.valid) {
    console.error('FAIL: Path traversal was not blocked!');
    process.exit(1);
  }
  console.log('PASS: Path traversal attempts (..) safely blocked.');

  // Test 3: Credential Store (n44)
  console.log('\n--- Test 3: Secret Credential Store (n44) ---');
  app.credentialStore.setApiKey('openai', 'sk-proj-super-secret-key-1234567890');
  const maskedList = app.credentialStore.listMaskedCredentials();
  if (maskedList.length !== 1 || !maskedList[0].maskedKey.includes('••••')) {
    console.error('FAIL: Masked key does not match required format:', maskedList);
    process.exit(1);
  }
  if (maskedList[0].maskedKey.includes('super-secret')) {
    console.error('FAIL: Raw secret leaked in masked output!');
    process.exit(1);
  }
  console.log('PASS: Credential stored and masked properly (never leaked):', maskedList[0].maskedKey);

  // Test 4: Bootstrapping Python Engine Service (n11 + n14)
  console.log('\n--- Test 4: Bootstrapping Python Engine & IPC Health (n11, n14) ---');
  const initResult = await app.initialize();
  if (!initResult.success) {
    console.error('FAIL: Application failed to bootstrap Python Engine!');
    process.exit(1);
  }
  console.log('PASS: Python Engine successfully bootstrapped.');

  // Test 5: Forwarding request through IPC Gateway with Bearer token
  console.log('\n--- Test 5: Authenticated Gateway Forwarding ---');
  const healthResp = await app.gateway.forwardToEngine('/health');
  if (healthResp.status !== 200) {
    console.error(`FAIL: Health check failed with HTTP ${healthResp.status}`);
    await app.shutdown();
    process.exit(1);
  }
  const healthData = await healthResp.json();
  console.log('Health Payload:', healthData);
  if (healthData.status !== 'healthy') {
    console.error('FAIL: Engine reported unhealthy state!');
    await app.shutdown();
    process.exit(1);
  }
  console.log('PASS: Gateway successfully authenticated with engine via Bearer session token.');

  // Test 6: Clean Shutdown
  console.log('\n--- Test 6: Graceful Engine Shutdown ---');
  await app.shutdown();
  const statusAfterShutdown = app.pythonManager.getStatus();
  if (statusAfterShutdown.running) {
    console.error('FAIL: Python process is still running after shutdown!');
    process.exit(1);
  }
  console.log('PASS: Python engine stopped cleanly without orphan processes.');

  console.log('\n=== [Phase 1 Integration Test] RESULT: 100% SUCCESS ===\n');
}

testPhase1();
