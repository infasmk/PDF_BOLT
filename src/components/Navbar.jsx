import React from 'react';
import { Zap, ShieldCheck, Sparkles, Infinity as InfinityIcon, BarChart3 } from 'lucide-react';

export default function Navbar({ onOpenPrivacy, onSelectTool, onOpenAdmin }) {
  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/95 border-b border-slate-200/90 shadow-sm transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 sm:space-x-4 cursor-pointer" onClick={() => onSelectTool(null)}>
            <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11">
              <img
                src="/logo.png"
                alt="PDFBolt Logo"
                className="w-full h-full object-contain rounded-xl shadow-md shadow-sky-500/20 hover:scale-105 transition-transform"
              />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-400"></span>
              </span>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  PDF<span className="text-sky-600">Bolt</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  ⚡ 100% Free
                </span>
              </div>
              <div className="flex items-center space-x-1.5 text-[11px] font-medium text-slate-500">
                <span>powered by</span>
                <span className="font-extrabold tracking-wide bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                  WEB⚡BITS
                </span>
              </div>
            </div>
          </div>

          {/* Center Navigation Links (desktop) */}
          <nav className="hidden lg:flex items-center space-x-1 font-semibold text-sm text-slate-700">
            <button 
              onClick={() => onSelectTool('merge')}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-sky-600 transition-colors cursor-pointer"
            >
              Merge PDF
            </button>
            <button 
              onClick={() => onSelectTool('split')}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-sky-600 transition-colors cursor-pointer"
            >
              Split PDF
            </button>
            <button 
              onClick={() => onSelectTool('edit')}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 text-purple-600 hover:text-purple-700 transition-colors font-bold cursor-pointer"
            >
              Edit PDF
            </button>
            <button 
              onClick={() => onSelectTool('word-to-pdf')}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-sky-600 transition-colors cursor-pointer"
            >
              Word to PDF
            </button>
            <button 
              onClick={() => onSelectTool('excel-to-pdf')}
              className="px-3 py-1.5 rounded-lg hover:bg-slate-100 hover:text-sky-600 transition-colors cursor-pointer"
            >
              Excel to PDF
            </button>
            <button 
              onClick={onOpenPrivacy}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition-colors cursor-pointer"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-Server Privacy</span>
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* NO FILE SIZE LIMIT BADGE */}
            <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200/80 shadow-sm">
              <InfinityIcon className="w-3.5 h-3.5 text-sky-600" />
              <span>No Limit</span>
            </div>

            {/* Quick Action */}
            <button
              onClick={() => onSelectTool('edit')}
              className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:opacity-95 shadow-md shadow-blue-500/25 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Edit PDF Free</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
}
