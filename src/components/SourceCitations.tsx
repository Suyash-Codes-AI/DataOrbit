import React, { useState } from 'react';
import { Database, FileText, Globe, ExternalLink, ChevronDown, ChevronRight } from 'lucide-react';
import { CitationItem } from '../types';

interface SourceCitationsProps {
  citations: CitationItem[];
}

export const SourceCitations: React.FC<SourceCitationsProps> = ({ citations }) => {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <div className="bg-[#121620] border border-[#232b3e] rounded-xl p-5 mb-6 shadow-md">
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-[#1f283b]">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-blue-400" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Data Sources & Evidence Citations
          </h3>
        </div>
        <span className="text-[11px] text-slate-400 font-mono">
          {citations.length} Verified Sources
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {citations.map((c, idx) => {
          const isDoc = c.sourceType === 'document';
          const isDb = c.sourceType === 'database';
          const isExpanded = expandedIndex === idx;

          return (
            <div
              key={idx}
              className="p-3 rounded-lg bg-[#0e121a] border border-[#1f273b] hover:border-blue-500/40 transition-colors"
            >
              <div
                className="flex items-start justify-between cursor-pointer"
                onClick={() => setExpandedIndex(isExpanded ? null : idx)}
              >
                <div className="flex items-start space-x-2.5">
                  <div className={`p-1.5 rounded-md mt-0.5 ${
                    isDoc
                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                      : isDb
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {isDoc ? <FileText className="w-3.5 h-3.5" /> : isDb ? <Database className="w-3.5 h-3.5" /> : <Globe className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200">{c.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{c.details}</p>
                  </div>
                </div>

                {c.citationText && (
                  <button className="text-slate-400 p-0.5 hover:text-slate-200">
                    {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

              {isExpanded && c.citationText && (
                <div className="mt-3 p-2.5 bg-[#080b10] border border-[#1b2233] rounded-md text-[11px] text-slate-300 font-mono leading-relaxed overflow-x-auto">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1 font-sans">
                    Cited Excerpt / Query:
                  </p>
                  <pre className="whitespace-pre-wrap">{c.citationText}</pre>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
