import React from 'react';
import { Sparkles, Zap, Infinity as InfinityIcon } from 'lucide-react';

export default function Hero({ onSelectTool }) {
  return (
    <section className="relative pt-8 pb-10 sm:pt-14 sm:pb-16 overflow-hidden bg-gradient-to-b from-sky-50/40 via-white to-slate-50/30">
      {/* Background ambient glow */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-[600px] h-[250px] bg-gradient-to-tr from-sky-300/15 via-blue-400/10 to-indigo-300/5 blur-3xl -z-10 pointer-events-none rounded-full" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Minimal Badge */}
        <div className="inline-flex items-center space-x-2 px-3.5 py-1 rounded-full text-xs font-bold bg-sky-100/80 text-sky-800 border border-sky-300/80 mb-4 shadow-sm">
          <InfinityIcon className="w-3.5 h-3.5 text-sky-600" />
          <span>100% Free & Private</span>
          <span className="text-slate-300">•</span>
          <span className="text-slate-600">Zero Limits</span>
        </div>

        {/* Clean, Punchy Heading */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 leading-tight">
          Fast, Private{' '}
          <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            PDF Tools
          </span>
        </h1>

        {/* Streamlined One-Line Subtitle */}
        <p className="mt-3 text-sm sm:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
          Merge, split, edit, convert, and protect your documents directly in your browser.
        </p>

        {/* Quick Launch Buttons (Mobile Friendly Chips) */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto">
          <button
            onClick={() => onSelectTool('edit')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer active:scale-95"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Edit PDF</span>
          </button>

          <button
            onClick={() => onSelectTool('merge')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Merge
          </button>

          <button
            onClick={() => onSelectTool('split')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Split
          </button>

          <button
            onClick={() => onSelectTool('crop')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-pink-400 hover:text-pink-600 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Crop
          </button>

          <button
            onClick={() => onSelectTool('word-to-pdf')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-blue-700 hover:border-blue-400 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Word to PDF
          </button>

          <button
            onClick={() => onSelectTool('powerpoint-to-pdf')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-orange-700 hover:border-orange-400 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            PPT to PDF
          </button>

          <button
            onClick={() => onSelectTool('excel-to-pdf')}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-emerald-700 hover:border-emerald-400 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer active:scale-95"
          >
            Excel to PDF
          </button>
        </div>

      </div>
    </section>
  );
}

