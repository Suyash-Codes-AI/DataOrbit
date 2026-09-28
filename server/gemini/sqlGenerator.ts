import { getGeminiClient, getGeminiModel } from './client.js';
import { validateAndSanitizeSql, SqlValidationResult } from '../security/sqlValidator.js';

export interface SqlGenerationResult {
  sql: string;
  explanation: string;
  source: 'gemini' | 'fallback_planner';
  validation: SqlValidationResult;
}

export async function generateSqlForQuery(
  userQuery: string,
  schemaContext: string,
  intentContext?: string
): Promise<SqlGenerationResult> {
  const ai = getGeminiClient();
  const modelName = getGeminiModel();

  if (ai) {
    try {
      const systemInstruction = `You are a Principal PostgreSQL Database Architect and Data Intelligence Specialist.
Your task is to generate a single, highly optimized, 100% syntactically correct, READ-ONLY PostgreSQL query for the user's question.

CRITICAL RULES:
1. ONLY produce a single read-only SELECT query (or WITH ... SELECT).
2. NEVER use INSERT, UPDATE, DELETE, DROP, ALTER, CREATE, TRUNCATE, or write operations.
3. Use the exact tables and columns provided in the schema context below:
${schemaContext}
4. For temporal aggregations in PostgreSQL, use DATE_TRUNC('month', s.sale_date) or TO_CHAR(s.sale_date, 'YYYY-MM').
5. Join sales (s), products (p), and customers (c) as needed:
   - s.product_id = p.id
   - s.customer_id = c.id
6. Apply appropriate filters (e.g., city ILIKE '%Delhi%', or sale_date >= '2025-01-01').
7. When asked for top products/regions, use ORDER BY total_metric DESC LIMIT N.
8. Output MUST BE valid JSON conforming to:
{
  "sql": "SELECT ...",
  "explanation": "Brief explanation of query design"
}
`;

      const prompt = `User Request: "${userQuery}"
${intentContext ? `Extracted Intent: ${intentContext}` : ''}

Generate the PostgreSQL query:`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.1,
          responseMimeType: 'application/json'
        }
      });

      const responseText = response.text || '';
      const parsed = JSON.parse(responseText.trim());
      const rawSql = parsed.sql;
      const explanation = parsed.explanation || 'PostgreSQL query generated via Gemini.';

      const validation = validateAndSanitizeSql(rawSql);
      if (validation.isValid) {
        return {
          sql: validation.sanitizedSql,
          explanation,
          source: 'gemini',
          validation
        };
      } else {
        console.warn('[SQL Generator] Gemini generated invalid SQL, falling back to deterministic planner:', validation.error);
      }
    } catch (err) {
      console.warn('[SQL Generator] Gemini call failed or returned error, switching to schema-grounded query planner:', err);
    }
  }

  // Schema-grounded deterministic query planner fallback
  const fallbackSql = buildDeterministicSql(userQuery);
  const validation = validateAndSanitizeSql(fallbackSql);

  return {
    sql: validation.sanitizedSql,
    explanation: 'PostgreSQL query formulated based on database schema entities and intent analysis.',
    source: 'fallback_planner',
    validation
  };
}

function buildDeterministicSql(query: string): string {
  const q = query.toLowerCase();

  // Pattern: "Compare Delhi and Mumbai sales"
  if (q.includes('delhi') && q.includes('mumbai')) {
    if (q.includes('declining') || q.includes('product')) {
      return `
        SELECT 
          p.name AS product_name,
          p.category,
          c.city,
          TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM') AS month,
          ROUND(SUM(s.revenue), 2) AS monthly_revenue,
          SUM(s.quantity) AS units_sold
        FROM sales s
        JOIN products p ON p.id = s.product_id
        JOIN customers c ON c.id = s.customer_id
        WHERE c.city IN ('Delhi', 'Mumbai')
        GROUP BY p.name, p.category, c.city, DATE_TRUNC('month', s.sale_date)
        ORDER BY month ASC, c.city ASC
        LIMIT 1000;
      `.trim();
    }
    return `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM') AS month,
        c.city,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        SUM(s.quantity) AS total_units
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      WHERE c.city IN ('Delhi', 'Mumbai')
      GROUP BY DATE_TRUNC('month', s.sale_date), c.city
      ORDER BY month ASC, c.city ASC
      LIMIT 500;
    `.trim();
  }

  // Pattern: "Why did sales decline in Delhi in Q3?"
  if (q.includes('delhi') && (q.includes('q3') || q.includes('decline'))) {
    return `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM') AS month,
        p.category,
        p.name AS product_name,
        ROUND(SUM(s.revenue), 2) AS revenue,
        SUM(s.quantity) AS quantity_sold,
        ROUND(AVG(s.discount_applied) * 100, 1) AS avg_discount_pct
      FROM sales s
      JOIN products p ON p.id = s.product_id
      JOIN customers c ON c.id = s.customer_id
      WHERE c.city = 'Delhi' AND s.sale_date >= '2025-01-01' AND s.sale_date <= '2025-12-31'
      GROUP BY DATE_TRUNC('month', s.sale_date), p.category, p.name
      ORDER BY month ASC, revenue DESC
      LIMIT 1000;
    `.trim();
  }

  // Pattern: "Which products are declining?" or "Find declining products"
  if (q.includes('declining') || q.includes('drop') || q.includes('decreas')) {
    return `
      WITH monthly_prod AS (
        SELECT 
          p.name AS product_name,
          p.category,
          EXTRACT(YEAR FROM s.sale_date) AS yr,
          ROUND(SUM(s.revenue), 2) AS annual_revenue,
          SUM(s.quantity) AS annual_units
        FROM sales s
        JOIN products p ON p.id = s.product_id
        GROUP BY p.name, p.category, EXTRACT(YEAR FROM s.sale_date)
      )
      SELECT 
        product_name,
        category,
        yr,
        annual_revenue,
        annual_units
      FROM monthly_prod
      ORDER BY product_name ASC, yr ASC
      LIMIT 100;
    `.trim();
  }

  // Pattern: "Top 10 products by revenue" / "Top products"
  if (q.includes('top') && (q.includes('product') || q.includes('revenue') || q.includes('sales'))) {
    const limitMatch = q.match(/top\s+(\d+)/);
    const limit = limitMatch ? limitMatch[1] : '10';
    return `
      SELECT 
        p.name AS product_name,
        p.category,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        SUM(s.quantity) AS total_units_sold,
        ROUND((SUM(s.profit) / NULLIF(SUM(s.revenue), 0)) * 100, 2) AS margin_percentage
      FROM sales s
      JOIN products p ON p.id = s.product_id
      GROUP BY p.id, p.name, p.category
      ORDER BY total_revenue DESC
      LIMIT ${limit};
    `.trim();
  }

  // Pattern: "Monthly revenue trends" / "Show monthly revenue"
  if (q.includes('month') || q.includes('trend') || q.includes('time')) {
    return `
      SELECT 
        TO_CHAR(DATE_TRUNC('month', s.sale_date), 'YYYY-MM') AS month,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        SUM(s.quantity) AS units_sold,
        COUNT(s.id) AS transaction_count
      FROM sales s
      GROUP BY DATE_TRUNC('month', s.sale_date)
      ORDER BY month ASC
      LIMIT 50;
    `.trim();
  }

  // Pattern: "Which region has the highest profit?" / "Region" / "City"
  if (q.includes('region') || q.includes('city') || q.includes('highest profit') || q.includes('location')) {
    return `
      SELECT 
        c.city,
        c.region,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        SUM(s.quantity) AS units_sold,
        ROUND((SUM(s.profit) / NULLIF(SUM(s.revenue), 0)) * 100, 2) AS profit_margin_pct
      FROM sales s
      JOIN customers c ON c.id = s.customer_id
      GROUP BY c.city, c.region
      ORDER BY total_profit DESC
      LIMIT 20;
    `.trim();
  }

  // Pattern: "Category performance"
  if (q.includes('category') || q.includes('categories')) {
    return `
      SELECT 
        p.category,
        ROUND(SUM(s.revenue), 2) AS total_revenue,
        ROUND(SUM(s.profit), 2) AS total_profit,
        SUM(s.quantity) AS total_units,
        COUNT(DISTINCT s.customer_id) AS unique_customers
      FROM sales s
      JOIN products p ON p.id = s.product_id
      GROUP BY p.category
      ORDER BY total_revenue DESC
      LIMIT 20;
    `.trim();
  }

  // Default: Overview of top products and sales summary
  return `
    SELECT 
      p.name AS product_name,
      p.category,
      ROUND(SUM(s.revenue), 2) AS total_revenue,
      ROUND(SUM(s.profit), 2) AS total_profit,
      SUM(s.quantity) AS total_quantity
    FROM sales s
    JOIN products p ON p.id = s.product_id
    GROUP BY p.id, p.name, p.category
    ORDER BY total_revenue DESC
    LIMIT 10;
  `.trim();
}
