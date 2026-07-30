import * as fs from 'fs';
import * as path from 'path';
import { Evaluator } from './evaluator';
import { DataFetcher } from './data-fetcher';
import { EvaluationCriteria, EvaluationResult } from './types';
import { SectorBuilder } from './sector-builder';
import { PiotroskiEvaluator } from './piotroski-evaluator';
import { ValueEvaluator } from './value-evaluator';

interface SummaryResult {
  symbol: string;
  quality_score: number; // Piotroski 0-100
  value_score: number;   // Value 0-100
  quality_grade: string;
  value_grade: string;
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
      
      // Calculate Piotroski F-Score (Quality)
      const fScore = PiotroskiEvaluator.calculateFScore(stockData);
      const qualityGrade = PiotroskiEvaluator.getGrade(fScore);
      const qualityReasons = PiotroskiEvaluator.getReasons(stockData, fScore);
      const qualityScore100 = (fScore / 9) * 100;
      
      // Calculate Value Score
      const valueScore = ValueEvaluator.calculateValueScore(stockData);
      const valueGrade = ValueEvaluator.getGrade(valueScore);
      const valueReasons = ValueEvaluator.getReasons(stockData);
      
      // Determine recommendation based on Quality (Piotroski)
      let recommendation: string;
      if (fScore >= 8) recommendation = 'STRONG_BUY';
      else if (fScore >= 6) recommendation = 'BUY';
      else if (fScore >= 4) recommendation = 'HOLD';
      else if (fScore >= 2) recommendation = 'SELL';
      else recommendation = 'STRONG_SELL';
      
      results.push({
        symbol: symbol.toUpperCase(),
        quality_score: qualityScore100,
        value_score: valueScore,
        quality_grade: qualityGrade,
        value_grade: valueGrade,
        recommendation
      });
      
      // Print combined analysis
      console.log(`\n${'━'.repeat(80)}`);
      console.log(`📊 Stock Analysis: ${symbol.toUpperCase()}`);
      console.log(`${'━'.repeat(80)}\n`);
      console.log(`Company: ${stockData.company_name}`);
      console.log(`Current Price: $${stockData.price.toFixed(2)}\n`);
      
      // Quality (Piotroski)
      console.log(`📈 QUALITY (Piotroski F-Score): ${fScore}/9 ${qualityGrade}`);
      console.log(`Analysis:`);
      qualityReasons.forEach(reason => console.log(`  ${reason}`));
      
      // Value Analysis
      console.log(`\n💎 VALUE: ${valueScore}/100 ${valueGrade}`);
      console.log(`Analysis:`);
      valueReasons.forEach(reason => console.log(`  ${reason}`));
      
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

  // Sort by quality score descending
  const sorted = [...results].sort((a, b) => b.quality_score - a.quality_score);

  // Apply top N filter if specified
  const displayed = topN ? sorted.slice(0, topN) : sorted;

  console.log('\n' + '═'.repeat(80));
  console.log('📊 SUMMARY - Ranked by Quality & Value');
  console.log('═'.repeat(80) + '\n');

  displayed.forEach((result, index) => {
    const qualityFScore = (result.quality_score / 100) * 9;
    const qualityBar = '█'.repeat(Math.round(qualityFScore)) + '░'.repeat(9 - Math.round(qualityFScore));
    const valueBar = '█'.repeat(Math.round(result.value_score / 10)) + '░'.repeat(10 - Math.round(result.value_score / 10));
    console.log(`${(index + 1).toString().padEnd(3)} ${result.symbol.padEnd(6)} Q:${qualityBar}${qualityFScore.toFixed(1)}/9  V:${valueBar}${result.value_score}/100`);
  });

  console.log('\n' + '═'.repeat(80));
  
  // Piotroski breakdown based on F-Score grades
  const strongBuyCount = displayed.filter(r => r.recommendation === 'STRONG_BUY').length;
  const buyCount = displayed.filter(r => r.recommendation === 'BUY').length;
  const holdCount = displayed.filter(r => r.recommendation === 'HOLD').length;
  const sellCount = displayed.filter(r => r.recommendation === 'SELL').length;
  const strongSellCount = displayed.filter(r => r.recommendation === 'STRONG_SELL').length;
  
  console.log(`\n📈 Quality Breakdown: ${strongBuyCount} A+ | ${buyCount} B+ | ${holdCount} C | ${sellCount} D | ${strongSellCount} F (out of ${displayed.length} evaluated)`);
  
  const excellentValue = displayed.filter(r => r.value_score >= 80).length;
  const goodValue = displayed.filter(r => r.value_score >= 60 && r.value_score < 80).length;
  const fairValue = displayed.filter(r => r.value_score >= 40 && r.value_score < 60).length;
  const expensive = displayed.filter(r => r.value_score < 40).length;
  
  console.log(`📊 Value Breakdown: ${excellentValue} Excellent | ${goodValue} Good | ${fairValue} Fair | ${expensive} Expensive (out of ${displayed.length} evaluated)`);

  
  console.log(`\n💡 Highest Quality: ${sorted[0].symbol} (Quality: ${sorted[0].quality_score.toFixed(0)}/100, Value: ${sorted[0].value_score}/100)`);
  if (sorted.length > 1) {
    const lowestQuality = sorted[sorted.length - 1];
    console.log(`   Lowest Quality:  ${lowestQuality.symbol} (Quality: ${lowestQuality.quality_score.toFixed(0)}/100, Value: ${lowestQuality.value_score}/100)`);
  }
  
  // Find best value
  const bestValue = displayed.reduce((best, current) => current.value_score > best.value_score ? current : best);
  console.log(`\n✨ Best Value: ${bestValue.symbol} (Value: ${bestValue.value_score}/100, Quality: ${bestValue.quality_score.toFixed(0)}/100)`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
