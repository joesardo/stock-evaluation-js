import { EvaluationCriteria, MetricScore, StockData, EvaluationResult } from './types';
import { Calculator } from './calculator';

export class Evaluator {
  private criteria: EvaluationCriteria;

  constructor(criteria: EvaluationCriteria) {
    this.criteria = criteria;
  }

  /**
   * Main evaluation method
   */
  evaluate(stock: StockData): EvaluationResult {
    const metrics: MetricScore[] = [];

    // Evaluate P/E Ratio
    if (stock.pe_ratio !== null) {
      const score = Calculator.scoreMetric(
        stock.pe_ratio,
        this.criteria.pe_ratio.thresholds,
        this.criteria.pe_ratio.inverseScore || false
      );
      metrics.push({
        name: 'P/E Ratio',
        description: this.criteria.pe_ratio.description,
        value: stock.pe_ratio,
        score,
        weight: this.criteria.pe_ratio.weight,
        max_score: score * this.criteria.pe_ratio.weight
      });
    }

    // Evaluate P/B Ratio
    if (stock.pb_ratio !== null) {
      const score = Calculator.scoreMetric(
        stock.pb_ratio,
        this.criteria.pb_ratio.thresholds,
        this.criteria.pb_ratio.inverseScore || false
      );
      metrics.push({
        name: 'P/B Ratio',
        description: this.criteria.pb_ratio.description,
        value: stock.pb_ratio,
        score,
        weight: this.criteria.pb_ratio.weight,
        max_score: score * this.criteria.pb_ratio.weight
      });
    }

    // Evaluate Dividend Yield
    if (this.criteria.dividend_yield) {
      const score = Calculator.scoreMetric(
        stock.dividend_yield,
        this.criteria.dividend_yield.thresholds,
        this.criteria.dividend_yield.inverseScore || false
      );
      metrics.push({
        name: 'Dividend Yield',
        description: this.criteria.dividend_yield.description,
        value: stock.dividend_yield,
        score,
        weight: this.criteria.dividend_yield.weight,
        max_score: score * this.criteria.dividend_yield.weight
      });
    }

    // Evaluate Debt-to-Equity Ratio
    if (stock.debt_to_equity !== null) {
      const score = Calculator.scoreMetric(
        stock.debt_to_equity,
        this.criteria.debt_to_equity.thresholds,
        this.criteria.debt_to_equity.inverseScore || false
      );
      metrics.push({
        name: 'Debt-to-Equity',
        description: this.criteria.debt_to_equity.description,
        value: stock.debt_to_equity,
        score,
        weight: this.criteria.debt_to_equity.weight,
        max_score: score * this.criteria.debt_to_equity.weight
      });
    }

    // Evaluate Current Ratio
    if (stock.current_ratio !== null) {
      const score = Calculator.scoreMetric(
        stock.current_ratio,
        this.criteria.current_ratio.thresholds,
        this.criteria.current_ratio.inverseScore || false
      );
      metrics.push({
        name: 'Current Ratio',
        description: this.criteria.current_ratio.description,
        value: stock.current_ratio,
        score,
        weight: this.criteria.current_ratio.weight,
        max_score: score * this.criteria.current_ratio.weight
      });
    }

    // Evaluate ROE
    if (this.criteria.roe) {
      const score = Calculator.scoreMetric(
        stock.roe,
        this.criteria.roe.thresholds,
        this.criteria.roe.inverseScore || false
      );
      metrics.push({
        name: 'ROE',
        description: this.criteria.roe.description,
        value: stock.roe,
        score,
        weight: this.criteria.roe.weight,
        max_score: score * this.criteria.roe.weight
      });
    }

    // Evaluate Profit Margin
    if (stock.profit_margin !== null && this.criteria.profit_margin) {
      const score = Calculator.scoreMetric(
        stock.profit_margin,
        this.criteria.profit_margin.thresholds,
        this.criteria.profit_margin.inverseScore || false
      );
      metrics.push({
        name: 'Profit Margin',
        description: this.criteria.profit_margin.description,
        value: stock.profit_margin,
        score,
        weight: this.criteria.profit_margin.weight,
        max_score: score * this.criteria.profit_margin.weight
      });
    }

    // Evaluate Earnings Growth
    if (stock.earnings_growth !== null && this.criteria.earnings_growth) {
      const score = Calculator.scoreMetric(
        stock.earnings_growth,
        this.criteria.earnings_growth.thresholds,
        this.criteria.earnings_growth.inverseScore || false
      );
      metrics.push({
        name: 'Earnings Growth',
        description: this.criteria.earnings_growth.description,
        value: stock.earnings_growth,
        score,
        weight: this.criteria.earnings_growth.weight,
        max_score: score * this.criteria.earnings_growth.weight
      });
    }

    // Evaluate Revenue Growth
    if (stock.revenue_growth !== null && this.criteria.revenue_growth) {
      const score = Calculator.scoreMetric(
        stock.revenue_growth,
        this.criteria.revenue_growth.thresholds,
        this.criteria.revenue_growth.inverseScore || false
      );
      metrics.push({
        name: 'Revenue Growth',
        description: this.criteria.revenue_growth.description,
        value: stock.revenue_growth,
        score,
        weight: this.criteria.revenue_growth.weight,
        max_score: score * this.criteria.revenue_growth.weight
      });
    }

    // Calculate overall score
    const overall_score = Calculator.calculateWeightedScore(metrics);
    const recommendation = Calculator.getRecommendation(overall_score);
    const confidence = Calculator.calculateConfidence(stock);
    const reasons = Calculator.generateReasons(metrics, stock);

    return {
      symbol: stock.symbol,
      company_name: stock.company_name,
      price: stock.price,
      timestamp: new Date(),
      metrics,
      overall_score,
      recommendation,
      confidence,
      reasons
    };
  }

  /**
   * Format evaluation result for console output
   */
  formatResult(result: EvaluationResult): string {
    const divider = '━'.repeat(70);
    const lines: string[] = [];

    lines.push(divider);
    lines.push(`📊 Stock Evaluation Report: ${result.symbol}`);
    lines.push(divider);
    lines.push('');

    lines.push(`Company: ${result.company_name}`);
    
    // Add warning if price is unavailable (API rate limit hit)
    if (result.price === 0) {
      lines.push(`Current Price: $0.00 ⚠️ (API rate limit reached - price unavailable)`);
    } else {
      lines.push(`Current Price: $${result.price.toFixed(2)}`);
    }
    
    lines.push(`Evaluation Date: ${result.timestamp.toLocaleDateString()}`);
    lines.push(`Data Confidence: ${result.confidence.toFixed(1)}%`);
    lines.push('');

    lines.push('Metric Scores:');
    result.metrics.forEach((metric, index) => {
      const isLast = index === result.metrics.length - 1;
      const prefix = isLast ? '└─' : '├─';
      const stars = '⭐'.repeat(Math.round(metric.score));
      lines.push(
        `${prefix} ${metric.name} (${metric.value.toFixed(2)}): ${stars} (${metric.score.toFixed(1)}/5.0) - Weight: ${(metric.weight * 100).toFixed(0)}%`
      );
    });

    lines.push('');
    lines.push(divider);
    lines.push(`Overall Score: ${result.overall_score.toFixed(0)}/100`);
    lines.push(`Recommendation: ${this.formatRecommendation(result.recommendation)}`);
    lines.push(divider);

    if (result.reasons.length > 0) {
      lines.push('');
      lines.push('Key Factors:');
      result.reasons.forEach(reason => {
        lines.push(`  ${reason}`);
      });
    }

    lines.push('');
    lines.push('📌 Disclaimer: This is not financial advice. Always do your own research.');

    return lines.join('\n');
  }

  private formatRecommendation(rec: string): string {
    const emoji: { [key: string]: string } = {
      STRONG_BUY: '🟢 STRONG BUY',
      BUY: '🟢 BUY',
      HOLD: '🟡 HOLD',
      SELL: '🔴 SELL',
      STRONG_SELL: '🔴 STRONG SELL'
    };
    return emoji[rec] || rec;
  }
}
