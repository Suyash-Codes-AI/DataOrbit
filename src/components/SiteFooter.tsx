import React from 'react';

export const SiteFooter: React.FC<{ dark?: boolean }> = ({ dark = true }) => (
  <footer className={`shrink-0 border-t px-5 py-2.5 text-center ${dark ? 'border-[#1e2535] bg-[#0b0f16]' : 'border-slate-200 bg-white'}`}>
    <p className={`font-mono text-[10px] font-medium uppercase tracking-[0.2em] ${dark ? 'text-slate-500' : 'text-slate-400'}`}>
      MADE WITH <span className="mx-0.5" role="img" aria-label="love">💗</span> BY <span className={dark ? 'text-slate-300' : 'text-slate-600'}>SUYASH</span>
    </p>
  </footer>
);
