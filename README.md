# Stock Evaluation Tool

A lightweight, free stock evaluation application with CLI and web UI. Analyze publicly traded companies using solid financial metrics—no paid APIs required.

## Features

- **Free Data Sources**: Uses Yahoo Finance (yfinance) for stock data - no API key required
- **TradingView Stock Lists**: 11,700+ verified liquid US stocks (cleaned of OTC/Pink sheets)
- **Comprehensive Industries**: 129 granular industry classifications with 11,400+ stocks
- **Interactive Web UI**: Beautiful React interface for browsing sectors, industries, and watchlists
- **Piotroski F-Score Analysis**: Professional fundamental quality scoring (0-9)
- **Value Score**: Multi-factor valuation with price positioning, P/E, P/B, and dividend yield
- **Sector & Industry Screening**: Evaluate all stocks in a sector or industry with streaming results
- **Watchlist Management**: Save and track your favorite stocks with persistent storage
- **CLI & Web Interface**: Use the command-line tool or open the web UI (Vite + React)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd stock-evaluation-js

# Install dependencies
npm install
```

## Quick Start

### Web UI (Recommended)

**Option 1: Start both frontend and backend together (easiest)**

```bash
bash start-dev.sh
```

This starts:
- **Backend API**: http://localhost:3000
- **Frontend UI**: http://localhost:5174 (or next available port if 5174 is in use)

The frontend will show you the actual port when it starts.

**Option 2: Start separately in two terminals**

Terminal 1 - Start the backend API server:
```bash
npm run server
```

Terminal 2 - Start the frontend dev server:
```bash
cd frontend
npm run dev
```

Then open the URL shown in Terminal 2 (usually http://localhost:5174).

The web interface provides:
- 🌍 Sector Browser - Browse all 20 TradingView sectors with live streaming evaluation
- 🏭 Industry Browser - Explore 129 granular industry classifications with instant loading
- 📋 Watchlist - Manage your personal stock watchlist with real-time scores
- 📊 Score Details - View Piotroski F-Score and Value Score breakdowns with metric analysis

### CLI (Command Line)

```bash
# Evaluate individual stocks
npm run dev -- AAPL
npm run dev -- MSFT GOOGL TSLA

# Screen by sector
npm run dev -- "Electronic Technology"
npm run dev -- "Healthcare"

# Screen by industry
npm run dev -- --industry "Software - Application"

# View watchlist results
npm run dev -- --watchlist

# Find top performers
npm run dev -- --top 10
```

Available sectors (20 TradingView sectors):
See [docs/SECTORS.md](docs/SECTORS.md) for the complete list of sectors and 129 industries.

**Key Features of Data:**
- ✅ **Cleaned Data**: Removed 11,184 OTC/Pink sheet tickers with unreliable Yahoo Finance data
- ✅ **Liquid Stocks Only**: Excludes 5+ character tickers (SBHGF, ABBVF, etc.) except GOOGL
- ✅ **Industry Classification**: Full 129-industry breakdown from TradingView
- ✅ **No API Keys**: All data from free sources (TradingView Scanner, Yahoo Finance)

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

**Stock Lists**: [TradingView Scanner API](https://www.tradingview.com/markets/stocks-usa/sectorandindustry-sector/)
- 20 TradingView sectors with 11,767 stocks (cleaned)
- 129 granular industries with 11,493 stocks (cleaned)
- Cleaned to remove OTC, Pink sheets, and 5+ char tickers (except GOOGL)
- Pre-sorted by market cap
- Updated via `npm run fetch:sectors` or `npm run fetch:industries`

**Stock Fundamentals**: [Yahoo Finance (yfinance)](https://finance.yahoo.com/)
- Piotroski F-Score components (ROE, margins, cash flow, etc.)
- Price-to-book ratio
- Dividend yields (capped at 20% to prevent data errors)
- Company profiles and current pricing
- 52-week high/low for value positioning

**Data Validation**:
- Removed 11,184 invalid tickers (OTC/ADR with bad data)
- Dividend yields capped at 20% (Yahoo Finance often returns 200%+ for delisted stocks)
- 52-week price position drives value scoring (35% weight)

## Updating Stock Lists

When you want to refresh the lists from TradingView:

```bash
# Fetch all sectors
npm run fetch:sectors

# Fetch all industries
npm run fetch:industries

# Clean invalid tickers (OTC/Pink sheets, bad data)
node clean-tickers.js
```

These commands fetch data from TradingView's scanner API:
- `all-stocks-by-sector.json` - 20 sectors with 11,767 stocks
- `all-stocks-by-industry.json` - 129 industries with 11,493 stocks

The `clean-tickers.js` script removes invalid tickers (OTC symbols, 5+ chars except GOOGL) and caches the cleaned data.

## Project Structure

```
stock-evaluation-js/
├── src/
│   ├── index.ts                 # CLI entry point
│   ├── api-server.ts            # Express REST API server
│   ├── sector-builder.ts        # Load sectors/industries from JSON (cached)
│   ├── piotroski-evaluator.ts   # F-Score calculation
│   ├── value-evaluator.ts       # Value score calculation (reweighted metrics)
│   ├── data-fetcher.ts          # Yahoo Finance data retrieval with validation
│   ├── watchlist-manager.ts     # Watchlist CRUD operations
│   └── types.ts                 # TypeScript interfaces
├── frontend/
│   ├── src/
│   │   ├── App.tsx
│   │   ├── api.ts               # API client with streaming support
│   │   └── components/
│   │       ├── SectorBrowser.tsx    # Streaming evaluation UI
│   │       ├── IndustryBrowser.tsx  # Instant-load industries
│   │       └── Watchlist.tsx        # Watchlist management
│   └── vite.config.ts
├── config/
│   └── evaluation-criteria.json      # Scoring thresholds
├── all-stocks-by-sector.json        # TradingView sectors (11,767 stocks, cached)
├── all-stocks-by-industry.json      # TradingView industries (11,493 stocks, cached)
├── sectors-fetch.js                 # Sector data fetcher
├── industries-fetch.js              # Industry data fetcher
├── clean-tickers.js                 # Remove OTC/invalid tickers
├── package.json
├── tsconfig.json
└── README.md
```

## Scoring System

### Piotroski F-Score (Quality Score: 0-100)

Professional fundamental quality metric based on:
- Operating Cash Flow
- Net Income
- Asset Quality (CapEx vs Depreciation)
- Liquidity Trends (Current Ratio)
- Leverage Trends (Debt changes)
- Efficiency (ROA, Asset Turnover)

**Interpretation:**
- 90-100: Excellent financial health
- 70-89: Good fundamentals
- 50-69: Average quality
- 30-49: Concerning metrics
- 0-29: Poor financial position

### Value Score (0-100)

Investment value assessment (reweighted for accuracy):
- **52-Week Price Position** (35%) - Position near low = good value
- **Price-to-Earnings Ratio** (20%) - Lower P/E = better value
- **PEG Ratio** (15%) - P/E relative to growth rate
- **Price-to-Book Ratio** (15%) - Lower P/B = trading below book value
- **Dividend Yield** (15%) - Capped at 20% to prevent data errors

**Interpretation:**
- 90-100: Excellent value
- 70-89: Good value
- 50-69: Fair value
- 30-49: Expensive
- 0-29: Very overvalued

**Note**: Stocks trading near 52-week highs are properly penalized (unlike raw P/E which ignores timing)

### Warning Icons & Emojis

The app uses visual warnings in both the CLI output and web UI to highlight potential risk:

- ⚠️ **Downtrend Warning**: Stock is in a meaningful downtrend (for example, significantly negative YTD performance or near 52-week lows). This means it may look "cheap" for a reason.
- 🚨 **Value-Trap Risk**: Stronger warning when downtrend signals are combined with weaker fundamentals and/or extreme leverage. Value scores are adjusted downward in these cases.
- 📈 / 📉 **YTD Trend Indicator**: Quick year-to-date direction marker next to performance (up vs down).

**How to use this:** If you see ⚠️ or 🚨, treat a high Value Score as a starting point for deeper due diligence—not an automatic buy signal.

## Configuration

Edit `config/evaluation-criteria.json` to customize scoring thresholds.

## Development

```bash
# Install dependencies in root
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Start both backend and frontend
bash start-dev.sh

# OR start separately:
# Terminal 1 - Backend API server
npm run server

# Terminal 2 - Frontend dev server (in frontend/ directory)
cd frontend && npm run dev

# CLI evaluation (in root directory)
npm run dev -- AAPL
npm run dev -- "Electronic Technology"
```

## Browser Support

The web UI requires a modern browser with ES2020+ support:
- Chrome/Edge 91+
- Firefox 89+
- Safari 14+

## Contributing

Feel free to submit issues or PRs to:
- Add new data sources
- Improve scoring algorithms
- Add technical indicators
- Optimize performance

## Limitations

- Yahoo Finance data may be delayed by 15-20 minutes (market data lags)
- Some stocks may fail to fetch (recently delisted, data gaps, delisted companies)
- Historical data not available - only current prices and trailing 12-month metrics
- TradingView data updates periodically (run `npm run fetch:sectors` or `npm run fetch:industries` to refresh)
- Web UI requires ES2020+ support (Chrome 91+, Firefox 89+, Safari 14+)
- No support for crypto, forex, or international exchanges (US stocks only)

## Future Enhancements

- [ ] Export watchlist to CSV/JSON
- [ ] Portfolio analysis and performance tracking
- [ ] Backtesting historical recommendations
- [ ] Advanced filtering (market cap ranges, sector comparisons)
- [ ] Email alerts for watchlist stocks
- [ ] User accounts and cloud sync
- [ ] Technical analysis indicators
- [ ] Mobile app

## License

MIT

## Disclaimer

This tool is for educational and informational purposes only. It does not constitute financial advice. Always do your own research and consult with a financial advisor before making investment decisions.
