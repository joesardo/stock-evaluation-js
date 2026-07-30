import * as fs from 'fs';
import * as path from 'path';
import { Evaluator } from './evaluator';
import { DataFetcher } from './data-fetcher';
import { EvaluationCriteria, EvaluationResult } from './types';
import { SectorBuilder } from './sector-builder';
import { PiotroskiEvaluator } from './piotroski-evaluator';

interface SummaryResult {
  symbol: string;
  score: number;
  recommendation: string;
}

async function main() {
  const args = process.argv.slice(2);

  // Load evaluation criteria (kept for potential future use)
  const criteriaPath = path.join(__dirname, '..', 'config', 'evaluation-criteria.json');
  const criteria: EvaluationCriteria = JSON.parse(
    fs.readFileSync(criteriaPath, 'utf-8')
  );

  const evaluator = new Evaluator(criteria);

  // Handle special flags
  if (args[0] === '--rebuild-sectors') {
    console.log('🔄 Rebuilding sector cache from Yahoo Finance...');
    SectorBuilder.clearCache();
    const sectors = await SectorBuilder.getSectors();
    console.log('\n✅ Sectors rebuilt! Available sectors:');
    Object.entries(sectors).forEach(([name, data]) => {
      console.log(`  - ${name} (${data.symbols.length} stocks)`);
    });
    process.exit(0);
  }

  if (args.length === 0) {
    console.log('Stock Evaluation Tool - Piotroski F-Score Analysis\n');
    console.log('Usage: npm run dev -- SYMBOL [SYMBOL2] [SYMBOL3] ...');
    console.log('       npm run dev -- SECTOR_NAME');
    console.log('       npm run dev -- --top N');
    console.log('       npm run dev -- --rebuild-sectors\n');
    console.log('Examples:');
    console.log('  npm run dev -- AAPL');
    console.log('  npm run dev -- AAPL MSFT GOOGL');
    console.log('  npm run dev -- Technology');
    console.log('  npm run dev -- --top 10\n');
    console.log('Available sectors:');
    
    try {
      const sectors = await SectorBuilder.getSectors();
      Object.entries(sectors).forEach(([name, data]) => {
        console.log(`  ${name} (${data.symbols.length} stocks)`);
      });
    } catch (error) {
      console.log('  (Could not fetch sectors - check internet connection)');
    }
    
    process.exit(1);
  }

  // Determine symbols to evaluate
  let symbols: string[] = [];
  let sectorName: string | null = null;

  if (args[0] === '--top') {
    if (args.length < 2 || isNaN(parseInt(args[1]))) {
      console.error('❌ --top requires a number');
      process.exit(1);
    }
    
    const topN = parseInt(args[1]);
    const sectors = await SectorBuilder.getSectors();
    
    // Collect all stocks from all sectors
    symbols = [];
    Object.values(sectors).forEach((sector: any) => {
      symbols.push(...sector.symbols);
    });
    
    // Deduplicate
    symbols = [...new Set(symbols)];
    console.log(`\n⭐ Finding top ${topN} stocks from ${symbols.length} total stocks\n`);
  } else {
    // Check if first argument is a sector name
    const sectors = await SectorBuilder.getSectors();
    const sectorKey = Object.keys(sectors).find(
      key => key.toLowerCase() === args[0].toLowerCase()
    );
    
    if (sectorKey) {
      // It's a sector
      symbols = sectors[sectorKey].symbols;
      sectorName = sectorKey;
      console.log(`\n🎯 Evaluating ${sectorKey} sector (${symbols.length} stocks)\n`);
    } else {
      // Treat all args as symbols
      symbols = args;
    }
  }

  // Evaluate all stocks
  const results: SummaryResult[] = [];

  for (const symbol of symbols) {
    if (!DataFetcher.isValidSymbol(symbol)) {
      console.error(`❌ Invalid symbol: ${symbol} (must be 1-5 uppercase letters)`);
      continue;
    }

    try {
      const stockData = await DataFetcher.fetchStockData(symbol);
      
      // Use Piotroski F-Score framework
      const fScore = PiotroskiEvaluator.calculateFScore(stockData);
      const grade = PiotroskiEvaluator.getGrade(fScore);
      const reasons = PiotroskiEvaluator.getReasons(stockData, fScore);
      
      // Convert F-Score (0-9) to 0-100 scale for consistency
      const score100 = (fScore / 9) * 100;
      
      // Determine recommendation based on F-Score
      let recommendation: string;
      if (fScore >= 8) recommendation = 'STRONG_BUY';
      else if (fScore >= 6) recommendation = 'BUY';
      else if (fScore >= 4) recommendation = 'HOLD';
      else if (fScore >= 2) recommendation = 'SELL';
      else recommendation = 'STRONG_SELL';
      
      results.push({
        symbol: symbol.toUpperCase(),
        score: score100,
        recommendation
      });
      
      // Print Piotroski result
      console.log(`\n${'━'.repeat(80)}`);
      console.log(`📊 Piotroski F-Score Analysis: ${symbol.toUpperCase()}`);
      console.log(`${'━'.repeat(80)}\n`);
      console.log(`Company: ${stockData.company_name}`);
      console.log(`Current Price: $${stockData.price.toFixed(2)}`);
      console.log(`F-Score: ${fScore}/9 ${grade}\n`);
      console.log(`Analysis:`);
      reasons.forEach(reason => console.log(`  ${reason}`));
      console.log(`\n📌 Recommendation: ${recommendation}`);
      console.log(`${'━'.repeat(80)}\n`);

    } catch (error) {
      console.error(`❌ Error processing ${symbol}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // Show summary if evaluating sector or top
  if (sectorName || args[0] === '--top') {
    showSummary(results, args[0] === '--top' ? parseInt(args[1]) : undefined);
  }
}

function showSummary(results: SummaryResult[], topN?: number) {
  if (results.length === 0) {
    console.log('No results to display');
    return;
  }

  // Sort by score descending
  const sorted = [...results].sort((a, b) => b.score - a.score);

  // Apply top N filter if specified
  const displayed = topN ? sorted.slice(0, topN) : sorted;

  console.log('\n' + '═'.repeat(80));
  console.log('📊 SUMMARY - Ranked by Piotroski F-Score');
  console.log('═'.repeat(80) + '\n');

  displayed.forEach((result, index) => {
    // Show F-Score (0-9) format
    const fScore = (result.score / 100) * 9;
    const scoreBar = '█'.repeat(Math.round(fScore)) + '░'.repeat(9 - Math.round(fScore));
    const grade = PiotroskiEvaluator.getGrade(fScore);
    console.log(`${(index + 1).toString().padEnd(3)} ${result.symbol.padEnd(6)} ${scoreBar} ${fScore.toFixed(1)}/9 [${grade}]  ${result.recommendation}`);
  });

  console.log('\n' + '═'.repeat(80));
  
  // Piotroski breakdown based on F-Score grades
  const strongBuyCount = displayed.filter(r => r.recommendation === 'STRONG_BUY').length;
  const buyCount = displayed.filter(r => r.recommendation === 'BUY').length;
  const holdCount = displayed.filter(r => r.recommendation === 'HOLD').length;
  const sellCount = displayed.filter(r => r.recommendation === 'SELL').length;
  const strongSellCount = displayed.filter(r => r.recommendation === 'STRONG_SELL').length;
  
  console.log(`\n📈 Breakdown: ${strongBuyCount} A+ | ${buyCount} B+ | ${holdCount} C | ${sellCount} D | ${strongSellCount} F (out of ${displayed.length} evaluated)`);

  
  console.log(`\n💡 Highest: ${sorted[0].symbol} (${sorted[0].score.toFixed(0)}/100)`);
  if (sorted.length > 1) {
    console.log(`   Lowest:  ${sorted[sorted.length - 1].symbol} (${sorted[sorted.length - 1].score.toFixed(0)}/100)`);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
