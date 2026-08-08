# Available Stock Sectors & Industries

This guide lists all available sectors and industries you can use to evaluate groups of stocks at once. Both **sectors and industries are dynamically pulled from Yahoo Finance** based on their official classifications.

## Two Classification Systems

The tool supports two levels of classification granularity:

### Sectors (12 main categories)
Broad categories matching Yahoo Finance's main sector classification. Use these for high-level analysis.

### Industries (80+ granular categories)
Much more detailed classification system. Use these for focused analysis within specific industries.

## Usage

### Evaluate by Sector:
```bash
npm run dev -- SECTOR_NAME
```

### Evaluate by Industry:
```bash
npm run dev -- --industry "INDUSTRY_NAME"
```

Replace `SECTOR_NAME` or `INDUSTRY_NAME` with any names listed below.

**Note:** Industry names may contain spaces. Quote them if needed or use the names exactly as shown.

## Rebuilding Data

### Rebuild Sectors:
```bash
npm run dev -- --rebuild-sectors
```

### Rebuild Industries:
```bash
npm run dev -- --rebuild-industries
```

Both commands fetch data for 200+ stocks and cache the results for performance.

---

## Available Sectors (12 total)

| Sector | Stock Count | Examples |
|--------|-------------|----------|
| `Tech` | 36 | AAPL, MSFT, NVDA, INTC, AMD |
| `Healthcare` | 14 | JNJ, UNH, LLY, PFE, AZN |
| `Industrial` | 15 | BA, RTX, CAT, GE, HON |
| `Retail` | 19 | AMZN, WMT, COST, MCD, HD |
| `Banking` | 17 | JPM, BAC, WFC, GS, MS |
| `Energy` | 14 | XOM, CVX, COP, OXY, EOG |
| `Materials` | 15 | NEM, FCX, AA, LYB, APD |
| `Media` | 10 | GOOGL, META, NFLX, ROKU, SNAP |
| `RealEstate` | 21 | SPG, KIM, PLD, VICI, EXR |
| `Staples` | 11 | PG, KO, PEP, WMT, COST |
| `Utilities` | 14 | NEE, DUK, SO, AEP, EXC |
| `Unknown` | 3 | Stocks that couldn't be classified by Yahoo Finance |

---

## Quick Examples

### Evaluate a single sector:
```bash
npm run dev -- Tech
npm run dev -- Healthcare
npm run dev -- Energy
```

### Evaluate a single industry (more granular):
```bash
npm run dev -- --industry Semiconductors
npm run dev -- --industry "Software - Application"
npm run dev -- --industry "Auto Manufacturers"
```

### Evaluate individual stocks:
```bash
npm run dev -- AAPL MSFT GOOGL
```

### Evaluate your personal watchlist:
```bash
npm run dev -- --watchlist
```

### Find top performers across all sectors:
```bash
npm run dev -- --top 10
```

### Get help and see all options:
```bash
npm run dev
```

---

## Available Industries (80+ categories)

Industries provide more granular analysis than sectors. Here's a sample:

**Computing & IT:**
- Semiconductors
- Software - Infrastructure
- Software - Application
- Consumer Electronics
- Computer Hardware

**Consumer:**
- Auto Manufacturers
- Restaurants
- Discount Stores
- Apparel Retail
- Specialty Retail

**Financial:**
- Banks - Diversified
- Capital Markets
- Financial Data & Stock Exchanges

**Healthcare:**
- Drug Manufacturers - General
- Health Information Services
- Biotechnology

**Energy & Materials:**
- Oil & Gas Integrated
- Specialty Chemicals
- Steel
- Copper
- Gold

**Communications:**
- Internet Content & Information
- Entertainment
- Telecom Services

**Real Estate:**
- REIT - Office
- REIT - Residential
- REIT - Industrial

...and many more!

To see the full list, run:
```bash
npm run dev
```

---

## Notes

- **Real Yahoo Finance Data:** Both sectors and industries derive directly from Yahoo Finance's official classifications, not manually crafted categories
- **Dynamic Updates:** Run `--rebuild-sectors` or `--rebuild-industries` periodically to keep data current
- **Industry Granularity:** 80+ industries vs 12 sectors - choose based on your analysis needs
- **Overlapping Stocks:** Stocks appear in exactly one sector/industry per Yahoo Finance classification
- **Case-Insensitive:** Sector names are case-insensitive (`npm run dev -- tech` works)


