import React from 'react';
import { Zap, ShieldCheck, Infinity as InfinityIcon, Lock } from 'lucide-react';

export default function Footer({ onSelectTool, onOpenPrivacy, onOpenAdmin }) {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:gap-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="flex items-center justify-center w-9 h-9">
                <img
                  src="/logo.png"
                  alt="PDFBolt Logo"
                  className="w-full h-full object-contain rounded-xl shadow-md shadow-sky-500/20"
                />
              </div>
              <span className="text-xl font-black tracking-tight text-slate-900">
                PDF<span className="text-sky-600">Bolt</span>
              </span>
            </div>

            <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
              The high-performance, 100% private in-browser PDF suite. Edit, convert Word/Excel/PPT, merge, split, and sign PDFs with <strong>no file size limits</strong> and zero server storage.
            </p>

            {/* Founder & Team Highlight Box */}
            <div className="inline-flex flex-col sm:flex-row sm:items-center gap-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
                <span>Founder:</span>
                <span className="font-bold text-sky-600">infas.mk</span>
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-700">
                <span>Team:</span>
                <span className="font-extrabold tracking-wide bg-gradient-to-r from-blue-600 via-sky-500 to-cyan-500 bg-clip-text text-transparent">
                  WEB⚡BITS
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2 text-xs font-bold text-emerald-700">
              <InfinityIcon className="w-4 h-4" />
              <span>Unlimited File Size Guarantee</span>
            </div>
          </div>

          {/* Convert to PDF */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3.5">
              Convert to PDF
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
              <li><button onClick={() => onSelectTool('word-to-pdf')} className="hover:text-sky-600 cursor-pointer">Word to PDF</button></li>
              <li><button onClick={() => onSelectTool('excel-to-pdf')} className="hover:text-sky-600 cursor-pointer">Excel to PDF</button></li>
              <li><button onClick={() => onSelectTool('powerpoint-to-pdf')} className="hover:text-sky-600 cursor-pointer">PowerPoint to PDF</button></li>
              <li><button onClick={() => onSelectTool('images-to-pdf')} className="hover:text-sky-600 cursor-pointer">JPG to PDF</button></li>
              <li><button onClick={() => onSelectTool('html-to-pdf')} className="hover:text-sky-600 cursor-pointer">HTML to PDF</button></li>
            </ul>
          </div>

          {/* Convert from PDF */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3.5">
              Convert from PDF
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
              <li><button onClick={() => onSelectTool('pdf-to-word')} className="hover:text-sky-600 cursor-pointer">PDF to Word</button></li>
              <li><button onClick={() => onSelectTool('pdf-to-excel')} className="hover:text-sky-600 cursor-pointer">PDF to Excel</button></li>
              <li><button onClick={() => onSelectTool('pdf-to-powerpoint')} className="hover:text-sky-600 cursor-pointer">PDF to PowerPoint</button></li>
              <li><button onClick={() => onSelectTool('pdf-to-images')} className="hover:text-sky-600 cursor-pointer">PDF to JPG</button></li>
              <li><button onClick={() => onSelectTool('ocr')} className="hover:text-sky-600 cursor-pointer">OCR PDF</button></li>
              <li><button onClick={() => onSelectTool('pdf-to-pdfa')} className="hover:text-sky-600 cursor-pointer">PDF to PDF/A</button></li>
            </ul>
          </div>

          {/* Edit & Security */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 mb-3.5">
              Edit & Security
            </h4>
            <ul className="space-y-2.5 text-xs font-semibold text-slate-600">
              <li><button onClick={() => onSelectTool('edit')} className="text-purple-600 font-bold hover:underline cursor-pointer">Edit PDF (Add Text/Image)</button></li>
              <li><button onClick={() => onSelectTool('crop')} className="hover:text-sky-600 cursor-pointer">Crop PDF</button></li>
              <li><button onClick={() => onSelectTool('merge')} className="hover:text-sky-600 cursor-pointer">Merge PDF</button></li>
              <li><button onClick={() => onSelectTool('split')} className="hover:text-sky-600 cursor-pointer">Split PDF</button></li>
              <li><button onClick={() => onSelectTool('redact')} className="hover:text-sky-600 cursor-pointer">Redact PDF</button></li>
              <li><button onClick={() => onSelectTool('unlock')} className="hover:text-sky-600 cursor-pointer">Unlock PDF</button></li>
              <li><button onClick={() => onSelectTool('protect')} className="hover:text-sky-600 cursor-pointer">Protect PDF</button></li>
              <li><button onClick={onOpenPrivacy} className="text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-Server Privacy</span>
              </button></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center space-x-2">
            <p>© {new Date().getFullYear()} PDFBolt. All rights reserved.</p>
            <button
              onClick={onOpenAdmin}
              className="text-slate-300 hover:text-slate-500 transition-colors p-1 cursor-pointer"
              title="Administrator Gateway"
            >
              <Lock className="w-3 h-3" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span>Engineered with</span>
            <Zap className="w-3.5 h-3.5 text-sky-500 fill-sky-500" />
            <span>by <strong className="text-slate-800">infas.mk</strong></span>
            <span>•</span>
            <span>Powered by <strong className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent font-extrabold">WEB⚡BITS</strong></span>
          </div>
        </div>

      </div>
    </footer>
  );
}
