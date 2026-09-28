export interface GrowthResult {
  entity: string;
  previousValue: number;
  currentValue: number;
  absoluteChange: number;
  growthPercentage: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  isDeclining: boolean;
}

export interface AnomalyResult {
  identifier: string;
  metric: string;
  value: number;
  expectedValue: number;
  deviation: number;
  zScore: number;
  severity: 'low' | 'moderate' | 'critical';
  description: string;
}

export interface GroupComparisonResult {
  groupName: string;
  count: number;
  sum: number;
  mean: number;
  min: number;
  max: number;
  shareOfTotalPercentage: number;
}

export interface StatisticsResult {
  metric: string;
  count: number;
  sum: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
}

export interface ForecastPoint {
  period: string;
  projectedValue: number;
  lowerConfidence: number;
  upperConfidence: number;
}

export interface TrendAnalysisResult {
  overallDirection: 'upward' | 'downward' | 'flat' | 'volatile';
  growthRatePct: number;
  highestPeriod: { period: string; value: number } | null;
  lowestPeriod: { period: string; value: number } | null;
  fastestGrowing: GrowthResult[];
  fastestDeclining: GrowthResult[];
  anomaliesDetected: AnomalyResult[];
}

export class AnalysisEngine {
  /**
   * Calculates period-over-period or entity growth rates deterministically
   */
  static calculateGrowth(
    items: { entity: string; previous: number; current: number }[]
  ): GrowthResult[] {
    return items.map(item => {
      const prev = Number(item.previous) || 0;
      const curr = Number(item.current) || 0;
      const absChange = curr - prev;
      let pct = 0;
      if (prev !== 0) {
        pct = Math.round(((curr - prev) / Math.abs(prev)) * 1000) / 10;
      } else if (curr > 0) {
        pct = 100.0;
      }

      let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
      if (pct > 2.0) trend = 'increasing';
      else if (pct < -2.0) trend = 'decreasing';

      return {
        entity: item.entity,
        previousValue: Math.round(prev * 100) / 100,
        currentValue: Math.round(curr * 100) / 100,
        absoluteChange: Math.round(absChange * 100) / 100,
        growthPercentage: pct,
        trend,
        isDeclining: pct < -5.0
      };
    }).sort((a, b) => a.growthPercentage - b.growthPercentage);
  }

  /**
   * Deterministic Anomaly Detection using Z-Score & Moving Standard Deviation
   */
  static detectAnomalies(
    data: { label: string; value: number }[],
    metricName: string = 'value',
    zThreshold: number = 2.0
  ): AnomalyResult[] {
    if (!data || data.length < 4) return [];

    const values = data.map(d => Number(d.value)).filter(v => !isNaN(v));
    const mean = values.reduce((acc, v) => acc + v, 0) / values.length;
    const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    if (stdDev === 0) return [];

    const anomalies: AnomalyResult[] = [];
    for (const d of data) {
      const val = Number(d.value);
      if (isNaN(val)) continue;

      const zScore = Math.round(((val - mean) / stdDev) * 100) / 100;
      if (Math.abs(zScore) >= zThreshold) {
        const devPct = Math.round(((val - mean) / mean) * 1000) / 10;
        let severity: 'low' | 'moderate' | 'critical' = 'moderate';
        if (Math.abs(zScore) >= 3.0) severity = 'critical';
        else if (Math.abs(zScore) <= 2.2) severity = 'low';

        anomalies.push({
          identifier: d.label,
          metric: metricName,
          value: Math.round(val * 100) / 100,
          expectedValue: Math.round(mean * 100) / 100,
          deviation: devPct,
          zScore,
          severity,
          description: `${d.label} exhibited an unusual ${metricName} of ${val.toLocaleString()} (${devPct > 0 ? '+' : ''}${devPct}% vs expected mean of ${Math.round(mean).toLocaleString()}; Z-score: ${zScore}).`
        });
      }
    }

    return anomalies.sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore));
  }

  /**
   * Calculate summary statistics for any numeric series
   */
  static calculateStatistics(values: number[], metricName: string = 'Metric'): StatisticsResult {
    const valid = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b);
    if (valid.length === 0) {
      return {
        metric: metricName,
        count: 0,
        sum: 0,
        mean: 0,
        median: 0,
        min: 0,
        max: 0,
        stdDev: 0
      };
    }

    const sum = valid.reduce((a, b) => a + b, 0);
    const mean = sum / valid.length;
    const mid = Math.floor(valid.length / 2);
    const median = valid.length % 2 !== 0 ? valid[mid] : (valid[mid - 1] + valid[mid]) / 2;
    const min = valid[0];
    const max = valid[valid.length - 1];
    const variance = valid.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / valid.length;
    const stdDev = Math.sqrt(variance);

    return {
      metric: metricName,
      count: valid.length,
      sum: Math.round(sum * 100) / 100,
      mean: Math.round(mean * 100) / 100,
      median: Math.round(median * 100) / 100,
      min: Math.round(min * 100) / 100,
      max: Math.round(max * 100) / 100,
      stdDev: Math.round(stdDev * 100) / 100
    };
  }

  /**
   * Compare categories or regions
   */
  static compareGroups(
    data: { group: string; value: number }[]
  ): GroupComparisonResult[] {
    const groupMap: Record<string, number[]> = {};
    for (const d of data) {
      if (!groupMap[d.group]) groupMap[d.group] = [];
      groupMap[d.group].push(d.value);
    }

    const totalSum = data.reduce((acc, d) => acc + (d.value || 0), 0);

    const results: GroupComparisonResult[] = [];
    for (const [grp, vals] of Object.entries(groupMap)) {
      const stats = this.calculateStatistics(vals);
      const share = totalSum > 0 ? Math.round((stats.sum / totalSum) * 1000) / 10 : 0;
      results.push({
        groupName: grp,
        count: stats.count,
        sum: stats.sum,
        mean: stats.mean,
        min: stats.min,
        max: stats.max,
        shareOfTotalPercentage: share
      });
    }

    return results.sort((a, b) => b.sum - a.sum);
  }

  /**
   * Deterministic Linear Regression Trend & Forecast
   */
  static forecastSales(
    timeSeries: { period: string; value: number }[],
    periodsAhead: number = 3
  ): ForecastPoint[] {
    if (!timeSeries || timeSeries.length < 3) return [];

    const n = timeSeries.length;
    let sumX = 0;
    let sumY = 0;
    let sumXY = 0;
    let sumXX = 0;

    for (let i = 0; i < n; i++) {
      const y = timeSeries[i].value;
      sumX += i;
      sumY += y;
      sumXY += i * y;
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / Math.max(1, (n * sumXX - sumX * sumX));
    const intercept = (sumY - slope * sumX) / n;

    // Estimate standard error of residuals
    let sumResidualSq = 0;
    for (let i = 0; i < n; i++) {
      const fitted = intercept + slope * i;
      sumResidualSq += Math.pow(timeSeries[i].value - fitted, 2);
    }
    const residualStd = Math.sqrt(sumResidualSq / Math.max(1, n - 2));

    const forecasts: ForecastPoint[] = [];
    for (let step = 1; step <= periodsAhead; step++) {
      const futureIndex = n - 1 + step;
      const proj = Math.max(0, intercept + slope * futureIndex);
      const margin = 1.96 * residualStd * Math.sqrt(1 + 1 / n);

      forecasts.push({
        period: `+${step}M Ahead`,
        projectedValue: Math.round(proj * 100) / 100,
        lowerConfidence: Math.round(Math.max(0, proj - margin) * 100) / 100,
        upperConfidence: Math.round((proj + margin) * 100) / 100
      });
    }

    return forecasts;
  }

  /**
   * Run comprehensive trend analysis across dataset rows
   */
  static analyzeTrends(rows: Record<string, any>[]): TrendAnalysisResult {
    if (!rows || rows.length === 0) {
      return {
        overallDirection: 'flat',
        growthRatePct: 0,
        highestPeriod: null,
        lowestPeriod: null,
        fastestGrowing: [],
        fastestDeclining: [],
        anomaliesDetected: []
      };
    }

    // Try finding date and numeric value columns
    const cols = Object.keys(rows[0]);
    const dateCol = cols.find(c => /date|month|year|period|quarter|quarter_name/i.test(c));
    const numCol = cols.find(c => /revenue|sales|total|profit|amount|quantity/i.test(c) && typeof rows[0][c] !== 'string');
    const entityCol = cols.find(c => /name|product|customer|city|region|category/i.test(c));

    let anomalies: AnomalyResult[] = [];
    if (numCol) {
      const labelCol = dateCol || entityCol || cols[0];
      const pairs = rows.map(r => ({
        label: String(r[labelCol] || 'Row'),
        value: Number(r[numCol]) || 0
      }));
      anomalies = this.detectAnomalies(pairs, numCol);
    }

    let highestPeriod: { period: string; value: number } | null = null;
    let lowestPeriod: { period: string; value: number } | null = null;
    let overallDirection: 'upward' | 'downward' | 'flat' | 'volatile' = 'flat';
    let growthRatePct = 0;

    if (dateCol && numCol && rows.length >= 2) {
      const sortedByDate = [...rows].sort((a, b) => String(a[dateCol]).localeCompare(String(b[dateCol])));
      const firstVal = Number(sortedByDate[0][numCol]) || 1;
      const lastVal = Number(sortedByDate[sortedByDate.length - 1][numCol]) || 1;
      growthRatePct = Math.round(((lastVal - firstVal) / Math.abs(firstVal)) * 1000) / 10;

      if (growthRatePct > 5) overallDirection = 'upward';
      else if (growthRatePct < -5) overallDirection = 'downward';
      else overallDirection = 'flat';

      let maxVal = -Infinity;
      let minVal = Infinity;
      for (const r of rows) {
        const val = Number(r[numCol]) || 0;
        const p = String(r[dateCol]);
        if (val > maxVal) {
          maxVal = val;
          highestPeriod = { period: p, value: val };
        }
        if (val < minVal) {
          minVal = val;
          lowestPeriod = { period: p, value: val };
        }
      }
    }

    return {
      overallDirection,
      growthRatePct,
      highestPeriod,
      lowestPeriod,
      fastestGrowing: [],
      fastestDeclining: [],
      anomaliesDetected: anomalies
    };
  }
}
