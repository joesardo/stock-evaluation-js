# File Reference Guide

## Project Overview
This guide explains what each file does and how they work together.

## Root Configuration Files

### package.json
- Defines project metadata, dependencies, and scripts
- Main dependencies: `axios` (HTTP client), `dotenv` (env vars)
- Dev dependencies: TypeScript, ts-node, Node types
- **Scripts:**
  - `npm run dev` - Run with ts-node (development)
  - `npm run build` - Compile TypeScript to JavaScript
  - `npm run start` - Run compiled JavaScript
  - `npm run lint` - Check TypeScript without compiling
  - `npm run clean` - Remove build artifacts

### tsconfig.json
- TypeScript compiler configuration
- Sets target to ES2020 for modern JavaScript
- Enables strict type checking
- Includes Node types for file system and process APIs

### .env.example
- Template for environment variables
- Copy to `.env` and fill in your API keys
- Never commit `.env` (keep it local and private)

### .gitignore
- Tells Git which files to ignore
- Excludes node_modules, dist, .env, logs, etc.

## Source Code (src/)

### index.ts
**Purpose:** CLI entry point - handles user input and orchestrates evaluation
**Key Features:**
- Parses command line arguments (stock symbols)
- Loads evaluation criteria from config
- Fetches data for each symbol
- Runs evaluation
- Formats and displays results
- Error handling for invalid symbols

**Entry Point:** `npm run dev -- AAPL MSFT`

### types.ts
**Purpose:** TypeScript interfaces and type definitions
**Main Types:**
- `StockData` - Financial metrics for a stock
- `MetricScore` - Individual metric evaluation result
- `EvaluationResult` - Complete evaluation with recommendation
- `EvaluationCriteria` - Scoring configuration

**Used by:** All other modules for type safety

### evaluator.ts
**Purpose:** Core scoring engine and result formatting
**Key Methods:**
- `evaluate()` - Main evaluation logic using all metrics
- `formatResult()` - Creates beautiful formatted output
- Individual metric evaluation for each financial metric

**Calculates:**
- Score for each metric (0-5 stars)
- Weighted overall score (0-100)
- Investment recommendation
- Confidence percentage
- Key factors and reasons

### calculator.ts
**Purpose:** Financial calculations and scoring logic
**Key Methods:**
- `scoreMetric()` - Converts metric value to 0-5 score using thresholds
- `calculateWeightedScore()` - Combines metric scores using weights
- `getRecommendation()` - Converts 0-100 score to BUY/HOLD/SELL
- `calculateGrowthRate()` - Year-over-year growth calculation
- `calculateConfidence()` - Assesses data availability
- `generateReasons()` - Creates human-readable insights

**Algorithm:**
1. Score each metric based on thresholds
2. Multiply score by metric weight
3. Sum all weighted scores
4. Normalize to 0-100 scale
5. Generate recommendation

### data-fetcher.ts
**Purpose:** Retrieves stock data from external sources
**Current State:**
- `DataFetcher` class returns mock data (for immediate testing)
- `AlphaVantageDataFetcher` template for real API (commented)

**To Use Real Data:**
1. Get API key from https://www.alphavantage.co/
2. Uncomment and implement `AlphaVantageDataFetcher` methods
3. Replace mock data logic in `fetchStockData()`

**Methods:**
- `fetchStockData()` - Get metrics for one symbol
- `fetchMultipleStocks()` - Get data for multiple symbols
- `isValidSymbol()` - Validates symbol format

See API-INTEGRATION.md for setup guide.

## Configuration (config/)

### evaluation-criteria.json
**Purpose:** Defines scoring weights and thresholds
**Structure:** Each metric has:
- `weight` - Importance (0.0-1.0, typically sum to 1.0)
- `description` - Display name
- `inverseScore` - true if lower values are better
- `thresholds` - Scoring boundaries (excellent, good, fair, poor)

**Current Metrics:**
- P/E Ratio (20% weight)
- P/B Ratio (15% weight)
- Dividend Yield (15% weight)
- Debt-to-Equity (20% weight)
- Current Ratio (15% weight)
- ROE (15% weight)

**Customization:**
Edit weights to prioritize different metrics for your investment style.

## Documentation Files

### README.md
Main documentation covering:
- Features overview
- Installation instructions
- Usage examples
- Scoring interpretation
- Data sources
- Project structure
- Development setup
- Contributing guidelines
- Disclaimer

**Start here** for general project information.

### QUICKSTART.md
Quick-start guide with:
- 2-minute setup
- Immediate usage with mock data
- Optional real API setup
- Understanding the output
- Customization examples
- Common tasks
- Troubleshooting

**Use this** to get up and running quickly.

### DEVELOPMENT.md
Developer-focused documentation:
- Development workflow
- How scoring works (detailed)
- Customizing evaluation criteria
- Adding new metrics
- Real data source integration
- Performance optimization
- Future enhancements

**Read this** to understand architecture and extend features.

### API-INTEGRATION.md
Complete guide to adding real data:
- Overview of free API options
- Alpha Vantage setup (recommended)
- Financial Modeling Prep setup
- IEX Cloud setup
- Yahoo Finance web scraping
- Caching strategies
- Database storage
- Error handling
- Rate limiting

**Use this** when you're ready to connect real data sources.

### PROJECT_SUMMARY.md
Comprehensive project overview with:
- What's been built
- Core features
- Project structure
- How it works
- Quick start instructions
- Next steps (easy to implement)
- Technology stack
- Scripts reference
- Configuration guide
- Data sources
- Key files to modify
- Roadmap
- Important disclaimers

**Reference this** for a complete project picture.

### ARCHITECTURE.md (This File)
File-by-file reference guide explaining:
- Purpose of each file
- Key features and methods
- How files interact
- Where to make changes
- Quick reference

## Generated Files (dist/)

Automatically created by TypeScript compiler.
- `dist/` contains compiled JavaScript
- Source maps included for debugging
- Generated from files in `src/`
- Ignored by Git

**Create with:** `npm run build`

## How Files Work Together

### Typical Evaluation Flow

1. **User runs:** `npm run dev -- AAPL`

2. **index.ts (main.ts)**
   - Parses "AAPL" argument
   - Loads `config/evaluation-criteria.json`

3. **data-fetcher.ts**
   - Fetches mock stock data for AAPL
   - Returns `StockData` object

4. **evaluator.ts + calculator.ts**
   - Iterates through each metric
   - Scores each using `calculator.scoreMetric()`
   - Calculates weighted overall score

5. **evaluator.ts formatResult()**
   - Formats results with emojis and formatting
   - Creates recommendation text

6. **index.ts**
   - Displays formatted output to console

### File Dependencies

```
index.ts
├── types.ts (interfaces)
├── evaluator.ts
│   ├── types.ts
│   └── calculator.ts
│       └── types.ts
├── data-fetcher.ts
│   └── types.ts
└── config/evaluation-criteria.json
```

## Quick Reference: Where to Make Changes

| Goal | File(s) |
|------|---------|
| Add new financial metric | `types.ts`, `evaluator.ts`, `config/evaluation-criteria.json` |
| Adjust scoring weights | `config/evaluation-criteria.json` |
| Change scoring algorithm | `calculator.ts` |
| Use real API data | `data-fetcher.ts` |
| Modify CLI behavior | `index.ts` |
| Change output format | `evaluator.ts` formatResult() |
| Add recommendation reasons | `calculator.ts` generateReasons() |

## Key Concepts

### Scoring System
- Each metric scored 0-5 based on thresholds
- Scores multiplied by weights
- Weighted sum normalized to 0-100
- 0-100 converted to recommendation

### Thresholds
- Excellent: Score 5
- Good: Score 4
- Fair: Score 2.5
- Poor: Score 0
- Customizable per metric

### Weights
- Importance of each metric (0.0-1.0)
- Multiply metric score by weight
- Higher weight = more influence
- Sum should equal 1.0

### InverseScore
- true: Lower values are better (P/E ratio)
- false: Higher values are better (ROE)
- Affects threshold comparison logic

## File Size Reference

- Source code (src/): ~20KB total
- Config files: ~2KB
- Dependencies (node_modules/): ~250MB
- Built code (dist/): ~50KB

## Testing Files

No test files included yet, but you can add:
- `src/evaluator.test.ts` - Test evaluation logic
- `src/calculator.test.ts` - Test calculations
- `tests/` directory for integration tests

## Environment Files

- `.env.example` - Template (commit to Git)
- `.env` - Your API keys (DO NOT commit)
- `.gitignore` - Git ignore rules (commit to Git)

## Build Artifacts

Files created during development (ignored by Git):
- `dist/` - Compiled JavaScript
- `*.log` - Log files
- `.DS_Store` - macOS cache

---

**Need more detail on a specific file? Check the comments in the source code.**
