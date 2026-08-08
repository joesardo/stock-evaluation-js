import * as fs from 'fs';
import * as path from 'path';

interface SectorData {
  [sector: string]: {
    name: string;
    symbols: string[];
  };
}

interface IndustryData {
  [industry: string]: {
    name: string;
    symbols: string[];
  };
}

interface SectorCache {
  sectors: SectorData;
  industries?: IndustryData;
}

/**
 * Dynamically build sector watchlists from Yahoo Finance
 * Fetches sector/industry data for comprehensive stock coverage
 */
export class SectorBuilder {
  private static readonly CACHE_PATH = path.join(__dirname, '..', 'cache', 'sectors.json');

  /**
   * Load stocks from TradingView data source
   * The all-stocks-by-sector.json file contains verified stocks grouped by TradingView sectors
   */
  private static loadStocksFromTradingView(): string[] {
    try {
      const dataPath = path.join(__dirname, '..', 'all-stocks-by-sector.json');
      if (!fs.existsSync(dataPath)) {
        console.error('❌ all-stocks-by-sector.json not found. Run: node sectors-fetch.js');
        return [];
      }

      const sectorData = JSON.parse(fs.readFileSync(dataPath, 'utf-8')) as Record<string, string[]>;
      const allStocks = new Set<string>();
      
      Object.values(sectorData).forEach(stocks => {
        stocks.forEach(stock => allStocks.add(stock));
      });

      return Array.from(allStocks).sort();
    } catch (error) {
      console.error('Error loading TradingView stocks:', error);
      return [];
    }
  }

  /**
   * Comprehensive list of stocks across all major sectors and market caps
   * This list is now loaded from TradingView's verified data source
   */
  private static getStocks(): string[] {
    return this.loadStocksFromTradingView();
  }

  /**
   * Get sectors from cache or build new sectors
   */
  static async getSectors(): Promise<SectorData> {
    // Check cache first
    const cached = this.loadCache();
    if (cached?.sectors) {
      console.log('📦 Using cached sectors');
      return cached.sectors;
    }

    console.log('🔄 Loading sector data from TradingView source...');
    const sectors = await this.buildSectors();
    
    // Save cache, preserving industries
    const currentIndustries = cached?.industries;
    this.saveCache(sectors, currentIndustries);
    
    return sectors;
  }

  /**
   * Build sectors by loading from TradingView data and enriching with Yahoo Finance sector classification
   */
  private static async buildSectors(): Promise<SectorData> {
    // Load stocks from TradingView data file
    const stocksFromFile = this.loadStocksFromTradingView();
    
    if (stocksFromFile.length === 0) {
      console.error('❌ No stocks loaded. Ensure all-stocks-by-sector.json exists.');
      return {};
    }

    console.log(`Loaded ${stocksFromFile.length} stocks from TradingView data`);

    // Now enrich with Yahoo Finance sector classification
    const yf = require('yahoo-finance2').default;
    const yfinance = new yf({ suppressNotices: ['yahooSurvey'] });

    const sectors: SectorData = {};
    let successCount = 0;
    let failureCount = 0;

    console.log(`Fetching sector classification from Yahoo Finance...\n`);

    for (const symbol of stocksFromFile) {
      try {
        const summary = await yfinance.quoteSummary(symbol, {
          modules: ['assetProfile']
        });

        const yahooSector = summary?.assetProfile?.sector || 'Unknown';
        const categoryKey = yahooSector.replace(/\s+/g, '');

        if (!sectors[categoryKey]) {
          sectors[categoryKey] = {
            name: yahooSector,
            symbols: []
          };
        }

        if (!sectors[categoryKey].symbols.includes(symbol)) {
          sectors[categoryKey].symbols.push(symbol);
        }

        console.log(`  ✓ ${symbol} → ${yahooSector}`);
        successCount++;
      } catch (error) {
        failureCount++;
        // Silently skip failures to avoid spam
      }
    }

    console.log(`\n📊 Sector Results: ${successCount} successful, ${failureCount} failed\n`);

    // Sort symbols within each sector
    Object.values(sectors).forEach(sector => {
      sector.symbols.sort();
    });

    return sectors;
  }

  /**
   * Get industries from cache or build new industries
   */
  static async getIndustries(): Promise<IndustryData> {
    // Check cache first
    const cached = this.loadCache();
    if (cached?.industries) {
      console.log('📦 Using cached industries');
      return cached.industries;
    }

    console.log('🔄 Loading industry data from TradingView source...');
    const industries = await this.buildIndustries();
    
    // Save cache, preserving sectors
    const currentSectors = cached?.sectors || {};
    this.saveCache(currentSectors, industries);
    
    return industries;
  }

  /**
   * Rebuild both sectors and industries together (preferred method)
   */
  static async rebuildAll(): Promise<{ sectors: SectorData; industries: IndustryData }> {
    console.log('🔄 Rebuilding both sectors and industries from TradingView source...');
    const sectors = await this.buildSectors();
    const industries = await this.buildIndustries();
    
    // Save both together
    this.saveCache(sectors, industries);
    
    return { sectors, industries };
  }

  /**
   * Build industries by fetching data from Yahoo Finance
   * Groups stocks by their industry classification (more granular than sectors)
   */
  private static async buildIndustries(): Promise<IndustryData> {
    // Load stocks from TradingView data file
    const stocksFromFile = this.loadStocksFromTradingView();
    
    if (stocksFromFile.length === 0) {
      console.error('❌ No stocks loaded. Ensure all-stocks-by-sector.json exists.');
      return {};
    }

    const yf = require('yahoo-finance2').default;
    const yfinance = new yf({ suppressNotices: ['yahooSurvey'] });

    const industries: IndustryData = {};
    let successCount = 0;
    let failureCount = 0;

    console.log(`Fetching industry classification from Yahoo Finance...\n`);

    for (const symbol of stocksFromFile) {
      try {
        // Fetch quote summary with industry info
        const summary = await yfinance.quoteSummary(symbol, {
          modules: ['assetProfile']
        });

        const yahooIndustry = summary?.assetProfile?.industry || 'Unknown';
        
        // Use industry name as-is from Yahoo Finance
        const categoryKey = yahooIndustry;

        if (!industries[categoryKey]) {
          industries[categoryKey] = {
            name: categoryKey,
            symbols: []
          };
        }

        if (!industries[categoryKey].symbols.includes(symbol)) {
          industries[categoryKey].symbols.push(symbol);
        }

        console.log(`  ✓ ${symbol} → ${yahooIndustry}`);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  ✗ ${symbol} → Failed (${errorMsg})`);
        failureCount++;
      }
    }

    console.log(`\n📊 Results: ${successCount} successful, ${failureCount} failed\n`);

    // Sort symbols within each industry
    Object.values(industries).forEach(industry => {
      industry.symbols.sort();
    });

    return industries;
  }

  /**
   * Load sectors from cache if it exists
   */
  private static loadCache(): SectorCache | null {
    try {
      if (!fs.existsSync(this.CACHE_PATH)) {
        return null;
      }

      const cached = JSON.parse(fs.readFileSync(this.CACHE_PATH, 'utf-8')) as SectorCache;
      return cached;
    } catch (error) {
      return null;
    }
  }

  /**
   * Save sectors and/or industries to cache
   */
  private static saveCache(sectors: SectorData, industries?: IndustryData): void {
    try {
      const cacheDir = path.dirname(this.CACHE_PATH);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      const cache: SectorCache = {
        sectors
      };

      if (industries) {
        cache.industries = industries;
      }

      fs.writeFileSync(this.CACHE_PATH, JSON.stringify(cache, null, 2));
      console.log('💾 Data cached for future use');
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
