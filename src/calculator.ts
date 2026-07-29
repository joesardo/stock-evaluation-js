import { EvaluationCriteria, MetricScore, StockData } from './types';

export class Calculator {
  /**
   * Score a single metric value against evaluation thresholds
   * Returns a score from 0 to 5 with smooth interpolation
   * Handles extreme values gracefully with logarithmic scaling
   */
  static scoreMetric(
    value: number | null,
    thresholds: { excellent: number; good: number; fair: number; poor: number },
    inverseScore: boolean = false
  ): number {
    if (value === null || isNaN(value)) {
      return 0;
    }

    if (inverseScore) {
      // For metrics where lower is better (P/E, P/B, D/E, etc.)
      if (value <= thresholds.excellent) return 5;
      if (value <= thresholds.good) {
        // Smooth interpolation between good and excellent
        return 4 + ((thresholds.good - value) / (thresholds.good - thresholds.excellent));
      }
      if (value <= thresholds.fair) {
        // Smooth interpolation between fair and good
        return 2 + ((thresholds.fair - value) / (thresholds.fair - thresholds.good)) * 2;
      }
      if (value <= thresholds.poor) {
        // Smooth interpolation between poor and fair
        return 0.5 + ((thresholds.poor - value) / (thresholds.poor - thresholds.fair)) * 1.5;
      }
      // Beyond poor - use logarithmic decay to avoid hard 0
      const excess = value / thresholds.poor;
      return Math.max(0, 0.5 / Math.log10(excess + 2));
    } else {
      // For metrics where higher is better (ROE, dividend yield, current ratio, etc.)
      if (value >= thresholds.excellent) {
        // For values well above excellent, use logarithmic scaling
        const ratio = value / thresholds.excellent;
        return Math.min(5, 5 + Math.log10(ratio) * 0.5);
      }
      if (value >= thresholds.good) {
        // Smooth interpolation between good and excellent
        return 4 + ((value - thresholds.good) / (thresholds.excellent - thresholds.good));
      }
      if (value >= thresholds.fair) {
        // Smooth interpolation between fair and good
        return 2 + ((value - thresholds.fair) / (thresholds.good - thresholds.fair)) * 2;
      }
      // Below fair threshold, score decreases gradually
      return Math.max(0, 2 * (value / thresholds.fair));
    }
  }

  /**
   * Calculate weighted score from metric scores
   */
  static calculateWeightedScore(metrics: MetricScore[]): number {
    if (metrics.length === 0) return 0;

    const totalWeight = metrics.reduce((sum, m) => sum + m.weight, 0);
    const weightedSum = metrics.reduce((sum, m) => sum + (m.score * m.weight), 0);

    // Normalize to 0-100 scale (score is 0-5)
    return (weightedSum / totalWeight) * 20;
  }

  /**
   * Get recommendation based on overall score
   */
  static getRecommendation(score: number): 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL' {
    if (score >= 80) return 'STRONG_BUY';
    if (score >= 60) return 'BUY';
    if (score >= 40) return 'HOLD';
    if (score >= 20) return 'SELL';
    return 'STRONG_SELL';
  }

  /**
   * Calculate growth rate year-over-year
   */
  static calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0;
    return ((current - previous) / Math.abs(previous)) * 100;
  }

  /**
   * Evaluate missing data impact
   */
  static calculateConfidence(stock: StockData): number {
    const dataPoints = [
      stock.pe_ratio !== null,
      stock.pb_ratio !== null,
      stock.debt_to_equity !== null,
      stock.current_ratio !== null,
      stock.earnings_per_share !== null,
      stock.book_value_per_share !== null,
      stock.market_cap !== null
    ];

    const availableDataPoints = dataPoints.filter(x => x).length;
    return (availableDataPoints / dataPoints.length) * 100;
  }

  /**
   * Generate reasoning based on metric scores
   */
  static generateReasons(metrics: MetricScore[], stock: StockData): string[] {
    const reasons: string[] = [];

    // Sort by weighted contribution to find most impactful
    const sortedMetrics = [...metrics].sort((a, b) => (b.max_score) - (a.max_score));

    // Add positive reasons
    sortedMetrics.forEach(m => {
      if (m.score >= 4) {
        reasons.push(`✓ ${m.description}: ${m.value.toFixed(2)} is excellent`);
      }
    });

    // Add concerns
    sortedMetrics.forEach(m => {
      if (m.score <= 2) {
        reasons.push(`✗ ${m.description}: ${m.value.toFixed(2)} is concerning`);
      }
    });

    // Add price context
    if (stock.fifty_two_week_high && stock.fifty_two_week_low) {
      const percentFromHigh = ((stock.price - stock.fifty_two_week_high) / stock.fifty_two_week_high) * 100;
      const percentFromLow = ((stock.price - stock.fifty_two_week_low) / stock.fifty_two_week_low) * 100;

      if (percentFromHigh > -5) {
        reasons.push(`⚠ Trading near 52-week high (${percentFromHigh.toFixed(1)}% off)`);
      } else if (percentFromLow < 15) {
        reasons.push(`✓ Trading near 52-week low - potential opportunity`);
      }
    }

    return reasons;
  }
}
