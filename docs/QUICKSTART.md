# Quick Start Guide

## 1. Installation

```bash
npm install
```

## 2. Run with Mock Data (Immediate Testing)

```bash
npm run dev -- AAPL MSFT GOOGL TSLA
```

You'll see evaluation results with sample data immediately.

## 3. Setup Real Data (Optional)

### A. Get a Free API Key

Visit: https://www.alphavantage.co/

Click "GET FREE API KEY" and follow the steps. Takes 1 minute.

### B. Create .env File

```bash
cp .env.example .env
```

Edit `.env` and add your API key:
```
ALPHA_VANTAGE_API_KEY=your_key_here
```

### C. Update Data Fetcher

Edit `src/data-fetcher.ts` - change the `fetchStockData` function to use the real API:

```typescript
static async fetchStockData(symbol: string): Promise<StockData> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
  if (!apiKey || apiKey === 'demo') {
    throw new Error('Please set ALPHA_VANTAGE_API_KEY in .env');
  }
  const fetcher = new AlphaVantageDataFetcher(apiKey);
  const fundamentals = await fetcher.fetchFundamentals(symbol);
  return await fetcher.parseStockData(symbol, fundamentals);
}
```

### D. Rebuild and Run

```bash
npm run build
npm run dev -- AAPL
```

## Understanding the Output

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Stock Evaluation Report: AAPL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Company: Apple Inc.
Current Price: $185.25
Evaluation Date: 7/28/2026
Data Confidence: 100.0%

Metric Scores:
├─ P/E Ratio (20.5): ⭐⭐⭐⭐ (4.0/5.0) - Weight: 20%
├─ P/B Ratio (3.0): ⭐⭐⭐ (2.5/5.0) - Weight: 15%
├─ Dividend Yield (0.42%): ⭐ (1.0/5.0) - Weight: 15%
├─ Debt-to-Equity (1.2): ⭐⭐⭐ (3.0/5.0) - Weight: 20%
├─ Current Ratio (1.05): ⭐⭐⭐⭐ (4.0/5.0) - Weight: 15%
└─ ROE (165.4%): ⭐⭐⭐⭐⭐ (5.0/5.0) - Weight: 15%

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Overall Score: 76/100
Recommendation: 🟢 BUY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Key Factors:
  ✓ Return on Equity (%): 165.40 is excellent
  ✓ Debt-to-Equity Ratio: 1.20 is excellent
  ✓ P/E Ratio: 20.50 is excellent
  ⚠ Dividend Yield: 0.42 is concerning

📌 Disclaimer: This is not financial advice. Always do your own research.
```

### What Do the Scores Mean?

- **Overall Score**: 0-100 rating
- **Stars**: Visual representation of individual metric score (0-5)
- **Weights**: How much each metric influences the final score
- **Confidence**: Percentage of available data (100% = all metrics available)

### Recommendation Meanings

```
🟢 STRONG BUY  (90-100)  - Excellent investment opportunity
🟢 BUY          (70-89)   - Good investment opportunity
🟡 HOLD         (50-69)   - Balanced characteristics
🔴 SELL         (30-49)   - Below average investment
🔴 STRONG SELL  (0-29)    - Poor investment opportunity
```

## Customizing Scores

Edit `config/evaluation-criteria.json` to adjust:

1. **Weights**: How important each metric is (sum should equal 1.0)
2. **Thresholds**: What values get what scores
3. **inverseScore**: Toggle if lower is better

Example: Make Dividend Yield more important:
```json
{
  "dividend_yield": {
    "weight": 0.25,  // Was 0.15
    "description": "Dividend Yield (%)",
    "inverseScore": false,
    "thresholds": {
      "excellent": 3.0,
      "good": 2.0,
      "fair": 1.0,
      "poor": 0.5
    }
  }
}
```

Then rebuild:
```bash
npm run build
npm run dev -- AAPL
```

## Common Tasks

### Evaluate a single stock
```bash
npm run dev -- AAPL
```

### Evaluate multiple stocks at once
```bash
npm run dev -- AAPL MSFT GOOGL TSLA AMZN
```

### Build for production
```bash
npm run build
node dist/index.js AAPL
```

### Check for TypeScript errors
```bash
npm run lint
```

### Clean build artifacts
```bash
npm run clean
```

## Troubleshooting

**Error: "Cannot find module 'axios'"**
```bash
npm install
```

**Error: "API rate limit reached"**
- Free Alpha Vantage tier is limited to 5 requests/minute
- Wait 1 minute before making more requests
- Use mock data for testing

**Error: "Symbol not found"**
- Ensure symbol is 1-5 uppercase letters
- Check the company is publicly traded
- Symbol may be delisted

**Missing metrics in output**
- Some companies don't have all financial data available
- Check "Data Confidence" percentage
- Free APIs may not have all historical data

## Next Steps

1. Integrate real API data (see API-INTEGRATION.md)
2. Customize evaluation criteria for your needs
3. Add more financial metrics (cash flow, growth rates, etc.)
4. Build a web UI for visualization
5. Add portfolio analysis features

## Support

See DEVELOPMENT.md for deeper documentation.

## Disclaimer

⚠️ This tool is for educational purposes only. It does not constitute financial advice. Always do your own research and consult with a financial advisor before making investment decisions. Past performance is not indicative of future results.
