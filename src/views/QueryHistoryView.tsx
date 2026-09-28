import React, { useState, useEffect } from 'react';
import { History, Play, Trash2, Bookmark, Search, Clock, CheckCircle2, AlertCircle, ShieldAlert, Terminal } from 'lucide-react';
import { QueryHistoryItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface QueryHistoryViewProps {
  onRunAgain: (question: string) => void;
  onSaveQuery: (item: QueryHistoryItem) => void;
}

export const QueryHistoryView: React.FC<QueryHistoryViewProps> = ({
  onRunAgain,
  onSaveQuery
}) => {
  const { isDark } = useTheme();
  const [history, setHistory] = useState<QueryHistoryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedSqlId, setExpandedSqlId] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/query-history');
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await fetch(`/api/query-history/${id}`, { method: 'DELETE' });
      setHistory(h => h.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete history item:', err);
    }
  };

  const handleClearAll = async () => {
    if (!confirm('Are you sure you want to clear your query history?')) return;
    try {
      await fetch('/api/query-history', { method: 'DELETE' });
      setHistory([]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const filteredHistory = history.filter(item =>
    item.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item.generated_sql && item.generated_sql.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className={`p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150 transition-colors ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${
        isDark ? 'border-[#20293d]' : 'border-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Query & Execution History</h2>
            <p className="text-xs text-slate-400">Audit trail of all executed natural-language questions and generated SQL</p>
          </div>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="px-3 py-1.5 text-xs text-red-500 hover:bg-red-500/10 border border-red-500/20 rounded-lg transition-colors flex items-center space-x-1.5 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search query history or generated SQL..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full pl-8 pr-3 py-2 border rounded-lg text-xs focus:outline-hidden focus:border-blue-500 ${
            isDark
              ? 'bg-[#0e121a] border-[#242e44] text-slate-200 placeholder-slate-500'
              : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-xs'
          }`}
        />
      </div>

      {/* History Items List */}
      <div className="space-y-3">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((item) => {
            const isExpanded = expandedSqlId === item.id;
            return (
              <div
                key={item.id}
                className={`border rounded-xl p-4 transition-all space-y-3 ${
                  isDark
                    ? 'bg-[#121620] border-[#20293d] hover:border-[#2d3954]'
                    : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-start space-x-3">
                    {item.status === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
                    {item.status === 'error' && <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />}
                    {item.status === 'denied' && <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />}
                    <div>
                      <h4 className={`text-xs font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{item.question}</h4>
                      <div className="flex items-center space-x-3 text-[11px] text-slate-400 mt-0.5 font-mono">
                        <span>{new Date(item.timestamp).toLocaleString()}</span>
                        <span>• {item.row_count} rows</span>
                        <span>• {item.execution_time_ms}ms</span>
                        <span>• Role: {item.user_role}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 self-end sm:self-auto">
                    {item.generated_sql && (
                      <button
                        onClick={() => setExpandedSqlId(isExpanded ? null : item.id)}
                        className="px-2.5 py-1 text-xs rounded-md bg-[#161c28] hover:bg-[#20293d] border border-[#242f44] text-slate-300 transition-colors flex items-center space-x-1"
                      >
                        <Terminal className="w-3 h-3 text-emerald-400" />
                        <span>{isExpanded ? 'Hide SQL' : 'View SQL'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onSaveQuery(item)}
                      className="p-1.5 rounded-md bg-[#161c28] hover:bg-[#20293d] border border-[#242f44] text-slate-300 hover:text-blue-400"
                      title="Save to workspace"
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => onRunAgain(item.question)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md flex items-center space-x-1 transition-colors"
                      title="Run again"
                    >
                      <Play className="w-3 h-3" />
                      <span>Run</span>
                    </button>

                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-white/5"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Collapsible SQL panel */}
                {isExpanded && item.generated_sql && (
                  <div className="mt-2 p-3 bg-[#080b0f] border border-[#1b2230] rounded-lg text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                    <code>{item.generated_sql}</code>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="p-12 text-center text-slate-500 bg-[#121620] border border-[#20293d] rounded-xl text-xs">
            {searchTerm ? 'No history matching your search.' : 'No queries executed yet.'}
          </div>
        )}
      </div>
    </div>
  );
};
