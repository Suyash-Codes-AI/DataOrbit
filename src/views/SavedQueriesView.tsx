import React, { useState, useEffect } from 'react';
import { Bookmark, Play, Trash2, Tag, Terminal, Search } from 'lucide-react';
import { SavedQueryItem } from '../types';
import { useTheme } from '../context/ThemeContext';

interface SavedQueriesViewProps {
  onRunQuery: (question: string) => void;
}

export const SavedQueriesView: React.FC<SavedQueriesViewProps> = ({ onRunQuery }) => {
  const { isDark } = useTheme();
  const [savedQueries, setSavedQueries] = useState<SavedQueryItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    fetchSaved();
  }, []);

  const fetchSaved = async () => {
    try {
      const res = await fetch('/api/saved-queries');
      const data = await res.json();
      setSavedQueries(data.savedQueries || []);
    } catch (err) {
      console.error('Failed to load saved queries:', err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/saved-queries/${id}`, { method: 'DELETE' });
      setSavedQueries(s => s.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete saved query:', err);
    }
  };

  const categories = ['All', ...Array.from(new Set(savedQueries.map(q => q.category)))];

  const filteredQueries = savedQueries.filter(q => {
    const matchesCategory = selectedCategory === 'All' || q.category === selectedCategory;
    const matchesSearch = q.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          q.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
            <Bookmark className="w-5 h-5" />
          </div>
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>Saved Workspace Queries</h2>
            <p className="text-xs text-slate-400">Standardized operational and analytical queries saved by your team</p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white font-semibold shadow-xs'
                  : isDark
                  ? 'bg-[#121622] text-slate-400 hover:text-slate-200 border border-[#212b3e]'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search saved queries..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`w-full pl-8 pr-3 py-1.5 border rounded-lg text-xs focus:outline-hidden focus:border-blue-500 ${
              isDark
                ? 'bg-[#0e121a] border-[#242e44] text-slate-200 placeholder-slate-500'
                : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 shadow-xs'
            }`}
          />
        </div>
      </div>

      {/* Grid of Saved Queries */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredQueries.map((q) => {
          const isExpanded = expandedId === q.id;

          return (
            <div
              key={q.id}
              className={`border rounded-xl p-4 flex flex-col justify-between transition-all space-y-3 ${
                isDark
                  ? 'bg-[#121620] border-[#20293d] hover:border-[#2f3d5b]'
                  : 'bg-white border-slate-200 hover:border-slate-300 shadow-xs'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20">
                    {q.category}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{q.savedAt}</span>
                </div>

                <h3 className={`font-semibold text-xs ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{q.name}</h3>
                {q.description && (
                  <p className="text-[11px] text-slate-400 leading-relaxed">{q.description}</p>
                )}

                <div className={`p-2.5 rounded-lg border text-[11px] ${
                  isDark
                    ? 'bg-[#0c1017] border-[#1b2333] text-slate-300'
                    : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}>
                  <span className="text-slate-400 font-sans block text-[10px] uppercase tracking-wider mb-0.5">Prompt:</span>
                  <p className="italic">"{q.question}"</p>
                </div>

                {isExpanded && q.sql && (
                  <div className={`p-2.5 border rounded-lg text-[10px] font-mono overflow-x-auto ${
                    isDark
                      ? 'bg-[#080b0f] border-[#1b2230] text-emerald-400'
                      : 'bg-slate-50 border-slate-200 text-emerald-600'
                  }`}>
                    <code>{q.sql}</code>
                  </div>
                )}
              </div>

              <div className={`pt-2 border-t flex items-center justify-between ${
                isDark ? 'border-[#1c2436]' : 'border-slate-100'
              }`}>
                <button
                  onClick={() => setExpandedId(isExpanded ? null : q.id)}
                  className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                >
                  <Terminal className="w-3 h-3 text-emerald-500" />
                  <span>{isExpanded ? 'Hide SQL' : 'Show SQL'}</span>
                </button>

                <div className="flex items-center space-x-1.5">
                  <button
                    onClick={() => handleDelete(q.id)}
                    className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Delete saved query"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => onRunQuery(q.question)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md flex items-center space-x-1 transition-colors shadow-xs"
                  >
                    <Play className="w-3 h-3" />
                    <span>Run Query</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredQueries.length === 0 && (
        <div className="p-12 text-center text-slate-500 bg-[#121620] border border-[#20293d] rounded-xl text-xs">
          No saved queries found.
        </div>
      )}
    </div>
  );
};
