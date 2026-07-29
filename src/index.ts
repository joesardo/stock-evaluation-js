import * as fs from 'fs';
import * as path from 'path';
import { Evaluator } from './evaluator';
import { DataFetcher } from './data-fetcher';
import { EvaluationCriteria, EvaluationResult } from './types';

interface SummaryResult {
  symbol: string;
  score: number;
  recommendation: string;
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Stock Evaluation Tool');
    console.log('Usage: npm run dev -- SYMBOL1 [SYMBOL2] [SYMBOL3] ...');
    console.log('       npm run dev -- --sector SECTOR_NAME');
    console.log('       npm run dev -- --top N');
    console.log('\nExamples:');
    console.log('  npm run dev -- AAPL MSFT GOOGL');
    console.log('  npm run dev -- --sector technology');
    console.log('  npm run dev -- --top 10');
    console.log('\nAvailable sectors:');
    
    const watchlistsPath = path.join(__dirname, '..', 'config', 'watchlists.json');
    const watchlists = JSON.parse(fs.readFileSync(watchlistsPath, 'utf-8'));
    Object.keys(watchlists).forEach(key => {
      console.log(`  - ${key} (${watchlists[key].symbols.length} stocks)`);
    });
    
    process.exit(1);
  }

  // Load evaluation criteria
  const criteriaPath = path.join(__dirname, '..', 'config', 'evaluation-criteria.json');
  const criteria: EvaluationCriteria = JSON.parse(
    fs.readFileSync(criteriaPath, 'utf-8')
  );

  const evaluator = new Evaluator(criteria);

  // Determine symbols to evaluate
  let symbols: string[] = [];

  if (args[0] === '--sector') {
    if (args.length < 2) {
      console.error('❌ --sector requires a sector name');
      process.exit(1);
    }
    
    const sectorName = args[1].toLowerCase();
    const watchlistsPath = path.join(__dirname, '..', 'config', 'watchlists.json');
    const watchlists = JSON.parse(fs.readFileSync(watchlistsPath, 'utf-8'));
    
    if (!watchlists[sectorName]) {
      console.error(`❌ Unknown sector: ${sectorName}`);
      console.error(`Available sectors: ${Object.keys(watchlists).join(', ')}`);
      process.exit(1);
    }
    
    symbols = watchlists[sectorName].symbols;
    console.log(`\n🎯 Evaluating ${watchlists[sectorName].name} sector (${symbols.length} stocks)\n`);
  } else if (args[0] === '--top') {
    if (args.length < 2 || isNaN(parseInt(args[1]))) {
      console.error('❌ --top requires a number');
      process.exit(1);
    }
    
    const topN = parseInt(args[1]);
    const watchlistsPath = path.join(__dirname, '..', 'config', 'watchlists.json');
    const watchlists = JSON.parse(fs.readFileSync(watchlistsPath, 'utf-8'));
    
    // Collect all stocks from all sectors
    symbols = [];
    Object.values(watchlists).forEach((sector: any) => {
      symbols.push(...sector.symbols);
    });
    
    // Deduplicate
    symbols = [...new Set(symbols)];
    console.log(`\n⭐ Finding top ${topN} stocks from ${symbols.length} total stocks\n`);
  } else {
    // Regular symbols
    symbols = args;
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
      const result = evaluator.evaluate(stockData);
      
      results.push({
        symbol: symbol.toUpperCase(),
        score: result.overall_score,
        recommendation: result.recommendation
      });
      
      // Print detailed result
      console.log(evaluator.formatResult(result));
      console.log('');
    } catch (error) {
      console.error(`❌ Error processing ${symbol}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // Show summary if evaluating sector or top
  if (args[0] === '--sector' || args[0] === '--top') {
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
  console.log('📊 SUMMARY - Ranked by Score');
  console.log('═'.repeat(80) + '\n');

  displayed.forEach((result, index) => {
    const scoreBar = '█'.repeat(Math.round(result.score / 10)) + '░'.repeat(10 - Math.round(result.score / 10));
    console.log(`${(index + 1).toString().padEnd(3)} ${result.symbol.padEnd(6)} ${scoreBar} ${result.score.toFixed(0)}/100  ${result.recommendation}`);
  });

  console.log('\n' + '═'.repeat(80));
  
  const buyCount = displayed.filter(r => r.score >= 60).length;
  const holdCount = displayed.filter(r => r.score >= 40 && r.score < 60).length;
  const sellCount = displayed.filter(r => r.score < 40).length;
  
  console.log(`\n📈 Breakdown: ${buyCount} BUY | ${holdCount} HOLD | ${sellCount} SELL (out of ${displayed.length} evaluated)`);
  console.log(`\n💡 Highest: ${sorted[0].symbol} (${sorted[0].score.toFixed(0)}/100)`);
  if (sorted.length > 1) {
    console.log(`   Lowest:  ${sorted[sorted.length - 1].symbol} (${sorted[sorted.length - 1].score.toFixed(0)}/100)`);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
