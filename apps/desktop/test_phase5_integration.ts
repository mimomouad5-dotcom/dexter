// Integration Test for Phase 5: PowerPoint Export via IPC Gateway
import { DesktopAppCore } from './electron/main.ts';
import path from 'path';
import fs from 'fs';

async function testPhase5() {
  console.log('=== [Phase 5 Integration Test] PowerPoint PPTX Export (n27, n28, n46) ===');

  const app = new DesktopAppCore();
  const initResult = await app.initialize();
  if (!initResult.success) {
    console.error('FAIL: Application failed to bootstrap Python Engine!');
    process.exit(1);
  }

  try {
    const targetPptx = path.resolve(process.cwd(), 'tmp_phase5_export.pptx');
    if (fs.existsSync(targetPptx)) {
      fs.unlinkSync(targetPptx);
    }

    const payload = {
      model: {
        schema_version: '1.0.0',
        presentation: {
          id: 'pres-phase5-test',
          title: 'عرض استراتيجية التصدير المتكامل',
          language: 'ar',
          direction: 'rtl',
          aspect_ratio: '16:9',
          theme_id: 'emerald-dark',
          settings: {
            audience: 'الإدارة العليا',
            tone: 'professional',
            detail_level: 'medium',
          },
          slides: [
            {
              id: 'slide-1',
              order: 1,
              layout_id: 'title',
              elements: [
                {
                  id: 'el-1',
                  type: 'text',
                  frame: { x: 914400, y: 914400, w: 9144000, h: 1828800, unit: 'emu' },
                  style: { font_family: 'Cairo', font_size_pt: 32, bold: true, is_rtl: true },
                  z: 1,
                  content: { text: 'عرض تقديمي أصلي من نموذج n23' },
                  animation: { effect_id: 'appear', verified: true },
                },
              ],
              notes: 'ملاحظات المتحدث المعتمدة للشريحة الأولى',
              transition: { effect_id: 'fade', verified: true, speed: 'med' },
              claim_ids: [],
            },
            {
              id: 'slide-2',
              order: 2,
              layout_id: 'two-columns',
              elements: [
                {
                  id: 'el-chart',
                  type: 'chart',
                  frame: { x: 914400, y: 914400, w: 5486400, h: 3657600, unit: 'emu' },
                  style: {},
                  z: 1,
                  content: {
                    chart_type: 'column',
                    categories: ['الربع 1', 'الربع 2', 'الربع 3', 'الربع 4'],
                    series: [{ name: 'الإنجاز', values: [30, 60, 85, 100] }],
                  },
                },
              ],
              notes: 'ملاحظات الرسم البياني التفاعلي',
              transition: { effect_id: 'push', verified: true, speed: 'med' },
              claim_ids: [],
            },
          ],
          sources: [],
          claims: [],
          assets: [],
        },
      },
      output_path: targetPptx,
    };

    console.log('Sending export request through IPC Gateway...');
    const res = await app.gateway.forwardToEngine('/export/pptx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.status !== 200) {
      throw new Error(`Export failed with HTTP ${res.status}`);
    }

    const data = await res.json();
    console.log('Export Response:', data);

    if (!fs.existsSync(targetPptx) || fs.statSync(targetPptx).size <= 0) {
      throw new Error('Target PPTX file was not generated on disk!');
    }

    if (
      !data.round_trip_verification ||
      !data.round_trip_verification.round_trip_valid ||
      !data.round_trip_verification.has_charts ||
      !data.round_trip_verification.has_arabic_rtl
    ) {
      throw new Error('Round-trip verification checks failed!');
    }

    console.log(`PASS: PPTX exported (${data.size_bytes} bytes) and round-trip verified successfully.`);

    // Clean up temporary file
    if (fs.existsSync(targetPptx)) {
      fs.unlinkSync(targetPptx);
    }

    console.log('\n=== [Phase 5 Integration Test] RESULT: 100% SUCCESS ===\n');
  } finally {
    await app.shutdown();
  }
}

testPhase5();
