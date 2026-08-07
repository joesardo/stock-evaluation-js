import { WatchlistManager } from './watchlist-manager';

const command = process.argv[2];
const ticker = process.argv[3];

if (!command) {
  console.log('Watchlist Manager\n');
  console.log('Usage:');
  console.log('  npm run watchlist:list');
  console.log('  npm run watchlist:add -- TICKER');
  console.log('  npm run watchlist:remove -- TICKER\n');
  console.log('Examples:');
  console.log('  npm run watchlist:list');
  console.log('  npm run watchlist:add -- AAPL');
  console.log('  npm run watchlist:remove -- TSLA');
  process.exit(0);
}

switch (command) {
  case 'list': {
    const tickers = WatchlistManager.getTickers();
    if (tickers.length === 0) {
      console.log('📋 Watchlist is empty');
    } else {
      console.log('📋 Your Watchlist:');
      tickers.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
    }
    break;
  }

  case 'add': {
    if (!ticker) {
      console.error('❌ Please provide a ticker symbol');
      console.error('Usage: npm run watchlist:add -- TICKER');
      process.exit(1);
    }
    const watchlist = WatchlistManager.addTicker(ticker);
    console.log(`✅ Added ${ticker.toUpperCase()} to watchlist`);
    console.log(`📊 Total tickers: ${watchlist.tickers.length}`);
    break;
  }

  case 'remove': {
    if (!ticker) {
      console.error('❌ Please provide a ticker symbol');
      console.error('Usage: npm run watchlist:remove -- TICKER');
      process.exit(1);
    }
    const watchlist = WatchlistManager.removeTicker(ticker);
    console.log(`✅ Removed ${ticker.toUpperCase()} from watchlist`);
    console.log(`📊 Total tickers: ${watchlist.tickers.length}`);
    break;
  }

  default:
    console.error(`❌ Unknown command: ${command}`);
    console.error('Valid commands: list, add, remove');
    process.exit(1);
}
