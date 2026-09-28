import { Router, Request, Response } from 'express';
import { runDataIntelligenceAgent } from '../agent/orchestrator.js';
import { getDb, getDatabaseStats, getDatabaseSchemaString, resetDatabase } from '../db/postgres.js';
import { validateAndSanitizeSql } from '../security/sqlValidator.js';
import { DATA_SOURCE_REGISTRY, UserRole } from '../security/permissions.js';
import { documentStore } from '../rag/documentStore.js';
import { isGeminiConfigured, getGeminiModel } from '../gemini/client.js';
import { csvStore } from '../rag/csvStore.js';
import { askCsvDatasetWithAi } from '../rag/csvAiQuery.js';

export const apiRouter = Router();

// In-memory Query History & Saved Queries Store
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

let queryHistory: QueryHistoryItem[] = [
  {
    id: 'hist_init_1',
    question: 'Compare Delhi and Mumbai sales for the last 6 months and identify products whose sales are declining',
    generated_sql: 'SELECT p.name AS product_name, c.city, TO_CHAR(DATE_TRUNC(\'month\', s.sale_date), \'YYYY-MM\') AS month, ROUND(SUM(s.revenue), 2) AS monthly_revenue FROM sales s JOIN products p ON p.id = s.product_id JOIN customers c ON c.id = s.customer_id WHERE c.city IN (\'Delhi\', \'Mumbai\') GROUP BY p.name, c.city, DATE_TRUNC(\'month\', s.sale_date) ORDER BY month ASC LIMIT 500;',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    execution_time_ms: 124,
    row_count: 42,
    status: 'success',
    user_role: 'data_analyst'
  },
  {
    id: 'hist_init_2',
    question: 'Show me the top 10 products by revenue',
    generated_sql: 'SELECT p.name AS product_name, p.category, ROUND(SUM(s.revenue), 2) AS total_revenue, ROUND(SUM(s.profit), 2) AS total_profit FROM sales s JOIN products p ON p.id = s.product_id GROUP BY p.id, p.name, p.category ORDER BY total_revenue DESC LIMIT 10;',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    execution_time_ms: 88,
    row_count: 10,
    status: 'success',
    user_role: 'data_analyst'
  }
];

let savedQueries: SavedQueryItem[] = [
  {
    id: 'save_1',
    name: 'Top 10 Revenue Generators',
    description: 'Ranks top 10 products by aggregate sales revenue',
    question: 'Show me the top 10 products by revenue',
    sql: 'SELECT p.name AS product_name, p.category, ROUND(SUM(s.revenue), 2) AS total_revenue, ROUND(SUM(s.profit), 2) AS total_profit FROM sales s JOIN products p ON p.id = s.product_id GROUP BY p.id, p.name, p.category ORDER BY total_revenue DESC LIMIT 10;',
    category: 'Revenue Analytics',
    savedAt: new Date(Date.now() - 86400000).toISOString().split('T')[0]
  },
  {
    id: 'save_2',
    name: 'Regional Sales & Margin Breakdown',
    description: 'City-level revenue and profit margin distribution',
    question: 'Which region has the highest profit?',
    sql: 'SELECT c.city, c.region, ROUND(SUM(s.revenue), 2) AS total_revenue, ROUND(SUM(s.profit), 2) AS total_profit, ROUND((SUM(s.profit) / NULLIF(SUM(s.revenue), 0)) * 100, 2) AS profit_margin_pct FROM sales s JOIN customers c ON c.id = s.customer_id GROUP BY c.city, c.region ORDER BY total_profit DESC;',
    category: 'Regional Performance',
    savedAt: new Date(Date.now() - 172800000).toISOString().split('T')[0]
  },
  {
    id: 'save_3',
    name: 'Delhi vs Mumbai Comparative Volume',
    description: 'Side-by-side monthly trajectory for Northern vs Western corridors',
    question: 'Compare Delhi and Mumbai sales',
    sql: 'SELECT TO_CHAR(DATE_TRUNC(\'month\', s.sale_date), \'YYYY-MM\') AS month, c.city, ROUND(SUM(s.revenue), 2) AS total_revenue, SUM(s.quantity) AS total_units FROM sales s JOIN customers c ON c.id = s.customer_id WHERE c.city IN (\'Delhi\', \'Mumbai\') GROUP BY DATE_TRUNC(\'month\', s.sale_date), c.city ORDER BY month ASC, c.city ASC;',
    category: 'Comparative Analysis',
    savedAt: new Date(Date.now() - 259200000).toISOString().split('T')[0]
  }
];

// 1. Health check
apiRouter.get('/health', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const stats = await getDatabaseStats();
    res.json({
      status: 'healthy',
      database: {
        connected: true,
        type: 'PostgreSQL (PGlite)',
        totalSales: stats.totalSales,
        totalCustomers: stats.totalCustomers,
        totalProducts: stats.totalProducts
      },
      gemini: {
        configured: isGeminiConfigured(),
        model: getGeminiModel()
      },
      documentsIndexed: documentStore.getAllDocuments().length,
      timestamp: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ status: 'unhealthy', error: err.message });
  }
});

// 2. Main Natural Language Agent Query
apiRouter.post('/query', async (req: Request, res: Response) => {
  try {
    const { question, userRole = 'data_analyst' } = req.body;
    if (!question || typeof question !== 'string') {
      return res.status(400).json({ error: 'Field "question" must be a non-empty string.' });
    }

    const state = await runDataIntelligenceAgent(question.trim(), userRole as UserRole);

    // Save to query history
    const historyItem: QueryHistoryItem = {
      id: `hist_${Date.now()}`,
      question: question.trim(),
      generated_sql: state.generated_sql,
      timestamp: new Date().toISOString(),
      execution_time_ms: state.totalDurationMs,
      row_count: state.raw_data.rowCount,
      status: state.execution_status === 'error' ? 'error' : state.execution_status === 'denied' ? 'denied' : 'success',
      user_role: userRole
    };
    queryHistory.unshift(historyItem);
    if (queryHistory.length > 100) queryHistory.pop();

    res.json(state);
  } catch (err: any) {
    console.error('[API /query] Error:', err);
    res.status(500).json({ error: err.message || 'Internal server error executing query agent.' });
  }
});

// 3. Query History Endpoints
apiRouter.get('/query-history', (req: Request, res: Response) => {
  res.json({ history: queryHistory });
});

apiRouter.delete('/query-history/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  queryHistory = queryHistory.filter(h => h.id !== id);
  res.json({ success: true, remaining: queryHistory.length });
});

apiRouter.delete('/query-history', (req: Request, res: Response) => {
  queryHistory = [];
  res.json({ success: true });
});

// 4. Saved Queries Endpoints
apiRouter.get('/saved-queries', (req: Request, res: Response) => {
  res.json({ savedQueries });
});

apiRouter.post('/saved-queries', (req: Request, res: Response) => {
  const { name, description, question, sql, category } = req.body;
  if (!name || !sql) {
    return res.status(400).json({ error: 'Name and SQL query are required.' });
  }

  const newItem: SavedQueryItem = {
    id: `save_${Date.now()}`,
    name,
    description: description || '',
    question: question || name,
    sql,
    category: category || 'General Analysis',
    savedAt: new Date().toISOString().split('T')[0]
  };

  savedQueries.unshift(newItem);
  res.json({ success: true, savedQuery: newItem });
});

apiRouter.delete('/saved-queries/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  savedQueries = savedQueries.filter(s => s.id !== id);
  res.json({ success: true, remaining: savedQueries.length });
});

// 5. Database Schema & Explorer
apiRouter.get('/database/schema', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const stats = await getDatabaseStats();
    const schemaText = await getDatabaseSchemaString();

    const tables = [
      {
        tableName: 'customers',
        description: 'Commercial client accounts across primary metropolitan territories',
        rowCount: stats.totalCustomers,
        columns: [
          { name: 'id', type: 'SERIAL', pk: true, nullable: false },
          { name: 'name', type: 'VARCHAR(100)', pk: false, nullable: false },
          { name: 'email', type: 'VARCHAR(100)', pk: false, nullable: false },
          { name: 'city', type: 'VARCHAR(50)', pk: false, nullable: false },
          { name: 'region', type: 'VARCHAR(50)', pk: false, nullable: false },
          { name: 'created_at', type: 'TIMESTAMP', pk: false, nullable: true }
        ]
      },
      {
        tableName: 'products',
        description: 'Enterprise software, hardware devices, and telemetry SKUs',
        rowCount: stats.totalProducts,
        columns: [
          { name: 'id', type: 'SERIAL', pk: true, nullable: false },
          { name: 'name', type: 'VARCHAR(100)', pk: false, nullable: false },
          { name: 'category', type: 'VARCHAR(50)', pk: false, nullable: false },
          { name: 'price', type: 'NUMERIC(10,2)', pk: false, nullable: false },
          { name: 'cost', type: 'NUMERIC(10,2)', pk: false, nullable: false },
          { name: 'stock_quantity', type: 'INT', pk: false, nullable: false }
        ]
      },
      {
        tableName: 'sales',
        description: 'High-volume transaction records with revenue, cost, profit, and discounts',
        rowCount: stats.totalSales,
        columns: [
          { name: 'id', type: 'SERIAL', pk: true, nullable: false },
          { name: 'product_id', type: 'INT (FK -> products.id)', pk: false, nullable: false },
          { name: 'customer_id', type: 'INT (FK -> customers.id)', pk: false, nullable: false },
          { name: 'sale_date', type: 'DATE', pk: false, nullable: false },
          { name: 'quantity', type: 'INT', pk: false, nullable: false },
          { name: 'revenue', type: 'NUMERIC(12,2)', pk: false, nullable: false },
          { name: 'cost', type: 'NUMERIC(12,2)', pk: false, nullable: false },
          { name: 'profit', type: 'NUMERIC(12,2)', pk: false, nullable: false },
          { name: 'discount_applied', type: 'NUMERIC(5,2)', pk: false, nullable: true }
        ]
      }
    ];

    res.json({
      databaseName: 'ai_data_intelligence (PostgreSQL)',
      tables,
      stats,
      schemaText
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/database/stats', async (req: Request, res: Response) => {
  try {
    const stats = await getDatabaseStats();
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/database/preview/:tableName', async (req: Request, res: Response) => {
  try {
    const { tableName } = req.params;
    const allowed = ['sales', 'products', 'customers'];
    if (!allowed.includes(tableName)) {
      return res.status(400).json({ error: `Table '${tableName}' not available for preview.` });
    }

    const limit = Math.min(100, parseInt((req.query.limit as string) || '25', 10));
    const offset = Math.max(0, parseInt((req.query.offset as string) || '0', 10));

    const db = await getDb();
    const countRes = await db.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${tableName};`);
    const totalCount = parseInt(countRes.rows[0]?.count || '0', 10);

    const dataRes = await db.query(`SELECT * FROM ${tableName} ORDER BY id ASC LIMIT $1 OFFSET $2;`, [limit, offset]);

    res.json({
      tableName,
      totalCount,
      limit,
      offset,
      columns: dataRes.fields ? dataRes.fields.map(f => f.name) : [],
      rows: dataRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Direct Read-Only SQL execution through validator
apiRouter.post('/database/execute-sql', async (req: Request, res: Response) => {
  try {
    const { sql } = req.body;
    if (!sql) return res.status(400).json({ error: 'SQL string is required.' });

    const validation = validateAndSanitizeSql(sql);
    if (!validation.isValid) {
      return res.status(403).json({
        error: validation.error || 'SQL validation failed.',
        isValid: false
      });
    }

    const db = await getDb();
    const start = Date.now();
    const result = await db.query(validation.sanitizedSql);
    const duration = Date.now() - start;

    res.json({
      sql: validation.sanitizedSql,
      columns: result.fields ? result.fields.map(f => f.name) : [],
      rows: result.rows,
      rowCount: result.rows.length,
      executionTimeMs: duration
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Reset Database
apiRouter.post('/database/reset', async (req: Request, res: Response) => {
  try {
    await resetDatabase();
    const stats = await getDatabaseStats();
    res.json({ success: true, message: 'Database reset and re-seeded successfully.', stats });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Documents / RAG
apiRouter.get('/documents', (req: Request, res: Response) => {
  const docs = documentStore.getAllDocuments();
  res.json({ documents: docs });
});

apiRouter.post('/documents/upload', (req: Request, res: Response) => {
  const { title, filename, text, category } = req.body;
  if (!title || !text) {
    return res.status(400).json({ error: 'Title and text content are required.' });
  }

  const newDoc = documentStore.addDocument(
    title,
    filename || `${title.toLowerCase().replace(/\s+/g, '_')}.md`,
    text,
    category || 'Uploaded Documentation'
  );

  res.json({ success: true, document: newDoc });
});

apiRouter.get('/documents/:id/chunks', (req: Request, res: Response) => {
  const { id } = req.params;
  const chunks = documentStore.getChunksForDocument(id);
  res.json({ chunks });
});

// 7. Permissions & Sources
apiRouter.get('/permissions/sources', (req: Request, res: Response) => {
  res.json({
    sources: Object.values(DATA_SOURCE_REGISTRY),
    roles: ['executive', 'data_analyst', 'business_user', 'restricted_viewer']
  });
});

// 8. CSV Extraction & AI Analysis Endpoints
apiRouter.get('/csv/datasets', (req: Request, res: Response) => {
  try {
    const list = csvStore.getAllDatasets();
    res.json({ datasets: list });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.get('/csv/datasets/:id', (req: Request, res: Response) => {
  try {
    const dataset = csvStore.getDataset(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'CSV dataset not found.' });
    }
    res.json({ dataset });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/csv/extract-upload', async (req: Request, res: Response) => {
  try {
    const { name, filename, csvRawText } = req.body;
    if (!csvRawText || typeof csvRawText !== 'string' || !csvRawText.trim()) {
      return res.status(400).json({ error: 'Field "csvRawText" must be non-empty CSV text.' });
    }

    const title = name?.trim() || filename?.replace(/\.[^/.]+$/, '') || 'Extracted CSV Dataset';
    const fname = filename?.trim() || `${title.toLowerCase().replace(/\s+/g, '_')}.csv`;

    const dataset = await csvStore.processAndAddCsv(title, fname, csvRawText);
    res.json({ success: true, dataset });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to extract CSV data.' });
  }
});

apiRouter.delete('/csv/datasets/:id', (req: Request, res: Response) => {
  try {
    const success = csvStore.deleteDataset(req.params.id);
    res.json({ success });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

apiRouter.post('/csv/ask-ai', async (req: Request, res: Response) => {
  try {
    const { datasetId, question } = req.body;
    if (!datasetId || !question) {
      return res.status(400).json({ error: 'Both datasetId and question are required.' });
    }

    const aiResult = await askCsvDatasetWithAi(datasetId, question.trim());
    res.json(aiResult);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing AI CSV inquiry.' });
  }
});

// 9. DataOrbit Visualizer Endpoints
apiRouter.get('/visualizer/presets', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // Query 1: Monthly Trends
    const monthlyRes = await db.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM') AS month,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        SUM(s.quantity) AS units_sold,
        ROUND((SUM(s.profit) / NULLIF(SUM(s.revenue), 0)) * 100, 2) AS profit_margin_pct
      FROM sales s
      GROUP BY DATE_TRUNC('month', s.sale_date)
      ORDER BY month ASC;
    `);

    // Query 2: Regional Performance
    const regionalRes = await db.query(`
      SELECT 
        c.city,
        c.region,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        SUM(s.quantity) AS units_sold,
        COUNT(DISTINCT s.customer_id) AS active_clients,
        ROUND((SUM(s.profit) / NULLIF(SUM(s.revenue), 0)) * 100, 2) AS profit_margin_pct
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      GROUP BY c.city, c.region
      ORDER BY total_revenue DESC;
    `);

    // Query 3: Top Products
    const productsRes = await db.query(`
      SELECT 
        p.name AS product_name,
        p.category,
        p.price,
        SUM(s.quantity) AS units_sold,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        ROUND((SUM(s.profit) / NULLIF(SUM(s.revenue), 0)) * 100, 2) AS profit_margin_pct
      FROM sales s
      JOIN products p ON p.id = s.product_id
      GROUP BY p.id, p.name, p.category, p.price
      ORDER BY total_revenue DESC
      LIMIT 15;
    `);

    // Query 4: Category Distribution
    const categoryRes = await db.query(`
      SELECT 
        p.category,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        SUM(s.quantity) AS total_units,
        COUNT(s.id) AS order_count
      FROM sales s
      JOIN products p ON p.id = s.product_id
      GROUP BY p.category
      ORDER BY total_revenue DESC;
    `);

    // Convert CSV datasets to visualizer options
    const csvList = csvStore.getAllDatasets();
    const csvPresets = csvList.map(ds => {
      const numCols = ds.columns.filter(c => {
        const sampleVal = ds.sampleRows[0]?.[c];
        return typeof sampleVal === 'number' || (sampleVal !== undefined && sampleVal !== null && sampleVal !== '' && !isNaN(Number(sampleVal)));
      });
      const dimCols = ds.columns.filter(c => !numCols.includes(c));

      return {
        id: `csv_${ds.id}`,
        name: `CSV: ${ds.name}`,
        sourceType: 'csv' as const,
        description: `Extracted CSV dataset (${ds.rowCount} rows, ${ds.columns.length} columns)`,
        category: 'CSV Data Extracts',
        defaultChartType: 'bar' as const,
        data: ds.sampleRows,
        columns: ds.columns,
        numericColumns: numCols.length > 0 ? numCols : ds.columns.slice(1),
        dimensionColumns: dimCols.length > 0 ? dimCols : ds.columns.slice(0, 1)
      };
    });

    const presets = [
      {
        id: 'pg_monthly_trends',
        name: 'PostgreSQL: Monthly Revenue & Profit Trajectory',
        sourceType: 'postgresql',
        description: 'Time-series revenue, profit margins, and sales volume (2025–2026)',
        category: 'Core Database Analytics',
        defaultChartType: 'area',
        data: monthlyRes.rows,
        columns: ['month', 'total_revenue', 'total_profit', 'units_sold', 'profit_margin_pct'],
        numericColumns: ['total_revenue', 'total_profit', 'units_sold', 'profit_margin_pct'],
        dimensionColumns: ['month']
      },
      {
        id: 'pg_regional_breakdown',
        name: 'PostgreSQL: Regional Performance & Market Share',
        sourceType: 'postgresql',
        description: 'City and territorial metrics across Northern, Western, and Southern hubs',
        category: 'Core Database Analytics',
        defaultChartType: 'donut',
        data: regionalRes.rows,
        columns: ['city', 'region', 'total_revenue', 'total_profit', 'units_sold', 'active_clients', 'profit_margin_pct'],
        numericColumns: ['total_revenue', 'total_profit', 'units_sold', 'active_clients', 'profit_margin_pct'],
        dimensionColumns: ['city', 'region']
      },
      {
        id: 'pg_product_rankings',
        name: 'PostgreSQL: Top 15 Product Offerings by Revenue',
        sourceType: 'postgresql',
        description: 'Enterprise catalog ranking by gross transactional yield and margin rate',
        category: 'Core Database Analytics',
        defaultChartType: 'bar',
        data: productsRes.rows,
        columns: ['product_name', 'category', 'price', 'units_sold', 'total_revenue', 'total_profit', 'profit_margin_pct'],
        numericColumns: ['price', 'units_sold', 'total_revenue', 'total_profit', 'profit_margin_pct'],
        dimensionColumns: ['product_name', 'category']
      },
      {
        id: 'pg_category_distribution',
        name: 'PostgreSQL: Product Category Distribution',
        sourceType: 'postgresql',
        description: 'Software vs Hardware vs Cloud vs IoT transactions and volume',
        category: 'Core Database Analytics',
        defaultChartType: 'bar',
        data: categoryRes.rows,
        columns: ['category', 'total_revenue', 'total_profit', 'total_units', 'order_count'],
        numericColumns: ['total_revenue', 'total_profit', 'total_units', 'order_count'],
        dimensionColumns: ['category']
      },
      ...csvPresets
    ];

    res.json({ presets });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to load visualizer presets.' });
  }
});


