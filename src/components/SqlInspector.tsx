import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronRight, ShieldCheck, Database } from 'lucide-react';

interface SqlInspectorProps {
  sql: string;
  executionTimeMs?: number;
  rowCount?: number;
  tablesUsed?: string[];
}

export const SqlInspector: React.FC<SqlInspectorProps> = ({
  sql,
  executionTimeMs,
  rowCount,
  tablesUsed = []
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#11151e] border border-[#232b3d] rounded-xl overflow-hidden shadow-md mb-6">
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-5 py-3.5 flex items-center justify-between cursor-pointer hover:bg-[#161c28] transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-xs text-slate-200">Generated PostgreSQL Query</span>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center space-x-1">
                <ShieldCheck className="w-3 h-3 mr-1" /> Verified Read-Only
              </span>
            </div>
            <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5">
              {executionTimeMs !== undefined && (
                <span>Executed in <span className="text-slate-200 font-mono font-medium">{executionTimeMs}ms</span></span>
              )}
              {rowCount !== undefined && (
                <span>• Returned <span className="text-slate-200 font-mono font-medium">{rowCount.toLocaleString()}</span> rows</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="flex items-center space-x-1 px-2.5 py-1 text-xs rounded-md bg-[#1d2433] hover:bg-[#273247] border border-[#2b364e] text-slate-300 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-slate-400" />
                <span>Copy SQL</span>
              </>
            )}
          </button>
          <div className="text-slate-400 p-1">
            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-[#1e2637] bg-[#0b0e14]">
          {tablesUsed.length > 0 && (
            <div className="flex items-center space-x-2 mb-3">
              <span className="text-[11px] text-slate-400 flex items-center">
                <Database className="w-3 h-3 mr-1 text-blue-400" /> Schema Tables:
              </span>
              {tablesUsed.map((tbl) => (
                <span
                  key={tbl}
                  className="px-2 py-0.5 rounded text-[10px] font-mono bg-blue-500/10 text-blue-300 border border-blue-500/20"
                >
                  {tbl}
                </span>
              ))}
            </div>
          )}

          <pre className="p-3.5 bg-[#080b0f] border border-[#1b2230] rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
            <code>{sql}</code>
          </pre>
        </div>
      )}
    </div>
  );
};
