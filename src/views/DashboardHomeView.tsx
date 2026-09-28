import React from 'react';
import {
  BrainCircuit,
  ArrowRight,
  Database,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  FileText,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
  Lock,
  Layers,
  BarChart3,
  Orbit
} from 'lucide-react';
import { DatabaseStats, QueryHistoryItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface DashboardHomeViewProps {
  stats: DatabaseStats | null;
  recentQueries: QueryHistoryItem[];
  onSelectPrompt: (prompt: string) => void;
  onNavigateToAnalyst: () => void;
  onNavigateToDatabase: () => void;
  onNavigateToCsv?: () => void;
  onNavigateToVisualizer?: () => void;
}

export const DashboardHomeView: React.FC<DashboardHomeViewProps> = ({
  stats,
  recentQueries,
  onSelectPrompt,
  onNavigateToAnalyst,
  onNavigateToDatabase,
  onNavigateToCsv,
  onNavigateToVisualizer
}) => {
  const { isDark } = useTheme();

  const quickPrompts = [
    {
      title: 'Regional Comparison & Decline Detection',
      question: 'Compare Delhi and Mumbai sales for the last 6 months and identify products whose sales are declining',
      tag: 'Comparative Analytics',
      desc: 'Correlates Western and Northern territories and calculates product-level growth velocity.'
    },
    {
      title: 'Top Revenue Generating Products',
      question: 'Show me the top 10 products by revenue',
      tag: 'Core Performance',
      desc: 'Ranks top 10 enterprise offerings by gross transaction revenue, margin, and volume.'
    },
    {
      title: 'RAG Diagnostic: Q3 Delhi Sales Drop',
      question: 'Why did sales decline in Delhi in Q3? Check sales, inventory, and company policy documents and give me evidence',
      tag: 'RAG + SQL Fusion',
      desc: 'Retrieves transactional dip in Delhi alongside warehouse monsoon maintenance circulars.'
    },
    {
      title: 'Regional Profit & Margin Leaders',
      question: 'Which region has the highest profit and margin?',
      tag: 'Territorial ROI',
      desc: 'Groups sales by customer city and computes net profitability and margin percentage.'
    },
    {
      title: 'Monthly Revenue & Trend Trajectory',
      question: 'Show monthly revenue trends and detect unusual spikes or anomalies',
      tag: 'Time-Series',
      desc: 'Aggregates monthly volume across 2025-2026 and scans for statistical Z-score anomalies.'
    }
  ];

  return (
    <div
      className={`p-6 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-200 transition-colors duration-200 ${
        isDark ? 'text-slate-100' : 'text-slate-800'
      }`}
    >
      {/* Hero Banner */}
      <div
        className={`relative overflow-hidden rounded-3xl p-8 md:p-10 shadow-2xl border transition-colors ${
          isDark
            ? 'bg-linear-to-b from-[#131926] to-[#0c0f17] border-[#212b3e]'
            : 'bg-linear-to-b from-blue-50/70 to-white border-blue-100/80 shadow-slate-200/50'
        }`}
      >
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 text-xs font-semibold mb-4">
            <Orbit className="w-3.5 h-3.5" />
            <span>DataOrbit • Multi-Source Data Platform & Visualizer</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
            Connect all your data sources.<br />
            <span className="bg-linear-to-r from-blue-500 via-indigo-500 to-cyan-500 bg-clip-text text-transparent">
              Explore, visualize, and reason with AI.
            </span>
          </h1>

          <p
            className={`text-sm sm:text-base mt-4 leading-relaxed ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            DataOrbit unifies PostgreSQL relational ledgers, CSV tabular extracts, and operational documents.
            Build interactive charts, execute verified agentic queries, and inspect audits with zero numeric hallucinations.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <button
              onClick={onNavigateToAnalyst}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition-all shadow-lg shadow-blue-600/25 flex items-center space-x-2"
            >
              <span>Ask AI Analyst</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            {onNavigateToVisualizer && (
              <button
                onClick={onNavigateToVisualizer}
                className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-cyan-600/20 flex items-center space-x-2"
              >
                <BarChart3 className="w-4 h-4" />
                <span>Open Data Visualizer</span>
              </button>
            )}

            <button
              onClick={onNavigateToDatabase}
              className={`px-4 py-2.5 border text-xs font-medium rounded-xl transition-colors flex items-center space-x-2 ${
                isDark
                  ? 'bg-[#171d2b] hover:bg-[#20293d] border-[#28354f] text-slate-200'
                  : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-500" />
              <span>Explore PostgreSQL</span>
            </button>

            {onNavigateToCsv && (
              <button
                onClick={onNavigateToCsv}
                className="px-4 py-2.5 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-600 dark:text-teal-400 text-xs font-medium rounded-xl transition-colors flex items-center space-x-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-teal-500" />
                <span>Extract CSV & Ask AI</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Architecture Pipeline Visual */}
      <div
        className={`rounded-2xl p-6 border transition-colors ${
          isDark ? 'bg-[#10141e] border-[#20293d]' : 'bg-white border-slate-200 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <h2
            className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-2 ${
              isDark ? 'text-slate-300' : 'text-slate-700'
            }`}
          >
            <Layers className="w-4 h-4 text-blue-500" />
            <span>DataOrbit Multi-Source Architecture</span>
          </h2>
          <span className="text-[11px] text-slate-400 font-mono">End-to-End Orchestration</span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2 text-center text-xs">
          {[
            { step: '1. Connect', desc: 'PostgreSQL & CSV', icon: Database, color: 'text-emerald-500' },
            { step: '2. Request', desc: 'Natural Language / SQL', icon: BrainCircuit, color: 'text-blue-500' },
            { step: '3. Security', desc: 'RBAC Permission Guard', icon: Lock, color: 'text-amber-500' },
            { step: '4. Retrieval', desc: 'Safe Query + RAG', icon: Sparkles, color: 'text-indigo-500' },
            { step: '5. Validate', desc: 'Missing & Outlier Audit', icon: ShieldCheck, color: 'text-teal-500' },
            { step: '6. Math', desc: 'Deterministic Analysis', icon: TrendingUp, color: 'text-cyan-500' },
            { step: '7. Visuals', desc: 'Graphical Visualizer', icon: BarChart3, color: 'text-purple-500' },
            { step: '8. Insights', desc: 'Actionable Deliverables', icon: FileText, color: 'text-blue-500' }
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className={`p-3 rounded-xl border flex flex-col items-center justify-center space-y-1.5 ${
                  isDark ? 'bg-[#0b0e15] border-[#1b2334]' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className={`font-semibold text-[11px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  {item.step}
                </span>
                <span className="text-[10px] text-slate-400 leading-tight">{item.desc}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          className={`p-5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Database Records</span>
            <Database className="w-4 h-4 text-emerald-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {stats ? stats.totalSales.toLocaleString() : '6,200+'}
          </div>
          <p className="text-[11px] text-slate-400">PostgreSQL transactional ledger (2025-2026)</p>
        </div>

        <div
          className={`p-5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Enterprise Clients</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {stats ? stats.totalCustomers : '120'}
          </div>
          <p className="text-[11px] text-slate-400">Delhi, Mumbai, Bangalore, Chennai, Pune</p>
        </div>

        <div
          className={`p-5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Product Catalog</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            {stats ? stats.totalProducts : '15'}
          </div>
          <p className="text-[11px] text-slate-400">Software, Cloud, Hardware, IoT Devices</p>
        </div>

        <div
          className={`p-5 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>Execution Latency</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className={`text-2xl font-bold font-mono ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
            ~110 ms
          </div>
          <p className="text-[11px] text-slate-400">Deterministic SQL + Validation Engine</p>
        </div>
      </div>

      {/* Recommended Prompt Launchers */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
              Recommended Analysis Workflows
            </h3>
            <p className="text-xs text-slate-400">Click any prompt to execute the multi-step agent workflow</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {quickPrompts.map((p, idx) => (
            <div
              key={idx}
              onClick={() => onSelectPrompt(p.question)}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between group shadow-sm ${
                isDark
                  ? 'bg-[#121622] border-[#20293d] hover:border-blue-500/50 hover:bg-[#161c2b]'
                  : 'bg-white border-slate-200 hover:border-blue-500/50 hover:bg-slate-50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {p.tag}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4
                  className={`text-xs font-semibold leading-snug group-hover:text-blue-500 transition-colors ${
                    isDark ? 'text-slate-200' : 'text-slate-800'
                  }`}
                >
                  "{p.question}"
                </h4>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  {p.desc}
                </p>
              </div>

              <div
                className={`mt-4 pt-3 border-t flex items-center justify-between text-[10px] font-mono ${
                  isDark ? 'border-[#1c2436] text-slate-500' : 'border-slate-100 text-slate-400'
                }`}
              >
                <span>Run Agent Flow</span>
                <span className="text-blue-500">Launch ↵</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Queries */}
      {recentQueries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Recent Executions
          </h3>
          <div
            className={`border rounded-xl overflow-hidden divide-y ${
              isDark
                ? 'bg-[#121620] border-[#20293d] divide-[#1b2233]'
                : 'bg-white border-slate-200 divide-slate-100 shadow-xs'
            }`}
          >
            {recentQueries.slice(0, 4).map((q) => (
              <div
                key={q.id}
                onClick={() => onSelectPrompt(q.question)}
                className={`p-3.5 px-4 flex items-center justify-between cursor-pointer transition-colors text-xs ${
                  isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                  <div>
                    <span className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{q.question}</span>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {new Date(q.timestamp).toLocaleTimeString()} • {q.row_count} rows • {q.execution_time_ms}ms
                    </div>
                  </div>
                </div>
                <span className="text-xs text-blue-500 flex items-center space-x-1 hover:underline">
                  <span>Re-run</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

