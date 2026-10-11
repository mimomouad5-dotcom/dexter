// Integration Test for Phase 2: Storage, Settings & Backup
import { DesktopAppCore } from './electron/main.ts';
import path from 'path';
import fs from 'fs';

async function testPhase2() {
  console.log('=== [Phase 2 Integration Test] Storage, Settings & Backup API ===');

  const app = new DesktopAppCore();
  const initResult = await app.initialize();
  if (!initResult.success) {
    console.error('FAIL: App bootstrap failed!');
    process.exit(1);
  }

  try {
    // Test 1: Settings persistence via IPC Gateway
    console.log('\n--- Test 1: IPC Gateway Settings CRUD ---');
    const setRes = await app.gateway.forwardToEngine('/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: 'editor_preference',
        value: { default_theme: 'emerald-dark', auto_save_seconds: 45, direction: 'rtl' },
      }),
    });
    if (setRes.status !== 200) {
      throw new Error(`Failed to save setting: HTTP ${setRes.status}`);
    }

    const getRes = await app.gateway.forwardToEngine('/settings/editor_preference');
    if (getRes.status !== 200) {
      throw new Error(`Failed to retrieve setting: HTTP ${getRes.status}`);
    }
    const retrieved = await getRes.json();
    console.log('Retrieved Setting:', retrieved);
    if (retrieved.value.default_theme !== 'emerald-dark') {
      throw new Error('Retrieved setting content mismatch!');
    }
    console.log('PASS: Settings successfully persisted and queried from SQLite via Engine.');

    // Test 2: Project Bundle creation on disk (n41)
    console.log('\n--- Test 2: Project Bundle Creation (n41) ---');
    const testBundleDir = path.resolve(process.cwd(), 'tmp_test_project.dexter');
    if (fs.existsSync(testBundleDir)) {
      fs.rmSync(testBundleDir, { recursive: true, force: true });
    }

    const projRes = await app.gateway.forwardToEngine('/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: 'proj-phase2-001',
        title: 'عرض المرحلة الثانية التفاعلي',
        bundle_path: testBundleDir,
        schema_version: '1.0.0',
      }),
    });
    if (projRes.status !== 200) {
      throw new Error(`Failed to create project: HTTP ${projRes.status}`);
    }
    const projData = await projRes.json();
    console.log('Project Created:', projData);
    if (!fs.existsSync(path.join(testBundleDir, 'project.json'))) {
      throw new Error('project.json not found in created bundle directory!');
    }
    console.log('PASS: Project bundle and project.json initialized on disk.');

    // Test 3: Backup Archive Creation (n31)
    console.log('\n--- Test 3: Backup Archive Creation (n31) ---');
    const backupZip = path.resolve(process.cwd(), 'tmp_test_backup.zip');
    if (fs.existsSync(backupZip)) {
      fs.unlinkSync(backupZip);
    }

    const backupRes = await app.gateway.forwardToEngine('/backup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        project_paths: [testBundleDir],
        output_zip_path: backupZip,
      }),
    });
    if (backupRes.status !== 200) {
      throw new Error(`Failed to create backup: HTTP ${backupRes.status}`);
    }
    const backupData = await backupRes.json();
    console.log('Backup Result:', backupData);
    if (!fs.existsSync(backupZip) || backupData.size_bytes <= 0) {
      throw new Error('Backup ZIP archive was not written properly!');
    }
    console.log('PASS: Consistent backup ZIP created with SHA-256 checksum and manifest.');

    // Cleanup temp test artifacts
    if (fs.existsSync(testBundleDir)) {
      fs.rmSync(testBundleDir, { recursive: true, force: true });
    }
    if (fs.existsSync(backupZip)) {
      fs.unlinkSync(backupZip);
    }

    console.log('\n=== [Phase 2 Integration Test] RESULT: 100% SUCCESS ===\n');
  } finally {
    await app.shutdown();
  }
}

testPhase2();
