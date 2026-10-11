// Component: n3 معالج إنشاء العرض (Wizard & Outline Review)
import React, { useState } from 'react';
import {
  Sparkles,
  Sliders,
  ListOrdered,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Lock,
  Unlock,
  Folder,
  FileText,
  Layout,
  AlertCircle,
  Save,
  Layers
} from 'lucide-react';
import {
  OutlineSlideItem,
  PresentationSettings,
  SlideLayoutType,
  WizardProjectData,
} from './types.ts';

const DEFAULT_SETTINGS: PresentationSettings = {
  targetSlideCount: 5,
  language: 'ar',
  direction: 'rtl',
  audience: 'تنفيذي ومستثمرون',
  detailLevel: 'medium',
  tone: 'professional',
  aspectRatio: '16:9',
  styleThemeId: 'emerald-executive',
  includeImages: true,
  includeCharts: true,
  enableResearch: false,
  offlineOnly: true,
  saveFolderPath: 'C:\\Users\\User\\Documents\\DexterProjects',
};

const INITIAL_DEMO_OUTLINE: OutlineSlideItem[] = [
  {
    id: 'slide-1',
    order: 1,
    title: 'مقدمة في استراتيجية التحول الرقمي',
    bullets: ['أهداف المشروع ومحاوره الأساسية', 'خارطة طريق التطوير لعام 2026'],
    suggestedLayout: 'title',
    notes: 'ملاحظة المتحدث: الترحيب بالحضور واستعراض الرؤية العامة.',
    locked: false,
  },
  {
    id: 'slide-2',
    order: 2,
    title: 'التحديات الراهنة وفرص النمو',
    bullets: ['تحليل الفجوات التقنية والتشغيلية', 'مقارنة الأداء التاريخي بالأهداف المستقبلية'],
    suggestedLayout: 'two-columns',
    notes: 'ملاحظة المتحدث: التركيز على معالجة التحديات بحلول فورية.',
    locked: false,
  },
  {
    id: 'slide-3',
    order: 3,
    title: 'مؤشرات الأداء والأرقام البارزة',
    bullets: ['نمو الإيرادات بنسبة 45%', 'خفض التكاليف التشغيلية بنسبة 20%'],
    suggestedLayout: 'metrics',
    notes: 'ملاحظة المتحدث: استعراض النتائج الرقمية والرسوم البيانية.',
    locked: false,
  },
  {
    id: 'slide-4',
    order: 4,
    title: 'مقارنة الحلول والبدائل المطروحة',
    bullets: ['الحل الداخلي vs الحل السحابي', 'تقييم معايير الأمان والتكلفة الإجمالية'],
    suggestedLayout: 'comparison',
    notes: 'ملاحظة المتحدث: توضيح مزايا الحل المعتمد.',
    locked: false,
  },
  {
    id: 'slide-5',
    order: 5,
    title: 'الخاتمة والتوصيات التنفيذية',
    bullets: ['الخطوات الفورية خلال الربع الأول', 'تشكيل فرق العمل والمتابعة'],
    suggestedLayout: 'conclusion',
    notes: 'ملاحظة المتحدث: فتح باب الأسئلة والمناقشة.',
    locked: false,
  },
];

export function WizardFlow() {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [inputMode, setInputMode] = useState<'topic' | 'custom_outline'>('topic');
  const [topic, setTopic] = useState<string>('استراتيجية الذكاء الاصطناعي والتحول الرقمي 2026');
  const [rawOutlineText, setRawOutlineText] = useState<string>(
    '1. مقدمة واستعراض الرؤية\n2. تحليل الوضع الراهن\n3. مؤشرات الأداء والأرقام\n4. خطة العمل والتنفيذ'
  );
  const [settings, setSettings] = useState<PresentationSettings>(DEFAULT_SETTINGS);
  const [outlineSlides, setOutlineSlides] = useState<OutlineSlideItem[]>(INITIAL_DEMO_OUTLINE);
  const [projectSaved, setProjectSaved] = useState<boolean>(false);

  // Helper to parse pasted outline
  const handleParsePastedOutline = () => {
    const lines = rawOutlineText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    if (lines.length === 0) return;

    const parsed: OutlineSlideItem[] = lines.map((line, idx) => {
      // Strip numbering like "1. ", "2- ", etc.
      const cleanTitle = line.replace(/^\d+[\.\-\)]\s*/, '');
      return {
        id: `slide-${Date.now()}-${idx + 1}`,
        order: idx + 1,
        title: cleanTitle || `شريحة ${idx + 1}`,
        bullets: ['النقطة الرئيسية الأولى', 'نقطة فرعية توضيحية'],
        suggestedLayout: idx === 0 ? 'title' : idx === lines.length - 1 ? 'conclusion' : 'title-content',
        locked: true,
      };
    });

    setOutlineSlides(parsed);
    setSettings((prev) => ({ ...prev, targetSlideCount: parsed.length }));
  };

  // Reorder slide up
  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...outlineSlides];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    // update order field
    updated.forEach((s, idx) => {
      s.order = idx + 1;
    });
    setOutlineSlides(updated);
  };

  // Reorder slide down
  const handleMoveDown = (index: number) => {
    if (index >= outlineSlides.length - 1) return;
    const updated = [...outlineSlides];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    updated.forEach((s, idx) => {
      s.order = idx + 1;
    });
    setOutlineSlides(updated);
  };

  // Add slide
  const handleAddSlide = () => {
    const newSlide: OutlineSlideItem = {
      id: `slide-${Date.now()}`,
      order: outlineSlides.length + 1,
      title: `شريحة جديدة #${outlineSlides.length + 1}`,
      bullets: ['نقطة رئيسية جديدة'],
      suggestedLayout: 'title-content',
      locked: false,
    };
    setOutlineSlides([...outlineSlides, newSlide]);
    setSettings((prev) => ({ ...prev, targetSlideCount: outlineSlides.length + 1 }));
  };

  // Delete slide
  const handleDeleteSlide = (id: string) => {
    if (outlineSlides.length <= 1) return;
    const filtered = outlineSlides.filter((s) => s.id !== id);
    filtered.forEach((s, idx) => {
      s.order = idx + 1;
    });
    setOutlineSlides(filtered);
    setSettings((prev) => ({ ...prev, targetSlideCount: filtered.length }));
  };

  // Update slide fields
  const handleUpdateSlideTitle = (id: string, newTitle: string) => {
    setOutlineSlides(
      outlineSlides.map((s) => (s.id === id ? { ...s, title: newTitle } : s))
    );
  };

  const handleUpdateSlideLayout = (id: string, layout: SlideLayoutType) => {
    setOutlineSlides(
      outlineSlides.map((s) => (s.id === id ? { ...s, suggestedLayout: layout } : s))
    );
  };

  const handleToggleLock = (id: string) => {
    setOutlineSlides(
      outlineSlides.map((s) => (s.id === id ? { ...s, locked: !s.locked } : s))
    );
  };

  const handleSaveProject = () => {
    setProjectSaved(true);
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      {/* Wizard Step Progress Indicator */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
              n3 Wizard & Outline Review (المرحلة 3)
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              المعالج ومراجعة المخطط نشط 100%
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5">معالج إنشاء العرض التقديمي</h2>
          <p className="text-xs text-slate-400">
            جمع المدخلات والإعدادات، مراجعة المخطط التفاعلية، وتثبيت ترتيب الشرائح قبل التوليد.
          </p>
        </div>

        {/* Steps pills */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1.5 rounded-xl border border-slate-800 text-xs">
          {[
            { num: 1, label: 'المدخلات' },
            { num: 2, label: 'الإعدادات' },
            { num: 3, label: 'مراجعة المخطط' },
            { num: 4, label: 'اعتماد المشروع' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setCurrentStep(s.num as any)}
              className={`px-3 py-1 rounded-lg transition font-medium flex items-center gap-1.5 ${
                currentStep === s.num
                  ? 'bg-teal-600 text-white shadow-sm'
                  : currentStep > s.num
                  ? 'text-teal-400 bg-teal-950/20'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-800/80 flex items-center justify-center text-[10px]">
                {s.num}
              </span>
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: INPUT TOPIC OR OUTLINE */}
      {currentStep === 1 && (
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setInputMode('topic')}
              className={`flex-1 p-3.5 rounded-xl border text-start transition ${
                inputMode === 'topic'
                  ? 'bg-slate-950 border-teal-500 text-white shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400 mb-1">
                <Sparkles className="w-4 h-4" />
                <span>الخيار أ: تحديد موضوع أو فكرة العرض</span>
              </div>
              <p className="text-xs text-slate-300">
                اكتب عنوان الموضوع أو المشكلة وسيقوم الاستوديو بتوليد الهيكل المقترح بناءً على إعداداتك.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('custom_outline')}
              className={`flex-1 p-3.5 rounded-xl border text-start transition ${
                inputMode === 'custom_outline'
                  ? 'bg-slate-950 border-teal-500 text-white shadow-sm'
                  : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-bold text-teal-400 mb-1">
                <FileText className="w-4 h-4" />
                <span>الخيار ب: لصق مخطط جاهز مسبقاً (Custom Outline)</span>
              </div>
              <p className="text-xs text-slate-300">
                الصق رؤوس أقلام أو عناوين الشرائح الجاهزة لديك، مع ضمان الحفاظ على ترتيبها الحرفي.
              </p>
            </button>
          </div>

          {inputMode === 'topic' ? (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                موضوع العرض أو المطالبة التفصيلية:
              </label>
              <textarea
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={3}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-teal-500"
                placeholder="مثال: استعراض خطة التحول الرقمي وتطوير البنية التحتية لعام 2026..."
              />
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-300">
                  الصق مخطط الشرائح (سطر لكل شريحة):
                </label>
                <button
                  type="button"
                  onClick={handleParsePastedOutline}
                  className="px-2.5 py-1 rounded bg-teal-600 text-white text-[11px] font-semibold hover:bg-teal-500"
                >
                  تحليل وتحويل إلى شرائح
                </button>
              </div>
              <textarea
                value={rawOutlineText}
                onChange={(e) => setRawOutlineText(e.target.value)}
                rows={5}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
              />
              <p className="text-[11px] text-slate-400">
                * ملاحظة معمارية: المخطط المقدم من المستخدم يحمل صفة <code className="text-teal-300">locked_outline=true</code> ويُحفظ ترتيبه دون تغيير.
              </p>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition"
            >
              <span>متابعة إلى الإعدادات</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SETTINGS (Full 10 Parameters) */}
      {currentStep === 2 && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* Target Slide Count */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-slate-300 font-semibold block">عدد الشرائح المستهدف:</label>
              <input
                type="number"
                min={3}
                max={30}
                value={settings.targetSlideCount}
                onChange={(e) => setSettings({ ...settings, targetSlideCount: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>

            {/* Language */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-slate-300 font-semibold block">لغة العرض والاتجاه:</label>
              <select
                value={settings.language}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    language: e.target.value as any,
                    direction: e.target.value === 'ar' ? 'rtl' : 'ltr',
                  })
                }
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              >
                <option value="ar">العربية (RTL - اليمين لليسار)</option>
                <option value="en">English (LTR - Left to Right)</option>
              </select>
            </div>

            {/* Audience */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-slate-300 font-semibold block">الجمهور المستهدف:</label>
              <input
                type="text"
                value={settings.audience}
                onChange={(e) => setSettings({ ...settings, audience: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              />
            </div>

            {/* Detail Level */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-slate-300 font-semibold block">مستوى التفاصيل:</label>
              <select
                value={settings.detailLevel}
                onChange={(e) => setSettings({ ...settings, detailLevel: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              >
                <option value="brief">مختصر (عناوين ورؤوس أقلام مكثفة)</option>
                <option value="medium">متوسط (نقاط مفتاحية مع شروحات)</option>
                <option value="detailed">مفصل (شامل مع مؤشرات وأمثلة)</option>
              </select>
            </div>

            {/* Tone */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-slate-300 font-semibold block">النبرة والأسلوب:</label>
              <select
                value={settings.tone}
                onChange={(e) => setSettings({ ...settings, tone: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              >
                <option value="professional">مهنية وتنفيذية (Professional)</option>
                <option value="inspiring">ملهمة ومحفزة (Inspiring)</option>
                <option value="academic">أكاديمية وبحثية (Academic)</option>
                <option value="creative">إبداعية وجريئة (Creative)</option>
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
              <label className="text-slate-300 font-semibold block">النسبة البصرية للشاشة:</label>
              <select
                value={settings.aspectRatio}
                onChange={(e) => setSettings({ ...settings, aspectRatio: e.target.value as any })}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white"
              >
                <option value="16:9">16:9 شاشة عريضة حديثة (Widescreen)</option>
                <option value="4:3">4:3 كلاسيكي تقليدي (Standard)</option>
              </select>
            </div>
          </div>

          {/* Toggles & Folder */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.includeCharts}
                  onChange={(e) => setSettings({ ...settings, includeCharts: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>تضمين رسوم بيانية PowerPoint تفاعلية أصلية (n22)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.includeImages}
                  onChange={(e) => setSettings({ ...settings, includeImages: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>تضمين صور مرخصة من المكتبة المحلية (n22)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={settings.offlineOnly}
                  onChange={(e) => setSettings({ ...settings, offlineOnly: e.target.checked })}
                  className="rounded text-teal-600"
                />
                <span>وضع عدم الاتصال (Offline mode: منع أي استدعاء خارجي)</span>
              </label>
            </div>

            <div className="space-y-1.5">
              <label className="text-slate-300 font-semibold block">مجلد حفظ المشروع:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={settings.saveFolderPath}
                  onChange={(e) => setSettings({ ...settings, saveFolderPath: e.target.value })}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono text-[11px]"
                />
                <button
                  type="button"
                  className="px-3 bg-slate-800 text-slate-200 rounded-lg text-xs hover:bg-slate-700"
                >
                  <Folder className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>رجوع</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition"
            >
              <span>متابعة إلى مراجعة المخطط</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: INTERACTIVE OUTLINE REVIEW (Core n3 Feature) */}
      {currentStep === 3 && (
        <div className="space-y-5">
          <div className="flex items-center justify-between pb-2">
            <div className="text-xs text-slate-400">
              يمكنك تعديل عناوين الشرائح، إعادة ترتيبها، تغيير نوع التخطيط المقترح، أو إضافة وحذف شرائح.
            </div>
            <button
              type="button"
              onClick={handleAddSlide}
              className="px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة شريحة جديدة</span>
            </button>
          </div>

          {/* Slides Outline List */}
          <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
            {outlineSlides.map((slide, index) => (
              <div
                key={slide.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 transition hover:border-slate-700"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 flex-1">
                    <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-teal-400 font-mono text-xs flex items-center justify-center font-bold">
                      {slide.order}
                    </span>
                    <input
                      type="text"
                      value={slide.title}
                      onChange={(e) => handleUpdateSlideTitle(slide.id, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  {/* Actions: Reorder, Layout, Lock, Delete */}
                  <div className="flex items-center gap-1.5">
                    <select
                      value={slide.suggestedLayout}
                      onChange={(e) => handleUpdateSlideLayout(slide.id, e.target.value as SlideLayoutType)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-[11px] text-slate-300"
                    >
                      <option value="title">شريحة عنوان رئيسي</option>
                      <option value="title-content">عنوان ومحتوى</option>
                      <option value="two-columns">عمودان متوازيان</option>
                      <option value="metrics">أرقام وإحصائيات</option>
                      <option value="comparison">مقارنة جدولية</option>
                      <option value="conclusion">خاتمة وتوصيات</option>
                    </select>

                    <button
                      type="button"
                      disabled={index === 0}
                      onClick={() => handleMoveUp(index)}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                      title="تحريك لأعلى"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={index === outlineSlides.length - 1}
                      onClick={() => handleMoveDown(index)}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-30"
                      title="تحريك لأسفل"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleLock(slide.id)}
                      className={`p-1.5 border rounded-lg ${
                        slide.locked
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-400'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title={slide.locked ? 'المخطط مقفل (لن يُعدل آلياً)' : 'قفل الشريحة'}
                    >
                      {slide.locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSlide(slide.id)}
                      className="p-1.5 bg-slate-900 border border-slate-800 rounded-lg text-red-400 hover:text-red-300"
                      title="حذف الشريحة"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Bullets preview */}
                <div className="pr-8 flex flex-wrap gap-2">
                  {slide.bullets.map((b, bIdx) => (
                    <span
                      key={bIdx}
                      className="text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800"
                    >
                      • {b}
                    </span>
                  ))}
                  {slide.notes && (
                    <span className="text-[10px] text-slate-500 italic">
                      [ملاحظات: {slide.notes}]
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>رجوع للإعدادات</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition"
            >
              <span>تثبيت المخطط والانتقال للاعتماد</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: REVIEW & SAVE PROJECT */}
      {currentStep === 4 && (
        <div className="space-y-5">
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-white">ملخص المشروع والمخطط المعتمد</h3>
              </div>
              <span className="text-xs font-mono text-teal-400 bg-teal-950/30 px-2.5 py-0.5 rounded border border-teal-500/20">
                {outlineSlides.length} شرائح موثقة
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">الموضوع:</span>
                <span className="font-semibold text-white">{topic}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">اللغة والاتجاه:</span>
                <span className="font-semibold text-white">{settings.language === 'ar' ? 'عربي (RTL)' : 'English (LTR)'}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">الجمهور المستهدف:</span>
                <span className="font-semibold text-white">{settings.audience}</span>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">النسبة البصرية:</span>
                <span className="font-semibold text-white">{settings.aspectRatio}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-300 font-semibold block text-xs mb-2">ترتيب الشرائح المعتمد للحفظ:</span>
              <ol className="list-decimal list-inside space-y-1 text-xs text-slate-300">
                {outlineSlides.map((s) => (
                  <li key={s.id}>
                    <strong className="text-teal-300">{s.title}</strong>{' '}
                    <span className="text-slate-500 font-mono text-[10px]">({s.suggestedLayout})</span>
                  </li>
                ))}
              </ol>
            </div>

            {projectSaved ? (
              <div className="p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>تم حفظ وتثبيت المخطط بنجاح في حزمة المشروع <code className="font-mono text-white">.dexter/project.json</code>.</span>
                </div>
                <span className="font-bold bg-emerald-900/50 px-2 py-0.5 rounded text-[10px]">جاهز للمرحلة 4</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleSaveProject}
                className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10 transition"
              >
                <Save className="w-4 h-4" />
                <span>حفظ المشروع وتثبيت المخطط المعتمد</span>
              </button>
            )}
          </div>

          <div className="flex justify-start pt-2">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" />
              <span>العودة لتعديل المخطط</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
