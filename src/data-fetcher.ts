import axios from 'axios';
import { StockData } from './types';

export class DataFetcher {
  /**
   * Fetch stock data from available sources
   * Currently uses mock data - integrate with real APIs as needed
   */
  static async fetchStockData(symbol: string): Promise<StockData> {
    // TODO: Implement real API integrations
    // Options:
    // 1. Alpha Vantage (free tier: https://www.alphavantage.co/)
    // 2. Financial Modeling Prep (free tier: https://financialmodelingprep.com/)
    // 3. IEX Cloud (free tier: https://iexcloud.io/)
    // 4. Yahoo Finance Scraping (via yfinance-like library)

    // For now, return mock data structure that can be replaced
    return {
      symbol: symbol.toUpperCase(),
      company_name: `${symbol} Corp`,
      price: 150.0,
      pe_ratio: 22.5,
      pb_ratio: 3.2,
      dividend_yield: 1.5,
      debt_to_equity: 0.8,
      current_ratio: 1.8,
      roe: 25.5,
      earnings_per_share: 6.67,
      book_value_per_share: 46.88,
      market_cap: 2_500_000_000_000,
      fifty_two_week_high: 199.62,
      fifty_two_week_low: 124.17
    };
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

  async parseStockData(symbol: string, fundamentals: any): Promise<StockData> {
    return {
      symbol: symbol.toUpperCase(),
      company_name: fundamentals.Name || 'Unknown',
      price: parseFloat(fundamentals.LatestPrice || 0),
      pe_ratio: parseFloat(fundamentals.PERatio || 0) || null,
      pb_ratio: parseFloat(fundamentals.PriceToBookRatio || 0) || null,
      dividend_yield: parseFloat(fundamentals.DividendYield || 0) || 0,
      debt_to_equity: parseFloat(fundamentals.DebtToEquity || 0) || null,
      current_ratio: parseFloat(fundamentals.CurrentRatio || 0) || null,
      roe: parseFloat(fundamentals.ReturnOnEquityTTM || 0) || 0,
      earnings_per_share: parseFloat(fundamentals.EPS || 0) || null,
      book_value_per_share: parseFloat(fundamentals.BookValue || 0) || null,
      market_cap: parseFloat(fundamentals.MarketCapitalization || 0) || null,
      fifty_two_week_high: parseFloat(fundamentals.YearHigh || 0) || null,
      fifty_two_week_low: parseFloat(fundamentals.YearLow || 0) || null
    };
  }
}
