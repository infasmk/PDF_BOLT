import React from 'react';
import { ShieldCheck, X, Cpu, HardDrive, Infinity as InfinityIcon, CheckCircle2 } from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                Zero-Server Privacy Guarantee
              </h3>
              <p className="text-xs text-slate-500">
                Engineered with ⚡ by infas.mk • Powered by WEB⚡BITS
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 sm:p-8 space-y-6">
          
          <div className="p-4 rounded-2xl bg-sky-50 border border-sky-200 text-sm text-sky-900 leading-relaxed">
            <div className="flex items-center space-x-2 font-bold mb-1">
              <InfinityIcon className="w-4 h-4 text-sky-600" />
              <span>How is PDFBolt completely free with NO FILE SIZE LIMIT?</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-700">
              Unlike traditional sites that upload your confidential PDFs to their cloud servers (forcing artificial 10MB or 50MB caps), 
              <strong> PDFBolt runs entirely inside your device RAM & web browser</strong> using WebAssembly.
            </p>
          </div>

          {/* Comparison diagram */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50/50">
              <div className="flex items-center space-x-2 text-rose-700 font-bold mb-2">
                <HardDrive className="w-4 h-4" />
                <span>Other PDF Websites</span>
              </div>
              <ul className="space-y-1.5 text-slate-600">
                <li>❌ Files uploaded to remote cloud</li>
                <li>❌ Strict 10MB/50MB upload limits</li>
                <li>❌ Waiting in queue for conversion</li>
                <li>❌ Confidential data stored on remote disk</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/60">
              <div className="flex items-center space-x-2 text-emerald-700 font-bold mb-2">
                <Cpu className="w-4 h-4" />
                <span>PDFBolt (WEB⚡BITS)</span>
              </div>
              <ul className="space-y-1.5 text-slate-700 font-semibold">
                <li>✅ 100% In-Browser Memory (RAM)</li>
                <li>✅ <strong>No file size limits</strong> (500MB+ ok)</li>
                <li>✅ Zero latency & instant download</li>
                <li>✅ Zero bytes ever leave your device</li>
              </ul>
            </div>
          </div>

          {/* Pillars */}
          <div className="space-y-3">
            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Total Data Sovereignty</h4>
                <p className="text-xs text-slate-500">
                  Ideal for business contracts, tax filings, legal agreements, and private financial statements.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <CheckCircle2 className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-slate-900">Works Without Internet Once Loaded</h4>
                <p className="text-xs text-slate-500">
                  Once cached, all WebAssembly engines can merge, split, edit, and convert documents completely offline.
                </p>
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white font-bold text-sm hover:opacity-95 shadow-lg shadow-blue-500/25 transition-all cursor-pointer"
            >
              Got it, thanks!
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
