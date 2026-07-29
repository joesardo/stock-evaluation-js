import axios from 'axios';
import { StockData } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

export class DataFetcher {
  /**
   * Fetch stock data - tries yfinance first, falls back to Alpha Vantage
   */
  static async fetchStockData(symbol: string): Promise<StockData> {
    // Try yfinance first (no API key, no rate limits)
    try {
      console.log(`  → Fetching from yfinance...`);
      const yfinanceFetcher = new YFinanceDataFetcher();
      return await yfinanceFetcher.fetchStockData(symbol);
    } catch (yfinanceError) {
      console.log(`  ⚠️  yfinance failed: ${yfinanceError instanceof Error ? yfinanceError.message : String(yfinanceError)}`);
      
      // Fall back to Alpha Vantage
      const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
      if (!apiKey || apiKey === 'demo') {
        throw new Error(
          'Both data sources failed. yfinance error, and ALPHA_VANTAGE_API_KEY not configured. ' +
          'Please add your Alpha Vantage API key to .env file (get free key at https://www.alphavantage.co/)'
        );
      }

      try {
        console.log(`  → Falling back to Alpha Vantage...`);
        const fetcher = new AlphaVantageDataFetcher(apiKey);
        const fundamentals = await fetcher.fetchFundamentals(symbol);
        const latestPrice = await fetcher.fetchLatestPrice(symbol).catch(() => 0);
        return await fetcher.parseStockData(symbol, fundamentals, latestPrice);
      } catch (alphaError) {
        throw new Error(
          `Failed with both data sources - yfinance: ${yfinanceError instanceof Error ? yfinanceError.message : String(yfinanceError)}, ` +
          `Alpha Vantage: ${alphaError instanceof Error ? alphaError.message : String(alphaError)}`
        );
      }
    }
  }

  /**
   * Fetch multiple stocks
   */
  static async fetchMultipleStocks(symbols: string[]): Promise<StockData[]> {
    return Promise.all(symbols.map(s => this.fetchStockData(s)));
  }

  /**
   * Validate ticker symbol format
   */
  static isValidSymbol(symbol: string): boolean {
    // Basic validation: 1-5 uppercase letters
    return /^[A-Z]{1,5}$/.test(symbol.toUpperCase());
  }
}

/**
 * Example: Alpha Vantage integration
 * Requires API key from https://www.alphavantage.co/
 */
export class AlphaVantageDataFetcher {
  private apiKey: string;
  private baseUrl = 'https://www.alphavantage.co/query';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async fetchFundamentals(symbol: string): Promise<any> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'OVERVIEW',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey
        },
        timeout: 10000
      });

      if (response.data.Note) {
        throw new Error('API rate limit reached. Please try again later.');
      }

      if (!response.data.Symbol) {
        throw new Error(`Symbol ${symbol} not found`);
      }

      return response.data;
    } catch (error) {
      console.error(`Error fetching Alpha Vantage data: ${error}`);
      throw error;
    }
  }

  async fetchLatestPrice(symbol: string): Promise<number> {
    try {
      const response = await axios.get(this.baseUrl, {
        params: {
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase(),
          apikey: this.apiKey
        },
        timeout: 10000
      });

      const quote = response.data['Global Quote'];
      
      // Debug: Log the response to see format
      if (!quote || Object.keys(quote).length === 0) {
        console.log(`No quote data for ${symbol}, API response:`, response.data);
        return 0;
      }

      const price = parseFloat(quote['05. price'] || quote.price || 0);
      if (price > 0) {
        return price;
      }
      
      console.log(`Empty price for ${symbol}, quote data:`, quote);
      return 0;
    } catch (error) {
      console.error(`Error fetching latest price: ${error}`);
      return 0; // Return 0 if price fetch fails
    }
  }

  async parseStockData(symbol: string, fundamentals: any, latestPrice: number): Promise<StockData> {
    // Alpha Vantage field names mapping
    const safeParse = (value: any): number | null => {
      if (value === undefined || value === null || value === 'None' || value === '') return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Use real-time price from GLOBAL_QUOTE endpoint
    // If price is 0, it means API rate limit was hit or price fetch failed
    const currentPrice = latestPrice;

    // ROE comes as decimal (0.34 = 34%), need to multiply by 100
    const roe = safeParse(fundamentals.ReturnOnEquityTTM);
    const roePercent = roe ? roe * 100 : 0;

    // Dividend yield comes as decimal (0.0093 = 0.93%), need to multiply by 100
    const dividendYield = safeParse(fundamentals.DividendYield);
    const dividendYieldPercent = dividendYield ? dividendYield * 100 : 0;

    // Profit margin comes as decimal (0.393 = 39.3%)
    const profitMargin = safeParse(fundamentals.ProfitMargin);
    const profitMarginPercent = profitMargin ? profitMargin * 100 : null;

    // Earnings growth comes as decimal (0.234 = 23.4%)
    const earningsGrowth = safeParse(fundamentals.QuarterlyEarningsGrowthYOY);
    const earningsGrowthPercent = earningsGrowth ? earningsGrowth * 100 : null;

    // Revenue growth comes as decimal (0.183 = 18.3%)
    const revenueGrowth = safeParse(fundamentals.QuarterlyRevenueGrowthYOY);
    const revenueGrowthPercent = revenueGrowth ? revenueGrowth * 100 : null;

    // Calculate price position: where price sits in 52-week range (0-100%)
    // 0% = at 52-week low (undervalued)
    // 100% = at 52-week high (overvalued)
    const low = safeParse(fundamentals['52WeekLow']);
    const high = safeParse(fundamentals['52WeekHigh']);
    let pricePosition: number | null = null;
    if (low && high && low !== high) {
      pricePosition = ((currentPrice - low) / (high - low)) * 100;
    }

    return {
      symbol: symbol.toUpperCase(),
      company_name: fundamentals.Name || 'Unknown',
      price: currentPrice,
      pe_ratio: safeParse(fundamentals.PERatio) || safeParse(fundamentals.TrailingPE),
      pb_ratio: safeParse(fundamentals.PriceToBookRatio),
      dividend_yield: dividendYieldPercent,
      debt_to_equity: safeParse(fundamentals.DebtToEquity),
      current_ratio: safeParse(fundamentals.CurrentRatio),
      roe: roePercent,
      earnings_per_share: safeParse(fundamentals.EPS) || safeParse(fundamentals.DilutedEPSTTM),
      book_value_per_share: safeParse(fundamentals.BookValue),
      market_cap: safeParse(fundamentals.MarketCapitalization),
      fifty_two_week_high: safeParse(fundamentals['52WeekHigh']),
      fifty_two_week_low: safeParse(fundamentals['52WeekLow']),
      profit_margin: profitMarginPercent,
      earnings_growth: earningsGrowthPercent,
      revenue_growth: revenueGrowthPercent,
      price_position: pricePosition
    };
  }
}

/**
 * YFinance data fetcher using yahoo-finance2
 * Primary data source - no API key required, unlimited requests
 */
export class YFinanceDataFetcher {
  async fetchStockData(symbol: string): Promise<StockData> {
    try {
      // Import yahoo-finance2 - v11+ requires instantiation
      const YahooFinance = require('yahoo-finance2').default;
      const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });
      
      // Fetch quote data (price, 52-week range, etc.)
      const quote = await yf.quote(symbol);
      
      // Fetch summary data for fundamentals
      const modules = [
        'price',
        'summaryDetail',
        'financialData',
        'defaultKeyStatistics'
      ];
      const result = await yf.quoteSummary(symbol, { modules });
      
      return this.parseStockData(symbol, quote, result);
    } catch (error) {
      throw new Error(
        `Failed to fetch data from yfinance for ${symbol}: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private parseStockData(symbol: string, quote: any, summary: any): StockData {
    const safeParse = (value: any): number | null => {
      if (value === undefined || value === null || value === 'None' || value === '') return null;
      const parsed = parseFloat(value);
      return isNaN(parsed) ? null : parsed;
    };

    // Current price
    const currentPrice = safeParse(quote.regularMarketPrice);

    // P/E ratio
    const peRatio = safeParse(quote.trailingPE) || safeParse(summary?.financialData?.trailingPE);

    // P/B ratio  
    const pbRatio = safeParse(summary?.defaultKeyStatistics?.priceToBook);

    // Dividend yield (comes as decimal)
    const dividendYield = safeParse(summary?.summaryDetail?.dividendYield);
    const dividendYieldPercent = dividendYield ? dividendYield * 100 : 0;

    // ROE (comes as decimal)
    const roe = safeParse(summary?.financialData?.returnOnEquity);
    const roePercent = roe ? roe * 100 : 0;

    // Debt to Equity
    const debtToEquity = safeParse(summary?.financialData?.debtToEquity);

    // Current ratio
    const currentRatio = safeParse(summary?.financialData?.currentRatio);

    // EPS
    const eps = safeParse(quote.epsTrailingTwelveMonths);

    // Book value per share
    const bookValue = safeParse(summary?.defaultKeyStatistics?.bookValue);

    // Market cap
    const marketCap = safeParse(quote.marketCap);

    // 52-week range
    const fiftyTwoWeekHigh = safeParse(quote.fiftyTwoWeekHigh);
    const fiftyTwoWeekLow = safeParse(quote.fiftyTwoWeekLow);

    // Profit margin (comes as decimal)
    const profitMargin = safeParse(summary?.financialData?.profitMargins);
    const profitMarginPercent = profitMargin ? profitMargin * 100 : null;

    // Earnings growth YoY (comes as decimal)
    const earningsGrowth = safeParse(summary?.financialData?.earningsGrowth);
    const earningsGrowthPercent = earningsGrowth ? earningsGrowth * 100 : null;

    // Revenue growth YoY (comes as decimal)
    const revenueGrowth = safeParse(summary?.financialData?.revenueGrowth);
    const revenueGrowthPercent = revenueGrowth ? revenueGrowth * 100 : null;

    // Price position in 52-week range
    let pricePosition: number | null = null;
    if (fiftyTwoWeekLow && fiftyTwoWeekHigh && fiftyTwoWeekLow !== fiftyTwoWeekHigh && currentPrice) {
      pricePosition = ((currentPrice - fiftyTwoWeekLow) / (fiftyTwoWeekHigh - fiftyTwoWeekLow)) * 100;
    }

    return {
      symbol: symbol.toUpperCase(),
      company_name: quote.longName || quote.shortName || 'Unknown',
      price: currentPrice || 0,
      pe_ratio: peRatio,
      pb_ratio: pbRatio,
      dividend_yield: dividendYieldPercent,
      debt_to_equity: debtToEquity,
      current_ratio: currentRatio,
      roe: roePercent,
      earnings_per_share: eps,
      book_value_per_share: bookValue,
      market_cap: marketCap,
      fifty_two_week_high: fiftyTwoWeekHigh,
      fifty_two_week_low: fiftyTwoWeekLow,
      profit_margin: profitMarginPercent,
      earnings_growth: earningsGrowthPercent,
      revenue_growth: revenueGrowthPercent,
      price_position: pricePosition
    };
  }
}
