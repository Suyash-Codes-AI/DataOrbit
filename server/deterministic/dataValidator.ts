export interface ValidationIssue {
  type: 'missing_value' | 'duplicate_row' | 'invalid_date' | 'outlier' | 'impossible_value' | 'type_mismatch';
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
  quality_score: number; // 0 to 100
  issues: ValidationIssue[];
  column_stats: Record<string, {
    null_count: number;
    distinct_count: number;
    sample_type: string;
  }>;
}

export function validateDataset(
  rows: Record<string, any>[],
  columnNames?: string[]
): ValidationReport {
  if (!rows || rows.length === 0) {
    return {
      rows: 0,
      columns: columnNames || [],
      missing_values: 0,
      duplicate_rows: 0,
      invalid_dates: 0,
      outlier_columns: [],
      impossible_values: 0,
      quality_score: 100,
      issues: [],
      column_stats: {}
    };
  }

  const columns = columnNames && columnNames.length > 0
    ? columnNames
    : Object.keys(rows[0] || {});

  const totalRows = rows.length;
  let missingValuesCount = 0;
  let invalidDatesCount = 0;
  let impossibleValuesCount = 0;
  const issues: ValidationIssue[] = [];
  const columnStats: Record<string, { null_count: number; distinct_count: number; sample_type: string }> = {};

  // 1. Column analysis and null check
  for (const col of columns) {
    let nullCount = 0;
    const distinctSet = new Set<string>();
    let detectedType = 'unknown';

    for (let r = 0; r < totalRows; r++) {
      const val = rows[r][col];
      if (val === null || val === undefined || val === '') {
        nullCount++;
      } else {
        distinctSet.add(String(val));
        if (detectedType === 'unknown') {
          if (typeof val === 'number') detectedType = 'number';
          else if (typeof val === 'boolean') detectedType = 'boolean';
          else if (typeof val === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(val)) detectedType = 'date';
            else if (!isNaN(Number(val)) && val.trim() !== '') detectedType = 'numeric_string';
            else detectedType = 'string';
          }
        }
      }
    }

    columnStats[col] = {
      null_count: nullCount,
      distinct_count: distinctSet.size,
      sample_type: detectedType
    };

    if (nullCount > 0) {
      missingValuesCount += nullCount;
      const pct = Math.round((nullCount / totalRows) * 100);
      issues.push({
        type: 'missing_value',
        column: col,
        count: nullCount,
        description: `Column '${col}' has ${nullCount} missing/null values (${pct}% of records)`,
        severity: pct > 10 ? 'high' : 'medium'
      });
    }
  }

  // 2. Duplicate rows detection
  const rowHashTracker = new Set<string>();
  let duplicateRowsCount = 0;
  for (let r = 0; r < totalRows; r++) {
    // Generate a simple fingerprint from all columns
    const fingerprint = columns.map(c => String(rows[r][c])).join('|||');
    if (rowHashTracker.has(fingerprint)) {
      duplicateRowsCount++;
    } else {
      rowHashTracker.add(fingerprint);
    }
  }

  if (duplicateRowsCount > 0) {
    issues.push({
      type: 'duplicate_row',
      count: duplicateRowsCount,
      description: `Detected ${duplicateRowsCount} duplicate rows in result set`,
      severity: duplicateRowsCount > 10 ? 'medium' : 'low'
    });
  }

  // 3. Date validation & Impossible values (e.g. negative revenue/quantity)
  const dateColumns = columns.filter(c => /date|time|created/i.test(c));
  for (const dateCol of dateColumns) {
    let colInvalidDates = 0;
    for (let r = 0; r < totalRows; r++) {
      const val = rows[r][dateCol];
      if (val) {
        const d = new Date(val);
        if (isNaN(d.getTime())) {
          colInvalidDates++;
        }
      }
    }
    if (colInvalidDates > 0) {
      invalidDatesCount += colInvalidDates;
      issues.push({
        type: 'invalid_date',
        column: dateCol,
        count: colInvalidDates,
        description: `Found ${colInvalidDates} unparseable date values in column '${dateCol}'`,
        severity: 'high'
      });
    }
  }

  // Check impossible values in revenue / price / quantity
  const nonNegativeCols = columns.filter(c => /revenue|quantity|price|cost|sales/i.test(c));
  for (const numCol of nonNegativeCols) {
    let negativeCount = 0;
    for (let r = 0; r < totalRows; r++) {
      const raw = rows[r][numCol];
      const num = Number(raw);
      if (!isNaN(num) && num < 0) {
        negativeCount++;
      }
    }
    if (negativeCount > 0) {
      impossibleValuesCount += negativeCount;
      issues.push({
        type: 'impossible_value',
        column: numCol,
        count: negativeCount,
        description: `Found ${negativeCount} negative values in column '${numCol}', which typically requires non-negative entries`,
        severity: 'medium'
      });
    }
  }

  // 4. Outlier detection using IQR on numeric columns
  const outlierColumns: string[] = [];
  const numericColumns = columns.filter(c => {
    const st = columnStats[c]?.sample_type;
    return st === 'number' || st === 'numeric_string';
  });

  for (const numCol of numericColumns) {
    const values: number[] = [];
    for (let r = 0; r < totalRows; r++) {
      const num = Number(rows[r][numCol]);
      if (!isNaN(num)) values.push(num);
    }

    if (values.length >= 10) {
      values.sort((a, b) => a - b);
      const q1Index = Math.floor(values.length * 0.25);
      const q3Index = Math.floor(values.length * 0.75);
      const q1 = values[q1Index];
      const q3 = values[q3Index];
      const iqr = q3 - q1;
      const lowerFence = q1 - 2.5 * iqr;
      const upperFence = q3 + 2.5 * iqr;

      const outlierCount = values.filter(v => v < lowerFence || v > upperFence).length;
      if (outlierCount > 0 && (outlierCount / values.length) < 0.05) {
        // Less than 5% are extreme values, indicating true anomalies
        outlierColumns.push(numCol);
        issues.push({
          type: 'outlier',
          column: numCol,
          count: outlierCount,
          description: `Identified ${outlierCount} extreme statistical outliers in '${numCol}' outside the 2.5×IQR boundary`,
          severity: 'low'
        });
      }
    }
  }

  // 5. Quality Score Calculation (Deterministic, 0-100)
  // Deductions:
  // Missing values: up to -15 pts
  // Duplicates: up to -10 pts
  // Invalid dates: up to -20 pts
  // Impossible values: up to -15 pts
  // Outliers: up to -5 pts
  let score = 100;
  
  const totalCells = totalRows * Math.max(columns.length, 1);
  const missingRatio = missingValuesCount / Math.max(totalCells, 1);
  score -= Math.min(20, Math.round(missingRatio * 100 * 2));

  const duplicateRatio = duplicateRowsCount / Math.max(totalRows, 1);
  score -= Math.min(15, Math.round(duplicateRatio * 100 * 1.5));

  if (invalidDatesCount > 0) {
    score -= Math.min(25, invalidDatesCount * 5);
  }

  if (impossibleValuesCount > 0) {
    score -= Math.min(20, impossibleValuesCount * 3);
  }

  if (outlierColumns.length > 0) {
    score -= Math.min(5, outlierColumns.length * 2);
  }

  score = Math.max(10, Math.min(100, score));

  return {
    rows: totalRows,
    columns,
    missing_values: missingValuesCount,
    duplicate_rows: duplicateRowsCount,
    invalid_dates: invalidDatesCount,
    outlier_columns: outlierColumns,
    impossible_values: impossibleValuesCount,
    quality_score: score,
    issues,
    column_stats: columnStats
  };
}
