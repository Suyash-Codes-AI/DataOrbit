import React from 'react';
import { Sparkles, CheckCircle2, HelpCircle, AlertOctagon, ArrowUpRight, TrendingUp } from 'lucide-react';
import { StructuredInsights } from '../types';

interface InsightsPanelProps {
  insights: StructuredInsights;
}

export const InsightsPanel: React.FC<InsightsPanelProps> = ({ insights }) => {
  if (!insights || (!insights.key_findings?.length && !insights.summary)) {
    return null;
  }

  return (
    <div className="bg-[#121620] border border-[#232b3e] rounded-xl p-5 mb-6 shadow-md space-y-5">
      {/* Executive Headline & Summary */}
      <div className="pb-4 border-b border-[#1f283a]">
        <div className="flex items-center space-x-2 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-1.5">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Executive Intelligence Summary</span>
        </div>
        <h2 className="text-lg font-bold text-slate-100 tracking-tight leading-snug">
          {insights.executive_headline || 'Analysis Synthesis'}
        </h2>
        <p className="text-xs text-slate-300 mt-2 leading-relaxed">
          {insights.summary}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Section 1: VERIFIED FACTS */}
        <div className="p-4 rounded-xl bg-[#0e121a] border border-[#1f283c]">
          <div className="flex items-center space-x-2 mb-3">
            <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Verified Deterministic Facts
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono">100% Mathematically Proven</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {insights.key_findings.map((item, idx) => (
              <div key={idx} className="p-2.5 rounded-lg bg-[#0b0e14] border border-[#1a2233] text-xs">
                <p className="text-slate-200 font-medium">{item.fact}</p>
                {item.metric_support && (
                  <div className="mt-1 text-[11px] font-mono text-emerald-400/90 flex items-center space-x-1">
                    <span>Evidence:</span>
                    <span className="bg-emerald-500/10 px-1.5 py-0.5 rounded">{item.metric_support}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: HYPOTHESES & POSSIBLE DRIVERS */}
        <div className="p-4 rounded-xl bg-[#0e121a] border border-[#1f283c]">
          <div className="flex items-center space-x-2 mb-3">
            <span className="p-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <HelpCircle className="w-3.5 h-3.5" />
            </span>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Contextual Hypotheses & Drivers
              </h3>
              <span className="text-[10px] text-purple-400 font-mono">Document RAG & Market Context</span>
            </div>
          </div>

          <div className="space-y-2.5">
            {insights.possible_drivers.length > 0 ? (
              insights.possible_drivers.map((driver, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-[#0b0e14] border border-[#1a2233] text-xs">
                  <p className="text-slate-200 font-medium">{driver.hypothesis}</p>
                  {driver.supporting_evidence && (
                    <div className="mt-1.5 text-[11px] text-slate-400 bg-white/[0.02] p-2 rounded border border-white/[0.04]">
                      <span className="text-purple-300 font-medium">Source Evidence: </span>
                      {driver.supporting_evidence}
                    </div>
                  )}
                  {driver.source && (
                    <div className="mt-1 text-[10px] text-slate-500 font-mono">
                      Ref: {driver.source}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic p-3">No auxiliary document hypotheses required.</p>
            )}
          </div>
        </div>
      </div>

      {/* Section 3: ANOMALIES & IMPLICATIONS */}
      {(insights.anomalies?.length > 0 || insights.business_implications?.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Anomalies */}
          {insights.anomalies?.length > 0 && (
            <div className="p-4 rounded-xl bg-[#140e10] border border-red-500/20">
              <div className="flex items-center space-x-2 mb-2.5">
                <AlertOctagon className="w-4 h-4 text-red-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-red-300">
                  Statistical Outliers & Anomalies
                </h4>
              </div>
              <div className="space-y-2 text-xs">
                {insights.anomalies.map((anom, idx) => (
                  <div key={idx} className="p-2 rounded bg-red-950/20 border border-red-500/20 text-red-200">
                    <p className="font-medium">{anom.anomaly}</p>
                    <p className="text-[11px] text-red-300/80 mt-0.5">{anom.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Business Implications */}
          {insights.business_implications?.length > 0 && (
            <div className="p-4 rounded-xl bg-[#0e141a] border border-blue-500/20">
              <div className="flex items-center space-x-2 mb-2.5">
                <TrendingUp className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  Business Implications & Actions
                </h4>
              </div>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {insights.business_implications.map((imp, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <ArrowUpRight className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
