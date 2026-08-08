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

## Available Industries (83 categories)

Industries provide more granular analysis than sectors. Here's the complete list organized by category:

### Technology & Computing
- Semiconductors
- Semiconductor Equipment & Materials
- Software - Infrastructure
- Software - Application
- Computer Hardware
- Financial Data & Stock Exchanges

### Consumer - Retail
- Discount Stores
- Specialty Retail
- Apparel Retail
- Footwear & Accessories
- Home Improvement Retail
- Luxury Goods
- Furnishings, Fixtures & Appliances

### Consumer - Restaurants & Food
- Restaurants
- Packaged Foods
- Confectioners
- Beverages - Brewers
- Beverages - Non-Alcoholic
- Tobacco

### Consumer Electronics & Goods
- Consumer Electronics
- Household & Personal Products
- Apparel Manufacturing

### Automotive & Transportation
- Auto Manufacturers
- Auto Parts
- Airlines
- Railroads
- Travel Services

### Healthcare & Pharmaceuticals
- Drug Manufacturers - General
- Biotechnology
- Healthcare Plans
- Health Information Services
- Medical Instruments & Supplies
- Medical Care Facilities
- Diagnostics & Research

### Financial Services
- Banks - Diversified
- Banks - Regional
- Capital Markets
- Asset Management
- Credit Services
- Insurance - Diversified
- Insurance - Property & Casualty
- Insurance Brokers

### Real Estate (REITs)
- REIT - Diversified
- REIT - Healthcare Facilities
- REIT - Industrial
- REIT - Residential
- REIT - Retail
- REIT - Specialty

### Energy & Oil/Gas
- Oil & Gas Integrated
- Oil & Gas E&P (Exploration & Production)
- Oil & Gas Midstream
- Oil & Gas Refining & Marketing

### Utilities & Energy
- Utilities - Regulated Electric
- Utilities - Regulated Gas
- Utilities - Regulated Water
- Solar

### Materials & Mining
- Specialty Chemicals
- Chemicals
- Steel
- Copper
- Aluminum
- Gold
- Other Industrial Metals & Mining

### Industrials & Manufacturing
- Aerospace & Defense
- Conglomerates
- Electrical Equipment & Parts
- Building Materials
- Building Products & Equipment
- Farm & Heavy Construction Machinery
- Specialty Industrial Machinery
- Waste Management
- Specialty Business Services

### Agriculture & Resources
- Agricultural Inputs
- Lumber & Wood Production

### Media & Entertainment
- Internet Content & Information
- Entertainment
- Broadcasting
- Advertising Agencies

### Internet & Retail
- Internet Retail

### Other
- Gambling
- Resorts & Casinos
- Unknown (Stocks that couldn't be classified)

---

To see the full list dynamically with stock counts, run:
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


