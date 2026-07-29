import axios from 'axios';
import { StockData } from './types';
import * as dotenv from 'dotenv';

dotenv.config();

export class DataFetcher {
  /**
   * Fetch stock data from Alpha Vantage API
   */
  static async fetchStockData(symbol: string): Promise<StockData> {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;

    if (!apiKey || apiKey === 'demo') {
      throw new Error(
        'ALPHA_VANTAGE_API_KEY not configured. Please add your API key to .env file. ' +
        'Get a free key at https://www.alphavantage.co/'
      );
    }

    try {
      const fetcher = new AlphaVantageDataFetcher(apiKey);
      const fundamentals = await fetcher.fetchFundamentals(symbol);
      
      // Try to fetch real-time price, but don't block if it fails (API rate limits)
      const latestPrice = await fetcher.fetchLatestPrice(symbol).catch(() => 0);
      
      return await fetcher.parseStockData(symbol, fundamentals, latestPrice);
    } catch (error) {
      throw new Error(
        `Failed to fetch data for ${symbol}: ${error instanceof Error ? error.message : String(error)}`
      );
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
