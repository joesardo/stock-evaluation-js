# Stock Evaluation Tool

A lightweight, free stock evaluation application with CLI and web UI. Analyze publicly traded companies using solid financial metrics—no paid APIs required.

## Features

- **Free Data Sources**: Uses Yahoo Finance (yfinance) for stock data - no API key required
- **TradingView Stock Lists**: 5000+ verified stocks organized by 20 TradingView sectors
- **Interactive Web UI**: Beautiful React interface for browsing sectors, industries, and watchlists
- **Piotroski F-Score Analysis**: Professional fundamental quality scoring
- **Value Score**: Price-to-book and dividend-adjusted valuation metrics
- **Sector & Industry Screening**: Evaluate all stocks in a sector or industry
- **Watchlist Management**: Save and track your favorite stocks
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
- 🌍 Sector Browser - Browse all 20 sectors with sortable stock lists
- 🏭 Industry Browser - Explore 80+ industries  
- 📋 Watchlist - Manage your personal stock watchlist
- 📊 Score Details - View Piotroski F-Score and Value Score breakdowns

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
- Electronic Technology
- Technology Services
- Finance
- Health Technology
- Retail Trade
- Producer Manufacturing
- Energy Minerals
- Consumer Non-Durables
- Communications
- Utilities
- Consumer Durables
- Non-Energy Minerals
- Consumer Services
- Industrial Services
- Transportation
- Commercial Services
- Process Industries
- Health Services
- Distribution Services
- Miscellaneous

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
- 20 TradingView sectors
- 5000+ verified US stocks
- Pre-sorted by market cap
- Updated via `node sectors-fetch.js`

**Stock Fundamentals**: [Yahoo Finance (yfinance)](https://finance.yahoo.com/)
- Piotroski F-Score components
- Price-to-book ratio
- Dividend yields
- Company profiles
- Industry classification

## Updating Stock Lists

When you want to refresh the list of stocks from TradingView:

```bash
node sectors-fetch.js
```

This fetches all 5000+ verified stocks from TradingView's 20 sectors and saves them to `all-stocks-by-sector.json`. The app loads this data instantly on startup—no rebuild process needed.

## Project Structure

```
stock-evaluation-js/
├── src/
│   ├── index.ts              # CLI entry point
│   ├── api.ts                # Express REST API
│   ├── calculator.ts         # Piotroski F-Score & Value Score
│   ├── sector-builder.ts     # Load sectors from TradingView JSON
│   ├── piotroski-evaluator.ts # F-Score calculation
│   ├── value-evaluator.ts    # Value score calculation
│   ├── data-fetcher.ts       # Yahoo Finance data retrieval
│   ├── watchlist-manager.ts  # Watchlist CRUD
│   └── types.ts              # TypeScript interfaces
├── frontend/                 # React UI (Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   ├── SectorBrowser.tsx
│   │   │   ├── IndustryBrowser.tsx
│   │   │   ├── Watchlist.tsx
│   │   │   └── ScoreBar.tsx
│   │   └── main.tsx
│   └── vite.config.ts
├── config/
│   └── evaluation-criteria.json  # Scoring thresholds
├── cache/
│   └── (cache files generated at runtime)
├── all-stocks-by-sector.json    # TradingView stock data (generated)
├── sectors-fetch.js             # TradingView data fetcher
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

Investment value assessment using:
- Price-to-Book Ratio
- Dividend Yield
- Market Cap positioning

**Interpretation:**
- 90-100: Excellent value
- 70-89: Good value
- 50-69: Fair value
- 30-49: Expensive
- 0-29: Very overvalued

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

- Yahoo Finance data may be delayed by 15-20 minutes
- Some stocks may fail to fetch (delisted, ticker changes, data gaps)
- TradingView scanner updates periodically (run `node sectors-fetch.js` to refresh)
- Web UI requires modern browser

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
