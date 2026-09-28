import Papa from 'papaparse';
import { validateDataset, ValidationReport } from '../deterministic/dataValidator.js';
import { AnalysisEngine, StatisticsResult } from '../deterministic/analysisEngine.js';
import { getGeminiClient, getGeminiModel } from '../gemini/client.js';

export interface CsvDataset {
  id: string;
  name: string;
  filename: string;
  uploadedAt: string;
  sizeBytes: number;
  rowCount: number;
  columns: string[];
  sampleRows: Record<string, any>[];
  allRows: Record<string, any>[];
  validationReport: ValidationReport;
  columnStats: Record<string, StatisticsResult | { uniqueCount: number; topValues: string[] }>;
  aiSummary?: {
    overview: string;
    keyThemes: string[];
    suggestedQueries: string[];
    dataQualityVerdict: string;
  };
}

class CsvStore {
  private datasets: Map<string, CsvDataset> = new Map();

  constructor() {
    this.seedDemoCsv();
  }

  public getAllDatasets(): Omit<CsvDataset, 'allRows'>[] {
    return Array.from(this.datasets.values()).map(d => {
      const { allRows, ...rest } = d;
      return rest;
    });
  }

  public getDataset(id: string): CsvDataset | undefined {
    return this.datasets.get(id);
  }

  public deleteDataset(id: string): boolean {
    return this.datasets.delete(id);
  }

  public async processAndAddCsv(
    name: string,
    filename: string,
    csvRawText: string
  ): Promise<CsvDataset> {
    const parseResult = Papa.parse<Record<string, any>>(csvRawText.trim(), {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    });

    const rows = parseResult.data || [];
    const columns = parseResult.meta.fields || (rows[0] ? Object.keys(rows[0]) : []);

    const validationReport = validateDataset(rows, columns);

    // Compute column-level statistics
    const columnStats: Record<string, any> = {};
    for (const col of columns) {
      const numericValues: number[] = [];
      const stringValues: string[] = [];

      for (const row of rows) {
        const val = row[col];
        if (typeof val === 'number' && !isNaN(val)) {
          numericValues.push(val);
        } else if (val !== null && val !== undefined && val !== '') {
          stringValues.push(String(val));
        }
      }

      if (numericValues.length > 0 && numericValues.length >= rows.length * 0.5) {
        columnStats[col] = AnalysisEngine.calculateStatistics(numericValues, col);
      } else {
        const freqMap: Record<string, number> = {};
        for (const s of stringValues) {
          freqMap[s] = (freqMap[s] || 0) + 1;
        }
        const topValues = Object.entries(freqMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([k, count]) => `${k} (${count})`);

        columnStats[col] = {
          uniqueCount: new Set(stringValues).size,
          topValues
        };
      }
    }

    const id = `csv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Generate AI Summary and suggested natural-language queries
    const aiSummary = await this.generateCsvAiSummary(name, columns, rows.length, rows.slice(0, 5), validationReport);

    const dataset: CsvDataset = {
      id,
      name,
      filename,
      uploadedAt: new Date().toISOString(),
      sizeBytes: Buffer.byteLength(csvRawText, 'utf8'),
      rowCount: rows.length,
      columns,
      sampleRows: rows.slice(0, 50),
      allRows: rows,
      validationReport,
      columnStats,
      aiSummary
    };

    this.datasets.set(id, dataset);
    return dataset;
  }

  public queryCsvData(
    datasetId: string,
    filterFn?: (row: any) => boolean,
    limit: number = 100
  ): { columns: string[]; rows: any[]; totalCount: number } {
    const dataset = this.datasets.get(datasetId);
    if (!dataset) {
      throw new Error(`CSV Dataset '${datasetId}' not found.`);
    }

    let filtered = dataset.allRows;
    if (filterFn) {
      filtered = filtered.filter(filterFn);
    }

    return {
      columns: dataset.columns,
      rows: filtered.slice(0, limit),
      totalCount: filtered.length
    };
  }

  private async generateCsvAiSummary(
    name: string,
    columns: string[],
    rowCount: number,
    sampleRows: any[],
    validationReport: ValidationReport
  ) {
    const ai = getGeminiClient();
    const model = getGeminiModel();

    if (ai) {
      try {
        const prompt = `You are a Principal Data Intelligence Architect.
Analyze this newly extracted CSV dataset:
Dataset Name: "${name}"
Total Rows: ${rowCount}
Columns: ${JSON.stringify(columns)}
Sample Rows: ${JSON.stringify(sampleRows)}
Validation Quality Score: ${validationReport.quality_score}/100

Generate a concise AI briefing and 4 high-value analytical questions a business executive would ask.
Output MUST be strict JSON:
{
  "overview": "2-sentence executive summary of what this dataset contains",
  "keyThemes": ["theme 1", "theme 2", "theme 3"],
  "suggestedQueries": [
    "Suggested question 1",
    "Suggested question 2",
    "Suggested question 3",
    "Suggested question 4"
  ],
  "dataQualityVerdict": "Brief assessment of data readiness and reliability"
}`;

        const res = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            temperature: 0.2,
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(res.text || '{}');
        if (parsed.overview && parsed.suggestedQueries) {
          return parsed;
        }
      } catch (err) {
        console.warn('[CSV Store] Gemini AI summary failed, using deterministic fallback:', err);
      }
    }

    // Deterministic fallback
    return {
      overview: `Extracted dataset "${name}" contains ${rowCount.toLocaleString()} rows structured across ${columns.length} attributes (${columns.slice(0, 4).join(', ')}).`,
      keyThemes: [
        'Transactional and dimensional distribution',
        'Performance metrics across entities',
        'Statistical distribution and outlier checks'
      ],
      suggestedQueries: [
        `What are the top 5 records by ${columns.find(c => /revenue|sales|profit|amount|score|total/i.test(c)) || columns[1] || 'value'}?`,
        `Calculate average and total distribution across ${columns[0] || 'categories'}`,
        `Detect statistical anomalies and outliers in this CSV dataset`,
        `Compare performance patterns and growth rates`
      ],
      dataQualityVerdict: `Quality score rated at ${validationReport.quality_score}/100 with ${validationReport.missing_values} missing values.`
    };
  }

  private seedDemoCsv() {
    const demoCsvData = `channel_name,region,campaign_name,spend_inr,leads_generated,conversions,revenue_inr,roas,target_audience
Google Search,Delhi NCR,Enterprise AI Q1 Push,450000,1280,185,2450000,5.44,CIOs & IT Directors
LinkedIn Ads,Mumbai MMR,Fintech High-Performance Hub,620000,940,142,3100000,5.00,Banking Tech Leaders
Meta Ads,Bangalore,SaaS Accelerator Demo,280000,2150,98,980000,3.50,Startup Founders
Google Search,Mumbai MMR,Cloud Infrastructure Migration,510000,1410,210,3850000,7.55,Cloud Architects
Email Nurture,Delhi NCR,Mid-Market ERP Upgrade,95000,860,65,720000,7.58,Operations Heads
LinkedIn Ads,Delhi NCR,Cybersecurity Awareness Q2,390000,720,84,1420000,3.64,Security CISOs
Webinar Series,Chennai,Industrial IoT Automation,180000,640,78,1180000,6.56,Plant Managers
Google Display,Pune,Optima Storage Flash Sale,140000,1890,44,490000,3.50,IT Procurement
Direct Outreach,Bangalore,Neural Accelerator VIP Cohort,310000,340,68,2600000,8.39,AI Research Labs
Events & Summits,Mumbai MMR,Global BFSI Tech Summit,850000,1120,195,4900000,5.76,C-Suite Executives
Google Search,Bangalore,DataMesh Analytics Trial,320000,1650,160,2240000,7.00,Data Engineers
LinkedIn Ads,Chennai,VisionAI Sensor Showcase,240000,580,52,780000,3.25,Automation Engineers`;

    this.processAndAddCsv(
      'Q1-Q2 Enterprise Marketing Campaigns & Channel ROAS',
      'enterprise_marketing_roas_2025.csv',
      demoCsvData
    ).catch(err => console.error('[CSV Store] Error seeding demo CSV:', err));
  }
}

export const csvStore = new CsvStore();
