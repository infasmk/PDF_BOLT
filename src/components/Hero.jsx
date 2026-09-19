import React from 'react';
import { Zap, Sparkles, Infinity as InfinityIcon, Shield, CheckCircle2, ArrowRight } from 'lucide-react';

export default function Hero({ onSelectTool }) {
  return (
    <section className="relative pt-12 pb-16 lg:pt-20 lg:pb-24 overflow-hidden bg-gradient-to-b from-sky-50/40 via-white to-slate-50/30">
      {/* Background soft ambient glow */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-sky-300/15 via-blue-400/10 to-indigo-300/5 blur-3xl -z-10 pointer-events-none rounded-full" />
      
      <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
        
        {/* Top Announcement Pill */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full text-xs font-bold bg-sky-100/80 text-sky-800 border border-sky-300/80 mb-6 shadow-sm">
          <InfinityIcon className="w-4 h-4 text-sky-600" />
          <span>NO FILE SIZE LIMIT</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-600">Zero Server Uploads • 100% In-Browser</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-900 leading-[1.15]">
          Every tool you need for PDFs. <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
            100% Free, Private & Unlimited.
          </span>
        </h1>

        {/* Subtitle */}
        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Edit PDFs, convert Word, PowerPoint & Excel, merge, split, crop, and sign documents directly in your browser. 
          <strong> No 10MB/50MB upload caps</strong> — your confidential files never leave your device.
        </p>

        {/* Quick Launch Buttons (Clean & Elegant) */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
          <button
            onClick={() => onSelectTool('edit')}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-500/20 hover:opacity-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Edit PDF (Add Text/Image)</span>
          </button>

          <button
            onClick={() => onSelectTool('merge')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            Merge PDF
          </button>

          <button
            onClick={() => onSelectTool('split')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-sky-400 hover:text-sky-600 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            Split PDF
          </button>

          <button
            onClick={() => onSelectTool('crop')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 hover:border-pink-400 hover:text-pink-600 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            Crop PDF
          </button>

          <button
            onClick={() => onSelectTool('word-to-pdf')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-blue-700 hover:border-blue-400 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            Word to PDF
          </button>

          <button
            onClick={() => onSelectTool('powerpoint-to-pdf')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-orange-700 hover:border-orange-400 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            PPT to PDF
          </button>

          <button
            onClick={() => onSelectTool('excel-to-pdf')}
            className="px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-emerald-700 hover:border-emerald-400 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer"
          >
            Excel to PDF
          </button>
        </div>

        {/* Value metrics row */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="p-2.5 rounded-xl bg-sky-50 text-sky-600">
              <InfinityIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Unlimited Size</div>
              <div className="text-[11px] text-slate-500">No 10MB/50MB cap</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">100% Private</div>
              <div className="text-[11px] text-slate-500">RAM-only processing</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">Full Edit Suite</div>
              <div className="text-[11px] text-slate-500">Add text & images</div>
            </div>
          </div>

          <div className="flex items-center space-x-3 p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900">24+ Pro Tools</div>
              <div className="text-[11px] text-slate-500">Word, Excel, PPTX</div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
