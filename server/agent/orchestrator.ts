import { getDb, getDatabaseSchemaString } from '../db/postgres.js';
import { generateSqlForQuery } from '../gemini/sqlGenerator.js';
import { generateStructuredInsights, StructuredInsights } from '../gemini/insightEngine.js';
import { generateVisualizationSpec, VisualizationSpec } from '../gemini/chartPlanner.js';
import { validateDataset, ValidationReport } from '../deterministic/dataValidator.js';
import { AnalysisEngine, TrendAnalysisResult, AnomalyResult, GrowthResult } from '../deterministic/analysisEngine.js';
import { documentStore, RetrievalResult } from '../rag/documentStore.js';
import { checkMultipleSources, UserRole, PermissionCheckResult, DATA_SOURCE_REGISTRY } from '../security/permissions.js';

export interface TraceStep {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  durationMs: number;
  details?: Record<string, any>;
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
  permission_results: PermissionCheckResult[];
  tool_calls: {
    toolName: string;
    input: any;
    outputSummary?: string;
    durationMs: number;
  }[];
  generated_sql?: string;
  raw_data: {
    columns: string[];
    rows: any[];
    rowCount: number;
    executionTimeMs: number;
  };
  validation_report: ValidationReport;
  analysis_result: {
    trends: TrendAnalysisResult;
    growthResults?: GrowthResult[];
    anomalies?: AnomalyResult[];
  };
  insights: StructuredInsights;
  visualization_spec: VisualizationSpec;
  citations: {
    sourceType: 'database' | 'document' | 'api';
    name: string;
    details: string;
    citationText?: string;
  }[];
  final_response: {
    headline: string;
    summaryMarkdown: string;
  };
  trace_steps: TraceStep[];
  errors: string[];
  execution_status: 'success' | 'partial' | 'denied' | 'error';
  totalDurationMs: number;
}

export async function runDataIntelligenceAgent(
  userQuery: string,
  userRole: UserRole = 'data_analyst',
  onTraceUpdate?: (step: TraceStep) => void
): Promise<AgentExecutionState> {
  const startTime = Date.now();

  const state: AgentExecutionState = {
    user_query: userQuery,
    user_role: userRole,
    intent: {
      primaryGoal: 'Analyze business request',
      entities: [],
      requiresDocuments: false,
      requiresDatabase: true
    },
    execution_plan: [],
    available_sources: Object.keys(DATA_SOURCE_REGISTRY),
    selected_sources: [],
    permission_results: [],
    tool_calls: [],
    raw_data: {
      columns: [],
      rows: [],
      rowCount: 0,
      executionTimeMs: 0
    },
    validation_report: {
      rows: 0,
      columns: [],
      missing_values: 0,
      duplicate_rows: 0,
      invalid_dates: 0,
      outlier_columns: [],
      impossible_values: 0,
      quality_score: 100,
      issues: [],
      column_stats: {}
    },
    analysis_result: {
      trends: {
        overallDirection: 'flat',
        growthRatePct: 0,
        highestPeriod: null,
        lowestPeriod: null,
        fastestGrowing: [],
        fastestDeclining: [],
        anomaliesDetected: []
      }
    },
    insights: {
      summary: '',
      executive_headline: '',
      key_findings: [],
      anomalies: [],
      possible_drivers: [],
      business_implications: [],
      limitations: []
    },
    visualization_spec: {
      chart_type: 'bar',
      x: '',
      y: '',
      title: '',
      x_label: '',
      y_label: '',
      enabled: false
    },
    citations: [],
    final_response: {
      headline: '',
      summaryMarkdown: ''
    },
    trace_steps: [
      { id: '1_understand', name: 'Understanding Request', description: 'Deconstructing intent, dimensions, metrics, and entity references', status: 'pending', durationMs: 0 },
      { id: '2_plan', name: 'Creating Execution Plan', description: 'Formulating step-by-step analytical sequence', status: 'pending', durationMs: 0 },
      { id: '3_permissions', name: 'Checking Permissions', description: 'Enforcing role-based access boundaries across requested sources', status: 'pending', durationMs: 0 },
      { id: '4_tools', name: 'Selecting Data Tools', description: 'Mapping analytical goals to query and RAG tools', status: 'pending', durationMs: 0 },
      { id: '5_execute', name: 'Executing Tools & Data Retrieval', description: 'Querying PostgreSQL and retrieving indexed corporate documents', status: 'pending', durationMs: 0 },
      { id: '6_validate', name: 'Validating Data Deterministically', description: 'Testing for missing values, nulls, duplicates, and outliers', status: 'pending', durationMs: 0 },
      { id: '7_analyze', name: 'Performing Deterministic Calculations', description: 'Executing mathematical growth, stats, and aggregations', status: 'pending', durationMs: 0 },
      { id: '8_patterns', name: 'Detecting Trends & Anomalies', description: 'Scanning for Z-score anomalies and trajectory changes', status: 'pending', durationMs: 0 },
      { id: '9_insights', name: 'Generating Structured Insights', description: 'LLM synthesizes verified facts and separates hypotheses', status: 'pending', durationMs: 0 },
      { id: '10_viz', name: 'Creating Visualizations', description: 'Formulating visualization spec matching dimensional data', status: 'pending', durationMs: 0 },
      { id: '11_response', name: 'Synthesizing Final Response', description: 'Assembling executive brief and interactive dashboard artifacts', status: 'pending', durationMs: 0 }
    ],
    errors: [],
    execution_status: 'success',
    totalDurationMs: 0
  };

  const updateStep = (index: number, status: TraceStep['status'], details?: Record<string, any>, durationMs?: number) => {
    state.trace_steps[index].status = status;
    if (details) state.trace_steps[index].details = details;
    if (durationMs !== undefined) state.trace_steps[index].durationMs = durationMs;
    if (onTraceUpdate) onTraceUpdate(state.trace_steps[index]);
  };

  try {
    // -------------------------------------------------------------
    // NODE 1: understand_request
    // -------------------------------------------------------------
    const s1Start = Date.now();
    updateStep(0, 'running');
    const qLower = userQuery.toLowerCase();

    // Intent detection
    const requiresDocs = /why|policy|inventory|reason|maintenance|monsoon|document|memo|slas?/i.test(userQuery);
    const isSensitiveHr = /salary|payroll|compensation|executive pay|bonus/i.test(userQuery);

    state.intent = {
      primaryGoal: isSensitiveHr ? 'Query employee compensation' : 'Perform multi-dimensional business analytics',
      entities: [],
      requiresDocuments: requiresDocs,
      requiresDatabase: true
    };

    if (qLower.includes('delhi')) state.intent.entities.push('Delhi');
    if (qLower.includes('mumbai')) state.intent.entities.push('Mumbai');
    if (qLower.includes('bangalore')) state.intent.entities.push('Bangalore');
    if (qLower.includes('chennai')) state.intent.entities.push('Chennai');
    if (qLower.includes('q3')) state.intent.timeframe = 'Q3 2025';

    updateStep(0, 'completed', {
      primaryGoal: state.intent.primaryGoal,
      entitiesIdentified: state.intent.entities,
      timeframe: state.intent.timeframe || 'All active periods',
      requiresRAG: requiresDocs
    }, Date.now() - s1Start);

    // -------------------------------------------------------------
    // NODE 2: create_plan
    // -------------------------------------------------------------
    const s2Start = Date.now();
    updateStep(1, 'running');

    state.execution_plan = [
      'Validate source access permissions for user role',
      'Generate PostgreSQL query for transactional sales & product schemas',
      requiresDocs ? 'Query document store (RAG) for regional policies and maintenance memos' : 'Bypass document store (pure transactional query)',
      'Run deterministic data quality verification',
      'Execute deterministic statistical calculations (growth, variances)',
      'Synthesize executive facts vs hypotheses',
      'Construct visualization specifications'
    ];

    updateStep(1, 'completed', {
      planStepsCount: state.execution_plan.length,
      planOverview: state.execution_plan
    }, Date.now() - s2Start);

    // -------------------------------------------------------------
    // NODE 3: check_permissions
    // -------------------------------------------------------------
    const s3Start = Date.now();
    updateStep(2, 'running');

    // Select sources based on intent
    const neededSources: string[] = ['sales_db', 'products_db', 'customers_db'];
    if (requiresDocs) neededSources.push('inventory_policy_docs', 'corporate_docs');
    if (isSensitiveHr) neededSources.push('hr_salary_db');

    state.selected_sources = neededSources;
    const permCheck = checkMultipleSources(neededSources, userRole);
    state.permission_results = permCheck.results;

    if (!permCheck.allAllowed) {
      updateStep(2, 'failed', {
        allowedCount: permCheck.results.filter(r => r.allowed).length,
        deniedSources: permCheck.deniedSources.map(d => ({ source: d.sourceName, reason: d.reason }))
      }, Date.now() - s3Start);

      state.execution_status = 'denied';
      state.errors.push(...permCheck.deniedSources.map(d => d.reason || 'Access denied'));
      state.final_response = {
        headline: 'Data Source Access Denied',
        summaryMarkdown: `### 🔒 Access Control Policy Enforcement\n\nYour user role **${userRole}** does not have permission to access one or more requested data sources:\n\n${permCheck.deniedSources.map(d => `- **${d.sourceName}**: ${d.reason}`).join('\n')}\n\nPlease switch roles in the **Settings** panel or contact your system administrator to request elevated permissions.`
      };

      // Mark rest as skipped
      for (let i = 3; i < state.trace_steps.length; i++) {
        updateStep(i, 'skipped');
      }

      state.totalDurationMs = Date.now() - startTime;
      return state;
    }

    updateStep(2, 'completed', {
      verifiedSources: permCheck.results.map(r => r.sourceName),
      userRole
    }, Date.now() - s3Start);

    // -------------------------------------------------------------
    // NODE 4: select_tools
    // -------------------------------------------------------------
    const s4Start = Date.now();
    updateStep(3, 'running');

    const selectedTools = ['query_database()', 'run_analysis()', 'detect_anomalies()', 'generate_chart_spec()'];
    if (requiresDocs) selectedTools.unshift('retrieve_documents()');
    if (/growth|decline|drop|increas/i.test(userQuery)) selectedTools.push('calculate_growth()');

    updateStep(3, 'completed', {
      activeTools: selectedTools
    }, Date.now() - s4Start);

    // -------------------------------------------------------------
    // NODE 5: execute_tools
    // -------------------------------------------------------------
    const s5Start = Date.now();
    updateStep(4, 'running');

    // 5A: Generate & Execute SQL
    const db = await getDb();
    const schemaContext = await getDatabaseSchemaString();

    const sqlGenResult = await generateSqlForQuery(userQuery, schemaContext, state.intent.primaryGoal);
    state.generated_sql = sqlGenResult.sql;

    state.citations.push({
      sourceType: 'database',
      name: 'PostgreSQL Database (ai_data_intelligence)',
      details: `Executed read-only query on tables: ${sqlGenResult.validation.tablesUsed.join(', ')}`,
      citationText: sqlGenResult.sql
    });

    const dbQueryStart = Date.now();
    const dbRes = await db.query(sqlGenResult.sql);
    const dbQueryDuration = Date.now() - dbQueryStart;

    const rows = (dbRes.rows || []) as Record<string, any>[];
    const columns = dbRes.fields ? dbRes.fields.map(f => f.name) : (rows[0] ? Object.keys(rows[0]) : []);

    state.raw_data = {
      columns,
      rows,
      rowCount: rows.length,
      executionTimeMs: dbQueryDuration
    };

    state.tool_calls.push({
      toolName: 'query_database()',
      input: { sql: sqlGenResult.sql },
      outputSummary: `Returned ${rows.length} rows across ${columns.length} columns in ${dbQueryDuration}ms.`,
      durationMs: dbQueryDuration
    });

    // 5B: Document RAG Retrieval if applicable
    let retrievedDocs: RetrievalResult[] = [];
    if (requiresDocs) {
      const ragStart = Date.now();
      retrievedDocs = documentStore.retrieveRelevantChunks(userQuery, 3);
      const ragDuration = Date.now() - ragStart;

      for (const d of retrievedDocs) {
        state.citations.push({
          sourceType: 'document',
          name: d.documentTitle,
          details: `Section: ${d.section || 'General'} (Relevance: ${Math.round(d.score * 100)}%)`,
          citationText: d.snippet
        });
      }

      state.tool_calls.push({
        toolName: 'retrieve_documents()',
        input: { query: userQuery, limit: 3 },
        outputSummary: `Retrieved ${retrievedDocs.length} relevant document snippets.`,
        durationMs: ragDuration
      });
    }

    updateStep(4, 'completed', {
      sqlExecuted: sqlGenResult.sql,
      rowsRetrieved: rows.length,
      documentsRetrieved: retrievedDocs.length,
      queryTimeMs: dbQueryDuration
    }, Date.now() - s5Start);

    // -------------------------------------------------------------
    // NODE 6: validate_data
    // -------------------------------------------------------------
    const s6Start = Date.now();
    updateStep(5, 'running');

    state.validation_report = validateDataset(rows, columns);

    state.tool_calls.push({
      toolName: 'validate_data()',
      input: { rowCount: rows.length, columnsCount: columns.length },
      outputSummary: `Data Quality Score: ${state.validation_report.quality_score}/100. Issues detected: ${state.validation_report.issues.length}`,
      durationMs: Date.now() - s6Start
    });

    updateStep(5, 'completed', {
      qualityScore: state.validation_report.quality_score,
      missingValues: state.validation_report.missing_values,
      duplicateRows: state.validation_report.duplicate_rows,
      outlierColumns: state.validation_report.outlier_columns
    }, Date.now() - s6Start);

    // -------------------------------------------------------------
    // NODE 7 & 8: analyze_data & detect_patterns
    // -------------------------------------------------------------
    const s7Start = Date.now();
    updateStep(6, 'running');

    const trends = AnalysisEngine.analyzeTrends(rows);
    state.analysis_result.trends = trends;

    // Check if growth calculation applies (e.g. products across periods)
    let growthResults: GrowthResult[] = [];
    const prodCol = columns.find(c => /product|name|sku/i.test(c));
    const revCol = columns.find(c => /revenue|sales|units|quantity/i.test(c));
    const yearCol = columns.find(c => /year|yr|month/i.test(c));

    if (prodCol && revCol && yearCol && rows.length >= 2) {
      // Group by product
      const prodMap: Record<string, { prev?: number; curr?: number }> = {};
      const periods = Array.from(new Set(rows.map(r => r[yearCol]))).sort();
      if (periods.length >= 2) {
        const prevPeriod = periods[periods.length - 2];
        const currPeriod = periods[periods.length - 1];

        for (const r of rows) {
          const p = r[prodCol];
          if (!prodMap[p]) prodMap[p] = {};
          if (r[yearCol] === prevPeriod) prodMap[p].prev = Number(r[revCol]) || 0;
          if (r[yearCol] === currPeriod) prodMap[p].curr = Number(r[revCol]) || 0;
        }

        const itemsForGrowth = Object.entries(prodMap)
          .filter(([_, v]) => v.prev !== undefined && v.curr !== undefined)
          .map(([k, v]) => ({ entity: k, previous: v.prev!, current: v.curr! }));

        growthResults = AnalysisEngine.calculateGrowth(itemsForGrowth);
        state.analysis_result.growthResults = growthResults;
      }
    }

    updateStep(6, 'completed', {
      direction: trends.overallDirection,
      growthPct: trends.growthRatePct,
      anomaliesCount: trends.anomaliesDetected.length
    }, Date.now() - s7Start);

    // Node 8: Pattern Detection
    const s8Start = Date.now();
    updateStep(7, 'running');
    updateStep(7, 'completed', {
      highestRecordedPeriod: trends.highestPeriod,
      lowestRecordedPeriod: trends.lowestPeriod,
      decliningProductsIdentified: growthResults.filter(g => g.isDeclining).map(g => g.entity)
    }, Date.now() - s8Start);

    // -------------------------------------------------------------
    // NODE 9: generate_insights
    // -------------------------------------------------------------
    const s9Start = Date.now();
    updateStep(8, 'running');

    state.insights = await generateStructuredInsights(userQuery, {
      rowCount: rows.length,
      columns,
      sampleRows: rows,
      trends,
      growthResults,
      anomalies: trends.anomaliesDetected,
      documentEvidence: retrievedDocs
    });

    updateStep(8, 'completed', {
      findingsCount: state.insights.key_findings.length,
      hypothesesCount: state.insights.possible_drivers.length,
      headline: state.insights.executive_headline
    }, Date.now() - s9Start);

    // -------------------------------------------------------------
    // NODE 10: generate_visualization_spec
    // -------------------------------------------------------------
    const s10Start = Date.now();
    updateStep(9, 'running');

    state.visualization_spec = await generateVisualizationSpec(userQuery, columns, rows);

    updateStep(9, 'completed', {
      chartType: state.visualization_spec.chart_type,
      xAxis: state.visualization_spec.x,
      yAxis: state.visualization_spec.y,
      title: state.visualization_spec.title
    }, Date.now() - s10Start);

    // -------------------------------------------------------------
    // NODE 11: final_response
    // -------------------------------------------------------------
    const s11Start = Date.now();
    updateStep(10, 'running');

    // Build human-friendly Markdown response
    const headline = state.insights.executive_headline || 'Analysis Complete';
    let summaryMd = `${state.insights.summary}\n\n`;

    if (state.insights.key_findings.length > 0) {
      summaryMd += `### 📊 Verified Deterministic Findings\n`;
      for (const f of state.insights.key_findings) {
        summaryMd += `- **${f.fact}** *(Metric: ${f.metric_support})*\n`;
      }
      summaryMd += '\n';
    }

    if (state.insights.possible_drivers.length > 0) {
      summaryMd += `### 💡 Contextual Hypotheses & Evidence\n`;
      for (const d of state.insights.possible_drivers) {
        summaryMd += `- **Hypothesis**: ${d.hypothesis}\n  - *Supporting Evidence*: ${d.supporting_evidence} *(Source: ${d.source})*\n`;
      }
      summaryMd += '\n';
    }

    state.final_response = {
      headline,
      summaryMarkdown: summaryMd
    };

    updateStep(10, 'completed', {
      responseReady: true
    }, Date.now() - s11Start);

  } catch (err: any) {
    console.error('[Agent Orchestrator] Execution Error:', err);
    state.execution_status = 'error';
    state.errors.push(err.message || 'An unexpected error occurred during execution.');

    // Fail current running step
    const runningStepIdx = state.trace_steps.findIndex(s => s.status === 'running');
    if (runningStepIdx >= 0) {
      updateStep(runningStepIdx, 'failed', { error: err.message });
      for (let i = runningStepIdx + 1; i < state.trace_steps.length; i++) {
        updateStep(i, 'skipped');
      }
    }

    state.final_response = {
      headline: 'Execution Error',
      summaryMarkdown: `An error occurred while evaluating your request: **${err.message}**. Please check your query or verify the database status.`
    };
  }

  state.totalDurationMs = Date.now() - startTime;
  return state;
}
