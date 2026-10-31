import React from 'react';

interface CourseArtworkProps {
  type: 'code' | 'palette' | 'brain' | 'trending';
  categoryTh: string;
  className?: string;
}

export const CourseArtwork: React.FC<CourseArtworkProps> = ({ type, categoryTh, className = 'h-48' }) => {
  if (type === 'code') {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center p-6 ${className}`}>
        {/* Ambient atmospheric glow */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />
        
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(#38bdf8 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        />
        
        {/* Code Editor Window */}
        <div className="relative w-full max-w-sm rounded-xl bg-slate-900/90 border border-slate-700/60 shadow-2xl overflow-hidden backdrop-blur-md transform transition-transform duration-500 group-hover:scale-[1.02]">
          <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-800/90 border-b border-slate-700/70 text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500/90 inline-block shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500/90 inline-block shadow-sm" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/90 inline-block shadow-sm" />
              <span className="ml-2 font-mono text-[10px] text-slate-300">CourseApp.tsx</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">React 19</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">TypeScript</span>
            </div>
          </div>
          <div className="p-3.5 font-mono text-xs space-y-1 text-slate-300">
            <p><span className="text-purple-400">export function</span> <span className="text-blue-300">BBFlexLearnApp</span>() &#123;</p>
            <p className="pl-3.5"><span className="text-purple-400">const</span> [progress, setProgress] = <span className="text-amber-300">useState</span>(&#123;</p>
            <p className="pl-7 text-emerald-300">status: <span className="text-sky-300">'mastered'</span>,</p>
            <p className="pl-7 text-emerald-300">score: <span className="text-amber-400">100%</span>,</p>
            <p className="pl-7 text-emerald-300">certificate: <span className="text-purple-300">true</span></p>
            <p className="pl-3.5">&#125;);</p>
            <p className="pl-3.5 text-slate-400 font-sans text-[11px] italic">// Interactive Web Architecture</p>
            <p>&#125;</p>
          </div>
        </div>

        {/* Category Label */}
        <span className="absolute bottom-2.5 right-3.5 text-[10px] font-mono text-sky-300/90 tracking-widest font-semibold uppercase bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm">
          {categoryTh}
        </span>
      </div>
    );
  }

  if (type === 'palette') {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950/70 to-slate-950 flex items-center justify-center p-6 ${className}`}>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-pink-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(#c084fc 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        />
        
        {/* Design System UI showcase */}
        <div className="relative w-full max-w-sm flex items-center justify-center gap-3 transform transition-transform duration-500 group-hover:scale-[1.02]">
          {/* Left swatch card */}
          <div className="w-28 p-3 rounded-xl bg-slate-900/90 border border-purple-500/40 shadow-xl text-center transform -rotate-3 backdrop-blur-md">
            <div className="w-9 h-9 mx-auto rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-500 flex items-center justify-center text-white text-xs font-bold mb-2 shadow-sm">
              Aa
            </div>
            <div className="h-2 w-16 bg-purple-200/30 rounded mx-auto mb-1.5" />
            <div className="h-1.5 w-10 bg-purple-200/15 rounded mx-auto" />
          </div>
          
          {/* Center Dominant Tokens card */}
          <div className="w-36 p-3.5 rounded-xl bg-slate-900/95 border border-purple-400/60 shadow-2xl text-center transform scale-105 z-10 backdrop-blur-md">
            <div className="flex justify-between items-center mb-2">
              <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">Design Tokens</span>
              <span className="text-[9px] font-mono text-emerald-400">8px Grid</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 my-2.5">
              <div className="h-6 rounded-md bg-purple-500 shadow-sm" />
              <div className="h-6 rounded-md bg-indigo-500 shadow-sm" />
              <div className="h-6 rounded-md bg-pink-500 shadow-sm" />
              <div className="h-6 rounded-md bg-sky-500 shadow-sm" />
            </div>
            <div className="flex items-center justify-between text-[9px] text-slate-400 pt-1 border-t border-slate-700/60">
              <span>WCAG AA</span>
              <span className="text-emerald-400 font-semibold font-mono">4.5:1</span>
            </div>
          </div>

          {/* Right Component Card */}
          <div className="w-28 p-3 rounded-xl bg-slate-900/90 border border-purple-500/40 shadow-xl text-center transform rotate-3 backdrop-blur-md">
            <div className="w-9 h-9 mx-auto rounded-full bg-pink-500/20 border border-pink-400/50 flex items-center justify-center text-pink-300 text-[10px] mb-2 font-mono font-bold">
              UX/UI
            </div>
            <div className="h-2 w-14 bg-pink-200/30 rounded mx-auto mb-1.5" />
            <div className="h-1.5 w-8 bg-pink-200/15 rounded mx-auto" />
          </div>
        </div>

        <span className="absolute bottom-2.5 right-3.5 text-[10px] font-mono text-purple-300/90 tracking-widest font-semibold uppercase bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm">
          {categoryTh}
        </span>
      </div>
    );
  }

  if (type === 'brain') {
    return (
      <div className={`relative overflow-hidden bg-gradient-to-br from-slate-950 via-teal-950/70 to-slate-950 flex items-center justify-center p-6 ${className}`}>
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-teal-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(#2dd4bf 1px, transparent 1px)', backgroundSize: '16px 16px' }}
        />

        {/* AI & Data Pipeline Visual */}
        <div className="relative w-full max-w-sm rounded-xl bg-slate-900/95 border border-teal-500/40 shadow-2xl p-4 backdrop-blur-md transform transition-transform duration-500 group-hover:scale-[1.02]">
          <div className="flex items-center justify-between border-b border-teal-500/25 pb-2.5 mb-3">
            <span className="text-xs font-bold text-teal-300 uppercase tracking-wide">Neural Flow & LLM Pipeline</span>
            <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.5 rounded">
              98.6% Accuracy
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 py-2">
            <div className="px-2.5 py-1.5 rounded-lg bg-teal-500/15 border border-teal-500/35 text-[11px] text-teal-200 font-mono">
              Tokens
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-teal-500 to-emerald-400 relative">
                <span className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-teal-300 shadow-sm shadow-teal-300" />
              </div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/20 border border-emerald-400/50 text-[11px] text-emerald-200 font-mono font-bold">
              GenAI
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="h-0.5 w-full bg-gradient-to-r from-emerald-400 to-teal-500 relative">
                <span className="absolute -top-1 left-1/2 w-2 h-2 rounded-full bg-emerald-300 shadow-sm shadow-emerald-300" />
              </div>
            </div>
            <div className="px-2.5 py-1.5 rounded-lg bg-teal-500/25 border border-teal-400/50 text-[11px] text-teal-100 font-mono">
              Insights
            </div>
          </div>
        </div>

        <span className="absolute bottom-2.5 right-3.5 text-[10px] font-mono text-teal-300/90 tracking-widest font-semibold uppercase bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm">
          {categoryTh}
        </span>
      </div>
    );
  }

  // Business & Marketing Growth
  return (
    <div className={`relative overflow-hidden bg-gradient-to-br from-slate-950 via-amber-950/70 to-slate-950 flex items-center justify-center p-6 ${className}`}>
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

      <div
        className="absolute inset-0 opacity-20"
        style={{ backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '16px 16px' }}
      />

      <div className="relative w-full max-w-sm rounded-xl bg-slate-900/95 border border-amber-500/40 shadow-2xl p-4 backdrop-blur-md transform transition-transform duration-500 group-hover:scale-[1.02]">
        <div className="flex items-center justify-between border-b border-amber-500/25 pb-2 mb-3">
          <span className="text-xs font-bold text-amber-300 uppercase tracking-wide">Omnichannel Growth Funnel</span>
          <span className="text-[10px] font-mono font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.5 rounded">
            ROAS 4.8x
          </span>
        </div>

        <div className="space-y-2">
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Audience Reach</span>
              <span className="font-mono text-amber-300 font-bold">145,200</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-500 to-orange-500 w-[95%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Qualified Leads</span>
              <span className="font-mono text-amber-300 font-bold">42,800</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-amber-500 w-[68%]" />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-[11px] text-slate-300 mb-1">
              <span>Certifications Issued</span>
              <span className="font-mono text-emerald-400 font-bold">14,200 (+32%)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[42%]" />
            </div>
          </div>
        </div>
      </div>

      <span className="absolute bottom-2.5 right-3.5 text-[10px] font-mono text-amber-300/90 tracking-widest font-semibold uppercase bg-slate-900/60 px-2 py-0.5 rounded border border-slate-700/50 backdrop-blur-sm">
        {categoryTh}
      </span>
    </div>
  );
};
