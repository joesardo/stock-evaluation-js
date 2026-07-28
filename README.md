# Stock Evaluation Tool

A lightweight, free stock evaluation script for analyzing publicly traded companies. No paid APIs or AI required—just solid financial metrics and analysis.

## Features

- **Free Data Sources**: Uses publicly available financial data (no paid subscriptions)
- **Multi-factor Analysis**: Evaluates stocks based on:
  - Price-to-Earnings (P/E) Ratio
  - Price-to-Book (P/B) Ratio
  - Dividend Yield
  - Debt-to-Equity Ratio
  - Current Ratio (Liquidity)
  - ROE (Return on Equity)
  - Industry benchmarks
  
- **Customizable Scoring**: Configure weights and thresholds for your investment criteria
- **CLI Interface**: Simple command-line tool to quickly evaluate any stock
- **Clear Output**: Get a comprehensive score with breakdown of each metric

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd stock-evaluation-js

# Install dependencies
npm install
```

## Usage

### Run with a ticker symbol

```bash
npm run dev -- AAPL
npm run dev -- MSFT GOOGL TSLA
```

### Evaluate with custom configuration

Edit `config/evaluation-criteria.json` to adjust weights and thresholds for your needs.

### Build for production

```bash
npm run build
node dist/index.js AAPL
```

## Configuration

The evaluation criteria are defined in `config/evaluation-criteria.json`. Each metric has:
- `weight`: How much this metric influences the overall score (0-1)
- `thresholds`: Scoring thresholds for "Excellent", "Good", "Fair", "Poor"
- `inverseScore`: Whether lower values are better (e.g., P/E ratio)

### Example Configuration Entry

```json
{
  "pe_ratio": {
    "weight": 0.2,
    "description": "Price-to-Earnings Ratio",
    "inverseScore": true,
    "thresholds": {
      "excellent": 15,
      "good": 20,
      "fair": 30,
      "poor": 30
    }
  }
}
```

## Scoring Interpretation

- **90-100**: Strong Buy
- **70-89**: Buy
- **50-69**: Hold
- **30-49**: Sell
- **0-29**: Strong Sell

## Data Sources

Currently supports fetching from:
- [Alpha Vantage Free API](https://www.alphavantage.co/) - Stock prices and basic fundamentals
- [Free Yahoo Finance Data](https://finance.yahoo.com/) - Historical and current data
- IEX Cloud Free Tier (future)
- Financial Modeling Prep Free API (future)

**Note**: Free APIs have rate limits. See individual API documentation for details.

## Example Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Stock Evaluation Report: AAPL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Company: Apple Inc.
Current Price: $185.25
Market Cap: $2.9T

Metric Scores:
├─ P/E Ratio (20.5): ⭐⭐⭐⭐ (4.0/5.0) - Weight: 20%
├─ Dividend Yield (0.42%): ⭐⭐ (2.0/5.0) - Weight: 15%
├─ Debt-to-Equity (1.2): ⭐⭐⭐ (3.0/5.0) - Weight: 15%
├─ Current Ratio (1.05): ⭐⭐⭐⭐ (4.0/5.0) - Weight: 10%
└─ ROE (165.4%): ⭐⭐⭐⭐⭐ (5.0/5.0) - Weight: 20%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Score: 76/100
Recommendation: BUY ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Project Structure

```
stock-evaluation-js/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── evaluator.ts          # Core scoring engine
│   ├── data-fetcher.ts       # API data retrieval
│   ├── calculator.ts         # Financial metric calculations
│   └── types.ts              # TypeScript interfaces
├── config/
│   └── evaluation-criteria.json # Scoring configuration
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example              # Environment variables template
└── README.md
```

## Development

```bash
# Install dependencies
npm install

# Run TypeScript compiler in watch mode
npm run build

# Run the tool in development mode
npm run dev -- AAPL

# Check for TypeScript errors
npm run lint

# Clean build artifacts
npm run clean
```

## Contributing

Feel free to submit issues or PRs to:
- Add new data sources
- Improve scoring algorithms
- Add technical indicators
- Optimize performance

## Limitations

- Free API rate limits apply (typically 5-500 requests/month depending on service)
- Some financial metrics may not be available for all stocks (startups, delisted companies)
- Historical data availability varies by source
- No real-time data (delayed by 15-20 minutes typically)

## Future Enhancements

- [ ] Technical indicator analysis (MA, RSI, MACD)
- [ ] Sector/industry comparison
- [ ] Portfolio analysis across multiple stocks
- [ ] Backtesting historical recommendations
- [ ] Database caching to reduce API calls
- [ ] Web dashboard for visualization
- [ ] Machine learning for pattern recognition (using free models)

## License

MIT

## Disclaimer

This tool is for educational and informational purposes only. It does not constitute financial advice. Always do your own research and consult with a financial advisor before making investment decisions.
