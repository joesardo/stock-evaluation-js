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
   * Comprehensive list of stocks across all major sectors and market caps
   * This list is more extensive than the original bootstrap list to capture
   * a wider range of stocks that Yahoo Finance will categorize into sectors
   */
  private static readonly COMPREHENSIVE_STOCKS = [
    // Large Cap Tech
    'AAPL', 'MSFT', 'GOOGL', 'GOOG', 'META', 'NVDA', 'INTC', 'AMD', 'QCOM', 'AVGO', 'ASML', 'CRM', 'ADBE', 'NFLX', 'SHOP',
    // Mid Cap Tech & Software
    'SNOW', 'CRWD', 'NET', 'DDOG', 'OKTA', 'WDAY', 'TWLO', 'VEEV', 'ZOOM', 'MSTR', 'DELL', 'HPQ', 'PAYC', 'PSTG', 'NOW', 'PALO', 'FTNT', 'CHKP', 'TENB', 'RPD',
    // Semiconductors & Chip
    'MU', 'NXPI', 'MCHP', 'AMAT', 'LRCX', 'KLAC', 'MRVL', 'SQ', 'COIN', 'RIOT', 'MARA', 'SLAB', 'SMCI', 'CAVA', 'NVEC',
    // Large Cap Consumer & Automotive
    'TSLA', 'AMZN', 'WMT', 'COST', 'MCD', 'HD', 'NKE', 'LULU', 'SBUX', 'LOW', 'BKNG', 'ORLY',
    // Consumer Cyclical - Mid/Small Cap
    'TJX', 'AZO', 'FIVE', 'ROST', 'ULTA', 'CBRL', 'SHAK', 'YUM', 'DPZ', 'CPRI', 'EAT', 'WING', 'QSR', 'F', 'GM', 'TM', 'HMC', 'RACE', 'NIO', 'LI', 'XPEV', 'RIVN', 'LCID', 'RH', 'LEG', 'BBOX', 'CENTA', 'CRUS', 'HOFT', 'SMPL',
    // Healthcare & Pharma - Large & Mid Cap
    'JNJ', 'UNH', 'LLY', 'PFE', 'AZN', 'ABBV', 'TMO', 'AMGN', 'CVS', 'HUM', 'CI', 'GILD', 'IDXX', 'ATR', 'VEEV', 'VCYT', 'ALNY', 'ALKS',
    // Biotech - Mid & Small Cap
    'MRNA', 'BNTX', 'VRTX', 'CRSP', 'EDIT', 'SRPT', 'BEAM', 'IMNM', 'CGEN', 'ZLAB', 'BCEL', 'HLMN', 'PGEN', 'TMDX',
    // Financial Services - Banks - Large Cap
    'JPM', 'BAC', 'WFC', 'GS', 'MS', 'BLK', 'AXP', 'COF', 'C', 'PNC', 'USB', 'TFC', 'FITB', 'HBAN', 'KEY', 'ZION', 'EWBC', 'PACW', 'SVB', 'FRC',
    // Financial Services - Banks - Mid/Small Cap
    'WAFD', 'WTFC', 'CADE', 'FFIN', 'TFSL', 'BANR', 'CBSH', 'OTCB', 'INDB', 'CFR',
    // Financial Services - Insurance & Diversified
    'BRK.B', 'AIG', 'ALL', 'AON', 'MMC', 'ICE', 'CBOE', 'NDAQ', 'SCHW', 'TD', 'IBKR', 'MUFG', 'PRU', 'HIG', 'UNM',
    // Consumer Defensive - Staples
    'PG', 'KO', 'PEP', 'MO', 'PM', 'MNST', 'CPB', 'GIS', 'MDLZ', 'NSRGY', 'INGR', 'HLF', 'TGLS', 'CRDA', 'LW', 'ADM',
    // Industrials - Aerospace & Defense
    'BA', 'RTX', 'LMT', 'NOC', 'GD', 'HII', 'TDG', 'SPX', 'GE', 'RKLB', 'VSLR', 'AIR', 'AXON', 'SAIC',
    // Industrials - Manufacturing & Equipment
    'CAT', 'CNH', 'AAON', 'AYI', 'BLDR', 'MMM', 'OTIS', 'CARR', 'HON', 'ITT', 'ROP', 'EMR', 'DOV', 'PH', 'JCI', 'IR', 'HUBB', 'WSM',
    // Industrials - Transport & Logistics
    'WM', 'RSG', 'CP', 'NSC', 'UNP', 'CSX', 'KSU', 'ALK', 'DAL', 'UAL', 'AAL', 'JBLU', 'LUV', 'MATX', 'XPO', 'KNX', 'LAD',
    // Energy - Oil & Gas - Large Cap
    'XOM', 'CVX', 'COP', 'MPC', 'PSX', 'VLO', 'FANG', 'OXY', 'EOG', 'EQT', 'CMPR', 'PXD',
    // Energy - Oil & Gas - Mid/Small Cap
    'MRO', 'NOG', 'AR', 'MGY', 'PARR', 'CRK', 'PE', 'GILD', 'XROC', 'SLB',
    // Energy - Pipelines & Utilities - Large Cap
    'OKE', 'KMI', 'EPD', 'PAA', 'AM', 'WEC', 'ES', 'DUK', 'SO', 'AEP', 'EXC', 'PEG', 'NEE', 'FE', 'CMS', 'AWK', 'NWN', 'UGI', 'SWX',
    // Energy - Pipelines & Utilities - Mid/Small Cap
    'OGE', 'EVRG', 'ALE', 'AVTR', 'ETR', 'ED', 'NTST', 'CWEN',
    // Renewables & Clean Energy
    'ENPH', 'RUN', 'SEDG', 'PLUG', 'CLNE', 'ICLN', 'FSLR', 'JKS', 'CSIQ', 'RUN',
    // Real Estate - REITs - Large Cap
    'SPG', 'KIM', 'MAC', 'PLD', 'EGP', 'STAG', 'VICI', 'EXR', 'PSA', 'CUBE', 'WELL', 'UMH', 'NHI', 'CTRE', 'AIV', 'AMT', 'O', 'ADC', 'REXR', 'IRM', 'LAMR',
    // Real Estate - REITs - Mid/Small Cap
    'STOR', 'NETL', 'SKT', 'GOOD', 'TRNO', 'ELME', 'RLJ', 'PLYM', 'MICT', 'UVV',
    // Materials - Metals & Mining - Large Cap
    'NEM', 'FCX', 'AA', 'SCCO', 'ALB', 'RIO', 'BHP', 'VALE', 'TECK', 'CLF', 'TX', 'AUY', 'GLD', 'SLV',
    // Materials - Metals & Mining - Mid/Small Cap
    'JRVR', 'MTA', 'CDE', 'EXK', 'PAAS', 'AG', 'MAG', 'KL', 'IAG', 'GPL',
    // Materials - Chemicals & Construction - Large Cap
    'LYB', 'APD', 'SHW', 'CTVA', 'CE', 'DD', 'ECL', 'EMN', 'IFF', 'PPG', 'MLM', 'LEG', 'UFPI', 'WMS', 'HUBB',
    // Materials - Chemicals & Construction - Mid/Small Cap
    'AXTA', 'WLK', 'SLVM', 'ADTN', 'CLDX', 'FUL', 'URG', 'AMRK', 'NSU', 'TATA',
    // Communication Services - Media & Streaming - Large Cap
    'NFLX', 'META', 'ROKU', 'FUBO', 'SNAP', 'PINS', 'TTD', 'ATHM', 'VEON', 'TMDM', 'FOXA', 'FOX',
    // Communication Services - Telecom
    'VZ', 'T', 'TMUS', 'CHTR', 'CMCSA', 'LBRDA', 'LBRDK', 'BEL', 'SHEN',
    // Mid/Small Cap Diverse
    'PENN', 'EBAY', 'UAA', 'ENBL', 'DECK', 'UPWK', 'DKNG', 'ABNB', 'ZM', 'NET', 'BILL', 'FLIR', 'GEVO', 'APVO', 'ONEW', 'RAVN',
    // Additional Tech/Software - Small Cap
    'ANET', 'LPL', 'ENSG', 'HYLN', 'RDFN', 'EXPE', 'BOOKING', 'TRVG', 'TAP', 'STZ', 'BUD', 'GTLB', 'SWI', 'TTM', 'AVAV', 'GPRO',
    // Additional Healthcare/Biotech
    'ARQT', 'BLDP', 'NWLI', 'SMMT', 'DTLA', 'AZTA', 'CBRT', 'SELB', 'CURI', 'VERV',
    // Additional Retail/Consumer
    'CATO', 'DLTH', 'EXPR', 'OYST', 'GPS', 'KSS', 'M', 'AEO', 'SCHN', 'WRK',
    // Additional Industrial
    'TREX', 'ROKU', 'NBHC', 'XMTR', 'PLUG', 'ETRN', 'PNRG', 'ARWR', 'RRGB', 'SSNC'
  ];

  /**
   * Mapping from Yahoo Finance sector names to simplified one-word names
   * Yahoo returns full sector names, we map them to our naming scheme
   */
  private static readonly SECTOR_NAME_MAP: { [key: string]: string } = {
    'Technology': 'Tech',
    'Communication Services': 'Media',
    'Financial Services': 'Banking',
    'Healthcare': 'Healthcare',
    'Industrials': 'Industrial',
    'Consumer Cyclical': 'Retail',
    'Consumer Defensive': 'Staples',
    'Energy': 'Energy',
    'Utilities': 'Utilities',
    'Real Estate': 'RealEstate',
    'Basic Materials': 'Materials',
  };

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

    console.log('🔄 Building sector watchlists from Yahoo Finance...');
    const sectors = await this.buildSectors();
    
    // Save cache, preserving industries
    const currentIndustries = cached?.industries;
    this.saveCache(sectors, currentIndustries);
    
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

    console.log('🔄 Building industry watchlists from Yahoo Finance...');
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
    console.log('🔄 Rebuilding both sectors and industries from Yahoo Finance...');
    const sectors = await this.buildSectors();
    const industries = await this.buildIndustries();
    
    // Save both together
    this.saveCache(sectors, industries);
    
    return { sectors, industries };
  }

  /**
   * Build sectors by fetching data from Yahoo Finance for comprehensive stock list
   * Groups stocks by their actual Yahoo Finance sector classification
   */
  private static async buildSectors(): Promise<SectorData> {
    const yf = require('yahoo-finance2').default;
    const yfinance = new yf({ suppressNotices: ['yahooSurvey'] });

    const sectors: SectorData = {};
    let successCount = 0;
    let failureCount = 0;

    console.log(`Fetching sector data for ${this.COMPREHENSIVE_STOCKS.length} stocks from Yahoo Finance...\n`);

    for (const symbol of this.COMPREHENSIVE_STOCKS) {
      try {
        // Fetch quote summary with sector info
        const summary = await yfinance.quoteSummary(symbol, {
          modules: ['assetProfile']
        });

        const yahooSector = summary?.assetProfile?.sector || 'Unknown';
        
        // Map Yahoo's sector name to our simplified one-word names
        let categoryKey = this.SECTOR_NAME_MAP[yahooSector] || yahooSector;
        
        // Clean up the category key (remove spaces, make camelCase for unknown sectors)
        if (!this.SECTOR_NAME_MAP[yahooSector]) {
          categoryKey = yahooSector.replace(/\s+/g, '');
        }

        if (!sectors[categoryKey]) {
          sectors[categoryKey] = {
            name: categoryKey,
            symbols: []
          };
        }

        if (!sectors[categoryKey].symbols.includes(symbol)) {
          sectors[categoryKey].symbols.push(symbol);
        }

        console.log(`  ✓ ${symbol} → ${yahooSector}`);
        successCount++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        console.log(`  ✗ ${symbol} → Failed (${errorMsg})`);
        failureCount++;
      }
    }

    console.log(`\n📊 Results: ${successCount} successful, ${failureCount} failed\n`);

    // Sort symbols within each sector
    Object.values(sectors).forEach(sector => {
      sector.symbols.sort();
    });

    return sectors;
  }

  /**
   * Build industries by fetching data from Yahoo Finance
   * Groups stocks by their industry classification (more granular than sectors)
   */
  private static async buildIndustries(): Promise<IndustryData> {
    const yf = require('yahoo-finance2').default;
    const yfinance = new yf({ suppressNotices: ['yahooSurvey'] });

    const industries: IndustryData = {};
    let successCount = 0;
    let failureCount = 0;

    console.log(`Fetching industry data for ${this.COMPREHENSIVE_STOCKS.length} stocks from Yahoo Finance...\n`);

    for (const symbol of this.COMPREHENSIVE_STOCKS) {
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
