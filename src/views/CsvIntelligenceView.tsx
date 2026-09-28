import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Upload,
  Sparkles,
  Bot,
  BrainCircuit,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  BarChart3,
  Database,
  Plus,
  Trash2
} from 'lucide-react';
import Papa from 'papaparse';
import { CsvDatasetMeta, CsvDatasetDetail, CsvAiQueryResult, VisualizationSpec } from '../types';
import { ChartViewer } from '../components/ChartViewer';
import { DataTable } from '../components/DataTable';
import { useTheme } from '../context/ThemeContext';

export const CsvIntelligenceView: React.FC = () => {
  const { isDark } = useTheme();
  const [datasets, setDatasets] = useState<CsvDatasetMeta[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [datasetDetail, setDatasetDetail] = useState<CsvDatasetDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  // Paste CSV or upload
  const [showPasteModal, setShowPasteModal] = useState<boolean>(false);
  const [pastedName, setPastedName] = useState<string>('Custom Extracted Data.csv');
  const [pastedCsv, setPastedCsv] = useState<string>('');

  // AI Question State
  const [aiQuestion, setAiQuestion] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResult, setAiResult] = useState<CsvAiQueryResult | null>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'schema' | 'stats' | 'sql'>('preview');

  // Load datasets on mount
  useEffect(() => {
    fetchDatasets();
  }, []);

  const fetchDatasets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/csv/datasets');
      if (res.ok) {
        const data = await res.json();
        setDatasets(data.datasets || []);
        if (data.datasets?.length > 0 && !selectedId) {
          selectDataset(data.datasets[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch CSV datasets:', err);
    } finally {
      setLoading(false);
    }
  };

  const selectDataset = async (id: string) => {
    setSelectedId(id);
    setAiResult(null);
    try {
      const res = await fetch(`/api/csv/datasets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDatasetDetail(data.dataset);
      }
    } catch (err) {
      console.error('Failed to fetch dataset details:', err);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      const text = await file.text();
      const res = await fetch('/api/csv/extract-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: file.name.replace(/\.[^/.]+$/, ''),
          filename: file.name,
          csvRawText: text
        })
      });

      if (res.ok) {
        const data = await res.json();
        await fetchDatasets();
        selectDataset(data.dataset.id);
      } else {
        const err = await res.json();
        alert(`Extraction failed: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Upload error: ${err.message}`);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handlePasteExtract = async () => {
    if (!pastedCsv.trim()) return;

    try {
      setUploading(true);
      const res = await fetch('/api/csv/extract-upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: pastedName.replace(/\.[^/.]+$/, ''),
          filename: pastedName.trim().endsWith('.csv') ? pastedName.trim() : `${pastedName.trim()}.csv`,
          csvRawText: pastedCsv
        })
      });

      if (res.ok) {
        const data = await res.json();
        setShowPasteModal(false);
        setPastedCsv('');
        await fetchDatasets();
        selectDataset(data.dataset.id);
      } else {
        const err = await res.json();
        alert(`Extraction failed: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Error extracting CSV: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDataset = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to remove this CSV dataset?')) return;
    try {
      await fetch(`/api/csv/datasets/${id}`, { method: 'DELETE' });
      await fetchDatasets();
      if (selectedId === id) {
        setSelectedId(null);
        setDatasetDetail(null);
      }
    } catch (err) {
      console.error('Failed to delete dataset:', err);
    }
  };

  const handleRunAiAnalysis = async (customPrompt?: string) => {
    const queryToRun = customPrompt || aiQuestion;
    if (!queryToRun.trim() || !selectedId) return;

    try {
      setAiLoading(true);
      const res = await fetch('/api/csv/ask-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          datasetId: selectedId,
          question: queryToRun
        })
      });

      if (res.ok) {
        const data = await res.json();
        setAiResult(data);
      } else {
        const err = await res.json();
        alert(`AI Analysis error: ${err.error}`);
      }
    } catch (err: any) {
      alert(`Failed to query AI on dataset: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    if (!datasetDetail) return;
    const csvContent = Papa.unparse(datasetDetail.allRows || datasetDetail.sampleRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', datasetDetail.filename || `${datasetDetail.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const samplePrompts = [
    'Which region has the highest total revenue and what is the margin percentage?',
    'Identify all anomalies or outlier rows in the dataset and explain them',
    'Calculate the average customer acquisition cost by channel and rank them',
    'Provide a statistical executive summary of numerical trends and growth opportunities'
  ];

  return (
    <div className={`p-6 max-w-7xl mx-auto space-y-6 transition-colors ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
      {/* Top Header */}
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b ${isDark ? 'border-[#1e2535]' : 'border-slate-200'}`}>
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-teal-500/10 text-teal-500 border border-teal-500/20">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h1 className={`text-xl font-bold flex items-center space-x-2 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                <span>CSV Extraction & AI Intelligence</span>
                <span className="text-xs bg-linear-to-r from-teal-500/20 to-blue-500/20 text-teal-500 font-mono px-2 py-0.5 rounded border border-teal-500/30">
                  AI + Extractor
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Extract, parse, validate, and reason over CSV datasets with deterministic calculations and Gemini AI
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5">
          <label className={`cursor-pointer inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
            isDark
              ? 'bg-[#151b28] hover:bg-[#1c2436] text-slate-300 hover:text-white border-[#20293d]'
              : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-xs'
          }`}>
            <Upload className="w-3.5 h-3.5 text-blue-500" />
            <span>Upload CSV</span>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFileUpload}
              disabled={uploading}
              className="hidden"
            />
          </label>

          <button
            onClick={() => setShowPasteModal(true)}
            className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isDark
                ? 'bg-[#151b28] hover:bg-[#1c2436] text-slate-300 hover:text-white border-[#20293d]'
                : 'bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border-slate-200 shadow-xs'
            }`}
          >
            <Plus className="w-3.5 h-3.5 text-teal-500" />
            <span>Paste / Extract Text</span>
          </button>

          {datasetDetail && (
            <button
              onClick={handleDownloadCsv}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 text-blue-500 font-medium border border-blue-500/30 text-xs transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Dataset Selector Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        <span className="text-xs font-medium text-slate-400 shrink-0 mr-1">Extracted Datasets:</span>
        {datasets.map((d: CsvDatasetMeta) => (
          <div
            key={d.id}
            onClick={() => selectDataset(d.id)}
            className={`cursor-pointer flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedId === d.id
                ? 'bg-teal-500/15 text-teal-500 border border-teal-500/30 shadow-xs font-semibold'
                : isDark
                ? 'bg-[#121622] text-slate-400 hover:text-slate-200 border border-[#1e2535]'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 shadow-xs'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-teal-500" />
            <span className="font-semibold">{d.name}</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded ${isDark ? 'bg-black/40 text-slate-400' : 'bg-slate-100 text-slate-500'}`}>
              {d.rowCount} rows
            </span>
            <button
              onClick={(e) => handleDeleteDataset(d.id, e)}
              className="hover:text-red-400 ml-1 p-0.5 rounded text-slate-400 transition-colors"
              title="Delete dataset"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      {datasetDetail && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Dataset Overview & AI Interaction */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Reasoning Box */}
            <div className="p-4 rounded-xl bg-[#121622] border border-[#20293d] shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-md bg-linear-to-r from-blue-600 to-teal-500 text-white shadow-xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-100">
                      Ask AI about this Extracted Dataset
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      Dual engine: executes deterministic calculations then Gemini synthesizes business insights
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-teal-400 bg-teal-500/10 px-2 py-0.5 rounded border border-teal-500/20">
                  Gemini Flash 3.8
                </span>
              </div>

              {/* Input bar */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={aiQuestion}
                    onChange={(e) => setAiQuestion(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleRunAiAnalysis()}
                    placeholder="Ask any question, e.g., 'Compare revenue by region and identify the best performers'..."
                    className="w-full pl-3 pr-8 py-2 rounded-lg bg-[#0d1017] border border-[#232b3e] text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-teal-500/50"
                  />
                </div>
                <button
                  onClick={() => handleRunAiAnalysis()}
                  disabled={aiLoading || !aiQuestion.trim()}
                  className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5 transition-all shadow-sm"
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Reasoning...</span>
                    </>
                  ) : (
                    <>
                      <BrainCircuit className="w-3.5 h-3.5" />
                      <span>Analyze</span>
                    </>
                  )}
                </button>
              </div>

              {/* Sample prompt pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-500 py-0.5">Try:</span>
                {samplePrompts.map((prompt: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => {
                      setAiQuestion(prompt);
                      handleRunAiAnalysis(prompt);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-md bg-[#161c2a] hover:bg-[#1d2538] text-slate-300 hover:text-teal-300 border border-[#232c42] transition-colors"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* AI Results Display */}
            {aiResult && (
              <div className="p-5 rounded-xl bg-[#121622] border border-teal-500/30 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#1e2535]">
                  <div className="flex items-center space-x-2">
                    <Bot className="w-4 h-4 text-teal-400" />
                    <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                      AI Analysis Findings
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">
                    Query: "{aiResult.question}"
                  </span>
                </div>

                {/* Direct Answer */}
                <div className="p-3.5 rounded-lg bg-[#0d1017] border border-[#1e2535] text-xs text-slate-200 leading-relaxed">
                  <div className="font-semibold text-teal-400 mb-1 flex items-center space-x-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Executive Answer</span>
                  </div>
                  {aiResult.directAnswer}
                </div>

                {/* Key Insights & Anomalies */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-[#0d1017] border border-[#1e2535]">
                    <div className="text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>Mathematical Insights</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {aiResult.keyInsights?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0d1017] border border-[#1e2535]">
                    <div className="text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      <span>Anomalies & Hypotheses</span>
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {aiResult.anomaliesDetected?.map((item: string, i: number) => (
                        <li key={i} className="flex items-start space-x-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Deterministic Aggregates Summary */}
                {aiResult.deterministicSummary && (
                  <div className="p-3 rounded-lg bg-teal-500/5 border border-teal-500/20">
                    <div className="text-[11px] font-bold text-teal-400 uppercase tracking-wider mb-2">
                      Deterministic Computed Metrics
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-300">
                      {Object.entries(aiResult.deterministicSummary.aggregates || {}).map(([key, val]: [string, number]) => (
                        <div key={key} className="p-2 rounded bg-[#0e121b] border border-[#1e2535]">
                          <div className="text-[10px] text-slate-400 font-mono truncate">{key}</div>
                          <div className="text-sm font-bold text-teal-300 font-mono">{typeof val === 'number' ? val.toLocaleString() : val}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Generated Visualization Spec */}
                {aiResult.visualizationSpec && (
                  <div className="mt-4 pt-4 border-t border-[#1e2535]">
                    <div className="text-xs font-semibold text-slate-200 mb-2 flex items-center space-x-2">
                      <BarChart3 className="w-4 h-4 text-teal-400" />
                      <span>AI Planned Visualization: {aiResult.visualizationSpec.title}</span>
                    </div>
                    <ChartViewer
                      spec={{
                        enabled: true,
                        chart_type: aiResult.visualizationSpec.chartType,
                        title: aiResult.visualizationSpec.title,
                        x: aiResult.visualizationSpec.xKey,
                        y: aiResult.visualizationSpec.yKey
                      } as VisualizationSpec}
                      data={aiResult.rows || datasetDetail.allRows.slice(0, 15)}
                    />
                  </div>
                )}
              </div>
            )}

            {/* Dataset Inspection Tabs */}
            <div className="rounded-xl bg-[#121622] border border-[#20293d] overflow-hidden">
              <div className="p-3 border-b border-[#1e2535] flex items-center justify-between bg-[#0e121b]">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => setActiveTab('preview')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'preview'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Extracted Data ({datasetDetail.rowCount} rows)
                  </button>
                  <button
                    onClick={() => setActiveTab('schema')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'schema'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Schema & Inferred Types ({datasetDetail.columns.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('stats')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'stats'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Deterministic Statistics
                  </button>
                  <button
                    onClick={() => setActiveTab('sql')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === 'sql'
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    SQL DDL Generator
                  </button>
                </div>
              </div>

              <div className="p-4">
                {activeTab === 'preview' && (
                  <DataTable
                    columns={datasetDetail.columns}
                    rows={datasetDetail.allRows || datasetDetail.sampleRows}
                    tableName={datasetDetail.name}
                  />
                )}

                {activeTab === 'schema' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-[#0e121b] text-slate-400 font-mono text-[11px] uppercase">
                        <tr>
                          <th className="p-2.5">Column Name</th>
                          <th className="p-2.5">Inferred Type</th>
                          <th className="p-2.5">Sample Value</th>
                          <th className="p-2.5">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2535]">
                        {datasetDetail.columns.map((col: string) => {
                          const sampleVal = (datasetDetail.allRows || datasetDetail.sampleRows)[0]?.[col];
                          const isNum = typeof sampleVal === 'number' || (!isNaN(Number(sampleVal)) && sampleVal !== '');
                          const isDate = !isNaN(Date.parse(String(sampleVal))) && String(sampleVal).includes('-');
                          const inferred = isDate ? 'date' : isNum ? 'numeric' : 'categorical';

                          return (
                            <tr key={col} className="hover:bg-[#161c2a]">
                              <td className="p-2.5 font-mono text-slate-200 font-semibold">{col}</td>
                              <td className="p-2.5 font-mono">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  inferred === 'numeric'
                                    ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                                    : inferred === 'date'
                                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/20'
                                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                                }`}>
                                  {inferred}
                                </span>
                              </td>
                              <td className="p-2.5 text-slate-400 font-mono truncate max-w-xs">
                                {String(sampleVal ?? 'NULL')}
                              </td>
                              <td className="p-2.5">
                                <span className="inline-flex items-center space-x-1 text-emerald-400 text-[11px]">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Parsed</span>
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {activeTab === 'stats' && (
                  <div className="space-y-4">
                    {datasetDetail.columnStats && Object.keys(datasetDetail.columnStats).length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.entries(datasetDetail.columnStats).map(([col, s]: [string, any]) => (
                          <div key={col} className="p-3 rounded-lg bg-[#0e121b] border border-[#1e2535]">
                            <div className="text-xs font-mono font-semibold text-teal-400 truncate mb-2">
                              {col}
                            </div>
                            {'mean' in s ? (
                              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                                <div><span className="text-slate-500">Sum:</span> <span className="text-slate-200">{Number(s.sum || 0).toLocaleString()}</span></div>
                                <div><span className="text-slate-500">Mean:</span> <span className="text-slate-200">{Number(s.mean || 0).toLocaleString()}</span></div>
                                <div><span className="text-slate-500">Min:</span> <span className="text-slate-200">{Number(s.min || 0).toLocaleString()}</span></div>
                                <div><span className="text-slate-500">Max:</span> <span className="text-slate-200">{Number(s.max || 0).toLocaleString()}</span></div>
                                <div><span className="text-slate-500">StdDev:</span> <span className="text-slate-200">{Number(s.stdDev || 0).toFixed(2)}</span></div>
                                <div><span className="text-slate-500">Count:</span> <span className="text-slate-200">{s.count}</span></div>
                              </div>
                            ) : (
                              <div className="space-y-1 text-[11px] font-mono">
                                <div><span className="text-slate-500">Distinct Values:</span> <span className="text-slate-200">{s.uniqueCount}</span></div>
                                <div className="text-slate-500 text-[10px] mt-1">Top Frequencies:</div>
                                <div className="text-[10px] text-slate-300 truncate">
                                  {s.topValues?.join(', ')}
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 text-center text-xs text-slate-500">
                        No column statistics available.
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'sql' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>PostgreSQL schema extracted automatically from CSV header & inferred types:</span>
                    </div>
                    <pre className="p-3.5 rounded-lg bg-[#080b10] border border-[#1e2535] text-xs font-mono text-emerald-300 overflow-x-auto">
{`-- Generated SQL Table Schema for ${datasetDetail.name}
CREATE TABLE IF NOT EXISTS extracted_${datasetDetail.id.replace(/-/g, '_')} (
  id SERIAL PRIMARY KEY,
${datasetDetail.columns.map((c: string) => `  ${c.toLowerCase().replace(/[^a-z0-9_]/g, '_')} TEXT`).join(',\n')}
);`}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Col: Quality & Extraction Metadata */}
          <div className="space-y-6">
            {/* AI Summary Card */}
            {datasetDetail.aiSummary && (
              <div className="p-4 rounded-xl bg-[#121622] border border-[#20293d] space-y-3">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-teal-400" />
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                    AI Dataset Synthesis
                  </h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {datasetDetail.aiSummary.overview}
                </p>
                {datasetDetail.aiSummary.suggestedQueries && (
                  <div className="pt-2 border-t border-[#1e2535]">
                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Suggested AI Queries:
                    </div>
                    <div className="space-y-1">
                      {datasetDetail.aiSummary.suggestedQueries.map((q: string, idx: number) => (
                        <button
                          key={idx}
                          onClick={() => {
                            setAiQuestion(q);
                            handleRunAiAnalysis(q);
                          }}
                          className="w-full text-left text-[11px] p-1.5 rounded bg-[#0d1017] hover:bg-[#161c2a] text-slate-300 hover:text-teal-300 border border-[#1e2535] transition-colors truncate block"
                        >
                          → {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Extraction Metadata Card */}
            <div className="p-4 rounded-xl bg-[#121622] border border-[#20293d] space-y-3">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Database className="w-3.5 h-3.5 text-blue-400" />
                <span>Extraction Metadata</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e121b]">
                  <span className="text-slate-400">Dataset Name:</span>
                  <span className="font-mono text-slate-200 font-semibold truncate max-w-[160px]">
                    {datasetDetail.name}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e121b]">
                  <span className="text-slate-400">Total Rows:</span>
                  <span className="font-mono text-teal-400 font-bold">
                    {datasetDetail.rowCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e121b]">
                  <span className="text-slate-400">Column Count:</span>
                  <span className="font-mono text-blue-400 font-semibold">
                    {datasetDetail.columns.length} columns
                  </span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e121b]">
                  <span className="text-slate-400">Extracted At:</span>
                  <span className="font-mono text-slate-400 text-[11px]">
                    {new Date(datasetDetail.uploadedAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Validation & Data Quality Report */}
            {datasetDetail.validationReport && (
              <div className="p-4 rounded-xl bg-[#121622] border border-[#20293d] space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Quality Score</span>
                  </h3>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                    datasetDetail.validationReport.quality_score >= 90
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                  }`}>
                    {datasetDetail.validationReport.quality_score} / 100
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e121b]">
                    <span className="text-slate-400">Missing Values:</span>
                    <span className="font-mono text-slate-200">
                      {datasetDetail.validationReport.missing_values}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e121b]">
                    <span className="text-slate-400">Duplicates:</span>
                    <span className="font-mono text-slate-200">
                      {datasetDetail.validationReport.duplicate_rows}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-[#0e121b]">
                    <span className="text-slate-400">Issues Flagged:</span>
                    <span className="font-mono text-slate-200">
                      {datasetDetail.validationReport.issues.length}
                    </span>
                  </div>
                </div>

                {datasetDetail.validationReport.issues.length > 0 && (
                  <div className="pt-2 border-t border-[#1e2535]">
                    <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Detected Observations:</div>
                    <div className="space-y-1">
                      {datasetDetail.validationReport.issues.slice(0, 3).map((iss: any, i: number) => (
                        <div key={i} className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded border border-amber-500/20">
                          {iss.description || iss.message || `${iss.type}: ${iss.count} occurrences`}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Paste / Extract Modal */}
      {showPasteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[#121622] border border-[#232c42] rounded-xl max-w-xl w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#1e2535]">
              <div className="flex items-center space-x-2">
                <FileSpreadsheet className="w-5 h-5 text-teal-400" />
                <h3 className="text-sm font-bold text-slate-100">
                  Paste & Extract Raw CSV Content
                </h3>
              </div>
              <button
                onClick={() => setShowPasteModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Dataset Name
              </label>
              <input
                type="text"
                value={pastedName}
                onChange={(e) => setPastedName(e.target.value)}
                placeholder="sales_extract.csv"
                className="w-full px-3 py-1.5 rounded-lg bg-[#0d1017] border border-[#232b3e] text-xs text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Raw CSV Data (Comma, Semicolon, or Tab Separated)
              </label>
              <textarea
                rows={8}
                value={pastedCsv}
                onChange={(e) => setPastedCsv(e.target.value)}
                placeholder={`date,product,category,revenue,units_sold\n2025-01-15,Cloud ERP,Software,12500,5\n2025-01-16,Analytics Engine,Software,8400,3`}
                className="w-full p-3 rounded-lg bg-[#0d1017] border border-[#232b3e] font-mono text-xs text-slate-200 placeholder-slate-600 focus:outline-hidden focus:border-teal-500/50"
              />
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-[#1e2535]">
              <button
                onClick={() => setShowPasteModal(false)}
                className="px-3 py-1.5 rounded-lg bg-[#161c2a] hover:bg-[#1d2538] text-xs text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handlePasteExtract}
                disabled={uploading || !pastedCsv.trim()}
                className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center space-x-1.5"
              >
                {uploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extract & Ingest</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
