export type UserRole = 'executive' | 'data_analyst' | 'business_user' | 'restricted_viewer';

export type ThemeMode = 'dark' | 'light';

export interface VisualizerDatasetOption {
  id: string;
  name: string;
  sourceType: 'postgresql' | 'csv' | 'sql_custom';
  description: string;
  category: string;
  defaultChartType: 'bar' | 'line' | 'area' | 'donut' | 'radar' | 'scatter' | 'kpi';
  data: Record<string, any>[];
  columns: string[];
  numericColumns: string[];
  dimensionColumns: string[];
}

export interface TraceStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  durationMs: number;
  details?: Record<string, any>;
}

export interface ValidationIssue {
  type: string;
  column?: string;
  count: number;
  description: string;
  severity: 'low' | 'medium' | 'high';
}

export interface ValidationReport {
  rows: number;
  columns: string[];
  missing_values: number;
  duplicate_rows: number;
  invalid_dates: number;
  outlier_columns: string[];
  impossible_values: number;
  quality_score: number;
  issues: ValidationIssue[];
  column_stats: Record<string, {
    null_count: number;
    distinct_count: number;
    sample_type: string;
  }>;
}

export interface StructuredInsights {
  summary: string;
  executive_headline: string;
  key_findings: {
    fact: string;
    metric_support: string;
    confidence: 'high' | 'verified';
  }[];
  anomalies: {
    anomaly: string;
    impact: string;
    severity: 'low' | 'moderate' | 'critical';
  }[];
  possible_drivers: {
    hypothesis: string;
    supporting_evidence: string;
    source: string;
  }[];
  business_implications: string[];
  limitations: string[];
}

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

export interface CitationItem {
  sourceType: 'database' | 'document' | 'api';
  name: string;
  details: string;
  citationText?: string;
}

export interface AgentExecutionState {
  user_query: string;
  user_role: UserRole;
  intent: {
    primaryGoal: string;
    entities: string[];
    timeframe?: string;
    requiresDocuments: boolean;
    requiresDatabase: boolean;
  };
  execution_plan: string[];
  available_sources: string[];
  selected_sources: string[];
  permission_results: {
    sourceId: string;
    sourceName: string;
    allowed: boolean;
    reason?: string;
    currentRole: string;
    requiredRole: string;
  }[];
  tool_calls: {
    toolName: string;
    input: any;
    outputSummary?: string;
    durationMs: number;
  }[];
  generated_sql?: string;
  raw_data: {
    columns: string[];
    rows: Record<string, any>[];
    rowCount: number;
    executionTimeMs: number;
  };
  validation_report: ValidationReport;
  analysis_result: {
    trends: {
      overallDirection: 'upward' | 'downward' | 'flat' | 'volatile';
      growthRatePct: number;
      highestPeriod: { period: string; value: number } | null;
      lowestPeriod: { period: string; value: number } | null;
      anomaliesDetected: any[];
    };
    growthResults?: {
      entity: string;
      previousValue: number;
      currentValue: number;
      absoluteChange: number;
      growthPercentage: number;
      trend: string;
      isDeclining: boolean;
    }[];
  };
  insights: StructuredInsights;
  visualization_spec: VisualizationSpec;
  citations: CitationItem[];
  final_response: {
    headline: string;
    summaryMarkdown: string;
  };
  trace_steps: TraceStep[];
  errors: string[];
  execution_status: 'success' | 'partial' | 'denied' | 'error';
  totalDurationMs: number;
}

export interface DatabaseStats {
  connected: boolean;
  databaseName: string;
  totalCustomers: number;
  totalProducts: number;
  totalSales: number;
  dateRange: { start: string; end: string };
  regions: string[];
  categories: string[];
}

export interface QueryHistoryItem {
  id: string;
  question: string;
  generated_sql?: string;
  timestamp: string;
  execution_time_ms: number;
  row_count: number;
  status: 'success' | 'error' | 'denied';
  user_role: string;
}

export interface SavedQueryItem {
  id: string;
  name: string;
  description: string;
  question: string;
  sql: string;
  category: string;
  savedAt: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  filename: string;
  uploadDate: string;
  sizeBytes: number;
  chunksCount: number;
  status: 'indexed' | 'processing' | 'error';
  category: string;
  summary: string;
  rawText: string;
}

export interface DataSourceDefinition {
  id: string;
  name: string;
  description: string;
  category: 'database' | 'documents' | 'api';
  minRoleRequired: UserRole;
  isRestrictedByDefault?: boolean;
}

export interface CsvDatasetMeta {
  id: string;
  name: string;
  filename: string;
  uploadedAt: string;
  sizeBytes: number;
  rowCount: number;
  columns: string[];
  sampleRows: Record<string, any>[];
  validationReport: ValidationReport;
  columnStats: Record<string, any>;
  aiSummary?: {
    overview: string;
    keyThemes: string[];
    suggestedQueries: string[];
    dataQualityVerdict: string;
  };
}

export interface CsvDatasetDetail extends CsvDatasetMeta {
  allRows: Record<string, any>[];
}

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

