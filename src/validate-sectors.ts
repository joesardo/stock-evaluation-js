import * as fs from 'fs';
import * as path from 'path';
import { DataFetcher } from './data-fetcher';

interface SectorData {
  [sector: string]: {
    name: string;
    symbols: string[];
  };
}

interface SectorCache {
  sectors: SectorData;
}

async function validateSectors() {
  const cachePath = path.join(__dirname, '..', 'cache', 'sectors.json');
  
  if (!fs.existsSync(cachePath)) {
    console.error('❌ sectors.json not found');
    process.exit(1);
  }

  const cache = JSON.parse(fs.readFileSync(cachePath, 'utf-8')) as SectorCache;
  const sectors = cache.sectors;

  console.log('🔍 Validating all tickers in sectors.json\n');

  let totalSymbols = 0;
  let invalidSymbols: string[] = [];
  const validatedSectors: SectorData = {};

  for (const [sectorName, sectorData] of Object.entries(sectors)) {
    const validatedSymbols: string[] = [];

    for (const symbol of sectorData.symbols) {
      totalSymbols++;
      if (DataFetcher.isValidSymbol(symbol)) {
        validatedSymbols.push(symbol);
      } else {
        console.log(`  ✗ ${symbol} → Invalid format`);
        invalidSymbols.push(symbol);
      }
    }

    validatedSectors[sectorName] = {
      name: sectorName,
      symbols: validatedSymbols
    };
  }

  console.log(`\n📊 Validation Results:`);
  console.log(`  Total symbols: ${totalSymbols}`);
  console.log(`  Valid symbols: ${totalSymbols - invalidSymbols.length}`);
  console.log(`  Invalid symbols: ${invalidSymbols.length}`);

  if (invalidSymbols.length > 0) {
    console.log(`\n❌ Invalid symbols removed:`);
    invalidSymbols.forEach(s => console.log(`    - ${s}`));

    // Save cleaned cache
    const cleanedCache: SectorCache = {
      sectors: validatedSectors
    };

    fs.writeFileSync(cachePath, JSON.stringify(cleanedCache, null, 2));
    console.log(`\n✅ sectors.json updated with ${totalSymbols - invalidSymbols.length} valid symbols`);
  } else {
    console.log(`\n✅ All symbols are valid!`);
  }
}

validateSectors().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
