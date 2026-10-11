// Component: n4 محرر الشرائح (Undo/Redo, Thumbnails, Canvas)
import React from 'react';
import { Layout, Undo, Redo, Layers, AlertCircle } from 'lucide-react';

export function EditorSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
              n4 Slide Editor Canvas
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              المرحلة 12 (مجدولة للتطوير)
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5">محرر الشرائح وكانفاس التحرير التفاعلي</h2>
          <p className="text-xs text-slate-400">لوحة عمل مركزية، شريط مصغرات، تحرير النصوص والأشكال، وملاحظات المتحدث.</p>
        </div>
        <div className="flex items-center gap-2 text-slate-400">
          <button disabled className="p-2 rounded-lg bg-slate-950 border border-slate-800 opacity-50 cursor-not-allowed">
            <Undo className="w-4 h-4" />
          </button>
          <button disabled className="p-2 rounded-lg bg-slate-950 border border-slate-800 opacity-50 cursor-not-allowed">
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 h-64">
        {/* Thumbnails rail placeholder */}
        <div className="col-span-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col gap-2">
          <span className="text-xs font-semibold text-slate-300">شريط المصغرات (Thumbnails)</span>
          <div className="flex-1 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center p-4 text-center">
            <Layers className="w-6 h-6 text-slate-600 mb-2" />
            <span className="text-[11px] text-slate-500">لا توجد شرائح حالياً</span>
            <span className="text-[10px] text-amber-500/80 mt-1">المرحلة 12</span>
          </div>
        </div>

        {/* Central Canvas placeholder */}
        <div className="col-span-6 p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center justify-center text-center">
          <Layout className="w-10 h-10 text-slate-700 mb-3" />
          <h3 className="text-sm font-semibold text-slate-200">كانفاس تحرير نموذج العرض n23</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-1">
            سيتصل بنموذج البيانات الموحد (Unified Model) بوحدات القياس الرسمية EMU لضمان التطابق البصري التام مع التصدير.
          </p>
          <div className="mt-4 px-3 py-1 rounded bg-amber-950/20 text-amber-400 text-xs border border-amber-500/20 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>غير متاح في المرحلة الحالية (قيد البناء في المرحلة 12)</span>
          </div>
        </div>

        {/* Properties Panel placeholder */}
        <div className="col-span-3 p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col">
          <span className="text-xs font-semibold text-slate-300 mb-2">لوحة الخصائص (Properties)</span>
          <div className="flex-1 rounded-lg border border-dashed border-slate-800 flex flex-col items-center justify-center p-3 text-center">
            <span className="text-[11px] text-slate-500">اختر عنصراً لتعديل الأبعاد والخط والتعبئة</span>
            <span className="text-[10px] text-amber-500/80 mt-1">المرحلة 12</span>
          </div>
        </div>
      </div>
    </div>
  );
}
