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
   * Comprehensive list of well-known stocks to bootstrap sector detection
   * These ~280 stocks cover all major sectors and serve as anchors
   */
  private static readonly BOOTSTRAP_STOCKS = [
    // Technology - Large Cap
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'META', 'NVDA', 'INTC', 'AMD', 'TSLA',
    // Technology - Software/Cloud
    'CRM', 'ADBE', 'NFLX', 'SNOW', 'CRWD', 'NET', 'DDOG', 'OKTA', 'WDAY', 'TWLO', 'ZOOM', 'SHOP', 'MONGODB', 'DATADOG', 'SUMO',
    // Technology - Semiconductors
    'QCOM', 'AVGO', 'ASML', 'MU', 'NXPI', 'MCHP', 'BROADCOM', 'MICRON', 'QUALCOMM', 'XILINX', 'AMAT', 'LRCX', 'KLAC', 'MRVL',
    // Technology - Hardware/Peripherals
    'CORSAIR', 'LOGITECH', 'HP', 'DELL', 'LENOVO',
    // Communication Services
    'GOOGL', 'META', 'NFLX', 'VZ', 'T', 'TMUS', 'CHTR', 'CMCSA', 'DISH', 'ROKU', 'FUBO', 'PENN', 'SNAP', 'PINS', 'TTD', 'MSTR',
    // Healthcare - Large Pharma
    'JNJ', 'UNH', 'LLY', 'PFE', 'AZN', 'ABBV', 'TMO', 'AMGN', 'MERCK', 'BRISTOL', 'REGENERON', 'VERTEX', 'GILEAD', 'BRISTOL', 'MODERNA',
    // Healthcare - Healthcare Services
    'CVS', 'WBA', 'ANET', 'HUM', 'CI', 'ANTM', 'GILD', 'VEEV',
    // Healthcare - Medical Devices
    'MEDTRONIC', 'STRYKER', 'INTUITIVE', 'ZIMMER', 'EDWARDS', 'BOSTON', 'BAXTER', 'FRESENIUS', 'ALIGN',
    // Healthcare - Biotech
    'MRNA', 'BNTX', 'INOVIO', 'VRTX', 'CRSP', 'EDIT', 'VERV', 'SRPT', 'IMAB', 'BEAM',
    // Financials - Banks
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'AXP', 'COF', 'C', 'PNC', 'USB', 'TFC', 'FITB', 'HBAN', 'KEY', 'ZION', 'EWBC', 'PACW',
    // Financials - Insurance
    'BRK', 'AIG', 'ALL', 'LPL', 'HLF', 'MMC', 'AON', 'ICE', 'CBOE', 'NDAQ',
    // Financials - Investment/Brokerage
    'SCHW', 'TD', 'IBKR', 'VLTI', 'MUFG', 'DFS',
    // Consumer Cyclical - Retail
    'AMZN', 'WMT', 'COST', 'MCD', 'HD', 'TJX', 'TGT', 'AZO', 'FIVE', 'ROST', 'ULTA', 'DLTR', 'CERN', 'CBRL', 'SHAK', 'DINE',
    // Consumer Cyclical - Fashion/Apparel
    'NKE', 'LULU', 'YUM', 'MKL', 'VF', 'UAA', 'ATHM', 'EBAY',
    // Consumer Cyclical - Restaurants
    'SBUX', 'DPZ', 'CPRI', 'EAT', 'WING', 'QSR', 'MMS',
    // Consumer Cyclical - Automotive
    'F', 'GM', 'TM', 'HMC', 'BMW', 'RACE', 'NIO', 'LI', 'XPEV', 'RIVN', 'LCID', 'POLESTAR',
    // Consumer Defensive
    'PG', 'KO', 'PEP', 'MO', 'PM', 'MNST', 'KEURIG', 'CPB', 'GIS', 'K', 'MDLZ', 'NSRGY',
    // Industrials - Aerospace/Defense
    'BA', 'RTX', 'LMT', 'NOC', 'GD', 'HII', 'TDG', 'SPX', 'GE', 'RKLB',
    // Industrials - Machinery/Equipment
    'CAT', 'CNH', 'DOOO', 'AAON', 'AYI', 'BLDR', 'RH',
    // Industrials - Electrical Equipment
    'MMM', 'ABB', 'EATON', 'ROP', 'INGR', 'OTIS', 'CARR', 'GMTX',
    // Industrials - Diversified
    'HON', 'ITT', 'IDXX', 'WM', 'RSG', 'VEON', 'CP', 'NSC', 'UNP', 'CSX', 'KSU', 'ALK', 'DAL', 'UAL', 'AAL', 'JBLU', 'SAVE',
    // Energy - Oil & Gas
    'XOM', 'CVX', 'COP', 'MPC', 'PSX', 'VLO', 'FANG', 'OXY', 'PXD', 'CIVI', 'EOG', 'HES', 'EOG', 'TRGC', 'EQT', 'CMPR',
    // Energy - Pipelines
    'OKE', 'KMI', 'EPD', 'MMP', 'APL', 'PAA', 'AM', 'WEC', 'ES',
    // Utilities - Electric
    'DUK', 'SO', 'AEP', 'ES', 'EXC', 'PEG', 'NEE', 'FE', 'CMS', 'WEC', 'AWK', 'NWN', 'EQT', 'UGI',
    // Utilities - Gas
    'ONE', 'ATR', 'AVNT', 'CMS', 'NWN', 'UGI', 'SJW',
    // Renewables/Clean Energy
    'NEE', 'PLUG', 'ENPH', 'RUN', 'SEDG', 'ADANIGREEN', 'ADANIPOWER', 'ADANITRANS', 'RELIANCE', 'ACME',
    // Real Estate - Retail
    'SPG', 'KIM', 'WRI', 'PEI', 'TCO', 'MAC',
    // Real Estate - Industrial
    'PLD', 'DRE', 'EGP', 'STAG', 'PLD', 'VICI', 'STAG',
    // Real Estate - Residential
    'EXR', 'PSA', 'CUBE', 'WELL', 'UMH', 'NHI', 'CTRE', 'AIV',
    // Real Estate - Diversified
    'AMT', 'VICI', 'SPG', 'O', 'ABBV', 'ADC', 'REXR', 'IRM', 'SRC', 'LAMR',
    // Materials - Metals & Mining
    'NEM', 'FCX', 'AA', 'SCCO', 'ALB', 'RIO', 'BHP', 'VALE', 'TECK', 'NUCOR', 'CLF', 'TX', 'RSG',
    // Materials - Chemicals
    'LYB', 'APD', 'SHW', 'CTVA', 'CE', 'DD', 'ECL', 'EMN', 'IFF', 'PPG', 'WRK',
    // Materials - Construction/Aerospace
    'MLM', 'LEG', 'APO', 'SWX', 'UFPI', 'WMS', 'HUBB',
    // Basic Materials
    'CX', 'SLVM', 'AVNT', 'ADANIGREEN', 'ADANIPOWER',
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
