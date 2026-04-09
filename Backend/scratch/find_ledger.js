const fs = require('fs');
const response = JSON.parse(fs.readFileSync('ledgers_large.json', 'utf8'));
const data = response.data || [];
const ledger = data.find(l => l.name.toLowerCase().includes('cash') || l.name.toLowerCase().includes('online') || l.is_default);
if (ledger) {
  console.log(`FOUND: ${ledger.name} (ID: ${ledger.id})`);
} else {
  console.log('NOT FOUND');
}
const allCustomers = data.filter(l => l.model_type?.includes('Customer'));
console.log('--- ALL CUSTOMERS ---');
allCustomers.forEach(c => console.log(`${c.name} (ID: ${c.id})`));
