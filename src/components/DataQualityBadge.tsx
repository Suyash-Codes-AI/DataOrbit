import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, Info, CheckCircle2, ChevronRight, X } from 'lucide-react';
import { ValidationReport } from '../types';

interface DataQualityBadgeProps {
  report: ValidationReport;
}

export const DataQualityBadge: React.FC<DataQualityBadgeProps> = ({ report }) => {
  const [showModal, setShowModal] = useState(false);
  const score = report.quality_score;

  const getScoreColor = (s: number) => {
    if (s >= 90) return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', label: 'High Integrity' };
    if (s >= 75) return { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', label: 'Moderate Quality' };
    return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'Quality Warning' };
  };

  const style = getScoreColor(score);

  return (
    <>
      <div
        onClick={() => setShowModal(true)}
        className={`inline-flex items-center space-x-2.5 px-3 py-1.5 rounded-lg border ${style.bg} ${style.border} cursor-pointer hover:brightness-110 transition-all`}
        title="Click to view detailed deterministic data quality report"
      >
        <ShieldCheck className={`w-4 h-4 ${style.text}`} />
        <div className="flex items-center space-x-1.5">
          <span className="text-xs font-semibold text-slate-300">Data Quality:</span>
          <span className={`text-xs font-bold font-mono ${style.text}`}>{score}/100</span>
          <span className="text-[10px] text-slate-400">({style.label})</span>
        </div>
        <ChevronRight className="w-3 h-3 text-slate-500" />
      </div>

      {/* Quality Details Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#121622] border border-[#263147] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-[#232d42] flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-semibold text-slate-200 text-sm">Deterministic Data Quality Audit</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-md hover:bg-white/5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Score Header */}
              <div className={`p-4 rounded-xl border ${style.bg} ${style.border} flex items-center justify-between`}>
                <div>
                  <div className="text-xs text-slate-400">Overall Health Score</div>
                  <div className={`text-2xl font-bold font-mono ${style.text}`}>{score} / 100</div>
                  <div className="text-xs text-slate-300 mt-0.5">{style.label} across {report.rows.toLocaleString()} inspected records</div>
                </div>
                <div className="text-right text-xs text-slate-400 space-y-1">
                  <div>Inspected Columns: <span className="text-slate-200 font-mono">{report.columns.length}</span></div>
                  <div>Duplicates: <span className="text-slate-200 font-mono">{report.duplicate_rows}</span></div>
                  <div>Missing Values: <span className="text-slate-200 font-mono">{report.missing_values}</span></div>
                </div>
              </div>

              {/* Quality Checklist */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Validation Checks</h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#0e121a] border border-[#1e2638] flex items-center justify-between">
                    <span className="text-slate-300">Missing Values</span>
                    <span className={`font-mono font-medium ${report.missing_values === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {report.missing_values}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e121a] border border-[#1e2638] flex items-center justify-between">
                    <span className="text-slate-300">Duplicate Rows</span>
                    <span className={`font-mono font-medium ${report.duplicate_rows === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {report.duplicate_rows}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e121a] border border-[#1e2638] flex items-center justify-between">
                    <span className="text-slate-300">Date Integrity</span>
                    <span className={`font-mono font-medium ${report.invalid_dates === 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {report.invalid_dates === 0 ? 'Verified' : `${report.invalid_dates} Invalid`}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#0e121a] border border-[#1e2638] flex items-center justify-between">
                    <span className="text-slate-300">Range & Sign Checks</span>
                    <span className={`font-mono font-medium ${report.impossible_values === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {report.impossible_values === 0 ? 'Valid' : `${report.impossible_values} Anomalous`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Identified Issues */}
              {report.issues.length > 0 ? (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Flagged Observations</h4>
                  <div className="space-y-1.5">
                    {report.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-lg bg-[#0d1117] border border-[#1f283d] flex items-start space-x-2.5 text-xs"
                      >
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-slate-200">{issue.description}</p>
                          <span className="text-[10px] text-slate-400 uppercase font-mono">
                            Severity: {issue.severity}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300 flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Zero data quality defects detected in this result batch.</span>
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-[#232d42] bg-[#0d1017] flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-3.5 py-1.5 text-xs font-medium bg-[#1e273a] hover:bg-[#28354f] text-slate-200 rounded-lg transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
