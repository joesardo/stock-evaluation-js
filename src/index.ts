import * as fs from 'fs';
import * as path from 'path';
import { Evaluator } from './evaluator';
import { DataFetcher } from './data-fetcher';
import { EvaluationCriteria, EvaluationResult } from './types';
import { SectorBuilder } from './sector-builder';
import { PiotroskiEvaluator } from './piotroski-evaluator';

type Framework = 'default' | 'piotroski';

interface SummaryResult {
  symbol: string;
  score: number;
  recommendation: string;
}

async function main() {
  const args = process.argv.slice(2);

  // Detect framework flag
  let framework: Framework = 'default';
  const frameworkIndex = args.indexOf('--framework');
  if (frameworkIndex !== -1 && args[frameworkIndex + 1]) {
    framework = args[frameworkIndex + 1].toLowerCase() as Framework;
    args.splice(frameworkIndex, 2); // Remove flag from args
  }

  // Load evaluation criteria
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
    console.log('Stock Evaluation Tool');
    console.log('Usage: npm run dev -- [OPTIONS] SYMBOL1 [SYMBOL2] [SYMBOL3] ...');
    console.log('       npm run dev -- --sector SECTOR_NAME [--framework FRAMEWORK]');
    console.log('       npm run dev -- --top N [--framework FRAMEWORK]');
    console.log('       npm run dev -- --rebuild-sectors');
    console.log('\nOptions:');
    console.log('  --framework default   | Weighted multi-factor model (default)');
    console.log('  --framework piotroski | Piotroski F-Score (academic framework)');
    console.log('\nExamples:');
    console.log('  npm run dev -- AAPL MSFT GOOGL');
    console.log('  npm run dev -- --sector Technology');
    console.log('  npm run dev -- --sector Technology --framework piotroski');
    console.log('  npm run dev -- --top 10 --framework piotroski');
    console.log('\nAvailable sectors (from Yahoo Finance):');
    
    try {
      const sectors = await SectorBuilder.getSectors();
      Object.entries(sectors).forEach(([name, data]) => {
        console.log(`  - ${name} (${data.symbols.length} stocks)`);
      });
    } catch (error) {
      console.log('  (Could not fetch sectors - check internet connection)');
    }
    
    process.exit(1);
  }

  // Determine symbols to evaluate
  let symbols: string[] = [];

  if (args[0] === '--sector') {
    if (args.length < 2) {
      console.error('❌ --sector requires a sector name');
      process.exit(1);
    }
    
    const sectorName = args[1];
    const sectors = await SectorBuilder.getSectors();
    
    // Case-insensitive sector lookup
    const sectorKey = Object.keys(sectors).find(
      key => key.toLowerCase() === sectorName.toLowerCase()
    );
    
    if (!sectorKey) {
      console.error(`❌ Unknown sector: ${sectorName}`);
      console.error(`Available sectors: ${Object.keys(sectors).join(', ')}`);
      process.exit(1);
    }
    
    symbols = sectors[sectorKey].symbols;
    console.log(`\n🎯 Evaluating ${sectorKey} sector (${symbols.length} stocks)\n`);
  } else if (args[0] === '--top') {
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
      
      if (framework === 'piotroski') {
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
      } else {
        // Use default weighted framework
        const result = evaluator.evaluate(stockData);
        
        results.push({
          symbol: symbol.toUpperCase(),
          score: result.overall_score,
          recommendation: result.recommendation
        });
        
        // Print detailed result
        console.log(evaluator.formatResult(result));
      }
      
      console.log('');
    } catch (error) {
      console.error(`❌ Error processing ${symbol}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // Show summary if evaluating sector or top
  if (args[0] === '--sector' || args[0] === '--top') {
    showSummary(results, args[0] === '--top' ? parseInt(args[1]) : undefined, framework);
  }
}

function showSummary(results: SummaryResult[], topN?: number, framework: Framework = 'default') {
  if (results.length === 0) {
    console.log('No results to display');
    return;
  }

  // Sort by score descending
  const sorted = [...results].sort((a, b) => b.score - a.score);

  // Apply top N filter if specified
  const displayed = topN ? sorted.slice(0, topN) : sorted;

  console.log('\n' + '═'.repeat(80));
  console.log(`📊 SUMMARY - Ranked by Score (${framework === 'piotroski' ? 'Piotroski F-Score' : 'Weighted Score'})`);
  console.log('═'.repeat(80) + '\n');

  displayed.forEach((result, index) => {
    if (framework === 'piotroski') {
      // Show F-Score (0-9) format
      const fScore = (result.score / 100) * 9;
      const scoreBar = '█'.repeat(Math.round(fScore)) + '░'.repeat(9 - Math.round(fScore));
      const grade = PiotroskiEvaluator.getGrade(fScore);
      console.log(`${(index + 1).toString().padEnd(3)} ${result.symbol.padEnd(6)} ${scoreBar} ${fScore.toFixed(1)}/9 [${grade}]  ${result.recommendation}`);
    } else {
      // Show weighted score (0-100) format
      const scoreBar = '█'.repeat(Math.round(result.score / 10)) + '░'.repeat(10 - Math.round(result.score / 10));
      console.log(`${(index + 1).toString().padEnd(3)} ${result.symbol.padEnd(6)} ${scoreBar} ${result.score.toFixed(0)}/100  ${result.recommendation}`);
    }
  });

  console.log('\n' + '═'.repeat(80));
  
  if (framework === 'piotroski') {
    // Piotroski breakdown based on F-Score grades
    const strongBuyCount = displayed.filter(r => r.recommendation === 'STRONG_BUY').length;
    const buyCount = displayed.filter(r => r.recommendation === 'BUY').length;
    const holdCount = displayed.filter(r => r.recommendation === 'HOLD').length;
    const sellCount = displayed.filter(r => r.recommendation === 'SELL').length;
    const strongSellCount = displayed.filter(r => r.recommendation === 'STRONG_SELL').length;
    
    console.log(`\n📈 Breakdown: ${strongBuyCount} A+ | ${buyCount} B+ | ${holdCount} C | ${sellCount} D | ${strongSellCount} F (out of ${displayed.length} evaluated)`);
  } else {
    // Default framework breakdown
    const buyCount = displayed.filter(r => r.score >= 60).length;
    const holdCount = displayed.filter(r => r.score >= 40 && r.score < 60).length;
    const sellCount = displayed.filter(r => r.score < 40).length;
    
    console.log(`\n📈 Breakdown: ${buyCount} BUY | ${holdCount} HOLD | ${sellCount} SELL (out of ${displayed.length} evaluated)`);
  }
  
  console.log(`\n💡 Highest: ${sorted[0].symbol} (${sorted[0].score.toFixed(0)}/100)`);
  if (sorted.length > 1) {
    console.log(`   Lowest:  ${sorted[sorted.length - 1].symbol} (${sorted[sorted.length - 1].score.toFixed(0)}/100)`);
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
