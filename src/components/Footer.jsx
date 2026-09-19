import React from 'react';
import { Zap, ShieldCheck, Infinity as InfinityIcon, Lock } from 'lucide-react';

export default function Footer({ onSelectTool, onOpenPrivacy, onOpenAdmin }) {
  return (
    <footer className="mt-20 border-t border-slate-200 bg-white shadow-inner">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="flex items-center justify-center w-8 h-8">
                <picture className="w-full h-full flex items-center justify-center">
                  <source srcSet="/logo.webp" type="image/webp" />
                  <img
                    src="/logo.png"
                    alt="PDFBolt Logo"
                    width="32"
                    height="32"
                    className="w-full h-full object-contain rounded-xl shadow-sm"
                  />
                </picture>
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                PDF<span className="text-sky-600">Bolt</span>
              </span>
            </div>

            <p className="text-xs text-slate-500 max-w-sm">
              Free, client-side PDF suite with zero file size limits and zero server uploads.
            </p>

            {/* Founder & Team Highlight */}
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600">
              <span className="text-slate-300">•</span>
              <span>Powered by <strong className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent font-extrabold">WEB⚡BITS</strong></span>
            </div>
          </div>

          {/* Quick Tools */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Tools
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li><button onClick={() => onSelectTool('merge')} className="hover:text-sky-600 cursor-pointer">Merge PDF</button></li>
              <li><button onClick={() => onSelectTool('split')} className="hover:text-sky-600 cursor-pointer">Split PDF</button></li>
              <li><button onClick={() => onSelectTool('edit')} className="text-purple-600 hover:underline cursor-pointer">Edit PDF</button></li>
              <li><button onClick={() => onSelectTool('crop')} className="hover:text-sky-600 cursor-pointer">Crop PDF</button></li>
              <li><button onClick={() => onSelectTool('compress')} className="hover:text-sky-600 cursor-pointer">Compress PDF</button></li>
            </ul>
          </div>

          {/* Convert & Security */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 mb-3">
              Convert & Security
            </h4>
            <ul className="space-y-2 text-xs text-slate-500 font-medium">
              <li><button onClick={() => onSelectTool('word-to-pdf')} className="hover:text-sky-600 cursor-pointer">Word to PDF</button></li>
              <li><button onClick={() => onSelectTool('powerpoint-to-pdf')} className="hover:text-sky-600 cursor-pointer">PPT to PDF</button></li>
              <li><button onClick={() => onSelectTool('excel-to-pdf')} className="hover:text-sky-600 cursor-pointer">Excel to PDF</button></li>
              <li><button onClick={() => onSelectTool('protect')} className="hover:text-sky-600 cursor-pointer">Protect PDF</button></li>
              <li><button onClick={onOpenPrivacy} className="text-emerald-700 hover:underline flex items-center space-x-1 cursor-pointer">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Privacy Guarantee</span>
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
