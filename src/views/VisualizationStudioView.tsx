import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  LineChart,
  PieChart,
  Layers,
  Sparkles,
  Download,
  Database,
  FileSpreadsheet,
  Sliders,
  TrendingUp,
  RefreshCw,
  Eye,
  CheckCircle2,
  Table,
  ArrowUpDown,
  Filter,
  Palette,
  Maximize2,
  Minimize2,
  Share2,
  Activity,
  Terminal,
  Grid,
  Radio
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { VisualizerDatasetOption } from '../types';
import Papa from 'papaparse';

type ChartType = 'bar' | 'horizontal_bar' | 'line' | 'area' | 'donut' | 'radar' | 'scatter';
type AggregationType = 'sum' | 'avg' | 'count' | 'max' | 'min';

const COLOR_PALETTES = {
  cyber: {
    name: 'DataOrbit Cyber',
    colors: ['#3b82f6', '#06b6d4', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6']
  },
  emerald: {
    name: 'Emerald Matrix',
    colors: ['#10b981', '#14b8a6', '#06b6d4', '#3b82f6', '#84cc16', '#22c55e', '#059669', '#0d9488']
  },
  solar: {
    name: 'Solar Flare',
    colors: ['#f59e0b', '#f97316', '#ef4444', '#ec4899', '#d97706', '#ea580c', '#e11d48', '#fbbf24']
  },
  neon: {
    name: 'Neon Violet',
    colors: ['#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#6366f1', '#4f46e5', '#3b82f6', '#06b6d4']
  }
};

export const VisualizationStudioView: React.FC = () => {
  const { isDark } = useTheme();

  const [presets, setPresets] = useState<VisualizerDatasetOption[]>([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('pg_monthly_trends');
  const [loading, setLoading] = useState<boolean>(true);
  const [mode, setMode] = useState<'studio' | 'executive_board'>('studio');

  // Chart Configuration State
  const [chartType, setChartType] = useState<ChartType>('area');
  const [dimensionCol, setDimensionCol] = useState<string>('month');
  const [metricCol, setMetricCol] = useState<string>('total_revenue');
  const [secondaryMetricCol, setSecondaryMetricCol] = useState<string>('total_profit');
  const [aggregation, setAggregation] = useState<AggregationType>('sum');
  const [paletteKey, setPaletteKey] = useState<keyof typeof COLOR_PALETTES>('cyber');
  const [topN, setTopN] = useState<number>(15);
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc' | 'none'>('none');
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Custom SQL Runner in Visualizer
  const [showCustomSql, setShowCustomSql] = useState<boolean>(false);
  const [customSqlInput, setCustomSqlInput] = useState<string>(
    'SELECT c.city, ROUND(SUM(s.revenue), 2) AS revenue, ROUND(SUM(s.profit), 2) AS profit, COUNT(s.id) AS sales_count FROM sales s JOIN customers c ON c.id = s.customer_id GROUP BY c.city ORDER BY revenue DESC;'
  );
  const [sqlRunning, setSqlRunning] = useState<boolean>(false);
  const [sqlError, setSqlError] = useState<string | null>(null);

  // Active dataset
  const activeDataset = useMemo(() => {
    return presets.find((p) => p.id === selectedDatasetId) || presets[0] || null;
  }, [presets, selectedDatasetId]);

  // Load presets on mount
  useEffect(() => {
    fetchPresets();
  }, []);

  // When active dataset changes, update available dimension & metric defaults
  useEffect(() => {
    if (activeDataset) {
      if (activeDataset.dimensionColumns.length > 0 && !activeDataset.dimensionColumns.includes(dimensionCol)) {
        setDimensionCol(activeDataset.dimensionColumns[0]);
      }
      if (activeDataset.numericColumns.length > 0 && !activeDataset.numericColumns.includes(metricCol)) {
        setMetricCol(activeDataset.numericColumns[0]);
      }
      if (activeDataset.numericColumns.length > 1) {
        setSecondaryMetricCol(activeDataset.numericColumns[1]);
      }
      if (activeDataset.defaultChartType) {
        setChartType(activeDataset.defaultChartType as ChartType);
      }
    }
  }, [activeDataset]);

  const fetchPresets = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/visualizer/presets');
      if (res.ok) {
        const data = await res.json();
        setPresets(data.presets || []);
      }
    } catch (err) {
      console.error('Failed to load visualizer presets:', err);
    } finally {
      setLoading(false);
    }
  };

  const runCustomSql = async () => {
    if (!customSqlInput.trim()) return;
    try {
      setSqlRunning(true);
      setSqlError(null);
      const res = await fetch('/api/database/execute-sql', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sql: customSqlInput.trim() })
      });
      const data = await res.json();
      if (!res.ok) {
        setSqlError(data.error || 'SQL Execution failed.');
        return;
      }

      const cols = data.columns || [];
      const numCols = cols.filter((c: string) => {
        const sampleVal = data.rows[0]?.[c];
        return typeof sampleVal === 'number' || (!isNaN(Number(sampleVal)) && sampleVal !== '' && sampleVal !== null);
      });
      const dimCols = cols.filter((c: string) => !numCols.includes(c));

      const customPreset: VisualizerDatasetOption = {
        id: `custom_sql_${Date.now()}`,
        name: `Custom SQL: ${data.rowCount} rows`,
        sourceType: 'sql_custom',
        description: 'Direct SQL execution from DataOrbit Studio',
        category: 'Custom SQL Results',
        defaultChartType: 'bar',
        data: data.rows,
        columns: cols,
        numericColumns: numCols.length > 0 ? numCols : cols.slice(1),
        dimensionColumns: dimCols.length > 0 ? dimCols : cols.slice(0, 1)
      };

      setPresets((prev) => [customPreset, ...prev]);
      setSelectedDatasetId(customPreset.id);
      setShowCustomSql(false);
    } catch (err: any) {
      setSqlError(err.message || 'Error running SQL');
    } finally {
      setSqlRunning(false);
    }
  };

  // Process and aggregate dataset based on current controls
  const processedData = useMemo(() => {
    if (!activeDataset || !activeDataset.data || activeDataset.data.length === 0) return [];

    const raw = [...activeDataset.data];

    // Grouping & Aggregation
    const grouped = new Map<string, { count: number; sum: number; values: number[]; row: Record<string, any> }>();

    for (const item of raw) {
      const dimVal = String(item[dimensionCol] ?? 'N/A');
      const numVal = Number(item[metricCol]) || 0;

      if (!grouped.has(dimVal)) {
        grouped.set(dimVal, { count: 0, sum: 0, values: [], row: item });
      }
      const entry = grouped.get(dimVal)!;
      entry.count += 1;
      entry.sum += numVal;
      entry.values.push(numVal);
    }

    let result = Array.from(grouped.entries()).map(([key, val]) => {
      let finalVal = val.sum;
      if (aggregation === 'avg') finalVal = val.values.length ? val.sum / val.values.length : 0;
      else if (aggregation === 'count') finalVal = val.count;
      else if (aggregation === 'max') finalVal = Math.max(...val.values);
      else if (aggregation === 'min') finalVal = Math.min(...val.values);

      return {
        ...val.row,
        [dimensionCol]: key,
        [metricCol]: Number(finalVal.toFixed(2)),
        _rawVal: finalVal
      };
    });

    // Sorting
    if (sortOrder === 'desc') {
      result.sort((a, b) => (b._rawVal || 0) - (a._rawVal || 0));
    } else if (sortOrder === 'asc') {
      result.sort((a, b) => (a._rawVal || 0) - (b._rawVal || 0));
    }

    // Limit Top N
    if (topN > 0 && result.length > topN) {
      result = result.slice(0, topN);
    }

    return result;
  }, [activeDataset, dimensionCol, metricCol, aggregation, sortOrder, topN]);

  // Aggregate stats for KPIs
  const statsSummary = useMemo(() => {
    if (!processedData.length) return { sum: 0, avg: 0, max: 0, min: 0, count: 0 };
    const values = processedData.map((d) => Number(d[metricCol]) || 0);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const max = Math.max(...values);
    const min = Math.min(...values);
    return { sum, avg, max, min, count: processedData.length };
  }, [processedData, metricCol]);

  const activeColors = COLOR_PALETTES[paletteKey].colors;

  const formatNumber = (num: number) => {
    if (isNaN(num)) return '0';
    if (Math.abs(num) >= 1_000_000) return `₹${(num / 1_000_000).toFixed(2)}M`;
    if (Math.abs(num) >= 1_000) return `₹${(num / 1_000).toFixed(1)}k`;
    return num.toLocaleString();
  };

  const handleExportCsv = () => {
    if (!processedData.length) return;
    const csv = Papa.unparse(processedData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `DataOrbit_${activeDataset?.name.replace(/[^a-z0-9]/gi, '_') || 'visualization'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Dimensions for Chart SVG
  const svgWidth = 780;
  const svgHeight = 320;
  const padding = { top: 30, right: 35, bottom: 50, left: 75 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;
  const maxValue = Math.max(...processedData.map((d) => Number(d[metricCol]) || 0), 1);

  return (
    <div
      className={`p-6 md:p-8 max-w-7xl mx-auto space-y-6 transition-colors duration-200 ${
        isDark ? 'text-slate-100' : 'text-slate-800'
      }`}
    >
      {/* Visualizer Studio Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-inherit">
        <div>
          <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full text-xs font-semibold mb-2 bg-blue-500/10 text-blue-500 border border-blue-500/20">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>DataOrbit Visualization Studio</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center space-x-2">
            <span>Multi-Source Graphical Analytics</span>
          </h1>
          <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Connect PostgreSQL, uploaded CSVs, and ad-hoc SQL queries into interactive graphs, radar matrices, and executive dashboards.
          </p>
        </div>

        {/* Top Actions: Mode Switcher & Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div
            className={`p-1 rounded-xl flex items-center space-x-1 border ${
              isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-slate-100 border-slate-200'
            }`}
          >
            <button
              onClick={() => setMode('studio')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                mode === 'studio'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Deep-Dive Studio</span>
            </button>
            <button
              onClick={() => setMode('executive_board')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-all ${
                mode === 'executive_board'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Executive Orbit Board</span>
            </button>
          </div>

          <button
            onClick={() => setShowCustomSql(!showCustomSql)}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
              showCustomSql
                ? 'bg-blue-600/10 border-blue-500 text-blue-500'
                : isDark
                ? 'bg-[#151a27] border-[#253046] text-slate-300 hover:bg-[#1a2133]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>Run SQL Query</span>
          </button>

          <button
            onClick={handleExportCsv}
            disabled={!processedData.length}
            className={`px-3 py-2 rounded-xl text-xs font-medium border flex items-center space-x-1.5 transition-colors ${
              isDark
                ? 'bg-[#151a27] border-[#253046] text-slate-300 hover:bg-[#1a2133]'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            } disabled:opacity-50`}
            title="Export Aggregated CSV"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* SQL Runner Dropdown Panel */}
      {showCustomSql && (
        <div
          className={`p-4 rounded-xl border space-y-3 animate-in fade-in duration-150 ${
            isDark ? 'bg-[#10141f] border-[#222c40]' : 'bg-white border-slate-200 shadow-md'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center space-x-2 text-blue-400">
              <Terminal className="w-4 h-4" />
              <span>DataOrbit SQL Query Visualizer</span>
            </span>
            <span className="text-[11px] font-mono text-slate-400">Read-Only Safe Execution</span>
          </div>
          <textarea
            value={customSqlInput}
            onChange={(e) => setCustomSqlInput(e.target.value)}
            rows={3}
            className={`w-full font-mono text-xs p-3 rounded-lg border focus:outline-hidden focus:ring-1 focus:ring-blue-500 ${
              isDark ? 'bg-[#090c12] border-[#253046] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
            placeholder="SELECT ... FROM sales ..."
          />
          {sqlError && <div className="text-xs text-rose-400 font-mono bg-rose-500/10 p-2 rounded-lg">{sqlError}</div>}
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setShowCustomSql(false)}
              className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={runCustomSql}
              disabled={sqlRunning}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1.5 shadow-sm"
            >
              {sqlRunning ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
              <span>{sqlRunning ? 'Executing...' : 'Visualize SQL'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Multi-Source Dataset Selector Bar */}
      <div className="space-y-2">
        <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Select Multi-Source Dataset:
        </label>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {presets.map((preset) => {
            const isSelected = preset.id === selectedDatasetId;
            const isCsv = preset.sourceType === 'csv';
            const isSql = preset.sourceType === 'sql_custom';

            return (
              <button
                key={preset.id}
                onClick={() => setSelectedDatasetId(preset.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-medium whitespace-nowrap border flex items-center space-x-2 transition-all ${
                  isSelected
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm shadow-blue-500/20 font-semibold'
                    : isDark
                    ? 'bg-[#121622] border-[#20293d] text-slate-300 hover:bg-[#181e2e]'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                }`}
              >
                {isCsv ? (
                  <FileSpreadsheet className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-teal-400'}`} />
                ) : isSql ? (
                  <Terminal className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-purple-400'}`} />
                ) : (
                  <Database className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-400'}`} />
                )}
                <span>{preset.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isSelected
                      ? 'bg-white/20 text-white'
                      : isDark
                      ? 'bg-slate-800 text-slate-400'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {preset.data?.length || 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* KPI Headline Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div
          className={`p-4 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Aggregated {aggregation.toUpperCase()}</span>
            <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-blue-500">
            {formatNumber(statsSummary.sum)}
          </div>
          <div className="text-[11px] text-slate-400 truncate font-mono">
            {metricCol.replace(/_/g, ' ')}
          </div>
        </div>

        <div
          className={`p-4 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Average / Mean</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-500">
            {formatNumber(statsSummary.avg)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Per {dimensionCol} entry</div>
        </div>

        <div
          className={`p-4 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Peak / Maximum</span>
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-purple-500">
            {formatNumber(statsSummary.max)}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Highest observed metric</div>
        </div>

        <div
          className={`p-4 rounded-xl border space-y-1 ${
            isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Visualized Datapoints</span>
            <Grid className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-amber-500">
            {statsSummary.count}
          </div>
          <div className="text-[11px] text-slate-400 font-mono">Active dimensional rows</div>
        </div>
      </div>

      {mode === 'executive_board' ? (
        /* Executive Multi-Chart Orbit Board */
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Time Series Area / Trajectory */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-blue-400" />
                    <span>Monthly Trajectory & Momentum</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Time-series trajectory for revenue & profit</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Area Plot
                </span>
              </div>

              {/* Area SVG Preview */}
              <div className="h-56 flex items-center justify-center">
                <svg width="100%" height="220" viewBox="0 0 500 220" className="overflow-visible">
                  {(() => {
                    const items = processedData.slice(0, 16);
                    if (!items.length) return null;
                    const maxVal = Math.max(...items.map((d) => Number(d[metricCol]) || 0), 1);
                    const pts = items.map((d, i) => {
                      const x = 30 + (i / Math.max(1, items.length - 1)) * 440;
                      const y = 190 - (Number(d[metricCol]) / maxVal) * 160;
                      return { x, y, label: String(d[dimensionCol] || '') };
                    });
                    const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                    const fillPath = `${path} L ${pts[pts.length - 1].x} 190 L ${pts[0].x} 190 Z`;
                    return (
                      <g>
                        <defs>
                          <linearGradient id="orbitArea" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path d={fillPath} fill="url(#orbitArea)" />
                        <path d={path} fill="none" stroke="#3b82f6" strokeWidth="2.5" />
                        {pts.map((p, idx) => (
                          <circle key={idx} cx={p.x} cy={p.y} r="3" fill="#60a5fa" />
                        ))}
                      </g>
                    );
                  })()}
                </svg>
              </div>
            </div>

            {/* Chart 2: Donut Regional/Category Share */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <PieChart className="w-4 h-4 text-emerald-400" />
                    <span>Distribution & Market Share</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Proportional segmentation across key segments</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Donut
                </span>
              </div>

              {/* Donut rendering */}
              <div className="h-56 flex items-center justify-around">
                <svg width="180" height="180" viewBox="0 0 180 180">
                  {(() => {
                    const topItems = processedData.slice(0, 5);
                    const total = topItems.reduce((a, b) => a + (Number(b[metricCol]) || 0), 0) || 1;
                    let accum = 0;
                    return topItems.map((item, i) => {
                      const val = Number(item[metricCol]) || 0;
                      const angle = (val / total) * 360;
                      const start = accum;
                      const end = accum + angle;
                      accum = end;
                      const radStart = (start - 90) * (Math.PI / 180);
                      const radEnd = (end - 90) * (Math.PI / 180);
                      const x1 = 90 + 75 * Math.cos(radStart);
                      const y1 = 90 + 75 * Math.sin(radStart);
                      const x2 = 90 + 75 * Math.cos(radEnd);
                      const y2 = 90 + 75 * Math.sin(radEnd);
                      const ix1 = 90 + 45 * Math.cos(radEnd);
                      const iy1 = 90 + 45 * Math.sin(radEnd);
                      const ix2 = 90 + 45 * Math.cos(radStart);
                      const iy2 = 90 + 45 * Math.sin(radStart);
                      const largeArc = angle > 180 ? 1 : 0;
                      const d = `M ${x1} ${y1} A 75 75 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A 45 45 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
                      return <path key={i} d={d} fill={activeColors[i % activeColors.length]} opacity={0.9} />;
                    });
                  })()}
                  <circle cx="90" cy="90" r="42" fill={isDark ? '#121622' : '#ffffff'} />
                  <text
                    x="90"
                    y="95"
                    textAnchor="middle"
                    className={`text-xs font-bold font-mono ${isDark ? 'fill-slate-100' : 'fill-slate-800'}`}
                  >
                    100%
                  </text>
                </svg>

                {/* Mini Legend */}
                <div className="space-y-1.5 text-xs max-w-[170px]">
                  {processedData.slice(0, 5).map((item, idx) => (
                    <div key={idx} className="flex items-center space-x-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: activeColors[idx % activeColors.length] }}
                      />
                      <span className="truncate text-xs font-medium">{String(item[dimensionCol])}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Chart 3: Ranked Bar Chart */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <BarChart3 className="w-4 h-4 text-purple-400" />
                    <span>Top Ranked Performers</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Categorical comparison sorted by magnitude</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Grouped Bar
                </span>
              </div>

              <div className="space-y-2.5 pt-2">
                {processedData.slice(0, 6).map((item, idx) => {
                  const val = Number(item[metricCol]) || 0;
                  const pct = Math.max(5, Math.min(100, (val / maxValue) * 100));
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium truncate max-w-[200px]">{String(item[dimensionCol])}</span>
                        <span className="font-mono text-purple-400 font-semibold">{formatNumber(val)}</span>
                      </div>
                      <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${pct}%`,
                            backgroundColor: activeColors[idx % activeColors.length]
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chart 4: Radar / Multi-Metric Spider View */}
            <div
              className={`p-5 rounded-2xl border space-y-4 ${
                isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <Radio className="w-4 h-4 text-cyan-400" />
                    <span>Multi-Dimensional Radar Matrix</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Balanced cross-metric evaluation</p>
                </div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  Radar Grid
                </span>
              </div>

              <div className="h-56 flex items-center justify-center">
                <svg width="220" height="220" viewBox="0 0 220 220">
                  {/* Concentric rings */}
                  {[0.25, 0.5, 0.75, 1.0].map((ring, rIdx) => (
                    <circle
                      key={rIdx}
                      cx="110"
                      cy="110"
                      r={70 * ring}
                      fill="none"
                      stroke={isDark ? '#232c40' : '#e2e8f0'}
                      strokeDasharray="3 3"
                    />
                  ))}
                  {/* Spokes */}
                  {processedData.slice(0, 6).map((item, idx, arr) => {
                    const angle = (idx / arr.length) * 2 * Math.PI - Math.PI / 2;
                    const x = 110 + 75 * Math.cos(angle);
                    const y = 110 + 75 * Math.sin(angle);
                    return (
                      <line
                        key={idx}
                        x1="110"
                        y1="110"
                        x2={x}
                        y2={y}
                        stroke={isDark ? '#232c40' : '#e2e8f0'}
                      />
                    );
                  })}
                  {/* Radar Polygon */}
                  {(() => {
                    const items = processedData.slice(0, 6);
                    if (items.length < 3) return null;
                    const polyPts = items.map((item, idx) => {
                      const val = Number(item[metricCol]) || 0;
                      const radius = Math.max(15, (val / maxValue) * 70);
                      const angle = (idx / items.length) * 2 * Math.PI - Math.PI / 2;
                      return `${110 + radius * Math.cos(angle)},${110 + radius * Math.sin(angle)}`;
                    });
                    return (
                      <polygon
                        points={polyPts.join(' ')}
                        fill="#06b6d4"
                        fillOpacity="0.25"
                        stroke="#06b6d4"
                        strokeWidth="2"
                      />
                    );
                  })()}
                </svg>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Deep-Dive Interactive Studio */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Visualizer Stage (3 cols) */}
          <div className="lg:col-span-3 space-y-6">
            <div
              className={`p-6 rounded-2xl border space-y-4 transition-colors ${
                isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-md'
              }`}
            >
              {/* Stage Controls: Chart Type Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-inherit">
                <div className="flex items-center space-x-1 p-1 rounded-xl border border-inherit">
                  <button
                    onClick={() => setChartType('bar')}
                    className={`p-1.5 px-2.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
                      chartType === 'bar'
                        ? 'bg-blue-600 text-white font-semibold'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Vertical Bar Chart"
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Bar</span>
                  </button>

                  <button
                    onClick={() => setChartType('horizontal_bar')}
                    className={`p-1.5 px-2.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
                      chartType === 'horizontal_bar'
                        ? 'bg-blue-600 text-white font-semibold'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Horizontal Bar Ranking"
                  >
                    <BarChart3 className="w-3.5 h-3.5 rotate-90" />
                    <span>Rank</span>
                  </button>

                  <button
                    onClick={() => setChartType('area')}
                    className={`p-1.5 px-2.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
                      chartType === 'area'
                        ? 'bg-blue-600 text-white font-semibold'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Area Gradient Chart"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Area</span>
                  </button>

                  <button
                    onClick={() => setChartType('line')}
                    className={`p-1.5 px-2.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
                      chartType === 'line'
                        ? 'bg-blue-600 text-white font-semibold'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Line Chart"
                  >
                    <LineChart className="w-3.5 h-3.5" />
                    <span>Line</span>
                  </button>

                  <button
                    onClick={() => setChartType('donut')}
                    className={`p-1.5 px-2.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
                      chartType === 'donut'
                        ? 'bg-blue-600 text-white font-semibold'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Donut Distribution"
                  >
                    <PieChart className="w-3.5 h-3.5" />
                    <span>Donut</span>
                  </button>

                  <button
                    onClick={() => setChartType('radar')}
                    className={`p-1.5 px-2.5 rounded-lg text-xs flex items-center space-x-1.5 transition-all ${
                      chartType === 'radar'
                        ? 'bg-blue-600 text-white font-semibold'
                        : isDark
                        ? 'text-slate-400 hover:text-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                    title="Radar Matrix"
                  >
                    <Radio className="w-3.5 h-3.5" />
                    <span>Radar</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-xs font-mono">
                  <span className="text-slate-400">Sort:</span>
                  <button
                    onClick={() => setSortOrder(sortOrder === 'desc' ? 'asc' : sortOrder === 'asc' ? 'none' : 'desc')}
                    className={`px-2 py-1 rounded-md border flex items-center space-x-1 ${
                      sortOrder !== 'none'
                        ? 'border-blue-500 text-blue-500 font-semibold'
                        : isDark
                        ? 'border-[#263147] text-slate-400'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <ArrowUpDown className="w-3 h-3" />
                    <span>{sortOrder === 'desc' ? 'High → Low' : sortOrder === 'asc' ? 'Low → High' : 'Natural'}</span>
                  </button>
                </div>
              </div>

              {/* Chart Canvas Rendering Area */}
              <div className="relative w-full overflow-x-auto min-h-[340px] flex items-center justify-center">
                {chartType === 'donut' ? (
                  /* Donut Chart Presentation */
                  <div className="flex flex-col md:flex-row items-center justify-center py-6 gap-8 w-full">
                    <svg width="240" height="240" viewBox="0 0 240 240" className="overflow-visible shrink-0">
                      {(() => {
                        const total = statsSummary.sum || 1;
                        let accumulatedAngle = 0;
                        const cx = 120;
                        const cy = 120;
                        const r = 95;
                        const innerR = 58;

                        return processedData.map((item, idx) => {
                          const val = Number(item[metricCol]) || 0;
                          const sliceAngle = (val / total) * 360;
                          const startAngle = accumulatedAngle;
                          const endAngle = accumulatedAngle + sliceAngle;
                          accumulatedAngle = endAngle;

                          const startRad = (startAngle - 90) * (Math.PI / 180);
                          const endRad = (endAngle - 90) * (Math.PI / 180);

                          const x1 = cx + r * Math.cos(startRad);
                          const y1 = cy + r * Math.sin(startRad);
                          const x2 = cx + r * Math.cos(endRad);
                          const y2 = cy + r * Math.sin(endRad);

                          const ix1 = cx + innerR * Math.cos(endRad);
                          const iy1 = cy + innerR * Math.sin(endRad);
                          const ix2 = cx + innerR * Math.cos(startRad);
                          const iy2 = cy + innerR * Math.sin(startRad);

                          const largeArc = sliceAngle > 180 ? 1 : 0;
                          const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
                          const color = activeColors[idx % activeColors.length];
                          const isHovered = hoveredIdx === idx;

                          return (
                            <path
                              key={idx}
                              d={pathData}
                              fill={color}
                              className="transition-all duration-150 cursor-pointer"
                              opacity={isHovered ? 1 : 0.85}
                              transform={isHovered ? `scale(1.04) translate(-4, -4)` : ''}
                              onMouseEnter={() => setHoveredIdx(idx)}
                              onMouseLeave={() => setHoveredIdx(null)}
                            />
                          );
                        });
                      })()}
                      <circle cx="120" cy="120" r="54" fill={isDark ? '#121622' : '#ffffff'} />
                      <text
                        x="120"
                        y="114"
                        textAnchor="middle"
                        className={`text-xs font-semibold ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
                      >
                        Total Sum
                      </text>
                      <text
                        x="120"
                        y="134"
                        textAnchor="middle"
                        className={`text-xs font-bold font-mono ${isDark ? 'fill-slate-100' : 'fill-slate-900'}`}
                      >
                        {formatNumber(statsSummary.sum)}
                      </text>
                    </svg>

                    {/* Donut Legend */}
                    <div className="space-y-1.5 text-xs max-w-sm w-full">
                      {processedData.map((item, idx) => {
                        const color = activeColors[idx % activeColors.length];
                        const val = Number(item[metricCol]) || 0;
                        const pct = Math.round((val / (statsSummary.sum || 1)) * 100);
                        const isHovered = hoveredIdx === idx;

                        return (
                          <div
                            key={idx}
                            onMouseEnter={() => setHoveredIdx(idx)}
                            onMouseLeave={() => setHoveredIdx(null)}
                            className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer transition-colors ${
                              isHovered
                                ? isDark
                                  ? 'bg-slate-800/60'
                                  : 'bg-slate-100'
                                : ''
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="font-medium truncate max-w-[170px]">{String(item[dimensionCol])}</span>
                            </div>
                            <div className="flex items-center space-x-2 font-mono">
                              <span className="font-semibold">{formatNumber(val)}</span>
                              <span className="text-[10px] text-slate-400">({pct}%)</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : chartType === 'horizontal_bar' ? (
                  /* Horizontal Bar Ranking */
                  <div className="w-full space-y-3 py-4">
                    {processedData.map((item, idx) => {
                      const val = Number(item[metricCol]) || 0;
                      const pct = Math.max(3, Math.min(100, (val / maxValue) * 100));
                      const isHovered = hoveredIdx === idx;
                      const color = activeColors[idx % activeColors.length];

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredIdx(idx)}
                          onMouseLeave={() => setHoveredIdx(null)}
                          className="space-y-1 cursor-pointer"
                        >
                          <div className="flex justify-between text-xs">
                            <span className="font-semibold truncate max-w-[280px]">
                              {idx + 1}. {String(item[dimensionCol])}
                            </span>
                            <span className="font-mono font-bold" style={{ color }}>
                              {formatNumber(val)}
                            </span>
                          </div>
                          <div
                            className={`h-3 rounded-md overflow-hidden ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}
                          >
                            <div
                              className="h-full rounded-md transition-all duration-300"
                              style={{
                                width: `${pct}%`,
                                backgroundColor: color,
                                opacity: isHovered ? 1 : 0.85
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : chartType === 'radar' ? (
                  /* Full Spider Radar */
                  <div className="flex flex-col items-center justify-center py-6">
                    <svg width="300" height="300" viewBox="0 0 300 300">
                      {[0.2, 0.4, 0.6, 0.8, 1.0].map((ring, rIdx) => (
                        <circle
                          key={rIdx}
                          cx="150"
                          cy="150"
                          r={110 * ring}
                          fill="none"
                          stroke={isDark ? '#232c40' : '#e2e8f0'}
                          strokeDasharray="4 4"
                        />
                      ))}
                      {processedData.map((item, idx, arr) => {
                        const angle = (idx / arr.length) * 2 * Math.PI - Math.PI / 2;
                        const x = 150 + 115 * Math.cos(angle);
                        const y = 150 + 115 * Math.sin(angle);
                        return (
                          <g key={idx}>
                            <line
                              x1="150"
                              y1="150"
                              x2={x}
                              y2={y}
                              stroke={isDark ? '#232c40' : '#e2e8f0'}
                            />
                            <text
                              x={150 + 130 * Math.cos(angle)}
                              y={150 + 130 * Math.sin(angle)}
                              textAnchor="middle"
                              className={`text-[9px] font-sans ${isDark ? 'fill-slate-400' : 'fill-slate-600'}`}
                            >
                              {String(item[dimensionCol]).substring(0, 10)}
                            </text>
                          </g>
                        );
                      })}
                      {(() => {
                        if (processedData.length < 3) return null;
                        const pts = processedData.map((item, idx) => {
                          const val = Number(item[metricCol]) || 0;
                          const rad = Math.max(15, (val / maxValue) * 110);
                          const angle = (idx / processedData.length) * 2 * Math.PI - Math.PI / 2;
                          return `${150 + rad * Math.cos(angle)},${150 + rad * Math.sin(angle)}`;
                        });
                        return (
                          <polygon
                            points={pts.join(' ')}
                            fill={activeColors[0]}
                            fillOpacity="0.3"
                            stroke={activeColors[0]}
                            strokeWidth="2.5"
                          />
                        );
                      })()}
                    </svg>
                  </div>
                ) : (
                  /* Standard Cartesian (Bar, Line, Area) */
                  <div className="w-full">
                    <svg
                      width="100%"
                      height={svgHeight}
                      viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                      className="overflow-visible"
                    >
                      {/* Grid Lines */}
                      {showGrid &&
                        [0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
                          const y = padding.top + chartHeight * (1 - pct);
                          const gridVal = maxValue * pct;
                          return (
                            <g key={i}>
                              <line
                                x1={padding.left}
                                y1={y}
                                x2={padding.left + chartWidth}
                                y2={y}
                                stroke={isDark ? '#1e2738' : '#e2e8f0'}
                                strokeDasharray="4 4"
                              />
                              <text
                                x={padding.left - 8}
                                y={y + 3}
                                textAnchor="end"
                                className={`text-[10px] font-mono ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
                              >
                                {formatNumber(gridVal)}
                              </text>
                            </g>
                          );
                        })}

                      {/* Bar Chart Rendering */}
                      {chartType === 'bar' &&
                        processedData.map((item, idx) => {
                          const val = Number(item[metricCol]) || 0;
                          const barWidth = Math.max(10, Math.min(42, (chartWidth / processedData.length) * 0.72));
                          const stepX = chartWidth / processedData.length;
                          const x = padding.left + idx * stepX + (stepX - barWidth) / 2;
                          const barHeight = Math.max(3, (val / maxValue) * chartHeight);
                          const y = padding.top + chartHeight - barHeight;
                          const isHovered = hoveredIdx === idx;
                          const color = activeColors[idx % activeColors.length];

                          return (
                            <g key={idx}>
                              <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={barHeight}
                                rx={4}
                                fill={color}
                                opacity={isHovered ? 1 : 0.85}
                                className="transition-all duration-150 cursor-pointer"
                                onMouseEnter={() => setHoveredIdx(idx)}
                                onMouseLeave={() => setHoveredIdx(null)}
                              />
                              {/* X Axis Label */}
                              <text
                                x={x + barWidth / 2}
                                y={padding.top + chartHeight + 16}
                                textAnchor="end"
                                transform={`rotate(-28, ${x + barWidth / 2}, ${padding.top + chartHeight + 16})`}
                                className={`text-[9px] font-sans ${isDark ? 'fill-slate-400' : 'fill-slate-600'}`}
                              >
                                {String(item[dimensionCol]).length > 12
                                  ? String(item[dimensionCol]).substring(0, 10) + '…'
                                  : String(item[dimensionCol])}
                              </text>
                            </g>
                          );
                        })}

                      {/* Line / Area Chart Rendering */}
                      {(chartType === 'line' || chartType === 'area') &&
                        (() => {
                          const points = processedData.map((item, idx) => {
                            const val = Number(item[metricCol]) || 0;
                            const stepX = chartWidth / Math.max(1, processedData.length - 1);
                            const x = padding.left + idx * stepX;
                            const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
                            return { x, y, val, label: String(item[dimensionCol]) };
                          });

                          const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                          const areaPath = `${linePath} L ${points[points.length - 1]?.x} ${padding.top + chartHeight} L ${points[0]?.x} ${padding.top + chartHeight} Z`;

                          return (
                            <g>
                              {chartType === 'area' && (
                                <path d={areaPath} fill="url(#studioGradient)" opacity="0.38" />
                              )}
                              <path
                                d={linePath}
                                fill="none"
                                stroke={activeColors[0]}
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />

                              <defs>
                                <linearGradient id="studioGradient" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor={activeColors[0]} stopOpacity="0.8" />
                                  <stop offset="100%" stopColor={activeColors[0]} stopOpacity="0.0" />
                                </linearGradient>
                              </defs>

                              {points.map((p, idx) => {
                                const isHovered = hoveredIdx === idx;
                                return (
                                  <g key={idx}>
                                    <circle
                                      cx={p.x}
                                      cy={p.y}
                                      r={isHovered ? 6 : 3.5}
                                      fill={activeColors[0]}
                                      stroke={isDark ? '#0d1117' : '#ffffff'}
                                      strokeWidth="2"
                                      className="cursor-pointer transition-all"
                                      onMouseEnter={() => setHoveredIdx(idx)}
                                      onMouseLeave={() => setHoveredIdx(null)}
                                    />
                                    {(processedData.length <= 15 || idx % Math.ceil(processedData.length / 10) === 0) && (
                                      <text
                                        x={p.x}
                                        y={padding.top + chartHeight + 16}
                                        textAnchor="end"
                                        transform={`rotate(-28, ${p.x}, ${padding.top + chartHeight + 16})`}
                                        className={`text-[9px] font-sans ${isDark ? 'fill-slate-400' : 'fill-slate-600'}`}
                                      >
                                        {p.label.length > 10 ? p.label.substring(0, 8) + '…' : p.label}
                                      </text>
                                    )}
                                  </g>
                                );
                              })}
                            </g>
                          );
                        })()}
                    </svg>

                    {/* Tooltip Card on Hover */}
                    {hoveredIdx !== null && processedData[hoveredIdx] && (
                      <div
                        className={`mt-2 p-2.5 rounded-lg border inline-flex items-center space-x-3 text-xs shadow-md ${
                          isDark ? 'bg-[#090c12] border-blue-500/40 text-slate-100' : 'bg-white border-blue-500/30 text-slate-900'
                        }`}
                      >
                        <span className="font-semibold">{String(processedData[hoveredIdx][dimensionCol])}:</span>
                        <span className="font-mono text-blue-500 font-bold">
                          {formatNumber(Number(processedData[hoveredIdx][metricCol]) || 0)}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase font-mono">
                          ({aggregation.toUpperCase()})
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* AI Automated Insight Card */}
            <div
              className={`p-4 rounded-xl border space-y-2 ${
                isDark ? 'bg-[#10141f] border-[#222c40]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center space-x-2 text-xs font-bold text-blue-400">
                <Sparkles className="w-4 h-4" />
                <span>DataOrbit AI Visual Intelligence</span>
              </div>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {statsSummary.count > 0 ? (
                  <>
                    Analyzing <strong>{statsSummary.count} segments</strong> along <strong>{dimensionCol}</strong> shows a total volume of <strong>{formatNumber(statsSummary.sum)}</strong> with an average of <strong>{formatNumber(statsSummary.avg)}</strong>. The leading segment peaks at <strong>{formatNumber(statsSummary.max)}</strong>.
                  </>
                ) : (
                  'No records available for the active configuration.'
                )}
              </p>
            </div>
          </div>

          {/* Configuration Inspector Sidebar (1 col) */}
          <div className="space-y-4">
            <div
              className={`p-5 rounded-2xl border space-y-5 ${
                isDark ? 'bg-[#121622] border-[#222c40]' : 'bg-white border-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-inherit">
                <h3 className="text-xs font-bold uppercase tracking-wider flex items-center space-x-2">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Visual Inspector</span>
                </h3>
              </div>

              {/* Dimension X-Axis */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Dimension (X-Axis / Category)</label>
                <select
                  value={dimensionCol}
                  onChange={(e) => setDimensionCol(e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border font-medium focus:outline-hidden ${
                    isDark ? 'bg-[#090c12] border-[#253046] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {(activeDataset?.columns || []).map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Metric Y-Axis */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Metric (Y-Axis / Value)</label>
                <select
                  value={metricCol}
                  onChange={(e) => setMetricCol(e.target.value)}
                  className={`w-full text-xs p-2 rounded-lg border font-medium focus:outline-hidden ${
                    isDark ? 'bg-[#090c12] border-[#253046] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-900'
                  }`}
                >
                  {(activeDataset?.columns || []).map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </div>

              {/* Aggregation Function */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400">Aggregation Math</label>
                <div className="grid grid-cols-3 gap-1 text-[11px] font-mono">
                  {(['sum', 'avg', 'count', 'max', 'min'] as AggregationType[]).map((agg) => (
                    <button
                      key={agg}
                      onClick={() => setAggregation(agg)}
                      className={`p-1.5 rounded-md border uppercase text-center transition-colors ${
                        aggregation === agg
                          ? 'bg-blue-600 text-white border-blue-500 font-bold'
                          : isDark
                          ? 'bg-[#151a27] border-[#253046] text-slate-400'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}
                    >
                      {agg}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Palette Switcher */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-400 flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-purple-400" />
                  <span>Color Theme</span>
                </label>
                <div className="space-y-1.5">
                  {Object.entries(COLOR_PALETTES).map(([key, val]) => (
                    <button
                      key={key}
                      onClick={() => setPaletteKey(key as keyof typeof COLOR_PALETTES)}
                      className={`w-full p-2 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                        paletteKey === key
                          ? 'border-blue-500 bg-blue-500/10'
                          : isDark
                          ? 'border-[#222c40] hover:bg-slate-800/40'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span className="font-medium text-[11px]">{val.name}</span>
                      <div className="flex items-center space-x-1">
                        {val.colors.slice(0, 4).map((c, i) => (
                          <span key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c }} />
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top N Filter Slider */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Limit Max Elements</span>
                  <span className="font-mono text-blue-400 font-semibold">{topN}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="50"
                  step="5"
                  value={topN}
                  onChange={(e) => setTopN(Number(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>

              {/* Grid Toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-inherit">
                <span className="text-xs text-slate-400">Show Chart Grid</span>
                <input
                  type="checkbox"
                  checked={showGrid}
                  onChange={(e) => setShowGrid(e.target.checked)}
                  className="accent-blue-600 rounded cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
