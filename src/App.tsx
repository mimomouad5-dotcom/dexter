/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
// Component: n2 واجهة Electron Renderer (React 19 + TypeScript)
import React, { useState } from 'react';
import {
  ShieldCheck,
  Cpu,
  Layers,
  FileSpreadsheet,
  Settings,
  BookOpen,
  Sparkles,
  Layout,
  Palette,
  CheckCircle2,
  AlertTriangle,
  FolderTree,
  Terminal,
  Activity,
  Server,
  Lock,
  ArrowRight,
  RefreshCw,
  FileCode,
  Check,
  ChevronRight
} from 'lucide-react';

import { WizardFlow } from '../apps/desktop/renderer/src/features/wizard/WizardFlow.tsx';
import { EditorSkeleton } from '../apps/desktop/renderer/src/features/editor/EditorSkeleton.tsx';
import { DesignPreviewSkeleton } from '../apps/desktop/renderer/src/features/designPreview/DesignPreviewSkeleton.tsx';
import { LibrarySkeleton } from '../apps/desktop/renderer/src/features/library/LibrarySkeleton.tsx';
import { SettingsSkeleton } from '../apps/desktop/renderer/src/features/settings/SettingsSkeleton.tsx';

export default function App() {
  const [lang, setLang] = useState<'ar' | 'en'>('ar');
  const [viewMode, setViewMode] = useState<'screens' | 'data-model' | 'phase1-audit' | 'architecture' | 'report'>('screens');
  const [activeScreen, setActiveScreen] = useState<'wizard' | 'editor' | 'design' | 'library' | 'settings'>('library');
  const [testPx, setTestPx] = useState<number>(100);

  return (
    <div
      dir={lang === 'ar' ? 'rtl' : 'ltr'}
      className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-teal-500 selection:text-slate-950 flex flex-col"
    >
      {/* Top Application Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur-md px-6 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-white font-black text-xl">
            D
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight">
                Dexter Presentation Studio
              </h1>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/30 font-semibold">
                {lang === 'ar' ? 'المرحلة 6: مكتبة القوالب، الفهرسة وكشف التكرار n29/n42 مكتملة' : 'Phase 6 Library & Templates Ready'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'Monorepo Architecture (n2, n6, n8, n10, n11, n14, n16, n23, n27, n28, n29, n32, n40, n42, n44, n46)'
                : 'Desktop Skeleton, Python Engine & Verified PPTX Exporter'}
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-3">
          <nav className="flex items-center bg-slate-950/70 p-1 rounded-xl border border-slate-800 text-xs font-medium">
            <button
              onClick={() => setViewMode('screens')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'screens'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'شاشات العرض (n3-n7)' : 'App Screens (n3-n7)'}</span>
            </button>
            <button
              onClick={() => setViewMode('data-model')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'data-model'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'النموذج الموحد n23 ⭐' : 'Unified Model n23'}</span>
            </button>
            <button
              onClick={() => setViewMode('phase1-audit')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'phase1-audit'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'سجل التدقيق' : 'Audit Log'}</span>
            </button>
            <button
              onClick={() => setViewMode('architecture')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'architecture'
                  ? 'bg-teal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>{lang === 'ar' ? 'المعمارية والمخطط' : 'Architecture'}</span>
            </button>
              <button
                onClick={() => setViewMode('report')}
                className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  viewMode === 'report'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'تقرير المرحلة 6' : 'Phase 6 Report'}</span>
              </button>
          </nav>

          <button
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 transition"
          >
            {lang === 'ar' ? 'English' : 'عربي'}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-6">
        {/* VIEW 1: SCREENS NAVIGATION (n3 - n7) */}
        {viewMode === 'screens' && (
          <div className="space-y-5">
            {/* Screen Navigation Tabs */}
            <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <button
                onClick={() => setActiveScreen('wizard')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                  activeScreen === 'wizard'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>n3 {lang === 'ar' ? 'معالج الإنشاء' : 'Wizard'}</span>
              </button>
              <button
                onClick={() => setActiveScreen('editor')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                  activeScreen === 'editor'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Layout className="w-3.5 h-3.5" />
                <span>n4 {lang === 'ar' ? 'المحرر والكانفاس' : 'Editor Canvas'}</span>
              </button>
              <button
                onClick={() => setActiveScreen('design')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                  activeScreen === 'design'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Palette className="w-3.5 h-3.5" />
                <span>n5 {lang === 'ar' ? 'معاينة التصاميم' : 'Design Preview'}</span>
              </button>
              <button
                onClick={() => setActiveScreen('library')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                  activeScreen === 'library'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>n6 {lang === 'ar' ? 'المكتبة والمراجع' : 'Library & Sources'}</span>
              </button>
              <button
                onClick={() => setActiveScreen('settings')}
                className={`px-3.5 py-2 rounded-lg text-xs font-medium transition flex items-center gap-2 ${
                  activeScreen === 'settings'
                    ? 'bg-teal-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <Settings className="w-3.5 h-3.5" />
                <span>n7 {lang === 'ar' ? 'الإعدادات والخصوصية' : 'Settings & Privacy'}</span>
              </button>
            </div>

            {/* Active Screen Component */}
            {activeScreen === 'wizard' && <WizardFlow />}
            {activeScreen === 'editor' && <EditorSkeleton />}
            {activeScreen === 'design' && <DesignPreviewSkeleton />}
            {activeScreen === 'library' && <LibrarySkeleton />}
            {activeScreen === 'settings' && <SettingsSkeleton />}
          </div>
        )}

        {/* VIEW 2: PHASE 1 AUDIT & INTEGRATION VERIFICATION */}
        {viewMode === 'phase1-audit' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Card 1: n8 Main Process */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-teal-400">n8 Electron Main</span>
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    Active & Verified
                  </span>
                </div>
                <div className="text-sm font-bold text-white">BrowserWindow & Sandbox Guard</div>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>contextIsolation: true</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>nodeIntegration: false</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-400" />
                    <span>sandbox: true</span>
                  </li>
                </ul>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                  apps/desktop/electron/main.ts
                </div>
              </div>

              {/* Card 2: n10 IPC Gateway */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-cyan-400">n10 IPC Gateway</span>
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    Active & Verified
                  </span>
                </div>
                <div className="text-sm font-bold text-white">Path Guard & Token Forwarding</div>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>حظر محاولات Traversal (..)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>حقن ترويسة Bearer Token</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                    <span>حظر الروابط غير المصرح بها</span>
                  </li>
                </ul>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                  apps/desktop/electron/ipc/gateway.ts
                </div>
              </div>

              {/* Card 3: n11 Python Manager */}
              <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-indigo-400">n11 Python Manager</span>
                  <span className="text-[11px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-medium">
                    Active & Verified
                  </span>
                </div>
                <div className="text-sm font-bold text-white">Service Lifecycle & Token Gen</div>
                <ul className="text-xs text-slate-300 space-y-1.5">
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>توليد 32-Byte Crypto Token</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>إسناد منفذ عشوائي حر 127.0.0.1</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>إغلاق آمن دون عمليات يتيمة</span>
                  </li>
                </ul>
                <div className="text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
                  apps/desktop/electron/service/pythonManager.ts
                </div>
              </div>
            </div>

            {/* Backend Verification Box */}
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">
                    {lang === 'ar' ? 'خدمة بايثون المحلية n14 ومسجل السجلات الآمنة n32' : 'Python Local Service n14 & Safe Logger n32'}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {lang === 'ar'
                      ? 'تم اختبار خدمة FastAPI ووحدة حجب الأسرار بنجاح عبر اختبارات pytest الآلية.'
                      : 'FastAPI service and automated secret redaction validated with pytest.'}
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20 font-mono">
                  5/5 pytest Passed
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed space-y-2">
                <div className="text-teal-400 font-bold">
                  $ PYTHONPATH=services/engine python3 -m pytest services/engine/tests/test_router_and_logger.py -v
                </div>
                <div className="text-emerald-400">
                  PASSED: test_safe_logger_redaction (حجب مفاتيح sk-... وتوكنات Bearer)
                </div>
                <div className="text-emerald-400">
                  PASSED: test_health_without_token (رفض الطلبات غير المصرح بها برمز 401)
                </div>
                <div className="text-emerald-400">
                  PASSED: test_health_with_invalid_token (رفض التوكنات الخاطئة برمز 401)
                </div>
                <div className="text-emerald-400">
                  PASSED: test_health_with_valid_token (استجابة 200 وحالة healthy للتوكن الصحيح)
                </div>
                <div className="text-emerald-400">
                  PASSED: test_system_info_endpoint (إرجاع معلومات النظام وعزل localhost_only)
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 3: ARCHITECTURE */}
        {viewMode === 'architecture' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">
              {lang === 'ar' ? 'بنية المستودع المعتمدة (Monorepo Layout)' : 'Approved Monorepo Layout'}
            </h3>
            <p className="text-xs text-slate-400">
              {lang === 'ar'
                ? 'مطابقة حرفية للقسم 3 من وثيقة المعمارية. تم إنشاء كافة المجلدات والملفات المطلوبة للمرحلة 1.'
                : '100% compliant with Section 3 of the architecture document.'}
            </p>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto">
{`dexter-presentation-studio/
├── apps/
│   └── desktop/
│       ├── electron/
│       │   ├── main.ts                     # n8 Electron Main Process
│       │   ├── preload.ts                  # n9 Preload محدود (Zod Guard)
│       │   ├── ipc/
│       │   │   ├── gateway.ts              # n10 IPC Gateway
│       │   │   └── pathGuard.ts            # n10 فاحص المسارات الآمن
│       │   ├── service/
│       │   │   └── pythonManager.ts        # n11 إدارة خدمة Python
│       │   └── secrets/
│       │       └── credentialStore.ts      # n44 مخزن الأسرار المشفر
│       └── renderer/src/features/
│           ├── wizard/WizardSkeleton.tsx   # n3 معالج الإنشاء
│           ├── editor/EditorSkeleton.tsx   # n4 محرر الشرائح
│           ├── designPreview/DesignPreviewSkeleton.tsx # n5 معاينة التصاميم
│           ├── library/LibrarySkeleton.tsx # n6 المكتبة والمراجع
│           └── settings/SettingsSkeleton.tsx # n7 الإعدادات والخصوصية
├── services/
│   └── engine/
│       ├── dexter_engine/
│       │   ├── api/router.py               # n14 Local API Router (FastAPI)
│       │   └── logging/safe_logger.py      # n32 السجلات الآمنة (Redaction)
│       └── tests/
│           └── test_router_and_logger.py   # pytest suite for n14 & n32
├── poc/                                    # تجارب المرحلة 0 المكتملة
└── docs/                                   # وثائق المعمارية والقرارات`}
            </pre>
          </div>
        )}

        {/* VIEW: UNIFIED PRESENTATION MODEL n23 */}
        {viewMode === 'data-model' && (
          <div className="space-y-6">
            <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-5 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
                      n23 Unified Presentation Model ⭐
                    </span>
                    <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      المصدر الوحيد للحقيقة (Single Source of Truth)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">
                    نموذج العرض الموحد بوحدات EMU وتوافق تام مع Pydantic v2 وTypeScript
                  </h3>
                  <p className="text-xs text-slate-400">
                    المصدر المشترك بين محرر الكانفاس n4، محرك التصميم n24، وفاحص الجودة n26، ومصدّر PPTX n27.
                  </p>
                </div>
                <div className="text-xs font-mono bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-teal-300">
                  schema_version: "1.0.0"
                </div>
              </div>

              {/* EMU Interactive Calculator */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-teal-400">
                    <Cpu className="w-4 h-4" />
                    <span>محول الإحداثيات الدقيق: Screen Pixels (96 DPI) ⟷ OpenXML EMUs</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">1 Inch = 914,400 EMUs = 96 Pixels</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">القيمة بالبكسل على الشاشة (Pixels):</label>
                    <input
                      type="number"
                      value={testPx}
                      onChange={(e) => setTestPx(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">القيمة المقابلة بوحدة EMU (المخزنة في النموذج):</span>
                    <span className="font-mono text-sm font-bold text-teal-300">
                      {Math.round((testPx * 914400) / 96).toLocaleString()} EMU
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-400 block text-[10px]">أبعاد شريحة Widescreen (16:9):</span>
                    <span className="font-mono text-[11px] text-slate-200">
                      12,192,000 × 6,858,000 EMU (13.333" × 7.5")
                    </span>
                  </div>
                </div>
              </div>

              {/* Model Entities Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-teal-400"></span>
                    <span>العناصر (SlideElement)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    يدعم أنواع: <code className="text-teal-300">text</code>, <code className="text-teal-300">image</code>, <code className="text-teal-300">shape</code>, <code className="text-teal-300">chart</code>, <code className="text-teal-300">table</code>.
                    كل عنصر يملك إطار EMU، وترتيب طبقي z، ونمط Style، وحركة موثقة verified.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                    <span>الشرائح (Slide)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    ترتيب تسلسلي order، معرّف تخطيط layout_id، قائمة عناصر، ملاحظات متحدث notes، انتقال transition، وارتباط بالادعاءات claim_ids.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    <span>الترحيل والتحقق (Migrations)</span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    محرك الترحيل الآلي <code className="text-amber-300">migrate_presentation_data</code> يرفع الملفات القديمة (0.9.0) تلقائياً إلى 1.0.0 مع ضمان عدم فقدان البيانات.
                  </p>
                </div>
              </div>

              {/* Sample Live JSON Tree */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>هيكل الكائن النموذجي المتوافق مع Pydantic v2 (Round-trip verified):</span>
                  <span className="font-mono text-emerald-400 text-[11px]">13 pytest unit tests passed</span>
                </div>
                <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-[11px] text-slate-300 leading-relaxed max-h-56 overflow-y-auto">
{`{
  "schema_version": "1.0.0",
  "presentation": {
    "id": "pres-2026-demo",
    "title": "عرض استراتيجية التحول الرقمي",
    "language": "ar",
    "direction": "rtl",
    "aspect_ratio": "16:9",
    "theme_id": "emerald-executive",
    "slides": [
      {
        "id": "slide-01",
        "order": 1,
        "layout_id": "title-content",
        "elements": [
          {
            "id": "el-text-1",
            "type": "text",
            "frame": { "x": 914400, "y": 914400, "w": 9144000, "h": 1371600, "unit": "emu" },
            "style": { "font_family": "Cairo", "font_size_pt": 32, "is_rtl": true },
            "content": { "text": "استراتيجية الذكاء الاصطناعي 2026" },
            "animation": { "effect_id": "appear", "verified": true }
          }
        ],
        "notes": "ملاحظات المتحدث المعتمدة",
        "transition": { "effect_id": "fade", "verified": true }
      }
    ]
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* VIEW: FORMAL PHASE 6 REPORT */}
        {viewMode === 'report' && (
          <div className="p-6 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {lang === 'ar' ? 'تقرير المرحلة 6 — مكتبة القوالب، الفهرسة، وكشف التكرار (n6, n29, n16, n40, n42)' : 'Phase 6 Report — Templates Library, Indexer & Deduplication'}
              </h3>
              <span className="text-xs px-2.5 py-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                الحالة: بانتظار الموافقة ⏸
              </span>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4 text-xs text-slate-300 leading-relaxed">
              <div>
                <strong className="text-teal-400 text-sm block mb-1">
                  {lang === 'ar' ? '1. التاريخ والمكونات المنفذة' : '1. Date & Implemented Components'}
                </strong>
                <p>• التاريخ: 11 أكتوبر 2026</p>
                <p>• المكونات المنفذة: n29 مستورد وفهرسة المكتبة، n6 واجهة المكتبة والمراجع، n16 مدير المهام، n40 جداول SQLite (library_files, library_meta, tasks)، n42 مجلد المكتبة الأصلي (قراءة فقط)، ونقاط نهاية API (/library/scan, /library/files, /library/duplicates, /tasks/{'{task_id}'}, /tasks/{'{task_id}'}/cancel).</p>
              </div>

              <div>
                <strong className="text-teal-400 text-sm block mb-1">
                  {lang === 'ar' ? '2. بحث مجمعات GitHub والقرارات المعتمدة (DEC-005)' : '2. GitHub Best Practices & Adopted Decisions'}
                </strong>
                <ul className="list-disc list-inside space-y-1 text-slate-300 pr-2">
                  <li><strong>كشف التكرار ثلاثي المراحل:</strong> تصفية أولية بالأحجام المتطابقة، ثم هاش سريع لبداية ونهاية الملف (Head/Tail 4KB)، ثم هاش كامل SHA-256 بتدفق 64KB لحماية الذاكرة وسرعة المسح.</li>
                  <li><strong>التصنيف بالبصمات السحرية (Magic Bytes):</strong> التحقق الصارم من ترويسات الملفات (PK Zip / OOXML لـ PPTX، و%PDF-، وPNG، وJPEG) وعدم الاعتماد على الامتداد لحماية النظام من الملفات المزيفة.</li>
                  <li><strong>استخراج بيانات القوالب الذكية:</strong> قراءة عدد الشرائح، النسبة البصرية (16:9 و4:3)، عناوين الشرائح، والتخطيطات المعتمدة (Master Layouts) في وضع القراءة الصرف دون تعديل أي ملف.</li>
                  <li><strong>الأمان والإلغاء التعاوني:</strong> منع تتبع الروابط الرمزية (followlinks=False) لحظر الالتفاف، مع التراجع الذري (Rollback) في SQLite عند الإلغاء.</li>
                </ul>
              </div>

              <div>
                <strong className="text-teal-400 text-sm block mb-1">
                  {lang === 'ar' ? '3. ما نُفّذ واختُبر فعلياً والنتائج' : '3. Executed & Verified Tests'}
                </strong>
                <p>• تشغيل 21 اختبار pytest لوحدة المحرك والمكتبة بنجاح تام 100%:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-300 pr-2">
                  <li><code>test_magic_classifier_file_types</code>: اجتياز تصنيف PNG, PDF, Markdown, Corrupt zip, وExecutable binary.</li>
                  <li><code>test_template_metadata_extraction</code>: اجتياز استخراج عدد الشرائح، النسبة البصرية، والعناوين بدقة من PPTX حقيقي.</li>
                  <li><code>test_deduplication_pipeline</code>: اجتياز كشف التطابق المتطابق بـ SHA-256.</li>
                  <li><code>test_full_library_scan_and_query</code>: اجتياز المسح الشامل وتجميع المكررات والاستعلام المشترك مع البيانات الوصفية.</li>
                  <li><code>test_scan_cooperative_cancellation</code>: اجتياز الإلغاء التعاوني الآمن دون أي بقايا مشوهة.</li>
                </ul>
                <p>• تشغيل اختبار التكامل الشامل لسطح المكتب <code>test_phase6_integration.ts</code>: فحص دورة حياة المحرك، بدء المسح غير المتزامن عبر IPC، استقصاء شريط التقدم، كشف المكررات والتالفات، التحقق من عدم حذف أي ملف من قرص المستخدم عند إزالته من الفهرس، وإيقاف العملية بنجاح 100%.</p>
              </div>

              <div>
                <strong className="text-teal-400 text-sm block mb-1">
                  {lang === 'ar' ? '4. التوصية بالخطوة التالية' : '4. Recommended Next Step'}
                </strong>
                <p className="text-emerald-400 font-medium">
                  اعتماد المرحلة 6 والموافقة على الانتقال إلى <strong>المرحلة 7 — موفّر الذكاء الاصطناعي المحلي (n18 Provider Manager: Local, n34 Ollama / Local API, n7 Provider UI)</strong> لاكتشاف خدمات Ollama المحلية وإدارتها دون أي اتصالات خارجية.
                </p>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
