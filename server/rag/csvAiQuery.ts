import { getGeminiClient, getGeminiModel } from '../gemini/client.js';
import { csvStore, CsvDataset } from '../rag/csvStore.js';
import { AnalysisEngine } from '../deterministic/analysisEngine.js';

export interface CsvAiQueryResult {
  question: string;
  datasetId: string;
  datasetName: string;
  directAnswer: string;
  keyInsights: string[];
  anomaliesDetected: string[];
  columns: string[];
  rows: Record<string, any>[];
  rowCount: number;
  deterministicSummary: {
    aggregates: Record<string, number>;
    metricsCalculated: string[];
  };
  visualizationSpec?: {
    chartType: 'bar' | 'line' | 'donut';
    xKey: string;
    yKey: string;
    title: string;
  };
}

export async function askCsvDatasetWithAi(
  datasetId: string,
  userQuestion: string
): Promise<CsvAiQueryResult> {
  const dataset = csvStore.getDataset(datasetId);
  if (!dataset) {
    throw new Error(`CSV Dataset with ID '${datasetId}' not found.`);
  }

  const { columns, allRows, name } = dataset;
  const sampleData = allRows.slice(0, 15);

  // Run deterministic numerical checks on the dataset
  const numericColumns = columns.filter(c => {
    const val = allRows[0]?.[c];
    return typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null);
  });

  const aggregates: Record<string, number> = {};
  const metricsCalculated: string[] = [];

  for (const numCol of numericColumns) {
    const vals = allRows.map(r => Number(r[numCol])).filter(v => !isNaN(v));
    if (vals.length > 0) {
      const stats = AnalysisEngine.calculateStatistics(vals, numCol);
      aggregates[`${numCol}_total`] = stats.sum;
      aggregates[`${numCol}_avg`] = stats.mean;
      aggregates[`${numCol}_max`] = stats.max;
      aggregates[`${numCol}_min`] = stats.min;
      metricsCalculated.push(numCol);
    }
  }

  // Filter or rank relevant rows deterministically
  let matchedRows = [...allRows];
  const qLower = userQuestion.toLowerCase();

  // Search keyword filtering
  for (const col of columns) {
    const valuesInCol = Array.from(new Set(allRows.map(r => String(r[col] || '').toLowerCase())));
    const matchingVal = valuesInCol.find(v => v.length > 2 && qLower.includes(v));
    if (matchingVal) {
      matchedRows = matchedRows.filter(r => String(r[col] || '').toLowerCase() === matchingVal);
      break;
    }
  }

  // Sort if user asks for top, highest, lowest
  const primaryMetric = numericColumns.find(c => qLower.includes(c.toLowerCase())) ||
    numericColumns.find(c => /revenue|roas|spend|sales|conversions|leads|profit|quantity/i.test(c)) ||
    numericColumns[0];

  if (primaryMetric) {
    const isLowest = /lowest|worst|bottom|least|min/i.test(qLower);
    matchedRows.sort((a, b) => {
      const vA = Number(a[primaryMetric]) || 0;
      const vB = Number(b[primaryMetric]) || 0;
      return isLowest ? vA - vB : vB - vA;
    });
  }

  const limitMatch = userQuestion.match(/\b(?:top|first|limit)\s+(\d+)\b/i);
  const rowLimit = limitMatch ? parseInt(limitMatch[1], 10) : 10;
  const returnedRows = matchedRows.slice(0, Math.min(rowLimit, 50));

  // Gemini AI reasoning and structured answer
  const ai = getGeminiClient();
  const model = getGeminiModel();

  let directAnswer = `Analyzed ${dataset.rowCount} extracted records from "${name}".`;
  let keyInsights: string[] = [];
  let anomalies: string[] = [];

  if (ai) {
    try {
      const systemInstruction = `You are an elite Data Intelligence AI Analyst.
Analyze the user's question regarding an extracted CSV dataset.
You are provided with:
1. Exact deterministic calculations (sums, averages, bounds).
2. Ranked subset of actual rows.
3. Column schema.

CRITICAL RULES:
- Ground your answer strictly on the numbers and records provided.
- Do NOT hallucinate unobserved data.
- Separate key empirical facts from observations.

Output strictly valid JSON:
{
  "directAnswer": "Concise, professional 2-3 sentence executive summary answering the question directly.",
  "keyInsights": [
    "Insight bullet 1 with exact numbers",
    "Insight bullet 2 with exact numbers",
    "Insight bullet 3"
  ],
  "anomaliesDetected": [
    "Any notable outlier, high variance, or unexpected deviation"
  ],
  "recommendedChart": {
    "chartType": "bar" | "line" | "donut",
    "xKey": "string",
    "yKey": "string",
    "title": "string"
  }
}`;

      const prompt = `User Question: "${userQuestion}"
Dataset Name: "${name}"
Total Rows: ${dataset.rowCount}
Available Columns: ${JSON.stringify(columns)}
Deterministic Aggregates: ${JSON.stringify(aggregates)}
Top Matching Records: ${JSON.stringify(returnedRows)}

Synthesize the data and return structured answer:`;

      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      if (parsed.directAnswer) directAnswer = parsed.directAnswer;
      if (Array.isArray(parsed.keyInsights)) keyInsights = parsed.keyInsights;
      if (Array.isArray(parsed.anomaliesDetected)) anomalies = parsed.anomaliesDetected;

      return {
        question: userQuestion,
        datasetId,
        datasetName: name,
        directAnswer,
        keyInsights,
        anomaliesDetected: anomalies,
        columns,
        rows: returnedRows,
        rowCount: returnedRows.length,
        deterministicSummary: {
          aggregates,
          metricsCalculated
        },
        visualizationSpec: parsed.recommendedChart ? {
          chartType: parsed.recommendedChart.chartType || 'bar',
          xKey: parsed.recommendedChart.xKey || columns[0],
          yKey: parsed.recommendedChart.yKey || primaryMetric || columns[1],
          title: parsed.recommendedChart.title || `Analysis of ${name}`
        } : undefined
      };
    } catch (err) {
      console.warn('[CSV AI Query] Gemini call failed, using deterministic synthesis:', err);
    }
  }

  // Deterministic synthesis fallback
  if (returnedRows.length > 0 && primaryMetric) {
    const topRow = returnedRows[0];
    const topLabel = topRow[columns[0]] || topRow[columns[1]];
    directAnswer = `Based on extracted data from "${name}", ${topLabel} recorded the highest ${primaryMetric.replace(/_/g, ' ')} at ${(Number(topRow[primaryMetric]) || 0).toLocaleString()}.`;
    keyInsights = [
      `Top performer: ${topLabel} (${primaryMetric}: ${Number(topRow[primaryMetric]).toLocaleString()}).`,
      `Overall dataset aggregate for ${primaryMetric}: ${aggregates[`${primaryMetric}_total`]?.toLocaleString() || 'N/A'}.`,
      `Average per record: ${aggregates[`${primaryMetric}_avg`]?.toLocaleString(undefined, { maximumFractionDigits: 1 }) || 'N/A'}.`
    ];
  }

  return {
    question: userQuestion,
    datasetId,
    datasetName: name,
    directAnswer,
    keyInsights,
    anomaliesDetected: anomalies,
    columns,
    rows: returnedRows,
    rowCount: returnedRows.length,
    deterministicSummary: {
      aggregates,
      metricsCalculated
    },
    visualizationSpec: primaryMetric ? {
      chartType: 'bar',
      xKey: columns[0],
      yKey: primaryMetric,
      title: `${primaryMetric.replace(/_/g, ' ').toUpperCase()} across ${columns[0]}`
    } : undefined
  };
}
