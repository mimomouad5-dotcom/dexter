// Component: n5 معاينة التصاميم (Design Preview)
import React from 'react';
import { Palette, Eye, AlertCircle } from 'lucide-react';

export function DesignPreviewSkeleton() {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-bold">
              n5 Design Preview Grid
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              المرحلة 11 (مجدولة للتطوير)
            </span>
          </div>
          <h2 className="text-lg font-bold text-white mt-1.5">معاينة بدائل التصاميم والثيمات</h2>
          <p className="text-xs text-slate-400">عرض 3 إلى 6 بدائل تخطيطية وتنسيقية مختلفة جذرياً دون حذف أي محتوى.</p>
        </div>
        <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-teal-400">
          <Palette className="w-5 h-5" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((variant) => (
          <div key={variant} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col items-center text-center">
            <div className="w-full h-28 rounded-lg bg-slate-900/80 border border-dashed border-slate-800 flex items-center justify-center mb-3">
              <Eye className="w-6 h-6 text-slate-600" />
            </div>
            <span className="text-xs font-semibold text-slate-200">نمط التصميم البديل #{variant}</span>
            <p className="text-[11px] text-slate-500 mt-1">تخطيط معتمد من محرك التصميم n24 مع فحص الجودة n26.</p>
            <div className="mt-3 text-[10px] text-amber-400 bg-amber-950/20 px-2 py-1 rounded border border-amber-500/20 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              <span>غير متاح حالياً (المرحلة 11)</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
