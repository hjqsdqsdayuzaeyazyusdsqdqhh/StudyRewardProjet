const fs = require('fs');

// Read existing guides
const existing = JSON.parse(fs.readFileSync('data/guides.json', 'utf8'));
console.log(`Existing guides: ${existing.length}`);

// Read all new batches
const batch1 = JSON.parse(fs.readFileSync('data/new-guides-batch1.json', 'utf8'));
const batch2 = JSON.parse(fs.readFileSync('data/new-guides-batch2.json', 'utf8'));
const batch3 = JSON.parse(fs.readFileSync('data/new-guides-batch3.json', 'utf8'));
const batch4 = JSON.parse(fs.readFileSync('data/new-guides-batch4.json', 'utf8'));
const batch5 = JSON.parse(fs.readFileSync('data/new-guides-batch5.json', 'utf8'));

const allNew = [...batch1, ...batch2, ...batch3, ...batch4, ...batch5];
console.log(`New guides: ${allNew.length}`);

// Verify IDs
const ids = allNew.map(g => g.id);
const min = Math.min(...ids);
const max = Math.max(...ids);
console.log(`New guide IDs range: ${min} - ${max}`);

// Merge and write
const merged = [...existing, ...allNew];
fs.writeFileSync('data/guides.json', JSON.stringify(merged, null, 2));
console.log(`Total guides after merge: ${merged.length}`);
