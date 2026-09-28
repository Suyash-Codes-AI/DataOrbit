import React, { useState } from 'react';
import { BarChart3, LineChart, PieChart, Layers, Download } from 'lucide-react';
import { VisualizationSpec } from '../types';
import { useTheme } from '../context/ThemeContext';

interface ChartViewerProps {
  spec: VisualizationSpec;
  data: Record<string, any>[];
}

const PALETTES = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#f97316', // orange
  '#14b8a6'  // teal
];

export const ChartViewer: React.FC<ChartViewerProps> = ({ spec, data }) => {
  const { isDark } = useTheme();
  const [activeChartType, setActiveChartType] = useState<VisualizationSpec['chart_type']>(spec.chart_type || 'bar');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0 || !spec.enabled) {
    return null;
  }

  const xKey = spec.x;
  const yKey = spec.y;
  const seriesKey = spec.series;

  const formatValue = (val: number) => {
    if (isNaN(val)) return '0';
    if (spec.suggested_format === 'currency') {
      if (Math.abs(val) >= 1_000_000) return `₹${(val / 1_000_000).toFixed(2)}M`;
      if (Math.abs(val) >= 1_000) return `₹${(val / 1_000).toFixed(1)}k`;
      return `₹${val.toLocaleString()}`;
    }
    if (spec.suggested_format === 'percentage') {
      return `${val.toFixed(1)}%`;
    }
    return val.toLocaleString();
  };

  // 1. Group data for multi-line or aggregations
  const isMultiSeries = activeChartType === 'multi_line' || (seriesKey && Boolean(data[0]?.[seriesKey]));

  // Standard flat items (take up to 25 items for clarity)
  const displayItems = data.slice(0, 30);
  const numericValues = displayItems.map(d => Number(d[yKey]) || 0);
  const maxValue = Math.max(...numericValues, 1);

  // SVG dimensions
  const svgWidth = 720;
  const svgHeight = 280;
  const padding = { top: 25, right: 30, bottom: 45, left: 65 };
  const chartWidth = svgWidth - padding.left - padding.right;
  const chartHeight = svgHeight - padding.top - padding.bottom;

  return (
    <div
      className={`border rounded-xl p-5 mb-6 shadow-md transition-colors ${
        isDark ? 'bg-[#121620] border-[#222b3d]' : 'bg-white border-slate-200'
      }`}
    >
      {/* Header with Title and Type Switcher */}
      <div
        className={`flex flex-col sm:flex-row sm:items-center justify-between pb-4 mb-4 border-b gap-3 ${
          isDark ? 'border-[#1f2738]' : 'border-slate-100'
        }`}
      >
        <div>
          <h3
            className={`font-semibold text-sm flex items-center space-x-2 ${
              isDark ? 'text-slate-100' : 'text-slate-800'
            }`}
          >
            <span>{spec.title}</span>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm bg-blue-500/10 text-blue-500 border border-blue-500/20">
              {activeChartType.replace('_', ' ')}
            </span>
          </h3>
          {spec.subtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{spec.subtitle}</p>
          )}
        </div>

        {/* Chart type controls */}
        <div
          className={`flex items-center space-x-1 p-1 rounded-lg border self-start sm:self-auto ${
            isDark ? 'bg-[#0e121a] border-[#232c3f]' : 'bg-slate-100 border-slate-200'
          }`}
        >
          <button
            onClick={() => setActiveChartType('bar')}
            className={`p-1.5 rounded-md text-xs flex items-center space-x-1 transition-colors ${
              activeChartType === 'bar'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Bar Chart"
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Bar</span>
          </button>
          <button
            onClick={() => setActiveChartType('line')}
            className={`p-1.5 rounded-md text-xs flex items-center space-x-1 transition-colors ${
              activeChartType === 'line'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Line Chart"
          >
            <LineChart className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Line</span>
          </button>
          <button
            onClick={() => setActiveChartType('area')}
            className={`p-1.5 rounded-md text-xs flex items-center space-x-1 transition-colors ${
              activeChartType === 'area'
                ? 'bg-blue-600 text-white'
                : isDark
                ? 'text-slate-400 hover:text-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Area Chart"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Area</span>
          </button>
          {displayItems.length <= 10 && (
            <button
              onClick={() => setActiveChartType('donut')}
              className={`p-1.5 rounded-md text-xs flex items-center space-x-1 transition-colors ${
                activeChartType === 'donut'
                  ? 'bg-blue-600 text-white'
                  : isDark
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Donut Chart"
            >
              <PieChart className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Donut</span>
            </button>
          )}
        </div>
      </div>

      {/* SVG Chart Rendering */}
      <div className="relative w-full overflow-x-auto">
        {activeChartType === 'donut' ? (
          // Donut Chart
          <div className="flex flex-col md:flex-row items-center justify-center py-4 gap-8">
            <svg width={220} height={220} viewBox="0 0 220 220" className="overflow-visible">
              {(() => {
                const total = numericValues.reduce((a, b) => a + b, 0) || 1;
                let accumulatedAngle = 0;
                const cx = 110;
                const cy = 110;
                const r = 85;
                const innerR = 52;

                return displayItems.map((item, idx) => {
                  const val = Number(item[yKey]) || 0;
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
                  const color = PALETTES[idx % PALETTES.length];
                  const isHovered = hoveredIndex === idx;

                  return (
                    <path
                      key={idx}
                      d={pathData}
                      fill={color}
                      className="transition-all duration-150 cursor-pointer"
                      opacity={isHovered ? 1 : 0.85}
                      transform={isHovered ? `scale(1.04) translate(-4, -4)` : ''}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                });
              })()}
              <circle cx="110" cy="110" r="50" fill={isDark ? '#121620' : '#ffffff'} />
              <text
                x="110"
                y="106"
                textAnchor="middle"
                className={`text-[11px] font-sans ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
              >
                Total
              </text>
              <text
                x="110"
                y="124"
                textAnchor="middle"
                className={`text-xs font-bold font-mono ${isDark ? 'fill-slate-100' : 'fill-slate-900'}`}
              >
                {formatValue(numericValues.reduce((a, b) => a + b, 0))}
              </text>
            </svg>

            {/* Donut Legend */}
            <div className="space-y-2 text-xs max-w-sm">
              {displayItems.map((item, idx) => {
                const color = PALETTES[idx % PALETTES.length];
                const val = Number(item[yKey]) || 0;
                const total = numericValues.reduce((a, b) => a + b, 0) || 1;
                const pct = Math.round((val / total) * 100);

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredIndex(idx)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    className={`flex items-center justify-between p-1.5 rounded-md cursor-pointer transition-colors ${
                      hoveredIndex === idx ? (isDark ? 'bg-white/5' : 'bg-slate-100') : ''
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                      <span className={`font-medium truncate max-w-[160px] ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {String(item[xKey])}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 font-mono">
                      <span className={`font-semibold ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>{formatValue(val)}</span>
                      <span className="text-slate-400 text-[10px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // Cartesian (Bar, Line, Area)
          <div className="min-w-[620px]">
            <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="overflow-visible">
              {/* Background grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((pct, i) => {
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
                      {formatValue(gridVal)}
                    </text>
                  </g>
                );
              })}

              {/* BAR CHART RENDERING */}
              {activeChartType === 'bar' &&
                displayItems.map((item, idx) => {
                  const val = Number(item[yKey]) || 0;
                  const barWidth = Math.max(8, Math.min(38, (chartWidth / displayItems.length) * 0.7));
                  const stepX = chartWidth / displayItems.length;
                  const x = padding.left + idx * stepX + (stepX - barWidth) / 2;
                  const barHeight = Math.max(2, (val / maxValue) * chartHeight);
                  const y = padding.top + chartHeight - barHeight;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g key={idx}>
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx={3}
                        fill={isHovered ? '#60a5fa' : '#3b82f6'}
                        className="transition-all duration-150 cursor-pointer"
                        onMouseEnter={() => setHoveredIndex(idx)}
                        onMouseLeave={() => setHoveredIndex(null)}
                      />
                      {/* X Axis Label */}
                      <text
                        x={x + barWidth / 2}
                        y={padding.top + chartHeight + 18}
                        textAnchor="end"
                        transform={`rotate(-25, ${x + barWidth / 2}, ${padding.top + chartHeight + 18})`}
                        className={`text-[9px] font-sans truncate ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
                      >
                        {String(item[xKey]).length > 12
                          ? String(item[xKey]).substring(0, 10) + '…'
                          : String(item[xKey])}
                      </text>
                    </g>
                  );
                })}

              {/* LINE / AREA CHART RENDERING */}
              {(activeChartType === 'line' || activeChartType === 'area') && (() => {
                const points = displayItems.map((item, idx) => {
                  const val = Number(item[yKey]) || 0;
                  const stepX = chartWidth / Math.max(1, displayItems.length - 1);
                  const x = padding.left + idx * stepX;
                  const y = padding.top + chartHeight - (val / maxValue) * chartHeight;
                  return { x, y, val, label: String(item[xKey]) };
                });

                const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                const areaPath = `${linePath} L ${points[points.length - 1]?.x} ${padding.top + chartHeight} L ${points[0]?.x} ${padding.top + chartHeight} Z`;

                return (
                  <g>
                    {activeChartType === 'area' && (
                      <path d={areaPath} fill="url(#areaGradient)" opacity="0.35" />
                    )}
                    <path
                      d={linePath}
                      fill="none"
                      stroke="#3b82f6"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />

                    {/* Gradient Definition */}
                    <defs>
                      <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Data Points */}
                    {points.map((p, idx) => {
                      const isHovered = hoveredIndex === idx;
                      return (
                        <g key={idx}>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isHovered ? 5 : 3.5}
                            fill="#3b82f6"
                            stroke={isDark ? '#0d1117' : '#ffffff'}
                            strokeWidth="2"
                            className="cursor-pointer transition-all"
                            onMouseEnter={() => setHoveredIndex(idx)}
                            onMouseLeave={() => setHoveredIndex(null)}
                          />
                          {/* Label every 2nd or 3rd if many points */}
                          {(displayItems.length <= 15 || idx % Math.ceil(displayItems.length / 10) === 0) && (
                            <text
                              x={p.x}
                              y={padding.top + chartHeight + 18}
                              textAnchor="end"
                              transform={`rotate(-25, ${p.x}, ${padding.top + chartHeight + 18})`}
                              className={`text-[9px] font-sans ${isDark ? 'fill-slate-400' : 'fill-slate-500'}`}
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

            {/* Hover Tooltip Card */}
            {hoveredIndex !== null && displayItems[hoveredIndex] && (
              <div
                className={`mt-2 p-2 border rounded-lg inline-flex items-center space-x-3 text-xs shadow-md ${
                  isDark
                    ? 'bg-[#0c1017] border-blue-500/30 text-slate-200'
                    : 'bg-white border-blue-500/30 text-slate-800'
                }`}
              >
                <span className="font-semibold">
                  {String(displayItems[hoveredIndex][xKey])}:
                </span>
                <span className="font-mono text-blue-500 font-bold">
                  {formatValue(Number(displayItems[hoveredIndex][yKey]) || 0)}
                </span>
                <span className="text-[10px] text-slate-400 uppercase">
                  ({spec.y_label})
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

