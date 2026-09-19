import React, { useState, useEffect, useRef, useMemo } from 'react';

/**
 * PDFBolt 2.0 — Premium Electric Pulse Intro Animation
 * 
 * Cinematic lightning-powered logo reveal with:
 * - Deep midnight-navy atmosphere with futuristic energy grid
 * - Glassmorphic logo card with ambient cyan/blue halo
 * - Dynamic electric arcs and energetic bolt illumination
 * - Signature shockwave electric pulse transition into workspace
 * - First-visit (~2.4s) vs repeat-visit (~0.7s) adaptive pacing
 * - Strict prefers-reduced-motion accessibility
 */
export default function LoadingScreen({ onFinish }) {
  // Check if this is a repeat visit via sessionStorage
  const isFirstVisit = useMemo(() => {
    try {
      if (typeof window === 'undefined') return true;
      const seen = sessionStorage.getItem('pdfbolt_seen_awakening');
      return !seen;
    } catch (e) {
      return true;
    }
  }, []);

  // Check prefers-reduced-motion
  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Animation phase: 'enter' | 'charge' | 'peak' | 'shockwave' | 'exit'
  const [phase, setPhase] = useState(prefersReducedMotion ? 'shockwave' : 'enter');
  const [statusText, setStatusText] = useState('Initializing secure workspace...');
  const [isSkipped, setIsSkipped] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    // If reduced motion, fast exit
    if (prefersReducedMotion) {
      const t = setTimeout(() => {
        if (onFinish) onFinish();
      }, 400);
      return () => clearTimeout(t);
    }

    // Pacing configurations
    // First visit: 2.3s total; Repeat visit: 0.7s total
    const timings = isFirstVisit
      ? { charge: 700, peak: 1600, shockwave: 2100, finish: 2800 }
      : { charge: 150, peak: 350, shockwave: 550, finish: 1100 };

    // Record that intro was seen
    try {
      sessionStorage.setItem('pdfbolt_seen_awakening', '1');
    } catch (e) {}

    // Timeline sequences
    const tCharge = setTimeout(() => {
      setPhase('charge');
      if (isFirstVisit) setStatusText('Preparing PDF & Office tools...');
    }, timings.charge);

    const tPeak = setTimeout(() => {
      setPhase('peak');
      setStatusText('Your workspace is ready.');
    }, timings.peak);

    const tShockwave = setTimeout(() => {
      setPhase('shockwave');
    }, timings.shockwave);

    const tFinish = setTimeout(() => {
      setPhase('exit');
      if (onFinish) onFinish();
    }, timings.finish);

    return () => {
      clearTimeout(tCharge);
      clearTimeout(tPeak);
      clearTimeout(tShockwave);
      clearTimeout(tFinish);
    };
  }, [isFirstVisit, prefersReducedMotion, onFinish]);

  // Allow power users to click or press any key to skip immediately
  const handleFastSkip = () => {
    if (isSkipped || phase === 'shockwave' || phase === 'exit') return;
    setIsSkipped(true);
    setPhase('shockwave');
    setStatusText('Your workspace is ready.');
    setTimeout(() => {
      setPhase('exit');
      if (onFinish) onFinish();
    }, 600);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['Escape', 'Enter', ' '].includes(e.key)) {
        handleFastSkip();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isShockwaveOrExit = phase === 'shockwave' || phase === 'exit';
  const isPeakOrShockwave = phase === 'peak' || isShockwaveOrExit;
  const isCharging = phase === 'charge' || isPeakOrShockwave;

  return (
    <div
      ref={containerRef}
      onClick={handleFastSkip}
      role="status"
      aria-live="polite"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer select-none transition-all duration-700 ease-out ${
        phase === 'exit'
          ? 'opacity-0 pointer-events-none'
          : 'opacity-100'
      }`}
      style={{
        backgroundColor: '#070b16',
        transitionProperty: 'opacity, backdrop-filter, transform'
      }}
    >
      {/* 1. Deep Midnight Background with Subtle Energy Grid */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `
            radial-gradient(circle at center, rgba(14, 165, 233, 0.16) 0%, rgba(37, 99, 235, 0.08) 40%, transparent 75%),
            linear-gradient(to right, rgba(56, 189, 248, 0.04) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(56, 189, 248, 0.04) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 48px 48px, 48px 48px'
        }}
      />

      {/* 2. Soft Light Wave Expansion on Signature Shockwave */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all ease-out ${
          isShockwaveOrExit
            ? 'w-[200vw] h-[200vw] opacity-25 scale-100 duration-1000'
            : 'w-0 h-0 opacity-0 scale-0 duration-300'
        }`}
        style={{
          background: 'radial-gradient(circle, rgba(0, 242, 254, 0.9) 0%, rgba(59, 130, 246, 0.4) 40%, transparent 70%)'
        }}
      />

      {/* 3. Primary Shockwave Expanding Energy Ring */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all ease-out ${
          isShockwaveOrExit
            ? 'w-[650px] h-[650px] sm:w-[850px] sm:h-[850px] opacity-0 scale-150 duration-700'
            : isPeakOrShockwave
            ? 'w-36 h-36 opacity-100 scale-100 duration-200'
            : 'w-0 h-0 opacity-0 scale-50'
        }`}
        style={{
          border: '2px solid rgba(56, 189, 248, 0.95)',
          boxShadow: '0 0 45px #00f2fe, inset 0 0 30px rgba(0, 242, 254, 0.6)'
        }}
      />

      {/* 4. Secondary Harmonic Shockwave Ring */}
      <div
        className={`absolute rounded-full pointer-events-none transition-all ease-out ${
          isShockwaveOrExit
            ? 'w-[550px] h-[550px] sm:w-[720px] sm:h-[720px] opacity-0 scale-125 duration-800 delay-75'
            : 'w-0 h-0 opacity-0 scale-50'
        }`}
        style={{
          border: '1.5px solid rgba(129, 140, 248, 0.8)',
          boxShadow: '0 0 35px rgba(99, 102, 241, 0.5)'
        }}
      />

      {/* Main Animated Stage */}
      <div 
        className={`relative z-10 flex flex-col items-center px-6 transition-all duration-700 ease-out ${
          isShockwaveOrExit
            ? 'scale-110 opacity-0 -translate-y-2'
            : 'scale-100 opacity-100 translate-y-0'
        }`}
      >
        {/* Core Centerpiece — Logo & Electric Reactor */}
        <div className="relative flex items-center justify-center mb-8">
          
          {/* Ambient Breathing Cyan/Blue Halo */}
          <div
            className={`absolute rounded-full pointer-events-none transition-all duration-1000 ease-in-out ${
              isPeakOrShockwave
                ? 'w-64 h-64 opacity-90 scale-125 bg-cyan-400/40 blur-3xl'
                : isCharging
                ? 'w-56 h-56 opacity-65 scale-110 bg-sky-500/30 blur-2xl animate-pulse'
                : 'w-44 h-44 opacity-35 scale-90 bg-blue-600/20 blur-xl'
            }`}
          />

          {/* Premium Glass-like Logo Card Container */}
          <div 
            className={`relative flex items-center justify-center w-28 h-28 sm:w-36 sm:h-36 rounded-3xl p-3 sm:p-4 backdrop-blur-2xl transition-all duration-700 ease-out ${
              phase === 'enter'
                ? 'scale-[0.85] opacity-0'
                : 'scale-100 opacity-100'
            } ${
              isCharging ? 'animate-[floating_3.5s_ease-in-out_infinite]' : ''
            }`}
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.08) 0%, rgba(255, 255, 255, 0.02) 100%)',
              border: isPeakOrShockwave 
                ? '1px solid rgba(56, 189, 248, 0.8)' 
                : '1px solid rgba(255, 255, 255, 0.15)',
              boxShadow: isPeakOrShockwave
                ? '0 0 60px -10px rgba(0, 242, 254, 0.7), inset 0 0 25px rgba(56, 189, 248, 0.4)'
                : '0 20px 50px -10px rgba(0, 0, 0, 0.5), 0 0 30px -5px rgba(56, 189, 248, 0.25)'
            }}
          >
            {/* The Official PDFBolt Logo Asset */}
            <img
              src="/logo.png"
              alt="PDFBolt Logo"
              className={`w-full h-full object-contain rounded-2xl drop-shadow-2xl transition-all duration-500 ${
                isPeakOrShockwave
                  ? 'brightness-125 contrast-110 filter drop-shadow-[0_0_20px_#00f2fe]'
                  : isCharging
                  ? 'brightness-110'
                  : 'brightness-95'
              }`}
            />

            {/* Dynamic Electric Arcs & Top-to-Bottom Illumination Sweep */}
            <div className="absolute inset-0 rounded-3xl overflow-hidden pointer-events-none">
              
              {/* Electric Illumination Sweep */}
              <div 
                className={`absolute inset-0 bg-gradient-to-b from-transparent via-cyan-300/30 to-transparent transition-transform duration-1000 ease-out ${
                  isCharging ? 'translate-y-full' : '-translate-y-full'
                }`}
              />

              {/* High-voltage SVG Electric Arcs Dancing along the Bolt */}
              {isCharging && (
                <svg 
                  className="absolute inset-0 w-full h-full"
                  viewBox="0 0 100 100"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="electric-glow" x="-20%" y="-20%" width="140%" height="140%">
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feMerge>
                        <feMergeNode in="blur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Arc 1: Top charging line */}
                  <path
                    d="M 50 18 L 54 32 L 48 42 L 56 46"
                    stroke="#00f2fe"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    filter="url(#electric-glow)"
                    className="animate-[dash_1.2s_linear_infinite]"
                    strokeDasharray="14 26"
                  />

                  {/* Arc 2: Center bolt pulse */}
                  <path
                    d="M 44 48 L 52 52 L 46 68 L 58 72 L 49 84"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    filter="url(#electric-glow)"
                    className="animate-[dash_0.9s_linear_infinite]"
                    strokeDasharray="20 30"
                  />

                  {/* Arc 3: Right flank spark */}
                  <path
                    d="M 64 38 L 60 50 L 66 62"
                    stroke="#a5f3fc"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    className="animate-[dash_1.5s_linear_infinite]"
                    strokeDasharray="10 20"
                  />
                </svg>
              )}

              {/* Peak Bright Electric Flash Burst */}
              <div 
                className={`absolute inset-0 bg-radial-at-c from-cyan-300/60 via-sky-400/20 to-transparent transition-opacity duration-300 ${
                  phase === 'peak' ? 'opacity-100' : 'opacity-0'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Branding Reveal — Typography & Light Sweep */}
        <div 
          className={`flex flex-col items-center transition-all duration-700 delay-100 ${
            phase === 'enter'
              ? 'opacity-0 translate-y-3'
              : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Main Title: PDFBolt 2.0 with Light Shimmer Sweep */}
          <div className="relative flex items-center space-x-2.5 mb-2">
            <h1 
              className="text-3xl sm:text-4xl font-black tracking-tight"
              style={{
                background: 'linear-gradient(90deg, #ffffff 0%, #a5f3fc 25%, #38bdf8 50%, #ffffff 75%, #ffffff 100%)',
                backgroundSize: '200% 100%',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                animation: 'textShimmer 3.5s linear infinite'
              }}
            >
              PDFBolt <span className="font-extrabold text-cyan-300">2.0</span>
            </h1>

            {/* Glowing Version Tag */}
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/20">
              ⚡ READY
            </span>
          </div>

          {/* Sub-brand: powered by WEB⚡BITS */}
          <div className="flex items-center space-x-1.5 text-xs font-semibold tracking-wide text-slate-400 mb-6">
            <span className="opacity-80">powered by</span>
            <span 
              className="font-black tracking-widest uppercase bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-400 bg-clip-text text-transparent drop-shadow-sm"
            >
              WEB⚡BITS
            </span>
          </div>

          {/* Meaningful Real Loading Status Indicator */}
          <div className="h-6 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-xs font-medium text-slate-400/90">
              <span className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                isPeakOrShockwave ? 'bg-cyan-400 shadow-[0_0_8px_#00f2fe]' : 'bg-sky-500 animate-ping'
              }`} />
              <span className="tracking-wide font-mono text-[11px] sm:text-xs">
                {statusText}
              </span>
            </div>
          </div>
        </div>

        {/* Minimal Click to Continue prompt on first visit */}
        {isFirstVisit && phase !== 'shockwave' && phase !== 'exit' && (
          <div className="mt-8 text-[11px] font-medium text-slate-500/70 hover:text-cyan-400 transition-colors flex items-center space-x-1">
            <span>Press any key or click to launch</span>
            <span className="text-xs">→</span>
          </div>
        )}

      </div>

      {/* Embedded High-Performance Keyframe Styles */}
      <style>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -40;
          }
        }
        @keyframes textShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes floating {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
