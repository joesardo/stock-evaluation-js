const fs = require('fs');

const data = JSON.parse(fs.readFileSync('all-stocks-by-sector.json', 'utf-8'));

let totalBefore = 0;
let totalAfter = 0;

for (const sector in data) {
  totalBefore += data[sector].length;
  data[sector] = data[sector].filter(symbol => !symbol.includes('/'));
  totalAfter += data[sector].length;
}

const removed = totalBefore - totalAfter;
fs.writeFileSync('all-stocks-by-sector.json', JSON.stringify(data, null, 2) + '\n');

console.log(`✅ Cleaned invalid symbols`);
console.log(`   Removed: ${removed} symbols with slashes`);
console.log(`   Remaining: ${totalAfter} valid symbols`);
