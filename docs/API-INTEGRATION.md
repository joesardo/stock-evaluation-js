# Stock Evaluation Tool - API Integration Guide

This document covers integrating real stock data APIs.

## Free API Options

### 1. Alpha Vantage (Recommended for Getting Started)

**Free Tier:** 5 requests per minute, 500 per day
**Site:** https://www.alphavantage.co/

**Pros:**
- Easy to use REST API
- Includes fundamental data (P/E, P/B, dividend, debt, etc.)
- Free tier is generous for personal use

**Cons:**
- Rate limited
- Some data fields may be delayed

**Integration:**
```typescript
// In .env
ALPHA_VANTAGE_API_KEY=your_key_here

// Usage in data-fetcher.ts
const fetcher = new AlphaVantageDataFetcher(process.env.ALPHA_VANTAGE_API_KEY!);
const fundamentals = await fetcher.fetchFundamentals('AAPL');
const stockData = await fetcher.parseStockData('AAPL', fundamentals);
```

### 2. Financial Modeling Prep

**Free Tier:** 250 requests per day
**Site:** https://financialmodelingprep.com/

**Pros:**
- More API calls in free tier
- Good financial ratios data
- Stock price and historical data

**Cons:**
- Requires separate registration
- Documentation could be better

**Endpoints of Interest:**
```
/api/v3/income-statement/{symbol}
/api/v3/balance-sheet-statement/{symbol}
/api/v3/quote/{symbol}
/api/v3/ratios/{symbol}
```

### 3. IEX Cloud

**Free Tier:** 100 messages/month
**Site:** https://iexcloud.io/

**Pros:**
- Clean API
- Good historical data
- Stock ipos and news

**Cons:**
- Lower free tier limit
- More focused on price data than fundamentals

### 4. Yahoo Finance (Web Scraping)

**Cost:** Free, no API key needed
**Site:** https://finance.yahoo.com/

**Pros:**
- Most comprehensive data source
- No registration needed
- Lots of financial metrics available

**Cons:**
- Requires web scraping (terms of service unclear)
- Less stable than official APIs
- May be detected and blocked

**Popular Libraries:**
- `yfinance` (Python, but can run as subprocess)
- `yahoo-finance2` (JavaScript/Node)
- `polygon.io` (offers some free data, newer)

## Implementing Alpha Vantage Integration

### Step 1: Setup

```bash
# Add dotenv to load environment variables
npm install dotenv
```

### Step 2: Create .env File

```
ALPHA_VANTAGE_API_KEY=demo  # Get real key from https://www.alphavantage.co/
```

### Step 3: Update data-fetcher.ts

Replace the mock `DataFetcher.fetchStockData()` with:

```typescript
export class DataFetcher {
  static async fetchStockData(symbol: string): Promise<StockData> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    
    if (!apiKey) {
      throw new Error('ALPHA_VANTAGE_API_KEY not set in .env');
    }

    const fetcher = new AlphaVantageDataFetcher(apiKey);
    try {
      const fundamentals = await fetcher.fetchFundamentals(symbol);
      return await fetcher.parseStockData(symbol, fundamentals);
    } catch (error) {
      console.error(`Failed to fetch ${symbol}:`, error);
      throw error;
    }
  }
}
```

### Step 4: Handle Rate Limiting

```typescript
// Add retry logic with exponential backoff
async function fetchWithRetry(
  fn: () => Promise<any>,
  maxRetries = 3
): Promise<any> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (error.response?.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        console.log(`Rate limited. Waiting ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

## Combining Multiple Data Sources

For robustness, fetch from multiple sources and merge:

```typescript
export class DataFetcher {
  static async fetchStockData(symbol: string): Promise<StockData> {
    const sources = [
      () => this.fetchFromAlphaVantage(symbol),
      () => this.fetchFromFinancialModelingPrep(symbol),
      () => this.fetchFromFallback(symbol)
    ];

    for (const source of sources) {
      try {
        return await source();
      } catch (error) {
        console.warn(`Source failed, trying next...`);
      }
    }

    throw new Error(`All data sources failed for ${symbol}`);
  }
}
```

## Caching Strategy

Implement caching to reduce API calls:

```typescript
const cache = new Map<string, { data: StockData; timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

export class DataFetcher {
  static async fetchStockData(symbol: string): Promise<StockData> {
    const cached = cache.get(symbol);
    
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`Using cached data for ${symbol}`);
      return cached.data;
    }

    const data = await this.fetchFromAPI(symbol);
    cache.set(symbol, { data, timestamp: Date.now() });
    return data;
  }
}
```

## Database Storage for Historical Data

Consider using SQLite for local storage:

```typescript
import Database from 'better-sqlite3';

const db = new Database('stock-data.db');

// Create table
db.exec(`
  CREATE TABLE IF NOT EXISTS stock_data (
    id INTEGER PRIMARY KEY,
    symbol TEXT,
    date TEXT,
    price REAL,
    pe_ratio REAL,
    -- ... other fields
    UNIQUE(symbol, date)
  )
`);

// Store data
function saveStockData(stock: StockData) {
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO stock_data 
    (symbol, date, price, pe_ratio, ...)
    VALUES (?, ?, ?, ?, ...)
  `);
  stmt.run(stock.symbol, new Date().toISOString(), stock.price, stock.pe_ratio);
}
```

## Error Handling Best Practices

```typescript
class APIError extends Error {
  constructor(
    public symbol: string,
    public source: string,
    message: string
  ) {
    super(message);
  }
}

async function fetchWithErrorHandling(symbol: string) {
  try {
    return await fetch(symbol);
  } catch (error) {
    if (error instanceof TypeError) {
      throw new APIError(symbol, 'network', 'Network connection failed');
    }
    if (error instanceof TimeoutError) {
      throw new APIError(symbol, 'timeout', 'Request timeout');
    }
    throw new APIError(symbol, 'unknown', String(error));
  }
}
```

## Testing API Integration

```bash
# Test with mock data (current)
npm run dev -- AAPL

# Test with real API (after setup)
ALPHA_VANTAGE_API_KEY=your_key npm run dev -- AAPL MSFT GOOGL
```

## Monitoring and Logging

```typescript
import { createWriteStream } from 'fs';

const logStream = createWriteStream('stock-evaluation.log', { flags: 'a' });

function log(message: string) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  process.stdout.write(logMessage);
  logStream.write(logMessage);
}
```

## Rate Limit Tracking

```typescript
class APIRateLimiter {
  private calls: number[] = [];
  private maxCalls: number;
  private windowMs: number;

  constructor(maxCalls: number, windowMs: number) {
    this.maxCalls = maxCalls;
    this.windowMs = windowMs;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const now = Date.now();
    this.calls = this.calls.filter(time => now - time < this.windowMs);

    if (this.calls.length >= this.maxCalls) {
      const oldestCall = this.calls[0];
      const waitTime = this.windowMs - (now - oldestCall);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.calls.push(Date.now());
    return fn();
  }
}
```

## Next Steps

1. Choose your preferred API (Alpha Vantage recommended for start)
2. Get API key from provider
3. Update .env file
4. Implement data fetching in data-fetcher.ts
5. Test with real data
6. Add error handling and retries
7. Implement caching for efficiency
