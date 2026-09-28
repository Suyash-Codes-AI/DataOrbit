import { getGeminiClient, getGeminiModel } from './client.js';

export interface VisualizationSpec {
  chart_type: 'bar' | 'line' | 'donut' | 'multi_line' | 'area';
  x: string;
  y: string;
  series?: string;
  title: string;
  subtitle?: string;
  x_label: string;
  y_label: string;
  color_palette?: string[];
  suggested_format?: 'currency' | 'number' | 'percentage';
  enabled: boolean;
}

export async function generateVisualizationSpec(
  userQuery: string,
  columns: string[],
  sampleRows: any[]
): Promise<VisualizationSpec> {
  if (!sampleRows || sampleRows.length === 0 || columns.length < 2) {
    return {
      chart_type: 'bar',
      x: columns[0] || 'category',
      y: columns[1] || 'value',
      title: 'Data Distribution',
      x_label: 'Category',
      y_label: 'Value',
      enabled: false
    };
  }

  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  if (ai) {
    try {
      const systemInstruction = `You are a Senior Data Visualization Engineer.
Given the user request, columns, and sample rows, select the optimal visualization specification.
RULES:
- date + numeric => "line" or "area"
- category/text + numeric => "bar"
- distribution / market share / categories <= 6 => "donut" or "bar"
- date + multiple categories/cities + numeric => "multi_line" or "bar"
Output valid JSON adhering to:
{
  "chart_type": "bar" | "line" | "donut" | "multi_line" | "area",
  "x": "column_for_x_axis",
  "y": "column_for_y_axis",
  "series": "optional_column_for_grouping_or_multi_line",
  "title": "Clean, informative chart title",
  "subtitle": "Brief subtitle explaining the metric",
  "x_label": "Axis label",
  "y_label": "Axis label",
  "suggested_format": "currency" | "number" | "percentage"
}`;

      const prompt = `User Query: "${userQuery}"
Available Columns: ${JSON.stringify(columns)}
Sample Rows: ${JSON.stringify(sampleRows.slice(0, 3))}

Generate the visualization specification:`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });

      const parsed: VisualizationSpec = JSON.parse(response.text?.trim() || '{}');
      if (parsed.chart_type && parsed.x && parsed.y && columns.includes(parsed.x)) {
        parsed.enabled = true;
        return parsed;
      }
    } catch (err) {
      console.warn('[Chart Planner] Gemini visualization planner error, using deterministic rules:', err);
    }
  }

  // Deterministic Visualization Rule Planner
  return buildDeterministicChartSpec(userQuery, columns, sampleRows);
}

function buildDeterministicChartSpec(
  userQuery: string,
  columns: string[],
  rows: any[]
): VisualizationSpec {
  const dateCol = columns.find(c => /date|month|year|period|day/i.test(c));
  const numericCols = columns.filter(c => {
    const val = rows[0]?.[c];
    return typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null && !/id|code/i.test(c));
  });
  const catCol = columns.find(c => !dateCol && !numericCols.includes(c) && !/id/i.test(c)) || columns[0];
  const groupCol = columns.find(c => c !== catCol && c !== dateCol && !numericCols.includes(c));

  const primaryMetric = numericCols.find(c => /revenue|sales|profit|total|amount/i.test(c)) || numericCols[0] || 'value';
  const format: 'currency' | 'number' | 'percentage' = /revenue|profit|sales|price|cost|amount/i.test(primaryMetric)
    ? 'currency'
    : /margin|pct|percentage|rate/i.test(primaryMetric)
    ? 'percentage'
    : 'number';

  // If time series with multiple groups (e.g. Month + City + Revenue)
  if (dateCol && groupCol && numericCols.length > 0) {
    return {
      chart_type: 'multi_line',
      x: dateCol,
      y: primaryMetric,
      series: groupCol,
      title: `${primaryMetric.replace(/_/g, ' ').toUpperCase()} by ${dateCol} & ${groupCol}`,
      subtitle: `Comparative trend across ${groupCol} dimensions`,
      x_label: dateCol.replace(/_/g, ' ').toUpperCase(),
      y_label: primaryMetric.replace(/_/g, ' ').toUpperCase(),
      suggested_format: format,
      enabled: true
    };
  }

  // If simple time series
  if (dateCol && numericCols.length > 0) {
    return {
      chart_type: 'line',
      x: dateCol,
      y: primaryMetric,
      title: `${primaryMetric.replace(/_/g, ' ').toUpperCase()} over Time`,
      subtitle: `Temporal distribution aggregated by ${dateCol}`,
      x_label: dateCol.replace(/_/g, ' ').toUpperCase(),
      y_label: primaryMetric.replace(/_/g, ' ').toUpperCase(),
      suggested_format: format,
      enabled: true
    };
  }

  // If category with few rows (e.g. Regions or Categories <= 6)
  if (rows.length <= 6 && catCol && numericCols.length > 0) {
    return {
      chart_type: 'donut',
      x: catCol,
      y: primaryMetric,
      title: `Distribution of ${primaryMetric.replace(/_/g, ' ').toUpperCase()} by ${catCol}`,
      subtitle: `Share of total across ${rows.length} segments`,
      x_label: catCol.replace(/_/g, ' ').toUpperCase(),
      y_label: primaryMetric.replace(/_/g, ' ').toUpperCase(),
      suggested_format: format,
      enabled: true
    };
  }

  // Default: Bar Chart
  return {
    chart_type: 'bar',
    x: catCol || columns[0],
    y: primaryMetric,
    title: `${primaryMetric.replace(/_/g, ' ').toUpperCase()} by ${(catCol || columns[0]).replace(/_/g, ' ')}`,
    subtitle: `Ranked comparison across ${rows.length} items`,
    x_label: (catCol || columns[0]).replace(/_/g, ' ').toUpperCase(),
    y_label: primaryMetric.replace(/_/g, ' ').toUpperCase(),
    suggested_format: format,
    enabled: true
  };
}
