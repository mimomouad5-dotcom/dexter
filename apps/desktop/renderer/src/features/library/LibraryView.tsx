// Component: n6 المكتبة والمراجع (Library & Sources) & n29 Importer & n16 Task Manager
import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  FolderSearch,
  FileText,
  AlertCircle,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Layers,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  Eye,
  Sliders,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  StopCircle
} from 'lucide-react';

export interface LibraryFileItem {
  id: number;
  path: string;
  name: string;
  sha256: string;
  size: number;
  type: string;
  status: string;
  error?: string | null;
  source: string;
  license?: string | null;
  indexed_at: string;
  meta: {
    subtype?: string;
    slide_count?: number;
    aspect_ratio?: string;
    width_emu?: number;
    height_emu?: number;
    titles?: string[];
    layouts?: string[];
    total_shapes?: number;
    total_charts?: number;
    total_tables?: number;
    total_images?: number;
    has_notes?: boolean;
    is_template_candidate?: boolean;
    template_score?: number;
    duplicate_of?: string | null;
  };
}

export function LibraryView() {
  const [files, setFiles] = useState<LibraryFileItem[]>([
    {
      id: 1,
      path: '/home/user/templates/corporate_master_2026.pptx',
      name: 'corporate_master_2026.pptx',
      sha256: '9f83a21...d8a2',
      size: 1420500,
      type: 'presentation',
      status: 'valid',
      source: 'local_library',
      indexed_at: '2026-10-11 18:00',
      meta: {
        subtype: 'pptx',
        slide_count: 12,
        aspect_ratio: '16:9',
        width_emu: 12192000,
        height_emu: 6858000,
        titles: ['استراتيجية التحول الرقمي 2026', 'أهداف الربع الأول', 'المؤشرات المالية الرئيسية', 'خارطة طريق التطوير'],
        layouts: ['Title Slide', 'Title and Content', 'Two Content', 'Comparison'],
        total_shapes: 48,
        total_charts: 4,
        total_tables: 2,
        total_images: 8,
        has_notes: true,
        is_template_candidate: true,
        template_score: 0.95
      }
    },
    {
      id: 2,
      path: '/home/user/templates/investor_pitch_deck.pptx',
      name: 'investor_pitch_deck.pptx',
      sha256: 'a1b2c3d...4e5f',
      size: 890000,
      type: 'presentation',
      status: 'valid',
      source: 'local_library',
      indexed_at: '2026-10-11 18:02',
      meta: {
        subtype: 'pptx',
        slide_count: 8,
        aspect_ratio: '16:9',
        width_emu: 12192000,
        height_emu: 6858000,
        titles: ['Dexter Studio Presentation', 'Problem Statement', 'Market Opportunity', 'Business Model'],
        layouts: ['Title Slide', 'Section Header', 'Title and Content'],
        total_shapes: 26,
        total_charts: 2,
        total_tables: 1,
        total_images: 4,
        has_notes: false,
        is_template_candidate: true,
        template_score: 0.85
      }
    },
    {
      id: 3,
      path: '/home/user/templates/copies/investor_pitch_deck_copy.pptx',
      name: 'investor_pitch_deck_copy.pptx',
      sha256: 'a1b2c3d...4e5f',
      size: 890000,
      type: 'presentation',
      status: 'duplicate',
      source: 'local_library',
      indexed_at: '2026-10-11 18:02',
      meta: {
        subtype: 'pptx',
        slide_count: 8,
        aspect_ratio: '16:9',
        duplicate_of: '/home/user/templates/investor_pitch_deck.pptx'
      }
    },
    {
      id: 4,
      path: '/home/user/templates/brand_guidelines.pdf',
      name: 'brand_guidelines.pdf',
      sha256: 'c3d4e5f...6a7b',
      size: 3400200,
      type: 'document',
      status: 'valid',
      source: 'local_library',
      indexed_at: '2026-10-11 18:05',
      meta: {
        subtype: 'pdf'
      }
    },
    {
      id: 5,
      path: '/home/user/templates/corrupt_sample.pptx',
      name: 'corrupt_sample.pptx',
      sha256: 'corrupt_01',
      size: 1024,
      type: 'corrupt',
      status: 'corrupt',
      error: 'Corrupt zip archive: bad CRC or truncated header',
      source: 'local_library',
      indexed_at: '2026-10-11 18:06',
      meta: {
        subtype: 'pptx'
      }
    }
  ]);

  const [activeTab, setActiveTab] = useState<'all' | 'presentation' | 'image' | 'document' | 'duplicate' | 'corrupt'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderPathInput, setFolderPathInput] = useState('/home/user/templates');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanMessage, setScanMessage] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<LibraryFileItem | null>(null);

  // Filtered files
  const filteredFiles = files.filter(f => {
    if (activeTab === 'presentation' && f.type !== 'presentation') return false;
    if (activeTab === 'image' && f.type !== 'image') return false;
    if (activeTab === 'document' && f.type !== 'document') return false;
    if (activeTab === 'duplicate' && f.status !== 'duplicate') return false;
    if (activeTab === 'corrupt' && f.status !== 'corrupt') return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !f.path.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

  const validTemplates = files.filter(f => f.type === 'presentation' && f.status === 'valid');
  const duplicates = files.filter(f => f.status === 'duplicate');
  const corrupted = files.filter(f => f.status === 'corrupt');

  const startScanSimulation = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanMessage('بدء قراءة المجلد وفحص البصمات السحرية...');

    let p = 0;
    const interval = setInterval(() => {
      p += 25;
      if (p <= 100) {
        setScanProgress(p);
        if (p === 25) setScanMessage('تصنيف الملفات السحرية (Magic Bytes) واستبعاد غير المتطابقة...');
        if (p === 50) setScanMessage('كشف التكرار عبر البصمات السريعة وSHA-256...');
        if (p === 75) setScanMessage('استخراج بيانات القوالب والشرائح (OOXML Read-Only)...');
        if (p === 100) {
          setScanMessage('اكتملت الفهرسة وحفظ السجلات في SQLite بنجاح.');
          setIsScanning(false);
          clearInterval(interval);
        }
      }
    }, 400);
  };

  const cancelScan = () => {
    setIsScanning(false);
    setScanMessage('تم إلغاء عملية الفهرسة بطلب من المستخدم (Rollback آمن).');
  };

  const removeFromIndex = (id: number) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedTemplate?.id === id) {
      setSelectedTemplate(null);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      {/* Header and Architecture ID */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
              n6 Library & Sources
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              n29 Importer & Dedupe
            </span>
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
              n40 SQLite & n42 Library
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mt-1.5 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-teal-400" />
            مكتبة القوالب، الفهرسة، وكشف التكرار
          </h2>
          <p className="text-xs text-slate-400">
            فهرسة ذكية وقراءة فقط (Read-Only) مع فحص البصمات السحرية، واستخراج بيانات القوالب المتقدمة، وكشف التكرار ثلاثي المراحل.
          </p>
        </div>

        {/* Stats Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">الملفات المفهرسة</div>
            <div className="text-sm font-bold text-white font-mono">{files.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-teal-950/40 border border-teal-500/30 text-center">
            <div className="text-[10px] text-teal-400">قوالب وعروض</div>
            <div className="text-sm font-bold text-teal-300 font-mono">{validTemplates.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-center">
            <div className="text-[10px] text-amber-400">ملفات مكررة</div>
            <div className="text-sm font-bold text-amber-300 font-mono">{duplicates.length}</div>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-center">
            <div className="text-[10px] text-rose-400">ملفات تالفة</div>
            <div className="text-sm font-bold text-rose-300 font-mono">{corrupted.length}</div>
          </div>
        </div>
      </div>

      {/* Scan Trigger Bar */}
      <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FolderSearch className="w-4 h-4 text-teal-400" />
            <span className="text-xs font-semibold text-slate-200">مسح مجلد جديد لفهرسة القوالب والملفات</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>قراءة فقط — لا يتم تعديل أو حذف أي ملف على قرص المستخدم</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={folderPathInput}
            onChange={(e) => setFolderPathInput(e.target.value)}
            placeholder="أدخل مسار المجلد (e.g. C:\Presentations or /home/user/templates)"
            className="flex-1 min-w-[280px] bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
          {!isScanning ? (
            <button
              onClick={startScanSimulation}
              className="px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-teal-500/20"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>بدء الفهرسة الذكية</span>
            </button>
          ) : (
            <button
              onClick={cancelScan}
              className="px-4 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/30 font-bold text-xs flex items-center gap-1.5 transition-all"
            >
              <StopCircle className="w-3.5 h-3.5" />
              <span>إلغاء الفهرسة التعاونية</span>
            </button>
          )}
        </div>

        {/* Live Progress Bar */}
        {(isScanning || scanMessage) && (
          <div className="space-y-1.5 pt-2 border-t border-slate-900">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 flex items-center gap-1.5">
                {isScanning && <RefreshCw className="w-3 h-3 text-teal-400 animate-spin" />}
                {scanMessage}
              </span>
              <span className="font-mono text-teal-400 font-bold">{scanProgress}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-teal-500 to-indigo-500 transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Search and Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'all' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            الكل ({files.length})
          </button>
          <button
            onClick={() => setActiveTab('presentation')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'presentation' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            قوالب PPTX ({validTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('document')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'document' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            مستندات PDF ({files.filter(f => f.type === 'document').length})
          </button>
          <button
            onClick={() => setActiveTab('duplicate')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'duplicate' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            مكررات ({duplicates.length})
          </button>
          <button
            onClick={() => setActiveTab('corrupt')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'corrupt' ? 'bg-rose-500 text-white font-bold' : 'text-slate-400 hover:text-white'
            }`}
          >
            تالفة ({corrupted.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative min-w-[220px]">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بالاسم أو المسار..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
          />
        </div>
      </div>

      {/* File & Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map((file) => (
          <div
            key={file.id}
            className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
              file.status === 'corrupt'
                ? 'bg-rose-950/20 border-rose-500/30'
                : file.status === 'duplicate'
                ? 'bg-amber-950/20 border-amber-500/30'
                : 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="space-y-2.5">
              {/* Type and status tags */}
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold uppercase">
                  {file.meta.subtype || file.type}
                </span>

                {file.status === 'valid' && file.meta.is_template_candidate && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    قالب معتمد ({Math.round((file.meta.template_score || 0) * 100)}%)
                  </span>
                )}

                {file.status === 'duplicate' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30 flex items-center gap-1">
                    <Copy className="w-3 h-3" />
                    نسخة مكررة
                  </span>
                )}

                {file.status === 'corrupt' && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30 flex items-center gap-1">
                    <XCircle className="w-3 h-3" />
                    ملف تالف
                  </span>
                )}
              </div>

              {/* Title & Path */}
              <div>
                <h4 className="text-sm font-bold text-white truncate" title={file.name}>
                  {file.name}
                </h4>
                <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5" title={file.path}>
                  {file.path}
                </p>
              </div>

              {/* Structural stats for PPTX */}
              {file.type === 'presentation' && file.meta.slide_count && (
                <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-900 text-center">
                  <div className="bg-slate-900/60 p-1.5 rounded-lg">
                    <div className="text-[10px] text-slate-400">الشرائح</div>
                    <div className="text-xs font-bold text-white font-mono">{file.meta.slide_count}</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg">
                    <div className="text-[10px] text-slate-400">النسبة</div>
                    <div className="text-xs font-bold text-teal-400 font-mono">{file.meta.aspect_ratio || '16:9'}</div>
                  </div>
                  <div className="bg-slate-900/60 p-1.5 rounded-lg">
                    <div className="text-[10px] text-slate-400">العناصر</div>
                    <div className="text-xs font-bold text-white font-mono">{file.meta.total_shapes || 0}</div>
                  </div>
                </div>
              )}

              {/* Duplicate or Corrupt notes */}
              {file.status === 'duplicate' && file.meta.duplicate_of && (
                <div className="text-[10px] text-amber-300/80 bg-amber-950/40 p-2 rounded-lg border border-amber-500/20">
                  <span>مطابق تماماً لـ: </span>
                  <span className="font-mono text-amber-200 truncate block mt-0.5">
                    {file.meta.duplicate_of.split('/').pop()}
                  </span>
                </div>
              )}

              {file.status === 'corrupt' && file.error && (
                <div className="text-[10px] text-rose-300/90 bg-rose-950/40 p-2 rounded-lg border border-rose-500/20 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{file.error}</span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-900">
              <span className="text-[10px] text-slate-500 font-mono">
                {(file.size / 1024).toFixed(1)} KB
              </span>
              <div className="flex items-center gap-1.5">
                {file.type === 'presentation' && file.status === 'valid' && (
                  <button
                    onClick={() => setSelectedTemplate(file)}
                    className="p-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs flex items-center gap-1 transition-all"
                    title="فحص تفاصيل القالب"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>فحص</span>
                  </button>
                )}
                <button
                  onClick={() => removeFromIndex(file.id)}
                  className="p-1.5 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition-all"
                  title="إزالة من الفهرس (دون حذف الملف من القرص)"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800 text-slate-400 text-xs space-y-1">
          <BookOpen className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="font-semibold text-slate-300">لا توجد ملفات مطابقة للبحث أو التصفية الحالية</p>
          <p className="text-[11px] text-slate-500">جرب مسح مجلد جديد أو تغيير تبويب التصفية أعلاه.</p>
        </div>
      )}

      {/* Template Inspector Modal */}
      {selectedTemplate && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">تفاصيل هيكل القالب المعتمد</h3>
              </div>
              <button
                onClick={() => setSelectedTemplate(null)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <span className="text-[10px] text-slate-400">اسم الملف والمسار</span>
                <p className="text-xs font-mono text-teal-300 break-all">{selectedTemplate.path}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">عدد الشرائح</div>
                  <div className="text-sm font-bold text-white font-mono">{selectedTemplate.meta.slide_count}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">النسبة البصرية</div>
                  <div className="text-sm font-bold text-teal-400 font-mono">{selectedTemplate.meta.aspect_ratio}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">الأشكال والرسوم</div>
                  <div className="text-sm font-bold text-white font-mono">{selectedTemplate.meta.total_shapes}</div>
                </div>
                <div className="p-2 rounded-xl bg-slate-950 border border-slate-800">
                  <div className="text-[10px] text-slate-400">رسوم بيانية</div>
                  <div className="text-sm font-bold text-indigo-400 font-mono">{selectedTemplate.meta.total_charts || 0}</div>
                </div>
              </div>

              {/* Titles extracted */}
              {selectedTemplate.meta.titles && selectedTemplate.meta.titles.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">عناوين الشرائح المستخرجة من القالب:</span>
                  <div className="mt-1 max-h-36 overflow-y-auto space-y-1 bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                    {selectedTemplate.meta.titles.map((title, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-[10px] text-teal-500 w-4">{idx + 1}.</span>
                        <span>{title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Layouts in master */}
              {selectedTemplate.meta.layouts && selectedTemplate.meta.layouts.length > 0 && (
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold">التخطيطات المعتمدة (Master Layouts):</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {selectedTemplate.meta.layouts.map((lay, idx) => (
                      <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                        {lay}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
