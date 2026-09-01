# Available Stock Sectors & Industries

This guide lists all available sectors and industries you can use to evaluate groups of stocks at once. Both **sectors and industries come from TradingView's verified stock classification system**.

## Two Classification Systems

The tool supports two levels of classification granularity:

### Sectors (20 TradingView categories)
Broad categories from TradingView's sector classification. Use these for high-level analysis.

### Industries (129 granular categories)
Much more detailed classification system with 17,464+ unique stocks. Use these for focused analysis within specific industries.

## Data Sources

- **Sectors:** `all-stocks-by-sector.json` (cached, from TradingView)
- **Industries:** `all-stocks-by-industry.json` (cached, from TradingView)

Both files are static data files that can be updated by running the fetch commands.

## Updating Data

### Refresh Sectors:
```bash
npm run fetch:sectors
```

### Refresh Industries:
```bash
npm run fetch:industries
```

Both commands fetch data from TradingView's scanner API and may take several minutes to complete (they paginate through thousands of stocks).

---

## Available Sectors (20 total, 5,000+ stocks)

| Sector | Stock Count | Examples |
|--------|-------------|----------|
| Electronic Technology | 688 | AAPL, MSFT, NVDA, INTC, AMD |
| Technology Services | 1,218 | GOOGL, META, CRM, ADBE, ZOOM |
| Finance | 3,022 | JPM, BAC, WFC, GS, BLK |
| Health Technology | 1,513 | JNJ, UNH, LLY, PFE, ABBV |
| Retail Trade | 388 | AMZN, WMT, COST, MCD, HD |
| Producer Manufacturing | 731 | BA, RTX, CAT, GE, HON |
| Energy Minerals | 415 | XOM, CVX, COP, MPC, EQNR |
| Consumer Non-Durables | 453 | KO, PEP, MO, PM, TAP |
| Communications | 157 | T, VZ, TMUS, DISH, CHTR |
| Utilities | 315 | NEE, DUK, SO, AEP, EXC |
| Consumer Durables | 366 | F, GM, HLI, VC, NXE |
| Non-Energy Minerals | 1,617 | NEM, FCX, AA, LYB, APD |
| Consumer Services | 418 | LVS, WYNN, RCL, CCL, MAR |
| Industrial Services | 334 | AZO, AAP, TDY, EMR, ROK |
| Transportation | 314 | LUV, UAL, ALK, MATX, SAIA |
| Commercial Services | 543 | ADP, PAYX, FAST, JKHY, CBRL |
| Process Industries | 493 | DOW, DD, LYB, CTXS, TREX |
| Health Services | 167 | ABT, ISRG, VEEV, INTU, ZVZZT |
| Distribution Services | 241 | WCC, PSB, UE, LMT, DHI |
| Miscellaneous | 6,548 | (Various small-cap and micro-cap stocks) |

---

## Available Industries (129 total, 17,464+ unique stocks)

Industries include (sample):
- Semiconductors & Equipment
- Software - Application
- Software - Infrastructure
- Internet Content & Info
- Biotechnology
- Pharmaceutical Preparation
- Medical Devices & Supplies
- Banks & Financial Services
- Real Estate Investment Trusts
- Auto Manufacturers
- Airlines
- Telecommunications Services
- Electric Utilities
- Oil, Gas & Consumable Fuels
- And 114+ more...

---

## Quick Examples

### Evaluate a single sector:
```bash
npm run dev -- "Electronic Technology"
npm run dev -- Healthcare
npm run dev -- Energy Minerals
```

### Evaluate a single industry:
```bash
npm run dev -- --industry "Semiconductors & Equipment"
npm run dev -- --industry "Software - Application"
npm run dev -- --industry "Biotechnology"
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


