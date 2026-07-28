#!/usr/bin/env node

import * as fs from 'fs';
import * as path from 'path';
import { Evaluator } from './evaluator';
import { DataFetcher } from './data-fetcher';
import { EvaluationCriteria } from './types';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Stock Evaluation Tool');
    console.log('Usage: npm run dev -- SYMBOL1 [SYMBOL2] [SYMBOL3] ...');
    console.log('Example: npm run dev -- AAPL MSFT GOOGL');
    process.exit(1);
  }

  // Load evaluation criteria
  const criteriaPath = path.join(__dirname, '..', 'config', 'evaluation-criteria.json');
  const criteria: EvaluationCriteria = JSON.parse(
    fs.readFileSync(criteriaPath, 'utf-8')
  );

  const evaluator = new Evaluator(criteria);

  // Process each stock symbol
  for (const symbol of args) {
    if (!DataFetcher.isValidSymbol(symbol)) {
      console.error(`❌ Invalid symbol: ${symbol} (must be 1-5 uppercase letters)`);
      continue;
    }

    try {
      console.log(`\n📥 Fetching data for ${symbol.toUpperCase()}...`);
      const stockData = await DataFetcher.fetchStockData(symbol);
      
      console.log(`\n⚙️  Evaluating ${symbol.toUpperCase()}...`);
      const result = evaluator.evaluate(stockData);
      
      console.log('\n' + evaluator.formatResult(result));
    } catch (error) {
      console.error(`\n❌ Error processing ${symbol}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
