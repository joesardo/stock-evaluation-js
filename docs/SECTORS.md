# Available Stock Sectors

This guide lists all available sectors you can use to evaluate groups of stocks at once. Sectors are **dynamically pulled from Yahoo Finance** based on their official sector classifications.

## Usage

Run evaluations for an entire sector with:

```bash
npm run dev -- SECTOR_NAME
```

Replace `SECTOR_NAME` with any of the sector names listed below (e.g., `Tech`, `Healthcare`, `Energy`).

## Rebuilding Sectors

To update sectors with the latest data from Yahoo Finance, run:

```bash
npm run dev -- --rebuild-sectors
```

This will fetch sector data for 200+ stocks and cache the results.

---

## Available Sectors

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

## Notes

- **Real Yahoo Finance Data:** Sectors are derived directly from Yahoo Finance's official sector classifications, not manually crafted categories
- **Dynamic Updates:** Run `--rebuild-sectors` periodically to keep sector data current
- **Overlapping Stocks:** Some stocks may appear in multiple sectors depending on their primary Yahoo Finance classification
- **Case-Insensitive:** `npm run dev -- tech`, `npm run dev -- TECH`, and `npm run dev -- Tech` all work the same way


