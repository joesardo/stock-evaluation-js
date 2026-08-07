import fs from 'fs';
import path from 'path';

const WATCHLIST_FILE = path.join(process.cwd(), 'watchlist.json');

export interface Watchlist {
  tickers: string[];
  lastUpdated: string;
}

export class WatchlistManager {
  /**
   * Load the watchlist from file. Creates an empty watchlist if file doesn't exist.
   */
  static load(): Watchlist {
    try {
      if (fs.existsSync(WATCHLIST_FILE)) {
        const data = fs.readFileSync(WATCHLIST_FILE, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn('Failed to load watchlist, creating a new one');
    }

    return {
      tickers: [],
      lastUpdated: new Date().toISOString(),
    };
  }

  /**
   * Save the watchlist to file.
   */
  static save(watchlist: Watchlist): void {
    watchlist.lastUpdated = new Date().toISOString();
    fs.writeFileSync(WATCHLIST_FILE, JSON.stringify(watchlist, null, 2));
  }

  /**
   * Add a ticker to the watchlist (case-insensitive, prevents duplicates).
   */
  static addTicker(ticker: string): Watchlist {
    const watchlist = this.load();
    const upperTicker = ticker.toUpperCase().trim();

    if (!watchlist.tickers.includes(upperTicker)) {
      watchlist.tickers.push(upperTicker);
      watchlist.tickers.sort();
      this.save(watchlist);
    }

    return watchlist;
  }

  /**
   * Remove a ticker from the watchlist.
   */
  static removeTicker(ticker: string): Watchlist {
    const watchlist = this.load();
    const upperTicker = ticker.toUpperCase().trim();
    watchlist.tickers = watchlist.tickers.filter(t => t !== upperTicker);
    this.save(watchlist);
    return watchlist;
  }

  /**
   * Get all tickers in the watchlist.
   */
  static getTickers(): string[] {
    return this.load().tickers;
  }

  /**
   * Check if a ticker is in the watchlist.
   */
  static hasTicker(ticker: string): boolean {
    const watchlist = this.load();
    return watchlist.tickers.includes(ticker.toUpperCase().trim());
  }

  /**
   * Clear all tickers from the watchlist.
   */
  static clear(): Watchlist {
    const watchlist: Watchlist = {
      tickers: [],
      lastUpdated: new Date().toISOString(),
    };
    this.save(watchlist);
    return watchlist;
  }
}
