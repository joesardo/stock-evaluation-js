#!/usr/bin/env node

/**
 * Common Stock Evaluation Examples
 * Run these to see different evaluation scenarios
 */

const examples = {
  "tech-giants": "AAPL MSFT GOOGL NVDA META",
  "financials": "JPM BAC WFC GS BLK",
  "pharma": "JNJ PFE LLY AZN ABBV",
  "energy": "XOM CVX COP MPC PSX",
  "utilities": "NEE DUK SO ES AEP",
  "industrials": "BA GE MMM EMR ITT",
  "consumer": "AMZN WMT KO MCD NKE",
  "telecom": "VZ T TMUS DISH CHTR",
  "aerospace": "BA LMT RTX NOC GD",
  "semiconductor": "NVDA INTC AVGO QCOM ASML",
  "airline": "DAL UAL AAL ALK SKYW",
  "automotive": "F GM GM TM HMC",
  "healthcare": "UNH CVS ELV TPG CI",
  "real-estate": "SPG PLD AWO EXR PSA",
  "materials": "NEM FCX AA SCCO TX",
};

const categories = Object.keys(examples).sort();

console.log("Stock Evaluation Tool - Example Portfolios");
console.log("==========================================\n");
console.log("Evaluate pre-defined stock groups:\n");

categories.forEach((category, index) => {
  const symbols = examples[category];
  console.log(`${index + 1}. ${category.toUpperCase()}`);
  console.log(`   npm run dev -- ${symbols}\n`);
});

console.log("==========================================\n");
console.log("Custom evaluation:");
console.log("   npm run dev -- SYMBOL1 SYMBOL2 SYMBOL3\n");

console.log("Example: Compare tech stocks");
console.log("   npm run dev -- AAPL MSFT GOOGL NVDA\n");

console.log("Example: Financial sector analysis");
console.log("   npm run dev -- JPM BAC WFC\n");
