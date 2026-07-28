# Stock Evaluation Tool Documentation Index

## Start Here

**New to this project?** Start with one of these:

1. **[GETTING-STARTED.md](GETTING-STARTED.md)** ⭐ START HERE
   - Quick overview of what's been built
   - 30-second quick start
   - Common commands
   - FAQ section
   - Next steps recommendations

2. **[QUICKSTART.md](QUICKSTART.md)**
   - 2-minute setup guide
   - How to run immediately
   - Understanding the output
   - Customization examples
   - Troubleshooting

## Core Documentation

### For Users

- **[README.md](README.md)** - Main project documentation
  - Features overview
  - Installation
  - Usage examples
  - Scoring interpretation
  - Data sources

### For Developers

- **[DEVELOPMENT.md](DEVELOPMENT.md)** - Architecture & development
  - How the scoring works
  - Development workflow
  - Customizing evaluation criteria
  - Adding new metrics
  - Performance optimization

- **[API-INTEGRATION.md](API-INTEGRATION.md)** - Connecting real data sources
  - Overview of free APIs
  - Alpha Vantage setup (recommended)
  - Financial Modeling Prep setup
  - IEX Cloud setup
  - Caching strategies
  - Error handling

- **[FILE-REFERENCE.md](FILE-REFERENCE.md)** - Understanding the codebase
  - Purpose of each file
  - Key methods and features
  - File dependencies
  - Where to make changes
  - Quick reference table

## Project Overview

- **[PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)** - Complete project overview
  - What's been built
  - Technology stack
  - Project structure
  - How it works
  - Limitations and roadmap

## Quick Navigation

### I Want To...

| Goal | Document |
|------|----------|
| Start using it right now | [GETTING-STARTED.md](GETTING-STARTED.md) |
| Understand what it does | [README.md](README.md) |
| Get it running in 2 minutes | [QUICKSTART.md](QUICKSTART.md) |
| Learn how it works | [DEVELOPMENT.md](DEVELOPMENT.md) |
| Add real stock data | [API-INTEGRATION.md](API-INTEGRATION.md) |
| Understand the code | [FILE-REFERENCE.md](FILE-REFERENCE.md) |
| See the full project | [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) |

### By Experience Level

**Beginner:**
1. [GETTING-STARTED.md](GETTING-STARTED.md) - Overview & quick start
2. [QUICKSTART.md](QUICKSTART.md) - Getting it running
3. [README.md](README.md) - Understanding features

**Intermediate:**
1. [DEVELOPMENT.md](DEVELOPMENT.md) - How it works
2. [FILE-REFERENCE.md](FILE-REFERENCE.md) - Code structure
3. [API-INTEGRATION.md](API-INTEGRATION.md) - Adding real data

**Advanced:**
1. [FILE-REFERENCE.md](FILE-REFERENCE.md) - Code details
2. [DEVELOPMENT.md](DEVELOPMENT.md) - Architecture
3. Directly explore `src/` files

## Essential Commands

```bash
# Get started
npm install
npm run dev -- AAPL

# Build & run
npm run build
node dist/index.js AAPL

# Development
npm run lint                    # Check for errors
npm run clean                   # Remove build files
node examples.js                # See example portfolios

# Customize
# Edit config/evaluation-criteria.json
# Then rebuild: npm run build
```

## File Structure

```
├── GETTING-STARTED.md          ← START HERE
├── README.md                   ← Project overview
├── QUICKSTART.md               ← 2-minute setup
├── DEVELOPMENT.md              ← How it works
├── API-INTEGRATION.md          ← Add real data
├── FILE-REFERENCE.md           ← Code guide
├── PROJECT_SUMMARY.md          ← Full details
├── src/
│   ├── index.ts               ← CLI entry
│   ├── evaluator.ts           ← Scoring logic
│   ├── calculator.ts          ← Math
│   ├── data-fetcher.ts        ← API layer
│   └── types.ts               ← Definitions
├── config/
│   └── evaluation-criteria.json ← Customize here
├── package.json               ← Dependencies
├── tsconfig.json              ← TypeScript config
└── .env.example               ← Environment template
```

## Common Tasks

### Running the Tool

```bash
# Single stock
npm run dev -- AAPL

# Multiple stocks
npm run dev -- AAPL MSFT GOOGL

# Example portfolios
node examples.js
npm run dev -- AAPL MSFT GOOGL NVDA META        # Tech
npm run dev -- JPM BAC WFC GS BLK                # Finance
npm run dev -- JNJ PFE LLY AZN ABBV             # Pharma
```

### Development

```bash
# Check for errors
npm run lint

# Build for production
npm run build

# Run built code
node dist/index.js AAPL
```

### Customization

```bash
# Edit scoring weights & thresholds
# File: config/evaluation-criteria.json

# Then rebuild
npm run build
npm run dev -- AAPL
```

### Adding Real Data

```bash
# 1. Get API key from Alpha Vantage
# https://www.alphavantage.co/

# 2. Copy environment template
cp .env.example .env

# 3. Add API key to .env
# ALPHA_VANTAGE_API_KEY=your_key_here

# 4. Update src/data-fetcher.ts
# (See API-INTEGRATION.md for details)

# 5. Rebuild & test
npm run build
npm run dev -- AAPL
```

## Key Metrics Evaluated

- **P/E Ratio** (20% weight) - Valuation
- **P/B Ratio** (15% weight) - Book value
- **Dividend Yield** (15% weight) - Income
- **Debt-to-Equity** (20% weight) - Risk
- **Current Ratio** (15% weight) - Liquidity
- **ROE** (15% weight) - Profitability

## Scoring Scale

- **90-100:** 🟢 STRONG BUY
- **70-89:** 🟢 BUY
- **50-69:** 🟡 HOLD
- **30-49:** 🔴 SELL
- **0-29:** 🔴 STRONG SELL

## Technology Stack

- **Language:** TypeScript
- **Runtime:** Node.js
- **HTTP:** Axios
- **Config:** JSON

## Next Steps After Reading

1. ✅ Run: `npm run dev -- AAPL`
2. ✅ Explore the output
3. ✅ Try different symbols
4. ✅ Customize thresholds (optional)
5. ✅ Add real API data (optional)
6. ✅ Extend with new metrics (optional)

## Important Notes

⚠️ **This is educational software only**
- Not financial advice
- No liability for investment decisions
- Always consult a financial advisor
- Do your own research

✅ **Ready to use immediately**
- Works with mock data
- No setup required to start
- 15 minutes to add real data
- Fully extensible

## Support Resources

All questions answered in the documentation:
- Errors? → [QUICKSTART.md](QUICKSTART.md#troubleshooting)
- How it works? → [DEVELOPMENT.md](DEVELOPMENT.md)
- Adding features? → [FILE-REFERENCE.md](FILE-REFERENCE.md)
- Real data? → [API-INTEGRATION.md](API-INTEGRATION.md)

---

**Happy analyzing! Start with [GETTING-STARTED.md](GETTING-STARTED.md)** 🚀
