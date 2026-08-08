import { writeFile } from "node:fs/promises";

const url = "https://scanner.tradingview.com/america/scan";

const PAGE_SIZE = 1000;

// TradingView sectors
const SECTORS = [
  "Electronic Technology",
  "Technology Services",
  "Finance",
  "Health Technology",
  "Retail Trade",
  "Producer Manufacturing",
  "Energy Minerals",
  "Consumer Non-Durables",
  "Communications",
  "Utilities",
  "Consumer Durables",
  "Non-Energy Minerals",
  "Consumer Services",
  "Industrial Services",
  "Transportation",
  "Commercial Services",
  "Process Industries",
  "Health Services",
  "Distribution Services",
  "Miscellaneous",
];

async function fetchSectorStocks(sector) {
  console.log(`\n📡 Fetching ${sector}...`);
  
  const allTickers = new Set();
  let offset = 0;
  let hasMore = true;
  let page = 1;

  while (hasMore) {
    console.log(`  Page ${page}...`);
    
    const payload = {
      filter: [
        {
          left: "sector",
          operation: "equal",
          right: sector,
        },
      ],
      options: {
        lang: "en",
      },
      markets: ["america"],
      symbols: {
        query: {
          types: [],
        },
        tickers: [],
      },
      columns: [
        "name",
        "description",
        "sector",
        "industry",
      ],
      sort: {
        sortBy: "market_cap_basic",
        sortOrder: "desc",
      },
      range: [offset, offset + PAGE_SIZE],
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mozilla/5.0",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `TradingView returned ${response.status}: ${await response.text()}`
        );
      }

      const data = await response.json();
      
      if (!data.data || data.data.length === 0) {
        hasMore = false;
        break;
      }

      const tickers = data.data
        .map((row) => row.s.split(":").pop())
        .filter(Boolean);

      tickers.forEach(t => allTickers.add(t));

      // If we got fewer results than PAGE_SIZE, we've reached the end
      if (data.data.length < PAGE_SIZE) {
        hasMore = false;
      }

      offset += PAGE_SIZE;
      page++;
      
      // Be nice to the API - small delay between requests
      await new Promise(resolve => setTimeout(resolve, 500));

    } catch (error) {
      console.error(`  ❌ Error fetching ${sector}:`, error.message);
      hasMore = false;
    }
  }

  const uniqueTickers = [...allTickers].sort();
  console.log(`  ✅ Found ${uniqueTickers.length} tickers`);
  
  return uniqueTickers;
}

async function main() {
  console.log("🚀 Fetching all sectors from TradingView...");
  
  const allSectorStocks = {};
  const allTickers = new Set();

  for (const sector of SECTORS) {
    const tickers = await fetchSectorStocks(sector);
    allSectorStocks[sector] = tickers;
    tickers.forEach(t => allTickers.add(t));
  }

  // Save combined file
  await writeFile(
    "all-stocks-by-sector.json",
    JSON.stringify(allSectorStocks, null, 2) + "\n"
  );

  console.log(`\n✅ Complete!`);
  console.log(`   Total unique tickers: ${allTickers.size}`);
  console.log(`   Saved: all-stocks-by-sector.json`);
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});