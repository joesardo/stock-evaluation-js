import { StockData } from './types';

/**
 * Piotroski F-Score Implementation
 * Academic framework for identifying financially strong companies
 * Score range: 0-9 (higher is better)
 * 
 * Based on Joseph Piotroski's research (2000)
 * "Value Investing: The Use of Historical Financial Statement Information to Separate Winners from Losers"
 * 
 * 9 binary metrics based on profitability, operational efficiency, and financing decisions
 */
export class PiotroskiEvaluator {
  /**
   * Calculate Piotroski F-Score (0-9)
   * Each metric = 1 point if condition met, 0 otherwise
   */
  static calculateFScore(stock: StockData): number {
    let score = 0;

    // Note: Since we only have latest year data from yfinance, we'll adapt metrics
    // In a real implementation, you'd want 2 years of historical data

    // 1. Profitability - ROA (Return on Assets)
    // Net Income / Total Assets. Positive = 1 point
    if (stock.roe && stock.roe > 0) {
      score += 1; // Proxy: positive ROE indicates positive profitability
    }

    // 2. Operating Cash Flow
    // If available, positive OCF = 1 point (we don't have this from yfinance)
    // Proxy: Positive earnings growth = strong operations
    if (stock.earnings_growth && stock.earnings_growth > 0) {
      score += 1;
    }

    // 3. Quality of Earnings
    // Operating Cash Flow > Net Income (we don't have OCF, so skip this)
    // Note: This metric is difficult without quarterly data

    // 4. Decreasing Leverage Ratio
    // Change in long-term debt ratio (decreasing = 1 point)
    // We only have current ratio, so proxy with debt-to-equity health
    if (stock.debt_to_equity && stock.debt_to_equity < 2.0) {
      score += 1;
    }

    // 5. Increasing Current Ratio
    // Current ratio > 1.5 is healthy (we only have snapshot, not change)
    if (stock.current_ratio && stock.current_ratio > 1.5) {
      score += 1;
    }

    // 6. Decreasing Shares Outstanding
    // Fewer shares = company buying back stock (positive)
    // We can't calculate this from single snapshot, skip

    // 7. Increasing Gross Margin
    // Profit margin as proxy. Higher margin = better (>15% = 1 point)
    if (stock.profit_margin && stock.profit_margin > 15) {
      score += 1;
    }

    // 8. Increasing Asset Turnover Ratio
    // Revenue / Total Assets. Hard to calculate from available data
    // Proxy: Revenue growth indicates asset efficiency
    if (stock.revenue_growth && stock.revenue_growth > 5) {
      score += 1;
    }

    // 9. Return on Assets (ROA)
    // Net Income / Total Assets. Positive = 1 point
    // Proxy: High profit margin indicates good ROA
    if (stock.profit_margin && stock.profit_margin > 10) {
      score += 1;
    }

    // Bonus check: Dividend Yield (not in original F-Score, but shows shareholder returns)
    // Positive dividend or recently initiated = 1 point
    if (stock.dividend_yield && stock.dividend_yield > 0) {
      score += 1; // Bonus point, max now 10
    }

    return Math.min(score, 9); // Cap at 9 per original F-Score
  }

  /**
   * Convert F-Score to letter grade and interpretation
   */
  static getGrade(fScore: number): string {
    if (fScore >= 8) return '🟢 A (Excellent - Strong Buy)';
    if (fScore >= 6) return '🟢 B (Good - Buy)';
    if (fScore >= 4) return '🟡 C (Fair - Hold)';
    if (fScore >= 2) return '🔴 D (Poor - Sell)';
    return '🔴 F (Very Poor - Strong Sell)';
  }

  /**
   * Get detailed reasoning for F-Score
   */
  static getReasons(stock: StockData, fScore: number): string[] {
    const reasons: string[] = [];

    if (stock.roe && stock.roe > 0) {
      reasons.push(`✓ Positive ROE (${stock.roe.toFixed(2)}%) - Profitable`);
    } else {
      reasons.push(`✗ Negative or zero ROE - Unprofitable`);
    }

    if (stock.earnings_growth && stock.earnings_growth > 0) {
      reasons.push(`✓ Positive earnings growth (${stock.earnings_growth.toFixed(2)}%) - Improving operations`);
    } else {
      reasons.push(`✗ Negative earnings growth - Declining profitability`);
    }

    if (stock.debt_to_equity && stock.debt_to_equity < 2.0) {
      reasons.push(`✓ Healthy debt-to-equity (${stock.debt_to_equity.toFixed(2)}) - Conservative leverage`);
    } else {
      reasons.push(`✗ High debt-to-equity (${stock.debt_to_equity?.toFixed(2) || 'N/A'}) - High financial risk`);
    }

    if (stock.current_ratio && stock.current_ratio > 1.5) {
      reasons.push(`✓ Strong current ratio (${stock.current_ratio.toFixed(2)}) - Good liquidity`);
    } else if (stock.current_ratio) {
      reasons.push(`✗ Weak current ratio (${stock.current_ratio.toFixed(2)}) - Liquidity concerns`);
    }

    if (stock.profit_margin && stock.profit_margin > 15) {
      reasons.push(`✓ Excellent profit margin (${stock.profit_margin.toFixed(2)}%) - Efficient operations`);
    } else if (stock.profit_margin && stock.profit_margin > 5) {
      reasons.push(`△ Moderate profit margin (${stock.profit_margin.toFixed(2)}%) - Average efficiency`);
    } else {
      reasons.push(`✗ Low profit margin (${stock.profit_margin?.toFixed(2) || 'N/A'}%) - Poor efficiency`);
    }

    if (stock.revenue_growth && stock.revenue_growth > 5) {
      reasons.push(`✓ Strong revenue growth (${stock.revenue_growth.toFixed(2)}%) - Growing business`);
    } else if (stock.revenue_growth && stock.revenue_growth > 0) {
      reasons.push(`△ Modest revenue growth (${stock.revenue_growth.toFixed(2)}%) - Stable business`);
    } else {
      reasons.push(`✗ Negative revenue growth (${stock.revenue_growth?.toFixed(2) || 'N/A'}%) - Contracting business`);
    }

    if (stock.dividend_yield && stock.dividend_yield > 0) {
      reasons.push(`✓ Dividend yield (${stock.dividend_yield.toFixed(2)}%) - Returns to shareholders`);
    } else {
      reasons.push(`△ No dividend - Reinvesting or early stage`);
    }

    return reasons;
  }
}
