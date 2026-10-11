// Component: n7 الإعدادات و API Keys (Providers, Privacy) & n40 & n44 & n31
import React, { useState } from 'react';
import {
  Settings,
  Shield,
  KeyRound,
  Cpu,
  Database,
  CheckCircle2,
  AlertCircle,
  Save,
  Download,
  Upload,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

export function SettingsSkeleton() {
  const [providerMode, setProviderMode] = useState<'local' | 'external' | 'auto'>('local');
  const [direction, setDirection] = useState<'rtl' | 'ltr'>('rtl');
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(30);
  const [selectedTheme, setSelectedTheme] = useState<string>('emerald-dark');
  
  // API Key management state
  const [newKey, setNewKey] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<string>('openai');
  const [maskedKeys, setMaskedKeys] = useState<Array<{ provider: string; masked: string }>>([
    { provider: 'openai', masked: '••••••••7890' },
  ]);
  const [showKeySavedNotification, setShowKeySavedNotification] = useState<boolean>(false);

  // Backup state
  const [backupStatus, setBackupStatus] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  const handleSaveApiKey = () => {
    if (!newKey || newKey.length < 6) return;
    const lastFour = newKey.slice(-4);
    setMaskedKeys((prev) => [
      ...prev.filter((k) => k.provider !== selectedProvider),
      { provider: selectedProvider, masked: `••••••••${lastFour}` },
    ]);
    setNewKey('');
    setShowKeySavedNotification(true);
    setTimeout(() => setShowKeySavedNotification(false), 3000);
  };

  const handleDeleteKey = (provider: string) => {
    setMaskedKeys((prev) => prev.filter((k) => k.provider !== provider));
  };

  const handleCreateBackup = () => {
    setBackupStatus('جاري تجهيز الأرشيف المتسق (SQLite Snapshot + Projects JSON)...');
    setTimeout(() => {
      setBackupStatus('تم إنشاء النسخة الاحتياطية بنجاح: dexter_backup_20261011.zip (SHA-256 مُتحقَّق)');
    }, 800);
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
              n7 Settings & Privacy (المرحلة 2)
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              نشط ومربوط بـ SQLite ومخزن الأسرار
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5">الإعدادات، مزودات الذكاء الاصطناعي، والنسخ الاحتياطي</h2>
          <p className="text-xs text-slate-400">
            إدارة إعدادات SQLite n40، مفاتيح API المشفرة n44، والنسخ الاحتياطي المتسق n31.
          </p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-teal-400 shadow-sm">
          <Settings className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Application Preferences */}
        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Database className="w-4 h-4 text-teal-400" />
            <span>تفضيلات التخزين والواجهة (n40 SQLite Settings)</span>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 mb-1">اتجاه العرض الافتراضي:</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('rtl')}
                  className={`flex-1 py-1.5 rounded-lg border font-medium transition ${
                    direction === 'rtl'
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  من اليمين إلى اليسار (RTL - العربية)
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('ltr')}
                  className={`flex-1 py-1.5 rounded-lg border font-medium transition ${
                    direction === 'ltr'
                      ? 'bg-teal-600 text-white border-teal-500'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  من اليسار إلى اليمين (LTR - English)
                </button>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 mb-1">فترة الحفظ التلقائي (بالثواني):</label>
              <input
                type="number"
                value={autoSaveInterval}
                onChange={(e) => setAutoSaveInterval(Number(e.target.value))}
                min={10}
                max={300}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 mb-1">نمط الثيم الافتراضي:</label>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
              >
                <option value="emerald-dark">Emerald Executive Dark (موصى به)</option>
                <option value="slate-minimal">Slate Minimalist</option>
                <option value="indigo-gradient">Indigo Dynamic</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: AI Routing Policy */}
        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Cpu className="w-4 h-4 text-indigo-400" />
            <span>سياسة توجيه المزودات (n18 Provider Manager)</span>
          </div>
          <p className="text-xs text-slate-400">
            الوضع الموصى به والافتراضي هو <strong className="text-teal-400">محلي دائمًا</strong> للحفاظ على سرية البيانات وانعدام التكاليف.
          </p>

          <div className="space-y-2 text-xs">
            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
              <input
                type="radio"
                name="routingMode"
                checked={providerMode === 'local'}
                onChange={() => setProviderMode('local')}
                className="mt-0.5 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-bold text-white block">محلي دائمًا (Ollama / Local API) — الافتراضي</span>
                <span className="text-slate-400 text-[11px]">يعمل محلياً دون أي اتصال بالإنترنت أو إرسال بيانات.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
              <input
                type="radio"
                name="routingMode"
                checked={providerMode === 'external'}
                onChange={() => setProviderMode('external')}
                className="mt-0.5 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-bold text-white block">خارجي لمهام محددة (عبر بوابة الموافقة n36)</span>
                <span className="text-slate-400 text-[11px]">يتطلب موافقة صريحة مسبقة قبل إرسال كل مهمة.</span>
              </div>
            </label>

            <label className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-900 border border-slate-800 cursor-pointer">
              <input
                type="radio"
                name="routingMode"
                checked={providerMode === 'auto'}
                onChange={() => setProviderMode('auto')}
                className="mt-0.5 text-teal-600 focus:ring-teal-500"
              />
              <div>
                <span className="font-bold text-white block">تلقائي (Automatic Hybrid)</span>
                <span className="text-slate-400 text-[11px]">يفضل المحلي مع إشعار بالسبب عند التبديل للخارجي.</span>
              </div>
            </label>
          </div>
        </div>

        {/* Section 3: Encrypted Secrets Store */}
        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <KeyRound className="w-4 h-4 text-amber-400" />
              <span>مخزن الأسرار المشفر (n44 Credential Store)</span>
            </div>
            <span className="text-[10px] text-amber-400 bg-amber-950/20 px-2 py-0.5 rounded border border-amber-500/20">
              DPAPI / SafeStorage
            </span>
          </div>
          <p className="text-xs text-slate-400">
            المفاتيح لا تُكتب أبداً في الكود أو ملفات السجلات أو قاعدة بيانات SQLite أو النسخ الاحتياطية.
          </p>

          {/* Add Key Input */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="openai">OpenAI</option>
                <option value="anthropic">Anthropic</option>
                <option value="gemini">Google Gemini</option>
              </select>
              <input
                type="password"
                placeholder="أدخل مفتاح API (مثال: sk-...)"
                value={newKey}
                onChange={(e) => setNewKey(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
              />
              <button
                type="button"
                onClick={handleSaveApiKey}
                className="px-3 py-1.5 bg-teal-600 text-white rounded-lg text-xs font-semibold hover:bg-teal-500 transition"
              >
                تشفير وحفظ
              </button>
            </div>
            {showKeySavedNotification && (
              <div className="text-[11px] text-emerald-400 bg-emerald-950/30 p-2 rounded border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>تم تشفير المفتاح بنجاح وحفظه في مخزن الأسرار دون كشفه.</span>
              </div>
            )}
          </div>

          {/* Configured Keys List */}
          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] text-slate-400 block">المفاتيح المحفوظة والمقنعة حالياً:</span>
            {maskedKeys.map((item) => (
              <div
                key={item.provider}
                className="p-2 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
              >
                <span className="font-semibold text-slate-200 capitalize">{item.provider}</span>
                <span className="font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {item.masked}
                </span>
                <button
                  onClick={() => handleDeleteKey(item.provider)}
                  className="text-red-400 hover:text-red-300 p-1"
                  title="حذف المفتاح"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Backup & Reset */}
        <div className="p-5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Download className="w-4 h-4 text-cyan-400" />
            <span>النسخ الاحتياطي والاستعادة (n31 Backup & Restore)</span>
          </div>
          <p className="text-xs text-slate-400">
            أرشيف ZIP موحد يشمل لقطة متسقة لقاعدة بيانات SQLite ومشاريع JSON مع فحص سلامة التجزئة SHA-256، خالٍ تماماً من المفاتيح السرية.
          </p>

          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={handleCreateBackup}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              <Download className="w-3.5 h-3.5 text-teal-400" />
              <span>إنشاء نسخة احتياطية ZIP</span>
            </button>
            <button
              type="button"
              onClick={() => setShowResetConfirm(true)}
              className="px-3.5 py-2 bg-red-950/30 hover:bg-red-950/50 border border-red-800/40 text-red-300 rounded-lg text-xs font-semibold flex items-center gap-2 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>مسح البيانات المحلية</span>
            </button>
          </div>

          {backupStatus && (
            <div className="text-[11px] text-teal-300 bg-teal-950/30 p-2.5 rounded-lg border border-teal-500/30 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
              <span>{backupStatus}</span>
            </div>
          )}

          {showResetConfirm && (
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-500/40 space-y-2 text-xs">
              <div className="flex items-center gap-1.5 text-red-300 font-bold">
                <AlertCircle className="w-4 h-4 text-red-400" />
                <span>تأكيد مسح البيانات المحلية:</span>
              </div>
              <p className="text-[11px] text-slate-300">
                هذا الإجراء سيحذف فهارس المكتبة والإعدادات المحلية. لن تُحذف ملفات المكتبة الأصلية. هل أنت متأكد؟
              </p>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 bg-red-700 text-white rounded text-xs font-bold"
                >
                  نعم، مسح البيانات
                </button>
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(false)}
                  className="px-2.5 py-1 bg-slate-800 text-slate-300 rounded text-xs"
                >
                  إلغاء
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
