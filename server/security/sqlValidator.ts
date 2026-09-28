export interface SqlValidationResult {
  isValid: boolean;
  sanitizedSql: string;
  error?: string;
  tablesUsed: string[];
}

const FORBIDDEN_KEYWORDS = [
  'INSERT',
  'UPDATE',
  'DELETE',
  'DROP',
  'ALTER',
  'CREATE',
  'TRUNCATE',
  'GRANT',
  'REVOKE',
  'EXECUTE',
  'EXEC',
  'COPY',
  'VACUUM',
  'COMMENT',
  'LOCK',
  'REINDEX',
  'REFRESH',
  'CALL',
  'DO',
  'MERGE',
  'INTO OUTFILE',
  'PG_SLEEP',
  'SHUTDOWN'
];

const KNOWN_TABLES = ['sales', 'products', 'customers'];

export function validateAndSanitizeSql(
  rawSql: string,
  maxRowLimit: number = 10000
): SqlValidationResult {
  if (!rawSql || typeof rawSql !== 'string') {
    return {
      isValid: false,
      sanitizedSql: '',
      error: 'Empty SQL query provided.',
      tablesUsed: []
    };
  }

  // Clean comments and markdown wrappers (```sql ... ```)
  let sql = rawSql.trim();
  if (sql.startsWith('```')) {
    sql = sql.replace(/^```(?:sql)?/i, '').replace(/```$/, '').trim();
  }

  // Remove single line and multi-line comments
  sql = sql.replace(/--.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '').trim();

  if (!sql) {
    return {
      isValid: false,
      sanitizedSql: '',
      error: 'Query became empty after removing comments.',
      tablesUsed: []
    };
  }

  // Check for multiple semicolon-separated statements (e.g. "SELECT 1; DROP TABLE sales;")
  // Strip trailing semicolon first
  const normalizedSemicolon = sql.replace(/;\s*$/, '');
  if (normalizedSemicolon.includes(';')) {
    return {
      isValid: false,
      sanitizedSql: '',
      error: 'SQL Security Violation: Multiple SQL statements are strictly forbidden.',
      tablesUsed: []
    };
  }

  // Clean uppercase for token check
  const upperSql = sql.toUpperCase();

  // Must begin with SELECT or WITH
  const startsWithRead = /^\s*(SELECT|WITH)\b/i.test(sql);
  if (!startsWithRead) {
    return {
      isValid: false,
      sanitizedSql: '',
      error: 'SQL Security Violation: Only read-only SELECT or WITH statements are allowed.',
      tablesUsed: []
    };
  }

  // Check for any forbidden destructive keywords
  for (const keyword of FORBIDDEN_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    if (regex.test(upperSql)) {
      // Allow WITH ... SELECT, but forbid CREATE, DROP, DELETE, etc.
      return {
        isValid: false,
        sanitizedSql: '',
        error: `SQL Security Violation: Forbidden keyword detected: '${keyword}'. Write and administrative operations are strictly blocked.`,
        tablesUsed: []
      };
    }
  }

  // Detect tables referenced
  const tablesUsed: string[] = [];
  for (const table of KNOWN_TABLES) {
    const tableRegex = new RegExp(`\\b${table}\\b`, 'i');
    if (tableRegex.test(upperSql)) {
      tablesUsed.push(table);
    }
  }

  // Row limit enforcement
  // Check if LIMIT exists in outer query
  const limitMatch = upperSql.match(/\bLIMIT\s+(\d+)/i);
  let finalSql = sql;
  if (limitMatch) {
    const existingLimit = parseInt(limitMatch[1], 10);
    if (existingLimit > maxRowLimit) {
      // Cap at maxRowLimit
      finalSql = finalSql.replace(/\bLIMIT\s+\d+/i, `LIMIT ${maxRowLimit}`);
    }
  } else {
    // If no limit is specified, append a safe row limit (e.g. 500 default, max 10000)
    finalSql = `${finalSql.trim()} LIMIT 500`;
  }

  return {
    isValid: true,
    sanitizedSql: finalSql,
    tablesUsed
  };
}
