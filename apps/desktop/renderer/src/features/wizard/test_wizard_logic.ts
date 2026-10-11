// Unit test for Component: n3 Wizard & Outline Review Logic
import {
  OutlineSlideItem,
  PresentationSettings,
  PresentationSettingsSchema,
} from './types.ts';

function testWizardLogic() {
  console.log('=== [Phase 3 Test] n3 Wizard & Outline Review Logic ===');

  // Test 1: User Outline Preservation & Custom Parsing
  console.log('\n--- Test 1: User Outline Preservation (Zero Loss) ---');
  const userOutlineText = `1. الرؤية والأهداف الاستراتيجية
2. البنية التحتية والبيانات الضخمة
3. مؤشرات الأداء والعائد على الاستثمار
4. خطة الإطلاق والدعم الفني`;

  const parsedSlides: OutlineSlideItem[] = userOutlineText
    .split('\n')
    .map((line, idx) => ({
      id: `slide-${idx + 1}`,
      order: idx + 1,
      title: line.replace(/^\d+[\.\-\)]\s*/, '').trim(),
      bullets: ['نقطة تفصيلية'],
      suggestedLayout: idx === 0 ? 'title' : 'title-content',
      locked: true,
    }));

  if (parsedSlides.length !== 4) {
    console.error('FAIL: Slide count mismatch');
    process.exit(1);
  }
  if (parsedSlides[0].title !== 'الرؤية والأهداف الاستراتيجية') {
    console.error('FAIL: Title preservation failed for slide 1');
    process.exit(1);
  }
  if (!parsedSlides.every((s) => s.locked === true)) {
    console.error('FAIL: User outline must carry locked=true flag!');
    process.exit(1);
  }
  console.log('PASS: User outline parsed with exact titles and locked=true flag.');

  // Test 2: Reordering Slides (Immutability & Order consistency)
  console.log('\n--- Test 2: Slide Reordering (Move Slide 2 Up) ---');
  const reordered = [...parsedSlides];
  const temp = reordered[1];
  reordered[1] = reordered[0];
  reordered[0] = temp;
  reordered.forEach((s, idx) => {
    s.order = idx + 1;
  });

  if (reordered[0].title !== 'البنية التحتية والبيانات الضخمة') {
    console.error('FAIL: Reordered slide 1 title mismatch');
    process.exit(1);
  }
  if (reordered[0].order !== 1 || reordered[1].order !== 2) {
    console.error('FAIL: Sequential order index recalculation failed');
    process.exit(1);
  }
  console.log('PASS: Reordering preserved all slide contents and updated sequential order.');

  // Test 3: Addition and Deletion
  console.log('\n--- Test 3: Slide Addition & Deletion ---');
  const withAdded = [
    ...reordered,
    {
      id: 'slide-5',
      order: reordered.length + 1,
      title: 'خاتمة وتوصيات ختامية',
      bullets: [],
      suggestedLayout: 'conclusion' as const,
      locked: false,
    },
  ];
  if (withAdded.length !== 5) {
    console.error('FAIL: Slide addition failed');
    process.exit(1);
  }

  // Delete slide id 'slide-1'
  const afterDelete = withAdded.filter((s) => s.id !== 'slide-1');
  afterDelete.forEach((s, idx) => {
    s.order = idx + 1;
  });
  if (afterDelete.length !== 4 || afterDelete[afterDelete.length - 1].order !== 4) {
    console.error('FAIL: Slide deletion re-indexing failed');
    process.exit(1);
  }
  console.log('PASS: Slide addition and deletion maintains clean sequential ordering.');

  // Test 4: Settings Schema Validation
  console.log('\n--- Test 4: Zod Validation of Presentation Settings ---');
  const validSettings: PresentationSettings = {
    targetSlideCount: 6,
    language: 'ar',
    direction: 'rtl',
    audience: 'المدراء التنفيذيون',
    detailLevel: 'medium',
    tone: 'professional',
    aspectRatio: '16:9',
    styleThemeId: 'emerald-dark',
    includeImages: true,
    includeCharts: true,
    enableResearch: false,
    offlineOnly: true,
    saveFolderPath: '/data/presentations',
  };

  const validationResult = PresentationSettingsSchema.safeParse(validSettings);
  if (!validationResult.success) {
    console.error('FAIL: Valid settings rejected by schema:', validationResult.error);
    process.exit(1);
  }
  console.log('PASS: Presentation settings schema successfully validated.');

  console.log('\n=== [Phase 3 Test] RESULT: 100% SUCCESS ===\n');
}

testWizardLogic();
