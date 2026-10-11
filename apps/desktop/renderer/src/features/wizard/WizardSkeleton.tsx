// Component: n3 معالج إنشاء العرض (Wizard & Outline Review)
import React from 'react';
import { Sparkles, ListChecks, Sliders, AlertCircle } from 'lucide-react';

export function WizardSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
              n3 Wizard & Outline Review
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              المرحلة 3 (مجدولة للتطوير)
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5">معالج إنشاء العرض ومراجعة المخطط</h2>
          <p className="text-xs text-slate-400">جمع المدخلات، توليد المخطط ومراجعته، ثم توليد المحتوى.</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-teal-400">
          <Sparkles className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">1</span>
            <span>المدخلات والموضوع</span>
          </div>
          <p className="text-[11px] text-slate-400">إدخال الموضوع، المطالبة، أو لصق مخطط جاهز.</p>
          <div className="text-[10px] text-amber-400/90 bg-amber-950/20 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>غير مفعل حالياً (المرحلة 3)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">2</span>
            <span>إعدادات العرض</span>
          </div>
          <p className="text-[11px] text-slate-400">الجمهور، عدد الشرائح، النبرة، لغة العرض، 16:9 أو 4:3.</p>
          <div className="text-[10px] text-amber-400/90 bg-amber-950/20 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>غير مفعل حالياً (المرحلة 3)</span>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[10px]">3</span>
            <span>مراجعة المخطط التفاعلية</span>
          </div>
          <p className="text-[11px] text-slate-400">تعديل العناوين، إعادة الترتيب بسحب وإفلات، وقفل المخطط.</p>
          <div className="text-[10px] text-amber-400/90 bg-amber-950/20 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>غير مفعل حالياً (المرحلة 3)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
