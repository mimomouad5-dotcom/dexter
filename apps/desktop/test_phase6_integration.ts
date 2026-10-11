// Component: n6, n29, n16, n40, n42 Phase 6 Integration Test
import { DesktopAppCore } from './electron/main.ts';
import path from 'path';
import fs from 'fs';

async function testPhase6() {
  console.log('=== [Phase 6 Integration Test] Library Indexer, Classifier & Deduplication (n6, n29, n16, n40, n42) ===');

  const app = new DesktopAppCore();
  const initResult = await app.initialize();
  if (!initResult.success) {
    console.error('FAIL: Application failed to bootstrap Python Engine!');
    process.exit(1);
  }

  const testDir = path.resolve(process.cwd(), 'tmp_test_phase6_library');
  try {
    // 1. Prepare test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    fs.mkdirSync(testDir, { recursive: true });

    // Copy an existing generated PPTX
    const samplePptx = path.join(testDir, 'presentation_alpha.pptx');
    const existingPptx = path.resolve(process.cwd(), 'poc/02-pptx-basic/dexter_poc02_presentation.pptx');
    if (fs.existsSync(existingPptx)) {
      fs.copyFileSync(existingPptx, samplePptx);
    } else {
      throw new Error(`Sample PPTX not found at ${existingPptx}`);
    }

    // Exact duplicate
    const duplicatePptx = path.join(testDir, 'presentation_alpha_copy.pptx');
    fs.copyFileSync(samplePptx, duplicatePptx);

    // Document / Markdown
    const markdownDoc = path.join(testDir, 'guide.md');
    fs.writeFileSync(markdownDoc, '# Presentation Guide\nKeynotes and tips.', 'utf-8');

    // Corrupted file
    const corruptFile = path.join(testDir, 'damaged_slide.pptx');
    fs.writeFileSync(corruptFile, 'PK\x03\x04corrupted_header_without_tail', 'utf-8');

    console.log(`[Phase 6] Populated test library folder at: ${testDir}`);

    // 2. Start Library Scan via API
    console.log('[Phase 6] Triggering POST /library/scan...');
    const scanRes = await app.gateway.forwardToEngine('/library/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_path: testDir, source_label: 'integration_test' }),
    });

    if (!scanRes.ok) {
      throw new Error(`Failed to start library scan: ${scanRes.status} ${await scanRes.text()}`);
    }

    const scanData = await scanRes.json();
    console.log('[Phase 6] Scan initiated successfully, task_id:', scanData.task_id);
    const taskId = scanData.task_id;

    // 3. Poll task status until complete
    let taskState = 'pending';
    let attempts = 0;
    while (taskState !== 'completed' && taskState !== 'failed' && attempts < 20) {
      await new Promise((r) => setTimeout(r, 300));
      const taskRes = await app.gateway.forwardToEngine(`/tasks/${taskId}`);
      const t = await taskRes.json();
      taskState = t.state;
      console.log(`[Phase 6] Task poll (${attempts + 1}): state=${t.state}, progress=${t.progress}, msg=${t.message}`);
      attempts++;
    }

    if (taskState !== 'completed') {
      throw new Error(`Task did not reach completed state in time (final state: ${taskState})`);
    }

    // 4. Query files
    console.log('[Phase 6] Querying GET /library/files...');
    const filesRes = await app.gateway.forwardToEngine('/library/files');
    const files = await filesRes.json();
    console.log(`[Phase 6] Indexed files count: ${files.length}`);
    if (files.length < 3) {
      throw new Error(`Expected at least 3 files, got ${files.length}`);
    }

    // Check duplicate classification
    const duplicateEntries = files.filter((f: any) => f.status === 'duplicate');
    console.log(`[Phase 6] Detected duplicate count: ${duplicateEntries.length}`);
    if (duplicateEntries.length !== 1) {
      throw new Error(`Expected exactly 1 duplicate file, got ${duplicateEntries.length}`);
    }

    // Check corrupted file classification
    const corruptEntries = files.filter((f: any) => f.status === 'corrupt');
    console.log(`[Phase 6] Detected corrupt count: ${corruptEntries.length}`);
    if (corruptEntries.length !== 1) {
      throw new Error(`Expected exactly 1 corrupt file, got ${corruptEntries.length}`);
    }

    // 5. Query duplicates cluster
    console.log('[Phase 6] Querying GET /library/duplicates...');
    const dupClusterRes = await app.gateway.forwardToEngine('/library/duplicates');
    const dupClusters = await dupClusterRes.json();
    console.log(`[Phase 6] Duplicate clusters found: ${dupClusters.length}`);
    if (dupClusters.length !== 1 || dupClusters[0].count !== 2) {
      throw new Error(`Expected 1 cluster with 2 files, got ${JSON.stringify(dupClusters)}`);
    }

    // 6. Test cancellation
    console.log('[Phase 6] Testing cooperative task cancellation...');
    const cancelScanRes = await app.gateway.forwardToEngine('/library/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ folder_path: testDir }),
    });
    const cancelTaskData = await cancelScanRes.json();
    const cancelRes = await app.gateway.forwardToEngine(`/tasks/${cancelTaskData.task_id}/cancel`, {
      method: 'POST',
    });
    const cancelResult = await cancelRes.json();
    console.log(`[Phase 6] Cancellation requested: status=${cancelResult.status}`);
    if (cancelResult.status !== 'cancelling') {
      throw new Error('Cancellation request did not succeed');
    }

    // 7. Test removing from index
    console.log('[Phase 6] Testing DELETE /library/files/{file_id}...');
    const targetFile = files[0];
    const deleteRes = await app.gateway.forwardToEngine(`/library/files/${targetFile.id}`, {
      method: 'DELETE',
    });
    const deleteData = await deleteRes.json();
    console.log(`[Phase 6] File removed from index: id=${deleteData.file_id}, success=${deleteData.success}`);

    // Verify original file on disk is still intact!
    if (!fs.existsSync(targetFile.path)) {
      throw new Error('CRITICAL BUG: File was deleted from disk! Must only remove from index!');
    }
    console.log('[Phase 6] VERIFIED: Original file on disk is safe and preserved intact.');

    console.log('\n======================================================');
    console.log('✅ ALL PHASE 6 INTEGRATION CHECKS PASSED (100% SUCCESS)');
    console.log('======================================================\n');
  } catch (err) {
    console.error('FAIL: Phase 6 integration test failed:', err);
    process.exit(1);
  } finally {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
    await app.shutdown();
  }
}

testPhase6();
