# Stock Evaluation Tool - Development Guide

## Getting Started

This is a stock evaluation tool built with TypeScript that scores publicly traded companies based on financial metrics.

### Project Structure

- **src/index.ts** - CLI entry point
- **src/types.ts** - TypeScript interfaces and types
- **src/evaluator.ts** - Core evaluation logic and result formatting
- **src/calculator.ts** - Financial metric calculations
- **src/data-fetcher.ts** - Data source integrations (currently mock data)
- **config/evaluation-criteria.json** - Configurable scoring weights and thresholds

## Development Workflow

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Development Mode
```bash
npm run dev -- AAPL MSFT GOOGL
```

### 3. Build for Production
```bash
npm run build
npm start -- AAPL
```

### 4. Type Checking
```bash
npm run lint
```

## How the Scoring Works

### 1. Data Collection
The tool fetches financial data for a stock symbol (currently using mock data).

### 2. Metric Evaluation
Each metric is scored from 0-5 based on configured thresholds:
- **Excellent**: Score 5.0
- **Good**: Score 4.0
- **Fair**: Score 2.5
- **Poor**: Score 0.0

For "inverse score" metrics (where lower is better, like P/E ratio), the thresholds work in reverse.

### 3. Weighted Calculation
Scores are multiplied by their weight to calculate contribution:
```
metric_contribution = metric_score × metric_weight
overall_score = (sum of contributions) / (sum of weights) × 20
```

This produces a 0-100 score.

### 4. Recommendation
```
90-100 → STRONG BUY
70-89  → BUY
50-69  → HOLD
30-49  → SELL
0-29   → STRONG SELL
```

## Customizing Evaluation Criteria

Edit `config/evaluation-criteria.json` to adjust:

1. **Weight** - How much this metric affects overall score (0.0-1.0)
2. **Thresholds** - Values that determine scoring tiers
3. **inverseScore** - Whether lower values are better

Example: To weight earnings more heavily:
```json
{
  "roe": {
    "weight": 0.25,  // Increased from 0.15
    "description": "Return on Equity (%)",
    "inverseScore": false,
    "thresholds": {
      "excellent": 20,
      "good": 15,
      "fair": 10,
      "poor": 5
    }
  }
}
```

## Adding Real Data Sources

The `src/data-fetcher.ts` file includes a template for Alpha Vantage integration. To use real data:

1. Sign up for a free API key at [Alpha Vantage](https://www.alphavantage.co/)
2. Create `.env` file with your API key:
   ```
   ALPHA_VANTAGE_API_KEY=your_key_here
   ```
3. Implement data fetching in `DataFetcher.fetchStockData()`

Alternative free data sources:
- **Financial Modeling Prep**: https://financialmodelingprep.com/
- **IEX Cloud**: https://iexcloud.io/
- **Yahoo Finance**: Via web scraping (polygon-io, yfinance alternatives)

## Key Files to Modify

### To Add New Metrics
Edit `src/evaluator.ts` and add:
1. New evaluation logic in `evaluate()` method
2. Add metric data in `src/types.ts`
3. Add thresholds in `config/evaluation-criteria.json`

### To Connect to APIs
Edit `src/data-fetcher.ts`:
1. Implement `fetchStockData()` with real API calls
2. Parse API responses into `StockData` interface
3. Handle rate limiting and errors gracefully

### To Change Scoring Formula
Edit `src/calculator.ts`:
1. Modify `scoreMetric()` for different scoring logic
2. Update `calculateWeightedScore()` for different weighting
3. Adjust `getRecommendation()` thresholds

## Testing

Add test cases for:
- Different metric thresholds
- Edge cases (missing data, negative values)
- Various score ranges
- API error handling

Example test pattern:
```typescript
const testStock: StockData = {
  symbol: 'TEST',
  pe_ratio: 10,  // Should score well
  // ... other metrics
};

const result = evaluator.evaluate(testStock);
console.assert(result.overall_score > 70, 'Should be BUY recommendation');
```

## Performance Optimization

- Cache API responses to reduce rate limit usage
- Batch requests when evaluating multiple stocks
- Consider database storage for historical data
- Implement rate limiting detection

## Next Steps

1. Implement real API integration with error handling
2. Add more financial metrics (cash flow, growth rates, etc.)
3. Create portfolio analysis combining multiple stocks
4. Add historical data tracking for trends
5. Build web UI for visualization
6. Implement caching layer
7. Add sector/industry comparison
8. Consider machine learning for pattern detection
