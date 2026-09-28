import React, { useState } from 'react';
import { CheckCircle2, Clock, AlertCircle, ChevronDown, ChevronRight, Play, SkipForward } from 'lucide-react';
import { TraceStep } from '../types';

interface ExecutionTraceProps {
  steps: TraceStep[];
  totalDurationMs?: number;
  isOpenDefault?: boolean;
}

export const ExecutionTrace: React.FC<ExecutionTraceProps> = ({
  steps,
  totalDurationMs,
  isOpenDefault = true
}) => {
  const [isExpanded, setIsExpanded] = useState(isOpenDefault);
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);

  const completedCount = steps.filter(s => s.status === 'completed').length;
  const isAllDone = completedCount === steps.length;
  const isFailed = steps.some(s => s.status === 'failed');

  return (
    <div className="bg-[#12161f] border border-[#232b3e] rounded-xl overflow-hidden shadow-lg mb-6">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-5 py-3.5 flex items-center justify-between text-left hover:bg-[#181f2c] transition-colors"
      >
        <div className="flex items-center space-x-3">
          <div className="p-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-200">Execution Plan & Agent Trace</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                isFailed
                  ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                  : isAllDone
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                  : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
              }`}>
                {completedCount}/{steps.length} Steps
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Deterministic workflow orchestration across reasoning, database, and validation nodes
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {totalDurationMs !== undefined && (
            <span className="text-xs text-slate-400 font-mono bg-[#1c2434] px-2.5 py-1 rounded border border-[#2a364f]">
              {totalDurationMs} ms
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Steps List */}
      {isExpanded && (
        <div className="border-t border-[#232b3e] p-4 bg-[#0d1117] space-y-2">
          {steps.map((step, idx) => {
            const hasDetails = step.details && Object.keys(step.details).length > 0;
            const isStepExpanded = expandedStepId === step.id;

            return (
              <div
                key={step.id}
                className={`border rounded-lg transition-all ${
                  step.status === 'completed'
                    ? 'border-[#232b3e] bg-[#141924]/60'
                    : step.status === 'running'
                    ? 'border-blue-500/40 bg-blue-950/20 animate-pulse'
                    : step.status === 'failed'
                    ? 'border-red-500/30 bg-red-950/20'
                    : 'border-[#1b2232] bg-[#10141e]/40 opacity-70'
                }`}
              >
                <div
                  onClick={() => hasDetails && setExpandedStepId(isStepExpanded ? null : step.id)}
                  className={`px-3.5 py-2.5 flex items-center justify-between ${
                    hasDetails ? 'cursor-pointer hover:bg-white/[0.02]' : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {/* Status Icon */}
                    <div>
                      {step.status === 'completed' && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      )}
                      {step.status === 'running' && (
                        <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                      )}
                      {step.status === 'failed' && (
                        <AlertCircle className="w-4 h-4 text-red-400" />
                      )}
                      {step.status === 'pending' && (
                        <div className="w-4 h-4 rounded-full border border-slate-600 flex items-center justify-center text-[10px] text-slate-500">
                          {idx + 1}
                        </div>
                      )}
                      {step.status === 'skipped' && (
                        <SkipForward className="w-4 h-4 text-slate-500" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-semibold text-slate-200">
                          {idx + 1}. {step.name}
                        </span>
                        {step.durationMs > 0 && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {step.durationMs}ms
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">{step.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {hasDetails && (
                      <span className="text-[11px] text-blue-400/80 flex items-center hover:underline">
                        Details {isStepExpanded ? <ChevronDown className="w-3 h-3 ml-0.5" /> : <ChevronRight className="w-3 h-3 ml-0.5" />}
                      </span>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isStepExpanded && hasDetails && (
                  <div className="px-4 py-3 border-t border-[#1f283a] bg-[#0b0e14] text-xs font-mono text-slate-300">
                    <pre className="overflow-x-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-slate-300">
                      {JSON.stringify(step.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
