const fs = require('fs');
const all = JSON.parse(fs.readFileSync('data/guides.json', 'utf8'));

let fixed = 0;
all.forEach(g => {
  if (typeof g.relatedGuides === 'string') {
    g.relatedGuides = g.relatedGuides ? g.relatedGuides.split(' ').filter(Boolean).map(Number) : [];
    fixed++;
  }
  if (typeof g.relatedConditions === 'string') {
    g.relatedConditions = g.relatedConditions ? g.relatedConditions.split(' ').filter(Boolean) : [];
    fixed++;
  }
});

fs.writeFileSync('data/guides.json', JSON.stringify(all, null, 2));
console.log(`Fixed ${fixed} fields. Total guides: ${all.length}`);
