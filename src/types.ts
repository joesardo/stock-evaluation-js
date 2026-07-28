export interface StockData {
  symbol: string;
  company_name: string;
  price: number;
  pe_ratio: number | null;
  pb_ratio: number | null;
  dividend_yield: number;
  debt_to_equity: number | null;
  current_ratio: number | null;
  roe: number;
  earnings_per_share: number | null;
  book_value_per_share: number | null;
  market_cap: number | null;
  fifty_two_week_high: number | null;
  fifty_two_week_low: number | null;
}

export interface MetricScore {
  name: string;
  description: string;
  value: number;
  score: number; // 0-5
  weight: number;
  max_score: number; // Contribution to overall score
}

export interface EvaluationResult {
  symbol: string;
  company_name: string;
  price: number;
  timestamp: Date;
  metrics: MetricScore[];
  overall_score: number; // 0-100
  recommendation: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
  confidence: number; // 0-100
  reasons: string[];
}

export interface EvaluationCriteria {
  [key: string]: {
    weight: number;
    description: string;
    inverseScore?: boolean; // True if lower is better (e.g., P/E ratio)
    thresholds: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
}
