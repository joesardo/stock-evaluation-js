import { readFileSync, writeFileSync } from 'fs';

// Valid ticker format: 1-5 uppercase letters, may include dots (BRK.B, BRK.A)
// Invalid patterns: slashes, hyphens at start/end, multiple dots, etc.
function isValidTicker(ticker) {
  if (!ticker || typeof ticker !== 'string') return false;
  
  // Reject if contains slash (BOH/PB style)
  if (ticker.includes('/')) return false;
  
  // Reject common invalid patterns
  if (ticker.startsWith('-') || ticker.endsWith('-')) return false;
  if (ticker.startsWith('.') || ticker.endsWith('.')) return false;
  
  // Allow: 1-5 letters, optional single dot for class shares (BRK.B, BRK.A)
  // Basic pattern: letters, optionally a dot followed by one letter
  const validPattern = /^[A-Z]{1,5}(?:\.[A-Z])?$/;
  return validPattern.test(ticker);
}

function cleanJsonFile(filename) {
  console.log(`\n📋 Cleaning ${filename}...`);
  
  const data = JSON.parse(readFileSync(filename, 'utf-8'));
  let totalBefore = 0;
  let totalAfter = 0;
  let removedCount = 0;
  const removed = [];

  // Process each category (sector/industry)
  for (const [category, tickers] of Object.entries(data)) {
    if (!Array.isArray(tickers)) continue;
    
    totalBefore += tickers.length;
    
    const cleaned = tickers.filter(ticker => {
      const valid = isValidTicker(ticker);
      if (!valid) {
        removed.push(ticker);
        removedCount++;
      }
      return valid;
    });
    
    totalAfter += cleaned.length;
    data[category] = cleaned;
  }

  // Write cleaned data back
  writeFileSync(filename, JSON.stringify(data, null, 2) + '\n');
  
  console.log(`  ✅ Cleaned ${filename}`);
  console.log(`     Before: ${totalBefore} tickers`);
  console.log(`     After:  ${totalAfter} tickers`);
  console.log(`     Removed: ${removedCount} invalid tickers`);
  
  if (removed.length > 0 && removed.length <= 20) {
    console.log(`     Examples: ${removed.slice(0, 10).join(', ')}${removed.length > 10 ? '...' : ''}`);
  }
  
  return { before: totalBefore, after: totalAfter, removed: removedCount };
}

console.log('🧹 Cleaning ticker data from TradingView sources...');

const sectorStats = cleanJsonFile('all-stocks-by-sector.json');
const industryStats = cleanJsonFile('all-stocks-by-industry.json');

console.log(`\n📊 Summary:`);
console.log(`   Sectors: ${sectorStats.before} → ${sectorStats.after} (removed ${sectorStats.removed})`);
console.log(`   Industries: ${industryStats.before} → ${industryStats.after} (removed ${industryStats.removed})`);
console.log(`   Total removed: ${sectorStats.removed + industryStats.removed} invalid tickers`);
console.log(`\n✅ Done! JSONs are now cleaned.`);
