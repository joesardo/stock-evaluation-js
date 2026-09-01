import { writeFile } from "node:fs/promises";

const url = "https://scanner.tradingview.com/america/scan";

const PAGE_SIZE = 1000;

// TradingView sectors - we'll scan all of them to get all industries
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
  console.log(`\n📡 Fetching industries from ${sector}...`);
  
  const allStocks = [];
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

      // Extract ticker and industry info
      const stocks = data.data.map((row) => {
        const ticker = row.s.split(":").pop();
        const industry = row.d?.[3] || "Unknown"; // industry is column index 3
        return { ticker, industry };
      });

      allStocks.push(...stocks.filter(s => s.ticker));

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

  console.log(`  ✅ Found ${allStocks.length} stocks in ${sector}`);
  return allStocks;
}

async function main() {
  console.log("🚀 Fetching all industries from TradingView...");
  
  const industriesMap = new Map(); // industry name -> Set of tickers
  let totalStocks = 0;

  // Fetch all sectors and collect industry data
  for (const sector of SECTORS) {
    const stocks = await fetchSectorStocks(sector);
    
    for (const { ticker, industry } of stocks) {
      if (!industriesMap.has(industry)) {
        industriesMap.set(industry, new Set());
      }
      industriesMap.get(industry).add(ticker);
      totalStocks++;
    }
  }

  // Convert to the format we need
  const allIndustries = {};
  for (const [industry, tickers] of industriesMap) {
    allIndustries[industry] = Array.from(tickers).sort();
  }

  // Save the file
  await writeFile(
    "all-stocks-by-industry.json",
    JSON.stringify(allIndustries, null, 2) + "\n"
  );

  console.log(`\n✅ Complete!`);
  console.log(`   Total industries: ${industriesMap.size}`);
  console.log(`   Total unique tickers: ${new Set([].concat(...Array.from(industriesMap.values()).map(s => Array.from(s)))).size}`);
  console.log(`   Saved: all-stocks-by-industry.json`);
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});
