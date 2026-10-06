import * as fs from 'fs';
import * as path from 'path';
import { Evaluator } from './evaluator';
import { DataFetcher } from './data-fetcher';
import { EvaluationCriteria, EvaluationResult } from './types';
import { SectorBuilder } from './sector-builder';
import { PiotroskiEvaluator } from './piotroski-evaluator';
import { ValueEvaluator } from './value-evaluator';
import { WatchlistManager } from './watchlist-manager';

interface SummaryResult {
  symbol: string;
  quality_score: number; // Piotroski 0-100
  value_score: number;   // Value 0-100
  quality_grade: string;
  value_grade: string;
  recommendation: string;
}

async function resolveQueryToSymbol(
  query: string,
  options?: { forceSearch?: boolean }
): Promise<{ symbol: string; matchedName: string | null } | null> {
  const raw = query.trim();
  if (!raw) return null;

  const upper = raw.toUpperCase();
  if (!options?.forceSearch && DataFetcher.isValidSymbol(upper)) {
    return { symbol: upper, matchedName: null };
  }

  try {
    const YahooFinance = require('yahoo-finance2').default;
    const yf = new YahooFinance({
      suppressNotices: ['yahooSurvey'],
      validation: { logErrors: false }
    });

    const searchResult = await yf.search(raw, {
      quotesCount: 25,
      newsCount: 0,
      enableFuzzyQuery: true
    });

    const quotes = Array.isArray(searchResult?.quotes) ? searchResult.quotes : [];
    const normalizedQuery = raw.toUpperCase();

    const candidates = quotes
      .filter((q: any) => q?.symbol && /^[A-Z]{1,5}$/.test(String(q.symbol).toUpperCase()))
      .map((q: any) => {
        const quoteSymbol = String(q.symbol).toUpperCase();
        const type = String(q.quoteType || q.typeDisp || '').toUpperCase();
        const shortName = String(q.shortname || '');
        const longName = String(q.longname || '');
        const name = `${shortName} ${longName}`.toUpperCase();

        let typeScore = 0;
        if (type.includes('EQUITY') || type.includes('STOCK')) typeScore = 100;
        else if (type.includes('ETF')) typeScore = 90;
        else if (type.includes('MUTUAL') || type.includes('FUND')) typeScore = 80;

        let nameScore = 0;
        if (quoteSymbol === normalizedQuery) nameScore = 100;
        else if (quoteSymbol.startsWith(normalizedQuery)) nameScore = 50;
        else if (name.includes(normalizedQuery)) nameScore = 30;

        return {
          q,
          score: typeScore + nameScore,
          hasPreferredType: typeScore > 0
        };
      })
      .sort((a: any, b: any) => b.score - a.score);

    const match = candidates.find((c: any) => c.hasPreferredType)?.q || candidates[0]?.q;
    if (!match?.symbol) return null;

    return {
      symbol: String(match.symbol).toUpperCase(),
      matchedName: String(match.shortname || match.longname || '') || null
    };
  } catch {
    return null;
  }
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
  if (args[0] === '--rebuild' || args[0] === '--rebuild-all') {
    console.log('🔄 Rebuilding industries from Yahoo Finance...');
    const industries = await SectorBuilder.rebuildIndustries();
    const sectors = await SectorBuilder.getSectors();
    console.log('\n✅ Sectors (from TradingView JSON):');
    Object.entries(sectors).forEach(([name, data]) => {
      console.log(`  - ${name} (${data.symbols.length} stocks)`);
    });
    console.log('\n✅ Industries (from Yahoo Finance):');
    Object.entries(industries).forEach(([name, data]) => {
      console.log(`  - ${name} (${data.symbols.length} stocks)`);
    });
    process.exit(0);
  }

  if (args[0] === '--rebuild-sectors') {
    console.log('⚠️  Sectors are loaded directly from TradingView JSON. No rebuild needed.');
    const sectors = await SectorBuilder.getSectors();
    console.log('\n✅ Available sectors:');
    Object.entries(sectors).forEach(([name, data]) => {
      console.log(`  - ${name} (${data.symbols.length} stocks)`);
    });
    process.exit(0);
  }

  if (args[0] === '--rebuild-industries') {
    console.log('🔄 Rebuilding industry classification from Yahoo Finance...');
    const industries = await SectorBuilder.rebuildIndustries();
    console.log('\n✅ Industries rebuilt! Available industries:');
    Object.entries(industries).forEach(([name, data]) => {
      console.log(`  - ${name} (${data.symbols.length} stocks)`);
    });
    process.exit(0);
  }

  if (args.length === 0) {
    console.log('Stock Evaluation Tool - Piotroski F-Score Analysis\n');
    console.log('Usage: npm run dev -- SYMBOL [SYMBOL2] [SYMBOL3] ...');
    console.log('       npm run dev -- SECTOR_NAME');
    console.log('       npm run dev -- --industry INDUSTRY_NAME');
    console.log('       npm run dev -- --watchlist');
    console.log('       npm run dev -- --top N');
    console.log('Examples:');
    console.log('  npm run dev -- AAPL');
    console.log('  npm run dev -- AAPL MSFT GOOGL');
    console.log('  npm run dev -- "Electronic Technology"');
    console.log('  npm run dev -- --industry "Software - Application"');
    console.log('  npm run dev -- --watchlist');
    console.log('  npm run dev -- --top 10');
    process.exit(0);
  }

  // Determine symbols to evaluate
  let symbols: string[] = [];
  let sectorName: string | null = null;
  let industryName: string | null = null;
  let isWatchlist = false;

  if (args[0] === '--watchlist') {
    const watchlistTickers = WatchlistManager.getTickers();
    if (watchlistTickers.length === 0) {
      console.log('❌ Your watchlist is empty!');
      console.log('\nAdd tickers with: npm run watchlist:add -- SYMBOL');
      process.exit(1);
    }
    symbols = watchlistTickers;
    isWatchlist = true;
    console.log(`\n👀 Evaluating your watchlist (${symbols.length} tickers)\n`);
  } else if (args[0] === '--industry') {
    if (args.length < 2) {
      console.error('❌ --industry requires an industry name');
      process.exit(1);
    }
    
    const industries = await SectorBuilder.getIndustries();
    const industryKey = Object.keys(industries).find(
      key => key.toLowerCase() === args.slice(1).join(' ').toLowerCase()
    );
    
    if (!industryKey) {
      console.error(`❌ Industry not found: ${args.slice(1).join(' ')}`);
      console.log('\nAvailable industries:');
      Object.keys(industries).forEach(ind => {
        console.log(`  - ${ind}`);
      });
      process.exit(1);
    }
    
    symbols = industries[industryKey].symbols;
    industryName = industryKey;
    console.log(`\n🎯 Evaluating ${industryKey} industry (${symbols.length} stocks)\n`);
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
    const inputQuery = symbol.trim();
    let evaluationSymbol = inputQuery.toUpperCase();
    let matchedName: string | null = null;

    if (!DataFetcher.isValidSymbol(evaluationSymbol)) {
      const resolved = await resolveQueryToSymbol(inputQuery);
      if (!resolved) {
        console.error(`❌ Invalid symbol/query: ${symbol}`);
        continue;
      }
      evaluationSymbol = resolved.symbol;
      matchedName = resolved.matchedName;
      console.log(`🔎 Matched "${inputQuery}" -> ${evaluationSymbol}${matchedName ? ` (${matchedName})` : ''}`);
    }

    try {
      let stockData;
      try {
        stockData = await DataFetcher.fetchStockData(evaluationSymbol);
      } catch (directError) {
        // Fallback: valid-looking input (e.g., APPLE) may still be a company name, not a ticker
        const resolved = await resolveQueryToSymbol(inputQuery, { forceSearch: true });
        if (!resolved || resolved.symbol === evaluationSymbol) {
          throw directError;
        }
        evaluationSymbol = resolved.symbol;
        matchedName = resolved.matchedName;
        console.log(`🔎 Matched "${inputQuery}" -> ${evaluationSymbol}${matchedName ? ` (${matchedName})` : ''}`);
        stockData = await DataFetcher.fetchStockData(evaluationSymbol);
      }
      
      // Calculate Piotroski F-Score (Quality)
      const fScore = PiotroskiEvaluator.calculateFScore(stockData);
      const qualityGrade = PiotroskiEvaluator.getGrade(fScore);
      const qualityReasons = PiotroskiEvaluator.getReasons(stockData, fScore);
      const qualityScore100 = (fScore / 9) * 100;
      
      // Calculate Value Score with momentum adjustment
      const { score: valueScore, warning: momentumWarning } = ValueEvaluator.calculateAdjustedValueScore(stockData, fScore);
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
        symbol: evaluationSymbol,
        quality_score: qualityScore100,
        value_score: valueScore,
        quality_grade: qualityGrade,
        value_grade: valueGrade,
        recommendation
      });
      
      // Print combined analysis
      console.log(`\n${'━'.repeat(80)}`);
      console.log(`📊 Stock Analysis: ${evaluationSymbol}`);
      console.log(`${'━'.repeat(80)}\n`);
      console.log(`Company: ${stockData.company_name}`);
      console.log(`Current Price: $${stockData.price.toFixed(2)}`);
      if (stockData.ytd_change !== null) {
        const ytdColor = stockData.ytd_change >= 0 ? '📈' : '📉';
        console.log(`YTD Change: ${ytdColor} ${stockData.ytd_change.toFixed(1)}%`);
      }
      console.log();
      
      // Show momentum warning if applicable
      if (momentumWarning) {
        console.log(`${momentumWarning}\n`);
      }
      
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

  // Show summary if evaluating sector, watchlist, industry, or top
  if (sectorName || industryName || isWatchlist || args[0] === '--top') {
    showSummary(results, sectorName, industryName, isWatchlist, args[0] === '--top' ? parseInt(args[1]) : undefined);
  }
}

function showSummary(results: SummaryResult[], sectorName?: string | null, industryName?: string | null, isWatchlist?: boolean, topN?: number) {
  if (results.length === 0) {
    console.log('No results to display');
    return;
  }

  // Sort by quality score descending
  const sorted = [...results].sort((a, b) => b.quality_score - a.quality_score);

  // Apply top N filter if specified
  const displayed = topN ? sorted.slice(0, topN) : sorted;

  console.log('\n' + '═'.repeat(80));
  
  // Build title based on evaluation type
  let title = '📊 SUMMARY - Ranked by Quality & Value';
  if (sectorName) {
    title = `📊 SUMMARY - ${sectorName} Sector (${results.length} stocks)`;
  } else if (industryName) {
    title = `📊 SUMMARY - ${industryName} Industry (${results.length} stocks)`;
  } else if (isWatchlist) {
    title = `📊 SUMMARY - Your Watchlist (${results.length} stocks)`;
  } else if (topN) {
    title = `📊 SUMMARY - Top ${topN} Stocks (${results.length} total)`;
  }
  
  console.log(title);
  console.log('═'.repeat(80));
  console.log(`\n    F-Score          Value`);
  console.log('');

  displayed.forEach((result, index) => {
    const qualityFScore = (result.quality_score / 100) * 9;
    const qualityBar = '█'.repeat(Math.round(qualityFScore)) + '░'.repeat(9 - Math.round(qualityFScore));
    const valueBar = '█'.repeat(Math.round(result.value_score / 10)) + '░'.repeat(10 - Math.round(result.value_score / 10));
    
    // Quality emoji - more gradual (10 levels for better differentiation)
    let qualityEmoji = '🔴';
    if (qualityFScore >= 0.5) qualityEmoji = '🟠';
    if (qualityFScore >= 1.5) qualityEmoji = '🟠';
    if (qualityFScore >= 2.5) qualityEmoji = '🟠';
    if (qualityFScore >= 3.5) qualityEmoji = '🟡';
    if (qualityFScore >= 4.5) qualityEmoji = '🟡';
    if (qualityFScore >= 5.5) qualityEmoji = '🟢';
    if (qualityFScore >= 6.5) qualityEmoji = '🟢';
    if (qualityFScore >= 7.5) qualityEmoji = '🟢';
    
    // Value emoji - more gradual (10 levels for better differentiation)
    let valueEmoji = '🔴';
    if (result.value_score >= 10) valueEmoji = '🟠';
    if (result.value_score >= 25) valueEmoji = '🟠';
    if (result.value_score >= 40) valueEmoji = '🟡';
    if (result.value_score >= 55) valueEmoji = '🟡';
    if (result.value_score >= 65) valueEmoji = '🟢';
    if (result.value_score >= 75) valueEmoji = '🟢';
    if (result.value_score >= 85) valueEmoji = '🟢';
    
    const paddedIndex = (index + 1).toString().padEnd(2);
    const paddedSymbol = result.symbol.padEnd(6);
    const paddedQuality = qualityBar.padEnd(11);
    const paddedQScore = qualityFScore.toFixed(1).padStart(3);
    const paddedValue = valueBar.padEnd(12);
    const paddedVScore = result.value_score.toString().padStart(3);
    
    console.log(`${paddedIndex} ${paddedSymbol} ${paddedQuality}${paddedQScore}/9 ${qualityEmoji}  ${paddedValue}${paddedVScore}/100 ${valueEmoji}`);
  });

  console.log('\n' + '═'.repeat(80));
  
  // Piotroski breakdown based on F-Score grades
  const strongBuyCount = displayed.filter(r => r.recommendation === 'STRONG_BUY').length;
  const buyCount = displayed.filter(r => r.recommendation === 'BUY').length;
  const holdCount = displayed.filter(r => r.recommendation === 'HOLD').length;
  const sellCount = displayed.filter(r => r.recommendation === 'SELL').length;
  const strongSellCount = displayed.filter(r => r.recommendation === 'STRONG_SELL').length;
  
  console.log(`\n📈 QUALITY BREAKDOWN:`);
  console.log(`   ${strongBuyCount} A+ (Excellent) | ${buyCount} B+ (Good) | ${holdCount} C (Fair) | ${sellCount} D (Poor) | ${strongSellCount} F (Very Poor)`);
  
  const excellentValue = displayed.filter(r => r.value_score >= 80).length;
  const goodValue = displayed.filter(r => r.value_score >= 60 && r.value_score < 80).length;
  const fairValue = displayed.filter(r => r.value_score >= 40 && r.value_score < 60).length;
  const expensive = displayed.filter(r => r.value_score < 40).length;
  
  console.log(`\n💎 VALUE BREAKDOWN:`);
  console.log(`   ${excellentValue} 🟢 Excellent | ${goodValue} 🟡 Good | ${fairValue} 🟠 Fair | ${expensive} 🔴 Expensive`);

  
  console.log(`\n🏆 HIGHEST QUALITY: ${sorted[0].symbol}`);
  console.log(`   Quality: ${sorted[0].quality_score.toFixed(0)}/100  │  Value: ${sorted[0].value_score}/100`);
  if (sorted.length > 1) {
    const lowestQuality = sorted[sorted.length - 1];
    console.log(`\n⚠️  LOWEST QUALITY: ${lowestQuality.symbol}`);
    console.log(`   Quality: ${lowestQuality.quality_score.toFixed(0)}/100  │  Value: ${lowestQuality.value_score}/100`);
  }
  
  // Find best value
  const bestValue = displayed.reduce((best, current) => current.value_score > best.value_score ? current : best);
  console.log(`\n✨ BEST VALUE: ${bestValue.symbol}`);
  console.log(`   Value: ${bestValue.value_score}/100  │  Quality: ${bestValue.quality_score.toFixed(0)}/100`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
