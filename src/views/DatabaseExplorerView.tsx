import React, { useState, useEffect } from 'react';
import { Database, Table, Key, Play, RefreshCw, AlertCircle, CheckCircle2, Terminal } from 'lucide-react';
import { DataTable } from '../components/DataTable';
import { useTheme } from '../context/ThemeContext';

interface ColumnDef {
  name: string;
  type: string;
  pk: boolean;
  nullable: boolean;
}

interface TableDef {
  tableName: string;
  description: string;
  rowCount: number;
  columns: ColumnDef[];
}

export const DatabaseExplorerView: React.FC = () => {
  const { isDark } = useTheme();
  const [tables, setTables] = useState<TableDef[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('sales');
  const [tableData, setTableData] = useState<{ columns: string[]; rows: any[]; totalCount: number }>({
    columns: [],
    rows: [],
    totalCount: 0
  });
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [customSql, setCustomSql] = useState('SELECT * FROM sales ORDER BY sale_date DESC LIMIT 20;');
  const [sqlResult, setSqlResult] = useState<{ columns: string[]; rows: any[]; rowCount: number; executionTimeMs: number } | null>(null);
  const [sqlError, setSqlError] = useState<string | null>(null);
  const [executingSql, setExecutingSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'console'>('preview');

  useEffect(() => {
    fetchSchema();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTablePreview(selectedTable);
    }
  }, [selectedTable]);

  const fetchSchema = async () => {
    try {
      const res = await fetch('/api/database/schema');
      const data = await res.json();
      setTables(data.tables || []);
    } catch (err) {
      console.error('Failed to fetch database schema:', err);
    }
  };

  const fetchTablePreview = async (tableName: string) => {
    setLoadingPreview(true);
    try {
      const res = await fetch(`/api/database/preview/${tableName}?limit=30`);
      const data = await res.json();
      setTableData({
        columns: data.columns || [],
        rows: data.rows || [],
        totalCount: data.totalCount || 0
      });
    } catch (err) {
      console.error('Failed to preview table:', err);
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleExecuteSql = async () => {
    if (!customSql.trim() || executingSql) return;
    setExecutingSql(true);
    setSqlError(null);

    try {
      const res = await fetch('/api/database/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: customSql.trim() })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'SQL execution failed.');
      }

      setSqlResult(data);
    } catch (err: any) {
      setSqlError(err.message);
      setSqlResult(null);
    } finally {
      setExecutingSql(false);
    }
  };

  const currentTableDef = tables.find(t => t.tableName === selectedTable);

  return (
    <div className={`p-6 md:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-150 transition-colors ${
      isDark ? 'text-slate-100' : 'text-slate-800'
    }`}>
      {/* DB Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b gap-3 ${
        isDark ? 'border-[#20293d]' : 'border-slate-200'
      }`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className={`text-base font-bold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>PostgreSQL Explorer</h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Connected</span>
              </span>
            </div>
            <p className="text-xs text-slate-400">Database: dataorbit_relational • High Performance In-Memory PostgreSQL</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveTab('preview')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              activeTab === 'preview'
                ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                : isDark
                ? 'bg-[#151b27] border-[#253046] text-slate-400 hover:text-slate-200'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
            }`}
          >
            Table Browser
          </button>
          <button
            onClick={() => setActiveTab('console')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors flex items-center space-x-1.5 ${
              activeTab === 'console'
                ? 'bg-blue-600 text-white border-blue-500 font-semibold'
                : isDark
                ? 'bg-[#151b27] border-[#253046] text-slate-400 hover:text-slate-200'
                : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>SQL Console</span>
          </button>
        </div>
      </div>

      {activeTab === 'preview' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Tables Sidebar */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Database Tables ({tables.length})
            </h3>
            <div className="space-y-1.5">
              {tables.map((t) => (
                <button
                  key={t.tableName}
                  onClick={() => setSelectedTable(t.tableName)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    selectedTable === t.tableName
                      ? 'bg-blue-600/15 border-blue-500/40 text-blue-300'
                      : 'bg-[#121620] border-[#20293d] text-slate-400 hover:text-slate-200 hover:bg-[#161c2b]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200 flex items-center space-x-1.5">
                      <Table className="w-3.5 h-3.5" />
                      <span>{t.tableName}</span>
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 bg-[#0c1017] px-2 py-0.5 rounded border border-white/5">
                      {t.rowCount.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">{t.description}</p>
                </button>
              ))}
            </div>

            {/* Schema Columns Card */}
            {currentTableDef && (
              <div className="p-4 rounded-xl bg-[#121620] border border-[#20293d] space-y-3 mt-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Schema: {selectedTable}
                </h4>
                <div className="space-y-1.5 text-xs max-h-64 overflow-y-auto">
                  {currentTableDef.columns.map((c) => (
                    <div key={c.name} className="flex items-center justify-between p-1.5 rounded bg-[#0b0e14] border border-[#1a2233]">
                      <div className="flex items-center space-x-1.5">
                        {c.pk && <Key className="w-3 h-3 text-amber-400" />}
                        <span className="text-slate-200 font-mono text-[11px]">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">{c.type}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Table Preview */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-100 capitalize">
                  Table Preview: <span className="font-mono text-blue-400">{selectedTable}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Displaying sample rows from {tableData.totalCount.toLocaleString()} total records
                </p>
              </div>

              <button
                onClick={() => fetchTablePreview(selectedTable)}
                disabled={loadingPreview}
                className="p-1.5 rounded-lg bg-[#161c28] border border-[#242f44] text-slate-300 hover:text-white"
                title="Refresh preview"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPreview ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {loadingPreview ? (
              <div className="p-12 text-center text-slate-500 text-xs">Loading records...</div>
            ) : (
              <DataTable
                columns={tableData.columns}
                rows={tableData.rows}
                tableName={selectedTable}
              />
            )}
          </div>
        </div>
      ) : (
        // Direct SQL Console Tab
        <div className="space-y-4">
          <div className="bg-[#121622] border border-[#232d42] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center space-x-2">
                <Terminal className="w-4 h-4 text-emerald-400" />
                <span>Read-Only SQL Query Console</span>
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Timeout: 15,000ms • Max Rows: 10,000
              </span>
            </div>

            <textarea
              rows={4}
              value={customSql}
              onChange={(e) => setCustomSql(e.target.value)}
              className="w-full p-3 bg-[#080b0f] border border-[#242f44] rounded-lg font-mono text-xs text-emerald-300 focus:outline-hidden focus:border-blue-500 leading-relaxed"
              placeholder="SELECT * FROM sales LIMIT 10;"
            />

            <div className="flex items-center justify-between pt-1">
              <div className="text-[11px] text-slate-400">
                Guarded against destructive queries: INSERT, UPDATE, DELETE, DROP blocked automatically.
              </div>
              <button
                onClick={handleExecuteSql}
                disabled={executingSql}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-colors"
              >
                {executingSql ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                <span>Execute SQL</span>
              </button>
            </div>
          </div>

          {/* SQL Error */}
          {sqlError && (
            <div className="p-4 rounded-xl bg-red-950/30 border border-red-500/30 text-red-200 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{sqlError}</span>
            </div>
          )}

          {/* SQL Results */}
          {sqlResult && (
            <div className="space-y-3">
              <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono">
                <span className="text-emerald-400 font-semibold">✓ Query Successful</span>
                <span>• {sqlResult.rowCount} rows</span>
                <span>• {sqlResult.executionTimeMs}ms execution time</span>
              </div>
              <DataTable
                columns={sqlResult.columns}
                rows={sqlResult.rows}
                tableName="custom_sql_query"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
