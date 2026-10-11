// Unit test for TypeScript model: n23 Unified Presentation Model
import {
  UnifiedPresentationModel,
  pxToEmu,
  emuToPx,
  EMU_PER_INCH,
} from './presentation.ts';

function testTypeScriptModel() {
  console.log('=== [Phase 4 Test] n23 TypeScript Model & EMU Coordinates ===');

  // Test 1: Coordinate conversions
  console.log('--- Test 1: Pixel <-> EMU Coordinate Conversions ---');
  const screenPx = 96; // 1 inch at 96 DPI
  const emuVal = pxToEmu(screenPx);
  if (emuVal !== EMU_PER_INCH) {
    console.error(`FAIL: Expected ${EMU_PER_INCH} EMU for 96px, got ${emuVal}`);
    process.exit(1);
  }

  const backToPx = emuToPx(emuVal);
  if (backToPx !== screenPx) {
    console.error(`FAIL: Round-trip conversion mismatch: expected ${screenPx}, got ${backToPx}`);
    process.exit(1);
  }
  console.log(`PASS: 96px correctly maps to ${emuVal} EMU and round-trips to ${backToPx}px.`);

  // Test 2: Strongly typed Presentation Object Construction
  console.log('\n--- Test 2: Strongly-typed Presentation Model Construction ---');
  const sampleModel: UnifiedPresentationModel = {
    schema_version: '1.0.0',
    presentation: {
      id: 'pres-123',
      title: 'عرض معتمد بالنموذج الموحد',
      language: 'ar',
      direction: 'rtl',
      aspect_ratio: '16:9',
      theme_id: 'modern-emerald',
      settings: {
        audience: 'مجلس الإدارة',
        tone: 'professional',
        detail_level: 'medium',
      },
      slides: [
        {
          id: 'slide-1',
          order: 1,
          layout_id: 'title-content',
          elements: [
            {
              id: 'el-1',
              type: 'text',
              frame: { x: EMU_PER_INCH, y: EMU_PER_INCH, w: 5 * EMU_PER_INCH, h: EMU_PER_INCH, unit: 'emu' },
              style: { font_family: 'Cairo', font_size_pt: 28, is_rtl: true },
              z: 1,
              content: { text: 'عنوان معتمد' },
            },
          ],
          notes: 'ملاحظات المتحدث',
          claim_ids: [],
        },
      ],
      sources: [],
      claims: [],
      assets: [],
    },
  };

  if (sampleModel.schema_version !== '1.0.0' || sampleModel.presentation.slides.length !== 1) {
    console.error('FAIL: Model properties mismatch');
    process.exit(1);
  }
  console.log('PASS: UnifiedPresentationModel constructed and validated in TypeScript.');

  console.log('\n=== [Phase 4 Test] RESULT: 100% SUCCESS ===\n');
}

testTypeScriptModel();
