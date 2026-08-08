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

/**
 * Load sectors directly from TradingView verified data source
 * No rebuild process needed - uses all-stocks-by-sector.json directly
 */
export class SectorBuilder {
  private static readonly DATA_PATH = path.join(__dirname, '..', 'all-stocks-by-sector.json');

  /**
   * Load sector data directly from TradingView JSON file
   */
  private static loadSectorData(): Record<string, string[]> {
    try {
      if (!fs.existsSync(this.DATA_PATH)) {
        console.error('❌ all-stocks-by-sector.json not found. Run: node sectors-fetch.js');
        return {};
      }

      return JSON.parse(fs.readFileSync(this.DATA_PATH, 'utf-8')) as Record<string, string[]>;
    } catch (error) {
      console.error('Error loading sector data:', error);
      return {};
    }
  }

  /**
   * Get sectors from TradingView data
   * Returns sectors with sorted symbols
   */
  static async getSectors(): Promise<SectorData> {
    const sectorData = this.loadSectorData();
    
    const sectors: SectorData = {};
    for (const [sectorName, symbols] of Object.entries(sectorData)) {
      sectors[sectorName] = {
        name: sectorName,
        symbols: symbols.sort()
      };
    }

    return sectors;
  }

  /**
   * Get industries from TradingView sectors by enriching with Yahoo Finance industry classification
   * This provides more granular classification than sectors
   */
  static async getIndustries(): Promise<IndustryData> {
    const sectorData = this.loadSectorData();
    
    // Flatten all stocks from all sectors
    const allStocks = new Set<string>();
    for (const symbols of Object.values(sectorData)) {
      symbols.forEach(s => allStocks.add(s));
    }

    const yf = require('yahoo-finance2').default;
    const yfinance = new yf({ suppressNotices: ['yahooSurvey'] });

    const industries: IndustryData = {};
    let successCount = 0;
    let failureCount = 0;

    console.log(`Fetching industry classification from Yahoo Finance for ${allStocks.size} stocks...\n`);

    for (const symbol of allStocks) {
      try {
        const summary = await yfinance.quoteSummary(symbol, {
          modules: ['assetProfile']
        });

        const yahooIndustry = summary?.assetProfile?.industry || 'Unknown';

        if (!industries[yahooIndustry]) {
          industries[yahooIndustry] = {
            name: yahooIndustry,
            symbols: []
          };
        }

        if (!industries[yahooIndustry].symbols.includes(symbol)) {
          industries[yahooIndustry].symbols.push(symbol);
        }

        console.log(`  ✓ ${symbol} → ${yahooIndustry}`);
        successCount++;
      } catch (error) {
        failureCount++;
        // Silently skip failures to avoid spam
      }
    }

    console.log(`\n📊 Industry Results: ${successCount} successful, ${failureCount} failed\n`);

    // Sort symbols within each industry
    Object.values(industries).forEach(industry => {
      industry.symbols.sort();
    });

    return industries;
  }

  /**
   * Rebuild industries only (sectors load directly from JSON)
   * Call this if you want fresh industry classification from Yahoo Finance
   */
  static async rebuildIndustries(): Promise<IndustryData> {
    console.log('🔄 Rebuilding industries from Yahoo Finance...');
    return this.getIndustries();
  }
}
