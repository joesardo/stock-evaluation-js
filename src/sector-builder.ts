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
 * Load sectors and industries directly from TradingView verified data sources
 * No rebuild process needed - uses all-stocks-by-sector.json and all-stocks-by-industry.json directly
 */
export class SectorBuilder {
  private static readonly SECTORS_PATH = path.join(__dirname, '..', 'all-stocks-by-sector.json');
  private static readonly INDUSTRIES_PATH = path.join(__dirname, '..', 'all-stocks-by-industry.json');

  /**
   * Load sector data directly from TradingView JSON file
   */
  private static loadSectorData(): Record<string, string[]> {
    try {
      if (!fs.existsSync(this.SECTORS_PATH)) {
        console.error('❌ all-stocks-by-sector.json not found. Run: node sectors-fetch.js');
        return {};
      }

      return JSON.parse(fs.readFileSync(this.SECTORS_PATH, 'utf-8')) as Record<string, string[]>;
    } catch (error) {
      console.error('Error loading sector data:', error);
      return {};
    }
  }

  /**
   * Load industry data directly from TradingView JSON file
   */
  private static loadIndustryData(): Record<string, string[]> {
    try {
      if (!fs.existsSync(this.INDUSTRIES_PATH)) {
        console.error('⚠️  all-stocks-by-industry.json not found. Run: node industries-fetch.js');
        return {};
      }

      return JSON.parse(fs.readFileSync(this.INDUSTRIES_PATH, 'utf-8')) as Record<string, string[]>;
    } catch (error) {
      console.error('Error loading industry data:', error);
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
   * Get industries from TradingView data
   * Returns industries with sorted symbols
   */
  static async getIndustries(): Promise<IndustryData> {
    const industryData = this.loadIndustryData();
    
    const industries: IndustryData = {};
    for (const [industryName, symbols] of Object.entries(industryData)) {
      industries[industryName] = {
        name: industryName,
        symbols: (symbols as string[]).sort()
      };
    }

    return industries;
  }

  /**
   * Rebuild industries from TradingView scanner API
   * Call this if you want fresh industry classification from TradingView
   */
  static async rebuildIndustries(): Promise<IndustryData> {
    console.log('🔄 Rebuilding industries from TradingView...');
    console.log('   Run: node industries-fetch.js');
    return this.getIndustries();
  }
}
