import * as fs from 'fs';
import * as path from 'path';

interface SectorData {
  [sector: string]: {
    name: string;
    symbols: string[];
  };
}

interface SectorCache {
  timestamp: number;
  sectors: SectorData;
}

/**
 * Dynamically build sector watchlists from Yahoo Finance
 * Fetches sector/industry data for a set of known stocks
 */
export class SectorBuilder {
  private static readonly CACHE_PATH = path.join(__dirname, '..', 'cache', 'sectors.json');
  private static readonly CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * List of well-known stocks to bootstrap sector detection
   * These stocks cover major sectors and serve as anchors
   */
  private static readonly BOOTSTRAP_STOCKS = [
    // Technology
    'AAPL', 'MSFT', 'GOOGL', 'META', 'NVDA', 'INTC', 'AMD', 'CRM', 'ADBE', 'NFLX',
    // Semiconductors
    'QCOM', 'AVGO', 'ASML', 'MU', 'NXPI', 'MCHP',
    // Cloud/Software
    'SNOW', 'CRWD', 'NET', 'DDOG', 'OKTA', 'WDAY',
    // Finance
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'AXP', 'COF',
    // Healthcare
    'JNJ', 'UNH', 'LLY', 'PFE', 'AZN', 'ABBV', 'TMO', 'AMGN',
    // Biotech
    'MRNA', 'REGN', 'VRTX', 'CRSP', 'GILD',
    // Industrials
    'BA', 'GE', 'MMM', 'HON', 'CAT', 'RTX', 'LMT', 'NOC',
    // Airlines
    'DAL', 'UAL', 'AAL', 'ALK', 'JBLU',
    // Automotive/EV
    'TSLA', 'F', 'GM', 'TM', 'LI', 'NIO', 'RIVN',
    // Consumer
    'AMZN', 'WMT', 'COST', 'MCD', 'NKE', 'SBUX', 'HD', 'TJX',
    // Energy
    'XOM', 'CVX', 'COP', 'MPC', 'PSX', 'VLO', 'OKE', 'KMI',
    // Renewables
    'NEE', 'PLUG', 'ENPH', 'RUN', 'SEDG',
    // Telecom
    'VZ', 'T', 'TMUS', 'CHTR', 'CMCSA',
    // Utilities
    'DUK', 'SO', 'AEP', 'ES', 'EXC', 'PEG',
    // Real Estate
    'SPG', 'PLD', 'EXR', 'PSA', 'WELL',
    // Materials
    'NEM', 'FCX', 'AA', 'SCCO', 'ALB',
  ];

  /**
   * Get sectors from cache or build new sectors
   */
  static async getSectors(): Promise<SectorData> {
    // Check cache first
    const cached = this.loadCache();
    if (cached) {
      console.log('📦 Using cached sectors (built ' + new Date(cached.timestamp).toLocaleString() + ')');
      return cached.sectors;
    }

    console.log('🔄 Building sector watchlists from Yahoo Finance...');
    const sectors = await this.buildSectors();
    
    // Save cache
    this.saveCache(sectors);
    
    return sectors;
  }

  /**
   * Build sectors by fetching data from Yahoo Finance
   */
  private static async buildSectors(): Promise<SectorData> {
    const yf = require('yahoo-finance2').default;
    const yfinance = new yf({ suppressNotices: ['yahooSurvey'] });

    const sectors: SectorData = {};

    for (const symbol of this.BOOTSTRAP_STOCKS) {
      try {
        // Fetch quote summary with sector info
        const quote = await yfinance.quote(symbol);
        const summary = await yfinance.quoteSummary(symbol, {
          modules: ['assetProfile']
        });

        const sector = summary?.assetProfile?.sector || 'Unknown';
        const industry = summary?.assetProfile?.industry || 'Unknown';

        // Use sector as primary grouping, fallback to industry
        const category = sector !== 'Unknown' ? sector : industry;

        if (!sectors[category]) {
          sectors[category] = {
            name: category,
            symbols: []
          };
        }

        if (!sectors[category].symbols.includes(symbol)) {
          sectors[category].symbols.push(symbol);
        }

        console.log(`  ✓ ${symbol} → ${category}`);
      } catch (error) {
        console.log(`  ✗ ${symbol} → Failed (${error instanceof Error ? error.message : 'Unknown error'})`);
      }
    }

    return sectors;
  }

  /**
   * Load sectors from cache if valid
   */
  private static loadCache(): SectorCache | null {
    try {
      if (!fs.existsSync(this.CACHE_PATH)) {
        return null;
      }

      const cached = JSON.parse(fs.readFileSync(this.CACHE_PATH, 'utf-8')) as SectorCache;
      const age = Date.now() - cached.timestamp;

      if (age > this.CACHE_TTL) {
        console.log('⏰ Cache expired, rebuilding...');
        return null;
      }

      return cached;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save sectors to cache
   */
  private static saveCache(sectors: SectorData): void {
    try {
      const cacheDir = path.dirname(this.CACHE_PATH);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const cache: SectorCache = {
        timestamp: Date.now(),
        sectors
      };

      fs.writeFileSync(this.CACHE_PATH, JSON.stringify(cache, null, 2));
      console.log('💾 Sectors cached for 24 hours');
    } catch (error) {
      console.error('Warning: Could not save cache:', error);
    }
  }

  /**
   * Clear cache to force rebuild
   */
  static clearCache(): void {
    try {
      if (fs.existsSync(this.CACHE_PATH)) {
        fs.unlinkSync(this.CACHE_PATH);
        console.log('🗑️  Cache cleared');
      }
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }
}
