import React, { useState, useEffect, useRef } from 'react';
import {
  Send,
  Sparkles,
  RefreshCw,
  Bookmark,
  Download,
  AlertCircle,
  Copy,
  Terminal,
  ShieldAlert,
  ArrowRight,
  Database
} from 'lucide-react';
import {
  AgentExecutionState,
  UserRole,
  TraceStep
} from '../types';
import { ExecutionTrace } from '../components/ExecutionTrace';
import { DataQualityBadge } from '../components/DataQualityBadge';
import { ChartViewer } from '../components/ChartViewer';
import { DataTable } from '../components/DataTable';
import { SqlInspector } from '../components/SqlInspector';
import { InsightsPanel } from '../components/InsightsPanel';
import { SourceCitations } from '../components/SourceCitations';
import { SaveQueryModal } from '../components/SaveQueryModal';
import { useTheme } from '../context/ThemeContext';
import Papa from 'papaparse';

interface AnalystViewProps {
  initialQuery?: string;
  userRole: UserRole;
  onExecutionFinished?: () => void;
}

export const AnalystView: React.FC<AnalystViewProps> = ({
  initialQuery = '',
  userRole,
  onExecutionFinished
}) => {
  const { isDark } = useTheme();
  const [queryInput, setQueryInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentExecutionState | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [liveSteps, setLiveSteps] = useState<TraceStep[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const samplePrompts = [
    'Compare Delhi and Mumbai sales for the last 6 months and identify products whose sales are declining',
    'Show me the top 10 products by revenue',
    'Why did sales decline in Delhi in Q3? Check sales, inventory, and company policy documents and give me evidence',
    'Which region has the highest profit and margin?',
    'Find unusual sales behavior and anomalies',
    'Show monthly revenue trends'
  ];

  useEffect(() => {
    if (initialQuery) {
      setQueryInput(initialQuery);
      executeAgentQuery(initialQuery);
    }
  }, [initialQuery]);

  const executeAgentQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    setLoading(true);
    setErrorMsg(null);

    // Initial placeholder steps
    const initialSteps: TraceStep[] = [
      { id: '1_understand', name: 'Understanding Request', description: 'Deconstructing intent, dimensions, and entity references', status: 'running', durationMs: 0 },
      { id: '2_plan', name: 'Creating Execution Plan', description: 'Formulating step-by-step analytical sequence', status: 'pending', durationMs: 0 },
      { id: '3_permissions', name: 'Checking Permissions', description: 'Enforcing role-based access boundaries', status: 'pending', durationMs: 0 },
      { id: '4_tools', name: 'Selecting Data Tools', description: 'Mapping analytical goals to query and RAG tools', status: 'pending', durationMs: 0 },
      { id: '5_execute', name: 'Executing Tools & Data Retrieval', description: 'Querying PostgreSQL and retrieving indexed corporate documents', status: 'pending', durationMs: 0 },
      { id: '6_validate', name: 'Validating Data Deterministically', description: 'Testing for nulls, duplicates, and outliers', status: 'pending', durationMs: 0 },
      { id: '7_analyze', name: 'Performing Deterministic Calculations', description: 'Executing mathematical growth, stats, and aggregations', status: 'pending', durationMs: 0 },
      { id: '8_patterns', name: 'Detecting Trends & Anomalies', description: 'Scanning for Z-score anomalies and trajectory changes', status: 'pending', durationMs: 0 },
      { id: '9_insights', name: 'Generating Structured Insights', description: 'LLM synthesizes verified facts and separates hypotheses', status: 'pending', durationMs: 0 },
      { id: '10_viz', name: 'Creating Visualizations', description: 'Formulating visualization spec matching dimensional data', status: 'pending', durationMs: 0 },
      { id: '11_response', name: 'Synthesizing Final Response', description: 'Assembling executive brief and interactive dashboard artifacts', status: 'pending', durationMs: 0 }
    ];
    setLiveSteps(initialSteps);

    try {
      const response = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText.trim(),
          userRole
        })
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || `HTTP ${response.status} Error`);
      }

      const data: AgentExecutionState = await response.json();
      setResult(data);
      setLiveSteps(data.trace_steps || []);

      if (onExecutionFinished) {
        onExecutionFinished();
      }
    } catch (err: any) {
      console.error('Query execution error:', err);
      setErrorMsg(err.message || 'Failed to complete agent workflow.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeAgentQuery(queryInput);
  };

  const handleExportCsv = () => {
    if (!result?.raw_data?.rows?.length) return;
    const csv = Papa.unparse(result.raw_data.rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_intel_${Date.now()}.csv`;
    a.click();
  };

  return (
    <div
      className={`p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150 transition-colors ${
        isDark ? 'text-slate-100' : 'text-slate-800'
      }`}
    >
      {/* Top Natural Language Search Command Bar */}
      <div
        className={`rounded-2xl p-5 border shadow-xl transition-colors ${
          isDark ? 'bg-[#121622] border-[#232d42]' : 'bg-white border-slate-200 shadow-slate-200/50'
        }`}
      >
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative flex items-center">
            <Sparkles className="w-5 h-5 absolute left-4 text-blue-500 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              placeholder="Ask your data anything (e.g. Compare Delhi and Mumbai sales, find declining products...)"
              className={`w-full pl-12 pr-28 py-3.5 border rounded-xl text-sm focus:outline-hidden focus:border-blue-500 transition-colors font-medium ${
                isDark
                  ? 'bg-[#0a0d14] border-[#26334c] text-slate-100 placeholder-slate-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
            <button
              type="submit"
              disabled={loading || !queryInput.trim()}
              className="absolute right-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-all flex items-center space-x-1.5 shadow-md shadow-blue-600/30"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking...</span>
                </>
              ) : (
                <>
                  <span>Analyze</span>
                  <Send className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Quick Prompt Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span
              className={`text-[11px] font-semibold uppercase tracking-wider mr-1 ${
                isDark ? 'text-slate-500' : 'text-slate-400'
              }`}
            >
              Sample Inquiries:
            </span>
            {samplePrompts.map((prompt, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQueryInput(prompt);
                  executeAgentQuery(prompt);
                }}
                className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors truncate max-w-[280px] ${
                  isDark
                    ? 'bg-[#171d2b] hover:bg-[#20293d] border-[#253046] text-slate-300 hover:text-white'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700 hover:text-slate-900'
                }`}
                title={prompt}
              >
                {prompt}
              </button>
            ))}
          </div>
        </form>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 flex items-start space-x-3 text-red-200 text-xs">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Workflow Failed:</span> {errorMsg}
          </div>
        </div>
      )}

      {/* Live Execution Trace UI */}
      {(loading || result) && liveSteps.length > 0 && (
        <ExecutionTrace
          steps={liveSteps}
          totalDurationMs={result?.totalDurationMs}
          isOpenDefault={true}
        />
      )}

      {/* Loading Skeleton Indicator */}
      {loading && !result && (
        <div
          className={`p-8 rounded-xl border flex flex-col items-center justify-center space-y-3 ${
            isDark ? 'bg-[#10141e] border-[#1e273a]' : 'bg-white border-slate-200 shadow-sm'
          }`}
        >
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
            Running 11-stage autonomous data intelligence workflow...
          </p>
          <span className="text-[11px] text-slate-400 font-mono">
            Reasoning • PostgreSQL Engine • Deterministic Verification
          </span>
        </div>
      )}

      {/* Result Section */}
      {result && (
        <div className="space-y-6">
          {/* Header Action Bar */}
          <div
            className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-3 ${
              isDark ? 'border-[#212a3d]' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center space-x-3">
              {result.validation_report && (
                <DataQualityBadge report={result.validation_report} />
              )}
              <span className="text-xs text-slate-400 font-mono hidden sm:inline">
                {result.raw_data.rowCount} rows • {result.raw_data.executionTimeMs}ms query
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => executeAgentQuery(result.user_query)}
                disabled={loading}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-[#161c28] hover:bg-[#20293d] border-[#273248] text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Run Again</span>
              </button>

              <button
                onClick={() => setShowSaveModal(true)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                  isDark
                    ? 'bg-[#161c28] hover:bg-[#20293d] border-[#273248] text-slate-200'
                    : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
                }`}
              >
                <Bookmark className="w-3.5 h-3.5 text-blue-500" />
                <span>Save Query</span>
              </button>

              {result.raw_data.rowCount > 0 && (
                <button
                  onClick={handleExportCsv}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/30 text-blue-500 font-medium transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-blue-500" />
                  <span>Export CSV</span>
                </button>
              )}
            </div>
          </div>

          {/* Access Denied Card (if permission denied) */}
          {result.execution_status === 'denied' && (
            <div className="p-6 rounded-2xl bg-red-950/20 border border-red-500/30 space-y-3">
              <div className="flex items-center space-x-2 text-red-400 font-bold text-sm">
                <ShieldAlert className="w-5 h-5" />
                <span>Permission Policy Violation</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                The requested query attempted to access sources restricted for role <strong>{result.user_role}</strong>.
                Switch to an <strong>Executive</strong> role in the top navbar or Settings to access sensitive datasets (e.g. employee compensation).
              </p>
            </div>
          )}

          {/* 1. Structured Insights Panel */}
          {result.insights && result.execution_status !== 'denied' && (
            <InsightsPanel insights={result.insights} />
          )}

          {/* 2. Interactive Chart */}
          {result.visualization_spec?.enabled && result.raw_data?.rows?.length > 0 && (
            <ChartViewer spec={result.visualization_spec} data={result.raw_data.rows} />
          )}

          {/* 3. Paginated Data Table */}
          {result.raw_data?.rows?.length > 0 && (
            <DataTable
              columns={result.raw_data.columns}
              rows={result.raw_data.rows}
              tableName="analyst_report"
            />
          )}

          {/* 4. Generated SQL Inspector */}
          {result.generated_sql && (
            <SqlInspector
              sql={result.generated_sql}
              executionTimeMs={result.raw_data.executionTimeMs}
              rowCount={result.raw_data.rowCount}
              tablesUsed={result.validation_report?.columns ? ['sales', 'products', 'customers'] : []}
            />
          )}

          {/* 5. Data Sources & Citations */}
          {result.citations?.length > 0 && (
            <SourceCitations citations={result.citations} />
          )}
        </div>
      )}

      {/* Save Query Modal */}
      {showSaveModal && result && (
        <SaveQueryModal
          question={result.user_query}
          sql={result.generated_sql}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
};

