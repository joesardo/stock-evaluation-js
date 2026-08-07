# Stock Evaluation Tool

A lightweight, free stock evaluation script for analyzing publicly traded companies. No paid APIs or AI required—just solid financial metrics and analysis.

## Features

- **Free Data Sources**: Uses yfinance (Yahoo Finance) - no API key required, unlimited requests
- **Backup API**: Alpha Vantage fallback for resilience (25 requests/day free tier)
- **Sector Screening**: Evaluate all stocks in a sector at once (tech, finance, healthcare, etc.)
- **Top Stocks Finder**: Batch evaluate 100+ stocks across all sectors to find top performers
- **Multi-factor Analysis**: Evaluates stocks based on:
  - Price-to-Earnings (P/E) Ratio
  - Price-to-Book (P/B) Ratio
  - Dividend Yield
  - Debt-to-Equity Ratio
  - Current Ratio (Liquidity)
  - ROE (Return on Equity)
  - Profit Margin
  - Earnings Growth YoY
  - Revenue Growth YoY
  - Price Position in 52-Week Range
  
- **Customizable Scoring**: Configure weights and thresholds for your investment criteria
- **CLI Interface**: Simple command-line tool to quickly evaluate any stock
- **Ranked Results**: View sector/top results sorted by score with visual bars
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

### Evaluate individual stocks

```bash
npm run dev -- AAPL
npm run dev -- MSFT GOOGL TSLA
```

### Screen by sector

Evaluate all stocks in a specific sector and get ranked results:

```bash
npm run dev -- Technology
npm run dev -- Financials
npm run dev -- Healthcare
```

Available sectors: Technology, Communication Services, Consumer Cyclical, Consumer Defensive, Energy, Financial Services, Healthcare, Industrials, Basic Materials, Real Estate, Utilities

### Find top performers

Batch evaluate 100+ stocks across all sectors to find the top N performers:

```bash
npm run dev -- --top 10
npm run dev -- --top 20
```

### Example: Technology Sector Results

```
🎯 Evaluating Technology sector (15 stocks)

[Detailed evaluation for each stock...]

════════════════════════════════════════════════════════════════════════════════
📊 SUMMARY - Ranked by Score
════════════════════════════════════════════════════════════════════════════════

1   QCOM   ████████░░ 76/100  BUY
2   META   ████████░░ 75/100  BUY
3   MSFT   ███████░░░ 73/100  BUY
4   GOOGL  ███████░░░ 70/100  BUY
5   NVDA   ███████░░░ 67/100  BUY
...

📈 Breakdown: 9 BUY | 4 HOLD | 2 SELL (out of 15 evaluated)

💡 Highest: QCOM (76/100)
   Lowest:  INTC (34/100)
```

### Customize evaluation criteria

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

**Primary**: [yfinance (Yahoo Finance)](https://finance.yahoo.com/)
- No API key required
- Unlimited requests (no rate limits)
- Real-time quotes and fundamentals
- 52-week price ranges

**Fallback**: [Alpha Vantage Free API](https://www.alphavantage.co/)
- Used if yfinance fails
- Free tier: 25 requests/day
- Stock prices and basic fundamentals

The tool automatically tries yfinance first, then falls back to Alpha Vantage if needed.

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
│   ├── index.ts              # CLI entry point (handles --sector, --top flags)
│   ├── evaluator.ts          # Core scoring engine
│   ├── data-fetcher.ts       # yfinance + Alpha Vantage data retrieval
│   ├── calculator.ts         # Financial metric calculations
│   └── types.ts              # TypeScript interfaces
├── config/
│   ├── evaluation-criteria.json  # Scoring configuration
│   └── watchlists.json          # Sector-based stock watchlists
├── dist/                     # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── .env.example              # Environment variables template (Alpha Vantage key)
└── README.md
```

## Watchlists

Sector watchlists are defined in `config/watchlists.json` and include 150+ stocks across 10 sectors:
- **Technology**: AAPL, MSFT, GOOGL, META, NVDA, TSLA, etc.
- **Financials**: JPM, BAC, WFC, GS, MS, BLK, etc.
- **Healthcare**: JNJ, UNH, LLY, PFE, AZN, etc.
- **Industrials**: BA, GE, MMM, HON, CAT, etc.
- **Consumer**: AMZN, WMT, MCD, NKE, SBUX, etc.
- **Energy**: XOM, CVX, COP, MPC, PSX, etc.
- **Telecom**: VZ, T, TMUS, CHTR, CMCSA, etc.
- **Utilities**: NEE, DUK, SO, AEP, ES, etc.
- **Real Estate**: SPG, PLD, AWO, EXR, PSA, etc.
- **Materials**: NEM, FCX, AA, SCCO, TX, etc.

Add or customize watchlists by editing `config/watchlists.json`.

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
- [ ] Comparative analysis within sectors
- [ ] Portfolio analysis and optimization
- [ ] Backtesting historical recommendations
- [ ] Database caching to reduce API calls
- [ ] Web dashboard for visualization
- [ ] Custom watchlist support
- [ ] Save/load evaluation results
- [ ] Export to CSV/JSON

## License

MIT

## Disclaimer

This tool is for educational and informational purposes only. It does not constitute financial advice. Always do your own research and consult with a financial advisor before making investment decisions.
