# Available Stock Sectors & Categories

This guide lists all available sectors you can use to evaluate groups of stocks at once.

## Usage

Run evaluations for an entire sector or category with:

```bash
npm run dev -- SECTOR_NAME
```

Replace `SECTOR_NAME` with any of the single-word sector names listed below (e.g., `Tech`, `Healthcare`, `Automotive`).

---

## Technology & Software

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `Tech` | Technology | 33 |
| `Semiconductors` | Semiconductors & Chips | 13 |
| `SoftwareServices` | Software & Services | 12 |

**Examples:**
```bash
npm run dev -- Tech
npm run dev -- Semiconductors
npm run dev -- SoftwareServices
```

---

## Media & Communications

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `Media` | Media & Entertainment | 10 |
| `Telecom` | Telecommunications | 5 |

**Examples:**
```bash
npm run dev -- Media
npm run dev -- Telecom
```

---

## Consumer & Retail

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `Retail` | Retail & Consumer | 19 |
| `Staples` | Consumer Staples | 11 |
| `Automotive` | Automotive & EVs | 11 |
| `Beverages` | Beverages & Tobacco | 5 |
| `Furniture` | Furniture & Home | 2 |
| `Tobacco` | Tobacco | 2 |

**Examples:**
```bash
npm run dev -- Retail
npm run dev -- Automotive
npm run dev -- Staples
npm run dev -- Beverages
```

---

## Healthcare & Life Sciences

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `Healthcare` | Healthcare & Pharma | 14 |
| `Biotech` | Biotechnology | 7 |

**Examples:**
```bash
npm run dev -- Healthcare
npm run dev -- Biotech
```

---

## Energy & Utilities

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `Energy` | Energy & Oil | 14 |
| `Renewables` | Renewable Energy | 5 |
| `Utilities` | Utilities | 14 |

**Examples:**
```bash
npm run dev -- Energy
npm run dev -- Renewables
npm run dev -- Utilities
```

---

## Financial Services

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `Banking` | Banking & Financial Services | 17 |
| `Finance` | Finance & Insurance | 12 |
| `Insurance` | Insurance & Risk Management | 5 |

**Examples:**
```bash
npm run dev -- Banking
npm run dev -- Finance
npm run dev -- Insurance
```

---

## Industrial & Materials

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `Industrial` | Industrials & Manufacturing | 15 |
| `Aerospace` | Aerospace & Defense | 7 |
| `Materials` | Materials & Chemicals | 26 |
| `Mining` | Mining & Metals | 10 |
| `Transportation` | Transportation & Logistics | 9 |
| `Waste` | Waste Management | 2 |

**Examples:**
```bash
npm run dev -- Industrial
npm run dev -- Aerospace
npm run dev -- Materials
npm run dev -- Mining
npm run dev -- Transportation
```

---

## Real Estate

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `RealEstate` | Real Estate & REITs | 21 |

**Examples:**
```bash
npm run dev -- RealEstate
```

---

## Specialized & Niche

| Command | Full Name | Stocks |
|---------|-----------|--------|
| `Gaming` | Gaming & Entertainment | 2 |

**Examples:**
```bash
npm run dev -- Gaming
```

---

## Quick Tips

- **No spaces needed:** Use `npm run dev -- Tech` instead of `npm run dev -- Technology`
- **Case-insensitive:** `npm run dev -- tech`, `npm run dev -- TECH`, and `npm run dev -- Tech` all work
- **Multiple tickers:** You can still evaluate individual stocks: `npm run dev -- AAPL MSFT GOOGL`
- **Top performers:** See top stocks across all sectors: `npm run dev -- --top 10`
- **Your watchlist:** Evaluate only stocks you're tracking: `npm run dev -- --watchlist`

---

## Total Coverage

- **31 specialized sectors/categories**
- **300+ stocks** across all sectors
- Multiple overlapping categories for deeper analysis (e.g., a semiconductor stock appears in both `Tech` and `Semiconductors`)

