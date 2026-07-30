import { StockData } from './types';

/**
 * Value Evaluator - Scores stocks based on valuation metrics
 * Identifies stocks trading below fair value or offering good income
 */
export class ValueEvaluator {
  /**
   * Calculate Value Score (0-100)
   * Combines P/E, PEG, Price Position, P/B, and Dividend Yield
   * Higher score = Better value
   */
  static calculateValueScore(stock: StockData): number {
    const scores: { [key: string]: number } = {};
    const weights: { [key: string]: number } = {
      pe_value: 0.25,      // Price-to-Earnings value
      peg_value: 0.20,     // PEG ratio value (P/E relative to growth)
      price_position: 0.25, // 52-week position (low = better value)
      pb_value: 0.15,      // Price-to-Book value
      dividend_yield: 0.15  // Dividend yield (income)
    };

    // P/E Ratio Scoring (0-100)
    // Lower P/E = better value
    // Score: 0 if P/E > 50, 100 if P/E < 10
    if (stock.pe_ratio && stock.pe_ratio > 0) {
      if (stock.pe_ratio > 50) scores.pe_value = 0;
      else if (stock.pe_ratio < 10) scores.pe_value = 100;
      else {
        // Linear interpolation: higher P/E = lower score
        scores.pe_value = Math.max(0, 100 - (stock.pe_ratio / 50) * 100);
      }
    } else {
      scores.pe_value = 50; // Neutral if no P/E
    }

    // PEG Ratio Scoring (0-100)
    // Lower PEG = better value (fair price for growth)
    // PEG = P/E divided by growth rate
    // Score: 100 if PEG < 1.0, 0 if PEG > 3.0
    if (stock.earnings_growth && stock.earnings_growth > 0 && stock.pe_ratio && stock.pe_ratio > 0) {
      const pegRatio = stock.pe_ratio / stock.earnings_growth;
      if (pegRatio < 1.0) scores.peg_value = 100;
      else if (pegRatio > 3.0) scores.peg_value = 0;
      else {
        // Linear interpolation
        scores.peg_value = Math.max(0, 100 - ((pegRatio - 1) / 2) * 100);
      }
    } else {
      scores.peg_value = 50; // Neutral if can't calculate
    }

    // Price Position Scoring (0-100)
    // Position near 52-week low = better value opportunity
    // Invert the metric: higher position (near high) = lower value score
    // 0% (52-week low) = 100 score (great value)
    // 100% (52-week high) = 0 score (expensive)
    if (stock.price_position !== undefined && stock.price_position !== null) {
      scores.price_position = 100 - stock.price_position;
    } else {
      scores.price_position = 50;
    }

    // Price-to-Book Ratio Scoring (0-100)
    // Lower P/B = better value
    // Score: 100 if P/B < 1.0, 0 if P/B > 5.0
    if (stock.pb_ratio && stock.pb_ratio > 0) {
      if (stock.pb_ratio < 1.0) scores.pb_value = 100;
      else if (stock.pb_ratio > 5.0) scores.pb_value = 0;
      else {
        // Linear interpolation
        scores.pb_value = Math.max(0, 100 - ((stock.pb_ratio - 1) / 4) * 100);
      }
    } else {
      scores.pb_value = 50;
    }

    // Dividend Yield Scoring (0-100)
    // Higher yield = better for income investors
    // Score: 0 if no dividend, 100 if yield > 5%
    if (stock.dividend_yield && stock.dividend_yield > 0) {
      const yield_pct = stock.dividend_yield;
      if (yield_pct > 5) scores.dividend_yield = 100;
      else {
        // Linear: 0% yield = 0 score, 5% yield = 100 score
        scores.dividend_yield = Math.min(100, (yield_pct / 5) * 100);
      }
    } else {
      scores.dividend_yield = 0; // No dividend = 0 points
    }

    // Calculate weighted average
    let totalScore = 0;
    let totalWeight = 0;

    for (const [metric, weight] of Object.entries(weights)) {
      if (scores[metric] !== undefined) {
        totalScore += scores[metric] * weight;
        totalWeight += weight;
      }
    }

    const valueScore = totalWeight > 0 ? totalScore / totalWeight : 50;
    return Math.round(valueScore);
  }

  /**
   * Get value grade (A-F) based on value score
   */
  static getGrade(valueScore: number): string {
    if (valueScore >= 80) return '🟢 A (Excellent Value)';
    if (valueScore >= 70) return '🟢 B (Good Value)';
    if (valueScore >= 60) return '🟡 C (Fair Value)';
    if (valueScore >= 40) return '🟡 D (Expensive)';
    return '🔴 F (Very Expensive)';
  }

  /**
   * Get detailed reasoning for value metrics
   */
  static getReasons(stock: StockData): string[] {
    const reasons: string[] = [];

    // P/E Analysis
    if (stock.pe_ratio && stock.pe_ratio > 0) {
      if (stock.pe_ratio < 15) {
        reasons.push(`✓ Low P/E ratio (${stock.pe_ratio.toFixed(1)}) - Trading at discount`);
      } else if (stock.pe_ratio > 30) {
        reasons.push(`✗ High P/E ratio (${stock.pe_ratio.toFixed(1)}) - Expensive valuation`);
      } else {
        reasons.push(`△ Moderate P/E ratio (${stock.pe_ratio.toFixed(1)}) - Fair valuation`);
      }
    }

    // PEG Analysis
    if (stock.earnings_growth && stock.earnings_growth > 0 && stock.pe_ratio && stock.pe_ratio > 0) {
      const pegRatio = stock.pe_ratio / stock.earnings_growth;
      if (pegRatio < 1.5) {
        reasons.push(`✓ Attractive PEG ratio (${pegRatio.toFixed(2)}) - Reasonable for growth rate`);
      } else if (pegRatio > 2.5) {
        reasons.push(`✗ High PEG ratio (${pegRatio.toFixed(2)}) - Expensive relative to growth`);
      }
    }

    // Price Position Analysis
    if (stock.price_position !== undefined && stock.price_position !== null) {
      if (stock.price_position < 30) {
        reasons.push(`✓ Trading near 52-week low (${stock.price_position.toFixed(1)}%) - Good entry point`);
      } else if (stock.price_position > 80) {
        reasons.push(`✗ Trading near 52-week high (${stock.price_position.toFixed(1)}%) - Limited upside`);
      }
    }

    // P/B Analysis
    if (stock.pb_ratio && stock.pb_ratio > 0) {
      if (stock.pb_ratio < 1.5) {
        reasons.push(`✓ Low P/B ratio (${stock.pb_ratio.toFixed(1)}) - Trading below book value`);
      } else if (stock.pb_ratio > 3.0) {
        reasons.push(`✗ High P/B ratio (${stock.pb_ratio.toFixed(1)}) - Premium valuation`);
      }
    }

    // Dividend Yield Analysis
    if (stock.dividend_yield && stock.dividend_yield > 0) {
      if (stock.dividend_yield > 3) {
        reasons.push(`✓ Strong dividend yield (${stock.dividend_yield.toFixed(2)}%) - Good income`);
      } else {
        reasons.push(`△ Modest dividend yield (${stock.dividend_yield.toFixed(2)}%) - Some income`);
      }
    } else {
      reasons.push(`△ No dividend - Growth-focused company`);
    }

    return reasons.length > 0 ? reasons : ['△ Insufficient data for detailed valuation analysis'];
  }
}
